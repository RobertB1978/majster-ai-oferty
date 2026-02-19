import { useState, useEffect, useRef } from 'react';
import { useProfile, useUpdateProfile, useUploadLogo } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { profileSchema, ProfileFormData } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Building2, Upload, Loader2, Save, User, Phone, Mail, MapPin, CreditCard, FileText, MessageSquare, ChevronDown, Image } from 'lucide-react';
import { toast } from 'sonner';
import { BiometricSetup } from '@/components/auth/BiometricSetup';
import { validateFile, FILE_VALIDATION_CONFIGS } from '@/lib/fileValidation';

export default function CompanyProfile() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadLogo = useUploadLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ProfileFormData>({
    company_name: '',
    owner_name: '',
    nip: '',
    street: '',
    city: '',
    postal_code: '',
    phone: '',
    email_for_offers: '',
    bank_account: '',
    email_subject_template: '',
    email_greeting: '',
    email_signature: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [openSections, setOpenSections] = useState({
    company: true,
    email: true,
    security: false,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        company_name: profile.company_name || '',
        owner_name: profile.owner_name || '',
        nip: profile.nip || '',
        street: profile.street || '',
        city: profile.city || '',
        postal_code: profile.postal_code || '',
        phone: profile.phone || '',
        email_for_offers: profile.email_for_offers || '',
        bank_account: profile.bank_account || '',
        email_subject_template: profile.email_subject_template || 'Oferta od {company_name}',
        email_greeting: profile.email_greeting || 'Szanowny Kliencie,',
        email_signature: profile.email_signature || 'Z poważaniem',
      });
    }
  }, [profile]);

  const validateForm = (): boolean => {
    const result = profileSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Popraw błędy w formularzu');
      return;
    }

    try {
      await updateProfile.mutateAsync(formData);
    } catch (err) {
      console.error('Profile update failed:', err);
      toast.error('Nie udało się zapisać profilu. Spróbuj ponownie.');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    await uploadLogo.mutateAsync(file);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Profil firmy</h1>
        <p className="mt-1 text-muted-foreground">
          Dane firmowe używane w generowanych ofertach PDF
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Logo Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Logo firmy
            </CardTitle>
            <CardDescription>
              Przesłane logo będzie widoczne na ofertach
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              {profile?.logo_url ? (
                <div className="relative group">
                  <img
                    src={profile.logo_url}
                    alt="Logo firmy"
                    className="h-32 w-32 rounded-lg border border-border object-contain transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Zmień
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted">
                  <Building2 className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadLogo.isPending}
              >
                {uploadLogo.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Prześlij logo
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Max 2MB, format: JPG, PNG
              </p>
            </div>

            {/* PDF Preview mockup */}
            {profile?.logo_url && (
              <div className="mt-6 p-4 rounded-lg border bg-background">
                <p className="text-xs text-muted-foreground mb-2">Podgląd na ofercie:</p>
                <div className="flex items-center gap-3">
                  <img
                    src={profile.logo_url}
                    alt="Logo"
                    className="h-8 w-8 object-contain"
                  />
                  <div>
                    <p className="text-sm font-medium">{formData.company_name || 'Nazwa firmy'}</p>
                    <p className="text-xs text-muted-foreground">{formData.phone || 'Telefon'}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit}>
            {/* Company Data Section */}
            <Collapsible
              open={openSections.company}
              onOpenChange={(open) => setOpenSections(prev => ({ ...prev, company: open }))}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          Dane firmy
                        </CardTitle>
                        <CardDescription>
                          Podstawowe informacje o firmie
                        </CardDescription>
                      </div>
                      <ChevronDown className={`h-5 w-5 transition-transform ${openSections.company ? 'rotate-180' : ''}`} />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Company Name */}
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="company_name" className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Nazwa firmy *
                        </Label>
                        <Input
                          id="company_name"
                          value={formData.company_name}
                          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                          placeholder="np. Remonty Kowalski"
                          className={errors.company_name ? 'border-destructive' : ''}
                        />
                        {errors.company_name && (
                          <p className="text-sm text-destructive">{errors.company_name}</p>
                        )}
                      </div>

                      {/* Owner Name */}
                      <div className="space-y-2">
                        <Label htmlFor="owner_name" className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Imię i nazwisko właściciela
                        </Label>
                        <Input
                          id="owner_name"
                          value={formData.owner_name}
                          onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                          placeholder="Jan Kowalski"
                          className={errors.owner_name ? 'border-destructive' : ''}
                        />
                        {errors.owner_name && (
                          <p className="text-sm text-destructive">{errors.owner_name}</p>
                        )}
                      </div>

                      {/* NIP */}
                      <div className="space-y-2">
                        <Label htmlFor="nip" className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          NIP
                        </Label>
                        <Input
                          id="nip"
                          value={formData.nip}
                          onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                          placeholder="1234567890"
                          className={errors.nip ? 'border-destructive' : ''}
                        />
                        {errors.nip && (
                          <p className="text-sm text-destructive">{errors.nip}</p>
                        )}
                      </div>

                      {/* Street */}
                      <div className="space-y-2">
                        <Label htmlFor="street" className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Ulica i numer
                        </Label>
                        <Input
                          id="street"
                          value={formData.street}
                          onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                          placeholder="ul. Przykładowa 1"
                          className={errors.street ? 'border-destructive' : ''}
                        />
                        {errors.street && (
                          <p className="text-sm text-destructive">{errors.street}</p>
                        )}
                      </div>

                      {/* City */}
                      <div className="space-y-2">
                        <Label htmlFor="city">Miasto</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="Warszawa"
                          className={errors.city ? 'border-destructive' : ''}
                        />
                        {errors.city && (
                          <p className="text-sm text-destructive">{errors.city}</p>
                        )}
                      </div>

                      {/* Postal Code */}
                      <div className="space-y-2">
                        <Label htmlFor="postal_code">Kod pocztowy</Label>
                        <Input
                          id="postal_code"
                          value={formData.postal_code}
                          onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                          placeholder="00-001"
                          className={errors.postal_code ? 'border-destructive' : ''}
                        />
                        {errors.postal_code && (
                          <p className="text-sm text-destructive">{errors.postal_code}</p>
                        )}
                      </div>

                      {/* Phone */}
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Telefon
                        </Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+48 123 456 789"
                          className={errors.phone ? 'border-destructive' : ''}
                        />
                        {errors.phone && (
                          <p className="text-sm text-destructive">{errors.phone}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label htmlFor="email_for_offers" className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email do ofert
                        </Label>
                        <Input
                          id="email_for_offers"
                          type="email"
                          value={formData.email_for_offers}
                          onChange={(e) => setFormData({ ...formData, email_for_offers: e.target.value })}
                          placeholder="kontakt@firma.pl"
                          className={errors.email_for_offers ? 'border-destructive' : ''}
                        />
                        {errors.email_for_offers && (
                          <p className="text-sm text-destructive">{errors.email_for_offers}</p>
                        )}
                      </div>

                      {/* Bank Account */}
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="bank_account" className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Numer konta bankowego
                        </Label>
                        <Input
                          id="bank_account"
                          value={formData.bank_account}
                          onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                          placeholder="00 0000 0000 0000 0000 0000 0000"
                          className={errors.bank_account ? 'border-destructive' : ''}
                        />
                        {errors.bank_account && (
                          <p className="text-sm text-destructive">{errors.bank_account}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Email Settings Section */}
            <Collapsible
              open={openSections.email}
              onOpenChange={(open) => setOpenSections(prev => ({ ...prev, email: open }))}
              className="mt-6"
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          Ustawienia wiadomości e-mail
                        </CardTitle>
                        <CardDescription>
                          Personalizuj wiadomości wysyłane z ofertami
                        </CardDescription>
                      </div>
                      <ChevronDown className={`h-5 w-5 transition-transform ${openSections.email ? 'rotate-180' : ''}`} />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email_subject_template">Domyślny temat wiadomości</Label>
                      <Input
                        id="email_subject_template"
                        value={formData.email_subject_template}
                        onChange={(e) => setFormData({ ...formData, email_subject_template: e.target.value })}
                        placeholder="Oferta od {company_name}"
                        className={errors.email_subject_template ? 'border-destructive' : ''}
                      />
                      <p className="text-xs text-muted-foreground">
                        Użyj {'{company_name}'} aby wstawić nazwę firmy
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email_greeting">Powitanie w wiadomości</Label>
                      <Textarea
                        id="email_greeting"
                        value={formData.email_greeting}
                        onChange={(e) => setFormData({ ...formData, email_greeting: e.target.value })}
                        placeholder="Szanowny Kliencie,"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email_signature">Podpis w wiadomości</Label>
                      <Textarea
                        id="email_signature"
                        value={formData.email_signature}
                        onChange={(e) => setFormData({ ...formData, email_signature: e.target.value })}
                        placeholder="Z poważaniem"
                        rows={2}
                      />
                    </div>

                    {/* Email Preview */}
                    <div className="p-4 rounded-lg border bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-2">Podgląd wiadomości:</p>
                      <div className="text-sm space-y-2">
                        <p className="font-medium">Temat: {formData.email_subject_template.replace('{company_name}', formData.company_name || 'Twoja Firma')}</p>
                        <p className="text-muted-foreground">{formData.email_greeting}</p>
                        <p className="text-muted-foreground italic">...treść wiadomości...</p>
                        <p className="text-muted-foreground">{formData.email_signature}</p>
                        <p className="text-muted-foreground">{formData.company_name || 'Nazwa firmy'}</p>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            <Button
              type="submit"
              size="lg"
              className="w-full sm:w-auto mt-6"
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-5 w-5" />
              Zapisz profil
            </Button>
          </form>

          {/* Security Settings */}
          {user?.email && <BiometricSetup email={user.email} />}
        </div>
      </div>
    </div>
  );
}
