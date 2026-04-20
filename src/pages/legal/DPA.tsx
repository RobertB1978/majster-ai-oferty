import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ExternalLink, FileText, Shield, Server, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getLegalEffectiveDate } from '@/lib/legalVersions';
import { usePublicSubprocessors } from '@/hooks/usePublicSubprocessors';

export default function DPA() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lastUpdated = getLegalEffectiveDate('dpa', i18n.language);
  const { data: subprocessors = [], isError: subprocessorsError, isLoading: subprocessorsLoading } = usePublicSubprocessors();

  const sectionsBefore = [
    {
      icon: FileText,
      title: t('legal.dpa.s1title'),
      content: t('legal.dpa.s1content'),
    },
    {
      icon: Shield,
      title: t('legal.dpa.s2title'),
      content: t('legal.dpa.s2content'),
    },
    {
      icon: Lock,
      title: t('legal.dpa.s3title'),
      content: t('legal.dpa.s3content'),
    },
  ];

  const sectionsAfter = [
    {
      icon: AlertTriangle,
      title: t('legal.dpa.s5title'),
      content: t('legal.dpa.s5content'),
    },
    {
      icon: CheckCircle2,
      title: t('legal.dpa.s6title'),
      content: t('legal.dpa.s6content'),
    },
  ];

  return (
    <>
      <SEOHead
        title={t('legal.dpa.metaTitle')}
        description={t('legal.dpa.metaDesc')}
        keywords="DPA, data processing agreement, GDPR, art 28"
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
            <h1 className="text-3xl font-bold mb-2">{t('legal.dpa.pageTitle')}</h1>
            <p className="text-muted-foreground">
              {t('legal.dpa.subtitle')}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {t('legal.lastUpdated')} {lastUpdated}
            </p>
          </div>

          {i18n.language !== 'pl' && t('legal.plVersionPrevails') && (
            <div className="mb-6 p-4 rounded-lg border border-warning/30 bg-warning/5 dark:border-warning/40 dark:bg-warning/10">
              <p className="text-sm text-warning">{t('legal.plVersionPrevails')}</p>
            </div>
          )}

          <div className="space-y-6">
            {sectionsBefore.map((section) => (
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

            {/* Section 4 — Subprocessors: dynamic from DB */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Server className="h-5 w-5 text-primary" />
                  </div>
                  {t('legal.dpa.s4title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subprocessorsError && (
                  <>
                    <p className="text-sm text-muted-foreground mb-3">{t('legal.dpa.s4loadError')}</p>
                    <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                      {t('legal.dpa.s4content')}
                    </p>
                  </>
                )}
                {!subprocessorsError && !subprocessorsLoading && subprocessors.length === 0 && (
                  <p className="text-muted-foreground">{t('legal.dpa.s4emptyState')}</p>
                )}
                {!subprocessorsError && subprocessors.length > 0 && (
                  <div className="space-y-4">
                    {subprocessors.map((sp) => (
                      <div key={sp.slug} className="border rounded-lg p-4 space-y-1.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-medium">{sp.name}</span>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {sp.category}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{sp.purpose}</p>
                        {sp.location && (
                          <p className="text-xs text-muted-foreground">
                            {sp.location}
                            {sp.transfer_basis ? ` — ${sp.transfer_basis}` : ''}
                          </p>
                        )}
                        {(sp.dpa_url || sp.privacy_url) && (
                          <div className="flex gap-3 pt-1">
                            {sp.dpa_url && (
                              <a
                                href={sp.dpa_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                {t('legal.dpa.s4dpaLink')}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {sp.privacy_url && (
                              <a
                                href={sp.privacy_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                {t('legal.dpa.s4privacyLink')}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {sectionsAfter.map((section) => (
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

          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">{t('legal.dpa.acceptance')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('legal.dpa.acceptanceText')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
