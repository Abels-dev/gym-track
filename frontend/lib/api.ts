import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { syncQueue } from './syncQueue';

const API_URL = "https://gym-track-api-gmczheendfbzddg5.italynorth-01.azurewebsites.net/";

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

// Response interceptor to handle 401s and only queue workout set logs when explicitly offline
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

    // Only queue workouts/exercises set updates if strictly offline
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    const isWorkoutMutation =
      originalRequest?.url?.includes('/workouts') &&
      ['post', 'patch', 'delete', 'put'].includes(
        originalRequest?.method?.toLowerCase() || ''
      );

    if (isOffline && isWorkoutMutation && !originalRequest.headers?.['X-Offline-Synced']) {
      try {
        await syncQueue.enqueue({
          url: originalRequest.url || '',
          method: originalRequest.method.toUpperCase() as any,
          data: originalRequest.data ? JSON.parse(typeof originalRequest.data === 'string' ? originalRequest.data : JSON.stringify(originalRequest.data)) : undefined,
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

