/**
 * useModeBDocumentInstances — PR-03 (Mode B File Flow)
 *
 * TanStack Query hooks opakowujące helpery file flow z src/lib/modeBFileFlow.ts.
 *
 * Eksportuje:
 *   - useCreateModeBInstance      — tworzy rekord draft w DB
 *   - useSaveModeBWorkingCopy     — aktualizuje file_docx po wygenerowaniu przez Edge Function
 *   - useMarkModeBReady           — zmienia status na ready
 *   - useMarkModeBFinal           — zmienia status na final
 *   - useMarkModeBSent            — zmienia status na sent
 *   - useModeBSignedDocxUrl       — pobiera signed URL do odczytu DOCX
 *   - useModeBSignedDocxDownload  — pobiera signed URL do pobrania DOCX (download)
 *   - useDeleteModeBWorkingCopy   — usuwa instancję + plik z Storage (cleanup)
 *
 * ZAKRES PR-03:
 *   - Wyłącznie hooki DB + Storage — brak logiki UI, brak komponentów
 *   - Tryb A nie jest dotykany
 *   - Hooki są gotowe pod PR-04 (UI Trybu B)
 *
 * Szczegóły: docs/MODE_B_FILE_FLOW.md
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type { DocumentInstance } from '@/hooks/useDocumentInstances';
import {
  createWorkingCopyRecord,
  saveWorkingCopy,
  markAsReady,
  markAsFinal,
  markAsSent,
  getSignedDocxAccess,
  getSignedDocxDownload,
  deleteWorkingCopyFile,
  SIGNED_DOCX_TTL_SECONDS,
} from '@/lib/modeBFileFlow';
import type { CreateModeBInstanceInput } from '@/types/document-mode-b';
import type { WorkingCopyRecord, SaveWorkingCopyInput } from '@/lib/modeBFileFlow';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// ── useModeBInstances ─────────────────────────────────────────────────────────

/**
 * Pobiera wszystkie instancje dokumentów użytkownika z Trybu B.
 * Filtruje wyłącznie rekordy source_mode = 'mode_b'.
 * Używane przez /app/ready-documents (PR-B2).
 */
