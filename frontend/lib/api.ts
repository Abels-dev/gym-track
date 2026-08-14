import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Assuming backend runs on 3001 locally, or falls back to an env variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    // Read the token directly from Zustand state
    const token = useAuthStore.getState().accessToken;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle global errors (e.g., 401 Unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If token is expired or invalid, log the user out
      useAuthStore.getState().logout();
      // We could also trigger a redirect here if needed, but AuthGuard usually handles it
    }
    return Promise.reject(error);
  }
);
