/**
 * useCreateOfferFromTemplate
 *
 * Creates a DRAFT offer pre-filled with items from an industry starter pack.
 * After creation navigates directly to the offer wizard for review/edit/send.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { offersKeys } from '@/hooks/useOffers';
import type { StarterPack } from '@/data/starterPacks';

export function useCreateOfferFromTemplate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const createFromTemplate = async (pack: StarterPack): Promise<void> => {
    if (!user) throw new Error('Not authenticated');

    setIsCreating(true);
    try {
      const totalNet =
        Math.round(
          pack.items.reduce((sum, item) => sum + item.qty * item.price, 0) * 100,
        ) / 100;

      // 1. Create DRAFT offer — persist template origin (Sprint D1)
      const { data: offer, error: offerErr } = await supabase
        .from('offers')
        .insert({
          user_id: user.id,
          title: pack.tradeName,
          status: 'DRAFT',
          total_net: totalNet,
          total_gross: totalNet,
          source_template_id: pack.id,
        })
        .select('id')
        .single();

      if (offerErr) throw offerErr;

      // 2. Insert items from the starter pack
      const rows = pack.items.map((item) => ({
        user_id: user.id,
        offer_id: offer.id,
        item_type: item.category === 'Materiał' ? 'material' : 'labor',
        name: item.name,
        unit: item.unit || null,
        qty: item.qty,
        unit_price_net: item.price,
        vat_rate: null,
        line_total_net: Math.round(item.qty * item.price * 100) / 100,
      }));

      const { error: itemsErr } = await supabase.from('offer_items').insert(rows);
      if (itemsErr) throw itemsErr;

      queryClient.invalidateQueries({ queryKey: offersKeys.all });
      navigate(`/app/offers/${offer.id}`);
    } finally {
      setIsCreating(false);
    }
  };

  return { createFromTemplate, isCreating };
}
