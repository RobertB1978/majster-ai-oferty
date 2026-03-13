import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Eye, Database, UserCheck, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const disclaimer = t('legal.plVersionPrevails');
  const isNonPl = i18n.language !== 'pl';

  return (
    <>
      <Helmet>
        <title>{t('legal.privacyTitle')}</title>
        <meta name="description" content={t('seo.privacy.description')} />
      </Helmet>

      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('legal.back')}
          </Button>
          {isNonPl && disclaimer && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
              {disclaimer}
            </div>
          )}

          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 mb-4">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-primary">
              {t('legal.privacy.page.heading')}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('legal.privacy.page.lastUpdated')} {new Date().toLocaleDateString(i18n.language === 'uk' ? 'uk-UA' : i18n.language === 'en' ? 'en-GB' : 'pl-PL')}
            </p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  {t('legal.privacy.page.section1Title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  {t('legal.privacy.page.section1Text')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  {t('legal.privacy.page.section2Title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <ul>
                  <li><strong>{t('legal.privacy.page.dataAccountLabel')}:</strong> {t('legal.privacy.page.dataAccountDesc')}</li>
                  <li><strong>{t('legal.privacy.page.dataCompanyLabel')}:</strong> {t('legal.privacy.page.dataCompanyDesc')}</li>
                  <li><strong>{t('legal.privacy.page.dataProjectLabel')}:</strong> {t('legal.privacy.page.dataProjectDesc')}</li>
                  <li><strong>{t('legal.privacy.page.dataTechLabel')}:</strong> {t('legal.privacy.page.dataTechDesc')}</li>
                  <li><strong>{t('legal.privacy.page.dataAnalyticsLabel')}:</strong> {t('legal.privacy.page.dataAnalyticsDesc')}</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  {t('legal.privacy.page.section3Title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <ul>
                  <li>{t('legal.privacy.page.purpose1')}</li>
                  <li>{t('legal.privacy.page.purpose2')}</li>
                  <li>{t('legal.privacy.page.purpose3')}</li>
                  <li>{t('legal.privacy.page.purpose4')}</li>
                  <li>{t('legal.privacy.page.purpose5')}</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  {t('legal.privacy.page.section4Title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>{t('legal.privacy.page.rightsIntro')}</p>
                <ul>
                  <li><strong>{t('legal.privacy.page.rightAccessLabel')}</strong> - {t('legal.privacy.page.rightAccessDesc')}</li>
                  <li><strong>{t('legal.privacy.page.rightRectifyLabel')}</strong> - {t('legal.privacy.page.rightRectifyDesc')}</li>
                  <li><strong>{t('legal.privacy.page.rightEraseLabel')}</strong> - {t('legal.privacy.page.rightEraseDesc')}</li>
                  <li><strong>{t('legal.privacy.page.rightPortLabel')}</strong> - {t('legal.privacy.page.rightPortDesc')}</li>
                  <li><strong>{t('legal.privacy.page.rightObjectLabel')}</strong> - {t('legal.privacy.page.rightObjectDesc')}</li>
                  <li><strong>{t('legal.privacy.page.rightWithdrawLabel')}</strong> - {t('legal.privacy.page.rightWithdrawDesc')}</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  {t('legal.privacy.page.section5Title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>{t('legal.privacy.page.securityIntro')}</p>
                <ul>
                  <li>{t('legal.privacy.page.security1')}</li>
                  <li>{t('legal.privacy.page.security2')}</li>
                  <li>{t('legal.privacy.page.security3')}</li>
                  <li>{t('legal.privacy.page.security4')}</li>
                  <li>{t('legal.privacy.page.security5')}</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  {t('legal.privacy.page.section6Title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  {t('legal.privacy.page.contactIntro')}
                </p>
                <ul>
                  <li>{t('legal.privacy.page.contactEmail')}</li>
                  <li>{t('legal.privacy.page.contactForm')}</li>
                </ul>
                <p>
                  {t('legal.privacy.page.contactComplaint')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
