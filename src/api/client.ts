import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { API_BASE_URL } from '../constants/Config';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for adding the bearer token
apiClient.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized across the app
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);

export const api = {
    // Auth
    login: (data: any) => apiClient.post('/auth/login', data),
    getMe: () => apiClient.get('/auth/me'),

    // User / Profile
    updateProfile: (data: any) => apiClient.put('/users/profile', data),

    // Employees
    getEmployee: (empNo: string) => apiClient.get(`/employees/${empNo}`),
};

export default apiClient;
