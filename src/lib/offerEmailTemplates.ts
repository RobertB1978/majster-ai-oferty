/**
 * Offer Email Templates - Phase 6B
 *
 * Industry-specific email templates for construction offers.
 * Provides pre-filled email content based on project type.
 */

import i18n from '@/i18n';

/**
 * Placeholder types that can be used in templates
 */
export interface OfferEmailPlaceholders {
  client_name?: string;
  project_name?: string;
  total_price?: string;
  deadline?: string;
  company_name?: string;
  company_phone?: string;
}

/**
 * Email template definition
 */
export interface OfferEmailTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
}

/**
 * Built-in offer email templates for different construction industries
 */
export const OFFER_EMAIL_TEMPLATES: OfferEmailTemplate[] = [
  {
    id: 'general-construction',
    name: i18n.t('emailTemplates.generalConstruction.name'),
    description: i18n.t('emailTemplates.generalConstruction.description'),
    content: i18n.t('emailTemplates.generalConstruction.content'),
  },
  {
    id: 'renovation-finishing',
    name: i18n.t('emailTemplates.renovationFinishing.name'),
    description: i18n.t('emailTemplates.renovationFinishing.description'),
    content: i18n.t('emailTemplates.renovationFinishing.content'),
  },
  {
    id: 'plumbing',
    name: i18n.t('emailTemplates.plumbing.name'),
    description: i18n.t('emailTemplates.plumbing.description'),
    content: i18n.t('emailTemplates.plumbing.content'),
  },
  {
    id: 'electrical',
    name: i18n.t('emailTemplates.electrical.name'),
    description: i18n.t('emailTemplates.electrical.description'),
    content: i18n.t('emailTemplates.electrical.content'),
  },
];

/**
 * Get template by ID
 */
export function getTemplateById(templateId: string): OfferEmailTemplate | undefined {
  return OFFER_EMAIL_TEMPLATES.find((t) => t.id === templateId);
}

/**
 * Render email template with provided data
 * Replaces placeholders with actual values
 *
 * @param templateId - ID of the template to use
 * @param data - Data to fill placeholders
 * @returns Rendered email content with placeholders replaced
 */
export function renderOfferEmailTemplate(
  templateId: string,
  data: OfferEmailPlaceholders
): string {
  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  let content = template.content;

  // Replace placeholders with actual values or safe defaults
  const placeholders: Record<keyof OfferEmailPlaceholders, string> = {
    client_name: data.client_name || i18n.t('emailTemplates.placeholders.client'),
    project_name: data.project_name || i18n.t('emailTemplates.placeholders.project'),
    total_price: data.total_price || i18n.t('emailTemplates.placeholders.toComplete'),
    deadline: data.deadline || i18n.t('emailTemplates.placeholders.toComplete'),
    company_name: data.company_name || '',
    company_phone: data.company_phone || i18n.t('emailTemplates.placeholders.toComplete'),
  };

  // Replace all placeholders
  Object.entries(placeholders).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    content = content.split(placeholder).join(value);
  });

  return content;
}
