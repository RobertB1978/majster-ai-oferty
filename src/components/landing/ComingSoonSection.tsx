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
  const Icon = ICON_MAP[feature.icon] ?? FileText;
  const isBeta = feature.status === 'beta';

  return (
    <div className="bg-[#1A1A1A] border border-dashed border-[#2A2A2A] rounded-2xl p-5 opacity-75 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl bg-[#0F0F0F] flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-[#525252]" aria-hidden="true" />
        </div>
        {isBeta ? (
          <span className="text-xs font-bold bg-amber-500 text-black rounded-full px-2.5 py-0.5 uppercase tracking-wide">
            Beta
          </span>
        ) : (
          <span className="text-xs font-semibold border border-amber-500 text-amber-500 rounded-full px-2.5 py-0.5 uppercase tracking-wide">
            Wkrótce
          </span>
        )}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-[#A3A3A3] mb-1">{feature.title}</h3>
        <p className="text-xs text-[#525252] leading-relaxed">{feature.desc}</p>
      </div>
    </div>
  );
}

export function ComingSoonSection() {
  const comingFeatures = FEATURES.filter((f) => f.status === 'beta' || f.status === 'soon');

  if (comingFeatures.length === 0) return null;

  return (
    <section
      className="py-20 md:py-28 bg-[#0F0F0F]"
      aria-labelledby="coming-soon-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            id="coming-soon-heading"
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Co planujemy
          </h2>
          <p className="text-lg text-[#A3A3A3] leading-relaxed max-w-2xl mx-auto">
            Aktywnie rozwijamy platformę. Poniżej funkcje, które są w przygotowaniu.
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
