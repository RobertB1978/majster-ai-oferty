import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Zap } from 'lucide-react';
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

export default function QuickEstimateWorkspace() {
  const navigate = useNavigate();

  // Start-choice dialog
  const [showStartChoice, setShowStartChoice] = useState(true);

  // Estimate state
  const [items, setItems] = useState<LineItem[]>([newLineItem()]);
  const [projectName, setProjectName] = useState('');
  const [clientId, setClientId] = useState('');
  const [vatEnabled, setVatEnabled] = useState(true);

  // Validation
  const [clientError, setClientError] = useState(false);
  const clientCardRef = useRef<HTMLDivElement>(null);

  // Save state
  const [saving, setSaving] = useState(false);

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
        price: template.default_price,
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
      price: item.price,
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
      toast.error('Dodaj co najmniej jedną pozycję z nazwą i ilością.');
      return;
    }

    if (!clientId) {
      setClientError(true);
      toast.error('Wybierz klienta przed zapisaniem wyceny.');
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
      if (!user) throw new Error('Brak sesji użytkownika');

      // Create project
      const { data: project, error: projErr } = await supabase
        .from('projects')
        .insert({
          project_name: projectName.trim() || 'Szybka wycena',
          client_id: clientId,
          user_id: user.id,
          status: 'Wycena w toku',
        })
        .select('id')
        .single();

      if (projErr) throw projErr;

      // Insert quote items
      const { error: itemsErr } = await supabase.from('quote_items').insert(
        validItems.map((item, idx) => ({
          project_id: project.id,
          name: item.name,
          quantity: item.qty,
          unit: item.unit,
          price: item.price,
          sort_order: idx,
        }))
      );

      if (itemsErr) throw itemsErr;

      toast.success('Wycena zapisana jako projekt!');
      navigate(`/app/jobs/${project.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Błąd zapisu: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  /* ── Render ────────────────────────────────────────────────── */

  return (
    <>
      <Helmet>
        <title>Szybka wycena | Majster.AI</title>
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
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary shrink-0">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </span>
              Szybka wycena
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Stwórz ofertę i wyślij do klienta bez opuszczania tej strony
            </p>
          </div>
        </div>

        {/* ── Two-column layout (1 col mobile, 3/1 desktop) ─────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">

          {/* Left: project name + line items */}
          <div className="space-y-4 min-w-0">
            {/* Project name */}
            <div className="space-y-1">
              <Label htmlFor="ws-pname">Nazwa wyceny</Label>
              <Input
                id="ws-pname"
                placeholder="np. Remont łazienki — Nowak"
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
