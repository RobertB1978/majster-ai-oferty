/**
 * modeBFileFlow.ts — PR-03 (Mode B File Flow)
 *
 * Helpery dla Trybu B (DOCX-based documents):
 *   - Konwencja nazewnicza ścieżek plików (bucket document-masters)
 *   - Tworzenie rekordu kopii roboczej (working copy) w document_instances
 *   - Aktualizacja kopii roboczej po wygenerowaniu DOCX przez Edge Function
 *   - Oznaczenie instancji jako final
 *   - Bezpieczny dostęp (signed URL) do pliku DOCX
 *
 * ZAKRES PR-03:
 *   - Tylko helpery file flow — brak UI, brak Edge Function, brak nowych bibliotek
 *   - Addytywne — Tryb A nie jest dotykany
 *   - Źródło prawdy dla konwencji ścieżek plików Trybu B
 *
 * FLOW (skrót):
 *   1. createWorkingCopyRecord()  → rekord draft w DB (file_docx = null)
 *   2. Edge Function (PR-02)      → kopiuje master DOCX, zapisuje pod buildWorkingCopyPath()
 *   3. saveWorkingCopy()          → DB update: file_docx, version_number, edited_at
 *   4. markAsFinal()              → DB status = 'final'
 *   5. getSignedDocxAccess()      → signed URL (1h) do pobrania DOCX
 *
 * Szczegóły: docs/MODE_B_FILE_FLOW.md
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { CreateModeBInstanceInput, DocumentInstanceStatus } from '@/types/document-mode-b';

// ── Stałe ─────────────────────────────────────────────────────────────────────

/** Prywatny bucket Supabase Storage dla Trybu B. */
export const DOCUMENT_MASTERS_BUCKET = 'document-masters';

/** TTL signed URL dla kopii roboczej DOCX (odczyt). */
export const SIGNED_DOCX_TTL_SECONDS = 3600; // 1 godzina

/** TTL signed URL dla finalnej wersji dokumentu (odczyt). */
export const SIGNED_FINAL_TTL_SECONDS = 86_400; // 24 godziny

// ── Konwencja ścieżek plików ──────────────────────────────────────────────────

/**
 * Buduje ścieżkę do nienaruszalnego master DOCX w bucket document-masters.
 *
 * Format: masters/{template_key}/v{version}/{template_key}.docx
 *
 * Dostęp wyłącznie przez service_role (Edge Functions).
 * Użytkownicy nie mają bezpośredniego dostępu — brak polisy RLS SELECT na masters/*.
 *
 * @example
 * buildMasterDocxPath('contract_fixed_price_standard', '1.0')
 * // → 'masters/contract_fixed_price_standard/v1.0/contract_fixed_price_standard.docx'
 */
export function buildMasterDocxPath(templateKey: string, version: string): string {
  return `masters/${templateKey}/v${version}/${templateKey}.docx`;
}

/**
 * Buduje ścieżkę do kopii roboczej DOCX w bucket document-masters.
 *
 * Format: working/{user_id}/{instance_id}/v{version_number}.docx
 *
 * Dostęp user-scoped: właściciel może czytać i nadpisywać własne working copies.
 * Inkrementacja version_number tworzy nową ścieżkę bez nadpisywania poprzedniej wersji.
 *
 * @example
 * buildWorkingCopyPath('user-uuid', 'instance-uuid', 1)
 * // → 'working/user-uuid/instance-uuid/v1.docx'
 */
export function buildWorkingCopyPath(
  userId: string,
  instanceId: string,
  versionNumber: number,
): string {
  return `working/${userId}/${instanceId}/v${versionNumber}.docx`;
}

// ── Typy ──────────────────────────────────────────────────────────────────────

/**
 * Wynik operacji na document_instances dla Trybu B.
 * Minimalna projekcja — tylko pola potrzebne do file flow.
 */
export interface WorkingCopyRecord {
  id: string;
  user_id: string;
  template_key: string;
  master_template_id: string | null;
  master_template_version: string | null;
  file_docx: string | null;
  version_number: number;
  status: DocumentInstanceStatus | null;
  edited_at: string | null;
  created_at: string;
}

/**
 * Dane wejściowe do aktualizacji kopii roboczej po wygenerowaniu DOCX przez Edge Function.
 */
