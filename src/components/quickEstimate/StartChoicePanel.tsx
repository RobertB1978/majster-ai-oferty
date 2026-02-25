import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useItemTemplates } from '@/hooks/useItemTemplates';
import type { ItemTemplate } from '@/hooks/useItemTemplates';
import { ArrowLeft, BookOpen, FileText, Loader2, Package, Plus } from 'lucide-react';
import { TradeCatalogPicker } from './TradeCatalogPicker';
import type { StarterPack } from '@/data/starterPacks';

type Step = 'choice' | 'templates' | 'catalog';

interface StartChoicePanelProps {
  open: boolean;
  onSelectTemplate: (template: ItemTemplate) => void;
  onSelectPack: (pack: StarterPack) => void;
  onEmptyStart: () => void;
}

export function StartChoicePanel({
  open,
  onSelectTemplate,
  onSelectPack,
  onEmptyStart,
}: StartChoicePanelProps) {
  const [step, setStep] = useState<Step>('choice');
  const [search, setSearch] = useState('');
  const { data: templates, isLoading } = useItemTemplates();

  // Reset to choice step whenever dialog opens
  useEffect(() => {
    if (open) {
      setStep('choice');
      setSearch('');
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!templates) return [];
    const q = search.toLowerCase();
    return templates.filter((t) => t.name.toLowerCase().includes(q));
  }, [templates, search]);

  // Closing the dialog without choosing = empty start
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) onEmptyStart();
  };

  const dialogTitle =
    step === 'templates'
      ? 'Wybierz szablon'
      : step === 'catalog'
        ? 'Katalog branż'
        : 'Jak zacząć wycenę?';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step !== 'choice' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -ml-1"
                onClick={() => setStep('choice')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {dialogTitle}
          </DialogTitle>
        </DialogHeader>

        {/* ── Step: choice ───────────────────────────────────────────── */}
        {step === 'choice' && (
          <div className="grid grid-cols-3 gap-2 py-2">
            {/* Catalog option */}
            <button
              onClick={() => setStep('catalog')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-muted hover:border-primary hover:bg-primary/5 transition-all text-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-xs">Katalog branż</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                  Załaduj pakiet startowy
                </p>
              </div>
            </button>

            {/* Template option */}
            <button
              onClick={() => setStep('templates')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-muted hover:border-primary hover:bg-primary/5 transition-all text-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-xs">Szablon</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                  Gotowa pozycja
                </p>
              </div>
            </button>

            {/* Empty option */}
            <button
              onClick={onEmptyStart}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-muted hover:border-primary hover:bg-primary/5 transition-all text-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-xs">Pusta wycena</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                  Wpisz ręcznie
                </p>
              </div>
            </button>
          </div>
        )}

        {/* ── Step: catalog ──────────────────────────────────────────── */}
        {step === 'catalog' && (
          <TradeCatalogPicker
            onSelectPack={(pack) => {
              onSelectPack(pack);
            }}
            onBack={() => setStep('choice')}
          />
        )}

        {/* ── Step: templates ────────────────────────────────────────── */}
        {step === 'templates' && (
          <div className="space-y-3">
            <Input
              placeholder="Szukaj szablonu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  {templates?.length === 0
                    ? 'Brak szablonów. Utwórz je w zakładce "Szablony pozycji".'
                    : 'Brak wyników dla podanej frazy.'}
                </p>
              ) : (
                filtered.map((template) => (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => onSelectTemplate(template)}
                  >
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{template.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {template.default_qty} {template.unit} ×{' '}
                          {Number(template.default_price).toFixed(2)} zł
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs rounded-full px-2 py-0.5 ${
                            template.category === 'Materiał'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                              : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          }`}
                        >
                          {template.category}
                        </span>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onEmptyStart}
            >
              Pomiń — zacznij pustą wycenę
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
