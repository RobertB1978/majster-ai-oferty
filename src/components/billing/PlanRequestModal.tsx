import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const CONTACT_EMAIL = 'kontakt.majsterai@gmail.com';

interface PlanRequestModalProps {
  open: boolean;
  planSlug: string;
  planName: string;
  onClose: () => void;
}

type ModalState = 'form' | 'loading' | 'success' | 'error';

export function PlanRequestModal({ open, planSlug, planName, onClose }: PlanRequestModalProps) {
  const { t } = useTranslation();
  const [state, setState] = useState<ModalState>('form');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      onClose();
      // reset after dialog closes
      setTimeout(() => {
        setState('form');
        setPhone('');
        setMessage('');
        setErrorMsg('');
      }, 300);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('loading');
    setErrorMsg('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const response = await fetch(`${supabaseUrl}/functions/v1/request-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          plan_slug: planSlug,
          phone: phone.trim() || undefined,
          message: message.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${response.status}`);
      }

      setState('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('billing.planRequest.unknownError');
      setErrorMsg(msg);
      setState('error');
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('billing.planRequest.title', { plan: planName })}</DialogTitle>
          <DialogDescription>
            {t('billing.planRequest.description')}
          </DialogDescription>
        </DialogHeader>

        {state === 'success' ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-success" />
            <p className="font-semibold text-lg">{t('billing.planRequest.success')}</p>
            <p className="text-sm text-muted-foreground">
              {t('billing.planRequest.contactInfo')}{' '}
              <span className="font-medium text-foreground">{CONTACT_EMAIL}</span>
            </p>
            <Button onClick={onClose} className="mt-2">
              {t('billing.planRequest.close')}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="plan-request-phone">{t('billing.planRequest.phone')}</Label>
              <Input
                id="plan-request-phone"
                type="tel"
                placeholder={t('billing.planRequest.phonePlaceholder')}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={20}
                disabled={state === 'loading'}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="plan-request-message">{t('billing.planRequest.message')}</Label>
              <Textarea
                id="plan-request-message"
                placeholder={t('billing.planRequest.messagePlaceholder')}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
                rows={3}
                disabled={state === 'loading'}
              />
            </div>

            {state === 'error' && (
              <p className="text-sm text-destructive">
                {t('billing.planRequest.error', { message: errorMsg })}{' '}
                <span className="font-medium">{CONTACT_EMAIL}</span>.
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={state === 'loading'}>
                {t('billing.planRequest.cancel')}
              </Button>
              <Button type="submit" className="flex-1" disabled={state === 'loading'}>
                {state === 'loading' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('billing.planRequest.sending')}
                  </>
                ) : (
                  t('billing.planRequest.submit')
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
