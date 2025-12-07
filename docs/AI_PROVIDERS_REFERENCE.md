# Majster.AI - Szczegółowa dokumentacja providerów AI

## Architektura systemu AI

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ AI Chat Agent│  │ Voice Quote  │  │ Photo Estimation     │  │
│  │ Component    │  │ Creator      │  │ Panel                │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
└─────────┼─────────────────┼──────────────────────┼──────────────┘
          │                 │                      │
          ▼                 ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE EDGE FUNCTIONS                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ai-chat-agent │  │voice-quote-  │  │analyze-photo         │  │
│  │              │  │processor     │  │                      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
│         └─────────────────┼──────────────────────┘              │
│                           ▼                                      │
│              ┌────────────────────────┐                         │
│              │  ai-provider.ts        │                         │
│              │  (Universal AI Client) │                         │
│              └───────────┬────────────┘                         │
└──────────────────────────┼──────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ OpenAI   │    │Anthropic │    │ Gemini   │
    │ API      │    │ Claude   │    │ API      │
    └──────────┘    └──────────┘    └──────────┘
```

## Moduł ai-provider.ts

### Lokalizacja
`supabase/functions/_shared/ai-provider.ts`

### Eksportowane funkcje

#### `detectAIProvider(): AIProviderConfig`
Automatycznie wykrywa skonfigurowanego providera na podstawie zmiennych środowiskowych.

```typescript
import { detectAIProvider } from '../_shared/ai-provider.ts';

const config = detectAIProvider();
console.log(config.provider); // 'openai' | 'anthropic' | 'gemini' | 'lovable'
```

#### `completeAI(options: AIRequestOptions): Promise<AIResponse>`
Główna funkcja do wykonywania zapytań AI. Automatycznie wybiera odpowiedni provider.

```typescript
import { completeAI } from '../_shared/ai-provider.ts';

const response = await completeAI({
  messages: [
    { role: 'system', content: 'Jesteś pomocnym asystentem.' },
    { role: 'user', content: 'Ile kosztuje malowanie pokoju?' }
  ],
  maxTokens: 1024,
  temperature: 0.7
});

console.log(response.content);
```

#### `handleAIError(error: Error): Response`
Helper do obsługi typowych błędów AI z odpowiednimi kodami HTTP.

```typescript
import { completeAI, handleAIError } from '../_shared/ai-provider.ts';

try {
  const response = await completeAI({ messages });
  return new Response(JSON.stringify(response));
} catch (error) {
  return handleAIError(error);
}
```

### Typy

```typescript
type AIProvider = 'lovable' | 'openai' | 'anthropic' | 'gemini';

interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | AIContentPart[];
}

interface AIContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

interface AIRequestOptions {
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
  tools?: any[];
  toolChoice?: any;
}

