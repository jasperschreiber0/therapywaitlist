import axios from 'axios';

const adminApi = axios.create({ baseURL: '/api/admin' });

adminApi.interceptors.request.use((config) => {
  const key = localStorage.getItem('admin_key');
  if (key) config.headers['Authorization'] = `Bearer ${key}`;
  return config;
});

adminApi.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_key');
      window.location.href = '/admin/login';
    }
    return Promise.reject(err);
  }
);

export const getClinics = () => adminApi.get('/clinics').then((r) => r.data);
export const getClinic = (id) => adminApi.get(`/clinics/${id}`).then((r) => r.data);
export const createClinic = (data) => adminApi.post('/clinics', data).then((r) => r.data);
export const getAvailability = () => adminApi.get('/availability').then((r) => r.data);
export const updateAvailability = (id, data) => adminApi.patch(`/availability/${id}`, data).then((r) => r.data);
export const getAnalytics = () => adminApi.get('/analytics').then((r) => r.data);
export const getFreshness = () => adminApi.get('/freshness').then((r) => r.data);
export const resendPrompt = (id) => adminApi.post(`/freshness/${id}/resend`).then((r) => r.data);
