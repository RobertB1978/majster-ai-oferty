/**
 * LegacyOfferRedirect — ARCH-06 (PR-CANON-06)
 *
 * Backward-compatible redirect wrapper for the 30-day migration window.
 * Routes /offer/:token and /oferta/:token here first; if a canonical
 * acceptance_links record exists for the same offer we redirect to /a/:token.
 * When no canonical link exists (old offers without acceptance_links) the
 * corresponding legacy component is rendered unchanged.
 *
 * Backend: resolve_legacy_to_canonical_token RPC (SECURITY DEFINER, anon-callable).
 * Legacy components are NOT modified — freeze philosophy maintained.
 */

import { Suspense, lazy, useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { PageLoader } from '@/components/layout/PageLoader';

const OfferApproval = lazy(() => import('./OfferApproval'));
const OfferPublicPage = lazy(() => import('./OfferPublicPage'));

export type LegacyFlow = 'offer' | 'oferta';

interface Props {
  flow: LegacyFlow;
}

type RedirectState = 'loading' | 'redirect' | 'fallback';

export default function LegacyOfferRedirect({ flow }: Props) {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<RedirectState>('loading');
  const [canonicalToken, setCanonicalToken] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setState('fallback'); return; }
    let cancelled = false;

    void supabase
      .rpc('resolve_legacy_to_canonical_token', { p_legacy_token: token })
      .then(({ data, error }) => {
        if (cancelled) return;
        const res = data as { canonical_token: string | null } | null;
        if (!error && res?.canonical_token) {
          setCanonicalToken(res.canonical_token);
          setState('redirect');
        } else {
          setState('fallback');
        }
      })
      .catch(() => { if (!cancelled) setState('fallback'); });

    return () => { cancelled = true; };
  }, [token]);

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (state === 'redirect' && canonicalToken) {
    return <Navigate to={`/a/${canonicalToken}`} replace />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      {flow === 'offer' ? <OfferApproval /> : <OfferPublicPage />}
    </Suspense>
  );
}
