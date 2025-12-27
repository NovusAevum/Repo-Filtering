import { Repository, SearchFilters, SearchProgress } from '../types/interfaces';

import { getApiBaseUrl } from '../config/runtime';
const API_BASE_URL = getApiBaseUrl();

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface SearchResponse {
  search_id: string;
  status: string;
  message: string;
}

export interface SearchStatusResponse {
  search_id: string;
  status: string;
  progress: number;
  current_step: string;
  total_steps: number;
  completed_steps: number;
  processed_count: number;
  total_count: number;
  results: Repository[];
  error?: string;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    timeoutMs = 10000,
    retries = 1
  ): Promise<ApiResponse<T>> {
    let lastError: string | undefined;
    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
          },
          signal: controller.signal,
          ...options,
        });
        clearTimeout(timeout);

        const contentType = response.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await response.json() : await response.text();

        if (!response.ok) {
          lastError = typeof data === 'object' && data && 'error' in (data as any) ? (data as any).error : `HTTP ${response.status}`;
          // Retry only on 5xx or networkish status
          if (response.status >= 500 && response.status < 600 && attempt < retries) continue;
          return { error: lastError, status: response.status };
        }

        return { data: data as T, status: response.status };
      } catch (err) {
        clearTimeout(timeout);
        lastError = err instanceof Error ? err.name === 'AbortError' ? 'Request timeout' : err.message : 'Network error';
        if (attempt < retries) continue;
        return { error: lastError, status: 0 };
      }
    }
    return { error: lastError || 'Unknown error', status: 0 };
  }

  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string; version: string }>> {
    return this.request('/health', {}, 4000, 2);
  }

  async getConfig(): Promise<ApiResponse<{ serpapi_configured: boolean; github_configured: boolean; database_initialized: boolean }>> {
    return this.request('/config');
  }

  async getRepositories(
    page: number = 1,
    perPage: number = 20,
    sort: string = '-score',
    query: string = ''
  ): Promise<ApiResponse<PaginatedResponse<Repository>>> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      sort,
      ...(query && { query }),
    });

    return this.request(`/repositories?${params}`);
  }

  async getDashboardStats(): Promise<ApiResponse<any>> {
    return this.request('/dashboard-stats');
  }

  async startSearch(filters: SearchFilters): Promise<ApiResponse<SearchResponse>> {
    return this.request('/search', {
      method: 'POST',
      body: JSON.stringify({
        searchType: filters.searchType,
        query: filters.query,
        filters: {
          minStars: filters.minStars,
          language: filters.language !== 'All Languages' ? filters.language : undefined,
          licenseType: filters.licenseType !== 'All Licenses' ? filters.licenseType : undefined,
          category: filters.category,
          minScore: filters.scoreRange[0],
          maxScore: filters.scoreRange[1],
        },
      }),
    });
  }

  async getSearchStatus(searchId: string): Promise<ApiResponse<SearchStatusResponse>> {
    return this.request(`/search/${searchId}/status`);
  }

  async cancelSearch(searchId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/search/${searchId}/cancel`, {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService();