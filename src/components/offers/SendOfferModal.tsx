import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2, Send, AlertCircle, FileText, Clock, ShieldAlert,
  Copy, Download, Check, Link2,
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useQuote } from '@/hooks/useQuotes';
import { useCreateOfferSend, useUpdateOfferSend } from '@/hooks/useOfferSends';
import { useAuth } from '@/contexts/AuthContext';
import { generateOfferEmailSubject, generateOfferEmailBody } from '@/lib/emailTemplates';
import { OFFER_EMAIL_TEMPLATES, renderOfferEmailTemplate } from '@/lib/offerEmailTemplates';
import { formatCurrency } from '@/lib/formatters';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { useFreeTierOfferQuota } from '@/hooks/useFreeTierOfferQuota';
import { FreeTierPaywallModal } from '@/components/billing/FreeTierPaywallModal';
import { OfferQuotaIndicator } from '@/components/billing/OfferQuotaIndicator';

interface SendOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  clientEmail?: string;
  clientName?: string;
  pdfUrl?: string;
}

const EXPIRY_DAYS = [7, 14, 30, 60, 90] as const;

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
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: quote } = useQuote(projectId);
  const createOfferSend = useCreateOfferSend();
  const updateOfferSend = useUpdateOfferSend();

  // PR-06: Free-plan monthly quota
  const offerQuota = useFreeTierOfferQuota();
  const [showPaywall, setShowPaywall] = useState(false);

  const [email, setEmail] = useState(clientEmail);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [messageManuallyEdited, setMessageManuallyEdited] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [expiryDays, setExpiryDays] = useState<string>('30');
  const [customDate, setCustomDate] = useState('');
  const [offerApproval, setOfferApproval] = useState<{ public_token: string; accept_token: string } | null>(null);

  // Fallback-delivery state
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [emailSendFailed, setEmailSendFailed] = useState(false);
  const [emailSendFailedReason, setEmailSendFailedReason] = useState<'not_configured' | 'other' | null>(null);

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

  // Reset transient state when modal opens/closes
  useEffect(() => {
    if (open) {
      setEmailSendFailed(false);
      setEmailSendFailedReason(null);
      setLinkCopied(false);
    }
  }, [open]);

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

  // Checklist
  const hasClientEmail = Boolean(email.trim());
  const hasValidUntil = expiryDays !== '-1' || Boolean(customDate);
  const isEmailVerified = profile?.contact_email_verified === true;
  const canSend = hasClientEmail && hasValidUntil;

  // Show fallback delivery panel when email is absent OR after a send failure
  const showFallback = !hasClientEmail || emailSendFailed;

  // Public offer link (Polish route preferred)
  const publicOfferLink = offerApproval
    ? `${window.location.origin}/oferta/${offerApproval.public_token}`
    : null;

  // Ensure an offer_approval record (and therefore a public_token) exists.
  // Creates one on-demand if missing — no DB migrations required.
  const ensureToken = async (): Promise<{ public_token: string; accept_token: string } | null> => {
    if (offerApproval) return offerApproval;
    if (!user || !projectId) return null;

    setIsGeneratingToken(true);
    try {
      const { data, error } = await supabase  // eslint-disable-line @typescript-eslint/no-unused-vars
        .from('offer_approvals')
        .insert({
          project_id: projectId,
          user_id: user.id,
          client_name: clientName || null,
          client_email: email || null,
        })
        .select('public_token, accept_token')
        .single();

      if (error) throw error;
      const approval = data as unknown as { public_token: string; accept_token: string };
      setOfferApproval(approval);
      return approval;
    } catch (err) {
      console.error('Failed to generate offer token:', err);
      toast.error(t('sendOffer.tokenGenerateFailed'));
      return null;
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const handleCopyLink = async () => {
    const approval = await ensureToken();
    if (!approval) return;

    const link = `${window.location.origin}/oferta/${approval.public_token}`;
    await navigator.clipboard.writeText(link);
    setLinkCopied(true);
    toast.success(t('sendOffer.linkCopiedSuccess'));
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const handleSend = async () => {
    // PR-06: Free-plan monthly quota check — block before any other validation
    if (!offerQuota.canSend) {
      setShowPaywall(true);
      return;
    }

    if (!quote || !quote.positions || quote.positions.length === 0) {
      toast.error(t('sendOffer.createQuoteFirst'));
      return;
    }
    if (!email.trim()) { toast.error(t('sendOffer.provideRecipientEmail')); return; }
    if (!subject.trim()) { toast.error(t('sendOffer.provideSubject')); return; }
    if (!hasValidUntil) { toast.error(t('sendOffer.setExpiryRequired')); return; }

    setIsSending(true);
    try {
      const validUntil = resolvedValidUntil();

      // Update offer_approval with valid_until and mark as 'sent'
      if (offerApproval) {
        await supabase
          .from('offer_approvals')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .update({ valid_until: validUntil, status: 'sent' } as any)
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
      const isConfigError =
        msg.includes('RESEND_API_KEY') ||
        msg.includes('API key') ||
        msg.includes('not configured') ||
        msg.includes('Email service') ||
        msg.includes('503');

      setEmailSendFailed(true);
      setEmailSendFailedReason(isConfigError ? 'not_configured' : 'other');

      if (isConfigError) {
        toast.error(t('sendOffer.emailNotConfigured'));
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* PR-06: Paywall modal — shown when free quota is exceeded */}
      <FreeTierPaywallModal open={showPaywall} onOpenChange={setShowPaywall} />

      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{t('sendOffer.title')}</DialogTitle>
            {/* PR-06: Quota indicator visible in modal header */}
            <OfferQuotaIndicator />
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">

          {/* ── PR-06: Quota limit warning ───────────────────────────────────── */}
          {!offerQuota.canSend && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <span className="font-medium">{t('paywall.sendBlockedTitle')}</span>{' '}
                {t('paywall.sendBlockedDesc')}
              </AlertDescription>
            </Alert>
          )}

          {/* ── Case B: no client email ─────────────────────────────────────── */}
          {!hasClientEmail && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <span className="font-medium">{t('sendOffer.noClientEmail')}</span>{' '}
                {t('sendOffer.noClientEmailDesc')}
              </AlertDescription>
            </Alert>
          )}

          {/* ── Case C: email send failed ────────────────────────────────────── */}
          {emailSendFailed && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {emailSendFailedReason === 'not_configured' ? (
                  <>
                    <span className="font-medium">{t('sendOffer.emailNotConfiguredShort')}</span>{' '}
                    {t('sendOffer.emailNotConfiguredDetail')}{' '}
                    <Link
                      to="/app/settings?tab=email"
                      className="underline underline-offset-2"
                      onClick={() => onOpenChange(false)}
                    >
                      {t('sendOffer.goToSettings')}
                    </Link>
                  </>
                ) : (
                  <>
                    <span className="font-medium">{t('sendOffer.failedToSendShort')}</span>{' '}
                    {t('sendOffer.retryOrUseFallback')}
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* ── Fallback delivery panel (Case B or C) ──────────────────────── */}
          {showFallback && (
            <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                {t('sendOffer.alternativeDelivery')}
              </p>

              {/* Copy public offer link */}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleCopyLink}
                disabled={isGeneratingToken}
              >
                {isGeneratingToken ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : linkCopied ? (
                  <Check className="mr-2 h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                {linkCopied ? t('sendOffer.linkCopied') : t('sendOffer.copyLink')}
              </Button>

              {publicOfferLink && (
                <p className="text-xs text-muted-foreground break-all px-1">
                  {publicOfferLink}
                </p>
              )}

              {/* Download PDF or CTA to generate */}
              {pdfUrl ? (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer" download>
                    <Download className="mr-2 h-4 w-4" />
                    {t('sendOffer.downloadOfferPdf')}
                  </a>
                </Button>
              ) : (
                <div className="rounded-md bg-muted p-3 text-sm flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="text-muted-foreground">{t('sendOffer.generatePdfFirst')}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Email input (always visible for editing) ─────────────────────── */}
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
              onChange={(e) => {
                setEmail(e.target.value);
                // Let user retry after a failure without the error banner blocking
                if (emailSendFailed) {
                  setEmailSendFailed(false);
                  setEmailSendFailedReason(null);
                }
              }}
            />
          </div>

          {/* ── Email form — only when a recipient email is present ──────────── */}
          {hasClientEmail && (
            <>
              {/* Email verified warning */}
              {!isEmailVerified && (
                <Alert>
                  <ShieldAlert className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <span className="font-medium">{t('sendOffer.replyEmailUnverified')}</span>{' '}
                    {t('sendOffer.replyEmailUnverifiedDesc')}{' '}
                    <Link
                      to="/app/settings?tab=email"
                      className="text-primary underline underline-offset-2"
                      onClick={() => onOpenChange(false)}
                    >
                      {t('sendOffer.verifyInSettings')}
                    </Link>
                  </AlertDescription>
                </Alert>
              )}

              {/* Expiry */}
              <div className="space-y-2">
                <Label htmlFor="expiry" className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {t('sendOffer.offerValidity')}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Select value={expiryDays} onValueChange={setExpiryDays}>
                  <SelectTrigger id="expiry">
                    <SelectValue placeholder={t('sendOffer.selectExpiry')} />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRY_DAYS.map((days) => (
                      <SelectItem key={days} value={String(days)}>
                        {t('sendOffer.days_many', { count: days })}
                        <span className="text-muted-foreground text-xs ml-2">
                          ({t('sendOffer.validUntil', { date: daysFromNow(days) })})
                        </span>
                      </SelectItem>
                    ))}
                    <SelectItem value="-1">{t('sendOffer.customDate')}</SelectItem>
                  </SelectContent>
                </Select>
                {expiryDays === '-1' && (
                  <Input
                    type="date"
                    value={customDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setCustomDate(e.target.value)}
                    aria-label={t('sendOffer.customDateAria')}
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
                  {t('sendOffer.dualTokenInfo')}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            {t('sendOffer.cancel')}
          </Button>
          {hasClientEmail && (
            <Button onClick={handleSend} disabled={isSending || !canSend}>
              {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {t('sendOffer.send')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
