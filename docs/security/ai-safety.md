# AI Output Safety — Majster.AI Δ4

**Status:** Baseline implemented
**Date:** 2026-02-23
**Branch:** `claude/delta-04-ai-safety-bn49A`

---

## Overview

This document describes what Majster.AI does to prevent AI-generated content
from causing harm, and what remains as a TODO.

---

## 1. UI Safety

**Finding:** All AI output in the frontend is rendered via React JSX text
interpolation (`{message.content}`, `{insight}`, `{action}`, etc.). React
automatically HTML-escapes text nodes, so `<script>alert(1)</script>` renders
as the literal string, never as executable HTML.

**Components audited:**
| File | Render path | Safe? |
|------|-------------|-------|
| `src/components/ai/AiChatAgent.tsx:382` | `<p>{message.content}</p>` | ✅ JSX auto-escape |
| `src/components/finance/FinanceDashboard.tsx:261–303` | `<p>{insight}</p>`, `{action}`, `{risk}`, `{rec.reason}` | ✅ JSX auto-escape |
| `src/components/voice/VoiceQuoteCreator.tsx:261` | `{item.name}`, `{item.category}`, `{result.summary}` | ✅ JSX auto-escape |

**`dangerouslySetInnerHTML` audit:** Only one file uses it —
`src/components/ui/chart-internal.tsx:70` — for CSS custom-property injection
from static, application-controlled chart config. No AI output flows there.

---

## 2. Server-side Sanitization

**File:** `supabase/functions/_shared/sanitization.ts`
**Function:** `sanitizeAiOutput(text, maxLength?)`

### What it does

1. Strips **all HTML/XML tags** via `/<[^>]*>/g` replacement.
2. Removes `javascript:` URI scheme occurrences (post-tag-strip).
3. Removes `data:` URI scheme occurrences (XSS via `href`/`src`).
4. Enforces a maximum length (default 10 000 chars).

### Where it is applied

| Edge function | Fields sanitized |
|---------------|-----------------|
| `ai-chat-agent` | Full response string before return |
| `ai-quote-suggestions` | `name`, `unit`, `reasoning` per suggestion |
| `finance-ai-analysis` | All string arrays (`keyInsights`, `actionItems`, `riskFactors`, `losingAreas`, `profitableProjectTypes`) and `pricingRecommendations[].category`, `.reason` |
| `voice-quote-processor` | `projectName`, `summary`, `items[].name`, `items[].unit` |

### What it does NOT do

- Does not sanitize structured numeric fields (`price`, `qty`) — those are
  handled by `Number()` coercion + `Math.min/max` clamping.
- Does not decode HTML entities (e.g., `&lt;`) — these are harmless in plain
  text rendering contexts.

---

## 3. Moderation Baseline

**File:** `supabase/functions/_shared/moderation.ts`
**Function:** `moderateAiOutput(text): ModerationResult`

### What it is

A **deterministic heuristic keyword filter**. It is explicitly NOT a full
content-moderation system.

### Pattern categories

| Category | Examples caught |
|----------|----------------|
| Prompt-injection echo | `IGNORE ALL PREVIOUS INSTRUCTIONS`, `disregard previous instructions`, `you are now a [role]`, `[SYSTEM]`, `<<SYS>>`, `[INST]` |
| Residual HTML injection | `<script`, `javascript:`, `<iframe`, `<object`, `<embed`, `on*=` event handlers |
| Explicit harmful content | How-to instructions for bombs/explosives/weapons (EN + PL) |

### When output is blocked

The original AI response is replaced with the generic Polish message:
> *"Przepraszam, nie mogę udzielić tej odpowiedzi. Spróbuj zadać inne pytanie."*

The block reason is **only logged server-side** (`console.warn`). It is never
exposed to the client.

### Where it is applied

- `ai-chat-agent` only (the conversational endpoint with the widest attack
  surface). The structured-output functions (`ai-quote-suggestions`,
  `finance-ai-analysis`, `voice-quote-processor`) rely on JSON schema
  enforcement + field sanitization instead, since their AI tool-call outputs
  are constrained to specific fields.

### What it does NOT do

- Does not perform semantic analysis or detect hate speech, misinformation,
  or subtle harmful content.
- Does not check structured fields (numbers, enum values).
- Does not cover images or audio.

---

## 4. Remaining TODOs

### TODO-MOD-01: Provider-level Moderation API (OPEN)

**Priority:** P2
**Effort:** Small
**Description:**
When the configured AI provider is **OpenAI**, call the Moderation API
(`POST https://api.openai.com/v1/moderations`) before returning chat output.
OpenAI's moderation endpoint classifies content into categories (hate,
self-harm, violence, etc.) at no additional cost.

Anthropic and Google Gemini do not currently offer a public standalone
moderation API. Revisit when they do.

**Implementation sketch:**
```typescript
// In ai-chat-agent/index.ts, after getting rawResponse:
if (config.provider === 'openai') {
  const modRes = await fetch('https://api.openai.com/v1/moderations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: rawResponse }),
  });
  const modData = await modRes.json();
  if (modData.results?.[0]?.flagged) {
    return blockedResponse();
  }
}
```

### TODO-MOD-02: Extend Heuristic Filter for Polish harmful content (OPEN)

**Priority:** P3
**Description:** The current explicit-harmful-content list is English-heavy.
Add more Polish-language patterns for the most common harmful request types
relevant to the construction industry context.

### TODO-MOD-03: Audit `analyze-photo` and `ocr-invoice` functions (OPEN)

**Priority:** P2
**Description:** The `analyze-photo` and `ocr-invoice` edge functions also
call AI providers but were not in scope for Δ4. They should be audited and
`sanitizeAiOutput` applied to their free-text response fields.

---

## 5. What Was Explicitly Not Changed

- Frontend component rendering logic (no redesign)
- `chart-internal.tsx` — `dangerouslySetInnerHTML` is safe (CSS only, no AI data)
- Database migrations (none needed)
- RLS policies (not affected)
- `analyze-photo`, `ocr-invoice` functions (see TODO-MOD-03)

---

## 6. Rollback Plan

To revert this delta:

```bash
# Remove sanitization calls from edge functions
git revert <commit-sha>

# OR manually:
# 1. Remove sanitizeAiOutput import + calls from 4 edge functions
# 2. Remove moderateAiOutput import + calls from ai-chat-agent
# 3. Remove sanitizeAiOutput() from sanitization.ts
# 4. Delete moderation.ts
# 5. Delete this file and sanitization-ai.test.ts
```

The `sanitizeAiOutput` function is additive and does not affect existing
`sanitizeHtml` or `sanitizeUserInput` behavior.
