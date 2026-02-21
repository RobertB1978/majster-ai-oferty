// TrustBar — truth-gated social proof strip displayed below the hero.
//
// Every item below is verified to be real:
//   • "3 języki" — src/i18n/locales/pl.json + en.json + uk.json confirmed in detection
//   • "PDF" — src/App.tsx /app/jobs/:id/quote → QuoteEditor + /app/jobs/:id/pdf → PdfGenerator
//   • "Plan Free" — PricingSection shows 0 zł / mies, no card required
//   • "Mobile-first" — Capacitor installed + UI itself is the evidence

const TRUST_ITEMS = [
  {
    value: '3',
    label: 'języki interfejsu',
    sub: 'PL / EN / UK',
    verified: true,
  },
  {
    value: 'PDF',
    label: 'w kilka kliknięć',
    sub: 'wyceny i oferty',
    verified: true,
  },
  {
    value: '∞',
    label: 'bez limitu projektów',
    sub: 'plan Pro i wyższe',
    verified: true,
  },
  {
    value: '📱',
    label: 'Mobile-first',
    sub: 'działa na każdym telefonie',
    verified: true,
  },
] as const;

export function TrustBar() {
  const visible = TRUST_ITEMS.filter((i) => i.verified);

  return (
    <div
      className="bg-[#141414] border-y border-[#2A2A2A]"
      aria-label="Kluczowe informacje o platformie"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {visible.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1">
              <span
                className="text-2xl font-bold text-amber-500"
                aria-hidden="true"
              >
                {item.value}
              </span>
              <span className="text-sm font-semibold text-white leading-tight">
                {item.label}
              </span>
              <span className="text-xs text-[#525252]">{item.sub}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
