/**
 * DRY Mutation Factory - eliminuje duplikację kodu w optimistic updates
 *
 * Wzorzec użycia:
 * - useAddClient, useDeleteClient, useAddProject, useDeleteProject
 *   wszystkie używają tego samego wzorca optimistic update
 *
 * Fabryka zapewnia:
 * - Automatyczny cancel queries
 * - Snapshot poprzedniego stanu
 * - Optimistic update
 * - Rollback przy błędzie
 * - Invalidation po zakończeniu
 */

import { type QueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface OptimisticMutationConfig<TData, TVariables> {
  /** Query key który będzie invalidowany */
  queryKey: unknown[];

  /** Funkcja mutacji (insert/update/delete) */
  mutationFn: (variables: TVariables) => Promise<TData>;

  /** Funkcja generująca optimistic data z variables */
  optimisticDataFn?: (variables: TVariables) => TData;

  /** Funkcja aktualizująca cache (dla add/update) */
  updateCacheFn?: (old: TData[] | undefined, data: TData, variables: TVariables) => TData[];

  /** Funkcja usuwająca z cache (dla delete) */
  removeCacheFn?: (old: TData[] | undefined, id: string) => TData[];

  /** Success message */
  successMessage?: string;

  /** Error message */
  errorMessage?: string;
}

/**
 * Factory function dla optimistic mutations
 * Eliminuje duplikację kodu dla add/delete/update operations
 *
 * @param queryClient - QueryClient instance from useQueryClient() hook
 * @param config - Mutation configuration
 */
export function createOptimisticMutation<TData, TVariables>(
  queryClient: QueryClient,
  config: OptimisticMutationConfig<TData, TVariables>
): UseMutationOptions<TData, Error, TVariables, { previousData: unknown }> {
  return {
    mutationFn: config.mutationFn,

    onMutate: async (variables) => {

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: config.queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(config.queryKey);

      // Optimistically update cache
      if (config.optimisticDataFn && config.updateCacheFn) {
        const optimisticData = config.optimisticDataFn(variables);

        queryClient.setQueryData<TData[]>(config.queryKey, (old) => {
          return config.updateCacheFn!(old, optimisticData, variables);
        });
      } else if (config.removeCacheFn) {
        queryClient.setQueryData<TData[]>(config.queryKey, (old) => {
          return config.removeCacheFn!(old, (variables as any).id || variables);
        });
      }

      return { previousData };
    },

    onError: (err, variables, context) => {
      // Rollback to previous value
      if (context?.previousData) {
        queryClient.setQueryData(config.queryKey, context.previousData);
      }

      if (config.errorMessage) {
        toast.error(config.errorMessage);
      }

      console.error(err);
    },

    onSuccess: () => {
      if (config.successMessage) {
        toast.success(config.successMessage);
      }
    },

    onSettled: () => {
      // Always refetch to ensure sync with server
      queryClient.invalidateQueries({ queryKey: config.queryKey });
    },
  };
}

/**
 * Helper dla ADD operations
 */
export function createAddMutation<TData extends { id: string }>(
  queryKey: unknown[],
  mutationFn: (variables: Omit<TData, 'id' | 'created_at'>) => Promise<TData>,
  messages: { success: string; error: string }
) {
  return createOptimisticMutation<TData, Omit<TData, 'id' | 'created_at'>>({
    queryKey,
    mutationFn,
    optimisticDataFn: (variables) => ({
      id: `temp-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...variables,
    } as TData),
    updateCacheFn: (old, optimisticData) => {
      if (!old) return [optimisticData];
      return [optimisticData, ...old];
    },
    successMessage: messages.success,
    errorMessage: messages.error,
  });
}

/**
 * Helper dla DELETE operations
 */
export function createDeleteMutation<TData extends { id: string }>(
  queryKey: unknown[],
  mutationFn: (id: string) => Promise<void>,
  messages: { success: string; error: string }
) {
  return createOptimisticMutation<void, string>({
    queryKey,
    mutationFn,
    removeCacheFn: (old, id) => {
      if (!old) return old;
      return old.filter((item) => item.id !== id);
    },
    successMessage: messages.success,
    errorMessage: messages.error,
  });
}

/**
 * Helper dla UPDATE operations
 */
export function createUpdateMutation<TData extends { id: string }>(
  queryKey: unknown[],
  mutationFn: (data: Partial<TData> & { id: string }) => Promise<TData>,
  messages: { success: string; error: string }
) {
  return createOptimisticMutation<TData, Partial<TData> & { id: string }>({
    queryKey,
    mutationFn,
    updateCacheFn: (old, updatedData) => {
      if (!old) return [updatedData];
      return old.map((item) => (item.id === updatedData.id ? updatedData : item));
    },
    successMessage: messages.success,
    errorMessage: messages.error,
  });
}
