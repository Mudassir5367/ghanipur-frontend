interface Populated {
  _id: string;
  name: string;
  phone?: string;
}

export interface Customer {
  _id: string;
  name: string;
  phone?: string;
  altPhone?: string;
  address?: string;
  type: string;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE';
  creditLimitMinor: number;
  currentBalanceMinor: number; // sales-ledger balance
  deliveryOutstandingMinor?: number; // Σ delivery remaining
  totalOutstandingMinor?: number; // ledger + delivery (unified)
  lastSaleAt?: string | null;
  lastPaymentAt?: string | null;
}

export interface SaleItem {
  _id: string;
  name: string;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
}

export interface Sale {
  _id: string;
  code: string;
  customerId: string | Populated | null;
  customerPhone?: string; // walk-in phone (no customer record)
  type: 'CASH' | 'CREDIT';
  status: 'COMPLETED' | 'CANCELLED';
  subtotalMinor: number;
  totalMinor: number;
  paidMinor: number;
  dueMinor: number;
  paymentMethod?: string | null;
  note?: string;
  soldAt: string;
  items?: SaleItem[]; // product name + selling price per line (from the list endpoint)
}

export interface Payment {
  _id: string;
  customerId: string | Populated;
  amountMinor: number;
  method: string;
  reference?: string;
  note?: string;
  receivedAt: string;
  reversedAt?: string | null;
}

export interface LedgerEntry {
  _id: string;
  entryType: string;
  debitMinor: number;
  creditMinor: number;
  balanceAfterMinor: number;
  note?: string;
  occurredAt: string;
}

export interface LedgerSummary {
  totalDebitMinor: number;
  totalCreditMinor: number;
  outstandingMinor: number;
}

/** Charged/paid totals for the selected date range (weekly/monthly view). */
export interface LedgerPeriod {
  debitMinor: number;
  creditMinor: number;
  count: number;
}

export function customerName(v: string | Populated | null | undefined): string {
  return typeof v === 'object' && v ? v.name : 'Walk-in';
}
