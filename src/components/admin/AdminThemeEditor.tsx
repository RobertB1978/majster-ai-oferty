import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Palette,
  Type,
  Layout,
  Sparkles,
  RotateCcw,
  Save,
  Eye,
  Loader
} from 'lucide-react';

interface DisplayTheme {
  primary_hue: number;
  primary_saturation: number;
  primary_lightness: number;
  accent_hue: number;
  border_radius: number;
  font_size: number;
  font_family: string;
  spacing: number;
}

const fontOptions = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Poppins',
  'Montserrat',
  'Source Sans Pro',
  'Nunito',
  'Work Sans',
  'DM Sans',
];

export function AdminThemeEditor() {
  const { session } = useAuth();
  const organizationId = session?.user?.user_metadata?.organization_id;
  const { theme: dbTheme, loading, error, updateTheme: updateDbTheme, applyTheme: applyDbTheme, resetTheme: resetDbTheme } = useAdminTheme(organizationId);
  const [displayTheme, setDisplayTheme] = useState<DisplayTheme | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Initialize display theme from database
  useEffect(() => {
    if (dbTheme) {
      setDisplayTheme({
        primary_hue: dbTheme.primary_hue ?? 210,
        primary_saturation: dbTheme.primary_saturation ?? 100,
        primary_lightness: dbTheme.primary_lightness ?? 50,
        accent_hue: dbTheme.accent_hue ?? 265,
        border_radius: dbTheme.border_radius ?? 8,
        font_size: dbTheme.font_size ?? 14,
        font_family: dbTheme.font_family ?? 'Inter',
        spacing: dbTheme.spacing ?? 4,
      });
    }
  }, [dbTheme]);

  const updateTheme = (key: keyof DisplayTheme, value: number | string) => {
    setDisplayTheme(prev => prev ? { ...prev, [key]: value } : null);
  };

  const saveTheme = async () => {
    if (displayTheme) {
      await updateDbTheme(displayTheme);
    }
  };

  const resetTheme = () => {
    resetDbTheme();
  };

  const togglePreview = () => {
    if (!previewMode && displayTheme) {
      applyDbTheme(displayTheme);
    } else if (previewMode && dbTheme) {
      document.documentElement.style.cssText = '';
      applyDbTheme(dbTheme);
    }
    setPreviewMode(!previewMode);
  };

  if (loading || !displayTheme) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader className="h-5 w-5 animate-spin" />
          <span className="ml-2">Wczytywanie motywu...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 text-red-600">
          Błąd wczytywania motywu: {error?.message || 'Nieznany błąd'}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Edytor motywu
        </CardTitle>
        <CardDescription>
          Dostosuj wygląd aplikacji: kolory, czcionki, zaokrąglenia
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="colors">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="colors" className="flex items-center gap-1">
              <Palette className="h-4 w-4" />
              Kolory
            </TabsTrigger>
            <TabsTrigger value="typography" className="flex items-center gap-1">
              <Type className="h-4 w-4" />
              Typografia
            </TabsTrigger>
            <TabsTrigger value="layout" className="flex items-center gap-1">
              <Layout className="h-4 w-4" />
              Układ
            </TabsTrigger>
            <TabsTrigger value="effects" className="flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              Efekty
            </TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-6 mt-4">
            {/* Primary Color */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Kolor główny (Primary)</Label>
                <div
                  className="w-12 h-12 rounded-lg border-2 border-border"
                  style={{
                    backgroundColor: `hsl(${displayTheme.primary_hue}, ${displayTheme.primary_saturation}%, ${displayTheme.primary_lightness}%)`
                  }}
                />
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Odcień (Hue)</span>
                    <span>{displayTheme.primary_hue}°</span>
                  </div>
                  <Slider
                    value={[displayTheme.primary_hue]}
                    onValueChange={([v]) => updateTheme('primary_hue', v)}
                    max={360}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Nasycenie (Saturation)</span>
                    <span>{displayTheme.primary_saturation}%</span>
                  </div>
                  <Slider
                    value={[displayTheme.primary_saturation]}
                    onValueChange={([v]) => updateTheme('primary_saturation', v)}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Jasność (Lightness)</span>
                    <span>{displayTheme.primary_lightness}%</span>
                  </div>
                  <Slider
                    value={[displayTheme.primary_lightness]}
                    onValueChange={([v]) => updateTheme('primary_lightness', v)}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Accent Color */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Kolor akcentu</Label>
                <div
                  className="w-12 h-12 rounded-lg border-2 border-border"
                  style={{
                    backgroundColor: `hsl(${displayTheme.accent_hue}, 83%, 54%)`
                  }}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Odcień akcentu</span>
                  <span>{displayTheme.accent_hue}°</span>
                </div>
                <Slider
                  value={[displayTheme.accent_hue]}
                  onValueChange={([v]) => updateTheme('accent_hue', v)}
                  max={360}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>

            {/* Color Presets */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Gotowe schematy kolorów</Label>
              <div className="grid grid-cols-6 gap-2">
                {[
                  { name: 'Ocean', hue: 222, sat: 47, light: 11 },
                  { name: 'Forest', hue: 142, sat: 76, light: 36 },
                  { name: 'Sunset', hue: 25, sat: 95, light: 53 },
                  { name: 'Berry', hue: 280, sat: 65, light: 45 },
                  { name: 'Rose', hue: 350, sat: 89, light: 60 },
                  { name: 'Slate', hue: 215, sat: 20, light: 35 },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      updateTheme('primaryHue', preset.hue);
                      updateTheme('primarySaturation', preset.sat);
                      updateTheme('primaryLightness', preset.light);
                    }}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div 
                      className="w-10 h-10 rounded-lg"
                      style={{ backgroundColor: `hsl(${preset.hue}, ${preset.sat}%, ${preset.light}%)` }}
                    />
                    <span className="text-xs">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="typography" className="space-y-6 mt-4">
            {/* Font Family */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Czcionka</Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {fontOptions.map((font) => (
                  <button
                    key={font}
                    onClick={() => updateTheme('font_family', font)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      displayTheme.font_family === font
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                    style={{ fontFamily: font }}
                  >
                    {font}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Rozmiar bazowy</Label>
                <span className="text-sm text-muted-foreground">{displayTheme.font_size}px</span>
              </div>
              <Slider
                value={[displayTheme.font_size]}
                onValueChange={([v]) => updateTheme('font_size', v)}
                min={12}
                max={20}
                step={1}
                className="w-full"
              />
              <div className="p-4 rounded-lg bg-muted">
                <p style={{ fontSize: `${displayTheme.font_size}px`, fontFamily: displayTheme.font_family }}>
                  Przykładowy tekst - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </p>
                <p className="mt-2" style={{ fontSize: `${displayTheme.font_size * 0.875}px`, fontFamily: displayTheme.font_family }}>
                  Mniejszy tekst - Ut enim ad minim veniam.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="layout" className="space-y-6 mt-4">
            {/* Border Radius */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Zaokrąglenie rogów</Label>
                <span className="text-sm text-muted-foreground">{displayTheme.border_radius}px</span>
              </div>
              <Slider
                value={[displayTheme.border_radius]}
                onValueChange={([v]) => updateTheme('border_radius', v)}
                min={0}
                max={24}
                step={1}
                className="w-full"
              />
              <div className="flex gap-4">
                <div
                  className="w-24 h-16 bg-primary"
                  style={{ borderRadius: `${displayTheme.border_radius}px` }}
                />
                <div
                  className="w-24 h-16 bg-secondary border"
                  style={{ borderRadius: `${displayTheme.border_radius}px` }}
                />
                <div
                  className="w-24 h-16 bg-muted border"
                  style={{ borderRadius: `${displayTheme.border_radius}px` }}
                />
              </div>
            </div>

            {/* Spacing */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Bazowy spacing</Label>
                <span className="text-sm text-muted-foreground">{displayTheme.spacing}px</span>
              </div>
              <Slider
                value={[displayTheme.spacing]}
                onValueChange={([v]) => updateTheme('spacing', v)}
                min={2}
                max={8}
                step={1}
                className="w-full"
              />
            </div>
          </TabsContent>

          <TabsContent value="effects" className="space-y-6 mt-4">
            <div className="grid gap-4">
              <Card className="border-dashed">
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    Efekty wizualne: animacje, cienie, gradienty - wkrótce dostępne
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <Button variant="outline" onClick={resetTheme}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetuj
          </Button>
          <div className="flex gap-2">
            <Button 
              variant={previewMode ? "secondary" : "outline"} 
              onClick={togglePreview}
            >
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? 'Wyłącz podgląd' : 'Podgląd'}
            </Button>
            <Button onClick={saveTheme}>
              <Save className="h-4 w-4 mr-2" />
              Zapisz motyw
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
