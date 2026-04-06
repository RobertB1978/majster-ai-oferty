/**
 * generate-mode-b-docx — PR-02 (Mode B DOCX Pilot)
 *
 * Generuje kopię roboczą DOCX dla instancji dokumentu Trybu B.
 * W PR-02 (pilot): DOCX budowany programatycznie z npm:docx.
 * W PR-03+: fetch master template z storage → fill with docxtemplater.
 *
 * Auth: JWT wymagany (verify_jwt = true w config.toml).
 *
 * Request:
 *   POST /functions/v1/generate-mode-b-docx
 *   Content-Type: application/json
 *   Body: { instance_id: string }
 *
 * Response (sukces):
 *   Content-Type: application/json
 *   Body: { signed_url: string; file_path: string; expires_in: number }
 *
 * Response (błąd):
 *   Content-Type: application/json
 *   Status: 400 / 403 / 404 / 500
 *   Body: { error: { code: string; detail: string } }
 *
 * Pola aktualizowane w document_instances po sukcesie:
 *   file_docx, status = 'draft', edited_at = now(), version_number += 1
 *
 * Storage:
 *   Bucket: document-masters (private)
 *   Ścieżka: working/{user_id}/{instance_id}.docx
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  BorderStyle,
} from "npm:docx@8.5.0";
import { getCorsHeaders, getCorsPreflightHeaders } from "../_shared/cors.ts";
import { ERROR_CODES, errorResponse } from "../_shared/error-codes.ts";

// ── Typy ──────────────────────────────────────────────────────────────────────

interface RequestBody {
  instance_id: string;
}

interface InstanceRow {
  id: string;
  user_id: string;
  template_key: string;
  data_json: Record<string, string>;
  master_template_id: string | null;
  version_number: number;
  file_docx: string | null;
}

interface MasterTemplateRow {
  id: string;
  template_key: string;
  name: string;
  quality_tier: string;
  version: string;
}

// ── Stałe ────────────────────────────────────────────────────────────────────

const BUCKET = "document-masters";
const SIGNED_URL_TTL = 3600; // 1 godzina

// Mapowanie wartości acceptance_result → etykieta PL
const ACCEPTANCE_RESULT_LABELS: Record<string, string> = {
  accepted: "Przyjęto bez zastrzeżeń",
  accepted_with_defects: "Przyjęto z zastrzeżeniami",
  rejected: "Odmowa odbioru",
};

// ── DOCX builder: Protokół odbioru końcowego ──────────────────────────────────

function buildProtocolFinalAcceptanceDocx(
  data: Record<string, string>,
  meta: { docNumber: string; templateVersion: string },
): Document {
  const d = (key: string, fallback = "—") => data[key]?.trim() || fallback;

  const acceptanceResultLabel =
    ACCEPTANCE_RESULT_LABELS[d("acceptance_result", "")] ||
    d("acceptance_result");

  const defectsDeadlineRow =
    d("defects_deadline", "") !== "—"
      ? [
          makeLabelValueRow(
            "Termin usunięcia usterek",
            d("defects_deadline"),
          ),
        ]
      : [];

  return new Document({
    creator: "Majster.AI — Tryb B",
    description: "Protokół odbioru końcowego robót budowlanych",
    title: "Protokół odbioru końcowego",
    sections: [
      {
        properties: {},
        children: [
          // ── Nagłówek ─────────────────────────────────────────────────
          new Paragraph({
            text: "PROTOKÓŁ ODBIORU KOŃCOWEGO",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({
                text: `Nr dok.: ${meta.docNumber}  |  wersja szablonu: ${meta.templateVersion}`,
                size: 18,
                color: "888888",
              }),
            ],
          }),

          // ── Strony umowy ──────────────────────────────────────────────
          makeSectionHeading("1. Strony"),
          makeDataTable([
            ["Wykonawca", d("contractor_name")],
            ["Telefon wykonawcy", d("contractor_phone")],
            ["Zamawiający", d("client_name")],
            ["Adres zamawiającego", d("client_address")],
          ]),
          new Paragraph({ text: "", spacing: { after: 240 } }),

          // ── Dane robót ────────────────────────────────────────────────
          makeSectionHeading("2. Przedmiot odbioru"),
          makeDataTable([
            ["Nazwa przedsięwzięcia", d("project_title")],
            ["Adres robót", d("project_address")],
            ["Zakres robót", d("scope_description")],
          ]),
          new Paragraph({ text: "", spacing: { after: 240 } }),

          // ── Wynik odbioru ─────────────────────────────────────────────
          makeSectionHeading("3. Wynik odbioru"),
          makeDataTable([
            ["Data odbioru", d("acceptance_date")],
            ["Wynik odbioru", acceptanceResultLabel],
            ["Stwierdzone usterki", d("defects_list", "brak")],
            ...defectsDeadlineRow,
            ["Okres gwarancji (miesięcy)", d("warranty_period_months", "24")],
          ]),
          new Paragraph({ text: "", spacing: { after: 400 } }),

          // ── Podpisy ───────────────────────────────────────────────────
          makeSectionHeading("4. Podpisy"),
          makeSignaturesTable(d("contractor_name"), d("client_name")),
          new Paragraph({ text: "", spacing: { after: 240 } }),

          // ── Stopka ────────────────────────────────────────────────────
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 400 },
            children: [
              new TextRun({
                text: "Wygenerowano przez Majster.AI — Tryb B (pilot)",
                size: 16,
                color: "AAAAAA",
              }),
            ],
          }),
        ],
      },
    ],
  });
}

// ── Helpery DOCX ──────────────────────────────────────────────────────────────

function makeSectionHeading(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
  });
}

function makeDataTable(rows: [string, string][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 35, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: label, bold: true, size: 20 }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 65, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: value, size: 20 })],
                }),
              ],
            }),
          ],
        }),
    ),
  });
}

function makeLabelValueRow(label: string, value: string): [string, string] {
  return [label, value];
}

function makeSignaturesTable(
  contractorName: string,
  clientName: string,
): Table {
  const sigCell = (name: string) =>
    new TableCell({
      width: { size: 50, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
      },
      children: [
        new Paragraph({
          children: [new TextRun({ text: name, bold: true, size: 20 })],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: "...................................................................",
          alignment: AlignmentType.CENTER,
          spacing: { before: 480, after: 80 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "podpis i pieczęć", size: 18, color: "888888" }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      ],
    });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [sigCell(contractorName), sigCell(clientName)],
      }),
    ],
  });
}

// ── Router szablonów ──────────────────────────────────────────────────────────
// PR-03+: każdy template_key ma własny builder lub fetchuje master z storage.

function buildDocxForTemplate(
  templateKey: string,
  data: Record<string, string>,
  meta: { docNumber: string; templateVersion: string },
): Document {
  if (templateKey.startsWith("protocol_final_acceptance")) {
    return buildProtocolFinalAcceptanceDocx(data, meta);
  }
  throw new Error(`Unsupported template_key in pilot: ${templateKey}`);
}

// ── Handler ───────────────────────────────────────────────────────────────────

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsPreflightHeaders(req) });
  }

  const corsHeaders = getCorsHeaders(req);

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // ── Auth ───────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return errorResponse(ERROR_CODES.INSTANCE_ACCESS_DENIED, 401, corsHeaders);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Client z JWT użytkownika — do weryfikacji własności instancji
  const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });

  // Client service_role — do storage upload + update instancji
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
  if (authError || !user) {
    return errorResponse(ERROR_CODES.INSTANCE_ACCESS_DENIED, 401, corsHeaders);
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: RequestBody;
  try {
    body = await req.json() as RequestBody;
  } catch {
    return errorResponse(ERROR_CODES.INVALID_REQUEST_BODY, 400, corsHeaders);
  }

  if (!body?.instance_id || typeof body.instance_id !== "string") {
    return errorResponse(ERROR_CODES.INVALID_REQUEST_BODY, 400, corsHeaders, "instance_id required");
  }

  // ── Fetch instancji ────────────────────────────────────────────────────────
  const { data: instance, error: instanceError } = await supabaseUser
    .from("document_instances")
    .select("id, user_id, template_key, data_json, master_template_id, version_number, file_docx")
    .eq("id", body.instance_id)
    .eq("user_id", user.id)  // RLS + explicit check
    .maybeSingle();

  if (instanceError || !instance) {
    return errorResponse(
      ERROR_CODES.INSTANCE_NOT_FOUND,
      404,
      corsHeaders,
      instanceError?.message,
    );
  }

  const row = instance as InstanceRow;

  // ── Fetch master template (dla meta) ──────────────────────────────────────
  let masterTemplate: MasterTemplateRow | null = null;
  if (row.master_template_id) {
    const { data: mt } = await supabaseAdmin
      .from("document_master_templates")
      .select("id, template_key, name, quality_tier, version")
      .eq("id", row.master_template_id)
      .maybeSingle();
    masterTemplate = mt as MasterTemplateRow | null;
  }

  // ── Generuj DOCX ──────────────────────────────────────────────────────────
  let docxBuffer: Uint8Array;
  try {
    const docNumber = `${row.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
    const templateVersion = masterTemplate?.version ?? "1.0";
    const doc = buildDocxForTemplate(
      row.template_key,
      row.data_json as Record<string, string>,
      { docNumber, templateVersion },
    );
    const buffer = await Packer.toBuffer(doc);
    docxBuffer = new Uint8Array(buffer);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return errorResponse(ERROR_CODES.DOCX_GENERATION_FAILED, 500, corsHeaders, msg);
  }

  // ── Upload do storage ──────────────────────────────────────────────────────
  const filePath = `working/${user.id}/${row.id}.docx`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filePath, docxBuffer, {
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      upsert: true,
    });

  if (uploadError) {
    return errorResponse(
      ERROR_CODES.STORAGE_UPLOAD_FAILED,
      500,
      corsHeaders,
      uploadError.message,
    );
  }

  // ── Aktualizuj instancję ───────────────────────────────────────────────────
  await supabaseAdmin
    .from("document_instances")
    .update({
      file_docx: filePath,
      status: "draft",
      edited_at: new Date().toISOString(),
      version_number: (row.version_number ?? 0) + 1,
    })
    .eq("id", row.id);

  // ── Signed URL ────────────────────────────────────────────────────────────
  const { data: signed, error: signedError } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(filePath, SIGNED_URL_TTL);

  if (signedError || !signed?.signedUrl) {
    // DOCX jest zapisany — zwracamy ścieżkę nawet bez signed URL
    return new Response(
      JSON.stringify({ signed_url: null, file_path: filePath, expires_in: 0 }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({
      signed_url: signed.signedUrl,
      file_path: filePath,
      expires_in: SIGNED_URL_TTL,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
