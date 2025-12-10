import { useState, useEffect } from 'react';
import { useProfile, useUpdateProfile, useUploadLogo } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Building2, FileText, Phone, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { validateFile, FILE_VALIDATION_CONFIGS } from '@/lib/fileValidation';

const STEPS = {
  COMPANY_NAME: 0,
  NIP: 1,
  CONTACT: 2,
  LOGO: 3,
} as const;

const TOTAL_STEPS = 4;

export function OnboardingModal() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadLogo = useUploadLogo();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(STEPS.COMPANY_NAME);
  const [skipped, setSkipped] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [nip, setNip] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    if (isLoading || !user) return;

    // Check if user has already completed onboarding
    const hasCompletedOnboarding = profile?.company_name;

    // Check if user has skipped onboarding in this session
    const hasSkippedOnboarding = sessionStorage.getItem('onboarding_skipped') === 'true';

    if (!hasCompletedOnboarding && !hasSkippedOnboarding && !skipped) {
      setOpen(true);
    }
  }, [profile, isLoading, user, skipped]);

  const handleSkip = () => {
    sessionStorage.setItem('onboarding_skipped', 'true');
    setSkipped(true);
    setOpen(false);
    toast.info('Możesz uzupełnić profil firmy w dowolnym momencie w ustawieniach');
  };

  const handleNext = async () => {
    try {
      if (step === STEPS.COMPANY_NAME) {
        if (!companyName.trim()) {
          toast.error('Podaj nazwę firmy');
          return;
        }
        await updateProfile.mutateAsync({ company_name: companyName });
        setStep(STEPS.NIP);
      } else if (step === STEPS.NIP) {
        if (nip.trim()) {
          await updateProfile.mutateAsync({ nip });
        }
        setStep(STEPS.CONTACT);
      } else if (step === STEPS.CONTACT) {
        if (phone.trim() || email.trim()) {
          await updateProfile.mutateAsync({
            phone: phone.trim() || undefined,
            email_for_offers: email.trim() || undefined,
          });
        }
        setStep(STEPS.LOGO);
      } else if (step === STEPS.LOGO) {
        if (logoFile) {
          const validation = validateFile(logoFile, FILE_VALIDATION_CONFIGS.logo);
          if (!validation.valid) {
            toast.error(validation.error);
            return;
          }
          await uploadLogo.mutateAsync(logoFile);
        }
        setOpen(false);
        toast.success('Profil firmy został skonfigurowany!');
      }
    } catch (error) {
      console.error('Onboarding error:', error);
    }
  };

  const handleBack = () => {
    if (step > STEPS.COMPANY_NAME) {
      setStep(step - 1);
    }
  };

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  if (isLoading) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Witaj w Majster.AI!
          </DialogTitle>
          <DialogDescription>
            Skonfiguruj swój profil firmy w kilku prostych krokach
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground">
            Krok {step + 1} z {TOTAL_STEPS}
          </p>

          {step === STEPS.COMPANY_NAME && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Building2 className="h-5 w-5" />
                <h3 className="font-semibold">Nazwa firmy</h3>
              </div>
              <div>
                <Label htmlFor="company_name">Jak nazywa się Twoja firma? *</Label>
                <Input
                  id="company_name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="np. Remonty Kowalski"
                  autoFocus
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Nazwa będzie widoczna na ofertach PDF
                </p>
              </div>
            </div>
          )}

          {step === STEPS.NIP && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <FileText className="h-5 w-5" />
                <h3 className="font-semibold">NIP</h3>
              </div>
              <div>
                <Label htmlFor="nip">NIP firmy (opcjonalnie)</Label>
                <Input
                  id="nip"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder="1234567890"
                  autoFocus
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Możesz dodać później. Ten krok można pominąć.
                </p>
              </div>
            </div>
          )}

          {step === STEPS.CONTACT && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Phone className="h-5 w-5" />
                <h3 className="font-semibold">Dane kontaktowe</h3>
              </div>
              <div>
                <Label htmlFor="phone">Telefon (opcjonalnie)</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+48 123 456 789"
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="email">Email do ofert (opcjonalnie)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kontakt@firma.pl"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Dane kontaktowe będą widoczne na ofertach
              </p>
            </div>
          )}

          {step === STEPS.LOGO && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Upload className="h-5 w-5" />
                <h3 className="font-semibold">Logo firmy</h3>
              </div>
              <div>
                <Label htmlFor="logo">Dodaj logo (opcjonalnie)</Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Max 2MB, format: JPG, PNG. Logo będzie widoczne na ofertach.
                </p>
              </div>
              {logoFile && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Wybrano: {logoFile.name}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="w-full sm:w-auto"
            disabled={updateProfile.isPending || uploadLogo.isPending}
          >
            Pomiń, przypomnij później
          </Button>
          <div className="flex gap-2">
            {step > STEPS.COMPANY_NAME && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={updateProfile.isPending || uploadLogo.isPending}
              >
                Wstecz
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={updateProfile.isPending || uploadLogo.isPending}
            >
              {updateProfile.isPending || uploadLogo.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {step === STEPS.LOGO ? 'Zakończ' : 'Dalej'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
