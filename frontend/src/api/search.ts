import { apiClient } from './client';
import { SearchResponse } from '../types/search';

export const searchApi = {
  search: async (q: string, limit = 5): Promise<SearchResponse> => {
    const response = await apiClient.get<SearchResponse>('/search', {
      params: { q, limit },
    });
    return response.data;
  },
};
