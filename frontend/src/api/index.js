import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const interpretReferral = (text) =>
  api.post('/intake/interpret', { text }).then((r) => r.data);

export const searchClinics = (params) =>
  api.post('/search', params).then((r) => r.data);

export const logSelect = (search_id, clinic_id) =>
  api.get(`/search/${search_id}/select`, { params: { clinic_id } });

export const joinWaitlist = (data) =>
  api.post('/waitlist/join', data).then((r) => r.data);

export const getClinicDashboard = (clinic_id) =>
  api.get(`/clinic/${clinic_id}/dashboard`).then((r) => r.data);

export const updateAvailability = (clinic_id, ao_id, data) =>
  api.put(`/clinic/${clinic_id}/availability/${ao_id}`, data).then((r) => r.data);

export const submitFreshnessUpdate = (token, data) =>
  api.post(`/freshness/update/${token}`, data).then((r) => r.data);
