import { Helmet } from 'react-helmet-async';
import {
  LandingHeader,
  HeroSection,
  TrustBar,
  FeaturesGrid,
  HowItWorksSection,
  ComingSoonSection,
  TestimonialsSection,
  PricingSection,
  FAQSection,
  CTASection,
  LandingFooter,
} from '@/components/landing';

export default function Landing() {
  return (
    <>
      <Helmet>
        <title>Majster.AI — Zarządzaj firmą jak profesjonalista</title>
        <meta
          name="description"
          content="Platforma dla majstrów i wykonawców. Wyceny PDF, projekty, baza klientów. Zacznij bezpłatnie — bez karty kredytowej."
        />
        <meta property="og:title" content="Majster.AI — Platforma dla fachowców" />
        <meta
          property="og:description"
          content="Cyfrowa transformacja dla branży budowlanej."
        />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <div className="min-h-screen bg-[#0F0F0F]">
        {/* Sticky header — fixed position, not in page flow */}
        <LandingHeader />

        <main>
          {/* 1. Hero — cinematic dark grid + amber glow */}
          <HeroSection />

          {/* 1b. Trust bar — truth-gated proof signals (languages, PDF, mobile, plan) */}
          <TrustBar />

          {/* 2. Live features grid */}
          <FeaturesGrid />

          {/* 3. How it works */}
          <HowItWorksSection />

          {/* 4. Testimonials — after features (proof sequence) */}
          <TestimonialsSection />

          {/* 5. Pricing */}
          <PricingSection />

          {/* 6. FAQ — removes objections before final CTA */}
          <FAQSection />

          {/* 7. Coming soon — beta + planned features */}
          <ComingSoonSection />

          {/* 8. Final CTA strip */}
          <CTASection />
        </main>

        {/* Footer — ONLY on landing page, never inside /app/* */}
        <LandingFooter />
      </div>
    </>
  );
}
