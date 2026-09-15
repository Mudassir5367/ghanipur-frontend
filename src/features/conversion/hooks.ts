'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as conversion from './api';
import { apiErrorMessage } from '@/lib/api';
import { toast } from '@/components/ui/toast';

export function useConversionOptions() {
  return useQuery({ queryKey: ['conversion-options'], queryFn: conversion.getConversionOptions });
}

export function useConversions(params: conversion.ConversionRange & { page?: number } = {}) {
  return useQuery({ queryKey: ['conversions', params], queryFn: () => conversion.listConversions(params) });
}

export function useConversionSummary(range: conversion.ConversionRange) {
  return useQuery({ queryKey: ['conversions', 'summary', range], queryFn: () => conversion.getConversionSummary(range) });
}

export function useCreateConversion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: conversion.createConversion,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversions'] }); // history + summaries
      qc.invalidateQueries({ queryKey: ['conversion-options'] }); // stock shown in the form
      qc.invalidateQueries({ queryKey: ['products'] }); // stock changed (prices never do)
      qc.invalidateQueries({ queryKey: ['report-dashboard'] });
      qc.invalidateQueries({ queryKey: ['report-daily-milk'] });
      toast.success('Conversion recorded');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });
}
