import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  Rocket,
  ExternalLink,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { FEATURES } from './features.data';
import type { Feature } from './features.data';
import { FeatureDemoModal } from './FeatureDemoModal';
import type { DemoFeature } from './FeatureDemoModal';

const ICON_MAP: Record<string, LucideIcon> = {
  FileText, FolderOpen, Users, Calendar, TrendingUp, BarChart2,
  Camera, Globe, Smartphone, Brain, Mic, Shield, WifiOff, Download, Code2,
};

// Keys that have both i18n benefit data AND a FeatureDemoModal sample UI.
const DEMO_CAPABLE = new Set([
  'quotes', 'projects', 'clients', 'calendar', 'finance', 'analytics', 'photos', 'mobile',
]);

interface FeatureCardProps {
  feature: Feature;
  onDemoClick: (df: DemoFeature) => void;
}

function FeatureCard({ feature, onDemoClick }: FeatureCardProps) {
  const { t } = useTranslation();
  const Icon = ICON_MAP[feature.icon] ?? FileText;
  const hasDemo = DEMO_CAPABLE.has(feature.key);

  const handleDemo = () => {
    if (!hasDemo) return;
    const prefix = `landing.features.${feature.key}`;
    const b1 = t(`${prefix}.b1`);
    const b2 = t(`${prefix}.b2`);
    const b3 = t(`${prefix}.b3`);
    onDemoClick({
      key: feature.key,
      icon: Icon,
      title: t(`${prefix}.title`) || feature.title,
      description: t(`${prefix}.description`) || feature.desc,

      benefits: [b1, b2, b3].filter(
        (b) => b && !b.endsWith('.b1') && !b.endsWith('.b2') && !b.endsWith('.b3'),
      ),
    });
  };

  return (
    <div
      className={`group bg-white dark:bg-brand-card border border-gray-200 dark:border-brand-border rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5 ${
        hasDemo ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-brand-card' : ''
      }`}
      onClick={hasDemo ? handleDemo : undefined}
      role={hasDemo ? 'button' : undefined}
      tabIndex={hasDemo ? 0 : undefined}
      onKeyDown={
        hasDemo
          ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleDemo(); } }
          : undefined
      }
      aria-label={hasDemo ? `${t('landing.features.demoTitle')}: ${t(`landing.features.${feature.key}.title`)}` : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-400/5 flex items-center justify-center shrink-0 transition-all duration-300 group-hover:from-amber-500/20 group-hover:to-amber-400/10 group-hover:shadow-sm group-hover:shadow-amber-500/10">
          <Icon className="w-5 h-5 text-amber-500" aria-hidden="true" />
        </div>
        {hasDemo && (
          <ExternalLink
            className="w-4 h-4 text-gray-300 dark:text-neutral-600 group-hover:text-amber-500/60 transition-colors duration-300"
            aria-hidden="true"
          />
        )}
      </div>

      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t(`landing.features.${feature.key}.title`)}
        </h3>
        <p className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed">
          {t(`landing.features.${feature.key}.description`)}
        </p>
      </div>

      {hasDemo && (
        <div className="text-xs font-medium text-gray-400 dark:text-neutral-600 group-hover:text-amber-400 transition-colors duration-200">
          {t('landing.features.demoTitle')} →
        </div>
      )}
    </div>
  );
}

export function FeaturesGrid() {
  const { t } = useTranslation();
  const [demoFeature, setDemoFeature] = useState<DemoFeature | null>(null);

  const liveFeatures = FEATURES.filter((f) => f.status === 'live');

  return (
    <section
      id="features"
      className="py-20 md:py-28 bg-gray-50 dark:bg-brand-dark"
      aria-labelledby="features-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            id="features-heading"
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
          >
            {t('landing.features.sectionTitle')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-neutral-400 leading-relaxed max-w-2xl mx-auto">
            {t('landing.features.sectionDesc')}
          </p>
        </div>

        {liveFeatures.length < 3 ? (
          <div className="text-center py-12 px-6 rounded-2xl border border-dashed border-gray-200 dark:border-brand-border">
            <div className="text-amber-500 mb-3 flex justify-center">
              <Rocket className="w-10 h-10" aria-hidden="true" />
            </div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-xl mb-2">{t('landing.features.mvpTitle')}</h3>
            <p className="text-gray-600 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
              {t('landing.features.mvpDesc')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {liveFeatures.map((feature) => (
              <FeatureCard key={feature.key} feature={feature} onDemoClick={setDemoFeature} />
            ))}
          </div>
        )}
      </div>

      <FeatureDemoModal feature={demoFeature} onClose={() => setDemoFeature(null)} />
    </section>
  );
}
