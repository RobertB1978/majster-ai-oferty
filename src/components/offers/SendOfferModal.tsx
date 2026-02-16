import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send, AlertCircle, FileText } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useQuote } from '@/hooks/useQuotes';
import { useCreateOfferSend, useUpdateOfferSend } from '@/hooks/useOfferSends';
import { generateOfferEmailSubject, generateOfferEmailBody } from '@/lib/emailTemplates';
import { OFFER_EMAIL_TEMPLATES, renderOfferEmailTemplate } from '@/lib/offerEmailTemplates';
import { formatCurrency } from '@/lib/formatters';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SendOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  clientEmail?: string;
  clientName?: string;
  pdfUrl?: string; // Phase 5C: Optional PDF URL to attach to email
}

export function SendOfferModal({
  open,
  onOpenChange,
  projectId,
  projectName,
  clientEmail = '',
  clientName = '',
  pdfUrl
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

  useEffect(() => {
    if (open && profile) {
      // Reset template selection and manual edit flag
      setSelectedTemplate('');
      setMessageManuallyEdited(false);

      // Use centralized email template logic (Phase 5A)
      const subject = generateOfferEmailSubject(projectName, {
        companyName: profile.company_name,
        emailSubjectTemplate: profile.email_subject_template,
      });

      const message = generateOfferEmailBody(projectName, {
        companyName: profile.company_name,
        emailGreeting: profile.email_greeting,
        emailSignature: profile.email_signature,
        phone: profile.phone,
      });

      setSubject(subject);
      setMessage(message);

      if (clientEmail) {
        setEmail(clientEmail);
      }
    }
  }, [open, profile, projectName, clientEmail]);

  // Phase 6B: Handle template selection
  const handleTemplateChange = (templateId: string) => {
    if (!templateId) {
      setSelectedTemplate('');
      return;
    }

    // Warn if message was manually edited
    if (messageManuallyEdited && message.trim()) {
      const confirmChange = window.confirm(
        t('sendOffer.templateChangeWarning')
      );
      if (!confirmChange) {
        return;
      }
    }

    setSelectedTemplate(templateId);

    // Render template with available data
    const renderedMessage = renderOfferEmailTemplate(templateId, {
      client_name: clientName,
      project_name: projectName,
      total_price: quote?.total ? formatCurrency(quote.total) : undefined,
      deadline: undefined, // Not available in current data model
      company_name: profile?.company_name,
      company_phone: profile?.phone,
    });

    setMessage(renderedMessage);
    setMessageManuallyEdited(false); // Reset manual edit flag after template change
  };

  // Track manual edits to message
  const handleMessageChange = (newMessage: string) => {
    setMessage(newMessage);
    if (!messageManuallyEdited && newMessage !== message) {
      setMessageManuallyEdited(true);
    }
  };

  const handleSend = async () => {
    // Phase 7A: Validate that quote exists before sending
    if (!quote || !quote.positions || quote.positions.length === 0) {
      toast.error(t('sendOffer.createQuoteFirst'));
      return;
    }

    if (!email.trim()) {
      toast.error(t('sendOffer.provideRecipientEmail'));
      return;
    }
    if (!subject.trim()) {
      toast.error(t('sendOffer.provideSubject'));
      return;
    }

    setIsSending(true);

    try {
      // Create offer send record with pending status
      const offerSend = await createOfferSend.mutateAsync({
        project_id: projectId,
        client_email: email,
        subject,
        message,
        status: 'pending',
      });

      // Call edge function to send email (Phase 5C: include PDF URL if available)
      const { data: _data, error } = await supabase.functions.invoke('send-offer-email', {
        body: {
          offerSendId: offerSend.id,
          to: email,
          subject,
          message,
          projectName,
          pdfUrl: pdfUrl || undefined, // Only include if available
        },
      });

      if (error) throw error;

      // Update status to sent
      await updateOfferSend.mutateAsync({
        id: offerSend.id,
        projectId,
        status: 'sent',
      });

      toast.success(t('sendOffer.offerSent'));
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending offer:', error);
      const errorMessage = error instanceof Error ? error.message : t('sendOffer.failedToSend');

      // Check if it's an API key error
      if (errorMessage.includes('RESEND_API_KEY') || errorMessage.includes('API key')) {
        toast.error(t('sendOffer.emailNotConfigured'));
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('sendOffer.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('sendOffer.recipientEmail')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('sendOffer.recipientEmailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">{t('sendOffer.subject')}</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Phase 6B: Template selector */}
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
                {OFFER_EMAIL_TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{template.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {template.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplate && (
              <p className="text-xs text-muted-foreground">
                {t('sendOffer.templateApplied')}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">{t('sendOffer.messageContent')}</Label>
            <Textarea
              id="message"
              rows={8}
              value={message}
              onChange={(e) => handleMessageChange(e.target.value)}
            />
          </div>

          <div className={`rounded-lg p-3 text-sm ${pdfUrl ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-muted'}`}>
            <div className="flex items-start gap-2">
              <AlertCircle className={`mt-0.5 h-4 w-4 flex-shrink-0 ${pdfUrl ? 'text-green-600 dark:text-green-400' : ''}`} />
              <div>
                {pdfUrl ? (
                  <>
                    <p className="font-medium text-green-800 dark:text-green-200">
                      {t('sendOffer.pdfWillBeAttached')}
                    </p>
                    <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                      {t('sendOffer.editTemplateInProfile')}
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    {t('sendOffer.editTemplateInProfile')}
                    {' '}
                    {t('sendOffer.generatePdfFirst')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            {t('sendOffer.cancel')}
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {t('sendOffer.send')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
