import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Calculator,
  Mic,
  Bot,
  Plus,
  Trash2,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Save,
} from 'lucide-react';
import { VoiceQuoteCreator } from '@/components/voice/VoiceQuoteCreator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/* ─────────────────────────── types ─────────────────────────────────────── */

interface LineItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  price: number;
}

/* ─────────────────────────── helpers ───────────────────────────────────── */

function newItem(): LineItem {
  return { id: crypto.randomUUID(), name: '', qty: 1, unit: 'szt', price: 0 };
}

function total(items: LineItem[]): number {
  return items.reduce((sum, i) => sum + i.qty * i.price, 0);
}

function fmt(n: number): string {
  return n.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ─────────────────────────── Manual tab ────────────────────────────────── */

interface ManualTabProps {
  items: LineItem[];
  setItems: React.Dispatch<React.SetStateAction<LineItem[]>>;
}

function ManualTab({ items, setItems }: ManualTabProps) {
  const { t } = useTranslation();

  const update = (id: string, field: keyof LineItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <div className="space-y-4">
      <div className="rounded-xl border overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1fr_80px_80px_100px_40px] gap-2 bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
          <span>{t('quickEstimate.item', 'Pozycja')}</span>
          <span>{t('quickEstimate.qty', 'Ilość')}</span>
          <span>{t('quickEstimate.unit', 'Jednostka')}</span>
          <span className="text-right">{t('quickEstimate.price', 'Cena')}</span>
          <span />
        </div>

        {items.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            {t('quickEstimate.empty', 'Brak pozycji. Dodaj pierwszą pozycję.')}
          </div>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            className="grid sm:grid-cols-[1fr_80px_80px_100px_40px] gap-2 px-4 py-2 border-t border-border items-center"
          >
            <Input
              placeholder={t('quickEstimate.itemPlaceholder', 'np. Kafelkowanie ściany')}
              value={item.name}
              onChange={(e) => update(item.id, 'name', e.target.value)}
              className="h-8 text-sm"
            />
            <Input
              type="number"
              min={0}
              value={item.qty}
              onChange={(e) => update(item.id, 'qty', parseFloat(e.target.value) || 0)}
              className="h-8 text-sm text-right"
            />
            <Input
              placeholder="m²"
              value={item.unit}
              onChange={(e) => update(item.id, 'unit', e.target.value)}
              className="h-8 text-sm"
            />
            <div className="relative">
              <Input
                type="number"
                min={0}
                value={item.price}
                onChange={(e) => update(item.id, 'price', parseFloat(e.target.value) || 0)}
                className="h-8 text-sm text-right pr-8"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                zł
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => remove(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setItems((prev) => [...prev, newItem()])}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        {t('quickEstimate.addItem', 'Dodaj pozycję')}
      </Button>
    </div>
  );
}

/* ─────────────────────────── AI tab ────────────────────────────────────── */

interface AiTabProps {
  onItemsGenerated: (items: LineItem[]) => void;
}

function AiTab({ onItemsGenerated }: AiTabProps) {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-quote-suggestions', {
        body: { description: prompt },
      });
      if (error) throw error;
      const suggestions: Array<{ name: string; qty: number; unit: string; price: number }> =
        data?.suggestions ?? data?.items ?? [];
      if (suggestions.length === 0) throw new Error('Brak pozycji w odpowiedzi AI');
      onItemsGenerated(
        suggestions.map((s) => ({
          id: crypto.randomUUID(),
          name: s.name,
          qty: s.qty ?? 1,
          unit: s.unit ?? 'szt',
          price: s.price ?? 0,
        }))
      );
      toast.success(t('quickEstimate.aiSuccess', 'AI wygenerowało wycenę!'));
      setPrompt('');
    } catch {
      toast.error(t('quickEstimate.aiError', 'Błąd AI. Spróbuj ponownie lub wpisz pozycje ręcznie.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex gap-3">
          <Bot className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            {t(
              'quickEstimate.aiHint',
              'Opisz zakres prac swoimi słowami. AI zaproponuje pozycje kosztorysowe. Możesz je potem edytować.'
            )}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label>{t('quickEstimate.aiPromptLabel', 'Opis prac')}</Label>
        <Textarea
          rows={5}
          placeholder={t(
            'quickEstimate.aiPromptPlaceholder',
            'np. Remont łazienki 8m²: kafelkowanie ścian, montaż kabiny prysznicowej, wymiana instalacji elektrycznej, malowanie sufitu.'
          )}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="resize-none"
        />
      </div>

      <Button
        className="w-full"
        disabled={!prompt.trim() || loading}
        onClick={handleGenerate}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Bot className="h-4 w-4 mr-2" />
        )}
        {loading
          ? t('quickEstimate.aiGenerating', 'Generuję wycenę…')
          : t('quickEstimate.aiGenerate', 'Generuj wycenę AI')}
      </Button>
    </div>
  );
}

