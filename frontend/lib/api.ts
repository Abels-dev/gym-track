import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { syncQueue } from './syncQueue';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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

// Response interceptor to handle 401s and queue workout mutations when offline or network drops
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized -> Clear auth state
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    // NEVER queue auth, profile, or query requests into offline sync queue
    const isAuthOrConfigEndpoint =
      originalRequest?.url?.includes('/auth/') ||
      originalRequest?.url?.includes('/exercises') ||
      originalRequest?.url?.includes('/profile');

    if (isAuthOrConfigEndpoint) {
      return Promise.reject(error);
    }

    // Check if offline or network connection dropped
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    const isNetworkError =
      !error.response ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ERR_NETWORK' ||
      error.message === 'Network Error';

    const isWorkoutMutation =
      originalRequest?.url?.includes('/workouts') &&
      ['post', 'patch', 'delete', 'put'].includes(
        originalRequest?.method?.toLowerCase() || ''
      );

    if ((isOffline || isNetworkError) && isWorkoutMutation && !originalRequest.headers?.['X-Offline-Synced']) {
      try {
        await syncQueue.enqueue({
          url: originalRequest.url || '',
          method: originalRequest.method.toUpperCase() as any,
          data: originalRequest.data
            ? (typeof originalRequest.data === 'string'
                ? JSON.parse(originalRequest.data)
                : originalRequest.data)
            : undefined,
        });

        return Promise.resolve({
          data: originalRequest.data || { success: true, offline: true },
          status: 200,
          statusText: 'Offline Queued',
          headers: {},
          config: originalRequest,
        });
      } catch (queueErr) {
        console.error('Failed to queue offline workout update', queueErr);
      }
    }

    return Promise.reject(error);
  }
);
