import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Cookie, Shield, BarChart, Megaphone, Settings } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function CookiesPolicy() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lastUpdated = new Date().toLocaleDateString(i18n.language === 'pl' ? 'pl-PL' : i18n.language === 'uk' ? 'uk-UA' : 'en-GB');

  const cookies = [
    {
      name: 'sb-auth-token',
      type: t('legal.cookies.necessary'),
      purpose: i18n.language === 'pl' ? 'Autoryzacja użytkownika w systemie' : i18n.language === 'uk' ? 'Автентифікація користувача' : 'User authentication',
      duration: i18n.language === 'pl' ? 'Sesja / 7 dni' : i18n.language === 'uk' ? 'Сесія / 7 днів' : 'Session / 7 days',
      provider: 'Supabase',
    },
    {
      name: 'cookie_consent',
      type: t('legal.cookies.necessary'),
      purpose: i18n.language === 'pl' ? 'Zapamiętanie preferencji cookies' : i18n.language === 'uk' ? 'Збереження налаштувань cookies' : 'Cookie preference storage',
      duration: i18n.language === 'pl' ? '1 rok' : i18n.language === 'uk' ? '1 рік' : '1 year',
      provider: 'Majster.AI',
    },
    {
      name: 'theme',
      type: t('legal.cookies.necessary'),
      purpose: i18n.language === 'pl' ? 'Preferencja motywu (jasny/ciemny)' : i18n.language === 'uk' ? 'Налаштування теми (світла/темна)' : 'Theme preference (light/dark)',
      duration: i18n.language === 'pl' ? '1 rok' : i18n.language === 'uk' ? '1 рік' : '1 year',
      provider: 'Majster.AI',
    },
    {
      name: 'i18nextLng',
      type: t('legal.cookies.necessary'),
      purpose: i18n.language === 'pl' ? 'Preferencja języka interfejsu' : i18n.language === 'uk' ? 'Мовні налаштування' : 'Language preference',
      duration: i18n.language === 'pl' ? '1 rok' : i18n.language === 'uk' ? '1 рік' : '1 year',
      provider: 'Majster.AI',
    },
    {
      name: '_ga',
      type: t('legal.cookies.analytics'),
      purpose: i18n.language === 'pl' ? 'Identyfikator Google Analytics' : i18n.language === 'uk' ? 'Ідентифікатор Google Analytics' : 'Google Analytics identifier',
      duration: i18n.language === 'pl' ? '2 lata' : i18n.language === 'uk' ? '2 роки' : '2 years',
      provider: 'Google',
    },
    {
      name: '_gid',
      type: t('legal.cookies.analytics'),
      purpose: i18n.language === 'pl' ? 'Rozróżnianie użytkowników' : i18n.language === 'uk' ? 'Розрізнення користувачів' : 'User distinction',
      duration: i18n.language === 'pl' ? '24 godziny' : i18n.language === 'uk' ? '24 години' : '24 hours',
      provider: 'Google',
    },
  ];

  return (
    <>
      <SEOHead
        title={t('legal.cookies.metaTitle')}
        description={t('legal.cookies.metaDesc')}
        keywords="cookies, cookie policy, GDPR, Majster.AI"
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
              <Cookie className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">{t('legal.cookies.pageTitle')}</h1>
            <p className="text-muted-foreground">
              {t('legal.cookies.subtitle')}
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Cookie className="h-5 w-5 text-primary" />
                  {t('legal.cookies.whatAreCookies')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>{t('legal.cookies.whatAreCookiesText')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-success" />
                  {t('legal.cookies.necessary')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p className="mb-4">{t('legal.cookies.necessaryText')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <BarChart className="h-5 w-5 text-info" />
                  {t('legal.cookies.analytics')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>{t('legal.cookies.analyticsText')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Megaphone className="h-5 w-5 text-warning" />
                  {t('legal.cookies.marketing')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>{t('legal.cookies.marketingText')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('legal.cookies.list')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('legal.cookies.colName')}</TableHead>
                        <TableHead>{t('legal.cookies.colType')}</TableHead>
                        <TableHead>{t('legal.cookies.colPurpose')}</TableHead>
                        <TableHead>{t('legal.cookies.colDuration')}</TableHead>
                        <TableHead>{t('legal.cookies.colProvider')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cookies.map((cookie) => (
                        <TableRow key={cookie.name}>
                          <TableCell className="font-mono text-sm">{cookie.name}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              cookie.type === t('legal.cookies.necessary')
                                ? 'bg-success/10 text-success'
                                : 'bg-info/10 text-info'
                            }`}>
                              {cookie.type}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{cookie.purpose}</TableCell>
                          <TableCell className="text-muted-foreground">{cookie.duration}</TableCell>
                          <TableCell className="text-muted-foreground">{cookie.provider}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-primary" />
                  {t('legal.cookies.howToManage')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>{t('legal.cookies.howToManageText')}</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>{t('legal.cookies.manageInApp')}</strong></li>
                  <li><strong>{t('legal.cookies.manageInBrowser')}</strong></li>
                  <li><strong>{t('legal.cookies.incognito')}</strong></li>
                </ul>
                <Button
                  className="mt-4"
                  onClick={() => {
                    localStorage.removeItem('cookie_consent');
                    window.location.reload();
                  }}
                >
                  {t('legal.cookies.changeSettings')}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 p-6 rounded-xl bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground">
              {t('legal.cookies.footer')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
