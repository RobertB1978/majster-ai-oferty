import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '@/hooks/useProjects';
import { useQuote, useSaveQuote, QuotePosition } from '@/hooks/useQuotes';
import { useCreateItemTemplate, ItemTemplate } from '@/hooks/useItemTemplates';
import { useAiSuggestions } from '@/hooks/useAiSuggestions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Save, Loader2, AlertCircle, Bookmark, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { TemplateSelector } from '@/components/quotes/TemplateSelector';
import { QuoteVersionsPanel } from '@/components/quotes/QuoteVersionsPanel';
import { QuoteSnapshot } from '@/hooks/useQuoteVersions';
import { VoiceInputButton } from '@/components/voice/VoiceInputButton';

const units = ['szt.', 'm²', 'm', 'mb', 'kg', 'l', 'worek', 'kpl.', 'godz.', 'dni'];
const categories = ['Materiał', 'Robocizna'] as const;

export default function QuoteEditor() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading: projectLoading } = useProject(id!);
  const { data: existingQuote, isLoading: quoteLoading } = useQuote(id!);
  const saveQuote = useSaveQuote();
  const createTemplate = useCreateItemTemplate();
  const aiSuggestions = useAiSuggestions();
  const navigate = useNavigate();

  const [positions, setPositions] = useState<QuotePosition[]>([]);
  const [marginPercent, setMarginPercent] = useState(10);
  const [isInitialized, setIsInitialized] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existingQuote && !isInitialized) {
      setPositions(existingQuote.positions || []);
      setMarginPercent(Number(existingQuote.margin_percent) || 10);
      setIsInitialized(true);
    } else if (!quoteLoading && !existingQuote && !isInitialized) {
      setIsInitialized(true);
    }
  }, [existingQuote, quoteLoading, isInitialized]);

  if (projectLoading || quoteLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={() => navigate('/app/jobs')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Powrót
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Projekt nie został znaleziony.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
    setValidationErrors({});
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
    toast.success(`Dodano: ${template.name}`);
  };

  const saveAsTemplate = async (position: QuotePosition) => {
    if (!position.name.trim()) {
      toast.error('Podaj nazwę pozycji przed zapisaniem jako szablon');
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
  };

  const removePosition = (positionId: string) => {
    setPositions(positions.filter(p => p.id !== positionId));
  };

  const validateQuote = (): boolean => {
    const errors: Record<string, string> = {};

    if (positions.length === 0) {
      toast.error('Dodaj przynajmniej jedną pozycję');
      return false;
    }

    positions.forEach((pos) => {
      if (!pos.name.trim()) {
        errors[`${pos.id}_name`] = 'Nazwa jest wymagana';
      }
      if (pos.qty <= 0) {
        errors[`${pos.id}_qty`] = 'Ilość musi być > 0';
      }
      if (pos.price < 0) {
        errors[`${pos.id}_price`] = 'Cena nie może być ujemna';
      }
    });

    if (marginPercent < 0 || marginPercent > 100) {
      errors['marginPercent'] = 'Marża: 0-100%';
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error('Popraw błędy w formularzu');
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
        toast.success(`Dodano ${suggestions.length} sugestii AI`);
      } else {
        toast.info('Brak sugestii dla tego projektu');
      }
    } catch {
      // Error handled by hook
    }
  };

  const handleSave = async () => {
    if (!validateQuote()) return;

    try {
      await saveQuote.mutateAsync({
        projectId: id!,
        positions,
        marginPercent,
      });
      navigate(`/projects/${id}`);
    } catch {
      // Error handled by hook
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" onClick={() => navigate(`/projects/${id}`)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Powrót do projektu
      </Button>

      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Wycena — {project.project_name}
        </h1>
      </div>

      {/* Versions Panel */}
      <QuoteVersionsPanel 
        projectId={id!} 
        currentSnapshot={currentSnapshot}
        onLoadVersion={handleLoadVersion}
      />

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button size="lg" onClick={addPosition}>
          <Plus className="mr-2 h-5 w-5" />
          Dodaj pozycję
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
          AI Sugestie
        </Button>
      </div>

      {/* Positions */}
      <div className="space-y-4">
        {positions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                Brak pozycji. Kliknij "Dodaj pozycję" lub wybierz szablon.
              </p>
            </CardContent>
          </Card>
        ) : (
          positions.map((position, index) => (
            <Card key={position.id} className="animate-slide-in">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Pozycja #{index + 1}
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
                      Zapisz szablon
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-destructive hover:text-destructive"
                      onClick={() => removePosition(position.id)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Usuń
                    </Button>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-12">
                  <div className="sm:col-span-4">
                    <Label className="text-xs text-muted-foreground">Nazwa pozycji *</Label>
                    <div className="flex gap-2">
                      <Input
                        value={position.name}
                        onChange={(e) => updatePosition(position.id, 'name', e.target.value)}
                        placeholder="np. Płytki ceramiczne"
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
                    <Label className="text-xs text-muted-foreground">Ilość *</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={position.qty}
                      onChange={(e) => updatePosition(position.id, 'qty', parseFloat(e.target.value) || 0)}
                      className={validationErrors[`${position.id}_qty`] ? 'border-destructive' : ''}
                    />
                    {validationErrors[`${position.id}_qty`] && (
                      <p className="mt-1 text-xs text-destructive">{validationErrors[`${position.id}_qty`]}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">Jednostka</Label>
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
                    <Label className="text-xs text-muted-foreground">Cena jedn. (zł)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={position.price}
                      onChange={(e) => updatePosition(position.id, 'price', parseFloat(e.target.value) || 0)}
                      className={validationErrors[`${position.id}_price`] ? 'border-destructive' : ''}
                    />
                    {validationErrors[`${position.id}_price`] && (
                      <p className="mt-1 text-xs text-destructive">{validationErrors[`${position.id}_price`]}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">Kategoria *</Label>
                    <Select value={position.category} onValueChange={(v) => updatePosition(position.id, 'category', v as 'Materiał' | 'Robocizna')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-3 text-right text-sm font-medium">
                  Suma: <span className="text-primary">{(position.qty * position.price).toFixed(2)} zł</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Podsumowanie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Suma materiałów:</span>
            <span className="font-medium">{summaryMaterials.toFixed(2)} zł</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Suma robocizny:</span>
            <span className="font-medium">{summaryLabor.toFixed(2)} zł</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Marża (%):</span>
            <div>
              <Input
                type="number"
                min="0"
                max="100"
                className={`w-24 ${validationErrors['marginPercent'] ? 'border-destructive' : ''}`}
                value={marginPercent}
                onChange={(e) => setMarginPercent(parseFloat(e.target.value) || 0)}
              />
              {validationErrors['marginPercent'] && (
                <p className="mt-1 text-xs text-destructive">{validationErrors['marginPercent']}</p>
              )}
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Kwota całkowita:</span>
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
        Zapisz wycenę
      </Button>
    </div>
  );
}