interface AIResponse {
  content: string;
  toolCalls?: any[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

---

## Porównanie providerów

### Wydajność i koszt

| Provider | Model | Szybkość | Koszt/1K tokenów | Jakość PL |
|----------|-------|----------|------------------|-----------|
| OpenAI | gpt-4o-mini | ⚡⚡⚡ | $0.15/$0.60 | ⭐⭐⭐⭐ |
| OpenAI | gpt-4o | ⚡⚡ | $2.50/$10.00 | ⭐⭐⭐⭐⭐ |
| Anthropic | claude-3-haiku | ⚡⚡⚡ | $0.25/$1.25 | ⭐⭐⭐⭐ |
| Anthropic | claude-3-5-sonnet | ⚡⚡ | $3.00/$15.00 | ⭐⭐⭐⭐⭐ |
| Gemini | gemini-2.5-flash | ⚡⚡⚡ | Free tier / $0.35 | ⭐⭐⭐⭐ |
| Gemini | gemini-2.5-pro | ⚡⚡ | $1.25/$5.00 | ⭐⭐⭐⭐⭐ |

### Możliwości

| Funkcja | OpenAI | Anthropic | Gemini |
|---------|--------|-----------|--------|
| Analiza obrazów | ✅ | ✅ | ✅ |
| Tool calling | ✅ | ✅ | ✅ |
| Streaming | ✅ | ✅ | ✅ |
| JSON mode | ✅ | ✅ | ✅ |
| Context window | 128K | 200K | 1M |
| Polski język | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

### Rekomendacje dla Majster.AI

**Dla małych firm (do 100 zapytań/dzień):**
- **Gemini 2.5 Flash** - darmowy tier, dobra jakość

**Dla średnich firm (100-1000 zapytań/dzień):**
- **OpenAI gpt-4o-mini** - najlepszy stosunek cena/jakość
- **Anthropic claude-3-haiku** - jeśli preferujesz Claude

**Dla dużych firm (>1000 zapytań/dzień):**
- **Gemini 2.5 Flash** - najniższy koszt przy dużej skali
- Rozważ własny fine-tuned model

---

## Przykłady użycia

### Podstawowe zapytanie tekstowe

```typescript
import { completeAI } from '../_shared/ai-provider.ts';

const response = await completeAI({
  messages: [
    { 
      role: 'system', 
      content: 'Jesteś ekspertem budowlanym. Odpowiadaj krótko i konkretnie.' 
    },
    { 
      role: 'user', 
      content: 'Jaki jest koszt ułożenia płytek na 10m2?' 
    }
  ],
  maxTokens: 500,
  temperature: 0.3
});
```

### Analiza obrazu

```typescript
const response = await completeAI({
  messages: [
    { 
      role: 'system', 
      content: 'Analizujesz zdjęcia pomieszczeń i oceniasz zakres prac remontowych.' 
    },
    { 
      role: 'user', 
      content: [
        { type: 'text', text: 'Co trzeba zrobić w tym pomieszczeniu?' },
        { type: 'image_url', image_url: { url: 'https://...' } }
      ]
    }
  ],
  maxTokens: 1500
});
```

### Wywołanie funkcji (Tool Calling)

```typescript
const response = await completeAI({
  messages: [
    { role: 'user', content: 'Zasugeruj pozycje do wyceny malowania pokoju' }
  ],
  tools: [
    {
      type: 'function',
      function: {
        name: 'suggest_items',
        description: 'Sugeruje pozycje do wyceny',
        parameters: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  unit: { type: 'string' },
                  price: { type: 'number' }
                }
              }
            }
          },
          required: ['items']
        }
      }
    }
  ],
  toolChoice: { type: 'function', function: { name: 'suggest_items' } }
});

if (response.toolCalls?.[0]) {
  const items = JSON.parse(response.toolCalls[0].function.arguments);
  console.log(items);
}
```

---

## Migracja istniejących Edge Functions

### Przed (z Lovable AI Gateway)

```typescript
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${LOVABLE_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'google/gemini-2.5-flash',
    messages,
    max_tokens: 2048,
  }),
});
```

### Po (z uniwersalnym ai-provider)

```typescript
import { completeAI, handleAIError } from '../_shared/ai-provider.ts';

try {
  const response = await completeAI({
    messages,
    maxTokens: 2048
  });
  
  return new Response(JSON.stringify({ content: response.content }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
} catch (error) {
  return handleAIError(error);
}
```

### Korzyści nowego podejścia

1. **Jeden kod, wielu providerów** - zmiana providera przez zmianę zmiennej środowiskowej
2. **Automatyczna detekcja** - nie trzeba modyfikować kodu przy zmianie providera
3. **Spójna obsługa błędów** - handleAIError obsługuje wszystkich providerów
4. **Łatwe testowanie** - można przełączać między providerami bez deployu

---

## Rate Limits i Koszty

### Limity darmowych tierów

| Provider | Limit | Okres |
|----------|-------|-------|
| Gemini | 15 req/min, 1500 req/dzień | Dzień |
| OpenAI | Brak darmowego tieru | - |
| Anthropic | $5 kredytów na start | Jednorazowo |

### Szacunkowe koszty miesięczne dla Majster.AI

| Scenariusz | Zapytań/mies. | Gemini | OpenAI (mini) | Anthropic (haiku) |
|------------|---------------|--------|---------------|-------------------|
| Mała firma | 500 | $0 (free) | ~$5 | ~$3 |
| Średnia firma | 3000 | ~$10 | ~$30 | ~$20 |
| Duża firma | 15000 | ~$50 | ~$150 | ~$100 |

---

## Troubleshooting

### Błąd: "No AI API key configured"

Sprawdź czy masz ustawioną jedną ze zmiennych:
```bash
supabase secrets list
```

Dodaj brakującą:
```bash
supabase secrets set OPENAI_API_KEY=sk-...
```

### Błąd: "RATE_LIMIT_EXCEEDED"

1. Poczekaj chwilę (1-60 sekund)
2. Rozważ upgrade planu u providera
3. Zaimplementuj retry z exponential backoff

### Błąd: "Invalid API Key"

1. Sprawdź czy klucz jest poprawny
2. Sprawdź czy klucz nie wygasł
3. Sprawdź czy masz odpowiednie uprawnienia

### Wolne odpowiedzi

1. Użyj szybszego modelu (haiku, mini, flash)
2. Zmniejsz maxTokens
3. Rozważ streaming dla długich odpowiedzi
