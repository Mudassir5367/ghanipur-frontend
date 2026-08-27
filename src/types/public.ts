export interface PublicShop {
  _id: string;
  name: string;
  slug: string;
  logo?: string | null;
  banner?: string | null;
  description?: string;
  phone?: string;
  whatsapp?: string;
  address?: { line?: string; city?: string; area?: string };
}

export interface PublicCategory {
  _id: string;
  name: string;
  slug: string;
  image?: string | null;
  icon?: string | null;
}

interface Ref { _id: string; name: string; slug?: string; symbol?: string }

export interface PublicProduct {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  images: string[];
  sellingPriceMinor: number;
  unitValue: number;
  currentStock: number;
  trackInventory: boolean;
  isAvailable: boolean;
  categoryId?: Ref;
  unitId?: Ref;
}
