function createKnowledgeSources(env, repositories, embeddingsService, vectorStore) {
  const fs = require('fs');
  const path = require('path');

  const SOURCE_TYPES = {
    PLACE: 'place',
    REVIEW: 'review',
    CITY_INFO: 'city_info',
    COUNTRY_INFO: 'country_info',
    KNOWLEDGE_MD: 'knowledge_md',
  };

  async function indexAllPlaces() {
    const result = await repositories.places.list({ limit: 1000 });
    if (result.error) return { data: null, error: result.error };

    const places = result.data || [];
    const entries = [];

    for (const place of places) {
      const content = buildPlaceContent(place);
      entries.push({
        source_type: SOURCE_TYPES.PLACE,
        source_id: place.id,
        content,
        metadata: {
          name: place.name,
          category: place.category,
          city: place.city,
          country: place.country,
          tags: place.tags || [],
          verified: place.verified,
        },
        token_count: embeddingsService.estimateTokens(content),
      });
    }

    return indexEntries(entries);
  }

  async function indexApprovedReviews() {
    const result = await repositories.reviews.list({ moderationStatus: 'approved', limit: 1000 });
    if (result.error) return { data: null, error: result.error };

    const reviews = result.data || [];
    const entries = [];

    for (const review of reviews) {
      const content = buildReviewContent(review);
      entries.push({
        source_type: SOURCE_TYPES.REVIEW,
        source_id: review.id,
        content,
        metadata: {
          placeId: review.place_id,
          rating: review.rating,
          language: review.language,
          moderationStatus: review.moderation_status,
        },
        token_count: embeddingsService.estimateTokens(content),
      });
    }

    return indexEntries(entries);
  }

  async function indexCityInfo(cityData) {
    const entries = [];

    for (const city of cityData) {
      const content = buildCityContent(city);
      entries.push({
        source_type: SOURCE_TYPES.CITY_INFO,
        source_id: `city_${city.name.toLowerCase()}`,
        content,
        metadata: {
          name: city.name,
          country: city.country || 'Hungary',
          population: city.population,
          region: city.region,
        },
        token_count: embeddingsService.estimateTokens(content),
      });
    }

    return indexEntries(entries);
  }

  async function indexCountryInfo(countryData) {
    const entries = [];

    for (const country of countryData) {
      const content = buildCountryContent(country);
      entries.push({
        source_type: SOURCE_TYPES.COUNTRY_INFO,
        source_id: `country_${country.code.toLowerCase()}`,
        content,
        metadata: {
          name: country.name,
          code: country.code,
          capital: country.capital,
        },
        token_count: embeddingsService.estimateTokens(content),
      });
    }

    return indexEntries(entries);
  }

  async function indexMarkdownFiles(knowledgeDir) {
    const entries = [];
    const files = discoverMarkdownFiles(knowledgeDir);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const chunks = embeddingsService.chunkText(content, 800);
      const relativePath = path.relative(knowledgeDir, file).replace(/\\/g, '/');

      for (let i = 0; i < chunks.length; i++) {
        entries.push({
          source_type: SOURCE_TYPES.KNOWLEDGE_MD,
          source_id: `${relativePath}#chunk${i}`,
          content: chunks[i],
          metadata: {
            file: relativePath,
            chunk: i,
            totalChunks: chunks.length,
            topic: inferTopic(relativePath),
          },
          token_count: embeddingsService.estimateTokens(chunks[i]),
        });
      }
    }

    return indexEntries(entries);
  }

  async function indexEntries(entries) {
    if (entries.length === 0) {
      return { data: { indexed: 0 }, error: null };
    }

    const batchSize = 20;
    let indexed = 0;

    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      const texts = batch.map(e => e.content);

      const embedResult = await embeddingsService.embedBatch(texts);
      if (embedResult.error) {
        console.error(`Embedding batch failed at offset ${i}:`, embedResult.error.message);
        continue;
      }

      const records = batch.map((entry, idx) => ({
        ...entry,
        embedding: embedResult.data.vectors[idx],
      }));

      const storeResult = await vectorStore.insert(records);
      if (storeResult.error) {
        console.error(`Vector store insert failed at offset ${i}:`, storeResult.error.message);
        continue;
      }

      indexed += batch.length;
    }

    return { data: { indexed, total: entries.length }, error: null };
  }

  function buildPlaceContent(place) {
    const parts = [`${place.name}`];
    if (place.description) parts.push(place.description);
    parts.push(`Category: ${place.category}${place.subcategory ? `, ${place.subcategory}` : ''}`);
    parts.push(`Location: ${place.city}, ${place.country}`);
    if (place.address) parts.push(`Address: ${place.address}`);
    if (place.tags && place.tags.length > 0) parts.push(`Tags: ${place.tags.join(', ')}`);
    if (place.phone) parts.push(`Phone: ${place.phone}`);
    if (place.website) parts.push(`Website: ${place.website}`);
    return parts.join('. ');
  }

  function buildReviewContent(review) {
    const parts = [`Rating: ${review.rating}/5`];
    if (review.title) parts.push(review.title);
    if (review.content) parts.push(review.content);
    return parts.join('. ');
  }

  function buildCityContent(city) {
    const parts = [`${city.name}`];
    if (city.description) parts.push(city.description);
    parts.push(`Country: ${city.country || 'Hungary'}`);
    if (city.population) parts.push(`Population: ${city.population}`);
    if (city.region) parts.push(`Region: ${city.region}`);
    if (city.facts) parts.push(city.facts);
    if (city.transport) parts.push(`Transport: ${city.transport}`);
    if (city.costOfLiving) parts.push(`Cost of living: ${city.costOfLiving}`);
    return parts.join('. ');
  }

  function buildCountryContent(country) {
    const parts = [`${country.name} (${country.code})`];
    if (country.description) parts.push(country.description);
    if (country.capital) parts.push(`Capital: ${country.capital}`);
    if (country.language) parts.push(`Official language: ${country.language}`);
    if (country.currency) parts.push(`Currency: ${country.currency}`);
    if (country.timezone) parts.push(`Timezone: ${country.timezone}`);
    if (country.facts) parts.push(country.facts);
    return parts.join('. ');
  }

  function discoverMarkdownFiles(dir) {
    const results = [];
    if (!fs.existsSync(dir)) return results;

    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        results.push(...discoverMarkdownFiles(fullPath));
      } else if (item.name.endsWith('.md')) {
        results.push(fullPath);
      }
    }
    return results;
  }

  function inferTopic(filePath) {
    const name = path.basename(filePath, '.md').toLowerCase();
    const topics = {
      immigration: 'immigration',
      visa: 'immigration',
      residency: 'immigration',
      housing: 'housing',
      rental: 'housing',
      jobs: 'jobs',
      employment: 'jobs',
      healthcare: 'healthcare',
      health: 'healthcare',
      translation: 'translation',
      language: 'translation',
      guide: 'local_guide',
      culture: 'local_guide',
      transport: 'local_guide',
      emergency: 'emergency',
      safety: 'emergency',
      city: 'local_guide',
      budapest: 'local_guide',
    };
    for (const [keyword, topic] of Object.entries(topics)) {
      if (name.includes(keyword)) return topic;
    }
    return 'general';
  }

  return {
    SOURCE_TYPES,
    indexAllPlaces,
    indexApprovedReviews,
    indexCityInfo,
    indexCountryInfo,
    indexMarkdownFiles,
    indexEntries,
  };
}

module.exports = { createKnowledgeSources };
