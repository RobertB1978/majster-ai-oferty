import type { TFunction } from 'i18next';

/**
 * Extracts a user-facing message from an API error using i18n error codes.
 *
 * Edge Functions return `{ error: { code: "ERROR_CODE", detail?: string } }`.
 * This helper maps `code` to a translated string via the `apiErrors` namespace,
 * falling back to a generic error message when the code is unrecognized.
 */
export function translateApiError(error: unknown, t: TFunction): string {
  // Standard structured error: { error: { code } }
  const code =
    (error as { error?: { code?: string } } | undefined)?.error?.code;
  if (code) {
    const translated = t(`apiErrors.${code}`, '');
    if (translated) return translated;
  }

  // Legacy flat error: { error: "some string" } — pass through as-is
  const flat = (error as { error?: string } | undefined)?.error;
  if (typeof flat === 'string' && flat.length > 0) {
    return flat;
  }

  return t('errors.generic');
}
