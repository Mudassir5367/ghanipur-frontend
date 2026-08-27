export type ShopStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';

export interface ShopAddress {
  line?: string;
  city?: string;
  area?: string;
}

export interface Shop {
  _id: string;
  name: string;
  slug: string;
  logo?: string | null;
  banner?: string | null;
  description?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: ShopAddress;
  timezone?: string;
  currency?: string;
  status: ShopStatus;
  createdAt: string;
}

export interface ShopSettings {
  _id: string;
  shopId: string;
  paymentMethods: string[];
  customerTypes: string[];
  locale: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: 'SHOP_ADMIN' | 'SHOP_STAFF';
  isActive: boolean;
  permissions: string[];
  lastLoginAt?: string | null;
}
