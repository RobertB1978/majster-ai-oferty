/**
 * modeBDocxService.ts — PR-05a (Mode B Base Contracts)
 *
 * Serwis wywołujący Edge Function generate-docx-mode-b.
 * Zwraca ścieżkę do wygenerowanego pliku DOCX.
 */

import { supabase } from '@/integrations/supabase/client';

export interface GenerateDocxInput {
  instanceId: string;
  templateKey: string;
  context?: {
    contractor?: {
      name?: string;
      address?: string;
      nip?: string;
      regon?: string;
      phone?: string;
      email?: string;
      representedBy?: string;
    };
    client?: {
      name?: string;
      address?: string;
      nip?: string;
      phone?: string;
      email?: string;
      representedBy?: string;
    };
    project?: {
      name?: string;
      address?: string;
      description?: string;
    };
    finance?: {
      totalAmountNet?: string;
      totalAmountGross?: string;
      vatRate?: string;
      currency?: string;
      advancePercent?: string;
      advanceAmountGross?: string;
    };
    dates?: {
      contractDate?: string;
      contractPlace?: string;
      startDate?: string;
      endDate?: string;
    };
  };
}

export interface GenerateDocxResult {
  fileDocxPath: string;
  versionNumber: number;
}

/**
 * Wywołuje Edge Function generate-docx-mode-b i zwraca ścieżkę DOCX.
 * Rzuca Error gdy generacja się nie powiodła.
 */
export async function generateModeBDocx(input: GenerateDocxInput): Promise<GenerateDocxResult> {
  const { data, error } = await supabase.functions.invoke<GenerateDocxResult>(
    'generate-docx-mode-b',
    { body: input },
  );

  if (error) {
    throw new Error(`Generowanie DOCX nieudane: ${error.message}`);
  }
  if (!data?.fileDocxPath) {
    throw new Error('Serwer nie zwrócił ścieżki pliku DOCX.');
  }

  return data;
}
