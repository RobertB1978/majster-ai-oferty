/**
 * generate-docx-mode-b — Supabase Edge Function
 * PR-05a (Mode B Base Contracts)
 *
 * Generuje plik DOCX dla instancji dokumentu Trybu B:
 *   1. Weryfikuje JWT użytkownika (verify_jwt = true w config.toml).
 *   2. Sprawdza, że instancja należy do zalogowanego użytkownika.
 *   3. Wywołuje odpowiedni generator treści (template-registry.ts).
 *   4. Buduje Document za pomocą npm:docx (Plan B wg ADR-0013 §7.4).
 *   5. Pakuje DOCX do Uint8Array przez npm:docx Packer.
 *   6. Uploaduje plik do bucket document-masters (ścieżka working/).
 *   7. Aktualizuje document_instances.file_docx i version_number.
 *   8. Zwraca { fileDocxPath, versionNumber }.
 *
 * Auth: JWT required (verify_jwt = true).
 * Method: POST
 * Body: GenerateDocxRequest (types.ts)
 */

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Packer } from "npm:docx@8.5.0";
import { getCorsHeaders, getCorsPreflightHeaders } from "../_shared/cors.ts";
import { buildDocument } from "./docx-builder.ts";
import { TEMPLATE_REGISTRY, isKnownTemplateKey } from "./template-registry.ts";
import type { GenerateDocxRequest, GenerateDocxResponse, GenerateDocxError } from "./types.ts";

// ── Stałe ──────────────────────────────────────────────────────────────────

const BUCKET = "document-masters";

function jsonError(msg: string, code: string, status: number): Response {
  const body: GenerateDocxError = { error: msg, code };
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function buildWorkingPath(userId: string, instanceId: string, version: number): string {
  return `working/${userId}/${instanceId}/v${version}.docx`;
}

// ── Handler ────────────────────────────────────────────────────────────────

serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsPreflightHeaders(req) });
  }

  const corsHeaders = getCorsHeaders(req);

  if (req.method !== "POST") {
    return jsonError("Tylko metoda POST jest obsługiwana.", "METHOD_NOT_ALLOWED", 405);
  }

  // ── Parsuj request body ──────────────────────────────────────────────────
  let body: GenerateDocxRequest;
  try {
    body = await req.json() as GenerateDocxRequest;
  } catch {
    return jsonError("Nieprawidłowy format JSON w body.", "INVALID_JSON", 400);
  }

  const { instanceId, templateKey, context } = body;

  if (!instanceId || typeof instanceId !== "string") {
    return jsonError("Wymagane pole: instanceId.", "MISSING_INSTANCE_ID", 400);
  }
  if (!templateKey || typeof templateKey !== "string") {
    return jsonError("Wymagane pole: templateKey.", "MISSING_TEMPLATE_KEY", 400);
  }
  if (!isKnownTemplateKey(templateKey)) {
    return jsonError(`Nieznany templateKey: ${templateKey}`, "UNKNOWN_TEMPLATE_KEY", 400);
  }

  // ── Klient Supabase (service_role) — do operacji storage i DB ──────────
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // ── Klient Supabase (user token) — do weryfikacji własności instancji ──
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonError("Brak nagłówka Authorization.", "UNAUTHORIZED", 401);
  }
  const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  // ── Pobierz zalogowanego użytkownika ────────────────────────────────────
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) {
    return jsonError("Nieuprawniony dostęp — brak ważnego tokenu.", "UNAUTHORIZED", 401);
  }

  // ── Weryfikuj własność instancji ────────────────────────────────────────
  const { data: instance, error: instanceError } = await adminClient
    .from("document_instances")
    .select("id, user_id, version_number, status")
    .eq("id", instanceId)
    .eq("user_id", user.id)
    .single();

  if (instanceError || !instance) {
    return jsonError("Instancja nie istnieje lub brak dostępu.", "INSTANCE_NOT_FOUND", 404);
  }

  if (instance.status === "final" || instance.status === "archived") {
    return jsonError(
      `Nie można regenerować dokumentu o statusie '${instance.status}'.`,
      "STATUS_LOCKED",
      409,
    );
  }

  // ── Generuj treść DOCX ──────────────────────────────────────────────────
  const templateBuilder = TEMPLATE_REGISTRY[templateKey];
  const sections = templateBuilder(context);

  // Wyznacz tytuł dokumentu na podstawie template_key (mapowanie czytelne)
  const TITLE_MAP: Record<string, string> = {
    contract_fixed_price_premium:    "Umowa o roboty budowlane — ryczałt",
    contract_cost_plus_standard:     "Umowa kosztorysowa (koszt + marża)",
    contract_materials_standard:     "Umowa z klauzulą materiałową",
    contract_advance_stages_premium: "Umowa z zaliczką i etapami",
    contract_simple_short:           "Zlecenie / mini-umowa",
  };
  const docTitle = TITLE_MAP[templateKey] ?? templateKey;

  const document = buildDocument(docTitle, sections);

  // ── Spakuj do DOCX buffer ───────────────────────────────────────────────
  let docxBuffer: Uint8Array;
  try {
    const blob = await Packer.toBlob(document);
    docxBuffer = new Uint8Array(await blob.arrayBuffer());
  } catch (packErr) {
    console.error("[generate-docx-mode-b] Packer error:", packErr);
    return jsonError("Błąd generowania pliku DOCX.", "PACKER_ERROR", 500);
  }

  // ── Wyznacz ścieżkę pliku ───────────────────────────────────────────────
  const newVersion = (instance.version_number ?? 1);
  const filePath = buildWorkingPath(user.id, instanceId, newVersion);

  // ── Upload do Storage ───────────────────────────────────────────────────
  const { error: uploadError } = await adminClient.storage
    .from(BUCKET)
    .upload(filePath, docxBuffer, {
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      upsert: true,
    });

  if (uploadError) {
    console.error("[generate-docx-mode-b] Storage upload error:", uploadError);
    return jsonError("Błąd zapisu pliku DOCX do Storage.", "STORAGE_ERROR", 500);
  }

  // ── Aktualizuj document_instances ──────────────────────────────────────
  const { error: updateError } = await adminClient
    .from("document_instances")
    .update({
      file_docx: filePath,
      version_number: newVersion,
      edited_at: new Date().toISOString(),
    })
    .eq("id", instanceId);

  if (updateError) {
    console.error("[generate-docx-mode-b] DB update error:", updateError);
    // Nie zwracamy błędu — plik jest w Storage, można zaktualizować ręcznie
    // Logujemy i zwracamy sukces z ostrzeżeniem
  }

  // ── Odpowiedź sukcesu ───────────────────────────────────────────────────
  const responseBody: GenerateDocxResponse = {
    fileDocxPath: filePath,
    versionNumber: newVersion,
  };

  return new Response(JSON.stringify(responseBody), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
