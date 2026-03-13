import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FileText, FolderKanban, Users, Zap } from 'lucide-react';

/**
 * HomeLobby — ekran startowy nowego shella (FF_NEW_SHELL=true).
 *
 * Sekcje:
 *  1. Continue    — ostatnio otwarta pozycja (stan pusty gdy brak)
 *  2. Quick Start — 4 szybkie przyciski akcji
 */
export default function HomeLobby() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 pt-4 pb-3 sticky top-12 z-40">
        <h1 className="text-xl font-bold text-foreground">{t('newShell.home.title')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('newShell.home.subtitle')}
        </p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Blok 1: Continue */}
        <section aria-labelledby="continue-heading">
          <h2 id="continue-heading" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {t('newShell.home.continueTitle')}
          </h2>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('newShell.home.continueEmpty')}
            </p>
          </div>
        </section>

        {/* Blok 2: Quick Start */}
        <section aria-labelledby="quickstart-heading">
          <h2 id="quickstart-heading" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {t('newShell.home.quickStartTitle')}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickStartButton
              icon={<FileText className="h-6 w-6" />}
              label={t('newShell.home.qs.newOffer')}
              onClick={() => navigate('/app/offers/new')}
            />
            <QuickStartButton
              icon={<FolderKanban className="h-6 w-6" />}
              label={t('newShell.home.qs.projects')}
              onClick={() => navigate('/app/projects')}
            />
            <QuickStartButton
              icon={<Users className="h-6 w-6" />}
              label={t('newShell.home.qs.clients')}
              onClick={() => navigate('/app/customers')}
            />
            <QuickStartButton
              icon={<Zap className="h-6 w-6" />}
              label={t('newShell.home.qs.quickEst')}
              onClick={() => navigate('/app/szybka-wycena')}
            />
          </div>
        </section>
      </div>
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
