export interface APIErrorDetail {
  loc?: (string | number)[];
  msg?: string;
  type?: string;
}

export interface APIErrorResponse {
  error?: {
    message?: string;
    type?: string;
    errors?: APIErrorDetail[];
  };
  detail?: string | APIErrorDetail[];
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  pages: number;
}
