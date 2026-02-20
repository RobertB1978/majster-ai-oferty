import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, AlertCircle, FileText, Clock, ShieldAlert } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useQuote } from '@/hooks/useQuotes';
import { useCreateOfferSend, useUpdateOfferSend } from '@/hooks/useOfferSends';
import { generateOfferEmailSubject, generateOfferEmailBody } from '@/lib/emailTemplates';
import { OFFER_EMAIL_TEMPLATES, renderOfferEmailTemplate } from '@/lib/offerEmailTemplates';
import { formatCurrency } from '@/lib/formatters';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface SendOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  clientEmail?: string;
  clientName?: string;
  pdfUrl?: string;
}

const EXPIRY_OPTIONS = [
  { label: '7 dni', days: 7 },
  { label: '14 dni', days: 14 },
  { label: '30 dni', days: 30 },
  { label: '60 dni', days: 60 },
  { label: '90 dni', days: 90 },
  { label: 'Własna data', days: -1 },
] as const;

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function SendOfferModal({
  open,
  onOpenChange,
  projectId,
  projectName,
  clientEmail = '',
  clientName = '',
  pdfUrl,
}: SendOfferModalProps) {
  const { t } = useTranslation();
  const { data: profile } = useProfile();
  const { data: quote } = useQuote(projectId);
  const createOfferSend = useCreateOfferSend();
  const updateOfferSend = useUpdateOfferSend();

  const [email, setEmail] = useState(clientEmail);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [messageManuallyEdited, setMessageManuallyEdited] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [expiryDays, setExpiryDays] = useState<string>('30');
  const [customDate, setCustomDate] = useState('');
  const [offerApproval, setOfferApproval] = useState<{ public_token: string; accept_token: string } | null>(null);

  // Fetch offer_approval tokens for this project
  useEffect(() => {
    if (!open || !projectId) return;
    supabase
      .from('offer_approvals')
      .select('public_token, accept_token')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setOfferApproval(data as { public_token: string; accept_token: string });
      });
  }, [open, projectId]);

  useEffect(() => {
    if (open && profile) {
      setSelectedTemplate('');
      setMessageManuallyEdited(false);
      setSubject(generateOfferEmailSubject(projectName, {
        companyName: profile.company_name,
        emailSubjectTemplate: profile.email_subject_template,
      }));
      setMessage(generateOfferEmailBody(projectName, {
        companyName: profile.company_name,
        emailGreeting: profile.email_greeting,
        emailSignature: profile.email_signature,
        phone: profile.phone,
      }));
      if (clientEmail) setEmail(clientEmail);
    }
  }, [open, profile, projectName, clientEmail]);

  const handleTemplateChange = (templateId: string) => {
    if (!templateId) { setSelectedTemplate(''); return; }
    if (messageManuallyEdited && message.trim() && !window.confirm(t('sendOffer.templateChangeWarning'))) return;
    setSelectedTemplate(templateId);
    setMessage(renderOfferEmailTemplate(templateId, {
      client_name: clientName,
      project_name: projectName,
      total_price: quote?.total ? formatCurrency(quote.total) : undefined,
      deadline: undefined,
      company_name: profile?.company_name,
      company_phone: profile?.phone,
    }));
    setMessageManuallyEdited(false);
  };

  const resolvedValidUntil = (): string | null => {
    if (expiryDays === '-1') return customDate ? new Date(customDate).toISOString() : null;
    const days = parseInt(expiryDays, 10);
    if (!days) return null;
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString();
  };

  // Hard-blocker checklist
  const hasClientEmail = Boolean(email.trim());
  const hasValidUntil = expiryDays !== '-1' || Boolean(customDate);
  const isEmailVerified = profile?.contact_email_verified === true;
  const canSend = hasClientEmail && hasValidUntil;

  const handleSend = async () => {
    if (!quote || !quote.positions || quote.positions.length === 0) {
      toast.error(t('sendOffer.createQuoteFirst'));
      return;
    }
    if (!email.trim()) { toast.error(t('sendOffer.provideRecipientEmail')); return; }
    if (!subject.trim()) { toast.error(t('sendOffer.provideSubject')); return; }
    if (!hasValidUntil) { toast.error('Ustaw termin ważności oferty'); return; }

    setIsSending(true);
    try {
      const validUntil = resolvedValidUntil();

      // Update offer_approval with valid_until and mark as 'sent'
      if (offerApproval) {
        await supabase
          .from('offer_approvals')
          .update({ valid_until: validUntil, status: 'sent' })
          .eq('public_token', offerApproval.public_token);
      }

      const offerSend = await createOfferSend.mutateAsync({
        project_id: projectId,
        client_email: email,
        subject,
        message,
        status: 'pending',
      });

      const { error } = await supabase.functions.invoke('send-offer-email', {
        body: {
          offerSendId: offerSend.id,
          to: email,
          subject,
          message,
          projectName,
          pdfUrl: pdfUrl || undefined,
          // Sprint 1: dual-token + Reply-To
          publicToken: offerApproval?.public_token,
          acceptToken: offerApproval?.accept_token,
          replyTo: isEmailVerified ? (profile?.contact_email ?? undefined) : undefined,
          companyName: profile?.company_name,
        },
      });

      if (error) throw error;

      await updateOfferSend.mutateAsync({ id: offerSend.id, projectId, status: 'sent' });
      toast.success(t('sendOffer.offerSent'));
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending offer:', error);
      const msg = error instanceof Error ? error.message : t('sendOffer.failedToSend');
      if (msg.includes('RESEND_API_KEY') || msg.includes('API key')) {
        toast.error(t('sendOffer.emailNotConfigured'));
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('sendOffer.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Email verified warning */}
          {!isEmailVerified && (
            <Alert>
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <span className="font-medium">⚠️ Email do odpowiedzi niezweryfikowany.</span>{' '}
                Klienci nie będą mogli odpisać bezpośrednio na ofertę.{' '}
                <Link to="/app/settings?tab=email" className="text-primary underline underline-offset-2" onClick={() => onOpenChange(false)}>
                  Zweryfikuj w Ustawieniach →
                </Link>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">
              {t('sendOffer.recipientEmail')}
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={t('sendOffer.recipientEmailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Expiry */}
          <div className="space-y-2">
            <Label htmlFor="expiry" className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Ważność oferty
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Select value={expiryDays} onValueChange={setExpiryDays}>
              <SelectTrigger id="expiry">
                <SelectValue placeholder="Wybierz termin ważności" />
              </SelectTrigger>
              <SelectContent>
                {EXPIRY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.days} value={String(opt.days)}>
                    {opt.label}
                    {opt.days > 0 && (
                      <span className="text-muted-foreground text-xs ml-2">
                        (do {daysFromNow(opt.days)})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {expiryDays === '-1' && (
              <Input
                type="date"
                value={customDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setCustomDate(e.target.value)}
                aria-label="Własna data ważności"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">{t('sendOffer.subject')}</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          {/* Template selector */}
          <div className="space-y-2">
            <Label htmlFor="template">
              <FileText className="inline h-4 w-4 mr-1 -mt-0.5" />
              {t('sendOffer.messageTemplateOptional')}
            </Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger id="template">
                <SelectValue placeholder={t('sendOffer.selectTemplatePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {OFFER_EMAIL_TEMPLATES.map((tmpl) => (
                  <SelectItem key={tmpl.id} value={tmpl.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{tmpl.name}</span>
                      <span className="text-xs text-muted-foreground">{tmpl.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">{t('sendOffer.messageContent')}</Label>
            <Textarea
              id="message"
              rows={6}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (!messageManuallyEdited) setMessageManuallyEdited(true);
              }}
            />
          </div>

          <div className={`rounded-lg p-3 text-sm ${pdfUrl ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-muted'}`}>
            <div className="flex items-start gap-2">
              <AlertCircle className={`mt-0.5 h-4 w-4 shrink-0 ${pdfUrl ? 'text-green-600 dark:text-green-400' : ''}`} />
              <p className={pdfUrl ? 'text-green-800 dark:text-green-200' : 'text-muted-foreground'}>
                {pdfUrl ? t('sendOffer.pdfWillBeAttached') : t('sendOffer.generatePdfFirst')}
              </p>
            </div>
          </div>

          {/* Dual-token info */}
          {offerApproval && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground">
              Email będzie zawierał dwa przyciski: <strong>OGLĄDAM OFERTĘ</strong> i <strong>✓ AKCEPTUJĘ (1 klik)</strong>.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            {t('sendOffer.cancel')}
          </Button>
          <Button onClick={handleSend} disabled={isSending || !canSend}>
            {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {t('sendOffer.send')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
