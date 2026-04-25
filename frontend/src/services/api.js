import axios from 'axios';

const api = axios.create({ baseURL: (import.meta.env.VITE_API_URL || '') + '/api', timeout: 10000 });

api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('dp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      sessionStorage.removeItem('dp_token');
      sessionStorage.removeItem('dp_usuario');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;