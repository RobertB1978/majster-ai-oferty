import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
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
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface ThemeConfig {
  primaryHue: number;
  primarySaturation: number;
  primaryLightness: number;
  accentHue: number;
  borderRadius: number;
  fontSize: number;
  fontFamily: string;
  spacing: number;
}

const defaultTheme: ThemeConfig = {
  primaryHue: 222,
  primarySaturation: 47,
  primaryLightness: 11,
  accentHue: 221,
  borderRadius: 8,
  fontSize: 16,
  fontFamily: 'Inter',
  spacing: 4,
};

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
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem('admin-theme-config');
    return saved ? JSON.parse(saved) : defaultTheme;
  });
  const [previewMode, setPreviewMode] = useState(false);

  const updateTheme = (key: keyof ThemeConfig, value: number | string) => {
    setTheme(prev => ({ ...prev, [key]: value }));
  };

  const applyTheme = () => {
    const root = document.documentElement;
    
    // Primary color
    root.style.setProperty('--primary', `${theme.primaryHue} ${theme.primarySaturation}% ${theme.primaryLightness}%`);
    
    // Accent color
    root.style.setProperty('--accent', `${theme.accentHue} 83% 54%`);
    
    // Border radius
    root.style.setProperty('--radius', `${theme.borderRadius}px`);
    
    // Font size
    root.style.fontSize = `${theme.fontSize}px`;
    
    // Font family
    root.style.fontFamily = `${theme.fontFamily}, system-ui, sans-serif`;
  };

  const saveTheme = () => {
    localStorage.setItem('admin-theme-config', JSON.stringify(theme));
    applyTheme();
    toast.success('Motyw zapisany i zastosowany');
  };

  const resetTheme = () => {
    setTheme(defaultTheme);
    localStorage.removeItem('admin-theme-config');
    document.documentElement.style.cssText = '';
    toast.info('Przywrócono domyślny motyw');
  };

  const togglePreview = () => {
    if (!previewMode) {
      applyTheme();
    } else {
      document.documentElement.style.cssText = '';
      const saved = localStorage.getItem('admin-theme-config');
      if (saved) {
        const savedTheme = JSON.parse(saved);
        setTheme(savedTheme);
      }
    }
    setPreviewMode(!previewMode);
  };

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
                    backgroundColor: `hsl(${theme.primaryHue}, ${theme.primarySaturation}%, ${theme.primaryLightness}%)` 
                  }}
                />
              </div>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Odcień (Hue)</span>
                    <span>{theme.primaryHue}°</span>
                  </div>
                  <Slider
                    value={[theme.primaryHue]}
                    onValueChange={([v]) => updateTheme('primaryHue', v)}
                    max={360}
                    step={1}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Nasycenie (Saturation)</span>
                    <span>{theme.primarySaturation}%</span>
                  </div>
                  <Slider
                    value={[theme.primarySaturation]}
                    onValueChange={([v]) => updateTheme('primarySaturation', v)}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Jasność (Lightness)</span>
                    <span>{theme.primaryLightness}%</span>
                  </div>
                  <Slider
                    value={[theme.primaryLightness]}
                    onValueChange={([v]) => updateTheme('primaryLightness', v)}
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
                    backgroundColor: `hsl(${theme.accentHue}, 83%, 54%)` 
                  }}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Odcień akcentu</span>
                  <span>{theme.accentHue}°</span>
                </div>
                <Slider
                  value={[theme.accentHue]}
                  onValueChange={([v]) => updateTheme('accentHue', v)}
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
                    onClick={() => updateTheme('fontFamily', font)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      theme.fontFamily === font 
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
                <span className="text-sm text-muted-foreground">{theme.fontSize}px</span>
              </div>
              <Slider
                value={[theme.fontSize]}
                onValueChange={([v]) => updateTheme('fontSize', v)}
                min={12}
                max={20}
                step={1}
                className="w-full"
              />
              <div className="p-4 rounded-lg bg-muted">
                <p style={{ fontSize: `${theme.fontSize}px`, fontFamily: theme.fontFamily }}>
                  Przykładowy tekst - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </p>
                <p className="mt-2" style={{ fontSize: `${theme.fontSize * 0.875}px`, fontFamily: theme.fontFamily }}>
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
                <span className="text-sm text-muted-foreground">{theme.borderRadius}px</span>
              </div>
              <Slider
                value={[theme.borderRadius]}
                onValueChange={([v]) => updateTheme('borderRadius', v)}
                min={0}
                max={24}
                step={1}
                className="w-full"
              />
              <div className="flex gap-4">
                <div 
                  className="w-24 h-16 bg-primary"
                  style={{ borderRadius: `${theme.borderRadius}px` }}
                />
                <div 
                  className="w-24 h-16 bg-secondary border"
                  style={{ borderRadius: `${theme.borderRadius}px` }}
                />
                <div 
                  className="w-24 h-16 bg-muted border"
                  style={{ borderRadius: `${theme.borderRadius}px` }}
                />
              </div>
            </div>

            {/* Spacing */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Bazowy spacing</Label>
                <span className="text-sm text-muted-foreground">{theme.spacing}px</span>
              </div>
              <Slider
                value={[theme.spacing]}
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
