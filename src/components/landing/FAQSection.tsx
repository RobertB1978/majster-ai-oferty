import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQ_ITEMS = [
  {
    id: 'faq-1',
    question: 'Czy muszę podpisywać umowę?',
    answer: 'Nie. Zaczynasz bezpłatnie, bez zobowiązań. Plan Free jest bezterminowy i nie wymaga podpisywania żadnych dokumentów.',
  },
  {
    id: 'faq-2',
    question: 'Czy dane moich klientów są bezpieczne?',
    answer: 'Dane są chronione, a dostęp jest kontrolowany. Możesz zarządzać uprawnieniami i wiedzieć, kto ma dostęp do jakich informacji.',
  },
  {
    id: 'faq-3',
    question: 'Czy aplikacja działa na telefonie?',
    answer: 'Tak, aplikacja jest w pełni zoptymalizowana na urządzenia mobilne. Możesz korzystać z niej na dowolnym smartfonie z przeglądarką internetową.',
  },
  {
    id: 'faq-4',
    question: 'Czy mogę przetestować przed zakupem?',
    answer: 'Plan Free jest bezterminowy i nie wymaga karty kredytowej. Możesz korzystać z podstawowych funkcji bez żadnych kosztów tak długo, jak chcesz.',
  },
  {
    id: 'faq-5',
    question: 'Jakie języki obsługuje aplikacja?',
    answer: 'Aplikacja obsługuje trzy języki: Polski, English i Українська. Możesz zmienić język w ustawieniach w dowolnym momencie.',
  },
];

interface FAQItemProps {
  item: (typeof FAQ_ITEMS)[number];
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ item, isOpen, onToggle }: FAQItemProps) {
  const panelId = `${item.id}-panel`;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <div className="border-b border-[#2A2A2A] last:border-b-0">
      <button
        id={item.id}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        className="w-full flex items-center justify-between gap-4 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-inset rounded"
      >
        <span
          className={`font-semibold text-base transition-colors duration-200 ${
            isOpen ? 'text-amber-400' : 'text-white hover:text-amber-400'
          }`}
        >
          {item.question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-[#A3A3A3] shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={item.id}
        hidden={!isOpen}
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'pb-5' : ''
        }`}
      >
        <p className="text-[#A3A3A3] text-base leading-relaxed">{item.answer}</p>
      </div>
    </div>
  );
}

export function FAQSection() {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      id="faq"
      className="py-20 md:py-28 bg-[#0F0F0F]"
      aria-labelledby="faq-heading"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            id="faq-heading"
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Często zadawane pytania
          </h2>
          <p className="text-lg text-[#A3A3A3] leading-relaxed">
            Nie znalazłeś odpowiedzi? Napisz na kontakt@majster.ai
          </p>
        </div>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl px-6">
          {FAQ_ITEMS.map((item) => (
            <FAQItem
              key={item.id}
              item={item}
              isOpen={openId === item.id}
              onToggle={() => toggle(item.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
