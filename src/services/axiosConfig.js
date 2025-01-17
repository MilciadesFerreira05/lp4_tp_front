import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:8080/api',
});


instance.interceptors.request.use(config => {
  const user  = JSON.parse(localStorage.getItem('user'));
  const token = user?.token;
  console.log(token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
