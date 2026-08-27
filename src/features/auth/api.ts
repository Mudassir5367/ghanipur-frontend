import { api } from '@/lib/api';
import type { ApiSuccess, AuthResponse, AuthUser } from '@/types/api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<ApiSuccess<AuthResponse>>('/auth/login', payload);
  return data.data;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<ApiSuccess<AuthResponse>>('/auth/register', payload);
  return data.data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get<ApiSuccess<{ user: AuthUser }>>('/auth/me');
  return data.data.user;
}

/** Upload a profile picture; returns the new URL and the refreshed user. */
export async function uploadAvatar(file: File): Promise<{ avatarUrl: string; user: AuthUser }> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<ApiSuccess<{ avatarUrl: string; user: AuthUser }>>('/uploads/avatar', form, {
    headers: { 'Content-Type': undefined as unknown as string },
  });
  return data.data;
}

// ---- Password reset (OTP flow) ----
export async function forgotPassword(email: string): Promise<{ message: string; devOtp?: string }> {
  const { data } = await api.post<ApiSuccess<{ message: string; devOtp?: string }>>('/auth/forgot-password', { email });
  return data.data;
}
export async function verifyResetOtp(email: string, otp: string): Promise<{ resetToken: string }> {
  const { data } = await api.post<ApiSuccess<{ resetToken: string }>>('/auth/verify-otp', { email, otp });
  return data.data;
}
export async function resetPassword(payload: { email: string; resetToken: string; password: string }): Promise<{ message: string }> {
  const { data } = await api.post<ApiSuccess<{ message: string }>>('/auth/reset-password', payload);
  return data.data;
}
