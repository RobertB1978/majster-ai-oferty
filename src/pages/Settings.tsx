import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Key, User, Bell } from 'lucide-react';
import { ApiKeysPanel } from '@/components/api/ApiKeysPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function Settings() {
  return (
    <>
      <Helmet>
        <title>Ustawienia | Majster.AI</title>
        <meta name="description" content="Zarządzaj ustawieniami aplikacji i kluczami API" />
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <SettingsIcon className="h-6 w-6" />
            Ustawienia
          </h1>
          <p className="text-muted-foreground">
            Zarządzaj ustawieniami aplikacji
          </p>
        </div>

        <Tabs defaultValue="api">
          <TabsList>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Klucze API
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Powiadomienia
            </TabsTrigger>
          </TabsList>

          <TabsContent value="api" className="mt-4">
            <ApiKeysPanel />
          </TabsContent>

          <TabsContent value="notifications" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Powiadomienia</CardTitle>
                <CardDescription>
                  Zarządzaj ustawieniami powiadomień
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Powiadomienia email</Label>
                    <p className="text-sm text-muted-foreground">
                      Otrzymuj powiadomienia o nowych ofertach
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Powiadomienia push</Label>
                    <p className="text-sm text-muted-foreground">
                      Otrzymuj powiadomienia w przeglądarce
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Przypomnienia o terminach</Label>
                    <p className="text-sm text-muted-foreground">
                      Przypomnienia o zbliżających się terminach projektów
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
