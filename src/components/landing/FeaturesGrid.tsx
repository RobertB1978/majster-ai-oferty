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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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

interface FeatureCardProps {
  feature: Feature;
}

function FeatureCard({ feature }: FeatureCardProps) {
  const Icon = ICON_MAP[feature.icon] ?? FileText;
  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 hover:border-amber-500/40 transition-colors duration-300 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-amber-500" aria-hidden="true" />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
        <p className="text-sm text-[#A3A3A3] leading-relaxed">{feature.desc}</p>
      </div>
    </div>
  );
}

export function FeaturesGrid() {
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
            Co dostaniesz
          </h2>
          <p className="text-lg text-[#A3A3A3] leading-relaxed max-w-2xl mx-auto">
            Kompletny zestaw narzędzi do zarządzania firmą remontową i budowlaną.
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
              <FeatureCard key={feature.key} feature={feature} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
