import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { CreditCard, Save, Star } from 'lucide-react';
import { useConfig } from '@/contexts/ConfigContext';
import type { PlanTier } from '@/data/appConfigSchema';

export default function AdminPlansPage() {
  const { t } = useTranslation();
  const { config, applyConfig } = useConfig();
  const [tiers, setTiers] = useState<PlanTier[]>(config.plans.tiers);

  const updateTier = (index: number, patch: Partial<PlanTier>) => {
    setTiers((prev) => prev.map((ti, i) => (i === index ? { ...ti, ...patch } : ti)));
  };

  const handleSave = () => {
    applyConfig({ plans: { tiers } }, t('adminPlans.summaryUpdated'));
  };

  return (
    <>
      <Helmet>
        <title>{t('adminPlans.pageTitle')} | Owner Console | Majster.AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">{t('adminPlans.title')}</h1>
              <p className="text-sm text-muted-foreground">
                {t('adminPlans.description')}
              </p>
            </div>
          </div>
          <Button size="sm" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            {t('common.save')}
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {tiers.map((tier, i) => (
            <Card key={tier.id} className={tier.highlighted ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {tier.name}
                    {tier.highlighted && <Star className="h-4 w-4 fill-primary text-primary" />}
                  </CardTitle>
                  <Badge variant="outline">{tier.id}</Badge>
                </div>
                <CardDescription>
                  {tier.pricePLN === 0 ? t('adminPlans.free') : `${tier.pricePLN} ${t('adminPlans.plnPerMonth')}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">{t('adminPlans.pricePLN')}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={tier.pricePLN}
                      onChange={(e) => updateTier(i, { pricePLN: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('adminPlans.maxJobs')}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={tier.maxProjects}
                      onChange={(e) => updateTier(i, { maxProjects: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('adminPlans.maxClients')}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={tier.maxClients}
                      onChange={(e) => updateTier(i, { maxClients: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('adminPlans.maxTeam')}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={tier.maxTeamMembers}
                      onChange={(e) => updateTier(i, { maxTeamMembers: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{t('adminPlans.highlighted')}</Label>
                  <Switch
                    checked={tier.highlighted}
                    onCheckedChange={(v) => updateTier(i, { highlighted: v })}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
