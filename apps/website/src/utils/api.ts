import axios, { AxiosError } from 'axios';
import { AUTH_ENDPOINTS, buildAuthClientHeaders, buildRefreshTokenPayload } from '@fhwh/shared/utils/auth';
import {
  clearSharedAuth,
  readSharedRefreshToken,
  readSharedToken,
  readSharedUser,
  writeSharedAuth,
} from './authStorage';

function resolveApiBaseUrl() {
  const envUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

  if (typeof window === 'undefined') {
    return envUrl || 'http://127.0.0.1:3000';
  }

  return window.location.origin;
}

const API_BASE_URL = resolveApiBaseUrl();

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface RequestConfig {
  skipAuth?: boolean;
}

export function createApiClient() {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthClientHeaders({
        clientType: 'web',
        appId: 'fenghuang-website',
        appVersion: (import.meta.env.VITE_APP_VERSION as string | undefined)?.trim(),
      }),
    },
  });

  client.interceptors.request.use(
    (config: any) => {
      if (config.skipAuth) return config;

      const token = readSharedToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as any & { _retry?: boolean };

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        const refreshToken = readSharedRefreshToken();
        if (refreshToken) {
          try {
            const response = await axios.post(
              `${API_BASE_URL}${AUTH_ENDPOINTS.refresh}`,
              buildRefreshTokenPayload({ refreshToken }),
              {
                headers: buildAuthClientHeaders({
                  clientType: 'web',
                  appId: 'fenghuang-website',
                  appVersion: (import.meta.env.VITE_APP_VERSION as string | undefined)?.trim(),
                }),
              }
            );
            const nextPayload = response.data?.data ?? response.data;
            const token = nextPayload?.token;
            const newRefreshToken = nextPayload?.refreshToken;

            if (!token) {
              throw new Error('Missing refreshed token');
            }

            writeSharedAuth({
              token,
              refreshToken: newRefreshToken ?? refreshToken,
            });

            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return client(originalRequest);
          } catch (refreshError) {
            clearSharedAuth();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
}

export const apiClient = createApiClient();

export function setAuthToken(token: string) {
  writeSharedAuth({ token });
}

export function setRefreshToken(refreshToken: string) {
  writeSharedAuth({ refreshToken });
}

export function clearAuth() {
  clearSharedAuth();
}

export function getCurrentUser() {
  return readSharedUser();
}

export function setCurrentUser(user: any) {
  writeSharedAuth({ user });
}
