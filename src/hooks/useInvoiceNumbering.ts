/**
 * useInvoiceNumbering Hook
 * Manage invoice numbering sequences (FV-2026-001, etc.)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

import { generateInvoiceNumber } from '../lib/invoiceNumbering';
import type { InvoiceNumberSequence } from '../types/invoices';

// ============================================
// Query Keys
// ============================================

const invoiceNumberingKeys = {
  all: ['invoiceNumbering'] as const,
  sequences: () => [...invoiceNumberingKeys.all, 'sequences'] as const,
  sequence: (year: number) => [...invoiceNumberingKeys.sequences(), year] as const,
};

// ============================================
// useInvoiceNumberSequence Hook
// ============================================

export function useInvoiceNumberSequence(year?: number) {
  const currentYear = year || new Date().getFullYear();

  const query = useQuery({
    queryKey: invoiceNumberingKeys.sequence(currentYear),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_number_sequences')
        .select('*')
        .eq('year', currentYear)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is OK
        throw new Error(error.message);
      }

      return (data || null) as InvoiceNumberSequence | null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    sequence: query.data || null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// ============================================
// useNextInvoiceNumber Hook
// ============================================

export function useNextInvoiceNumber(year?: number) {
  const currentYear = year || new Date().getFullYear();
  const { sequence } = useInvoiceNumberSequence(currentYear);

  const nextNumber = useCallback(() => {
    if (!sequence) {
      return generateInvoiceNumber('FV', currentYear, 1);
    }

    return generateInvoiceNumber(sequence.prefix, currentYear, sequence.next_sequence);
  }, [sequence, currentYear]);

  return {
    nextInvoiceNumber: nextNumber(),
    year: currentYear,
    currentSequence: sequence?.next_sequence || 1,
  };
}

// ============================================
// useIncrementInvoiceSequence Hook
// ============================================

export function useIncrementInvoiceSequence() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const currentYear = new Date().getFullYear();

  const mutation = useMutation({
    mutationFn: async (year: number = currentYear) => {
      // First, try to get existing sequence
      const { data: existing, error: selectError } = await supabase
        .from('invoice_number_sequences')
        .select('*')
        .eq('year', year)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError;
      }

      let sequence: InvoiceNumberSequence;

      if (!existing) {
        // Create new sequence for year
        const { data, error } = await supabase
          .from('invoice_number_sequences')
          .insert([
            {
              year,
              next_sequence: 2, // Start at 2 since we used 1 for this invoice
              prefix: 'FV',
              format: '{PREFIX}-{YEAR}-{SEQUENCE}',
            },
          ])
          .select()
          .single();

        if (error) {
          throw error;
        }

        sequence = data as InvoiceNumberSequence;
      } else {
        // Increment existing sequence
        const { data, error } = await supabase
          .from('invoice_number_sequences')
          .update({ next_sequence: existing.next_sequence + 1 })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        sequence = data as InvoiceNumberSequence;
      }

      return sequence;
    },
    onSuccess: (sequence) => {
      queryClient.invalidateQueries({
        queryKey: invoiceNumberingKeys.sequence(sequence.year),
      });
    },
    onError: (error) => {
      showToast({
        type: 'error',
        message: t(
          'errors.invoiceNumberingFailed',
          'Nie udało się zaktualizować numeracji faktur'
        ),
      });
      console.error('Increment sequence error:', error);
    },
  });

  return {
    incrementSequence: mutation.mutate,
    incrementSequenceAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

// ============================================
// useCreateInvoiceNumberSequence Hook
// ============================================

export function useCreateInvoiceNumberSequence() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const mutation = useMutation({
    mutationFn: async (input: {
      year: number;
      startSequence?: number;
      prefix?: string;
    }) => {
      const { data, error } = await supabase
        .from('invoice_number_sequences')
        .insert([
          {
            year: input.year,
            next_sequence: input.startSequence || 1,
            prefix: input.prefix || 'FV',
            format: '{PREFIX}-{YEAR}-{SEQUENCE}',
          },
        ])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as InvoiceNumberSequence;
    },
    onSuccess: (sequence) => {
      queryClient.invalidateQueries({
        queryKey: invoiceNumberingKeys.sequence(sequence.year),
      });
      showToast({
        type: 'success',
        message: t(
          'messages.sequenceCreated',
          `Numeracja dla roku ${sequence.year} utworzona`
        ),
      });
    },
    onError: (error) => {
      showToast({
        type: 'error',
        message: t(
          'errors.createSequenceFailed',
          'Nie udało się utworzyć numeracji'
        ),
      });
      console.error('Create sequence error:', error);
    },
  });

  return {
    createSequence: mutation.mutate,
    createSequenceAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

// ============================================
// useResetInvoiceSequence Hook
// ============================================

export function useResetInvoiceSequence() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const mutation = useMutation({
    mutationFn: async (input: { year: number; newSequence?: number }) => {
      const { data, error } = await supabase
        .from('invoice_number_sequences')
        .update({ next_sequence: input.newSequence || 1 })
        .eq('year', input.year)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as InvoiceNumberSequence;
    },
    onSuccess: (sequence) => {
      queryClient.invalidateQueries({
        queryKey: invoiceNumberingKeys.sequence(sequence.year),
      });
      showToast({
        type: 'success',
        message: t(
          'messages.sequenceReset',
          'Numeracja została zresetowana'
        ),
      });
    },
    onError: (error) => {
      showToast({
        type: 'error',
        message: t(
          'errors.resetSequenceFailed',
          'Nie udało się zresetować numeracji'
        ),
      });
      console.error('Reset sequence error:', error);
    },
  });

  return {
    resetSequence: mutation.mutate,
    resetSequenceAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
