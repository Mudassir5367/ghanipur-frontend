import { api } from '@/lib/api';
import type { ApiSuccess, PageMeta, AuthUser } from '@/types/api';
import type { Shop, ShopSettings, ShopStatus, StaffMember } from '@/types/shop';

// ---- Shop admin self-onboarding (§2) ----
export async function createMyShop(payload: { shopName: string; phone?: string }): Promise<{ shop: Shop; accessToken: string; user: AuthUser }> {
  const { data } = await api.post<ApiSuccess<{ shop: Shop; accessToken: string; user: AuthUser }>>('/shops/mine', payload);
  return data.data;
}

// ---- Own shop ----
export async function getMyShop(): Promise<Shop> {
  const { data } = await api.get<ApiSuccess<{ shop: Shop }>>('/shops/me');
  return data.data.shop;
}

export async function updateMyShop(payload: Partial<Shop>): Promise<Shop> {
  const { data } = await api.patch<ApiSuccess<{ shop: Shop }>>('/shops/me', payload);
  return data.data.shop;
}

export async function getMySettings(): Promise<ShopSettings> {
  const { data } = await api.get<ApiSuccess<{ settings: ShopSettings }>>('/shops/me/settings');
  return data.data.settings;
}

export async function updateMySettings(payload: Partial<Pick<ShopSettings, 'paymentMethods' | 'customerTypes'>>): Promise<ShopSettings> {
  const { data } = await api.patch<ApiSuccess<{ settings: ShopSettings }>>('/shops/me/settings', payload);
  return data.data.settings;
}

// ---- Staff ----
export async function listStaff(): Promise<StaffMember[]> {
  const { data } = await api.get<ApiSuccess<StaffMember[]>>('/staff', { params: { limit: 100 } });
  return data.data;
}

export async function createStaff(payload: { name: string; email: string; password: string; phone?: string }): Promise<StaffMember> {
  const { data } = await api.post<ApiSuccess<{ staff: StaffMember }>>('/staff', payload);
  return data.data.staff;
}

export async function updateStaff(id: string, payload: { isActive?: boolean; name?: string }): Promise<StaffMember> {
  const { data } = await api.patch<ApiSuccess<{ staff: StaffMember }>>(`/staff/${id}`, payload);
  return data.data.staff;
}

export async function deactivateStaff(id: string): Promise<StaffMember> {
  const { data } = await api.delete<ApiSuccess<{ staff: StaffMember }>>(`/staff/${id}`);
  return data.data.staff;
}

// ---- Super admin ----
export async function listShops(params: { status?: ShopStatus; search?: string; page?: number } = {}): Promise<{ shops: Shop[]; meta: PageMeta }> {
  const { data } = await api.get<ApiSuccess<Shop[]>>('/shops', { params: { limit: 20, ...params } });
  return { shops: data.data, meta: data.meta! };
}

export async function setShopStatus(id: string, status: ShopStatus): Promise<Shop> {
  const { data } = await api.patch<ApiSuccess<{ shop: Shop }>>(`/shops/${id}/status`, { status });
  return data.data.shop;
}

export async function createShopAdmin(payload: {
  shopName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
}): Promise<Shop> {
  const { data } = await api.post<ApiSuccess<{ shop: Shop }>>('/shops', payload);
  return data.data.shop;
}
