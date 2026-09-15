import { api } from '@/lib/api';
import type { ApiSuccess, PageMeta } from '@/types/api';

/** Milk → Sweet Milk / Yogurt yield: 92 from every 100 (must match the backend CONVERSION_RATE). */
export const CONVERSION_RATE = 0.92;

export type ConversionOutputKind = 'SWEET_MILK' | 'YOGURT';
export const OUTPUT_LABEL: Record<string, string> = { SWEET_MILK: 'Sweet Milk', YOGURT: 'Yogurt', OTHER: 'Other' };

export interface Conversion {
  _id: string;
  sourceProductId?: string;
  sourceName: string;
  targetProductId?: string;
  targetName: string;
  unitSymbol: string; // Milk's unit
  targetUnitSymbol?: string; // output's unit (older records: same as unitSymbol)
  outputKind?: string;
  rate: number;
  sourceQuantity: number;
  convertedQuantity: number;
  sourceUnitPriceMinor: number;
  /** Cost price per output unit — reference only, never applied to product pricing. */
  convertedUnitPriceMinor: number;
  /** Total cost of the Milk used — reference only. */
  totalValueMinor: number;
  performedByName?: string | null;
  createdAt: string;
}

export interface ConversionOption {
  _id: string;
  name: string;
  currentStock: number;
  unitSymbol: string;
  sellingPriceMinor: number;
}

export interface ConversionOptions {
  rate: number;
  milk: ConversionOption[];
  outputs: Record<ConversionOutputKind, ConversionOption[]>;
}

export interface ConversionSummary {
  count: number;
  milkUsed: { unitSymbol: string; quantity: number }[];
  produced: { outputKind: string; unitSymbol: string; quantity: number }[];
  totalCostMinor: number;
}

export interface ConversionRange { from?: string; to?: string }

export interface CreateConversionPayload {
  sourceProductId: string;
  targetProductId: string;
  quantity: number;
}

/**
 * Client-side preview mirroring the backend computeConversion (kept in sync):
 * output = Milk × 0.92; cost price per output unit keeps the Milk's total value.
 */
export function previewConversion(quantity: number, sourceUnitPriceMinor: number) {
  const convertedQuantity = Math.round(quantity * CONVERSION_RATE * 1000) / 1000;
  const totalValueMinor = Math.round(quantity * sourceUnitPriceMinor);
  const convertedUnitPriceMinor = convertedQuantity > 0 ? Math.round(totalValueMinor / convertedQuantity) : 0;
  return { convertedQuantity, convertedUnitPriceMinor, totalValueMinor };
}

export async function getConversionOptions(): Promise<ConversionOptions> {
  const { data } = await api.get<ApiSuccess<ConversionOptions>>('/conversions/options');
  return data.data;
}

export async function listConversions(params: ConversionRange & { page?: number } = {}): Promise<{ conversions: Conversion[]; meta: PageMeta }> {
  const { data } = await api.get<ApiSuccess<Conversion[]>>('/conversions', { params: { limit: 15, ...params } });
  return { conversions: data.data, meta: data.meta! };
}

export async function getConversionSummary(range: ConversionRange): Promise<ConversionSummary> {
  const { data } = await api.get<ApiSuccess<ConversionSummary>>('/conversions/summary', { params: range });
  return data.data;
}

export async function createConversion(payload: CreateConversionPayload): Promise<Conversion> {
  const { data } = await api.post<ApiSuccess<{ conversion: Conversion }>>('/conversions', payload);
  return data.data.conversion;
}
