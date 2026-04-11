import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useProfile, useUpdateProfile, useUploadLogo } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, FileText, Phone, Upload, CheckCircle, Loader2, Scale } from 'lucide-react';
import type { LegalForm } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { validateFile, FILE_VALIDATION_CONFIGS } from '@/lib/fileValidation';
import { logger } from '@/lib/logger';

const STEPS = {
  COMPANY_NAME: 0,
  LEGAL_FORM: 1,
  NIP: 2,
  CONTACT: 3,
  LOGO: 4,
} as const;

const TOTAL_STEPS = 5;

interface OnboardingModalProps {
  /** When false the modal will not open (e.g. while trade onboarding is still active). */
  enabled?: boolean;
}

export function OnboardingModal({ enabled = true }: OnboardingModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadLogo = useUploadLogo();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<number>(STEPS.COMPANY_NAME);
  const [skipped, setSkipped] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [legalForm, setLegalForm] = useState<LegalForm>('jdg');
  const [nip, setNip] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    if (isLoading || !user || !enabled) return;

    // Check if user has already completed onboarding
    const hasCompletedOnboarding = profile?.company_name;

    // Check if user has skipped onboarding in this session
    const hasSkippedOnboarding = sessionStorage.getItem('onboarding_skipped') === 'true';

    // Check if the modal has already been shown in this session
    const hasBeenShown = sessionStorage.getItem('onboarding_shown') === 'true';

    if (!hasCompletedOnboarding && !hasSkippedOnboarding && !hasBeenShown && !skipped) {
      setOpen(true);
      // Mark that the modal has been shown
      sessionStorage.setItem('onboarding_shown', 'true');
    }
  }, [profile, isLoading, user, skipped, enabled]);

  const handleSkip = () => {
    sessionStorage.setItem('onboarding_skipped', 'true');
    setSkipped(true);
    setOpen(false);
    toast.info(t('onboarding.completeProfileAnytime'));
  };

  const handleNext = async () => {
    try {
      if (step === STEPS.COMPANY_NAME) {
        if (!companyName.trim()) {
          toast.error(t('onboarding.provideCompanyName'));
          return;
        }
        await updateProfile.mutateAsync({ company_name: companyName });
        setStep(STEPS.LEGAL_FORM);
      } else if (step === STEPS.LEGAL_FORM) {
        await updateProfile.mutateAsync({ legal_form: legalForm });
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
        toast.success(t('onboarding.profileConfigured'));
      }
    } catch (error) {
      logger.error('Onboarding error:', error);
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
            {t('onboarding.welcome')}
          </DialogTitle>
          <DialogDescription>
            {t('onboarding.setupProfile')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {t('onboarding.stepOf', { current: step + 1, total: TOTAL_STEPS })}
          </p>

          {step === STEPS.COMPANY_NAME && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Building2 className="h-5 w-5" />
                <h3 className="font-semibold">{t('onboarding.companyName')}</h3>
              </div>
              <div>
                <Label htmlFor="company_name">{t('onboarding.companyNameQuestion')}</Label>
                <Input
                  id="company_name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={t('onboarding.companyNamePlaceholder')}
                  autoFocus
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('onboarding.companyNameHint')}
                </p>
              </div>
            </div>
          )}

          {step === STEPS.LEGAL_FORM && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Scale className="h-5 w-5" />
                <h3 className="font-semibold">{t('onboarding.legalForm')}</h3>
              </div>
              <div>
                <Label htmlFor="legal_form">{t('onboarding.legalFormQuestion')}</Label>
                <Select
                  value={legalForm}
                  onValueChange={(value) => setLegalForm(value as LegalForm)}
                >
                  <SelectTrigger id="legal_form" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jdg">{t('companyProfile.legalFormJdg')}</SelectItem>
                    <SelectItem value="sp_z_oo">{t('companyProfile.legalFormSpZoo')}</SelectItem>
                    <SelectItem value="spolka_cywilna">{t('companyProfile.legalFormSpolkaCywilna')}</SelectItem>
                    <SelectItem value="inne">{t('companyProfile.legalFormInne')}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('onboarding.legalFormHint')}
                </p>
              </div>
            </div>
          )}

          {step === STEPS.NIP && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <FileText className="h-5 w-5" />
                <h3 className="font-semibold">{t('onboarding.nip')}</h3>
              </div>
              <div>
                <Label htmlFor="nip">{t('onboarding.nipOptional')}</Label>
                <Input
                  id="nip"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder={t('onboarding.nipPlaceholder')}
                  autoFocus
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('onboarding.nipHint')}
                </p>
              </div>
            </div>
          )}

          {step === STEPS.CONTACT && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Phone className="h-5 w-5" />
                <h3 className="font-semibold">{t('onboarding.contactInfo')}</h3>
              </div>
              <div>
                <Label htmlFor="phone">{t('onboarding.phoneOptional')}</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('onboarding.phonePlaceholder')}
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="email">{t('onboarding.emailOptional')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('onboarding.emailPlaceholder')}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t('onboarding.contactInfoHint')}
              </p>
            </div>
          )}

          {step === STEPS.LOGO && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Upload className="h-5 w-5" />
                <h3 className="font-semibold">{t('onboarding.logo')}</h3>
              </div>
              <div>
                <Label htmlFor="logo">{t('onboarding.addLogoOptional')}</Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('onboarding.logoHint')}
                </p>
              </div>
              {logoFile && (
                <div className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle className="h-4 w-4" />
                  <span>{t('onboarding.selected', { filename: logoFile.name })}</span>
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
            {t('onboarding.skipRemindLater')}
          </Button>
          <div className="flex gap-2">
            {step > STEPS.COMPANY_NAME && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={updateProfile.isPending || uploadLogo.isPending}
              >
                {t('onboarding.previous')}
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={updateProfile.isPending || uploadLogo.isPending}
            >
              {updateProfile.isPending || uploadLogo.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {step === STEPS.LOGO ? t('onboarding.finish') : t('onboarding.next')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
