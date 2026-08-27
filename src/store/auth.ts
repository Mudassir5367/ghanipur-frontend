import { create } from 'zustand';
import type { AuthUser } from '@/types/api';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  // Active shop context for SUPER_ADMIN acting on a specific shop.
  activeShopId: string | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  setAuth: (user: AuthUser, accessToken: string) => void;
  patchUser: (partial: Partial<AuthUser>) => void;
  setAccessToken: (token: string) => void;
  setActiveShopId: (shopId: string | null) => void;
  clear: () => void;
  setStatus: (status: AuthState['status']) => void;
}

/**
 * Access token lives in memory only (never localStorage) per §30. Persistence
 * across reloads is handled by the httpOnly refresh cookie + a refresh call on
 * app load, not by storing the token client-side.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  activeShopId: null,
  status: 'idle',
  setAuth: (user, accessToken) =>
    set({ user, accessToken, status: 'authenticated', activeShopId: user.shopId }),
  patchUser: (partial) => set((s) => (s.user ? { user: { ...s.user, ...partial } } : {})),
  setAccessToken: (accessToken) => set({ accessToken }),
  setActiveShopId: (activeShopId) => set({ activeShopId }),
  clear: () => set({ user: null, accessToken: null, activeShopId: null, status: 'unauthenticated' }),
  setStatus: (status) => set({ status }),
}));
