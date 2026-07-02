const { createEmbeddingsService } = require('./embeddings');
const { createVectorStore } = require('./vectorStore');
const { createRetrievalService } = require('./retrieval');
const { createKnowledgeSources } = require('./sources');
const { createContextAssembly } = require('./assembly');

function createKnowledgeEngine(env, repositories) {
  const embeddingsService = createEmbeddingsService(env);
  const vectorStore = createVectorStore(env);
  const retrievalService = createRetrievalService(embeddingsService, vectorStore);
  const knowledgeSources = createKnowledgeSources(env, repositories, embeddingsService, vectorStore);
  const contextAssembly = createContextAssembly(embeddingsService, retrievalService);

  async function search(query, options = {}) {
    return retrievalService.retrieve(query, options);
  }

  async function indexAll(knowledgeDir) {
    const results = {
      places: null,
      reviews: null,
      cityInfo: null,
      countryInfo: null,
      markdown: null,
    };

    results.cityInfo = await knowledgeSources.indexCityInfo(DEFAULT_CITIES);
    results.countryInfo = await knowledgeSources.indexCountryInfo(DEFAULT_COUNTRIES);
    results.markdown = await knowledgeSources.indexMarkdownFiles(knowledgeDir);

    if (repositories?.places) {
      results.places = await knowledgeSources.indexAllPlaces();
    }

    if (repositories?.reviews) {
      results.reviews = await knowledgeSources.indexApprovedReviews();
    }

    return results;
  }

  async function retrieveAndAssemble(query, contextData, options = {}) {
    return contextAssembly.assemble(query, contextData, options);
  }

  async function retrieveAndFormat(query, contextData, options = {}) {
    return contextAssembly.assembleForPrompt(query, contextData, options);
  }

  function getMetrics(assembly) {
    return contextAssembly.getRetrievalMetrics(assembly);
  }

  return {
    embeddings: embeddingsService,
    vectorStore,
    retrieval: retrievalService,
    sources: knowledgeSources,
    assembly: contextAssembly,
    search,
    indexAll,
    retrieveAndAssemble,
    retrieveAndFormat,
    getMetrics,
  };
}

const DEFAULT_CITIES = [
  {
    name: 'Budapest',
    country: 'Hungary',
    population: '1.7 million',
    region: 'Central Hungary',
    description: 'Budapest is the capital and largest city of Hungary, divided by the Danube River into Buda and Pest. It is known for its stunning architecture, thermal baths, rich history, and vibrant cultural scene.',
    transport: 'Budapest has an extensive public transportation system including metro lines (M1, M2, M3, M4), trams, buses, trolleybuses, and suburban railways (HÉV). BKK operates the system. Monthly passes are affordable.',
    costOfLiving: 'Budapest is one of the most affordable capital cities in Europe. Rent for a 1-bedroom apartment in the city center ranges from 250,000-400,000 HUF. Dining out costs 3,000-8,000 HUF per person.',
    facts: 'Budapest has 118 districts (kerületek). The most popular for expats are District V (Belváros), District VI (Terézváros), District VII (Erzsébetváros), and District XIII (Angyalföld). The city has over 80 geothermal springs.',
  },
  {
    name: 'Debrecen',
    country: 'Hungary',
    population: '200,000',
    region: 'Northern Great Plain',
    description: 'Debrecen is Hungary\'s second-largest city and the cultural center of the Great Plain region. It is known for its university, the Great Reformed Church, and the annual Flower Carnival.',
    transport: 'Debrecen has a reliable tram and bus network operated by DKV. The city also has an international airport with flights to several European destinations.',
    costOfLiving: 'Debrecen is more affordable than Budapest. Rent for a 1-bedroom apartment ranges from 150,000-250,000 HUF. It is a popular choice for those working in the growing IT and manufacturing sectors.',
    facts: 'Debrecen is home to the University of Debrecen, one of Hungary\'s largest universities with a significant international student population. The city is also a major healthcare hub with the Kenézy Gyula Hospital.',
  },
  {
    name: 'Szeged',
    country: 'Hungary',
    population: '160,000',
    region: 'Southern Great Plain',
    description: 'Szeged is a sunny university city in southern Hungary, known for its beautiful Art Nouveau architecture, the Tisza River, and its famous paprika. It is often called the "City of Sunshine."',
    transport: 'Szeged has an efficient tram and bus network. The city is well-connected by rail to Budapest and other major cities.',
    costOfLiving: 'Szeged is very affordable. Student-friendly prices make it popular with international students at the University of Szeged.',
    facts: 'Szeged is famous for its Open Air Festival (Szegedi Szabadtéri Játékok) and its pickled fish soup (halászlé). The University of Szeged is one of the top universities in Hungary.',
  },
  {
    name: 'Pécs',
    country: 'Hungary',
    population: '140,000',
    region: 'Southern Transdanubia',
    description: 'Pécs is a charming city in southern Hungary near the Croatian border, known for its Roman-era ruins, Zsolnay porcelain, and UNESCO World Heritage sites.',
    transport: 'Pécs has a bus network and is connected to Budapest by rail (approx. 2.5 hours). The city also has a small airport.',
    costOfLiving: 'Pécs is very affordable, especially compared to Budapest. It is popular with retirees and university students.',
    facts: 'Pécs was the European Capital of Culture in 2010. It is home to the University of Pécs, one of the oldest universities in Europe (founded 1367). The city has a significant German minority.',
  },
  {
    name: 'Győr',
    country: 'Hungary',
    population: '130,000',
    region: 'Western Transdanubia',
    description: 'Győr is an industrial city in northwestern Hungary, located between Budapest and Vienna. It is known for its baroque architecture, Audi factory, and thermal baths.',
    transport: 'Győr has excellent rail connections to Budapest (1 hour) and Vienna (1.5 hours). The M1 motorway connects it to both capitals.',
    costOfLiving: 'Győr has reasonable living costs due to its industrial base. Many workers commute from surrounding villages.',
    facts: 'Győr is a major automotive hub with Audi\'s largest engine manufacturing plant. The city\'s historic center is one of the most beautiful baroque ensembles in Hungary.',
  },
];

const DEFAULT_COUNTRIES = [
  {
    name: 'Hungary',
    code: 'HU',
    capital: 'Budapest',
    language: 'Hungarian (Magyar)',
    currency: 'Hungarian Forint (HUF)',
    timezone: 'CET (UTC+1) / CEST (UTC+2)',
    description: 'Hungary is a landlocked country in Central Europe, bordered by Austria, Slovakia, Ukraine, Romania, Serbia, Croatia, and Slovenia. It is a member of the EU, NATO, and the Schengen Area.',
    facts: 'Hungary joined the EU in 2004 but does not use the Euro. The country is a parliamentary republic. The population is about 9.6 million. The official language is Hungarian, a Uralic language unrelated to most European languages.',
  },
];

module.exports = { createKnowledgeEngine };
