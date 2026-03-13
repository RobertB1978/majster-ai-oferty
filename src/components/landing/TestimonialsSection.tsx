import { Star, TrendingUp, Clock, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function TestimonialsSection() {
  const { t } = useTranslation();

  const TESTIMONIALS = [
    {
      name: 'Marek K.',
      role: t('landing.testimonials.t1Role'),
      rating: 5,
      text: t('landing.testimonials.t1Text'),
      outcome: t('landing.testimonials.t1Outcome'),
      icon: <Clock className="w-4 h-4" aria-hidden="true" />,
    },
    {
      name: 'Tomasz W.',
      role: t('landing.testimonials.t2Role'),
      rating: 5,
      text: t('landing.testimonials.t2Text'),
      outcome: t('landing.testimonials.t2Outcome'),
      icon: <TrendingUp className="w-4 h-4" aria-hidden="true" />,
    },
    {
      name: 'Wiesław H.',
      role: t('landing.testimonials.t3Role'),
      rating: 5,
      text: t('landing.testimonials.t3Text'),
      outcome: t('landing.testimonials.t3Outcome'),
      icon: <FileText className="w-4 h-4" aria-hidden="true" />,
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
            {t('landing.testimonials.sectionTitle')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-[#A3A3A3] leading-relaxed">
            {t('landing.testimonials.sectionSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial) => (
            <div
              key={testimonial.name}
              className="bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6 flex flex-col gap-4 hover:border-amber-500/40 transition-colors duration-200"
            >
              {/* Stars */}
              <div className="flex gap-1" role="img" aria-label={`Ocena: ${testimonial.rating} na 5`}>
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-amber-500 text-amber-500"
                    aria-hidden="true"
                  />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-gray-700 dark:text-[#A3A3A3] text-sm leading-relaxed flex-1">
                &ldquo;{testimonial.text}&rdquo;
              </blockquote>

              {/* Outcome badge */}
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                <span className="text-amber-500" aria-hidden="true">{testimonial.icon}</span>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  {testimonial.outcome}
                </span>
              </div>

              {/* Author */}
              <div className="border-t border-gray-200 dark:border-[#2A2A2A] pt-4">
                <div className="font-semibold text-gray-900 dark:text-white text-sm">{testimonial.name}</div>
                <div className="text-xs text-gray-500 dark:text-[#525252]">{testimonial.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
