/**
 * useInvoices Hook
 * Main hook for CRUD operations on invoices
 */

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '../integrations/supabaseClient';
import { useToast } from '../hooks/useToast';

import type {
  Invoice,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceFilters,
  InvoiceSortOptions,
  InvoiceQueryOptions,
} from '../types/invoices';

// ============================================
// Query Keys
// ============================================

const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (filters?: InvoiceFilters, sort?: InvoiceSortOptions) =>
    [...invoiceKeys.lists(), { filters, sort }] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
};

// ============================================
// useInvoices Hook (List)
// ============================================

interface UseInvoicesOptions {
  filters?: InvoiceFilters;
  sort?: InvoiceSortOptions;
  limit?: number;
  offset?: number;
}

export function useInvoices(options?: UseInvoicesOptions) {
  const { t } = useTranslation();

  const query = useQuery({
    queryKey: invoiceKeys.list(options?.filters, options?.sort),
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select('*', { count: 'exact' });

      // Apply filters
      if (options?.filters) {
        if (options.filters.status && options.filters.status.length > 0) {
          query = query.in('status', options.filters.status);
        }
        if (options.filters.paymentStatus && options.filters.paymentStatus.length > 0) {
          query = query.in('payment_status', options.filters.paymentStatus);
        }
        if (options.filters.dateFrom) {
          query = query.gte('invoice_date', options.filters.dateFrom);
        }
        if (options.filters.dateTo) {
          query = query.lte('invoice_date', options.filters.dateTo);
        }
        if (options.filters.clientId) {
          query = query.eq('client_id', options.filters.clientId);
        }
        if (options.filters.projectId) {
          query = query.eq('project_id', options.filters.projectId);
        }
        if (options.filters.search) {
          query = query.or(
            `invoice_number.ilike.%${options.filters.search}%,client_name.ilike.%${options.filters.search}%`
          );
        }
      }

      // Apply sorting
      if (options?.sort) {
        query = query.order(options.sort.field, {
          ascending: options.sort.direction === 'asc',
        });
      } else {
        // Default sort: newest first
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, (options.offset || 0) + (options.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { data: data || [], count: count || 0 };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    invoices: query.data?.data || [],
    total: query.data?.count || 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// ============================================
// useInvoice Hook (Single)
// ============================================

export function useInvoice(invoiceId: string | undefined) {
  const query = useQuery({
    queryKey: invoiceId ? invoiceKeys.detail(invoiceId) : ['invoice-disabled'],
    queryFn: async () => {
      if (!invoiceId) {
        return null;
      }

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Invoice;
    },
    enabled: !!invoiceId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    invoice: query.data || null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// ============================================
// useCreateInvoice Hook
// ============================================

export function useCreateInvoice() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const mutation = useMutation({
    mutationFn: async (input: CreateInvoiceInput) => {
      // Calculate totals (VAT will be calculated on backend)
      const lineItems = input.line_items.map(item => ({
        ...item,
        id: Math.random().toString(36).substr(2, 9),
      }));

      const { data, error } = await supabase
        .from('invoices')
        .insert([
          {
            ...input,
            line_items: lineItems,
            status: 'draft',
            payment_status: 'pending',
            amount_paid: 0,
          },
        ])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Invoice;
    },
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      showToast({
        type: 'success',
        message: t('messages.invoiceCreated', 'Faktura utworzona pomyślnie'),
      });
      return invoice;
    },
    onError: (error) => {
      showToast({
        type: 'error',
        message: t('errors.createInvoiceFailed', 'Nie udało się utworzyć faktury'),
      });
      console.error('Create invoice error:', error);
    },
  });

  return {
    createInvoice: mutation.mutate,
    createInvoiceAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

// ============================================
// useUpdateInvoice Hook
// ============================================

export function useUpdateInvoice(invoiceId: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const mutation = useMutation({
    mutationFn: async (updates: UpdateInvoiceInput) => {
      const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Invoice;
    },
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      showToast({
        type: 'success',
        message: t('messages.invoiceUpdated', 'Faktura zaktualizowana pomyślnie'),
      });
      return invoice;
    },
    onError: (error) => {
      showToast({
        type: 'error',
        message: t('errors.updateInvoiceFailed', 'Nie udało się zaktualizować faktury'),
      });
      console.error('Update invoice error:', error);
    },
  });

  return {
    updateInvoice: mutation.mutate,
    updateInvoiceAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

// ============================================
// useDeleteInvoice Hook
// ============================================

export function useDeleteInvoice() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const mutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      showToast({
        type: 'success',
        message: t('messages.invoiceDeleted', 'Faktura usunięta pomyślnie'),
      });
    },
    onError: (error) => {
      showToast({
        type: 'error',
        message: t('errors.deleteInvoiceFailed', 'Nie udało się usunąć faktury'),
      });
      console.error('Delete invoice error:', error);
    },
  });

  return {
    deleteInvoice: mutation.mutate,
    deleteInvoiceAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

// ============================================
// usePublishInvoice Hook (Draft -> Issued)
// ============================================

export function usePublishInvoice(invoiceId: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .update({
          status: 'issued',
          issued_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      showToast({
        type: 'success',
        message: t('messages.invoicePublished', 'Faktura wystawiona pomyślnie'),
      });
    },
    onError: (error) => {
      showToast({
        type: 'error',
        message: t('errors.publishInvoiceFailed', 'Nie udało się wystawić faktury'),
      });
      console.error('Publish invoice error:', error);
    },
  });

  return {
    publishInvoice: mutation.mutate,
    publishInvoiceAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

// ============================================
// useSendInvoice Hook
// ============================================

export function useSendInvoice(invoiceId: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const mutation = useMutation({
    mutationFn: async (input: { clientEmail: string; message?: string }) => {
      // Call Edge Function
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          invoiceId,
          clientEmail: input.clientEmail,
          message: input.message,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to send invoice');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      showToast({
        type: 'success',
        message: t('messages.invoiceSent', 'Faktura wysłana pomyślnie'),
      });
    },
    onError: (error) => {
      showToast({
        type: 'error',
        message: t('errors.sendInvoiceFailed', 'Nie udało się wysłać faktury'),
      });
      console.error('Send invoice error:', error);
    },
  });

  return {
    sendInvoice: mutation.mutate,
    sendInvoiceAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
