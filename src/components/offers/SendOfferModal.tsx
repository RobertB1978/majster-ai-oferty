import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, AlertCircle } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useCreateOfferSend, useUpdateOfferSend } from '@/hooks/useOfferSends';
import { generateOfferEmailSubject, generateOfferEmailBody } from '@/lib/emailTemplates';
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
  const { data: profile } = useProfile();
  const createOfferSend = useCreateOfferSend();
  const updateOfferSend = useUpdateOfferSend();
  
  const [email, setEmail] = useState(clientEmail);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (open && profile) {
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

  const handleSend = async () => {
    if (!email.trim()) {
      toast.error('Podaj adres e-mail odbiorcy');
      return;
    }
    if (!subject.trim()) {
      toast.error('Podaj temat wiadomości');
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
      const { data, error } = await supabase.functions.invoke('send-offer-email', {
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

      toast.success('Oferta została wysłana!');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error sending offer:', error);
      
      // Check if it's an API key error
      if (error.message?.includes('RESEND_API_KEY') || error.message?.includes('API key')) {
        toast.error('Wysyłka e-mail nie jest skonfigurowana. Skontaktuj się z administratorem.');
      } else {
        toast.error(error.message || 'Nie udało się wysłać oferty');
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Wyślij ofertę e-mailem</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Adres e-mail odbiorcy *</Label>
            <Input
              id="email"
              type="email"
              placeholder="klient@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Temat *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Treść wiadomości</Label>
            <Textarea
              id="message"
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className={`rounded-lg p-3 text-sm ${pdfUrl ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-muted'}`}>
            <div className="flex items-start gap-2">
              <AlertCircle className={`mt-0.5 h-4 w-4 flex-shrink-0 ${pdfUrl ? 'text-green-600 dark:text-green-400' : ''}`} />
              <div>
                {pdfUrl ? (
                  <>
                    <p className="font-medium text-green-800 dark:text-green-200">
                      ✓ PDF oferty zostanie dołączony do wiadomości
                    </p>
                    <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                      Możesz edytować szablon wiadomości w profilu firmy.
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    Możesz edytować szablon wiadomości w profilu firmy.
                    Aby dołączyć PDF, najpierw wygeneruj go w panelu "Podgląd oferty PDF".
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Wyślij
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
