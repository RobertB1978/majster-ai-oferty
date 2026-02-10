import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Sliders, Save, RotateCcw } from 'lucide-react';
import { useConfig } from '@/contexts/ConfigContext';

export default function AdminAppConfigPage() {
  const { t } = useTranslation();
  const { config, applyConfig, resetToDefaults } = useConfig();
  const [draft, setDraft] = useState(config.content);

  const handleSave = () => {
    applyConfig({ content: draft }, t('adminConfig.summaryContentUpdated'));
  };

  return (
    <>
      <Helmet>
        <title>{t('adminConfig.pageTitle')} | Owner Console | Majster.AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sliders className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">{t('adminConfig.title')}</h1>
              <p className="text-sm text-muted-foreground">
                {t('adminConfig.version')}: <Badge variant="outline">{config.version}</Badge>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetToDefaults}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {t('common.reset')}
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              {t('common.save')}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('adminConfig.landingContent')}</CardTitle>
            <CardDescription>{t('adminConfig.landingContentDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="headline">{t('adminConfig.mainHeadline')}</Label>
              <Input
                id="headline"
                value={draft.landingHeadline}
                onChange={(e) => setDraft({ ...draft, landingHeadline: e.target.value })}
                maxLength={120}
              />
              <p className="text-xs text-muted-foreground">{draft.landingHeadline.length}/120</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subheadline">{t('adminConfig.subtitle')}</Label>
              <Input
                id="subheadline"
                value={draft.landingSubheadline}
                onChange={(e) => setDraft({ ...draft, landingSubheadline: e.target.value })}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">{draft.landingSubheadline.length}/200</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('adminConfig.appFeatures')}</CardTitle>
            <CardDescription>{t('adminConfig.globalSwitches')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label>{t('adminConfig.onboarding')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('adminConfig.onboardingDesc')}
                </p>
              </div>
              <Switch
                checked={draft.onboardingEnabled}
                onCheckedChange={(v) => setDraft({ ...draft, onboardingEnabled: v })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
