import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/auth';
import type { ApiError } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

/** Shared axios instance. Sends the refresh cookie via withCredentials. */
export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the in-memory access token + active shop context to every request.
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken, activeShopId, user } = useAuthStore.getState();
  if (accessToken) config.headers.set('Authorization', `Bearer ${accessToken}`);
  // Super admin must name the shop it's acting on (§22).
  if (user?.role === 'SUPER_ADMIN' && activeShopId) config.headers.set('x-shop-id', activeShopId);
  return config;
});

// On 401, try one silent refresh, then replay the original request.
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await axios.post<{ data: { accessToken: string } }>(
      `${API_URL}/auth/refresh`,
      {},
      { withCredentials: true },
    );
    const token = res.data.data.accessToken;
    useAuthStore.getState().setAccessToken(token);
    return token;
  } catch {
    useAuthStore.getState().clear();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiError>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const isAuthCall = original?.url?.includes('/auth/');
    if (error.response?.status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true;
      refreshing = refreshing ?? refreshAccessToken();
      const token = await refreshing;
      refreshing = null;
      if (token) {
        original.headers.set('Authorization', `Bearer ${token}`);
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);

/** Normalize an axios error into a readable message. */
export function apiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as (ApiError & { errors?: { path?: string; message?: string }[] }) | undefined;
    // Surface the specific validation reason(s) instead of a generic "Validation failed".
    const details = data?.errors?.map((e) => e?.message).filter(Boolean) as string[] | undefined;
    if (details?.length) return details.join('. ');
    return data?.message ?? err.message;
  }
  return err instanceof Error ? err.message : 'Something went wrong';
}
