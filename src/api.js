import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const getLocations = () => api.get('/locations').then(res => res.data);

export const searchLocations = (name) =>
    api.get(`/locations/search?name=${encodeURIComponent(name)}`).then(res => res.data);

export const getLocation = (id) => api.get(`/locations/${id}`).then(res => res.data);

export const createLocation = (data) =>
    api.post('/locations', data).then(res => res.data);

export const saveMediaUrl = (locationId, url, type, caption) =>
    api.post(`/locations/${locationId}/media`, { url, type, caption }).then(res => res.data);

export const editMedia = (locationId, mediaId, data) =>
    api.put(`/locations/${locationId}/media/${mediaId}`, data).then(res => res.data);

export const deleteMedia = (locationId, mediaId) =>
    api.delete(`/locations/${locationId}/media/${mediaId}`).then(res => res.data);

export const deleteLocation = (id) =>
    api.delete(`/locations/${id}`).then(res => res.data);

export const getTimeline = () =>
    api.get('/locations/timeline').then(res => res.data);

export default api;
