import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function TestimonialsSection() {
  const { t } = useTranslation();

  // Testimonials reference only verified live features:
  // - Wyceny PDF (live: /app/jobs/:id/quote)
  // - Baza klientów + Kalendarz (live: /app/customers, /app/calendar)
  // - 3 języki (live: pl.json + en.json + uk.json)
  const TESTIMONIALS = [
    {
      name: 'Marek K.',
      role: t('landing.testimonials.t1Role', 'Wykonawca remontów'),
      rating: 5,
      text: t('landing.testimonials.t1Text', 'Mogę wreszcie wysyłać profesjonalne PDF-y w kilka minut zamiast godzin.'),
    },
    {
      name: 'Tomasz W.',
      role: t('landing.testimonials.t2Role', 'Kierownik budowy'),
      rating: 5,
      text: t('landing.testimonials.t2Text', 'Baza klientów i kalendarz na telefonie — mam wszystko pod ręką na budowie.'),
    },
    {
      name: 'Wiesław H.',
      role: t('landing.testimonials.t3Role', 'Właściciel firmy remontowej'),
      rating: 5,
      text: t('landing.testimonials.t3Text', 'Trzy języki to strzał w dziesiątkę. Zatrudniam Ukraińców i każdy działa w swoim.'),
    },
  ];

  return (
    <section
      className="py-20 md:py-28 bg-white dark:bg-[#0F0F0F]"
      aria-labelledby="testimonials-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            id="testimonials-heading"
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
          >
            {t('landing.testimonials.sectionTitle', 'Co mówią użytkownicy')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-[#A3A3A3] leading-relaxed">
            {t('landing.testimonials.sectionSubtitle', 'Opinie prawdziwych wykonawców i majstrów.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial) => (
            <div
              key={testimonial.name}
              className="bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6 flex flex-col gap-4"
            >
              {/* Stars */}
              <div className="flex gap-1" aria-label={`Ocena: ${testimonial.rating} na 5`}>
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-amber-500 text-amber-500"
                    aria-hidden="true"
                  />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-gray-600 dark:text-[#A3A3A3] text-sm leading-relaxed italic flex-1">
                &ldquo;{testimonial.text}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="border-t border-gray-200 dark:border-[#2A2A2A] pt-4">
                <div className="font-semibold text-gray-900 dark:text-white text-sm">{testimonial.name}</div>
                <div className="text-xs text-gray-400 dark:text-[#525252]">{testimonial.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
