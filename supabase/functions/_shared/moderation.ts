/**
 * AI Output Moderation - Δ4 Security Baseline
 *
 * IMPORTANT LIMITATIONS — READ BEFORE USE:
 * ==========================================
 * This is a DETERMINISTIC HEURISTIC FILTER, NOT a full content-moderation
 * system.  It catches only patterns explicitly listed below.
 *
 * What it does:
 *   - Detects common prompt-injection attempt echoes in AI output
 *   - Detects residual HTML/script injection markers
 *   - Detects explicit harmful-content keywords (English + Polish)
 *
 * What it does NOT do:
 *   - Deep semantic understanding
 *   - Nuanced hate-speech / misinformation detection
 *   - Images / audio / multimodal content
 *   - Provider-level moderation API (see TODO below)
 *
 * TODO (tracked in docs/security/ai-safety.md):
 *   - When OpenAI is the configured provider, call the Moderation API
 *     (POST https://api.openai.com/v1/moderations) before returning output.
 *   - Anthropic and Google Gemini currently have no free public moderation
 *     endpoint — revisit when one becomes available.
 *
 * Issue reference: see docs/security/ai-safety.md §"Remaining TODOs"
 */

export interface ModerationResult {
  /** true = content is safe to return; false = content must be blocked */
  allowed: boolean;
  /** Human-readable reason when blocked (never exposed to end-users) */
  reason?: string;
}

// ---------------------------------------------------------------------------
// Pattern lists
// ---------------------------------------------------------------------------

/**
 * Patterns that suggest the AI echoed back / executed a prompt-injection
 * payload.  These are things no legitimate construction-advice response
 * should ever contain.
 */
const PROMPT_INJECTION_ECHO_PATTERNS: RegExp[] = [
  /IGNORE\s+(ALL\s+)?PREVIOUS\s+INSTRUCTIONS/i,
  /disregard\s+(all\s+)?(previous\s+|above\s+)?instructions/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /your\s+(new\s+|real\s+|true\s+)?instructions?\s+(are|is)\s*:/i,
  /\[SYSTEM\]/i,
  /<<SYS>>/,
  /\[INST\]/,
  /###\s*System:/i,
  /Act\s+as\s+(?:an?\s+)?(?:unfiltered|uncensored|DAN|evil)/i,
];

/**
 * Residual HTML / script injection markers that should have been stripped by
 * sanitizeAiOutput() but are checked here as an additional layer.
 */
const HTML_INJECTION_PATTERNS: RegExp[] = [
  /<script[\s>]/i,
  /javascript\s*:/i,
  /<iframe[\s>]/i,
  /<object[\s>]/i,
  /<embed[\s>]/i,
  /on\w+\s*=/i,
];

/**
 * Explicit harmful-content keywords (English + Polish).
 * Intentionally kept narrow to avoid false positives in a construction context.
 * Extend this list via the TODO process described in docs/security/ai-safety.md.
 */
const EXPLICIT_HARMFUL_PATTERNS: RegExp[] = [
  /how\s+to\s+(make|build|create)\s+(a\s+)?(bomb|explosive|weapon)/i,
  /jak\s+(zrobić|zbudować|stworzyć)\s+(bombę|materiały?\s+wybuchowe|broń)/i,
  /synthesize\s+\w+\s+(drug|poison|toxin)/i,
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Checks AI output against the heuristic filter.
 *
 * @param text - Sanitized AI output string
 * @returns ModerationResult
 */
export function moderateAiOutput(text: string | null | undefined): ModerationResult {
  if (!text || typeof text !== 'string') {
    return { allowed: true };
  }

  for (const pattern of PROMPT_INJECTION_ECHO_PATTERNS) {
    if (pattern.test(text)) {
      return {
        allowed: false,
        reason: `Prompt injection echo detected: ${pattern.source}`,
      };
    }
  }

  for (const pattern of HTML_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return {
        allowed: false,
        reason: `HTML injection marker detected: ${pattern.source}`,
      };
    }
  }

  for (const pattern of EXPLICIT_HARMFUL_PATTERNS) {
    if (pattern.test(text)) {
      return {
        allowed: false,
        reason: `Explicit harmful content pattern: ${pattern.source}`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Safe fallback message returned to clients when output is blocked.
 * Intentionally generic — do NOT expose the moderation reason to end-users.
 */
export const MODERATION_BLOCKED_MESSAGE =
  'Przepraszam, nie mogę udzielić tej odpowiedzi. Spróbuj zadać inne pytanie.';
