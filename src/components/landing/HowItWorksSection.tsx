import { UserPlus, FolderPlus, Send } from 'lucide-react';

const STEPS = [
  {
    number: '1',
    icon: UserPlus,
    title: 'Załóż konto',
    desc: 'Rejestracja zajmuje chwilę. Bez karty kredytowej — plan Free jest bezterminowy.',
  },
  {
    number: '2',
    icon: FolderPlus,
    title: 'Dodaj projekt',
    desc: 'Stwórz projekt, przypisz klienta, dodaj zadania i materiały.',
  },
  {
    number: '3',
    icon: Send,
    title: 'Wyślij wycenę',
    desc: 'Wygeneruj profesjonalne PDF i wyślij klientowi w kilka kliknięć.',
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-20 md:py-28 bg-[#141414]"
      aria-labelledby="how-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            id="how-heading"
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Jak to działa?
          </h2>
          <p className="text-lg text-[#A3A3A3] leading-relaxed max-w-xl mx-auto">
            Trzy kroki i jesteś gotowy do pracy.
          </p>
        </div>

        {/* Desktop: row with dashed connectors */}
        <div className="hidden md:flex items-start gap-0 max-w-4xl mx-auto">
          {STEPS.map((step, idx) => (
            <div key={step.number} className="flex items-start flex-1">
              <div className="flex-1 text-center px-4">
                <div className="relative inline-block">
                  {/* Amber circle number */}
                  <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <step.icon className="w-6 h-6 text-black" aria-hidden="true" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#0F0F0F] border border-[#2A2A2A] flex items-center justify-center">
                    <span className="text-amber-500 text-xs font-bold">{step.number}</span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-[#A3A3A3] leading-relaxed">{step.desc}</p>
              </div>
              {/* Connector — between steps only */}
              {idx < STEPS.length - 1 && (
                <div
                  className="shrink-0 mt-7 w-12 border-t-2 border-dashed border-amber-500/30"
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>

        {/* Mobile: column with vertical connector line */}
        <div className="flex md:hidden flex-col max-w-md mx-auto">
          {STEPS.map((step, idx) => (
            <div key={step.number} className="flex gap-4">
              {/* Left: number + vertical line */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shrink-0">
                  <step.icon className="w-5 h-5 text-black" aria-hidden="true" />
                </div>
                {idx < STEPS.length - 1 && (
                  <div className="w-0.5 flex-1 mt-2 mb-2 bg-amber-500/20" aria-hidden="true" />
                )}
              </div>
              {/* Right: text */}
              <div className={`flex-1 pb-6 ${idx === STEPS.length - 1 ? '' : ''}`}>
                <div className="text-amber-500 text-xs font-bold mb-1">Krok {step.number}</div>
                <h3 className="text-base font-semibold text-white mb-1">{step.title}</h3>
                <p className="text-sm text-[#A3A3A3] leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
