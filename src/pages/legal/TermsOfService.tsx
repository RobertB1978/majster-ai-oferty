import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Scale, CreditCard, AlertTriangle, Ban, Gavel } from 'lucide-react';

export default function TermsOfService() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lastUpdated = new Date().toLocaleDateString(i18n.language === 'pl' ? 'pl-PL' : i18n.language === 'uk' ? 'uk-UA' : 'en-GB');

  const sections = [
    {
      icon: FileText,
      title: t('legal.terms.s1title'),
      content: t('legal.terms.s1content'),
    },
    {
      icon: Scale,
      title: t('legal.terms.s2title'),
      content: t('legal.terms.s2content'),
    },
    {
      icon: CreditCard,
      title: t('legal.terms.s3title'),
      content: t('legal.terms.s3content'),
    },
    {
      icon: Ban,
      title: t('legal.terms.s4title'),
      content: t('legal.terms.s4content'),
    },
    {
      icon: AlertTriangle,
      title: t('legal.terms.s5title'),
      content: t('legal.terms.s5content'),
    },
    {
      icon: Gavel,
      title: t('legal.terms.s6title'),
      content: t('legal.terms.s6content'),
    },
  ];

  return (
    <>
      <SEOHead
        title={t('legal.terms.metaTitle')}
        description={t('legal.terms.metaDesc')}
        keywords="terms of service, terms of use, Majster.AI"
      />

      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl py-8 px-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('legal.back')}
          </Button>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">{t('legal.terms.pageTitle')}</h1>
            <p className="text-muted-foreground">
              {t('legal.terms.subtitle')}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {t('legal.lastUpdated')} {lastUpdated}
            </p>
          </div>

          {i18n.language !== 'pl' && t('legal.plVersionPrevails') && (
            <div className="mb-6 p-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
              <p className="text-sm text-amber-700 dark:text-amber-400">{t('legal.plVersionPrevails')}</p>
            </div>
          )}

          <div className="space-y-6">
            {sections.map((section) => (
              <Card key={section.title} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <section.icon className="h-5 w-5 text-primary" />
                    </div>
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                    {section.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 p-6 rounded-xl bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground">
              {t('legal.terms.agreement')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
