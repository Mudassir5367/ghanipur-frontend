export type Role = 'SUPER_ADMIN' | 'SHOP_ADMIN' | 'SHOP_STAFF' | 'USER';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  shopId: string | null;
  permissions: string[];
  avatarUrl?: string | null; // optional uploaded picture; falls back to an initials avatar
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PageMeta;
}

export interface ApiError {
  success: false;
  message: string;
  code: string;
  errors?: { path: string; message: string }[];
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}
