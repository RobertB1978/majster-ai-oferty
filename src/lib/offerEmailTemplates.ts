/**
 * Offer Email Templates - Phase 6B
 *
 * Industry-specific email templates for construction offers.
 * Provides pre-filled email content based on project type.
 */

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
    name: 'Budowlanka ogólna',
    description: 'Uniwersalny szablon dla projektów budowlanych',
    content: `Szanowny {client_name},

W odpowiedzi na Państwa zapytanie, przesyłamy ofertę na realizację projektu: {project_name}.

Wartość projektu: {total_price}
Szacowany termin realizacji: {deadline}

W załączeniu znajdą Państwo szczegółową wycenę wraz z opisem zakresu prac budowlanych. Cena obejmuje materiały, robociznę oraz transport.

Jesteśmy do Państwa dyspozycji w celu omówienia szczegółów oferty lub ewentualnych modyfikacji zakresu prac.

Oferta ważna przez 30 dni od daty wystawienia.

Pozostajemy do dyspozycji,
{company_name}
Tel: {company_phone}`,
  },
  {
    id: 'renovation-finishing',
    name: 'Remont / Wykończenie',
    description: 'Szablon dla prac wykończeniowych i remontowych',
    content: `Dzień dobry {client_name},

Dziękujemy za zainteresowanie naszymi usługami wykończeniowymi. Przygotowaliśmy dla Państwa ofertę na: {project_name}.

Wartość prac wykończeniowych: {total_price}
Planowany termin zakończenia: {deadline}

Oferta obejmuje kompleksowe wykończenie zgodnie z uzgodnionym zakresem. W cenie uwzględniliśmy wysokiej jakości materiały oraz profesjonalne wykonanie.

Szczegółowy opis pozycji i materiałów znajduje się w załączonym dokumencie PDF.

Chętnie odpowiemy na wszystkie pytania i dopasujemy ofertę do Państwa potrzeb.

Z poważaniem,
{company_name}
Tel: {company_phone}`,
  },
  {
    id: 'plumbing',
    name: 'Hydraulika',
    description: 'Szablon dla instalacji hydraulicznych',
    content: `Szanowny {client_name},

Przesyłamy ofertę na wykonanie instalacji hydraulicznej: {project_name}.

Wartość robót hydraulicznych: {total_price}
Termin wykonania: {deadline}

Oferta obejmuje:
• Projekt instalacji
• Dostawę materiałów i osprzętu
• Prace montażowe
• Próby szczelności i odbiór instalacji

Używamy wyłącznie sprawdzonych materiałów renomowanych producentów. Na wykonane prace udzielamy gwarancji.

Szczegółowy kosztorys znajdą Państwo w załączonym dokumencie.

Zapraszamy do kontaktu w celu ustalenia szczegółów.

Pozdrawiamy,
{company_name}
Tel: {company_phone}`,
  },
  {
    id: 'electrical',
    name: 'Elektryka',
    description: 'Szablon dla instalacji elektrycznych',
    content: `Szanowny {client_name},

Przedstawiamy ofertę na wykonanie instalacji elektrycznej: {project_name}.

Wartość robót elektrycznych: {total_price}
Planowany czas realizacji: {deadline}

Zakres prac obejmuje:
• Projektowanie układu elektrycznego
• Montaż instalacji zgodnie z normami
• Podłączenie urządzeń i osprzętu
• Pomiary i protokoły odbiorcze

Wszystkie prace wykonywane są przez uprawnione osoby, z użyciem atestowanych materiałów. Gwarantujemy zgodność z przepisami bezpieczeństwa.

Szczegóły techniczne i kosztorys w załączonym PDF.

Jesteśmy do Państwa dyspozycji.

Z poważaniem,
{company_name}
Tel: {company_phone}`,
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
    client_name: data.client_name || 'Kliencie',
    project_name: data.project_name || 'Projekt',
    total_price: data.total_price || '[do uzupełnienia]',
    deadline: data.deadline || '[do uzupełnienia]',
    company_name: data.company_name || '',
    company_phone: data.company_phone || '[do uzupełnienia]',
  };

  // Replace all placeholders
  Object.entries(placeholders).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    content = content.split(placeholder).join(value);
  });

  return content;
}
