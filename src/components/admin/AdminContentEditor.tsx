import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader } from 'lucide-react';
import {
  FileText,
  Home,
  Mail,
  Save,
  Eye,
  RotateCcw,
  Type,
  Link2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminContentConfig } from '@/hooks/useAdminContentConfig';

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
  const { session } = useAuth();
  const organizationId = session?.user?.user_metadata?.organization_id;
  const { contentConfig: dbContent, isLoading, error, updateContentConfig, isUpdating } = useAdminContentConfig(organizationId);

  const [content, setContent] = useState<ContentConfig>(defaultContent);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync from database on load
  useEffect(() => {
    if (dbContent) {
      setContent({
        heroTitle: dbContent.hero_title || defaultContent.heroTitle,
        heroSubtitle: dbContent.hero_subtitle || defaultContent.heroSubtitle,
        heroCtaText: dbContent.hero_cta_text || defaultContent.heroCtaText,
        heroCtaLink: dbContent.hero_cta_link || defaultContent.heroCtaLink,
        feature1Title: dbContent.feature1_title || defaultContent.feature1Title,
        feature1Desc: dbContent.feature1_desc || defaultContent.feature1Desc,
        feature2Title: dbContent.feature2_title || defaultContent.feature2Title,
        feature2Desc: dbContent.feature2_desc || defaultContent.feature2Desc,
        feature3Title: dbContent.feature3_title || defaultContent.feature3Title,
        feature3Desc: dbContent.feature3_desc || defaultContent.feature3Desc,
        footerCompanyName: dbContent.footer_company_name || defaultContent.footerCompanyName,
        footerCopyright: dbContent.footer_copyright || defaultContent.footerCopyright,
        footerDescription: dbContent.footer_description || defaultContent.footerDescription,
        supportEmail: dbContent.support_email || defaultContent.supportEmail,
        phoneNumber: dbContent.phone_number || defaultContent.phoneNumber,
        address: dbContent.address || defaultContent.address,
        metaTitle: dbContent.meta_title || defaultContent.metaTitle,
        metaDescription: dbContent.meta_description || defaultContent.metaDescription,
        ogImage: dbContent.og_image || defaultContent.ogImage,
      });
      setHasChanges(false);
    }
  }, [dbContent]);

  const updateContent = <K extends keyof ContentConfig>(
    key: K,
    value: ContentConfig[K]
  ) => {
    setContent(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveContent = async () => {
    try {
      // Convert camelCase to snake_case for database
      await updateContentConfig({
        hero_title: content.heroTitle,
        hero_subtitle: content.heroSubtitle,
        hero_cta_text: content.heroCtaText,
        hero_cta_link: content.heroCtaLink,
        feature1_title: content.feature1Title,
        feature1_desc: content.feature1Desc,
        feature2_title: content.feature2Title,
        feature2_desc: content.feature2Desc,
        feature3_title: content.feature3Title,
        feature3_desc: content.feature3Desc,
        footer_company_name: content.footerCompanyName,
        footer_copyright: content.footerCopyright,
        footer_description: content.footerDescription,
        support_email: content.supportEmail,
        phone_number: content.phoneNumber,
        address: content.address,
        meta_title: content.metaTitle,
        meta_description: content.metaDescription,
        og_image: content.ogImage,
      } as any);
      setHasChanges(false);
      toast.success('Treści zapisane w bazie danych');
    } catch (err) {
      toast.error('Błąd przy zapisywaniu treści');
    }
  };

  const resetContent = () => {
    setContent(defaultContent);
    setHasChanges(true);
    toast.info('Przywrócono domyślne treści');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader className="h-5 w-5 animate-spin" />
          <span className="ml-2">Wczytywanie treści...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 text-red-600">
          Błąd wczytywania treści: {error.message}
        </CardContent>
      </Card>
    );
  }

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
          <Button variant="outline" onClick={resetContent} disabled={isUpdating}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetuj
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" disabled={isUpdating}>
              <Eye className="h-4 w-4 mr-2" />
              Podgląd
            </Button>
            <Button onClick={saveContent} disabled={!hasChanges || isUpdating}>
              {isUpdating ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {isUpdating ? 'Zapisywanie...' : 'Zapisz treści'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
