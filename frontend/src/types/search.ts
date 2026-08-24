export interface SearchItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'employee' | 'department' | 'project' | 'task';
  url: string;
}

export interface SearchResultsCategory {
  employees: SearchItem[];
  departments: SearchItem[];
  projects: SearchItem[];
  tasks: SearchItem[];
}

export interface SearchResponse {
  query: string;
  results: SearchResultsCategory;
  total: number;
}
