'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import * as shopApi from './api';
import { apiErrorMessage } from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { useAuthStore } from '@/store/auth';
import type { ShopStatus } from '@/types/shop';

const onError = (err: unknown) => toast.error(apiErrorMessage(err));

/** Create the logged-in admin's own shop, refresh their token (new shopId), go to dashboard. */
export function useCreateMyShop() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();
  return useMutation({
    mutationFn: shopApi.createMyShop,
    onSuccess: (res) => {
      setAuth(res.user, res.accessToken);
      toast.success('Shop created');
      router.push('/dashboard');
    },
    onError,
  });
}

// ---- Own shop ----
export function useMyShop() {
  return useQuery({ queryKey: ['my-shop'], queryFn: shopApi.getMyShop });
}

export function useUpdateShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: shopApi.updateMyShop,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-shop'] });
      toast.success('Shop updated');
    },
    onError,
  });
}

export function useSettings() {
  return useQuery({ queryKey: ['shop-settings'], queryFn: shopApi.getMySettings });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: shopApi.updateMySettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shop-settings'] });
      toast.success('Settings saved');
    },
    onError,
  });
}

// ---- Staff ----
export function useStaff() {
  return useQuery({ queryKey: ['staff'], queryFn: shopApi.listStaff });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: shopApi.createStaff,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member added');
    },
    onError,
  });
}

export function useDeactivateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: shopApi.deactivateStaff,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member deactivated');
    },
    onError,
  });
}

// ---- Super admin ----
export function useShops(params: { status?: ShopStatus; search?: string; page?: number }) {
  return useQuery({ queryKey: ['shops', params], queryFn: () => shopApi.listShops(params) });
}

export function useSetShopStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ShopStatus }) => shopApi.setShopStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shops'] });
      toast.success('Shop status updated');
    },
    onError,
  });
}

export function useCreateShopAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: shopApi.createShopAdmin,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shops'] });
      toast.success('Shop created');
    },
    onError,
  });
}
