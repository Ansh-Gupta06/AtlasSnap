import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

// Attach token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Get all locations
export const getLocations = () => api.get('/locations').then(res => res.data);

// Search locations by name
export const searchLocations = (name) =>
    api.get(`/locations/search?name=${encodeURIComponent(name)}`).then(res => res.data);

// Get a single location by ID
export const getLocation = (id) => api.get(`/locations/${id}`).then(res => res.data);

// Create a new location
export const createLocation = (data) =>
    api.post('/locations', data).then(res => res.data);

// Upload media to a location
export const uploadMedia = (locationId, formData) =>
    api.post(`/locations/${locationId}/media`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);

// Edit a media item's caption
export const editMedia = (locationId, mediaId, data) =>
    api.put(`/locations/${locationId}/media/${mediaId}`, data).then(res => res.data);

// Delete a media item
export const deleteMedia = (locationId, mediaId) =>
    api.delete(`/locations/${locationId}/media/${mediaId}`).then(res => res.data);

// Delete a location
export const deleteLocation = (id) =>
    api.delete(`/locations/${id}`).then(res => res.data);

// Get timeline (all media sorted by date)
export const getTimeline = () =>
    api.get('/locations/timeline').then(res => res.data);

export default api;
