/**
 * Offer Follow-up Utilities - Phase 6C
 *
 * Logika klasyfikacji wysyłek ofert pod kątem follow-up.
 * Pomaga fachowcom określić, które oferty wymagają działania.
 */

/**
 * Kategorie follow-up dla wysyłek ofert
 */
export type FollowupCategory =
  | 'no_action_needed'              // Oferta zamknięta (zaakceptowana lub odrzucona)
  | 'followup_not_opened'           // Wymaga follow-up - oferta nie została otwarta
  | 'followup_opened_no_decision'   // Wymaga follow-up - otwarta, ale brak decyzji
  | 'fresh_recent';                 // Świeża oferta (wysłana niedawno)

/**
 * Minimalna struktura wysyłki oferty potrzebna do klasyfikacji
 */
export interface OfferSendLike {
  id: string;
  sent_at: string;                                              // Data wysyłki (format ISO)
  tracking_status: string | null;                               // Status: sent, opened, pdf_viewed, accepted, rejected
}

/**
 * Opcje konfiguracyjne dla klasyfikacji follow-up
 */
export interface FollowupOptions {
  daysNotOpened?: number;           // Ile dni czekamy na otwarcie (domyślnie 3)
  daysOpenedNoDecision?: number;    // Ile dni czekamy na decyzję po otwarciu (domyślnie 7)
  daysFresh?: number;               // Ile dni uznajemy ofertę za świeżą (domyślnie 2)
  now?: Date;                       // Data "teraz" (do testów, domyślnie Date.now())
}

/**
 * Klasyfikuje wysyłkę oferty do jednej z kategorii follow-up
 *
 * ZASADY KLASYFIKACJI:
 *
 * 1. no_action_needed (Zamknięta):
 *    - Status: "accepted" lub "rejected"
 *    - Nie wymaga żadnych działań
 *
 * 2. fresh_recent (Nowa, świeża):
 *    - Wysłana ≤ 2 dni temu
 *    - Status: "sent" lub "pdf_viewed"
 *    - Jeszcze za wcześnie na follow-up
 *
 * 3. followup_not_opened (Wymaga follow-up - nieotwarta):
 *    - Status: "sent" (email nie został otwarty)
 *    - Wysłana > X dni temu (domyślnie 3 dni)
 *    - AKCJA: Skontaktuj się z klientem
 *
 * 4. followup_opened_no_decision (Wymaga follow-up - otwarta, brak decyzji):
 *    - Status: "opened" lub "pdf_viewed" (klient widział ofertę)
 *    - Wysłana > Y dni temu (domyślnie 7 dni)
 *    - AKCJA: Zapytaj o decyzję
 *
 * @param send - Obiekt wysyłki oferty
 * @param options - Opcje konfiguracyjne (dni, data bazowa)
 * @returns Kategoria follow-up
 */
export function classifyOfferSendForFollowup(
  send: OfferSendLike,
  options?: FollowupOptions
): FollowupCategory {
  // Domyślne wartości
  const daysNotOpened = options?.daysNotOpened ?? 3;
  const daysOpenedNoDecision = options?.daysOpenedNoDecision ?? 7;
  const daysFresh = options?.daysFresh ?? 2;
  const now = options?.now ?? new Date();

  // Bezpieczeństwo: jeśli brak sent_at, traktuj jako zamkniętą
  if (!send.sent_at) {
    return 'no_action_needed';
  }

  const sentDate = new Date(send.sent_at);
  const daysSinceSent = Math.floor((now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));

  // REGUŁA 1: Oferta zamknięta (accepted lub rejected)
  if (send.tracking_status === 'accepted' || send.tracking_status === 'rejected') {
    return 'no_action_needed';
  }

  // REGUŁA 3: Oferta nie została otwarta (status: sent, > X dni)
  if (send.tracking_status === 'sent' && daysSinceSent > daysNotOpened) {
    return 'followup_not_opened';
  }

  // REGUŁA 4: Oferta otwarta, ale brak decyzji (status: opened/pdf_viewed, > Y dni)
  if (
    (send.tracking_status === 'opened' || send.tracking_status === 'pdf_viewed') &&
    daysSinceSent > daysOpenedNoDecision
  ) {
    return 'followup_opened_no_decision';
  }

  // REGUŁA 2: Świeża oferta (≤ daysFresh dni)
  if (daysSinceSent <= daysFresh) {
    return 'fresh_recent';
  }

  // Domyślnie: świeża oferta (fallback dla innych przypadków)
  return 'fresh_recent';
}

/**
 * Konfiguracja wyświetlania dla kategorii follow-up
 * Używane w UI do pokazania odpowiednich kolorów i etykiet
 */
export const FOLLOWUP_CATEGORY_CONFIG = {
  no_action_needed: {
    label: 'Zamknięta',
    description: 'Oferta zaakceptowana lub odrzucona',
    colorClass: 'bg-gray-500/10 text-gray-500',
  },
  fresh_recent: {
    label: 'Nowa',
    description: 'Wysłana niedawno (≤ 2 dni)',
    colorClass: 'bg-green-500/10 text-green-500',
  },
  followup_not_opened: {
    label: 'Do follow-up (nieotwarta)',
    description: 'Oferta nie została otwarta przez klienta',
    colorClass: 'bg-red-500/10 text-red-500',
  },
  followup_opened_no_decision: {
    label: 'Do follow-up (brak decyzji)',
    description: 'Klient widział ofertę, ale nie podjął decyzji',
    colorClass: 'bg-orange-500/10 text-orange-500',
  },
} as const;
