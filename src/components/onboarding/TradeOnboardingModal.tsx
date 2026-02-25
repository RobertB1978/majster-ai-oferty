import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Droplets,
  Paintbrush,
  Wrench,
  Hammer,
  Layers,
  Square,
  Zap,
  Home,
  Building2,
  DoorOpen,
  ArrowRight,
  ArrowLeft,
  X,
  Rocket,
  Settings2,
} from 'lucide-react';
import { starterPacks } from '@/data/starterPacks';
import type { StarterPack } from '@/data/starterPacks';
import { useTradeOnboarding } from '@/hooks/useTradeOnboarding';

/** Maps pack ID → Lucide icon component */
const PACK_ICONS: Record<string, React.ElementType> = {
  glazurnik: Droplets,
  malarz: Paintbrush,
  hydraulik: Wrench,
  murarz: Hammer,
  podlogarz: Layers,
  'sucha-zabudowa': Square,
  elektryk: Zap,
  dekarz: Home,
  elewacja: Building2,
  stolarz: DoorOpen,
};

interface TradeOnboardingModalProps {
  /** Whether the dialog should be shown (controlled from parent). */
  open: boolean;
  /** Called when the user completes or skips the flow. */
  onDone: () => void;
}

/**
 * Gate-4 activation onboarding — 3-step flow:
 *   Step 1: Choose your trade
 *   Step 2: Choose mode (Super simple / Advanced)
 *   → Navigate to /app/szybka-wycena with starter pack preloaded (simple)
 *      or /app/jobs/new (advanced)
 */
export function TradeOnboardingModal({ open, onDone }: TradeOnboardingModalProps) {
  const navigate = useNavigate();
  const { complete, skip } = useTradeOnboarding();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPack, setSelectedPack] = useState<StarterPack | null>(null);

  const handleSkip = () => {
    skip();
    onDone();
  };

  const handleSelectMode = (mode: 'simple' | 'advanced') => {
    if (!selectedPack) return;
    complete(selectedPack.id, mode);
    onDone();
    if (mode === 'simple') {
      navigate('/app/szybka-wycena', {
        state: { pack: selectedPack, skipStartChoice: true },
      });
    } else {
      navigate('/app/jobs/new');
    }
  };

  const progressValue = step === 1 ? 50 : 100;

  return (
    <Dialog open={open} onOpenChange={handleSkip}>
      <DialogContent
        className="max-w-2xl p-0 overflow-hidden"
        aria-describedby={undefined}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">
          Konfiguracja konta — krok {step} z 2
        </DialogTitle>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="p-6 pb-4 border-b">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Krok {step} z 2
              </p>
              <h2 className="text-xl font-bold">
                {step === 1 ? 'Czym się zajmujesz?' : 'Jak chcesz zacząć?'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {step === 1
                  ? 'Wybierz swój zawód — załadujemy gotowy cennik na start.'
                  : `Wybrałeś: ${selectedPack?.tradeName}. Jak wolisz pracować?`}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              aria-label="Pomiń onboarding"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Progress value={progressValue} className="h-1.5" />
        </div>

        {/* ── Step 1: Trade selection ─────────────────────────────── */}
        {step === 1 && (
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1">
              {starterPacks.map((pack) => {
                const Icon = PACK_ICONS[pack.id] ?? Hammer;
                const isSelected = selectedPack?.id === pack.id;
                return (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => setSelectedPack(pack)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-primary/40 hover:bg-muted/50'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className={`text-sm font-medium leading-tight ${
                        isSelected ? 'text-primary' : ''
                      }`}
                    >
                      {pack.tradeName}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 flex justify-between items-center">
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Pomiń na razie
              </Button>
              <Button onClick={() => setStep(2)} disabled={!selectedPack}>
                Dalej
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Mode selection ──────────────────────────────── */}
        {step === 2 && selectedPack && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Super simple */}
              <button
                type="button"
                onClick={() => handleSelectMode('simple')}
                className="flex flex-col items-start gap-3 p-5 rounded-xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                  <Rocket className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-base">Super prosto</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Otwieramy gotową wycenę z{' '}
                    <span className="font-medium text-foreground">
                      {selectedPack.items.length} pozycjami
                    </span>
                    . Edytuj co chcesz i wyślij.
                  </p>
                </div>
                <span className="text-xs text-primary font-medium">
                  Zalecane dla nowych →
                </span>
              </button>

              {/* Advanced */}
              <button
                type="button"
                onClick={() => handleSelectMode('advanced')}
                className="flex flex-col items-start gap-3 p-5 rounded-xl border-2 border-border bg-card hover:border-muted-foreground/50 hover:bg-muted/30 transition-all text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted group-hover:bg-muted/80 transition-colors">
                  <Settings2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-base">Zaawansowany</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pełny edytor ofert — klienci, zadania, koszty, PDF.
                  </p>
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  Pełna kontrola →
                </span>
              </button>
            </div>

            <div className="flex justify-between items-center pt-1">
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Wróć
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Pomiń na razie
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
