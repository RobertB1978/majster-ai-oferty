import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle2, Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ClientPicker } from '@/components/quickEstimate/ClientPicker';
import { StartChoicePanel } from '@/components/quickEstimate/StartChoicePanel';
import {
  WorkspaceLineItems,
  newLineItem,
} from '@/components/quickEstimate/WorkspaceLineItems';
import type { LineItem } from '@/components/quickEstimate/WorkspaceLineItems';
import { StickyTotalsCard } from '@/components/quickEstimate/StickyTotalsCard';
import type { ItemTemplate } from '@/hooks/useItemTemplates';
import type { StarterPack } from '@/data/starterPacks';
import { useQuickEstimateDraft } from '@/hooks/useQuickEstimateDraft';

export default function QuickEstimateWorkspace() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Starter pack passed from the trade onboarding flow
  const locationState = location.state as { pack?: StarterPack; skipStartChoice?: boolean } | null;
  const locationPack = locationState?.pack ?? null;
  const skipStartChoice = locationState?.skipStartChoice ?? false;

  // Start-choice dialog — skip if a pack was pre-selected via onboarding
  const [showStartChoice, setShowStartChoice] = useState(!skipStartChoice);

  // Estimate state — pre-populate from onboarding pack when available
  const [items, setItems] = useState<LineItem[]>(() => {
    if (locationPack) {
      return locationPack.items.map((item) => ({
        id: crypto.randomUUID(),
        name: item.name,
        qty: item.qty,
        unit: item.unit,
        priceMode: 'single' as const,
        price: item.price,
        laborCost: 0,
        materialCost: 0,
        marginPct: 0,
        showMargin: true,
        itemType: item.category === 'Materiał' ? ('material' as const) : ('labor' as const),
      }));
    }
    return [newLineItem()];
  });
  const [projectName, setProjectName] = useState('');
  const [clientId, setClientId] = useState('');
  const [vatEnabled, setVatEnabled] = useState(true);

  // Validation
  const [clientError, setClientError] = useState(false);
  const clientCardRef = useRef<HTMLDivElement>(null);

  // Save state
  const [saving, setSaving] = useState(false);

  // Draft persistence
  const { loadDraft, scheduleSave, promoteDraft, draftOfferId, lastSavedAt, saveStatus } =
    useQuickEstimateDraft();

  // Flag to prevent scheduling saves before draft is loaded
  const draftLoadedRef = useRef(false);

  /* ── Load draft on mount ────────────────────────────────────── */

  useEffect(() => {
    // Only restore from draft if no starter pack / navigation state was provided
    if (locationPack || skipStartChoice) {
      draftLoadedRef.current = true;
      return;
    }

    (async () => {
      const draft = await loadDraft();
      if (draft) {
        setProjectName(draft.projectName);
        setClientId(draft.clientId);
        setVatEnabled(draft.vatEnabled);
        if (draft.items.length > 0) {
          setItems(draft.items);
          setShowStartChoice(false); // skip start choice when resuming existing draft
        }
      }
      draftLoadedRef.current = true;
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Auto-save on state changes ─────────────────────────────── */

  useEffect(() => {
    if (!draftLoadedRef.current) return; // wait until draft has been loaded
    scheduleSave({ projectName, clientId, vatEnabled, items });
  }, [projectName, clientId, vatEnabled, items, scheduleSave]);

  /* ── Start choice handlers ─────────────────────────────────── */

  const handleTemplateSelect = useCallback((template: ItemTemplate) => {
    setItems((prev) => {
      // If the only existing item is blank, replace it; otherwise append
      const isOnlyBlank =
        prev.length === 1 && !prev[0].name.trim() && prev[0].price === 0;
      const newItem: LineItem = {
        id: crypto.randomUUID(),
        name: template.name,
        qty: template.default_qty,
        unit: template.unit,
        priceMode: 'single',
        price: template.default_price,
        laborCost: 0,
        materialCost: 0,
        marginPct: 0,
        showMargin: true,
        itemType: 'service',
      };
      return isOnlyBlank ? [newItem] : [...prev, newItem];
    });
    setShowStartChoice(false);
  }, []);

  const handlePackSelect = useCallback((pack: StarterPack) => {
    const packItems: LineItem[] = pack.items.map((item) => ({
      id: crypto.randomUUID(),
      name: item.name,
      qty: item.qty,
      unit: item.unit,
      priceMode: 'single' as const,
      price: item.price,
      laborCost: 0,
      materialCost: 0,
      marginPct: 0,
      showMargin: true,
      itemType: item.category === 'Materiał' ? 'material' : 'labor',
    }));
    // Replace blank slate with the full pack
    setItems(packItems);
    setShowStartChoice(false);
  }, []);

  const handleEmptyStart = useCallback(() => {
    setShowStartChoice(false);
  }, []);

  /* ── Client handling ───────────────────────────────────────── */

  const handleClientChange = (id: string) => {
    setClientId(id);
    setClientError(false);
  };

  /* ── Save ──────────────────────────────────────────────────── */

  const handleSave = async () => {
    const validItems = items.filter((i) => i.name.trim() && i.qty > 0);

    if (validItems.length === 0) {
      toast.error(t('szybkaWycena.noItemsError'));
      return;
    }

    if (!clientId) {
      setClientError(true);
      toast.error(t('szybkaWycena.noClientError'));
      // Scroll client card into view on mobile
      clientCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setClientError(false);
    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t('auth.errors.noSession', 'No user session'));

      // Step 1: Promote draft offer to SENT (or create new SENT offer if no draft yet).
      // This replaces the old `projects` + `quote_items` write which was invisible
      // to current product surfaces (Dashboard / ProjectsList / ProjectHub).
      const { offerId, netTotal } = await promoteDraft({
        projectName,
        clientId,
        vatEnabled,
        items: validItems,
      });

      // Step 2: Create a canonical v2_project linked to the finalized offer.
      // v2_projects is the single source of truth read by Dashboard, ProjectsList,
      // ProjectHub, Finance — the old `projects` table is not read by any V2 surface.
      const now = new Date().toISOString();
      const { data: v2Project, error: projErr } = await supabase
        .from('v2_projects')
        .insert({
          user_id: user.id,
          title: projectName.trim() || t('szybkaWycena.pageTitle'),
          client_id: clientId,
          source_offer_id: offerId,
          total_from_offer: netTotal,
          status: 'ACTIVE',
          progress_percent: 0,
          stages_json: [],
          budget_net: netTotal,
          budget_source: 'OFFER_NET',
          budget_updated_at: now,
        })
        .select('id')
        .single();

      if (projErr) throw projErr;

      toast.success(t('szybkaWycena.savedSuccess'));
      navigate(`/app/projects/${v2Project.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`${t('common.saveError', 'Save error:')} ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  /* ── Render ────────────────────────────────────────────────── */

  return (
    <>
      <Helmet>
        <title>{t('szybkaWycena.pageTitle')} | Majster.AI</title>
      </Helmet>

      {/* Start-choice modal */}
      <StartChoicePanel
        open={showStartChoice}
        onSelectTemplate={handleTemplateSelect}
        onSelectPack={handlePackSelect}
        onEmptyStart={handleEmptyStart}
      />

      {/* Main workspace — padded bottom on mobile for sticky bar */}
      <div className="max-w-5xl mx-auto space-y-5 animate-fade-in pb-28 lg:pb-6">

        {/* ── Page header ──────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/app/dashboard')}
            aria-label="Wróć do dashboardu"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary shrink-0">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </span>
              {t('szybkaWycena.pageTitle')}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t('szybkaWycena.subtitle')}
            </p>
          </div>

          {/* Draft save status indicator */}
          {draftOfferId && (
            <div
              className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground"
              data-testid="draft-save-status"
            >
              {saveStatus === 'saving' && (
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
              )}
              {saveStatus === 'saved' && lastSavedAt && (
                <>
                  <CheckCircle2 className="h-3 w-3 text-green-500" aria-hidden />
                  <span>
                    {t('szybkaWycena.draftSaved', 'Szkic zapisany')}{' '}
                    {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </>
              )}
              {saveStatus === 'error' && (
                <span className="text-destructive">
                  {t('szybkaWycena.draftSaveError', 'Błąd zapisu szkicu')}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Two-column layout (1 col mobile, 3/1 desktop) ─────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">

          {/* Left: project name + line items */}
          <div className="space-y-4 min-w-0">
            {/* Project name */}
            <div className="space-y-1">
              <Label htmlFor="ws-pname">{t('szybkaWycena.estimateName')}</Label>
              <Input
                id="ws-pname"
                placeholder={t('szybkaWycena.estimateNamePlaceholder')}
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>

            {/* Line items editor with VAT toggle */}
            <WorkspaceLineItems
              items={items}
              setItems={setItems}
              vatEnabled={vatEnabled}
              onToggleVat={() => setVatEnabled((v) => !v)}
            />
          </div>

          {/* Right sidebar: client picker + totals (desktop) */}
          <div className="space-y-4" ref={clientCardRef}>
            <ClientPicker
              value={clientId}
              onChange={handleClientChange}
              hasError={clientError}
            />

            {/* Totals card — desktop only */}
            <div className="hidden lg:block">
              <StickyTotalsCard
                items={items}
                vatEnabled={vatEnabled}
                onSave={handleSave}
                saving={saving}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky bottom bar — mobile only ─────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 py-3 shadow-lg">
        <StickyTotalsCard
          items={items}
          vatEnabled={vatEnabled}
          onSave={handleSave}
          saving={saving}
          compact
        />
      </div>
    </>
  );
}
