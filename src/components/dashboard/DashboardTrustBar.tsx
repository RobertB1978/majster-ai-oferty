import { useTranslation } from 'react-i18next';
import { Shield, Save, Scale } from 'lucide-react';

/**
 * Subtle trust signals bar for the dashboard.
 * All claims are factual — Supabase uses encrypted connections,
 * autosave is built into form hooks, and RODO compliance is a product feature.
 */
export function DashboardTrustBar() {
  const { t } = useTranslation();

  const signals = [
    { icon: Save, labelKey: 'dashboard.trust.autosave' },
    { icon: Shield, labelKey: 'dashboard.trust.encrypted' },
    { icon: Scale, labelKey: 'dashboard.trust.rodo' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 py-2 text-xs text-muted-foreground/70">
      {signals.map((signal) => (
        <div key={signal.labelKey} className="flex items-center gap-1.5">
          <signal.icon className="h-3 w-3" />
          <span>{t(signal.labelKey)}</span>
        </div>
      ))}
    </div>
  );
}
