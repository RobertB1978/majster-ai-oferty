import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  HardHat,
  Calculator,
  FileText,
  Users,
  ArrowRight,
  ArrowDown,
  Shield,
  Clock,
  Smartphone,
  BarChart3,
  Bot,
  Camera,
  CreditCard,
  CheckCircle2,
  Zap,
  TrendingUp,
  FolderKanban,
  Star,
  Moon,
  Sun,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react';

const LANDING_LANGUAGES = [
  { code: 'pl', name: 'PL', flag: '🇵🇱' },
  { code: 'en', name: 'EN', flag: '🇬🇧' },
  { code: 'uk', name: 'UK', flag: '🇺🇦' },
];

interface FeatureItem {
  icon: LucideIcon;
  key: string;
  title: string;
  description: string;
  benefits: string[];
}

interface DemoFeature {
  icon: LucideIcon;
  title: string;
  description: string;
  benefits: string[];
}

function scrollToFeatures() {
  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
}

export default function Landing() {
  const { isDark, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [demoFeature, setDemoFeature] = useState<DemoFeature | null>(null);

  const features: FeatureItem[] = [
    {
      icon: Calculator,
      key: 'quotes',
      title: t('landing.features.quotes.title'),
      description: t('landing.features.quotes.description'),
      benefits: [
        t('landing.features.quotes.b1'),
        t('landing.features.quotes.b2'),
        t('landing.features.quotes.b3'),
      ],
    },
    {
      icon: FileText,
      key: 'pdf',
      title: t('landing.features.pdf.title'),
      description: t('landing.features.pdf.description'),
      benefits: [
        t('landing.features.pdf.b1'),
        t('landing.features.pdf.b2'),
        t('landing.features.pdf.b3'),
      ],
    },
    {
      icon: Users,
      key: 'clients',
      title: t('landing.features.clients.title'),
      description: t('landing.features.clients.description'),
      benefits: [
        t('landing.features.clients.b1'),
        t('landing.features.clients.b2'),
        t('landing.features.clients.b3'),
      ],
    },
    {
      icon: FolderKanban,
      key: 'projects',
      title: t('landing.features.projects.title'),
      description: t('landing.features.projects.description'),
      benefits: [
        t('landing.features.projects.b1'),
        t('landing.features.projects.b2'),
        t('landing.features.projects.b3'),
      ],
    },
    {
      icon: Clock,
      key: 'calendar',
      title: t('landing.features.calendar.title'),
      description: t('landing.features.calendar.description'),
      benefits: [
        t('landing.features.calendar.b1'),
        t('landing.features.calendar.b2'),
        t('landing.features.calendar.b3'),
      ],
    },
    {
      icon: TrendingUp,
      key: 'finance',
      title: t('landing.features.finance.title'),
      description: t('landing.features.finance.description'),
      benefits: [
        t('landing.features.finance.b1'),
        t('landing.features.finance.b2'),
        t('landing.features.finance.b3'),
      ],
    },
    {
      icon: Bot,
      key: 'ai',
      title: t('landing.features.ai.title'),
      description: t('landing.features.ai.description'),
      benefits: [
        t('landing.features.ai.b1'),
        t('landing.features.ai.b2'),
        t('landing.features.ai.b3'),
      ],
    },
    {
      icon: BarChart3,
      key: 'analytics',
      title: t('landing.features.analytics.title'),
      description: t('landing.features.analytics.description'),
      benefits: [
        t('landing.features.analytics.b1'),
        t('landing.features.analytics.b2'),
        t('landing.features.analytics.b3'),
      ],
    },
    {
      icon: Smartphone,
      key: 'mobile',
      title: t('landing.features.mobile.title'),
      description: t('landing.features.mobile.description'),
      benefits: [
        t('landing.features.mobile.b1'),
        t('landing.features.mobile.b2'),
        t('landing.features.mobile.b3'),
      ],
    },
    {
      icon: Camera,
      key: 'photos',
      title: t('landing.features.photos.title'),
      description: t('landing.features.photos.description'),
      benefits: [
        t('landing.features.photos.b1'),
        t('landing.features.photos.b2'),
        t('landing.features.photos.b3'),
      ],
    },
    {
      icon: CreditCard,
      key: 'billing',
      title: t('landing.features.billing.title'),
      description: t('landing.features.billing.description'),
      benefits: [
        t('landing.features.billing.b1'),
        t('landing.features.billing.b2'),
        t('landing.features.billing.b3'),
      ],
    },
    {
      icon: Shield,
      key: 'security',
      title: t('landing.features.security.title'),
      description: t('landing.features.security.description'),
      benefits: [
        t('landing.features.security.b1'),
        t('landing.features.security.b2'),
        t('landing.features.security.b3'),
      ],
    },
  ];

  const stats = [
    { value: '2 min', label: t('landing.stats.quoteTime') },
    { value: '85%', label: t('landing.stats.faster') },
    { value: '100%', label: t('landing.stats.gdpr') },
    { value: '24/7', label: t('landing.stats.access') },
  ];

  const testimonials = [
    {
      name: 'Marek K.',
      role: t('landing.testimonials.t1Role'),
      text: t('landing.testimonials.t1Text'),
    },
    {
      name: 'Tomasz W.',
      role: t('landing.testimonials.t2Role'),
      text: t('landing.testimonials.t2Text'),
    },
    {
      name: 'Anna S.',
      role: t('landing.testimonials.t3Role'),
      text: t('landing.testimonials.t3Text'),
    },
  ];

  function openDemo(feature: FeatureItem) {
    setDemoFeature({
      icon: feature.icon,
      title: feature.title,
      description: feature.description,
      benefits: feature.benefits,
    });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
        <div className="container flex h-16 items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <HardHat className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Majster.AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <button onClick={scrollToFeatures} className="hover:text-foreground transition-colors">
              {t('landing.nav.features')}
            </button>
            <a href="#stats" className="hover:text-foreground transition-colors">
              {t('landing.nav.whyUs')}
            </a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">
              {t('landing.nav.testimonials')}
            </a>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Language switcher */}
            <div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5 shrink-0">
              {LANDING_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => i18n.changeLanguage(lang.code)}
                  className={`flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium transition-colors ${
                    i18n.language === lang.code || i18n.language.startsWith(lang.code)
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  aria-label={`Zmień język na ${lang.name}`}
                >
                  <span>{lang.flag}</span>
                  <span className="hidden sm:inline">{lang.name}</span>
                </button>
              ))}
            </div>

            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Przełącz motyw" className="shrink-0">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex shrink-0">
              <Link to="/login">{t('landing.nav.login')}</Link>
            </Button>
            {/* Fix #2: mobile button - short text on small screens, full text on sm+ */}
            <Button size="sm" asChild className="shrink-0">
              <Link to="/register" className="flex items-center">
                <span className="hidden sm:inline">{t('landing.nav.tryFreeFull')}</span>
                <span className="sm:hidden">{t('landing.nav.tryFree')}</span>
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border bg-card">
        <div className="container py-16 md:py-24 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Zap className="h-4 w-4" />
              {t('landing.hero.badge')}
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              {t('landing.hero.title')}
              <span className="block text-primary">{t('landing.hero.titleHighlight')}</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto">
              {t('landing.hero.desc')}
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="h-14 px-8 text-base" asChild>
                <Link to="/register">
                  {t('landing.hero.startFree')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-base"
                onClick={scrollToFeatures}
              >
                {t('landing.hero.seeFeatures')}
                <ArrowDown className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {t('landing.hero.noCard')}
            </p>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section id="stats" className="border-b border-border bg-card">
        <div className="container py-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - detailed */}
      <section id="features" className="py-16 md:py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold md:text-4xl">
              {t('landing.features.sectionTitle')}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground text-lg">
              {t('landing.features.sectionDesc')}
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.key}
                className="relative border hover:border-primary/40 hover:shadow-lg transition-all duration-300 group overflow-hidden hover:-translate-y-1 cursor-pointer"
                onClick={() => openDemo(feature)}
                role="button"
                tabIndex={0}
                aria-label={`${t('landing.features.demoTitle')}: ${feature.title}`}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openDemo(feature); }}
              >
                {/* Subtle top accent that slides in on hover */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

                <CardContent className="pt-6 pb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary group-hover:border-primary transition-colors duration-200">
                    <feature.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors duration-200" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold group-hover:text-primary transition-colors duration-200">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {feature.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  {/* "Preview demo" CTA — visible only on hover */}
                  <div className="mt-4 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                      {t('landing.features.demoTitle')}
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Demo Modal — Fix #3: demo mode, no app access */}
      <Dialog open={demoFeature !== null} onOpenChange={(open) => { if (!open) setDemoFeature(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              {demoFeature && (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                  <demoFeature.icon className="h-6 w-6 text-primary" />
                </div>
              )}
              <div>
                <DialogTitle className="text-lg">{demoFeature?.title}</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {t('landing.features.demoTitle')} — {t('landing.features.demoDesc')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {demoFeature?.description}
            </p>
            <ul className="space-y-2">
              {demoFeature?.benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm text-muted-foreground text-center">
              {t('landing.features.demoDesc')}
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <Button size="sm" asChild className="w-full">
                <Link to="/register">
                  {t('landing.features.registerFree')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="sm" variant="ghost" asChild className="w-full">
                <Link to="/login">{t('landing.features.loginForAccess')}</Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* How it works */}
      <section className="py-16 md:py-20 border-t border-border bg-card">
        <div className="container">
          <h2 className="text-center text-3xl font-bold mb-12">
            {t('landing.howItWorks.title')}
          </h2>
          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            {[
              {
                step: '1',
                title: t('landing.howItWorks.step1Title'),
                desc: t('landing.howItWorks.step1Desc'),
              },
              {
                step: '2',
                title: t('landing.howItWorks.step2Title'),
                desc: t('landing.howItWorks.step2Desc'),
              },
              {
                step: '3',
                title: t('landing.howItWorks.step3Title'),
                desc: t('landing.howItWorks.step3Desc'),
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 md:py-20 border-t border-border">
        <div className="container">
          <h2 className="text-center text-3xl font-bold mb-12">
            {t('landing.testimonials.title')}
          </h2>
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {testimonials.map((testimony) => (
              <Card key={testimony.name} className="border">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed italic">
                    &ldquo;{testimony.text}&rdquo;
                  </p>
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="font-semibold text-sm">{testimony.name}</div>
                    <div className="text-xs text-muted-foreground">{testimony.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — Fix #6: "Mam już konto" button visible in light mode */}
      <section className="border-t border-border bg-accent text-accent-foreground">
        <div className="container py-16 text-center">
          <h2 className="text-3xl font-bold">{t('landing.cta.title')}</h2>
          <p className="mt-4 text-accent-foreground/80 max-w-xl mx-auto">
            {t('landing.cta.desc')}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="h-14 px-8 text-base" asChild>
              <Link to="/register">
                {t('landing.cta.registerBtn')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            {/* Fix #6: explicit bg-transparent + border + text that works in both modes */}
            <Button
              size="lg"
              className="h-14 px-8 text-base bg-transparent border-2 border-accent-foreground/50 text-accent-foreground hover:bg-accent-foreground/10 hover:border-accent-foreground/70"
              asChild
            >
              <Link to="/login">
                {t('landing.cta.loginBtn')}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container py-12">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <HardHat className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold">Majster.AI</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('landing.footer.desc')}
              </p>
              <a href="mailto:kontakt@majster.ai" className="text-sm text-muted-foreground hover:text-foreground transition-colors mt-2 inline-block">
                kontakt@majster.ai
              </a>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">{t('landing.footer.product')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/app/dashboard" className="hover:text-foreground transition-colors">{t('landing.footer.dashboard')}</Link></li>
                <li><Link to="/app/templates" className="hover:text-foreground transition-colors">{t('landing.footer.templates')}</Link></li>
                <li><Link to="/app/jobs" className="hover:text-foreground transition-colors">{t('landing.footer.projects')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">{t('landing.footer.legal')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/legal/privacy" className="hover:text-foreground transition-colors">{t('landing.footer.privacy')}</Link></li>
                <li><Link to="/legal/terms" className="hover:text-foreground transition-colors">{t('landing.footer.terms')}</Link></li>
                <li><Link to="/legal/cookies" className="hover:text-foreground transition-colors">{t('landing.footer.cookies')}</Link></li>
                <li><Link to="/legal/dpa" className="hover:text-foreground transition-colors">{t('landing.footer.dpa')}</Link></li>
                <li><Link to="/legal/rodo" className="hover:text-foreground transition-colors">{t('landing.footer.gdpr')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">{t('landing.footer.support')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="mailto:support@majster.ai" className="hover:text-foreground transition-colors">{t('landing.footer.techSupport')}</a></li>
                <li><a href="mailto:sales@majster.ai" className="hover:text-foreground transition-colors">{t('landing.footer.sales')}</a></li>
                <li><a href="mailto:kontakt@majster.ai" className="hover:text-foreground transition-colors">{t('landing.footer.partnership')}</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Majster.AI. {t('landing.footer.rights')}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              {t('landing.footer.madeIn')}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
