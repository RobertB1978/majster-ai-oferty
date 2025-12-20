/**
 * Email Templates - Phase 5A
 *
 * Centralized email template logic for offer sending.
 * Single source of truth for email subject and body generation.
 */

/**
 * Profile data needed for email templates
 */
export interface EmailProfileData {
  companyName?: string;
  emailSubjectTemplate?: string;
  emailGreeting?: string;
  emailSignature?: string;
  phone?: string;
}

/**
 * Generate email subject for offer
 * Supports template variables: {company_name}, {project_name}
 */
export function generateOfferEmailSubject(
  projectName: string,
  profile?: EmailProfileData
): string {
  const template = profile?.emailSubjectTemplate || 'Oferta od {company_name}';
  const companyName = profile?.companyName || 'Majster.AI';

  return template
    .replace('{company_name}', companyName)
    .replace('{project_name}', projectName);
}

/**
 * Generate email body for offer
 * Creates formatted message with project details, greeting, and signature
 */
export function generateOfferEmailBody(
  projectName: string,
  profile?: EmailProfileData
): string {
  const greeting = profile?.emailGreeting || 'Szanowny Kliencie,';
  const signature = profile?.emailSignature || 'Z poważaniem';
  const companyName = profile?.companyName || '';
  const phone = profile?.phone ? `Tel: ${profile.phone}` : '';

  const lines: string[] = [];
  lines.push(greeting);
  lines.push('');
  lines.push(`W załączeniu przesyłamy ofertę na projekt: ${projectName}.`);
  lines.push('');
  lines.push('Prosimy o zapoznanie się z ofertą i kontakt w razie pytań.');
  lines.push('');
  lines.push(signature);

  if (companyName) {
    lines.push(companyName);
  }
  if (phone) {
    lines.push(phone);
  }

  return lines.join('\n');
}

/**
 * Generate email body with PDF link (for Phase 5C)
 * Note: The PDF link is provided via `pdfUrl`; storage-backed generation is tracked separately.
 */
export function generateOfferEmailBodyWithPdf(
  projectName: string,
  pdfUrl: string,
  profile?: EmailProfileData
): string {
  const greeting = profile?.emailGreeting || 'Szanowny Kliencie,';
  const signature = profile?.emailSignature || 'Z poważaniem';
  const companyName = profile?.companyName || '';
  const phone = profile?.phone ? `Tel: ${profile.phone}` : '';

  const lines: string[] = [];
  lines.push(greeting);
  lines.push('');
  lines.push(`Przesyłamy ofertę na projekt: ${projectName}.`);
  lines.push('');
  lines.push(`Oferta dostępna jest pod linkiem: ${pdfUrl}`);
  lines.push('');
  lines.push('Prosimy o zapoznanie się z ofertą i kontakt w razie pytań.');
  lines.push('');
  lines.push(signature);

  if (companyName) {
    lines.push(companyName);
  }
  if (phone) {
    lines.push(phone);
  }

  return lines.join('\n');
}
