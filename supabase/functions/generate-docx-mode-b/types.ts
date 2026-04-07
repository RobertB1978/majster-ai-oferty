/**
 * types.ts — generate-docx-mode-b Edge Function
 * PR-05a (Mode B Base Contracts)
 *
 * Typy requestu i response dla generatora DOCX Trybu B.
 */

// ── Request ───────────────────────────────────────────────────────────────────

export interface GenerateDocxRequest {
  /** ID rekordu document_instances (musi należeć do zalogowanego usera). */
  instanceId: string;
  /** Klucz szablonu z document_master_templates.template_key. */
  templateKey: string;
  /** Opcjonalne dane kontekstowe do wstępnego wypełnienia placeholderów. */
  context?: DocxContext;
}

/** Dane kontekstowe przekazywane przez frontend do wstępnego wypełnienia dokumentu. */
export interface DocxContext {
  /** Dane wykonawcy (pobierane z profilu firmy). */
  contractor?: {
    name?: string;
    address?: string;
    nip?: string;
    regon?: string;
    phone?: string;
    email?: string;
    representedBy?: string;
  };
  /** Dane zamawiającego (z rekordu klienta). */
  client?: {
    name?: string;
    address?: string;
    nip?: string;
    phone?: string;
    email?: string;
    representedBy?: string;
  };
  /** Dane projektu. */
  project?: {
    name?: string;
    address?: string;
    description?: string;
  };
  /** Dane finansowe. */
  finance?: {
    totalAmountNet?: string;
    totalAmountGross?: string;
    vatRate?: string;
    currency?: string;
    advancePercent?: string;
    advanceAmountGross?: string;
  };
  /** Daty. */
  dates?: {
    contractDate?: string;
    contractPlace?: string;
    startDate?: string;
    endDate?: string;
  };
}

// ── Response ──────────────────────────────────────────────────────────────────

export interface GenerateDocxResponse {
  /** Ścieżka do wygenerowanego pliku w bucket document-masters. */
  fileDocxPath: string;
  /** Nowy numer wersji dokumentu. */
  versionNumber: number;
}

// ── Błędy ─────────────────────────────────────────────────────────────────────

export interface GenerateDocxError {
  error: string;
  code?: string;
}
