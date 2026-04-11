import {
  FileText,
  FolderOpen,
  Users,
  Calendar,
  TrendingUp,
  BarChart2,
  Camera,
  Globe,
  Smartphone,
  Brain,
  Mic,
  Shield,
  WifiOff,
  Download,
  Code2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FEATURES } from './features.data';
import type { Feature } from './features.data';

const ICON_MAP: Record<string, LucideIcon> = {
  FileText,
  FolderOpen,
  Users,
  Calendar,
  TrendingUp,
  BarChart2,
  Camera,
  Globe,
  Smartphone,
  Brain,
  Mic,
  Shield,
  WifiOff,
  Download,
  Code2,
};

interface ComingSoonCardProps {
  feature: Feature;
}

function ComingSoonCard({ feature }: ComingSoonCardProps) {
  const { t } = useTranslation();
  const Icon = ICON_MAP[feature.icon] ?? FileText;
  const isBeta = feature.status === 'beta';

  return (
    <div className="bg-brand-card border border-dashed border-brand-border rounded-2xl p-5 opacity-75 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl bg-brand-dark flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-neutral-600" aria-hidden="true" />
        </div>
        {isBeta ? (
          <span className="text-xs font-bold bg-primary text-primary-foreground rounded-full px-2.5 py-0.5 uppercase tracking-wide">
            {t('landing.comingSoon.betaBadge')}
          </span>
        ) : (
          <span className="text-xs font-semibold border border-primary text-primary rounded-full px-2.5 py-0.5 uppercase tracking-wide">
            {t('landing.comingSoon.soonBadge')}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-neutral-400 mb-1">
          {t(`landing.comingSoon.features.${feature.key}.title`, feature.title)}
        </h3>
        <p className="text-xs text-neutral-600 leading-relaxed">
          {t(`landing.comingSoon.features.${feature.key}.desc`, feature.desc)}
        </p>
      </div>
    </div>
  );
}

export function ComingSoonSection() {
  const { t } = useTranslation();
  const comingFeatures = FEATURES.filter((f) => f.status === 'beta' || f.status === 'soon');

  if (comingFeatures.length === 0) return null;

  return (
    <section
      className="py-20 md:py-28 bg-brand-dark"
      aria-labelledby="coming-soon-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            id="coming-soon-heading"
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            {t('landing.comingSoon.sectionTitle')}
          </h2>
          <p className="text-lg text-neutral-400 leading-relaxed max-w-2xl mx-auto">
            {t('landing.comingSoon.sectionSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {comingFeatures.map((feature) => (
            <ComingSoonCard key={feature.key} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
