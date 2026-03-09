/**
 * useReminders — PR-18
 *
 * Fetch and manage in-app reminders from project_reminders table.
 * Surfaces PENDING reminders whose remind_at <= now + 7 days (upcoming window).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ReminderEntityType = 'WARRANTY' | 'INSPECTION';
export type ReminderStatus = 'PENDING' | 'SENT' | 'DISMISSED';
export type ReminderChannel = 'IN_APP' | 'NOTIFICATION';

export interface ProjectReminder {
  id: string;
  user_id: string;
  entity_type: ReminderEntityType;
  entity_id: string;
  remind_at: string;       // ISO timestamptz
  channel: ReminderChannel;
  status: ReminderStatus;
  label: string | null;
  created_at: string;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Fetch all PENDING reminders for the current user.
 * Shows both past-due (overdue) and upcoming (within next 35 days).
 */
export function useReminders() {
  return useQuery<ProjectReminder[]>({
    queryKey: ['reminders'],
    queryFn: async () => {
      // Window: from 90 days ago to 35 days in the future
      const windowStart = new Date();
      windowStart.setDate(windowStart.getDate() - 90);

      const windowEnd = new Date();
      windowEnd.setDate(windowEnd.getDate() + 35);

      const { data, error } = await supabase
        .from('project_reminders')
        .select('id, user_id, entity_type, entity_id, remind_at, channel, status, label, created_at')
        .eq('status', 'PENDING')
        .gte('remind_at', windowStart.toISOString())
        .lte('remind_at', windowEnd.toISOString())
        .order('remind_at', { ascending: true });

      if (error) {
        logger.error('useReminders fetch error', error);
        throw error;
      }
      return (data ?? []) as ProjectReminder[];
    },
    // Refresh every 5 minutes while app is open
    refetchInterval: 5 * 60 * 1000,
  });
}

/** Total count of unread/pending reminders (for badge). */
export function useReminderCount() {
  const { data } = useReminders();
  return data?.length ?? 0;
}

/** Dismiss a single reminder. */
export function useDismissReminder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (reminderId: string) => {
      const { error } = await supabase
        .from('project_reminders')
        .update({ status: 'DISMISSED' })
        .eq('id', reminderId);

      if (error) {
        logger.error('useDismissReminder error', error);
        throw error;
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

/** Dismiss all pending reminders for a given entity. */
export function useDismissEntityReminders() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entityType,
      entityId,
    }: {
      entityType: ReminderEntityType;
      entityId: string;
    }) => {
      const { error } = await supabase
        .from('project_reminders')
        .update({ status: 'DISMISSED' })
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('status', 'PENDING');

      if (error) {
        logger.error('useDismissEntityReminders error', error);
        throw error;
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

/**
 * Auto-create T-30 and T-7 reminders for a warranty.
 * Called after warranty upsert. Uses upsert with ignoreDuplicates.
 */
export async function upsertWarrantyReminders(
  userId: string,
  warrantyId: string,
  endDateStr: string,
): Promise<void> {
  const end = new Date(endDateStr);

  const t30 = new Date(end);
  t30.setDate(t30.getDate() - 30);
  t30.setHours(9, 0, 0, 0);

  const t7 = new Date(end);
  t7.setDate(t7.getDate() - 7);
  t7.setHours(9, 0, 0, 0);

  const reminders = [
    {
      user_id: userId,
      entity_type: 'WARRANTY' as const,
      entity_id: warrantyId,
      remind_at: t30.toISOString(),
      channel: 'IN_APP' as const,
      status: 'PENDING' as const,
      // Labels stored as i18n keys — translated on display in RemindersPanel
      label: `warranty.reminder.t30:${endDateStr}`,
    },
    {
      user_id: userId,
      entity_type: 'WARRANTY' as const,
      entity_id: warrantyId,
      remind_at: t7.toISOString(),
      channel: 'IN_APP' as const,
      status: 'PENDING' as const,
      label: `warranty.reminder.t7:${endDateStr}`,
    },
  ];

  const { error } = await supabase
    .from('project_reminders')
    .upsert(reminders, { onConflict: 'entity_id,remind_at', ignoreDuplicates: true });

  if (error) {
    logger.error('upsertWarrantyReminders error', error);
  }
}
