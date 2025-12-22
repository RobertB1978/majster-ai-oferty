import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Cookie, Shield, BarChart, Megaphone, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ConsentState {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

const shouldSkipConsent =
  (typeof navigator !== 'undefined' && (navigator.webdriver || /HeadlessChrome|Playwright/i.test(navigator.userAgent))) ||
  import.meta.env.VITE_DISABLE_COOKIE_CONSENT === 'true' ||
  import.meta.env.MODE === 'test';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    essential: true, // Always required
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    if (shouldSkipConsent) {
      return;
    }

    const savedConsent = localStorage.getItem('cookie_consent');
    if (!savedConsent) {
      setIsVisible(true);
    }
  }, []);

  const saveConsent = async (consentData: ConsentState) => {
    localStorage.setItem('cookie_consent', JSON.stringify(consentData));
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    
    // Save to database for GDPR compliance
    try {
      const consentTypes = [
        { type: 'cookies_essential', granted: consentData.essential },
        { type: 'cookies_analytics', granted: consentData.analytics },
        { type: 'cookies_marketing', granted: consentData.marketing },
      ];

      for (const c of consentTypes) {
        await supabase.from('user_consents').insert({
          consent_type: c.type,
          granted: c.granted,
          user_agent: navigator.userAgent,
          granted_at: c.granted ? new Date().toISOString() : null,
        });
      }
    } catch (error) {
      console.error('Error saving consent:', error);
    }

    setIsVisible(false);
  };

  const handleAcceptAll = () => {
    const fullConsent = { essential: true, analytics: true, marketing: true };
    setConsent(fullConsent);
    saveConsent(fullConsent);
  };

  const handleAcceptSelected = () => {
    saveConsent(consent);
  };

  const handleRejectAll = () => {
    const minimalConsent = { essential: true, analytics: false, marketing: false };
    setConsent(minimalConsent);
    saveConsent(minimalConsent);
  };

  if (!isVisible || shouldSkipConsent) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-lg shadow-2xl border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Cookie className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Ustawienia plików cookies</CardTitle>
                <CardDescription>
                  Dbamy o Twoją prywatność
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Używamy plików cookies, aby zapewnić najlepsze doświadczenia na naszej stronie. 
            Niektóre z nich są niezbędne do działania serwisu, inne pomagają nam ulepszać usługi.
          </p>

          {showDetails && (
            <div className="space-y-3 p-4 rounded-lg bg-muted/50 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <Label className="font-medium">Niezbędne</Label>
                </div>
                <Switch checked={true} disabled />
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Wymagane do prawidłowego działania strony. Nie można ich wyłączyć.
              </p>

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <BarChart className="h-4 w-4 text-blue-500" />
                  <Label className="font-medium">Analityczne</Label>
                </div>
                <Switch
                  checked={consent.analytics}
                  onCheckedChange={(checked) => setConsent({ ...consent, analytics: checked })}
                />
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Pomagają nam zrozumieć, jak korzystasz z serwisu.
              </p>

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-orange-500" />
                  <Label className="font-medium">Marketingowe</Label>
                </div>
                <Switch
                  checked={consent.marketing}
                  onCheckedChange={(checked) => setConsent({ ...consent, marketing: checked })}
                />
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Służą do personalizacji reklam.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Ukryj szczegóły' : 'Dostosuj'}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleRejectAll}
            >
              Tylko niezbędne
            </Button>
            {showDetails ? (
              <Button className="flex-1" onClick={handleAcceptSelected}>
                Zapisz wybrane
              </Button>
            ) : (
              <Button className="flex-1" onClick={handleAcceptAll}>
                Akceptuję wszystkie
              </Button>
            )}
          </div>

          <div className="flex justify-center gap-4 pt-2">
            <a href="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Polityka prywatności
            </a>
            <a href="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Regulamin
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
