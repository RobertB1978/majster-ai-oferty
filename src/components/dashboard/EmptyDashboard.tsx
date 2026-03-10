import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  FolderPlus,
  FileText,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
  Zap,
  Shield,
} from 'lucide-react';
import { motion } from 'framer-motion';

/** Inline SVG — "ready to build" hero illustration for empty state */
function EmptyStateIllustration() {
  return (
    <svg
      viewBox="0 0 320 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-[280px] mx-auto"
      aria-hidden="true"
    >
      {/* Desk / surface */}
      <rect x="20" y="180" width="280" height="12" rx="4" fill="hsl(220 14% 88%)" className="dark:fill-[hsl(220_14%_25%)]" />

      {/* Laptop */}
      <rect x="90" y="100" width="140" height="90" rx="6" fill="hsl(222 47% 14%)" />
      <rect x="95" y="105" width="130" height="78" rx="3" fill="hsl(217 33% 17%)" />

      {/* Screen content lines */}
      <rect x="105" y="115" width="80" height="6" rx="2" fill="hsl(30 90% 42%)" opacity="0.9" />
      <rect x="105" y="127" width="110" height="4" rx="2" fill="hsl(220 14% 60%)" opacity="0.6" />
      <rect x="105" y="137" width="90" height="4" rx="2" fill="hsl(220 14% 60%)" opacity="0.4" />
      <rect x="105" y="147" width="100" height="4" rx="2" fill="hsl(220 14% 60%)" opacity="0.3" />

      {/* Chart bars on screen */}
      <rect x="170" y="153" width="10" height="20" rx="2" fill="hsl(30 90% 42%)" opacity="0.8" />
      <rect x="184" y="145" width="10" height="28" rx="2" fill="hsl(30 90% 52%)" />
      <rect x="198" y="149" width="10" height="24" rx="2" fill="hsl(30 90% 42%)" opacity="0.8" />

      {/* Laptop base */}
      <path d="M80 192 Q80 185 90 185 L230 185 Q240 185 240 192 L250 198 H70 Z" fill="hsl(222 47% 16%)" />
      <rect x="140" y="190" width="40" height="4" rx="2" fill="hsl(220 14% 40%)" />

      {/* Clipboard/document floating */}
      <motion.g animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
        <rect x="16" y="70" width="68" height="90" rx="6" fill="white" className="dark:fill-[hsl(220_14%_20%)]" filter="url(#shadow)" />
        <rect x="16" y="70" width="68" height="90" rx="6" fill="none" stroke="hsl(220 14% 86%)" strokeWidth="1" className="dark:stroke-[hsl(220_14%_30%)]" />
        {/* Clipboard clip */}
        <rect x="34" y="66" width="32" height="10" rx="3" fill="hsl(30 90% 42%)" />
        {/* Lines */}
        <rect x="24" y="90" width="52" height="3" rx="1.5" fill="hsl(220 14% 82%)" className="dark:fill-[hsl(220_14%_35%)]" />
        <rect x="24" y="100" width="40" height="3" rx="1.5" fill="hsl(220 14% 82%)" className="dark:fill-[hsl(220_14%_35%)]" />
        <rect x="24" y="110" width="48" height="3" rx="1.5" fill="hsl(220 14% 82%)" className="dark:fill-[hsl(220_14%_35%)]" />
        <rect x="24" y="120" width="36" height="3" rx="1.5" fill="hsl(220 14% 82%)" className="dark:fill-[hsl(220_14%_35%)]" />
        {/* Checkmark */}
        <circle cx="57" cy="143" r="10" fill="hsl(152 76% 36%)" />
        <path d="M51 143 L55 147 L63 139" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </motion.g>

      {/* Wrench tool floating */}
      <motion.g animate={{ rotate: [0, 8, 0], y: [0, -3, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        style={{ transformOrigin: '270px 65px' }}>
        <circle cx="270" cy="65" r="28" fill="hsl(30 90% 42%)" opacity="0.12" />
        <g transform="translate(257, 52)">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
            fill="hsl(30 90% 42%)" strokeWidth="0" transform="scale(1.4)" />
        </g>
      </motion.g>

      {/* Star / sparkle decorations */}
      {[[60, 45, 0.7], [255, 135, 0.5], [145, 50, 0.6]].map(([cx, cy, op], i) => (
        <motion.circle
          key={i}
          cx={cx}
          cy={cy}
          r="3"
          fill="hsl(38 92% 60%)"
          opacity={op}
          animate={{ scale: [1, 1.4, 1], opacity: [op, op * 0.4, op] }}
          transition={{ duration: 2 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
        />
      ))}

      {/* SVG filter for card shadow */}
      <defs>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="hsl(220 14% 11%)" floodOpacity="0.1" />
        </filter>
      </defs>
    </svg>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export function EmptyDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const benefits = [
    {
      icon: FileText,
      title: t('dashboard.benefitQuotesTitle'),
      description: t('dashboard.benefitQuotesDesc'),
      iconBg: 'bg-primary',
      accent: 'border-primary/20 bg-primary/5',
    },
    {
      icon: TrendingUp,
      title: t('dashboard.benefitRevenueTitle'),
      description: t('dashboard.benefitRevenueDesc'),
      iconBg: 'bg-success',
      accent: 'border-success/20 bg-success/5',
    },
    {
      icon: Clock,
      title: t('dashboard.benefitTimeTitle'),
      description: t('dashboard.benefitTimeDesc'),
      iconBg: 'bg-warning',
      accent: 'border-warning/20 bg-warning/5',
    },
  ];

  const featurePills = [
    { icon: Zap, label: t('dashboard.featureAI') },
    { icon: Shield, label: t('dashboard.featureSecurity') },
    { icon: Sparkles, label: t('dashboard.featureAutomation') },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4"
    >
      {/* Hero illustration */}
      <motion.div variants={itemVariants} className="mb-6 w-full max-w-xs">
        <EmptyStateIllustration />
      </motion.div>

      {/* Heading */}
      <motion.h1 variants={itemVariants} className="text-3xl sm:text-4xl font-bold mb-3 text-foreground">
        {t('dashboard.welcome')}
      </motion.h1>
      <motion.p variants={itemVariants} className="text-muted-foreground max-w-md mb-5 text-base leading-relaxed">
        {t('dashboard.welcomeSubtitle')}
      </motion.p>

      {/* Feature pills */}
      <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-2 mb-8">
        {featurePills.map((feat) => (
          <div
            key={feat.label}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-muted-foreground"
          >
            <feat.icon className="h-3.5 w-3.5 text-primary shrink-0" />
            {feat.label}
          </div>
        ))}
      </motion.div>

      {/* CTA button */}
      <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
        <Button
          size="lg"
          onClick={() => navigate('/app/jobs/new')}
          className="mb-12 shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 text-base px-8 py-6 rounded-2xl"
        >
          <FolderPlus className="mr-2 h-5 w-5" />
          {t('dashboard.createFirstProject')}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </motion.div>

      {/* Benefit cards */}
      <div className="grid gap-4 sm:grid-cols-3 max-w-3xl w-full">
        {benefits.map((benefit, index) => (
          <motion.div
            key={benefit.title}
            variants={itemVariants}
            custom={index}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <Card className={`h-full border shadow-sm hover:shadow-md transition-all duration-200 ${benefit.accent}`}>
              <CardContent className="p-5 text-center">
                <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${benefit.iconBg} shadow-sm`}>
                  <benefit.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-base mb-1.5">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
