/**
 * Tests for Offer Follow-up Utilities - Phase 6C
 */

import { describe, it, expect } from 'vitest';
import { classifyOfferSendForFollowup, type OfferSendLike } from './offerFollowupUtils';

describe('classifyOfferSendForFollowup', () => {
  // Data bazowa dla testów: 2025-12-09 12:00:00
  const NOW = new Date('2025-12-09T12:00:00Z');

  // Helper do tworzenia obiektów testowych
  const createSend = (
    daysAgo: number,
    tracking_status: string | null
  ): OfferSendLike => {
    const sentDate = new Date(NOW);
    sentDate.setDate(sentDate.getDate() - daysAgo);

    return {
      id: 'test-id',
      sent_at: sentDate.toISOString(),
      tracking_status,
    };
  };

  describe('REGUŁA 1: no_action_needed (Zamknięta)', () => {
    it('powinien zwrócić no_action_needed dla statusu "accepted"', () => {
      const send = createSend(5, 'accepted');
      expect(classifyOfferSendForFollowup(send, { now: NOW })).toBe('no_action_needed');
    });

    it('powinien zwrócić no_action_needed dla statusu "rejected"', () => {
      const send = createSend(10, 'rejected');
      expect(classifyOfferSendForFollowup(send, { now: NOW })).toBe('no_action_needed');
    });

    it('powinien zwrócić no_action_needed dla statusu "accepted" nawet jeśli wysłane dawno', () => {
      const send = createSend(100, 'accepted');
      expect(classifyOfferSendForFollowup(send, { now: NOW })).toBe('no_action_needed');
    });

    it('powinien zwrócić no_action_needed gdy brak sent_at (bezpieczeństwo)', () => {
      const send: OfferSendLike = {
        id: 'test',
        sent_at: '',
        tracking_status: 'sent',
      };
      expect(classifyOfferSendForFollowup(send, { now: NOW })).toBe('no_action_needed');
    });
  });

  describe('REGUŁA 2: fresh_recent (Nowa, świeża)', () => {
    it('powinien zwrócić fresh_recent dla oferty wysłanej dzisiaj', () => {
      const send = createSend(0, 'sent');
      expect(classifyOfferSendForFollowup(send, { now: NOW })).toBe('fresh_recent');
    });

    it('powinien zwrócić fresh_recent dla oferty wysłanej wczoraj (1 dzień)', () => {
      const send = createSend(1, 'sent');
      expect(classifyOfferSendForFollowup(send, { now: NOW })).toBe('fresh_recent');
    });

    it('powinien zwrócić fresh_recent dla oferty wysłanej 2 dni temu', () => {
      const send = createSend(2, 'sent');
      expect(classifyOfferSendForFollowup(send, { now: NOW })).toBe('fresh_recent');
    });

    it('powinien zwrócić fresh_recent dla oferty pdf_viewed 2 dni temu', () => {
      const send = createSend(2, 'pdf_viewed');
      expect(classifyOfferSendForFollowup(send, { now: NOW })).toBe('fresh_recent');
    });

    it('powinien zwrócić fresh_recent dla oferty opened 1 dzień temu', () => {
      const send = createSend(1, 'opened');
      expect(classifyOfferSendForFollowup(send, { now: NOW })).toBe('fresh_recent');
    });
  });

  describe('REGUŁA 3: followup_not_opened (Wymaga follow-up - nieotwarta)', () => {
    it('powinien zwrócić followup_not_opened dla statusu "sent" i 4 dni (domyślny próg 3)', () => {
      const send = createSend(4, 'sent');
      expect(classifyOfferSendForFollowup(send, { now: NOW })).toBe('followup_not_opened');
    });

    it('powinien zwrócić followup_not_opened dla statusu "sent" i 10 dni', () => {
      const send = createSend(10, 'sent');
      expect(classifyOfferSendForFollowup(send, { now: NOW })).toBe('followup_not_opened');
    });

    it('powinien zwrócić fresh_recent dla statusu "sent" i 3 dni (na granicy)', () => {
      const send = createSend(3, 'sent');
      expect(classifyOfferSendForFollowup(send, { now: NOW })).toBe('fresh_recent');
    });

    it('powinien zwrócić followup_not_opened gdy daysNotOpened=5 i oferta ma 6 dni', () => {
      const send = createSend(6, 'sent');
      expect(classifyOfferSendForFollowup(send, { now: NOW, daysNotOpened: 5 })).toBe(
        'followup_not_opened'
      );
    });

    it('powinien zwrócić fresh_recent gdy daysNotOpened=5 i oferta ma 5 dni (na granicy)', () => {
      const send = createSend(5, 'sent');
      expect(classifyOfferSendForFollowup(send, { now: NOW, daysNotOpened: 5 })).toBe(
        'fresh_recent'
      );
    });
  });

  describe('REGUŁA 4: followup_opened_no_decision (Wymaga follow-up - otwarta, brak decyzji)', () => {
    it('powinien zwrócić followup_opened_no_decision dla statusu "opened" i 8 dni (domyślny próg 7)', () => {
      const send = createSend(8, 'opened');
      expect(classifyOfferSendForFollowup(send, { now: NOW })).toBe('followup_opened_no_decision');
    });

    it('powinien zwrócić followup_opened_no_decision dla statusu "pdf_viewed" i 10 dni', () => {
      const send = createSend(10, 'pdf_viewed');
      expect(classifyOfferSendForFollowup(send, { now: NOW })).toBe('followup_opened_no_decision');
    });

    it('powinien zwrócić fresh_recent dla statusu "opened" i 7 dni (na granicy)', () => {
      const send = createSend(7, 'opened');
      expect(classifyOfferSendForFollowup(send, { now: NOW })).toBe('fresh_recent');
    });

    it('powinien zwrócić followup_opened_no_decision gdy daysOpenedNoDecision=4 i oferta ma 5 dni', () => {
      const send = createSend(5, 'pdf_viewed');
      expect(
        classifyOfferSendForFollowup(send, { now: NOW, daysOpenedNoDecision: 4 })
      ).toBe('followup_opened_no_decision');
    });

    it('powinien zwrócić fresh_recent dla statusu "opened" i 5 dni (domyślny próg 7)', () => {
      const send = createSend(5, 'opened');
      expect(classifyOfferSendForFollowup(send, { now: NOW })).toBe('fresh_recent');
    });
  });

  describe('Przypadki brzegowe i fallback', () => {
    it('powinien zwrócić fresh_recent dla tracking_status=null i 1 dzień', () => {
      const send = createSend(1, null);
      expect(classifyOfferSendForFollowup(send, { now: NOW })).toBe('fresh_recent');
    });

    it('powinien zwrócić fresh_recent dla nieznanego statusu i 1 dzień', () => {
      const send = createSend(1, 'unknown_status');
      expect(classifyOfferSendForFollowup(send, { now: NOW })).toBe('fresh_recent');
    });

    it('powinien zwrócić fresh_recent dla tracking_status=null i 5 dni (fallback)', () => {
      const send = createSend(5, null);
      expect(classifyOfferSendForFollowup(send, { now: NOW })).toBe('fresh_recent');
    });

    it('powinien działać z domyślną datą (bez parametru now)', () => {
      // Tworzymy wysyłkę sprzed 1 dnia od TERAZ (faktycznej daty)
      const realNow = new Date();
      const yesterday = new Date(realNow);
      yesterday.setDate(yesterday.getDate() - 1);

      const send: OfferSendLike = {
        id: 'test',
        sent_at: yesterday.toISOString(),
        tracking_status: 'sent',
      };

      // Powinno zwrócić fresh_recent (1 dzień ≤ 2)
      expect(classifyOfferSendForFollowup(send)).toBe('fresh_recent');
    });
  });

  describe('Konfiguracja progi dni', () => {
    it('powinien respektować niestandardowy daysNotOpened', () => {
      const send = createSend(2, 'sent');
      expect(classifyOfferSendForFollowup(send, { now: NOW, daysNotOpened: 1 })).toBe(
        'followup_not_opened'
      );
    });

    it('powinien respektować niestandardowy daysOpenedNoDecision', () => {
      const send = createSend(4, 'opened');
      expect(
        classifyOfferSendForFollowup(send, { now: NOW, daysOpenedNoDecision: 3 })
      ).toBe('followup_opened_no_decision');
    });

    it('powinien używać obu progi jednocześnie', () => {
      const sentSend = createSend(2, 'sent');
      const openedSend = createSend(3, 'opened');

      expect(
        classifyOfferSendForFollowup(sentSend, {
          now: NOW,
          daysNotOpened: 1,
          daysOpenedNoDecision: 2,
        })
      ).toBe('followup_not_opened');

      expect(
        classifyOfferSendForFollowup(openedSend, {
          now: NOW,
          daysNotOpened: 1,
          daysOpenedNoDecision: 2,
        })
      ).toBe('followup_opened_no_decision');
    });
  });
});
