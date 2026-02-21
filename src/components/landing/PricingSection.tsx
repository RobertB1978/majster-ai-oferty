import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

const CTA_ROUTE = '/register';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    period: 'zł / mies',
    label: 'Bez karty',
    description: 'Dla wykonawców, którzy chcą sprawdzić możliwości.',
    highlight: false,
    badge: null,
    features: [
      'Do 3 projektów jednocześnie',
      'Wyceny PDF (maks. 5/mies.)',
      'Baza klientów',
      'Aplikacja mobilna',
    ],
    ctaLabel: 'Zacznij za darmo',
  },
  {
    id: 'solo',
    name: 'Solo',
    price: '49',
    period: 'zł / mies',
    label: 'Dla freelancera',
    description: 'Dla samodzielnych wykonawców z regularną działalnością.',
    highlight: false,
    badge: null,
    features: [
      'Nieograniczone projekty',
      'Nieograniczone wyceny PDF',
      'Baza klientów bez limitu',
      'Kalendarz i finanse',
      'Dokumentacja zdjęciowa',
      'Analityka podstawowa',
    ],
    ctaLabel: 'Wybierz Solo',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '99',
    period: 'zł / mies',
    label: 'Dla firmy',
    description: 'Dla firm i brygad, które chcą pełnej automatyzacji.',
    highlight: true,
    badge: 'Najpopularniejszy',
    features: [
      'Wszystko z planu Solo',
      'Wiele kont zespołowych',
      'Asystent AI (beta)',
      'Wyceny głosem (beta)',
      'Priorytetowe wsparcie',
      'API dla integratorów (wkrótce)',
    ],
    ctaLabel: 'Wybierz Pro',
  },
];

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="py-20 md:py-28 bg-[#0F0F0F]"
      aria-labelledby="pricing-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            id="pricing-heading"
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Przejrzyste ceny
          </h2>
          <p className="text-lg text-[#A3A3A3] leading-relaxed max-w-xl mx-auto">
            Zacznij za darmo. Bez karty kredytowej, bez zobowiązań.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-[#1A1A1A] rounded-2xl p-6 flex flex-col gap-6 transition-colors duration-300 ${
                plan.highlight
                  ? 'border-2 border-amber-500'
                  : 'border border-[#2A2A2A] hover:border-amber-500/40'
              }`}
            >
              {/* Popular badge */}
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-amber-500 text-black text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <span className="text-xs text-[#525252] border border-[#2A2A2A] rounded-full px-2 py-0.5">
                    {plan.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-sm text-[#A3A3A3]">{plan.period}</span>
                </div>
                <p className="text-sm text-[#525252] leading-relaxed">{plan.description}</p>
              </div>

              {/* Features list */}
              <ul className="flex flex-col gap-3 flex-1" aria-label={`Funkcje planu ${plan.name}`}>
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check
                      className="w-4 h-4 text-amber-500 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span className="text-[#A3A3A3]">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                to={CTA_ROUTE}
                className={`block text-center py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black min-h-[44px] flex items-center justify-center ${
                  plan.highlight
                    ? 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black'
                    : 'border border-[#2A2A2A] hover:border-amber-500/60 text-white hover:text-amber-400'
                }`}
              >
                {plan.ctaLabel}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-[#525252] mt-8">
          Bez karty kredytowej · Anuluj w każdej chwili
        </p>
      </div>
    </section>
  );
}
