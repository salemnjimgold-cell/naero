const path = require('path');
const { readEnv } = require('../src/config/env');
const { createRepositories } = require('../src/services/repositories/index');
const { createKnowledgeEngine } = require('../src/services/ai/knowledge/index');

const env = readEnv();
const repositories = createRepositories(env);
const knowledgeEngine = createKnowledgeEngine(env, repositories);

const KNOWLEDGE_DIR = path.resolve(__dirname, '..', 'knowledge');
const DRY_RUN = process.argv.includes('--dry-run');
const SOURCE_TYPES = (process.argv.find(a => a.startsWith('--source=')) || '').split('=')[1];

async function main() {
  console.log('=== Naero Knowledge Base Seeder ===\n');
  console.log(`Knowledge directory: ${KNOWLEDGE_DIR}`);
  console.log(`Embedding provider: ${knowledgeEngine.embeddings.provider}`);
  console.log(`Dimension: ${knowledgeEngine.embeddings.dimension}`);
  console.log(`Configured: ${knowledgeEngine.embeddings.configured}`);
  console.log(`Dry run: ${DRY_RUN}\n`);

  if (!knowledgeEngine.embeddings.configured) {
    console.log('WARNING: No embedding provider configured. Set OPENAI_API_KEY or GEMINI_API_KEY.');
  }

  if (DRY_RUN) {
    console.log('DRY RUN: No data will be written.\n');
  }

  const sourceFilter = SOURCE_TYPES || 'all';
  const results = {};

  if (sourceFilter === 'all' || sourceFilter === 'city_info') {
    console.log('Indexing city information...');
    const { createKnowledgeSources } = require('../src/services/ai/knowledge/sources');
    const sources = createKnowledgeSources(env, repositories, knowledgeEngine.embeddings, knowledgeEngine.vectorStore);
    const cityResult = DRY_RUN
      ? { data: { indexed: 0, total: 5 } }
      : await sources.indexCityInfo([
          { name: 'Budapest', country: 'Hungary', population: '1.7 million', region: 'Central Hungary',
            description: 'Budapest is the capital and largest city of Hungary, divided by the Danube River into Buda and Pest.',
            transport: 'Extensive public transport: metro, trams, buses. BKK operates the system.', costOfLiving: 'Affordable compared to Western Europe.',
            facts: '118 districts. Popular expat areas: V, VI, VII, XIII. 80+ geothermal springs.' },
          { name: 'Debrecen', country: 'Hungary', population: '200,000', region: 'Northern Great Plain',
            description: 'Second-largest city, cultural center of the Great Plain.', transport: 'Tram and bus network, international airport.',
            costOfLiving: 'More affordable than Budapest.', facts: 'University of Debrecen. Major healthcare hub.' },
          { name: 'Szeged', country: 'Hungary', population: '160,000', region: 'Southern Great Plain',
            description: 'Sunny university city, known for Art Nouveau architecture and paprika.', transport: 'Tram and bus network, good rail connections.',
            costOfLiving: 'Very affordable, student-friendly.', facts: 'Open Air Festival. University of Szeged.' },
          { name: 'Pécs', country: 'Hungary', population: '140,000', region: 'Southern Transdanubia',
            description: 'Charming city near Croatian border, known for Roman ruins and Zsolnay porcelain.', transport: 'Bus network, rail to Budapest (2.5h).',
            costOfLiving: 'Very affordable.', facts: 'European Capital of Culture 2010. University of Pécs (est. 1367).' },
          { name: 'Győr', country: 'Hungary', population: '130,000', region: 'Western Transdanubia',
            description: 'Industrial city between Budapest and Vienna. Baroque architecture.', transport: 'Excellent rail to Budapest (1h) and Vienna (1.5h).',
            costOfLiving: 'Reasonable.', facts: 'Audi engine plant. Beautiful baroque center.' },
        ]);
    results.cityInfo = cityResult;
    console.log(`  → ${cityResult.data.indexed}/${cityResult.data.total} indexed\n`);
  }

  if (sourceFilter === 'all' || sourceFilter === 'country_info') {
    console.log('Indexing country information...');
    const { createKnowledgeSources } = require('../src/services/ai/knowledge/sources');
    const sources = createKnowledgeSources(env, repositories, knowledgeEngine.embeddings, knowledgeEngine.vectorStore);
    const countryResult = DRY_RUN
      ? { data: { indexed: 0, total: 1 } }
      : await sources.indexCountryInfo([
          { name: 'Hungary', code: 'HU', capital: 'Budapest', language: 'Hungarian (Magyar)', currency: 'Hungarian Forint (HUF)',
            timezone: 'CET (UTC+1) / CEST (UTC+2)',
            description: 'Landlocked country in Central Europe. EU, NATO, and Schengen member since 2004.',
            facts: 'Population: 9.6 million. Hungarian is a Uralic language unrelated to most European languages.' },
        ]);
    results.countryInfo = countryResult;
    console.log(`  → ${countryResult.data.indexed}/${countryResult.data.total} indexed\n`);
  }

  if (sourceFilter === 'all' || sourceFilter === 'knowledge_md') {
    console.log(`Indexing markdown knowledge files from ${KNOWLEDGE_DIR}...`);
    const mdResult = DRY_RUN
      ? { data: { indexed: 0, total: 0 } }
      : await knowledgeEngine.sources.indexMarkdownFiles(KNOWLEDGE_DIR);
    results.markdown = mdResult;
    const count = mdResult.data ? mdResult.data.indexed : 0;
    const total = mdResult.data ? mdResult.data.total : 0;
    console.log(`  → ${count}/${total} chunks indexed\n`);
  }

  if (sourceFilter === 'all' || sourceFilter === 'places') {
    if (repositories.places) {
      console.log('Indexing places from database...');
      const placesResult = DRY_RUN
        ? { data: { indexed: 0 } }
        : await knowledgeEngine.sources.indexAllPlaces();
      results.places = placesResult;
      console.log(`  → ${placesResult.data?.indexed || 0} places indexed\n`);
    }
  }

  if (sourceFilter === 'all' || sourceFilter === 'reviews') {
    if (repositories.reviews) {
      console.log('Indexing approved reviews from database...');
      const reviewsResult = DRY_RUN
        ? { data: { indexed: 0 } }
        : await knowledgeEngine.sources.indexApprovedReviews();
      results.reviews = reviewsResult;
      console.log(`  → ${reviewsResult.data?.indexed || 0} reviews indexed\n`);
    }
  }

  console.log('=== Summary ===');
  for (const [key, result] of Object.entries(results)) {
    const count = result?.data?.indexed ?? 0;
    console.log(`  ${key}: ${count} entries indexed`);
  }

  const totalIndexed = Object.values(results).reduce((sum, r) => sum + (r?.data?.indexed || 0), 0);
  console.log(`\nTotal: ${totalIndexed} vectors stored`);
  console.log('Done.');
}

main().catch((err) => {
  console.error('Seed fatal error:', err);
  process.exit(1);
});
