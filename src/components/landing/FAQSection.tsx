import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FAQItemData {
  id: string;
  question: string;
  answer: string;
}

interface FAQItemProps {
  item: FAQItemData;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ item, isOpen, onToggle }: FAQItemProps) {
  const panelId = `${item.id}-panel`;

  return (
    <div className="border-b border-gray-200 dark:border-[#2A2A2A] last:border-b-0">
      <button
        id={item.id}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); }
        }}
        className="w-full flex items-center justify-between gap-4 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-inset rounded"
      >
        <span
          className={`font-semibold text-base transition-colors duration-200 ${
            isOpen
              ? 'text-amber-500 dark:text-amber-400'
              : 'text-gray-900 dark:text-white hover:text-amber-500 dark:hover:text-amber-400'
          }`}
        >
          {item.question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 dark:text-[#A3A3A3] shrink-0 transition-transform duration-300 ${
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
        className={`overflow-hidden transition-all duration-300 ${isOpen ? 'pb-5' : ''}`}
      >
        <p className="text-gray-600 dark:text-[#A3A3A3] text-base leading-relaxed">{item.answer}</p>
      </div>
    </div>
  );
}

export function FAQSection() {
  const { t } = useTranslation();
  const [openId, setOpenId] = useState<string | null>(null);

  const FAQ_ITEMS: FAQItemData[] = [
    {
      id: 'faq-1',
      question: t('landing.faq.q1', 'Czy muszę podpisywać umowę?'),
      answer: t('landing.faq.a1', 'Nie. Zaczynasz bezpłatnie przez 30 dni, bez zobowiązań i bez karty kredytowej. Możesz anulować w dowolnym momencie.'),
    },
    {
      id: 'faq-2',
      question: t('landing.faq.q2', 'Czy dane moich klientów są bezpieczne?'),
      answer: t('landing.faq.a2', 'Dane są chronione, a dostęp jest kontrolowany. Możesz zarządzać uprawnieniami i wiedzieć, kto ma dostęp do jakich informacji.'),
    },
    {
      id: 'faq-3',
      question: t('landing.faq.q3', 'Czy aplikacja działa na telefonie?'),
      answer: t('landing.faq.a3', 'Tak, aplikacja jest w pełni zoptymalizowana na urządzenia mobilne. Możesz korzystać z niej na dowolnym smartfonie z przeglądarką internetową.'),
    },
    {
      id: 'faq-4',
      question: t('landing.faq.q4', 'Jak długo jest darmowy dostęp?'),
      answer: t('landing.faq.a4', 'Plan darmowy jest bezpłatny przez 30 dni. Po tym czasie możesz wybrać płatny plan dopasowany do Twoich potrzeb.'),
    },
    {
      id: 'faq-5',
      question: t('landing.faq.q5', 'Jakie języki obsługuje aplikacja?'),
      answer: t('landing.faq.a5', 'Aplikacja obsługuje trzy języki: Polski, English i Українська. Możesz zmienić język w ustawieniach w dowolnym momencie.'),
    },
  ];

  const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <section
      id="faq"
      className="py-20 md:py-28 bg-white dark:bg-[#0F0F0F]"
      aria-labelledby="faq-heading"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            id="faq-heading"
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
          >
            {t('landing.faq.sectionTitle', 'Często zadawane pytania')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-[#A3A3A3] leading-relaxed">
            {t('landing.faq.sectionSubtitle', 'Nie znalazłeś odpowiedzi? Napisz na kontakt@majster.ai')}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl px-6">
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
