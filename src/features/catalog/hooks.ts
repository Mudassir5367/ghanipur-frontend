'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as catalog from './api';
import { apiErrorMessage } from '@/lib/api';
import { toast } from '@/components/ui/toast';
import type { Category } from '@/types/catalog';

const onError = (err: unknown) => toast.error(apiErrorMessage(err));

export function useUnits() {
  return useQuery({ queryKey: ['units'], queryFn: catalog.listUnits, staleTime: 5 * 60_000 });
}

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: catalog.listCategories });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: catalog.createCategory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Category created'); },
    onError,
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Category> }) => catalog.updateCategory(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Category updated'); },
    onError,
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: catalog.deleteCategory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Category deleted'); },
    onError,
  });
}

export function useProducts(filters: catalog.ProductFilters) {
  return useQuery({ queryKey: ['products', filters], queryFn: () => catalog.listProducts(filters) });
}

/** All products for pickers. Keyed under 'products' so product mutations refresh it. */
export function useAllProducts() {
  return useQuery({ queryKey: ['products', 'all'], queryFn: catalog.listAllProducts });
}

export function useProduct(id: string | null) {
  return useQuery({ queryKey: ['product', id], queryFn: () => catalog.getProduct(id!), enabled: !!id });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: catalog.createProduct,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); qc.invalidateQueries({ queryKey: ['suppliers'] }); toast.success('Product created'); },
    onError,
  });
}

/** Supplier names for the datalist suggestions in Add Product / Add Stock. */
export function useSuppliers() {
  return useQuery({ queryKey: ['suppliers'], queryFn: catalog.listSuppliers, staleTime: 60_000 });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<catalog.ProductPayload> }) => catalog.updateProduct(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['product'] });
      qc.invalidateQueries({ queryKey: ['ledger'] }); // an opening-stock edit adds a ledger entry
      toast.success('Product updated');
    },
    onError,
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: catalog.deleteProduct,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Product archived'); },
    onError,
  });
}

export function useRecordInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, payload }: { productId: string; payload: catalog.InventoryPayload }) =>
      catalog.recordInventory(productId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] }); // stock + average cost
      qc.invalidateQueries({ queryKey: ['product'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Stock updated');
    },
    onError,
  });
}

export function useLedger(productId: string | null) {
  return useQuery({ queryKey: ['ledger', productId], queryFn: () => catalog.getLedger(productId!), enabled: !!productId });
}