/* ─────────────────────────── main page ─────────────────────────────────── */

export default function QuickEstimate() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState<LineItem[]>([newItem()]);
  const [projectName, setProjectName] = useState('');
  const [saving, setSaving] = useState(false);

  const grandTotal = total(items);
  const hasItems = items.some((i) => i.name.trim() && i.qty > 0);

  const handleVoiceCreated = (result: {
    projectName: string;
    items: Array<{ name: string; qty: number; unit: string; price: number }>;
  }) => {
    if (result.projectName) setProjectName(result.projectName);
    setItems(
      result.items.map((i) => ({
        id: crypto.randomUUID(),
        name: i.name,
        qty: i.qty,
        unit: i.unit,
        price: i.price,
      }))
    );
  };

  const handleSave = async () => {
    const validItems = items.filter((i) => i.name.trim() && i.qty > 0);
    if (validItems.length === 0) {
      toast.error(t('quickEstimate.noItems', 'Dodaj co najmniej jedną pozycję.'));
      return;
    }
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Brak sesji');

      const { data: project, error: projErr } = await supabase
        .from('projects')
        .insert({
          name: projectName.trim() || t('quickEstimate.defaultName', 'Szybka wycena'),
          user_id: user.id,
          status: 'Wycena',
        })
        .select('id')
        .single();
      if (projErr) throw projErr;

      await supabase.from('quote_items').insert(
        validItems.map((item, idx) => ({
          project_id: project.id,
          name: item.name,
          quantity: item.qty,
          unit: item.unit,
          price: item.price,
          sort_order: idx,
        }))
      );

      toast.success(t('quickEstimate.saved', 'Wycena zapisana!'));
      navigate(`/app/jobs/${project.id}`);
    } catch (err) {
      toast.error(String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('quickEstimate.title', 'Szybka Wycena')} | Majster.AI</title>
      </Helmet>

      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Calculator className="h-5 w-5 text-primary-foreground" />
            </div>
            {t('quickEstimate.title', 'Szybka Wycena')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t(
              'quickEstimate.subtitle',
              'Stwórz wycenę ręcznie, głosem lub z pomocą AI w kilka minut.'
            )}
          </p>
        </div>

        <div className="space-y-1">
          <Label htmlFor="pname">
            {t('quickEstimate.projectName', 'Nazwa projektu (opcjonalnie)')}
          </Label>
          <Input
            id="pname"
            placeholder={t(
              'quickEstimate.projectNamePlaceholder',
              'np. Remont łazienki — Nowak'
            )}
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="max-w-md"
          />
        </div>

        <Tabs defaultValue="manual" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manual" className="gap-2">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">{t('quickEstimate.manual', 'Ręcznie')}</span>
            </TabsTrigger>
            <TabsTrigger value="voice" className="gap-2">
              <Mic className="h-4 w-4" />
              <span className="hidden sm:inline">{t('quickEstimate.voice', 'Głosem')}</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">{t('quickEstimate.ai', 'AI')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
            <ManualTab items={items} setItems={setItems} />
          </TabsContent>

          <TabsContent value="voice">
            <div className="space-y-4">
              <VoiceQuoteCreator onQuoteCreated={handleVoiceCreated} />
              {hasItems && (
                <p className="text-sm text-success flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {t(
                    'quickEstimate.voiceLoaded',
                    'Pozycje załadowane — przejdź do zakładki Ręcznie, aby edytować.'
                  )}
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ai">
            <div className="space-y-4">
              <AiTab onItemsGenerated={setItems} />
              {hasItems && (
                <p className="text-sm text-success flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {t(
                    'quickEstimate.aiLoaded',
                    'Pozycje załadowane — sprawdź i edytuj w zakładce Ręcznie.'
                  )}
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {hasItems && (
          <Card className="border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {t('quickEstimate.summary', 'Podsumowanie wyceny')}
              </CardTitle>
              <CardDescription>
                {items.filter((i) => i.name.trim()).length}{' '}
                {t('quickEstimate.positions', 'pozycji')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/50 border p-4 flex items-center justify-between">
                <span className="font-medium">{t('quickEstimate.total', 'RAZEM')}</span>
                <span className="text-2xl font-bold text-primary">{fmt(grandTotal)} zł</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button className="flex-1" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {t('quickEstimate.save', 'Zapisz jako projekt')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button variant="outline" onClick={() => navigate('/app/jobs/new')}>
                  {t('quickEstimate.fullEditor', 'Pełny edytor')}
                </Button>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  Netto
                </Badge>
                {t(
                  'quickEstimate.vatNote',
                  'Cena netto. Dodaj VAT przed wysłaniem do klienta.'
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
