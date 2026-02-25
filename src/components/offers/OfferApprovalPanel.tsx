import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FileSignature, Link2, Copy, Clock, XCircle, CheckCircle, RefreshCw, Mail, AlertTriangle } from 'lucide-react';
import { useOfferApprovals, useCreateOfferApproval, useExtendOfferApproval, type OfferApproval } from '@/hooks/useOfferApprovals';
import { OfferTrackingTimeline } from './OfferTrackingTimeline';
import { format, differenceInDays, parseISO, isBefore } from 'date-fns';
import { pl } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface OfferApprovalPanelProps {
  projectId: string;
  clientName?: string;
  clientEmail?: string;
}

export function OfferApprovalPanel({ projectId, clientName = '', clientEmail = '' }: OfferApprovalPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(clientName);
  const [email, setEmail] = useState(clientEmail);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);

  const { data: approvals = [] } = useOfferApprovals(projectId);
  const createApproval = useCreateOfferApproval();
  const extendApproval = useExtendOfferApproval();

  const handleCreate = async () => {
    if (!name || !email) {
      toast.error('Wypełnij wszystkie pola');
      return;
    }

    await createApproval.mutateAsync({ projectId, clientName: name, clientEmail: email });
    setIsOpen(false);
  };

  const handleExtend = async (approvalId: string) => {
    await extendApproval.mutateAsync({ approvalId, projectId });
  };

  const handleSendReminder = async (approval: OfferApproval) => {
    if (!approval.client_email) {
      toast.error('Brak adresu email klienta');
      return;
    }

    setSendingReminder(approval.id);
    try {
      const expiresAt = approval.expires_at ? parseISO(approval.expires_at) : null;
      const daysLeft = expiresAt ? differenceInDays(expiresAt, new Date()) : 30;
      const approvalLink = `${window.location.origin}/offer/${approval.public_token}`;

      const { error } = await supabase.functions.invoke('send-offer-email', {
        body: {
          to: approval.client_email,
          subject: `Przypomnienie: Oferta wygasa za ${daysLeft} dni`,
          message: `
            Szanowny/a ${approval.client_name || 'Kliencie'},<br><br>
            
            Przypominamy, że Twoja oferta wygasa za <strong>${daysLeft} dni</strong>.<br><br>
            
            Aby zaakceptować lub odrzucić ofertę, kliknij poniższy link:<br>
            <a href="${approvalLink}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
              Przejdź do oferty
            </a><br><br>
            
            Po tym terminie link wygaśnie i konieczne będzie wygenerowanie nowego.<br><br>
            
            W razie pytań prosimy o kontakt.
          `,
          projectName: 'Przypomnienie o ofercie',
        }
      });

      if (error) throw error;
      toast.success('Przypomnienie wysłane do klienta');
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error('Błąd podczas wysyłania przypomnienia');
    } finally {
      setSendingReminder(null);
    }
  };

  const getExpirationInfo = (expiresAt: string | null) => {
    if (!expiresAt) return { text: '', isExpiring: false, isExpired: false };
    
    const expDate = parseISO(expiresAt);
    const now = new Date();
    const daysLeft = differenceInDays(expDate, now);
    
    if (isBefore(expDate, now)) {
      return { text: 'Wygasła', isExpiring: false, isExpired: true };
    }
    if (daysLeft <= 3) {
      return { text: `${daysLeft} dni!`, isExpiring: true, isExpired: false };
    }
    if (daysLeft <= 7) {
      return { text: `${daysLeft} dni`, isExpiring: true, isExpired: false };
    }
    return { text: `${daysLeft} dni`, isExpiring: false, isExpired: false };
  };

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/offer/${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Link skopiowany');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Zaakceptowana';
      case 'rejected': return 'Odrzucona';
      default: return 'Oczekuje';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-2">
          <span className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            E-Podpis klienta
          </span>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Link2 className="h-4 w-4 mr-2" />
                Utwórz link
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Utwórz link do akceptacji</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Imię i nazwisko klienta</Label>
                  <Input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jan Kowalski"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email klienta</Label>
                  <Input 
                    type="email"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jan@example.com"
                  />
                </div>
                <Button 
                  onClick={handleCreate} 
                  className="w-full"
                  disabled={createApproval.isPending}
                >
                  Utwórz link do akceptacji
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {approvals.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <FileSignature className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Brak linków do akceptacji</p>
            <p className="text-sm">Utwórz link, aby klient mógł zaakceptować ofertę online</p>
          </div>
        ) : (
          <div className="space-y-3">
            {approvals.map((approval) => {
              const expInfo = getExpirationInfo(approval.expires_at);
              
              return (
                <div key={approval.id} className="p-3 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(approval.status)}
                      <div>
                        <p className="font-medium">{approval.client_name}</p>
                        <p className="text-sm text-muted-foreground">{approval.client_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={
                        approval.status === 'approved' ? 'default' :
                        approval.status === 'rejected' ? 'destructive' : 'secondary'
                      }>
                        {getStatusText(approval.status)}
                      </Badge>
                      
                      {approval.status === 'pending' && expInfo.text && (
                        <Badge 
                          variant={expInfo.isExpired ? 'destructive' : expInfo.isExpiring ? 'outline' : 'secondary'}
                          className={expInfo.isExpiring && !expInfo.isExpired ? 'border-warning text-warning' : ''}
                        >
                          {expInfo.isExpiring && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {expInfo.text}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions for pending offers */}
                  {approval.status === 'pending' && (
                    <div className="flex items-center gap-2 pt-2 border-t border-border/50 flex-wrap">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => copyLink(approval.public_token)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Kopiuj link
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Kopiuj link do schowka</TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleExtend(approval.id)}
                            disabled={extendApproval.isPending}
                          >
                            <RefreshCw className={`h-4 w-4 mr-1 ${extendApproval.isPending ? 'animate-spin' : ''}`} />
                            Przedłuż
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Przedłuż ważność o 30 dni</TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleSendReminder(approval)}
                            disabled={sendingReminder === approval.id}
                          >
                            <Mail className={`h-4 w-4 mr-1 ${sendingReminder === approval.id ? 'animate-pulse' : ''}`} />
                            Przypomnij
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Wyślij przypomnienie email</TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                  
                  {/* Approval date for completed */}
                  {approval.approved_at && (
                    <p className="text-sm text-muted-foreground pt-2 border-t border-border/50">
                      {approval.status === 'approved' ? 'Zaakceptowana' : 'Odrzucona'}: {format(new Date(approval.approved_at), 'dd MMM yyyy, HH:mm', { locale: pl })}
                    </p>
                  )}

                  {/* Activity timeline */}
                  <OfferTrackingTimeline approval={approval} />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
