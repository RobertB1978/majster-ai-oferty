/**
 * document-mode-b.ts — PR-01 (Mode B Foundation)
 *
 * Typy i kontrakty TypeScript dla Trybu B (DOCX-based documents).
 *
 * Źródło prawdy dla DB: supabase/migrations/20260406100000_pr01_mode_b_master_templates.sql
 * Dokumentacja modelu: docs/MODE_B_FOUNDATION.md
 *
 * ZAKRES PR-01:
 *   - Tylko typy / kontrakty — brak logiki UI ani Edge Function
 *   - Typy są addytywne względem istniejących (Tryb A nie jest modyfikowany)
 *   - DocumentInstance z nowym polem source_mode i polami B zachowuje
 *     backward-compatibility z istniejącymi rekordami (nullable pola B)
 */

// ── SourceMode ────────────────────────────────────────────────────────────────

/**
 * Tryb generowania instancji dokumentu.
 *
 * mode_a — istniejący przepływ: szablony jako kod (src/data/documentTemplates.ts),
 *           jsPDF lub Edge Function generate-document-pdf. PR-17.
 * mode_b — nowy przepływ: master DOCX w storage, kopia robocza per instancja,
 *           renderowanie przez LibreOffice / Word. PR-01+.
 */
export type SourceMode = 'mode_a' | 'mode_b';

// ── QualityTier ───────────────────────────────────────────────────────────────

/**
 * Poziom jakości / wariant master template.
 * Odpowiada typowi ENUM quality_tier w bazie danych (Postgres).
 *
 * short_form — uproszczony wariant (mniej klauzul, szybsza obsługa)
 * standard   — standardowy wariant (pełna treść, typowy dla MŚP budowlanych)
 * premium    — rozbudowany wariant (szczegółowe klauzule, rekomendowany dla
 *              kontraktów >50 000 PLN lub z inwestorem instytucjonalnym)
 */
export type QualityTier = 'short_form' | 'standard' | 'premium';

// ── DocumentInstanceStatus ────────────────────────────────────────────────────

/**
 * Status cyklu życia instancji dokumentu w Trybie B.
 * NULL oznacza brak statusu (Tryb A lub instancja przed pierwszym zapisem).
 *
 * draft    — w trakcie edycji (kopia robocza DOCX)
 * ready    — zatwierdzony i gotowy do wysłania
 * sent     — wysłany do klienta
 * final    — zaakceptowany przez klienta (nienaruszalny)
 * archived — przeniesiony do archiwum (soft delete)
 */
export type DocumentInstanceStatus =
  | 'draft'
  | 'ready'
  | 'sent'
  | 'final'
  | 'archived';

// ── MasterTemplateCategory ────────────────────────────────────────────────────

/**
 * Kategoria master template — spójna z TemplateCategory w src/data/documentTemplates.ts
 * i CHECK constraint w DB.
 */
export type MasterTemplateCategory =
  | 'CONTRACTS'
  | 'PROTOCOLS'
  | 'ANNEXES'
  | 'COMPLIANCE'
  | 'OTHER';

// ── DocumentMasterTemplate ────────────────────────────────────────────────────

/**
 * Rekordy z tabeli document_master_templates.
 * Odpowiada schematowi z migracji 20260406100000_pr01_mode_b_master_templates.sql.
 *
 * Niezmienialność: użytkownicy mają TYLKO SELECT (is_active = true).
 * INSERT/UPDATE/DELETE wyłącznie przez service_role w Edge Functions (PR-02+).
 */
export interface DocumentMasterTemplate {
  id: string;
  template_key: string;
  name: string;
  category: MasterTemplateCategory;
  quality_tier: QualityTier;
  /** Ścieżka do nienaruszalnego wzorca DOCX w bucket 'document-masters'. NULL w PR-01. */
  docx_master_path: string | null;
  /** Ścieżka do podglądu PDF w bibliotece szablonów. NULL w PR-01. */
  preview_pdf_path: string | null;
  version: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── DocumentInstanceModeBFields ───────────────────────────────────────────────

/**
 * Pola dodane do document_instances w PR-01 dla Trybu B.
 * Wszystkie nullable dla backward-compatibility z rekordami Trybu A.
 *
 * Uwaga: pdf_path już istnieje na DocumentInstance (PR-17) i jest reużywane
 * jako ścieżka do finalnego PDF dla OBIE trybów — nie duplikujemy jako file_pdf.
 */
export interface DocumentInstanceModeBFields {
  /** Tryb generowania. Domyślnie 'mode_a' dla istniejących rekordów. */
  source_mode: SourceMode;
  /** Status cyklu życia (Tryb B). NULL dla Trybu A. */
  status: DocumentInstanceStatus | null;
  /** Wskaźnik na document_master_templates. NULL dla Trybu A. */
  master_template_id: string | null;
  /** Wersja master template utrwalona przy tworzeniu instancji. NULL dla Trybu A. */
  master_template_version: string | null;
  /** Ścieżka do kopii roboczej DOCX w bucket 'document-masters'. NULL do PR-02. */
  file_docx: string | null;
  /** Numer wersji roboczej dokumentu. Domyślnie 1. */
  version_number: number;
  /** Czas ostatniej edycji DOCX (Tryb B). NULL = nie edytowano. */
  edited_at: string | null;
  /** Czas wysłania do klienta (Tryb B). NULL = nie wysłano. */
  sent_at: string | null;
}

// ── Utility types ─────────────────────────────────────────────────────────────

/**
 * Dane potrzebne do utworzenia instancji dokumentu w Trybie B.
 * Używane przez hooki PR-03+.
 */
export interface CreateModeBInstanceInput {
  /** Klucz szablonu z document_master_templates.template_key — wymagany przez document_instances.template_key NOT NULL. */
  templateKey: string;
  masterTemplateId: string;
  masterTemplateVersion: string;
  projectId?: string | null;
  clientId?: string | null;
  offerId?: string | null;
  title?: string;
  qualityTier: QualityTier;
}

/**
 * Dane potrzebne do aktualizacji statusu instancji Trybu B.
 */
export interface UpdateModeBStatusInput {
  id: string;
  status: DocumentInstanceStatus;
  editedAt?: string;
  sentAt?: string;
}

// ── Type guard ────────────────────────────────────────────────────────────────

/**
 * Sprawdza czy instancja pochodzi z Trybu B.
 * Bezpieczne do użycia z istniejącymi rekordami (source_mode może być undefined
 * jeśli kolumna nie została jeszcze pobrana z DB).
 */
export function isModeBInstance(
  instance: { source_mode?: SourceMode | string | null },
): instance is { source_mode: 'mode_b' } {
  return instance.source_mode === 'mode_b';
}

/**
 * Sprawdza czy quality_tier ma poprawną wartość.
 */
export function isValidQualityTier(value: unknown): value is QualityTier {
  return value === 'short_form' || value === 'standard' || value === 'premium';
}
