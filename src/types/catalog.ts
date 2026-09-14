export interface Unit {
  _id: string;
  name: string;
  symbol: string;
  kind: string;
  allowsDecimal: boolean;
  isShared: boolean;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  sortOrder: number;
  status: 'ACTIVE' | 'INACTIVE';
}

interface Populated {
  _id: string;
  name: string;
  slug?: string;
  symbol?: string;
}

export interface Product {
  _id: string;
  name: string;
  sku: string;
  slug: string;
  description?: string;
  images?: string[];
  categoryId: string | Populated;
  unitId: string | Populated;
  unitValue: number;
  sellingPriceMinor: number;
  purchaseCostMinor: number;
  minStock: number;
  currentStock: number;
  /** Ledger-derived; only present on GET /products/:id. */
  openingStock?: number;
  /** Default supplier/vendor. */
  supplier?: string;
  /** Average cost price across stock purchases (weighted by quantity) — what sales are costed at. */
  avgCostMinor?: number;
  trackInventory: boolean;
  isAvailable: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface InventoryTxn {
  _id: string;
  type: string;
  quantity: number;
  balanceAfter: number;
  note?: string;
  /** Stock purchases: cost price per unit and supplier. */
  unitCostMinor?: number;
  supplier?: string;
  occurredAt: string;
  performedBy?: { name: string } | null;
}

export function refName(v: string | Populated | undefined): string {
  return typeof v === 'object' && v ? v.name : '';
}
export function refSymbol(v: string | Populated | undefined): string {
  return typeof v === 'object' && v ? v.symbol ?? '' : '';
}
