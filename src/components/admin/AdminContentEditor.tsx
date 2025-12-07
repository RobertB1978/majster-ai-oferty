import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Home, 
  HelpCircle, 
  Mail,
  Save,
  Eye,
  RotateCcw,
  Type,
  Image,
  Link2
} from 'lucide-react';
import { toast } from 'sonner';

interface ContentConfig {
  // Landing Page
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  heroCtaLink: string;
  
  // Features
  feature1Title: string;
  feature1Desc: string;
  feature2Title: string;
  feature2Desc: string;
  feature3Title: string;
  feature3Desc: string;
  
  // Footer
  footerCompanyName: string;
  footerCopyright: string;
  footerDescription: string;
  
  // Contact
  supportEmail: string;
  phoneNumber: string;
  address: string;
  
  // SEO
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
}

const defaultContent: ContentConfig = {
  heroTitle: 'Majster.AI - Profesjonalne wyceny dla fachowców',
  heroSubtitle: 'Twórz wyceny szybko i profesjonalnie. Generuj PDF, zarządzaj klientami i projektami.',
  heroCtaText: 'Rozpocznij za darmo',
  heroCtaLink: '/register',
  feature1Title: 'Szybkie wyceny',
  feature1Desc: 'Twórz profesjonalne wyceny w kilka minut dzięki szablonom i AI.',
  feature2Title: 'PDF Premium',
  feature2Desc: 'Generuj eleganckie dokumenty PDF z logo firmy i pełnymi danymi.',
  feature3Title: 'Zarządzanie projektami',
  feature3Desc: 'Śledź postęp, zarządzaj klientami i kontroluj koszty.',
  footerCompanyName: 'Majster.AI',
  footerCopyright: '© 2024 Majster.AI. Wszelkie prawa zastrzeżone.',
  footerDescription: 'Profesjonalna platforma do tworzenia wycen dla fachowców.',
  supportEmail: 'support@majster.ai',
  phoneNumber: '+48 123 456 789',
  address: 'ul. Przykładowa 1, 00-001 Warszawa',
  metaTitle: 'Majster.AI - Wyceny i kosztorysy dla fachowców',
  metaDescription: 'Twórz profesjonalne wyceny, generuj PDF i zarządzaj projektami. Idealne dla elektryków, hydraulików i firm remontowych.',
  ogImage: '/og-image.png',
};

export function AdminContentEditor() {
  const [content, setContent] = useState<ContentConfig>(() => {
    const saved = localStorage.getItem('admin-content-config');
    return saved ? JSON.parse(saved) : defaultContent;
  });
  const [hasChanges, setHasChanges] = useState(false);

  const updateContent = <K extends keyof ContentConfig>(
    key: K, 
    value: ContentConfig[K]
  ) => {
    setContent(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveContent = () => {
    localStorage.setItem('admin-content-config', JSON.stringify(content));
    setHasChanges(false);
    toast.success('Treści zapisane');
  };

  const resetContent = () => {
    setContent(defaultContent);
    setHasChanges(true);
    toast.info('Przywrócono domyślne treści');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Edytor treści
        </CardTitle>
        <CardDescription>
          Edytuj teksty, opisy i treści wyświetlane w aplikacji
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="landing">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="landing" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              Landing
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-1">
              <Type className="h-4 w-4" />
              Funkcje
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              Kontakt
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex items-center gap-1">
              <Link2 className="h-4 w-4" />
              SEO
            </TabsTrigger>
          </TabsList>

          <TabsContent value="landing" className="space-y-6 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tytuł główny (Hero)</Label>
                <Input
                  value={content.heroTitle}
                  onChange={(e) => updateContent('heroTitle', e.target.value)}
                  placeholder="Tytuł główny..."
                />
              </div>
              
              <div className="space-y-2">
                <Label>Podtytuł</Label>
                <Textarea
                  value={content.heroSubtitle}
                  onChange={(e) => updateContent('heroSubtitle', e.target.value)}
                  placeholder="Opis główny..."
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tekst CTA</Label>
                  <Input
                    value={content.heroCtaText}
                    onChange={(e) => updateContent('heroCtaText', e.target.value)}
                    placeholder="Rozpocznij"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Link CTA</Label>
                  <Input
                    value={content.heroCtaLink}
                    onChange={(e) => updateContent('heroCtaLink', e.target.value)}
                    placeholder="/register"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <Label className="text-base font-medium">Stopka</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nazwa firmy</Label>
                  <Input
                    value={content.footerCompanyName}
                    onChange={(e) => updateContent('footerCompanyName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Copyright</Label>
                  <Input
                    value={content.footerCopyright}
                    onChange={(e) => updateContent('footerCopyright', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Opis w stopce</Label>
                <Textarea
                  value={content.footerDescription}
                  onChange={(e) => updateContent('footerDescription', e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-6 mt-4">
            {[1, 2, 3].map((num) => (
              <div key={num} className="space-y-4 p-4 rounded-lg border">
                <Label className="text-base font-medium">Funkcja {num}</Label>
                <div className="space-y-2">
                  <Label>Tytuł</Label>
                  <Input
                    value={content[`feature${num}Title` as keyof ContentConfig] as string}
                    onChange={(e) => updateContent(`feature${num}Title` as keyof ContentConfig, e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Opis</Label>
                  <Textarea
                    value={content[`feature${num}Desc` as keyof ContentConfig] as string}
                    onChange={(e) => updateContent(`feature${num}Desc` as keyof ContentConfig, e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="contact" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Email wsparcia</Label>
              <Input
                type="email"
                value={content.supportEmail}
                onChange={(e) => updateContent('supportEmail', e.target.value)}
                placeholder="support@majster.ai"
              />
            </div>
            <div className="space-y-2">
              <Label>Numer telefonu</Label>
              <Input
                value={content.phoneNumber}
                onChange={(e) => updateContent('phoneNumber', e.target.value)}
                placeholder="+48 123 456 789"
              />
            </div>
            <div className="space-y-2">
              <Label>Adres</Label>
              <Textarea
                value={content.address}
                onChange={(e) => updateContent('address', e.target.value)}
                rows={2}
              />
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Meta Title</Label>
              <Input
                value={content.metaTitle}
                onChange={(e) => updateContent('metaTitle', e.target.value)}
                placeholder="Tytuł strony..."
              />
              <p className="text-xs text-muted-foreground">
                {content.metaTitle.length}/60 znaków
              </p>
            </div>
            <div className="space-y-2">
              <Label>Meta Description</Label>
              <Textarea
                value={content.metaDescription}
                onChange={(e) => updateContent('metaDescription', e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {content.metaDescription.length}/160 znaków
              </p>
            </div>
            <div className="space-y-2">
              <Label>OG Image URL</Label>
              <Input
                value={content.ogImage}
                onChange={(e) => updateContent('ogImage', e.target.value)}
                placeholder="/og-image.png"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <Button variant="outline" onClick={resetContent}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetuj
          </Button>
          <div className="flex gap-2">
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Podgląd
            </Button>
            <Button onClick={saveContent} disabled={!hasChanges}>
              <Save className="h-4 w-4 mr-2" />
              Zapisz treści
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
