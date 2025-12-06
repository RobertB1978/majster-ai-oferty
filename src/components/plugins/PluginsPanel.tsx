import { useState } from 'react';
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
  name: string;
  description: string;
  category: 'accounting' | 'warehouse' | 'crm' | 'sms' | 'payments' | 'logistics';
  icon: React.ReactNode;
  enabled: boolean;
  premium: boolean;
  configUrl?: string;
}

const availablePlugins: Plugin[] = [
  {
    id: 'infakt',
    name: 'Infakt',
    description: 'Integracja z systemem księgowym Infakt - automatyczne faktury',
    category: 'accounting',
    icon: <Calculator className="h-6 w-6" />,
    enabled: false,
    premium: false,
    configUrl: 'https://infakt.pl',
  },
  {
    id: 'ifirma',
    name: 'iFirma',
    description: 'Eksport danych do księgowości iFirma',
    category: 'accounting',
    icon: <FileText className="h-6 w-6" />,
    enabled: false,
    premium: false,
  },
  {
    id: 'castorama',
    name: 'Castorama B2B',
    description: 'Integracja z hurtownią Castorama - ceny i dostępność',
    category: 'warehouse',
    icon: <Building2 className="h-6 w-6" />,
    enabled: false,
    premium: true,
  },
  {
    id: 'leroy',
    name: 'Leroy Merlin',
    description: 'Pobieraj ceny materiałów z Leroy Merlin',
    category: 'warehouse',
    icon: <Package className="h-6 w-6" />,
    enabled: false,
    premium: true,
  },
  {
    id: 'smsapi',
    name: 'SMSAPI',
    description: 'Wysyłaj SMS-y do klientów - przypomnienia i powiadomienia',
    category: 'sms',
    icon: <MessageSquare className="h-6 w-6" />,
    enabled: false,
    premium: false,
  },
  {
    id: 'przelewy24',
    name: 'Przelewy24',
    description: 'Płatności online dla klientów',
    category: 'payments',
    icon: <CreditCard className="h-6 w-6" />,
    enabled: false,
    premium: true,
  },
  {
    id: 'dpd',
    name: 'DPD',
    description: 'Śledzenie przesyłek i dostaw materiałów',
    category: 'logistics',
    icon: <Truck className="h-6 w-6" />,
    enabled: false,
    premium: false,
  },
];

const categoryLabels: Record<string, string> = {
  accounting: 'Księgowość',
  warehouse: 'Hurtownie',
  crm: 'CRM',
  sms: 'SMS',
  payments: 'Płatności',
  logistics: 'Logistyka',
};

export function PluginsPanel() {
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
      toast.success(plugin.enabled ? `${plugin.name} wyłączony` : `${plugin.name} włączony`);
    }
    
    setLoadingId(null);
  };

  const categories = [...new Set(plugins.map(p => p.category))];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Plug className="h-6 w-6 text-primary" />
          Integracje i pluginy
        </h2>
        <p className="text-muted-foreground">Rozszerz możliwości Majster.AI o zewnętrzne usługi</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {plugins.filter(p => p.enabled).length}
              </p>
              <p className="text-sm text-muted-foreground">Aktywnych integracji</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{plugins.length}</p>
              <p className="text-sm text-muted-foreground">Dostępnych pluginów</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-500">
                {plugins.filter(p => p.premium).length}
              </p>
              <p className="text-sm text-muted-foreground">Wymagających Premium</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plugins by category */}
      {categories.map((category) => (
        <div key={category}>
          <h3 className="text-lg font-semibold mb-4">{categoryLabels[category]}</h3>
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
                          {plugin.name}
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
                      {plugin.description}
                    </CardDescription>
                    <div className="flex items-center gap-2">
                      {plugin.enabled && (
                        <Badge variant="default" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          Aktywny
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
                          Konfiguruj
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
          <h3 className="font-semibold mb-2">Marketplace integracji</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Wkrótce udostępnimy marketplace z dodatkowymi integracjami tworzonymi przez społeczność.
            Zostań partnerem i stwórz własną integrację!
          </p>
          <Button variant="outline" className="mt-4">
            Zostań partnerem
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
