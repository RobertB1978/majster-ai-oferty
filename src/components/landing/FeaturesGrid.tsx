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

// Keys that have both i18n benefit data AND a FeatureDemoModal sample UI.
// Evidence: matching keys in pl.json landing.features.* and FeatureDemoModal SAMPLE_MAP.
const DEMO_CAPABLE = new Set([
  'quotes',    // i18n: landing.features.quotes + SAMPLE_MAP['quotes']
  'projects',  // i18n: landing.features.projects + SAMPLE_MAP['projects']
  'clients',   // i18n: landing.features.clients + SAMPLE_MAP['clients']
  'calendar',  // i18n: landing.features.calendar + SAMPLE_MAP['calendar']
  'finance',   // i18n: landing.features.finance + SAMPLE_MAP['finance']
  'analytics', // i18n: landing.features.analytics + SAMPLE_MAP['analytics']
  'photos',    // i18n: landing.features.photos + SAMPLE_MAP['photos']
  'mobile',    // i18n: landing.features.mobile + SAMPLE_MAP['mobile']
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
      // Filter out verbatim keys returned when translation is missing
      benefits: [b1, b2, b3].filter(
        (b) => b && !b.endsWith('.b1') && !b.endsWith('.b2') && !b.endsWith('.b3'),
      ),
    });
  };

  return (
    <div
      className={`group bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 hover:border-amber-500/40 ${
        hasDemo ? 'cursor-pointer hover:bg-[#1F1F1F]' : ''
      }`}
      onClick={hasDemo ? handleDemo : undefined}
      role={hasDemo ? 'button' : undefined}
      tabIndex={hasDemo ? 0 : undefined}
      onKeyDown={
        hasDemo
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleDemo();
              }
            }
          : undefined
      }
      aria-label={hasDemo ? `Podgląd funkcji: ${feature.title}` : undefined}
    >
      {/* Icon row */}
      <div className="flex items-center justify-between">
        <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 transition-colors duration-300 group-hover:bg-amber-500/20">
          <Icon className="w-5 h-5 text-amber-500" aria-hidden="true" />
        </div>
        {hasDemo && (
          <ExternalLink
            className="w-4 h-4 text-[#525252] group-hover:text-amber-500/60 transition-colors duration-300"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
        <p className="text-sm text-[#A3A3A3] leading-relaxed">{feature.desc}</p>
      </div>

      {/* Demo hint — shown only on cards with interactive demo */}
      {hasDemo && (
        <div className="text-xs font-medium text-[#525252] group-hover:text-amber-400 transition-colors duration-200">
          {t('landing.features.demoTitle', 'Podgląd')} →
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
      className="py-20 md:py-28 bg-[#0F0F0F]"
      aria-labelledby="features-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            id="features-heading"
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            {t('landing.features.sectionTitle', 'Co dostaniesz')}
          </h2>
          <p className="text-lg text-[#A3A3A3] leading-relaxed max-w-2xl mx-auto">
            {t(
              'landing.features.sectionDesc',
              'Kompletny zestaw narzędzi do zarządzania firmą remontową i budowlaną.',
            )}
          </p>
        </div>

        {liveFeatures.length < 3 ? (
          // Premium empty-state — shown when fewer than 3 live features
          <div className="text-center py-12 px-6 rounded-2xl border border-dashed border-[#2A2A2A]">
            <div className="text-amber-500 mb-3 flex justify-center">
              <Rocket className="w-10 h-10" aria-hidden="true" />
            </div>
            <h3 className="text-white font-semibold text-xl mb-2">Startujemy</h3>
            <p className="text-[#A3A3A3] max-w-md mx-auto leading-relaxed">
              Wersja MVP: zaczynamy od wycen PDF i zarządzania projektami.
              Reszta funkcji jest aktywnie rozwijana i pojawi się wkrótce.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {liveFeatures.map((feature) => (
              <FeatureCard key={feature.key} feature={feature} onDemoClick={setDemoFeature} />
            ))}
          </div>
        )}
      </div>

      {/* Demo modal — outside grid to avoid stacking-context issues */}
      <FeatureDemoModal feature={demoFeature} onClose={() => setDemoFeature(null)} />
    </section>
  );
}
