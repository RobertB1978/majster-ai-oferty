/**
 * useInvoicePayments Hook
 * Manage payment tracking for invoices (partial/full payments)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

import type { RecordPaymentInput, InvoicePayment } from '../types/invoices';

// ============================================
// Query Keys
// ============================================

const invoicePaymentKeys = {
  all: ['invoicePayments'] as const,
  forInvoice: (invoiceId: string) => [...invoicePaymentKeys.all, invoiceId] as const,
};

// ============================================
// useInvoicePayments Hook (List)
// ============================================

export function useInvoicePayments(invoiceId: string) {
  const query = useQuery({
    queryKey: invoicePaymentKeys.forInvoice(invoiceId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_payments')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('payment_date', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return (data || []) as InvoicePayment[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    payments: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// ============================================
// useRecordPayment Hook
// ============================================

export function useRecordPayment(invoiceId: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const mutation = useMutation({
    mutationFn: async (input: RecordPaymentInput) => {
      // Get current invoice to update amount_paid
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('amount_paid, gross_total, additional_charges, discount_amount')
        .eq('id', invoiceId)
        .single();

      if (invoiceError) {
        throw invoiceError;
      }

      const newAmountPaid =
        (invoice?.amount_paid || 0) + input.amount;

      // Record payment
      const { data: payment, error: paymentError } = await supabase
        .from('invoice_payments')
        .insert([
          {
            invoice_id: invoiceId,
            ...input,
          },
        ])
        .select()
        .single();

      if (paymentError) {
        throw paymentError;
      }

      // Update invoice payment status
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ amount_paid: newAmountPaid })
        .eq('id', invoiceId);

      if (updateError) {
        throw updateError;
      }

      return payment as InvoicePayment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: invoicePaymentKeys.forInvoice(invoiceId),
      });
      // Invalidate invoice detail to refresh payment status
      queryClient.invalidateQueries({
        queryKey: ['invoices', 'detail', invoiceId],
      });
      showToast({
        type: 'success',
        message: t('messages.paymentRecorded', 'Płatność zarejestrowana pomyślnie'),
      });
    },
    onError: (error) => {
      showToast({
        type: 'error',
        message: t('errors.recordPaymentFailed', 'Nie udało się zarejestrować płatności'),
      });
      console.error('Record payment error:', error);
    },
  });

  return {
    recordPayment: mutation.mutate,
    recordPaymentAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

// ============================================
// useDeletePayment Hook
// ============================================

export function useDeletePayment(invoiceId: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const mutation = useMutation({
    mutationFn: async (paymentId: string) => {
      // Get payment to know how much to subtract
      const { data: payment, error: paymentError } = await supabase
        .from('invoice_payments')
        .select('amount')
        .eq('id', paymentId)
        .single();

      if (paymentError) {
        throw paymentError;
      }

      // Get current invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('amount_paid')
        .eq('id', invoiceId)
        .single();

      if (invoiceError) {
        throw invoiceError;
      }

      const newAmountPaid = Math.max(0, (invoice?.amount_paid || 0) - (payment?.amount || 0));

      // Delete payment
      const { error: deleteError } = await supabase
        .from('invoice_payments')
        .delete()
        .eq('id', paymentId);

      if (deleteError) {
        throw deleteError;
      }

      // Update invoice
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ amount_paid: newAmountPaid })
        .eq('id', invoiceId);

      if (updateError) {
        throw updateError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: invoicePaymentKeys.forInvoice(invoiceId),
      });
      queryClient.invalidateQueries({
        queryKey: ['invoices', 'detail', invoiceId],
      });
      showToast({
        type: 'success',
        message: t('messages.paymentDeleted', 'Płatność usunięta pomyślnie'),
      });
    },
    onError: (error) => {
      showToast({
        type: 'error',
        message: t('errors.deletePaymentFailed', 'Nie udało się usunąć płatności'),
      });
      console.error('Delete payment error:', error);
    },
  });

  return {
    deletePayment: mutation.mutate,
    deletePaymentAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

// ============================================
// Helper: Calculate Payment Progress
// ============================================

export interface PaymentProgress {
  totalAmount: number;
  amountPaid: number;
  amountPending: number;
  percentagePaid: number;
  isFullyPaid: boolean;
  isPartiallyPaid: boolean;
}

export function usePaymentProgress(
  grossTotal: number,
  additionalCharges?: number,
  discountAmount?: number,
  amountPaid?: number
): PaymentProgress {
  const totalAmount =
    grossTotal + (additionalCharges || 0) - (discountAmount || 0);
  const paid = amountPaid || 0;
  const pending = Math.max(0, totalAmount - paid);
  const percentagePaid = totalAmount > 0 ? (paid / totalAmount) * 100 : 0;

  return {
    totalAmount,
    amountPaid: paid,
    amountPending: pending,
    percentagePaid,
    isFullyPaid: pending <= 0,
    isPartiallyPaid: paid > 0 && pending > 0,
  };
}
