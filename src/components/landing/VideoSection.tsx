import { useState } from 'react';
import { Play, Clock, Shield, Zap, Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ─────────────────────────────────────────────────────────────────────────────
// YOUTUBE_VIDEO_ID: Replace with the actual YouTube video ID when the product
// demo recording is ready. Format: the part after youtube.com/watch?v=
// Example: 'dQw4w9WgXcQ' from https://www.youtube.com/watch?v=dQw4w9WgXcQ
// ─────────────────────────────────────────────────────────────────────────────
const YOUTUBE_VIDEO_ID = 'YOUR_VIDEO_ID_HERE';

const IS_VIDEO_READY = YOUTUBE_VIDEO_ID !== 'YOUR_VIDEO_ID_HERE';

const TRUST_ICONS = [Zap, Shield, Clock] as const;

export function VideoSection() {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);

  const youtubeUrl = `https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&rel=0&modestbranding=1&color=white`;

  return (
    <section
      id="video-demo"
      className="py-20 md:py-28 bg-brand-dark"
      aria-labelledby="video-demo-heading"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent-amber/30 bg-accent-amber/10 px-4 py-1.5 text-sm font-medium text-accent-amber mb-6">
            <Play className="w-3.5 h-3.5" aria-hidden="true" />
            {t('landing.videoDemo.badge')}
          </div>

          <h2
            id="video-demo-heading"
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            {t('landing.videoDemo.title')}
          </h2>
          <p className="text-lg text-neutral-400 leading-relaxed max-w-2xl mx-auto">
            {t('landing.videoDemo.subtitle')}
          </p>
        </div>

        {/* Video container */}
        <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40">
          {/* 16:9 aspect ratio */}
          <div className="relative aspect-video bg-[#0A0A0A]">
            {playing && IS_VIDEO_READY ? (
              <iframe
                className="absolute inset-0 w-full h-full"
                src={youtubeUrl}
                title={t('landing.videoDemo.iframeTitle')}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              /* Poster state */
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Radial amber glow background */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(ellipse at 30% 40%, rgba(245,158,11,0.10) 0%, transparent 55%), radial-gradient(ellipse at 75% 65%, rgba(245,158,11,0.06) 0%, transparent 50%), linear-gradient(135deg, #0F0F0F 0%, #131313 50%, #0A0A0A 100%)',
                  }}
                  aria-hidden="true"
                />

                {/* Subtle dot grid */}
                <div
                  className="absolute inset-0 opacity-[0.025]"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
                    backgroundSize: '32px 32px',
                  }}
                  aria-hidden="true"
                />

                {/* Floating feature chips — decorative, screen-reader hidden */}
                <div
                  className="absolute top-5 left-5 hidden md:flex flex-col gap-2"
                  aria-hidden="true"
                >
                  {(['chip1', 'chip2', 'chip3'] as const).map((key) => (
                    <div
                      key={key}
                      className="flex items-center gap-2 bg-white/[0.06] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-neutral-300 backdrop-blur-sm"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-amber/70 shrink-0" />
                      {t(`landing.videoDemo.${key}`)}
                    </div>
                  ))}
                </div>

                {/* Duration badge top-right */}
                <div
                  className="absolute top-5 right-5 hidden sm:flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-neutral-400 backdrop-blur-sm"
                  aria-hidden="true"
                >
                  <Clock className="w-3 h-3" />
                  {t('landing.videoDemo.duration')}
                </div>

                {IS_VIDEO_READY ? (
                  /* Play button — active, video is ready */
                  <button
                    type="button"
                    onClick={() => setPlaying(true)}
                    aria-label={t('landing.videoDemo.playLabel')}
                    className="relative z-10 group"
                  >
                    {/* Outer ambient ring */}
                    <div
                      className="absolute inset-0 rounded-full bg-accent-amber/15 scale-[1.6] group-hover:scale-[1.85] transition-transform duration-500 ease-out motion-reduce:transition-none"
                      aria-hidden="true"
                    />
                    {/* Inner ring */}
                    <div
                      className="absolute inset-0 rounded-full bg-accent-amber/10 scale-[1.28] group-hover:scale-[1.4] transition-transform duration-[400ms] ease-out motion-reduce:transition-none"
                      aria-hidden="true"
                    />
                    {/* Button */}
                    <div className="relative w-20 h-20 rounded-full bg-accent-amber hover:bg-accent-amber-light active:bg-accent-amber-hover flex items-center justify-center shadow-lg shadow-accent-amber/30 group-hover:shadow-xl group-hover:shadow-accent-amber/40 transition-all duration-300 motion-reduce:transition-none">
                      <Play
                        className="w-8 h-8 text-black fill-black translate-x-0.5"
                        aria-hidden="true"
                      />
                    </div>
                  </button>
                ) : (
                  /* Coming soon state — video ID not yet set */
                  <div className="relative z-10 flex flex-col items-center gap-4 text-center px-6">
                    <div className="w-20 h-20 rounded-full border border-white/10 bg-white/[0.04] flex items-center justify-center">
                      <Video className="w-8 h-8 text-neutral-500" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-300">
                        {t('landing.videoDemo.comingSoon')}
                      </p>
                      <p className="text-xs text-neutral-600 mt-1">
                        {t('landing.videoDemo.comingSoonSub')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom trust row */}
        <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3">
          {(['point1', 'point2', 'point3'] as const).map((key, i) => {
            const Icon = TRUST_ICONS[i];
            return (
              <div key={key} className="flex items-center gap-2 text-sm text-neutral-500">
                <Icon className="w-3.5 h-3.5 text-accent-amber/50 shrink-0" aria-hidden="true" />
                {t(`landing.videoDemo.${key}`)}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
