import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { syncQueue } from './syncQueue';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 7000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
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

// Response interceptor to handle 401s and queue offline mutations
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    // Detect offline / network failure / timeout for mutations (POST, PATCH, DELETE, PUT)
    const isNetworkError =
      !error.response ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      error.message?.includes('timeout') ||
      (typeof navigator !== 'undefined' && !navigator.onLine);
    const isModifyingMethod =
      originalRequest &&
      ['post', 'patch', 'delete', 'put'].includes(
        originalRequest.method?.toLowerCase()
      );

    if (isNetworkError && isModifyingMethod && !originalRequest.headers?.['X-Offline-Synced']) {
      try {
        await syncQueue.enqueue({
          url: originalRequest.url || '',
          method: originalRequest.method.toUpperCase() as any,
          data: originalRequest.data ? JSON.parse(typeof originalRequest.data === 'string' ? originalRequest.data : JSON.stringify(originalRequest.data)) : undefined,
        });

        // Return an optimistic mock response so UI does not crash
        return Promise.resolve({
          data: originalRequest.data || { success: true, offline: true },
          status: 200,
          statusText: 'Offline Queued',
          headers: {},
          config: originalRequest,
        });
      } catch (queueErr) {
        console.error('Failed to queue offline mutation', queueErr);
      }
    }

    return Promise.reject(error);
  }
);

