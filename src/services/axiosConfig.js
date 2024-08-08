import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://localhost:8080/api',
});

// Interceptor para incluir el token JWT en cada solicitud
instance.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;