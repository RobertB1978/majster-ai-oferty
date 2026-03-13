import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, AlertTriangle, CreditCard, Scale, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Terms() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isNonPl = i18n.language !== 'pl';

  return (
    <>
      <Helmet>
        <title>{t('legal.termsTitle')}</title>
        <meta name="description" content={t('seo.terms.description')} />
      </Helmet>

      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('legal.back')}
          </Button>
          {isNonPl && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
              {t('legal.plVersionPrevails')}
            </div>
          )}

          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 mb-4">
              <FileText className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-primary">
              {t('legal.terms.page.heading')}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('legal.terms.page.lastUpdated')} {new Date().toLocaleDateString(i18n.language === 'uk' ? 'uk-UA' : i18n.language === 'en' ? 'en-GB' : 'pl-PL')}
            </p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  {t('legal.terms.page.section1Title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  {t('legal.terms.page.section1Text1')}
                </p>
                <p>
                  {t('legal.terms.page.section1Text2')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  {t('legal.terms.page.section2Title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>{t('legal.terms.page.section2Intro')}</p>
                <ul>
                  <li>{t('legal.terms.page.service1')}</li>
                  <li>{t('legal.terms.page.service2')}</li>
                  <li>{t('legal.terms.page.service3')}</li>
                  <li>{t('legal.terms.page.service4')}</li>
                  <li>{t('legal.terms.page.service5')}</li>
                  <li>{t('legal.terms.page.service6')}</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  {t('legal.terms.page.section3Title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>{t('legal.terms.page.section3Intro')}</p>
                <ul>
                  <li><strong>Free</strong> - {t('legal.terms.page.planFree')}</li>
                  <li><strong>Pro</strong> - {t('legal.terms.page.planPro')}</li>
                  <li><strong>Business</strong> - {t('legal.terms.page.planBusiness')}</li>
                  <li><strong>Enterprise</strong> - {t('legal.terms.page.planEnterprise')}</li>
                </ul>
                <p>
                  {t('legal.terms.page.section3Text')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  {t('legal.terms.page.section4Title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>{t('legal.terms.page.section4Intro')}</p>
                <ul>
                  <li>{t('legal.terms.page.prohibition1')}</li>
                  <li>{t('legal.terms.page.prohibition2')}</li>
                  <li>{t('legal.terms.page.prohibition3')}</li>
                  <li>{t('legal.terms.page.prohibition4')}</li>
                  <li>{t('legal.terms.page.prohibition5')}</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  {t('legal.terms.page.section5Title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  {t('legal.terms.page.section5Intro')}
                </p>
                <ul>
                  <li>{t('legal.terms.page.liability1')}</li>
                  <li>{t('legal.terms.page.liability2')}</li>
                  <li>{t('legal.terms.page.liability3')}</li>
                  <li>{t('legal.terms.page.liability4')}</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  {t('legal.terms.page.section6Title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  {t('legal.terms.page.section6Text1')}
                </p>
                <p>
                  {t('legal.terms.page.section6Text2')}
                </p>
                <p>
                  {t('legal.terms.page.section6Contact')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
