/**
 * Universal AI Provider Module for Majster.AI
 *
 * Supports multiple AI providers:
 * - OpenAI API (GPT-4, GPT-4o, GPT-3.5-turbo)
 * - Anthropic Claude API (claude-3-opus, claude-3-sonnet, claude-3-haiku)
 * - Google Gemini API (gemini-2.5-flash, gemini-2.5-pro)
 */

export type AIProvider = 'openai' | 'anthropic' | 'gemini';

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | AIContentPart[];
}

export interface AIContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

export interface AIRequestOptions {
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
  tools?: unknown[];
  toolChoice?: unknown;
}

export interface AIResponse {
  content: string;
  toolCalls?: unknown[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Default models for each provider
const DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-sonnet-20241022',
  gemini: 'gemini-2.5-flash',
};

// API endpoints for each provider
const API_ENDPOINTS: Record<AIProvider, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models',
};

/**
 * Detects the AI provider configuration from environment variables
 */
export function detectAIProvider(): AIProviderConfig {
  // Priority: OpenAI > Anthropic > Gemini

  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (openaiKey) {
    console.log('AI Provider: OpenAI detected');
    return { provider: 'openai', apiKey: openaiKey };
  }

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (anthropicKey) {
    console.log('AI Provider: Anthropic detected');
    return { provider: 'anthropic', apiKey: anthropicKey };
  }

  const geminiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_AI_API_KEY');
  if (geminiKey) {
    console.log('AI Provider: Google Gemini detected');
    return { provider: 'gemini', apiKey: geminiKey };
  }

  throw new Error('No AI API key configured. Set one of: OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY');
}

/**
 * Converts messages to Anthropic format
 */
function convertToAnthropicFormat(messages: AIMessage[]): { system: string; messages: unknown[] } {
  const systemMessage = messages.find(m => m.role === 'system');
  const otherMessages = messages.filter(m => m.role !== 'system');

  return {
    system: typeof systemMessage?.content === 'string' ? systemMessage.content : '',
    messages: otherMessages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: typeof m.content === 'string' ? m.content : m.content.map(part => {
        if (part.type === 'text') {
          return { type: 'text', text: part.text };
        }
        if (part.type === 'image_url' && part.image_url) {
          return {
            type: 'image',
            source: {
              type: 'url',
              url: part.image_url.url,
            },
          };
        }
        return part;
      }),
    })),
  };
}

/**
 * Converts messages to Gemini format
 */
function convertToGeminiFormat(messages: AIMessage[]): { contents: unknown[]; systemInstruction?: unknown } {
  const systemMessage = messages.find(m => m.role === 'system');
  const otherMessages = messages.filter(m => m.role !== 'system');

  const contents = otherMessages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: typeof m.content === 'string' 
      ? [{ text: m.content }]
      : m.content.map(part => {
          if (part.type === 'text') {
            return { text: part.text };
          }
          if (part.type === 'image_url' && part.image_url) {
            return {
              inlineData: {
                mimeType: 'image/jpeg',
                data: part.image_url.url.startsWith('data:') 
                  ? part.image_url.url.split(',')[1]
                  : part.image_url.url,
              },
            };
          }
          return { text: '' };
        }),
  }));

  return {
    contents,
    systemInstruction: systemMessage 
      ? { parts: [{ text: typeof systemMessage.content === 'string' ? systemMessage.content : '' }] }
      : undefined,
  };
}

/**
 * Makes a request to OpenAI-compatible API
 */
