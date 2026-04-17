import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProject } from '@/hooks/useProjects';
import { useProjectV2 } from '@/hooks/useProjectsV2';
import { useQuote, useSaveQuote, QuotePosition } from '@/hooks/useQuotes';
import { useCreateItemTemplate, ItemTemplate } from '@/hooks/useItemTemplates';
import { useAiSuggestions } from '@/hooks/useAiSuggestions';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { useVoiceQuote } from '@/hooks/useVoiceQuote';
import { useVoiceToText } from '@/hooks/useVoiceToText';
import { usePlanGate } from '@/hooks/usePlanGate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { Plus, Trash2, Save, Loader2, AlertCircle, Bookmark, Sparkles, CheckCircle2, Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';
import { TemplateSelector } from '@/components/quotes/TemplateSelector';
import { QuoteVersionsPanel } from '@/components/quotes/QuoteVersionsPanel';
import { QuoteSnapshot } from '@/hooks/useQuoteVersions';
import { VoiceInputButton } from '@/components/voice/VoiceInputButton';
import { parseDecimal } from '@/lib/numberParsing';

/** Minimal project shape consumed by this component (V2 and legacy normalised). */
interface QuoteProjectData {
  project_name: string;
}

/** Raw text entered by the user for numeric fields of a single item */
interface PositionInputs {
  qty: string;
  price: string;
}

const units = ['szt.', 'm²', 'm', 'mb', 'kg', 'l', 'worek', 'kpl.', 'godz.', 'dni'];

