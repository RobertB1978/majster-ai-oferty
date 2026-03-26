/**
 * generateServerPdf — Edge Function PDF generation with jsPDF fallback.
 *
 * Calls the `generate-offer-pdf` Supabase Edge Function (§26.2) to produce
 * a prestige A4 PDF server-side via @react-pdf/renderer.
 *
 * If the Edge Function fails (network, timeout, 5xx), falls back to the
 * existing jsPDF client-side generator so users are never blocked.
 *
 * Roadmap §26 PDF Migration — PR 4 (Frontend Integration).
 */

import { supabase } from '@/integrations/supabase/client';
import { serializeOfferPdfPayload } from './serialize-offer-pdf-payload';
import { buildOfferPdfPayloadFromOffer } from './offerPdfPayloadBuilder';
import { generateOfferPdf as generateClientPdf } from './offerPdfGenerator';
import { logger } from './logger';
import type { OfferPdfPayload } from './offerDataBuilder';

/**
 * Generate a PDF for an offer, preferring server-side rendering.
 *
 * @param offerId - Offer UUID
 * @param userId - Current user UUID (for payload builder)
 * @returns Blob of the generated PDF
 */
export async function generateOfferPdfWithServer(
  offerId: string,
  userId: string,
): Promise<Blob> {
  // Build the browser-side payload (shared by both paths)
  const payload = await buildOfferPdfPayloadFromOffer(offerId, userId);

  // Try server-side first
  try {
    const blob = await callEdgeFunction(payload);
    logger.info('[generateServerPdf] Server-side PDF generated successfully');
    return blob;
  } catch (err) {
    logger.warn('[generateServerPdf] Server-side failed, falling back to jsPDF:', err);
  }

  // Fallback: client-side jsPDF
  return generateClientPdf(payload);
}

/**
 * Call the generate-offer-pdf Edge Function.
 * Throws on any non-200 response or network error.
 */
async function callEdgeFunction(payload: OfferPdfPayload): Promise<Blob> {
  const wirePayload = serializeOfferPdfPayload(payload);

  const { data, error } = await supabase.functions.invoke('generate-offer-pdf', {
    body: wirePayload,
  });

  if (error) {
    throw new Error(`Edge Function error: ${error.message}`);
  }

  // supabase.functions.invoke returns data as various types depending on content-type
  if (data instanceof Blob) {
    return data;
  }

  // If we got an ArrayBuffer, convert to Blob
  if (data instanceof ArrayBuffer) {
    return new Blob([data], { type: 'application/pdf' });
  }

  // If we got a Response-like object
  if (data && typeof data.arrayBuffer === 'function') {
    const buffer = await data.arrayBuffer();
    return new Blob([buffer], { type: 'application/pdf' });
  }

  throw new Error('Unexpected response type from Edge Function');
}
