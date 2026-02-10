import axios from 'axios';

const getBaseUrl = () => {
    let url = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'development' ? 'http://localhost:3000' : '');

    // Normalize: Remove trailing slash
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }

    // If empty (prod fallback failure), default relative
    if (!url) return '/api';

    // Append /api if not present
    if (!url.endsWith('/api')) {
        url += '/api';
    }

    return url;
};

const api = axios.create({
    baseURL: getBaseUrl(),
    withCredentials: true
});

// Add a request interceptor to include the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add a response interceptor to handle 401 errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Dispatch a custom event so the UI (AuthContext) can react
            window.dispatchEvent(new Event('auth:logout'));
        }
        return Promise.reject(error);
    }
);

export default api;
