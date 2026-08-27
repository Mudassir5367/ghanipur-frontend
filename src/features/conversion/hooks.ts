'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as conversion from './api';
import { apiErrorMessage } from '@/lib/api';
import { toast } from '@/components/ui/toast';

export function useConversions() {
  return useQuery({ queryKey: ['conversions'], queryFn: conversion.listConversions });
}

export function useCreateConversion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: conversion.createConversion,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversions'] });
      qc.invalidateQueries({ queryKey: ['products'] }); // stock + price changed
      toast.success('Conversion recorded');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });
}