export interface SaveWorkingCopyInput {
  instanceId: string;
  /** Ścieżka do pliku DOCX w bucket document-masters (wynik buildWorkingCopyPath). */
  fileDocxPath: string;
  /** Nowy numer wersji (zazwyczaj poprzedni + 1). */
  newVersionNumber: number;
}

// ── Operacje na bazie danych ──────────────────────────────────────────────────

/**
 * Tworzy rekord document_instances dla workflow Trybu B.
 *
 * Wywołaj PRZED uruchomieniem Edge Function generującej DOCX.
 * Zwrócone `id` przekaż do Edge Function — posłuży do zbudowania
 * ścieżki pliku (buildWorkingCopyPath) i późniejszego wywołania saveWorkingCopy.
 *
 * file_docx jest NULL na starcie — Edge Function uzupełnia ścieżkę
 * po zapisaniu pliku w Storage (przez saveWorkingCopy lub bezpośrednio).
 */
export async function createWorkingCopyRecord(
  input: CreateModeBInstanceInput & { userId: string },
): Promise<WorkingCopyRecord> {
  const { data, error } = await supabase
    .from('document_instances')
    .insert({
      user_id: input.userId,
      project_id: input.projectId ?? null,
      client_id: input.clientId ?? null,
      offer_id: input.offerId ?? null,
      template_key: input.templateKey,
      template_version: input.masterTemplateVersion,
      locale: 'pl',
      title: input.title ?? null,
      data_json: {},
      references_json: [],
      source_mode: 'mode_b',
      status: 'draft',
      master_template_id: input.masterTemplateId,
      master_template_version: input.masterTemplateVersion,
      file_docx: null,
      version_number: 1,
    })
    .select(
      'id, user_id, template_key, master_template_id, master_template_version, file_docx, version_number, status, edited_at, created_at',
    )
    .single();

  if (error) {
    logger.error('[modeBFileFlow] createWorkingCopyRecord failed', error);
    throw new Error(`Nie udało się utworzyć rekordu kopii roboczej: ${error.message}`);
  }

  return data as WorkingCopyRecord;
}

/**
 * Aktualizuje rekord kopii roboczej po wygenerowaniu/zapisaniu pliku DOCX przez Edge Function.
 *
 * Ustawia:
 *   - file_docx = ścieżka do pliku w bucket document-masters
 *   - version_number = nowy numer wersji (zazwyczaj poprzedni + 1)
 *   - edited_at = now()
 *   - status = 'draft' (pozostaje draft do momentu ręcznego oznaczenia ready/final)
 */
export async function saveWorkingCopy(input: SaveWorkingCopyInput): Promise<void> {
  const { error } = await supabase
    .from('document_instances')
    .update({
      file_docx: input.fileDocxPath,
      version_number: input.newVersionNumber,
      edited_at: new Date().toISOString(),
    })
    .eq('id', input.instanceId);

  if (error) {
    logger.error('[modeBFileFlow] saveWorkingCopy failed', { instanceId: input.instanceId, error });
    throw new Error(`Nie udało się zapisać kopii roboczej: ${error.message}`);
  }
}

/**
 * Zmienia status instancji dokumentu na 'ready' (gotowy do wysłania).
 *
 * Status ready oznacza: użytkownik zakończył edycję, dokument jest gotowy do wysłania.
 * Można nadal cofnąć do draft, jeśli konieczna jest ponowna edycja.
 */
export async function markAsReady(instanceId: string): Promise<void> {
  const { error } = await supabase
    .from('document_instances')
    .update({ status: 'ready' })
    .eq('id', instanceId);

  if (error) {
    logger.error('[modeBFileFlow] markAsReady failed', { instanceId, error });
    throw new Error(`Nie udało się oznaczyć dokumentu jako gotowy: ${error.message}`);
  }
}

/**
 * Oznacza instancję dokumentu jako 'final' (zaakceptowany przez klienta, nienaruszalny).
 *
 * Po oznaczeniu final:
 *   - status = 'final'
 *   - Plik DOCX pozostaje pod tą samą ścieżką (file_docx), ale jest traktowany jako nienaruszalny
 *   - Logika aplikacji MUSI blokować modyfikacje instancji o statusie final
 *
 * Funkcja sprawdza, że instancja nie jest już archived (nie można przywrócić zarchiwizowanej).
 */