async function callOpenAICompatible(
  config: AIProviderConfig,
  options: AIRequestOptions
): Promise<AIResponse> {
  const model = config.model || DEFAULT_MODELS[config.provider];
  const endpoint = config.baseUrl || API_ENDPOINTS[config.provider];

  const body: Record<string, unknown> = {
    model,
    messages: options.messages,
    max_tokens: options.maxTokens || 2048,
  };

  if (options.temperature !== undefined) {
    body.temperature = options.temperature;
  }
  if (options.tools) {
    body.tools = options.tools;
  }
  if (options.toolChoice) {
    body.tool_choice = options.toolChoice;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`${config.provider} API error:`, response.status, errorText);
    
    if (response.status === 429) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }
    if (response.status === 402) {
      throw new Error('PAYMENT_REQUIRED');
    }
    throw new Error(`${config.provider} API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message;

  return {
    content: message?.content || '',
    toolCalls: message?.tool_calls,
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    } : undefined,
  };
}

/**
 * Makes a request to Anthropic Claude API
 */
async function callAnthropic(
  config: AIProviderConfig,
  options: AIRequestOptions
): Promise<AIResponse> {
  const model = config.model || DEFAULT_MODELS.anthropic;
  const { system, messages } = convertToAnthropicFormat(options.messages);

  const body: Record<string, unknown> = {
    model,
    max_tokens: options.maxTokens || 2048,
    system,
    messages,
  };

  if (options.temperature !== undefined) {
    body.temperature = options.temperature;
  }
  if (options.tools) {
    body.tools = options.tools.map(t => ({
      name: t.function?.name || t.name,
      description: t.function?.description || t.description,
      input_schema: t.function?.parameters || t.parameters,
    }));
  }

  const response = await fetch(API_ENDPOINTS.anthropic, {
    method: 'POST',
    headers: {
      'x-api-key': config.apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Anthropic API error:', response.status, errorText);
    
    if (response.status === 429) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }
    throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  // Extract content from Anthropic response
  let content = '';
  const toolCalls: unknown[] = [];

  for (const block of data.content || []) {
    if (block.type === 'text') {
      content += block.text;
    }
    if (block.type === 'tool_use') {
      toolCalls.push({
        id: block.id,
        type: 'function',
        function: {
          name: block.name,
          arguments: JSON.stringify(block.input),
        },
      });
    }
  }

  return {
    content,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    usage: data.usage ? {
      promptTokens: data.usage.input_tokens,
      completionTokens: data.usage.output_tokens,
      totalTokens: data.usage.input_tokens + data.usage.output_tokens,
    } : undefined,
  };
}

/**
 * Makes a request to Google Gemini API
 */
async function callGemini(
  config: AIProviderConfig,
  options: AIRequestOptions
): Promise<AIResponse> {
  const model = config.model || DEFAULT_MODELS.gemini;
  const { contents, systemInstruction } = convertToGeminiFormat(options.messages);

  const endpoint = `${API_ENDPOINTS.gemini}/${model}:generateContent?key=${config.apiKey}`;

  const generationConfig: Record<string, unknown> = {
    maxOutputTokens: options.maxTokens || 2048,
  };

  if (options.temperature !== undefined) {
    generationConfig.temperature = options.temperature;
  }

  const body: Record<string, unknown> = {
    contents,
    generationConfig,
  };

  if (systemInstruction) {
    body.systemInstruction = systemInstruction;
  }
  if (options.tools) {
    body.tools = [{
      functionDeclarations: options.tools.map(t => ({
        name: t.function?.name || t.name,
        description: t.function?.description || t.description,
        parameters: t.function?.parameters || t.parameters,
      })),
    }];
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', response.status, errorText);
    
    if (response.status === 429) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  
  let content = '';
  const toolCalls: unknown[] = [];

  for (const part of candidate?.content?.parts || []) {
    if (part.text) {
      content += part.text;
    }
    if (part.functionCall) {
      toolCalls.push({
        id: `call_${Date.now()}`,
        type: 'function',
        function: {
          name: part.functionCall.name,
          arguments: JSON.stringify(part.functionCall.args),
        },
      });
    }
  }

  return {
    content,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    usage: data.usageMetadata ? {
      promptTokens: data.usageMetadata.promptTokenCount || 0,
      completionTokens: data.usageMetadata.candidatesTokenCount || 0,
      totalTokens: data.usageMetadata.totalTokenCount || 0,
    } : undefined,
  };
}

/**
 * Universal AI completion function - automatically detects and uses the configured provider
 */
export async function completeAI(options: AIRequestOptions): Promise<AIResponse> {
  const config = detectAIProvider();
  
  switch (config.provider) {
    case 'openai':
      return callOpenAICompatible(config, options);
    case 'anthropic':
      return callAnthropic(config, options);
    case 'gemini':
      return callGemini(config, options);
    default:
      throw new Error(`Unknown AI provider: ${config.provider}`);
  }
}

/**
 * Helper to handle common AI error codes
 */
export function handleAIError(error: Error): Response {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (error.message === 'RATE_LIMIT_EXCEEDED') {
    return new Response(
      JSON.stringify({ error: 'Zbyt wiele zapytań. Poczekaj chwilę i spróbuj ponownie.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (error.message === 'PAYMENT_REQUIRED') {
    return new Response(
      JSON.stringify({ error: 'Limit zapytań AI wyczerpany. Skontaktuj się z administratorem.' }),
      { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // No AI provider configured — guide the operator to set an API key
  if (error.message.includes('No AI API key configured') || error.message.includes('OPENAI_API_KEY') || error.message.includes('ANTHROPIC_API_KEY') || error.message.includes('GEMINI_API_KEY')) {
    return new Response(
      JSON.stringify({
        error: 'AI_NOT_CONFIGURED',
        message: 'Asystent AI nie jest jeszcze skonfigurowany. Administrator musi ustawić klucz API (OPENAI_API_KEY, ANTHROPIC_API_KEY lub GEMINI_API_KEY) w ustawieniach Supabase Edge Functions.',
      }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.error('AI error:', error);
  return new Response(
    JSON.stringify({ error: `Błąd AI: ${error.message}` }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