export function useModeBInstances() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['document_instances', 'mode_b', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<DocumentInstance[]> => {
      const { data, error } = await supabase
        .from('document_instances')
        .select(
          'id, user_id, project_id, client_id, offer_id, template_key, template_version, locale, title, data_json, references_json, pdf_path, dossier_item_id, created_at, updated_at, source_mode, status, master_template_id, master_template_version, file_docx, version_number, edited_at, sent_at',
        )
        .eq('user_id', user!.id)
        .eq('source_mode', 'mode_b')
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Błąd pobierania dokumentów Trybu B: ${error.message}`);
      return (data ?? []) as DocumentInstance[];
    },
  });
}

// ── useCreateModeBInstance ────────────────────────────────────────────────────

/**
 * Tworzy rekord document_instances dla Trybu B (status: draft, file_docx: null).
 *
 * Wywołaj przed uruchomieniem Edge Function generującej DOCX.
 * Zwrócone `data.id` przekaż do Edge Function.
 */
export function useCreateModeBInstance() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateModeBInstanceInput): Promise<WorkingCopyRecord> => {
      if (!user) throw new Error('Użytkownik nie jest zalogowany');
      return createWorkingCopyRecord({ ...input, userId: user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document_instances'] });
    },
  });
}

// ── useSaveModeBWorkingCopy ───────────────────────────────────────────────────

/**
 * Aktualizuje rekord po wygenerowaniu DOCX przez Edge Function.
 * Ustawia file_docx, version_number i edited_at.
 */
export function useSaveModeBWorkingCopy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveWorkingCopyInput): Promise<void> => {
      return saveWorkingCopy(input);
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: ['document_instances'] });
      queryClient.invalidateQueries({ queryKey: ['document_instance', input.instanceId] });
    },
  });
}

// ── useMarkModeBReady ─────────────────────────────────────────────────────────

/**
 * Zmienia status instancji na 'ready' (gotowy do wysłania).
 */
export function useMarkModeBReady() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (instanceId: string): Promise<void> => {
      return markAsReady(instanceId);
    },
    onSuccess: (_data, instanceId) => {
      queryClient.invalidateQueries({ queryKey: ['document_instances'] });
      queryClient.invalidateQueries({ queryKey: ['document_instance', instanceId] });
    },
  });
}

// ── useMarkModeBFinal ─────────────────────────────────────────────────────────

/**
 * Oznacza instancję jako 'final' (zaakceptowany przez klienta, nienaruszalny).
 */
export function useMarkModeBFinal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (instanceId: string): Promise<void> => {
      return markAsFinal(instanceId);
    },
    onSuccess: (_data, instanceId) => {
      queryClient.invalidateQueries({ queryKey: ['document_instances'] });
      queryClient.invalidateQueries({ queryKey: ['document_instance', instanceId] });
    },
  });
}

// ── useMarkModeBSent ──────────────────────────────────────────────────────────

/**
 * Oznacza instancję jako 'sent' i zapisuje sent_at.
 */
export function useMarkModeBSent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (instanceId: string): Promise<void> => {
      return markAsSent(instanceId);
    },
    onSuccess: (_data, instanceId) => {
      queryClient.invalidateQueries({ queryKey: ['document_instances'] });
      queryClient.invalidateQueries({ queryKey: ['document_instance', instanceId] });
    },
  });
}

// ── useModeBSignedDocxUrl ─────────────────────────────────────────────────────

/**
 * Pobiera signed URL do odczytu pliku DOCX z bucket document-masters.
 *
 * Enabled tylko gdy fileDocxPath jest niepusty.
 * TTL: 1 godzina (SIGNED_DOCX_TTL_SECONDS).
 * staleTime: 50 minut — URL jest ważny przez godzinę, odświeżamy z 10-minutowym marginesem.
 */
export function useModeBSignedDocxUrl(fileDocxPath: string | null | undefined) {
  return useQuery({
    queryKey: ['mode_b_signed_docx', fileDocxPath],
    enabled: !!fileDocxPath,
    staleTime: (SIGNED_DOCX_TTL_SECONDS - 600) * 1000, // 50 minut
    queryFn: async (): Promise<string> => {
      if (!fileDocxPath) throw new Error('Brak ścieżki pliku');
      return getSignedDocxAccess(fileDocxPath);
    },
  });
}

// ── useModeBSignedDocxDownload ────────────────────────────────────────────────

/**
 * Pobiera signed URL do pobrania pliku DOCX (Content-Disposition: attachment).
 *
 * Nie cachuje — każde wywołanie generuje nowy URL z headerem download.
 */
export function useModeBSignedDocxDownload() {
  return useMutation({
    mutationFn: async ({
      fileDocxPath,
      fileName,
    }: {
      fileDocxPath: string;
      fileName: string;
    }): Promise<string> => {
      return getSignedDocxDownload(fileDocxPath, fileName);
    },
  });
}

// ── useDeleteModeBWorkingCopy ─────────────────────────────────────────────────

/**
 * Usuwa instancję dokumentu Trybu B z DB i plik DOCX z Storage (cleanup).
 *
 * Obsługuje obydwa kroki: usunięcie rekordu z document_instances oraz
 * best-effort usunięcie pliku z bucket document-masters.
 *
 * Nie usuwa instancji o statusie 'final' — chroniona przed przypadkowym usunięciem.
 */
export function useDeleteModeBWorkingCopy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      instanceId,
      fileDocxPath,
      status,
    }: {
      instanceId: string;
      fileDocxPath: string | null;
      status: string | null;
    }): Promise<void> => {
      if (status === 'final') {
        throw new Error('Nie można usunąć dokumentu o statusie final');
      }

      const { error } = await supabase
        .from('document_instances')
        .delete()
        .eq('id', instanceId);

      if (error) {
        logger.error('[useDeleteModeBWorkingCopy] delete failed', { instanceId, error });
        throw new Error(`Nie udało się usunąć instancji: ${error.message}`);
      }

      // Best-effort: usuń plik z Storage (błąd nie blokuje operacji)
      if (fileDocxPath) {
        await deleteWorkingCopyFile(fileDocxPath);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document_instances'] });
    },
  });
}