export async function markAsFinal(instanceId: string): Promise<void> {
  const { error } = await supabase
    .from('document_instances')
    .update({ status: 'final' })
    .eq('id', instanceId)
    .neq('status', 'archived');

  if (error) {
    logger.error('[modeBFileFlow] markAsFinal failed', { instanceId, error });
    throw new Error(`Nie udało się oznaczyć dokumentu jako final: ${error.message}`);
  }
}

/**
 * Oznacza instancję jako 'sent' i zapisuje znacznik czasu wysłania.
 *
 * Wywołaj po potwierdzeniu dostarczenia dokumentu do klienta
 * (e-mail, link, manualne przekazanie).
 */
export async function markAsSent(instanceId: string): Promise<void> {
  const { error } = await supabase
    .from('document_instances')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
    .eq('id', instanceId);

  if (error) {
    logger.error('[modeBFileFlow] markAsSent failed', { instanceId, error });
    throw new Error(`Nie udało się oznaczyć dokumentu jako wysłany: ${error.message}`);
  }
}

// ── Bezpieczny dostęp do plików ───────────────────────────────────────────────

/**
 * Generuje signed URL do odczytu kopii roboczej DOCX z bucket document-masters.
 *
 * Używaj do:
 *   - pobrania pliku przez użytkownika (download)
 *   - podglądu dokumentu przed finalizacją
 *
 * TTL domyślny: 1 godzina (SIGNED_DOCX_TTL_SECONDS).
 * Dla finalnych wersji użyj SIGNED_FINAL_TTL_SECONDS jako ttlSeconds.
 *
 * Retry: 1 ponowna próba przy niepowodzeniu (spójne z wzorcem useDossier).
 *
 * @throws Gdy wygenerowanie URL nie powiedzie się po 2 próbach.
 */
export async function getSignedDocxAccess(
  fileDocxPath: string,
  ttlSeconds: number = SIGNED_DOCX_TTL_SECONDS,
): Promise<string> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data, error } = await supabase.storage
      .from(DOCUMENT_MASTERS_BUCKET)
      .createSignedUrl(fileDocxPath, ttlSeconds);

    if (data?.signedUrl) return data.signedUrl;

    if (attempt === 0) {
      logger.warn('[modeBFileFlow] signed URL próba 1 nieudana, powtarzam', { fileDocxPath, error });
      continue;
    }

    logger.error('[modeBFileFlow] signed URL nieudana po retry', { fileDocxPath, error });
    throw new Error(
      `Generowanie signed URL nieudane dla ${fileDocxPath}: ${error?.message ?? 'nieznany błąd'}`,
    );
  }
  // unreachable — pętla zawsze kończy się przed tym miejscem (throw lub return)
  throw new Error('Nieoczekiwany stan w getSignedDocxAccess');
}

/**
 * Generuje signed URL do pobrania kopii roboczej DOCX z headerem Content-Disposition: attachment.
 *
 * Używaj gdy chcesz wymusić pobranie pliku przez przeglądarkę (nie podgląd).
 *
 * @param fileName - Nazwa pliku widoczna dla użytkownika przy pobieraniu (np. 'Umowa_projekt.docx').
 */
export async function getSignedDocxDownload(
  fileDocxPath: string,
  fileName: string,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(DOCUMENT_MASTERS_BUCKET)
    .createSignedUrl(fileDocxPath, SIGNED_DOCX_TTL_SECONDS, { download: fileName });

  if (!data?.signedUrl) {
    logger.error('[modeBFileFlow] signed download URL nieudana', { fileDocxPath, error });
    throw new Error(
      `Generowanie download URL nieudane dla ${fileDocxPath}: ${error?.message ?? 'nieznany błąd'}`,
    );
  }

  return data.signedUrl;
}

/**
 * Usuwa plik kopii roboczej z bucket document-masters.
 *
 * Wywołaj przy usuwaniu instancji dokumentu (cleanup storage).
 * Best-effort — błąd jest logowany, ale nie rzuca wyjątku
 * (spójne z wzorcem deleteDocumentInstance w useDocumentInstances).
 */
export async function deleteWorkingCopyFile(fileDocxPath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(DOCUMENT_MASTERS_BUCKET)
    .remove([fileDocxPath]);

  if (error) {
    logger.warn('[modeBFileFlow] deleteWorkingCopyFile failed (orphan file)', {
      fileDocxPath,
      error,
    });
  }
}
