import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Plug,
  Calculator,
  Building2,
  MessageSquare,
  FileText,
  CreditCard,
  Package,
  Truck,
  ExternalLink,
  Check,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface Plugin {
  id: string;
  nameKey: string;
  descriptionKey: string;
  category: 'accounting' | 'warehouse' | 'crm' | 'sms' | 'payments' | 'logistics';
  icon: React.ReactNode;
  enabled: boolean;
  premium: boolean;
  configUrl?: string;
}

const availablePlugins: Plugin[] = [
  {
    id: 'infakt',
    nameKey: 'plugins.infakt.name',
    descriptionKey: 'plugins.infakt.description',
    category: 'accounting',
    icon: <Calculator className="h-6 w-6" />,
    enabled: false,
    premium: false,
    configUrl: 'https://infakt.pl',
  },
  {
    id: 'ifirma',
    nameKey: 'plugins.ifirma.name',
    descriptionKey: 'plugins.ifirma.description',
    category: 'accounting',
    icon: <FileText className="h-6 w-6" />,
    enabled: false,
    premium: false,
  },
  {
    id: 'castorama',
    nameKey: 'plugins.castorama.name',
    descriptionKey: 'plugins.castorama.description',
    category: 'warehouse',
    icon: <Building2 className="h-6 w-6" />,
    enabled: false,
    premium: true,
  },
  {
    id: 'leroy',
    nameKey: 'plugins.leroy.name',
    descriptionKey: 'plugins.leroy.description',
    category: 'warehouse',
    icon: <Package className="h-6 w-6" />,
    enabled: false,
    premium: true,
  },
  {
    id: 'smsapi',
    nameKey: 'plugins.smsapi.name',
    descriptionKey: 'plugins.smsapi.description',
    category: 'sms',
    icon: <MessageSquare className="h-6 w-6" />,
    enabled: false,
    premium: false,
  },
  {
    id: 'przelewy24',
    nameKey: 'plugins.przelewy24.name',
    descriptionKey: 'plugins.przelewy24.description',
    category: 'payments',
    icon: <CreditCard className="h-6 w-6" />,
    enabled: false,
    premium: true,
  },
  {
    id: 'dpd',
    nameKey: 'plugins.dpd.name',
    descriptionKey: 'plugins.dpd.description',
    category: 'logistics',
    icon: <Truck className="h-6 w-6" />,
    enabled: false,
    premium: false,
  },
];

export function PluginsPanel() {
  const { t } = useTranslation();
  const [plugins, setPlugins] = useState(availablePlugins);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggle = async (pluginId: string) => {
    setLoadingId(pluginId);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setPlugins(plugins.map(p =>
      p.id === pluginId ? { ...p, enabled: !p.enabled } : p
    ));

    const plugin = plugins.find(p => p.id === pluginId);
    if (plugin) {
      // After toggle, plugin.enabled reflects the OLD state
      toast.success(!plugin.enabled
        ? t('plugins.toast.enabled', { name: t(plugin.nameKey) })
        : t('plugins.toast.disabled', { name: t(plugin.nameKey) })
      );
    }

    setLoadingId(null);
  };

  const categories = [...new Set(plugins.map(p => p.category))];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Plug className="h-6 w-6 text-primary" />
          {t('plugins.title')}
        </h2>
        <p className="text-muted-foreground">{t('plugins.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {plugins.filter(p => p.enabled).length}
              </p>
              <p className="text-sm text-muted-foreground">{t('plugins.activeCount')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{plugins.length}</p>
              <p className="text-sm text-muted-foreground">{t('plugins.availableCount')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-500">
                {plugins.filter(p => p.premium).length}
              </p>
              <p className="text-sm text-muted-foreground">{t('plugins.premiumCount')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plugins by category */}
      {categories.map((category) => (
        <div key={category}>
          <h3 className="text-lg font-semibold mb-4">{t(`plugins.categories.${category}`)}</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plugins
              .filter(p => p.category === category)
              .map((plugin) => (
                <Card key={plugin.id} className={plugin.enabled ? 'ring-2 ring-primary' : ''}>
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${plugin.enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {plugin.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {t(plugin.nameKey)}
                          {plugin.premium && (
                            <Badge variant="secondary" className="text-xs">Premium</Badge>
                          )}
                        </CardTitle>
                      </div>
                    </div>
                    {loadingId === plugin.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Switch
                        checked={plugin.enabled}
                        onCheckedChange={() => handleToggle(plugin.id)}
                        disabled={plugin.premium}
                      />
                    )}
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">
                      {t(plugin.descriptionKey)}
                    </CardDescription>
                    <div className="flex items-center gap-2">
                      {plugin.enabled && (
                        <Badge variant="default" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          {t('plugins.active')}
                        </Badge>
                      )}
                      {plugin.configUrl && plugin.enabled && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7"
                          onClick={() => window.open(plugin.configUrl, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {t('plugins.configure')}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}

      {/* Coming Soon */}
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Plug className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold mb-2">{t('plugins.marketplace.title')}</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {t('plugins.marketplace.description')}
          </p>
          <Button variant="outline" className="mt-4">
            {t('plugins.marketplace.cta')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
