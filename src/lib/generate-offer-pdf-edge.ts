/**
 * generate-offer-pdf-edge — Frontend integration for the PDF Edge Function.
 *
 * Replaces browser-side jsPDF generation (offerPdfGenerator.ts) with a call
 * to the `generate-offer-pdf` Supabase Edge Function (roadmap §26.2).
 *
 * Flow:
 *   1. buildOfferPdfPayloadFromOffer() — load offer data from Supabase DB
 *   2. serializeOfferPdfPayload()      — convert Date → ISO strings (wire format)
 *   3. supabase.functions.invoke()     — call EF → receive binary PDF Blob
 *
 * The EF handles @react-pdf/renderer server-side.
 * Returned Blob has type 'application/pdf'.
 *
 * Roadmap §26 PDF Migration Milestone — PR 4 (Frontend Integration).
 */

import { supabase } from '@/integrations/supabase/client';
import { buildOfferPdfPayloadFromOffer } from './offerPdfPayloadBuilder';
import { serializeOfferPdfPayload } from './serialize-offer-pdf-payload';

/**
 * Generate an offer PDF via the `generate-offer-pdf` Supabase Edge Function.
 *
 * @param offerId  - UUID of the offer row in `offers` table
 * @param userId   - Authenticated user's UUID (used by payload builder for RLS)
 * @returns        - Blob of type 'application/pdf'
 * @throws         - If EF returns an error or an unexpected content type
 */
export async function generateOfferPdfEdge(
  offerId: string,
  userId: string,
): Promise<Blob> {
  // Build the in-memory payload (includes Date instances, company/client data)
  const payload = await buildOfferPdfPayloadFromOffer(offerId, userId);

  // Serialize to JSON-safe wire format (Date → ISO strings, schemaVersion: 1)
  const wirePayload = serializeOfferPdfPayload(payload);

  // Call Edge Function — returns binary PDF as Blob (application/pdf)
  const { data, error } = await supabase.functions.invoke('generate-offer-pdf', {
    body: wirePayload,
  });

  if (error) {
    throw new Error(`PDF generation failed: ${error.message}`);
  }

  if (!(data instanceof Blob)) {
    throw new Error('Unexpected response from generate-offer-pdf Edge Function');
  }

  return data;
}
