import { api } from '@/lib/api';
import type { ApiSuccess, PageMeta } from '@/types/api';

/** Milk → derived product yield (must match the backend CONVERSION_RATE). */
export const CONVERSION_RATE = 0.96;

export interface Conversion {
  _id: string;
  sourceName: string;
  targetName: string;
  unitSymbol: string;
  rate: number;
  sourceQuantity: number;
  convertedQuantity: number;
  sourceUnitPriceMinor: number;
  convertedUnitPriceMinor: number;
  totalValueMinor: number;
  createdAt: string;
}

export interface CreateConversionPayload {
  sourceProductId: string;
  targetProductId: string;
  quantity: number;
}

/** Client-side preview mirroring the backend computeConversion (kept in sync). */
export function previewConversion(quantity: number, sourceUnitPriceMinor: number) {
  const convertedQuantity = Math.round(quantity * CONVERSION_RATE * 1000) / 1000;
  const totalValueMinor = Math.round(quantity * sourceUnitPriceMinor);
  const convertedUnitPriceMinor = convertedQuantity > 0 ? Math.round(totalValueMinor / convertedQuantity) : 0;
  return { convertedQuantity, convertedUnitPriceMinor, totalValueMinor };
}

export async function listConversions(page = 1): Promise<{ conversions: Conversion[]; meta: PageMeta }> {
  const { data } = await api.get<ApiSuccess<Conversion[]>>('/conversions', { params: { limit: 15, page } });
  return { conversions: data.data, meta: data.meta! };
}

export async function createConversion(payload: CreateConversionPayload): Promise<Conversion> {
  const { data } = await api.post<ApiSuccess<{ conversion: Conversion }>>('/conversions', payload);
  return data.data.conversion;
}
