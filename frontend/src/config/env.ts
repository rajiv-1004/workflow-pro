const getApiBaseUrl = (): string => {
  const rawUrl =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8000/api/v1';

  const trimmed = rawUrl.trim().replace(/\/+$/, '');
  if (trimmed.endsWith('/api/v1')) {
    return trimmed;
  }
  return `${trimmed}/api/v1`;
};

const getApiRootUrl = (): string => {
  return getApiBaseUrl().replace(/\/api\/v1\/?$/, '');
};

export const env = {
  API_URL: getApiRootUrl(),
  API_BASE_URL: getApiBaseUrl(),
};

