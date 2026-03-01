import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FileText, FolderKanban, Users, Zap } from 'lucide-react';

/**
 * HomeLobby — ekran startowy nowego shella (FF_NEW_SHELL=true).
 *
 * 3 bloki:
 *  1. Continue  — ostatnio otwarta pozycja (placeholder)
 *  2. Today     — liczniki dzisiejszych zadań (placeholder)
 *  3. Quick Start — 4 szybkie przyciski akcji
 *
 * Dane biznesowe (projekty, oferty) będą podłączone w PR-08+.
 */
export default function HomeLobby() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 pt-4 pb-3 sticky top-0 z-40">
        <h1 className="text-xl font-bold text-foreground">{t('newShell.home.title', 'Majster.AI')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('newShell.home.subtitle', 'Twoje centrum zarządzania')}
        </p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Blok 1: Continue */}
        <section aria-labelledby="continue-heading">
          <h2 id="continue-heading" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {t('newShell.home.continueTitle', 'Kontynuuj')}
          </h2>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('newShell.home.continueEmpty', 'Brak ostatnio otwartych elementów')}
            </p>
          </div>
        </section>

        {/* Blok 2: Today */}
        <section aria-labelledby="today-heading">
          <h2 id="today-heading" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {t('newShell.home.todayTitle', 'Dziś')}
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <TodayCounter label={t('newShell.home.todayOffers', 'Oferty')} value={0} />
            <TodayCounter label={t('newShell.home.todayProjects', 'Projekty')} value={0} />
            <TodayCounter label={t('newShell.home.todayTasks', 'Zadania')} value={0} />
          </div>
        </section>

        {/* Blok 3: Quick Start */}
        <section aria-labelledby="quickstart-heading">
          <h2 id="quickstart-heading" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {t('newShell.home.quickStartTitle', 'Szybki start')}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickStartButton
              icon={<FileText className="h-6 w-6" />}
              label={t('newShell.home.qs.newOffer', 'Nowa wycena')}
              onClick={() => navigate('/app/quick-est')}
            />
            <QuickStartButton
              icon={<FolderKanban className="h-6 w-6" />}
              label={t('newShell.home.qs.projects', 'Projekty')}
              onClick={() => navigate('/app/jobs')}
            />
            <QuickStartButton
              icon={<Users className="h-6 w-6" />}
              label={t('newShell.home.qs.clients', 'Klienci')}
              onClick={() => navigate('/app/customers')}
            />
            <QuickStartButton
              icon={<Zap className="h-6 w-6" />}
              label={t('newShell.home.qs.quickEst', 'Szybka wycena')}
              onClick={() => navigate('/app/szybka-wycena')}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function TodayCounter({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 text-center">
      <span className="block text-2xl font-bold text-foreground">{value}</span>
      <span className="block text-xs text-muted-foreground mt-0.5 leading-tight">{label}</span>
    </div>
  );
}

function QuickStartButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 bg-card border border-border rounded-xl p-4 text-sm font-medium text-foreground hover:bg-secondary/50 active:bg-secondary transition-colors min-h-[80px]"
    >
      <span className="text-primary">{icon}</span>
      <span className="text-center leading-tight">{label}</span>
    </button>
  );
}
