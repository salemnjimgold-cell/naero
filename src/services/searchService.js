import { placeService } from './placeService';
import { jobService } from './jobService';
import { housingService } from './housingService';
import { communityService } from './communityService';

class SearchService {
  async globalSearch(query, options = {}) {
    const q = query.trim();
    if (!q) return { data: [], error: null };

    const { city, category, limit = 20 } = options;

    const [places, jobs, housing, community] = await Promise.all([
      placeService.searchPlaces(q, city, category),
      jobService.searchJobs(q, city),
      housingService.searchHousing(q, city),
      communityService.searchPosts(q, city),
    ]);

    return {
      data: {
        places: places.data || [],
        jobs: jobs.data || [],
        housing: housing.data || [],
        community: community.data || [],
      },
      error: null,
    };
  }

  async searchByDomain(domain, query, options = {}) {
    switch (domain) {
      case 'places': return placeService.searchPlaces(query, options.city, options.category);
      case 'jobs': return jobService.searchJobs(query, options.city, options.type);
      case 'housing': return housingService.searchHousing(query, options.city);
      case 'community': return communityService.searchPosts(query, options.city);
      default: return { data: [], error: 'Unknown domain' };
    }
  }
}

export const searchService = new SearchService();
