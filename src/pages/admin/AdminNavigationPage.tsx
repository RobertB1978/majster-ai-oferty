import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Navigation, Save, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { useConfig } from '@/contexts/ConfigContext';
import type { NavItem } from '@/data/appConfigSchema';

export default function AdminNavigationPage() {
  const { config, applyConfig } = useConfig();
  const [items, setItems] = useState<NavItem[]>(
    [...config.navigation.mainItems].sort((a, b) => a.order - b.order)
  );

  const toggleField = (index: number, field: 'visible' | 'comingSoon') => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: !item[field] } : item))
    );
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    setItems((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((item, i) => ({ ...item, order: i }));
    });
  };

  const handleSave = () => {
    applyConfig({ navigation: { mainItems: items } }, 'Zaktualizowano nawigację');
  };

  return (
    <>
      <Helmet>
        <title>Nawigacja | Owner Console | Majster.AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Navigation className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Edytor nawigacji</h1>
              <p className="text-sm text-muted-foreground">
                Kolejność, widoczność i flagi modułów
              </p>
            </div>
          </div>
          <Button size="sm" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Zapisz
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Elementy nawigacji</CardTitle>
            <CardDescription>Przesuń w górę/dół, włącz/wyłącz widoczność</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{item.label}</span>
                      <Badge variant="outline" className="text-xs shrink-0">{item.path}</Badge>
                      {item.requiredPlan !== 'free' && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {item.requiredPlan}+
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1">
                      <Label className="text-xs">Widoczny</Label>
                      <Switch checked={item.visible} onCheckedChange={() => toggleField(i, 'visible')} />
                    </div>
                    <div className="flex items-center gap-1">
                      <Label className="text-xs">Wkrótce</Label>
                      <Switch checked={item.comingSoon} onCheckedChange={() => toggleField(i, 'comingSoon')} />
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={i === 0} onClick={() => moveItem(i, -1)} aria-label="Przesuń w górę">
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={i === items.length - 1} onClick={() => moveItem(i, 1)} aria-label="Przesuń w dół">
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