export default function QuoteEditor() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  // ── Project reads: try V2 first, fall back to legacy ──────────────────────
  const { data: projectV2, isLoading: v2Loading } = useProjectV2(id);
  const { data: projectLegacy, isLoading: legacyLoading } = useProject(
    !v2Loading && projectV2 == null ? id || '' : '',
  );
  const projectLoading = v2Loading || (!v2Loading && projectV2 == null && legacyLoading);
  const project: QuoteProjectData | null | undefined =
    v2Loading
      ? undefined
      : projectV2 != null
        ? { project_name: projectV2.title }
        : projectLegacy != null
          ? { project_name: projectLegacy.project_name }
          : null;

  const { data: existingQuote, isLoading: quoteLoading } = useQuote(id || '');
  const saveQuote = useSaveQuote();
  const createTemplate = useCreateItemTemplate();
  const aiSuggestions = useAiSuggestions();
  const voiceQuote = useVoiceQuote();
  const { checkFeature } = usePlanGate();
  const navigate = useNavigate();

  const [positions, setPositions] = useState<QuotePosition[]>([]);
  const [marginPercent, setMarginPercent] = useState(10);
  const [isInitialized, setIsInitialized] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [positionInputs, setPositionInputs] = useState<Record<string, PositionInputs>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);

  const { blocker } = useUnsavedChanges(isDirty);

  const {
    transcript: voiceTranscript,
    isListening: voiceIsListening,
    isSupported: voiceIsSupported,
    startListening: voiceStartListening,
    stopListening: voiceStopListening,
    resetTranscript: voiceResetTranscript,
  } = useVoiceToText({ language: 'pl-PL', continuous: false, interimResults: true });

  useEffect(() => {
    if (voiceTranscript && !voiceIsListening && !voiceQuote.isPending) {
      const text = voiceTranscript.trim();
      voiceResetTranscript();
      if (text.length >= 5) {
        voiceQuote.mutate(text, {
          onSuccess: (data) => {
            const newPositions = data.items.map((item) => ({
              id: crypto.randomUUID(),
              name: item.name,
              qty: item.qty,
              unit: item.unit,
              price: item.price,
              category: item.category,
            }));
            const newInputs: Record<string, { qty: string; price: string }> = {};
            newPositions.forEach((p) => {
              newInputs[p.id] = { qty: String(p.qty), price: String(p.price) };
            });
            setPositions((prev) => [...prev, ...newPositions]);
            setPositionInputs((prev) => ({ ...prev, ...newInputs }));
            setIsDirty(true);
            setSavedOnce(false);
            toast.success(t('voiceQuote.quoteCreated'));
          },
        });
      }
    }
  // voiceQuote.mutate is stable (TanStack mutation), intentionally excluded from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceTranscript, voiceIsListening]);

  useEffect(() => {
    if (existingQuote && !isInitialized) {
      setPositions(existingQuote.positions || []);
      setMarginPercent(Number(existingQuote.margin_percent) || 10);
      const inputs: Record<string, PositionInputs> = {};
      (existingQuote.positions || []).forEach((p: QuotePosition) => {
        inputs[p.id] = { qty: String(p.qty), price: String(p.price) };
      });
      setPositionInputs(inputs);
      setIsInitialized(true);
    }
  }, [existingQuote, isInitialized]);

  if (projectLoading || quoteLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!id) return <Navigate to="/app/projects" replace />;

  const addPosition = () => {
    const newPosition: QuotePosition = {
      id: crypto.randomUUID(),
      name: '',
      qty: 1,
      unit: 'szt.',
      price: 0,
      category: 'Materiał',
    };
    setPositions([...positions, newPosition]);
    setPositionInputs((prev) => ({ ...prev, [newPosition.id]: { qty: '1', price: '0' } }));
    setValidationErrors({});
    setIsDirty(true);
    setSavedOnce(false);
  };

  const addFromTemplate = (template: ItemTemplate) => {
    const newPosition: QuotePosition = {
      id: crypto.randomUUID(),
      name: template.name,
      qty: Number(template.default_qty),
      unit: template.unit,
      price: Number(template.default_price),
      category: template.category,
    };
    setPositions([...positions, newPosition]);
    setPositionInputs((prev) => ({
      ...prev,
      [newPosition.id]: {
        qty: String(Number(template.default_qty)),
        price: String(Number(template.default_price)),
      },
    }));
    toast.success(t('quotes.addedTemplate', { name: template.name }));
  };

  const saveAsTemplate = async (position: QuotePosition) => {
    if (!position.name.trim()) {
      toast.error(t('quotes.saveTemplateNameRequired'));
      return;
    }

    await createTemplate.mutateAsync({
      name: position.name,
      unit: position.unit,
      default_qty: position.qty,
      default_price: position.price,
      category: position.category,
      description: '',
    });
  };

  const updatePosition = (positionId: string, field: keyof QuotePosition, value: unknown) => {
    setPositions(positions.map(p =>
      p.id === positionId ? { ...p, [field]: value } : p
    ));
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${positionId}_${field}`];
      return newErrors;
    });
    setIsDirty(true);
    setSavedOnce(false);
  };

  const updateNumericInput = (
    positionId: string,
    field: 'qty' | 'price',
    rawValue: string,
  ) => {
    setPositionInputs((prev) => ({
      ...prev,
      [positionId]: { ...prev[positionId], [field]: rawValue },
    }));

    const parsed = parseDecimal(rawValue);
    if (parsed !== null) {
      updatePosition(positionId, field, parsed);
    } else {
      const label = field === 'qty' ? t('quotes.invalidQty') : t('quotes.invalidPrice');
      setValidationErrors((prev) => ({ ...prev, [`${positionId}_${field}`]: label }));
    }
  };

  const removePosition = (positionId: string) => {
    setPositions(positions.filter(p => p.id !== positionId));
    setIsDirty(true);
    setSavedOnce(false);
  };

  const validateQuote = (): boolean => {
    const errors: Record<string, string> = {};

    if (positions.length === 0) {
      toast.error(t('quotes.addAtLeastOne'));
      return false;
    }

    positions.forEach((pos) => {
      if (!pos.name.trim()) {
        errors[`${pos.id}_name`] = t('quotes.nameRequired');
      }
      if (pos.qty <= 0) {
        errors[`${pos.id}_qty`] = t('quotes.qtyGtZero');
      }
      if (pos.price < 0) {
        errors[`${pos.id}_price`] = t('quotes.priceNotNegative');
      }
    });

    if (marginPercent < 0 || marginPercent > 100) {
      errors['marginPercent'] = t('quotes.marginRange');
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error(t('quotes.fixErrors'));
      return false;
    }

    return true;
  };

  const summaryMaterials = positions
    .filter(p => p.category === 'Materiał')
    .reduce((sum, p) => sum + p.qty * p.price, 0);

  const summaryLabor = positions
    .filter(p => p.category === 'Robocizna')
    .reduce((sum, p) => sum + p.qty * p.price, 0);

  const subtotal = summaryMaterials + summaryLabor;
  const total = subtotal * (1 + marginPercent / 100);

  const currentSnapshot: QuoteSnapshot = {
    positions,
    summary_materials: summaryMaterials,
    summary_labor: summaryLabor,
    margin_percent: marginPercent,
    total,
  };

  const handleLoadVersion = (snapshot: QuoteSnapshot) => {
    setPositions(snapshot.positions);
    setMarginPercent(snapshot.margin_percent);
    const inputs: Record<string, PositionInputs> = {};
    snapshot.positions.forEach((p) => {
      inputs[p.id] = { qty: String(p.qty), price: String(p.price) };
    });
    setPositionInputs(inputs);
  };

  const handleAiSuggestions = async () => {
    if (!project) return;

    const existingPositions = positions.map(p => ({ name: p.name, category: p.category }));

    try {
      const suggestions = await aiSuggestions.mutateAsync({
        projectName: project.project_name,
        existingPositions
      });

      if (suggestions.length > 0) {
        const newPositions = suggestions.map(s => ({
          id: crypto.randomUUID(),
          name: s.name,
          qty: 1,
          unit: s.unit,
          price: s.price,
          category: s.category as 'Materiał' | 'Robocizna',
        }));

        setPositions([...positions, ...newPositions]);
        const newInputs: Record<string, PositionInputs> = {};
        newPositions.forEach((p) => {
          newInputs[p.id] = { qty: String(p.qty), price: String(p.price) };
        });
        setPositionInputs((prev) => ({ ...prev, ...newInputs }));
        toast.success(t('quotes.aiAdded', { count: suggestions.length }));
      } else {
        toast.info(t('quotes.noSuggestions'));
      }
    } catch {
      // Error handled by hook
    }
  };

  const handleSave = async () => {
    if (!validateQuote()) return;

    try {
      await saveQuote.mutateAsync({
        projectId: id,
        positions,
        marginPercent,
      });
      setIsDirty(false);
      setSavedOnce(true);
      navigate(`/app/projects/${id}`);
    } catch {
      // Error handled by hook
    }
  };

  const categoryLabel = (cat: string) =>
    cat === 'Materiał' ? t('templates.categories.material') : t('templates.categories.labor');

  return (
    <div className="space-y-6 animate-fade-in">
      <UnsavedChangesDialog blocker={blocker} />

      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/app/projects">{t('nav.projects')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={`/app/projects/${id}`}>{project?.project_name ?? '…'}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t('quotes.breadcrumbQuote')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl text-foreground type-title">
            {t('quotes.titleFor', { name: project?.project_name ?? '' })}
          </h1>
        </div>
        {/* Save-state indicator */}
        {savedOnce && !isDirty && (
          <span className="inline-flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            {t('saveState.saved')}
          </span>
        )}
        {isDirty && (
          <span className="inline-flex items-center gap-1.5 text-sm text-amber-700 dark:text-amber-400">
            {t('saveState.unsaved')}
          </span>
        )}
      </div>

      {/* Versions Panel */}
      <QuoteVersionsPanel
        projectId={id}
        currentSnapshot={currentSnapshot}
        onLoadVersion={handleLoadVersion}
      />

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button size="lg" onClick={addPosition}>
          <Plus className="mr-2 h-5 w-5" />
          {t('quotes.addPosition')}
        </Button>
        <TemplateSelector onSelectTemplate={addFromTemplate} />
        <Button
          size="lg"
          variant="outline"
          onClick={handleAiSuggestions}
          disabled={aiSuggestions.isPending}
        >
          {aiSuggestions.isPending ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-5 w-5" />
          )}
          {t('quotes.aiSuggestions')}
        </Button>
        {voiceIsSupported && (
          <Button
            size="lg"
            variant={voiceIsListening ? 'destructive' : 'outline'}
            onClick={() => {
              if (voiceIsListening) {
                voiceStopListening();
                return;
              }
              if (!checkFeature('voice')) return;
              voiceStartListening();
            }}
            disabled={voiceQuote.isPending}
            className={voiceIsListening ? 'animate-pulse' : undefined}
            aria-label={voiceIsListening ? t('voiceQuote.statusListening') : t('voiceQuote.title')}
          >
            {voiceQuote.isPending ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : voiceIsListening ? (
              <MicOff className="mr-2 h-5 w-5" />
            ) : (
              <Mic className="mr-2 h-5 w-5" />
            )}
            {voiceQuote.isPending
              ? t('voiceQuote.statusProcessing')
              : voiceIsListening
                ? t('voiceQuote.statusListening')
                : t('voiceQuote.title')}
          </Button>
        )}
      </div>

      {/* Positions */}
      <div className="space-y-4">
        {positions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                {t('quotes.noPositionsHint')}
              </p>
            </CardContent>
          </Card>
        ) : (
          positions.map((position, index) => (
            <Card key={position.id} className="animate-slide-in">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t('quotes.positionLabel', { n: index + 1 })}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() => saveAsTemplate(position)}
                      disabled={createTemplate.isPending}
                    >
                      <Bookmark className="mr-1 h-4 w-4" />
                      {t('quotes.saveTemplate')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-destructive hover:text-destructive"
                      onClick={() => removePosition(position.id)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      {t('common.delete')}
                    </Button>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-12">
                  <div className="sm:col-span-4">
                    <Label className="text-xs text-muted-foreground">{t('quotes.itemName')} *</Label>
                    <div className="flex gap-2">
                      <Input
                        value={position.name}
                        onChange={(e) => updatePosition(position.id, 'name', e.target.value)}
                        placeholder={t('szybkaWycena.itemPlaceholder')}
                        className={validationErrors[`${position.id}_name`] ? 'border-destructive' : ''}
                      />
                      <VoiceInputButton
                        onTranscript={(text) => updatePosition(position.id, 'name', position.name + ' ' + text)}
                      />
                    </div>
                    {validationErrors[`${position.id}_name`] && (
                      <p className="mt-1 text-xs text-destructive">{validationErrors[`${position.id}_name`]}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">{t('quotes.quantity')} *</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={positionInputs[position.id]?.qty ?? String(position.qty)}
                      onChange={(e) => updateNumericInput(position.id, 'qty', e.target.value)}
                      className={validationErrors[`${position.id}_qty`] ? 'border-destructive' : ''}
                    />
                    {validationErrors[`${position.id}_qty`] && (
                      <p className="mt-1 text-xs text-destructive">{validationErrors[`${position.id}_qty`]}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">{t('quotes.unit')}</Label>
                    <Select value={position.unit} onValueChange={(v) => updatePosition(position.id, 'unit', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">{t('quotes.unitPriceShort')}</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={positionInputs[position.id]?.price ?? String(position.price)}
                      onChange={(e) => updateNumericInput(position.id, 'price', e.target.value)}
                      className={validationErrors[`${position.id}_price`] ? 'border-destructive' : ''}
                    />
                    {validationErrors[`${position.id}_price`] && (
                      <p className="mt-1 text-xs text-destructive">{validationErrors[`${position.id}_price`]}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">{t('quotes.category')} *</Label>
                    <Select value={position.category} onValueChange={(v) => updatePosition(position.id, 'category', v as 'Materiał' | 'Robocizna')}>
                      <SelectTrigger>
                        <SelectValue>{categoryLabel(position.category)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{categoryLabel(cat)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-3 text-right text-sm font-medium">
                  {t('quotes.itemTotal')} <span className="text-primary">{(position.qty * position.price).toFixed(2)} zł</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{t('quotes.summary')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('quotes.materialsTotal')}</span>
            <span className="font-medium">{summaryMaterials.toFixed(2)} zł</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('quotes.laborTotal')}</span>
            <span className="font-medium">{summaryLabor.toFixed(2)} zł</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{t('quotes.marginPercent')}:</span>
            <div>
              <Input
                type="number"
                min="0"
                max="100"
                className={`w-24 ${validationErrors['marginPercent'] ? 'border-destructive' : ''}`}
                value={marginPercent}
                onChange={(e) => { setMarginPercent(parseFloat(e.target.value) || 0); setIsDirty(true); setSavedOnce(false); }}
              />
              {validationErrors['marginPercent'] && (
                <p className="mt-1 text-xs text-destructive">{validationErrors['marginPercent']}</p>
              )}
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>{t('quotes.totalAmount')}:</span>
              <span className="text-primary">{total.toFixed(2)} zł</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        size="lg"
        onClick={handleSave}
        className="w-full sm:w-auto"
        disabled={saveQuote.isPending}
      >
        {saveQuote.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <Save className="mr-2 h-5 w-5" />
        {t('quotes.saveQuote')}
      </Button>
    </div>
  );
}
