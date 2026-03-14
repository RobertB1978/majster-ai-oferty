/**
 * offer-followup-calendar.test.ts — Pack 4
 *
 * Weryfikuje spójność logiki follow-up ofert z typami kalendarza:
 *
 * 1. Oferty wymagające follow-up są poprawnie klasyfikowane
 * 2. Zamknięte oferty (accepted/rejected) NIE wymagają follow-up
 * 3. Nowy typ wydarzenia "follow_up" istnieje w calendarTypes z poprawnym kolorem
 * 4. Status/reminder coherence: zaakceptowane/odrzucone oferty nie generują follow-up
 */

import { describe, it, expect } from 'vitest';
import { classifyOfferSendForFollowup, type OfferSendLike } from '@/lib/offerFollowupUtils';
import { eventTypeColors } from '@/components/calendar/calendarTypes';

const NOW = new Date('2026-03-14T12:00:00Z');

function makeSend(daysAgo: number, tracking_status: string | null): OfferSendLike {
  const d = new Date(NOW);
  d.setDate(d.getDate() - daysAgo);
  return { id: 'test', sent_at: d.toISOString(), tracking_status };
}

// ── 1. Oferty wymagające follow-up (followup_not_opened) ────────────────────

describe('classifyOfferSendForFollowup — oferty wymagające follow-up', () => {
  it('zwraca followup_not_opened dla oferty wysłanej >3 dni temu, nieotworzonej', () => {
    const send = makeSend(5, 'sent');
    expect(classifyOfferSendForFollowup(send, { now: NOW })).toBe('followup_not_opened');
  });

  it('zwraca followup_not_opened dla oferty wysłanej 10 dni temu, status sent', () => {
    const send = makeSend(10, 'sent');
    expect(classifyOfferSendForFollowup(send, { now: NOW })).toBe('followup_not_opened');
  });

  it('zwraca followup_opened_no_decision dla oferty otwartej >7 dni temu bez decyzji', () => {
    const send = makeSend(8, 'opened');
    expect(classifyOfferSendForFollowup(send, { now: NOW })).toBe('followup_opened_no_decision');
  });

  it('zwraca followup_opened_no_decision dla statusu pdf_viewed >7 dni temu', () => {
    const send = makeSend(9, 'pdf_viewed');
    expect(classifyOfferSendForFollowup(send, { now: NOW })).toBe('followup_opened_no_decision');
  });
});

// ── 2. Oferty NIE wymagające follow-up ──────────────────────────────────────

describe('classifyOfferSendForFollowup — oferty bez wymaganego follow-up', () => {
  it('zwraca no_action_needed dla oferty zaakceptowanej', () => {
    const send = makeSend(5, 'accepted');
    expect(classifyOfferSendForFollowup(send, { now: NOW })).toBe('no_action_needed');
  });

  it('zwraca no_action_needed dla oferty odrzuconej', () => {
    const send = makeSend(5, 'rejected');
    expect(classifyOfferSendForFollowup(send, { now: NOW })).toBe('no_action_needed');
  });

  it('zwraca no_action_needed dla zaakceptowanej oferty nawet gdy wysłana dawno temu', () => {
    const send = makeSend(30, 'accepted');
    expect(classifyOfferSendForFollowup(send, { now: NOW })).toBe('no_action_needed');
  });

  it('zwraca fresh_recent dla oferty wysłanej dzisiaj', () => {
    const send = makeSend(0, 'sent');
    expect(classifyOfferSendForFollowup(send, { now: NOW })).toBe('fresh_recent');
  });

  it('zwraca fresh_recent dla oferty wysłanej 2 dni temu', () => {
    const send = makeSend(2, 'sent');
    expect(classifyOfferSendForFollowup(send, { now: NOW })).toBe('fresh_recent');
  });
});

// ── 3. Typ "follow_up" w kalendarzu ─────────────────────────────────────────

describe('eventTypeColors — nowy typ follow_up', () => {
  it('typ follow_up istnieje w eventTypeColors', () => {
    expect(eventTypeColors).toHaveProperty('follow_up');
  });

  it('typ follow_up ma klasy kolorów violet', () => {
    const colors = eventTypeColors['follow_up'];
    expect(colors.bg).toContain('violet');
    expect(colors.dot).toContain('violet');
    expect(colors.border).toContain('violet');
  });

  it('istniejące typy nie zostały usunięte', () => {
    expect(eventTypeColors).toHaveProperty('deadline');
    expect(eventTypeColors).toHaveProperty('meeting');
    expect(eventTypeColors).toHaveProperty('reminder');
    expect(eventTypeColors).toHaveProperty('other');
  });
});

// ── 4. Spójność statusów — wygasające oferty ──────────────────────────────

describe('expiration handling — wygasające oferty mają wyższy priorytet od zamkniętych', () => {
  it('oferta odrzucona nie wymaga follow-up niezależnie od daty wysyłki', () => {
    // Nawet wysłana rok temu — jeśli rejected, nie ma co follow-upować
    const send = makeSend(365, 'rejected');
    const category = classifyOfferSendForFollowup(send, { now: NOW });
    expect(category).toBe('no_action_needed');
  });

  it('oferta przyjęta nie wymaga follow-up', () => {
    const send = makeSend(100, 'accepted');
    const category = classifyOfferSendForFollowup(send, { now: NOW });
    expect(category).toBe('no_action_needed');
  });

  it('świeża oferta (1 dzień) nie wymaga jeszcze follow-up', () => {
    const send = makeSend(1, 'sent');
    const category = classifyOfferSendForFollowup(send, { now: NOW });
    expect(category).toBe('fresh_recent');
  });
});
