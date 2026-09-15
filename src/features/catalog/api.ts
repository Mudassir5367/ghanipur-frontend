import { api } from '@/lib/api';
import type { ApiSuccess, PageMeta } from '@/types/api';
import type { Category, Product, Unit, InventoryTxn } from '@/types/catalog';

// ---- Units ----
export async function listUnits(): Promise<Unit[]> {
  const { data } = await api.get<ApiSuccess<Unit[]>>('/units');
  return data.data;
}

// ---- Categories ----
export async function listCategories(): Promise<Category[]> {
  const { data } = await api.get<ApiSuccess<Category[]>>('/categories', { params: { limit: 100 } });
  return data.data;
}
export async function createCategory(payload: { name: string; description?: string; parentId?: string | null }): Promise<Category> {
  const { data } = await api.post<ApiSuccess<{ category: Category }>>('/categories', payload);
  return data.data.category;
}
export async function updateCategory(id: string, payload: Partial<Category>): Promise<Category> {
  const { data } = await api.patch<ApiSuccess<{ category: Category }>>(`/categories/${id}`, payload);
  return data.data.category;
}
export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/categories/${id}`);
}

// ---- Products ----
export interface ProductFilters {
  categoryId?: string;
  status?: string;
  lowStock?: string;
  search?: string;
  page?: number;
}
export interface ProductPayload {
  name: string;
  categoryId: string;
  unitId: string;
  sellingPrice: number;
  purchaseCost?: number;
  supplier?: string;
  minStock?: number;
  openingStock?: number;
  description?: string;
  trackInventory?: boolean;
  isAvailable?: boolean;
  sku?: string;
  images?: string[];
}

// Auto-generate a unique SKU (§4).
export async function suggestSku(categoryId?: string): Promise<string> {
  const { data } = await api.get<ApiSuccess<{ sku: string }>>('/products/sku/suggest', { params: categoryId ? { categoryId } : {} });
  return data.data.sku;
}

// Upload a product image, returns its stored URL (§8).
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  // Unset the instance's default JSON content-type so axios/the browser set
  // multipart/form-data WITH the boundary derived from the FormData body.
  const { data } = await api.post<ApiSuccess<{ url: string }>>('/uploads', form, {
    headers: { 'Content-Type': undefined as unknown as string },
  });
  return data.data.url;
}

export async function listProducts(filters: ProductFilters = {}): Promise<{ products: Product[]; meta: PageMeta }> {
  const { data } = await api.get<ApiSuccess<Product[]>>('/products', { params: { limit: 15, ...filters } });
  return { products: data.data, meta: data.meta! };
}
/**
 * Every product, for pickers (New Delivery, Quick Sale, Conversions). List screens
 * page at 15, but a picker must offer all products, so this walks the pages at the
 * API's 100-row cap until none are left.
 */
export async function listAllProducts(): Promise<Product[]> {
  const all: Product[] = [];
  for (let page = 1; ; page += 1) {
    const { data } = await api.get<ApiSuccess<Product[]>>('/products', { params: { limit: 100, page } });
    all.push(...data.data);
    if (!data.meta || page >= data.meta.totalPages) break;
  }
  return all;
}
export async function getProduct(id: string): Promise<Product> {
  const { data } = await api.get<ApiSuccess<{ product: Product }>>(`/products/${id}`);
  return data.data.product;
}
export async function createProduct(payload: ProductPayload): Promise<Product> {
  const { data } = await api.post<ApiSuccess<{ product: Product }>>('/products', payload);
  return data.data.product;
}
export async function updateProduct(id: string, payload: Partial<ProductPayload>): Promise<Product> {
  const { data } = await api.patch<ApiSuccess<{ product: Product }>>(`/products/${id}`, payload);
  return data.data.product;
}
export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`);
}

// ---- Inventory ----
/** A stock movement. Stock In is a purchase and also takes the supplier and cost price (rupees). */
export interface InventoryPayload { type: string; quantity: number; note?: string; supplier?: string; unitCost?: number }

export async function recordInventory(productId: string, payload: InventoryPayload): Promise<{ currentStock: number; avgCostMinor: number }> {
  const { data } = await api.post<ApiSuccess<{ currentStock: number; avgCostMinor: number }>>(`/products/${productId}/inventory`, payload);
  return data.data;
}

/** Supplier/vendor names already used by the shop (for suggestions). */
export async function listSuppliers(): Promise<string[]> {
  const { data } = await api.get<ApiSuccess<{ suppliers: string[] }>>('/products/suppliers');
  return data.data.suppliers;
}
export async function getLedger(productId: string): Promise<InventoryTxn[]> {
  const { data } = await api.get<ApiSuccess<InventoryTxn[]>>(`/products/${productId}/inventory`, { params: { limit: 50 } });
  return data.data;
}
