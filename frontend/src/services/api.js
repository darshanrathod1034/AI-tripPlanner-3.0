import axios from 'axios';

const normalizeBaseUrl = (url) => {
  if (!url) return url;
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

export const BACKEND_URL = normalizeBaseUrl(
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:5555'
);

export const api = axios.create({
  baseURL: BACKEND_URL,
});

export default api;
