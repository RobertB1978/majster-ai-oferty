import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, FileText, Loader2, Send } from 'lucide-react';
import { useCreateOfferApproval } from '@/hooks/useOfferApprovals';
import { useCreateOfferSend, useUpdateOfferSend } from '@/hooks/useOfferSends';
import { toast } from 'sonner';

interface OfferRow {
  id: string;
  project_name: string;
  status: string;
  created_at: string;
  clients: { name: string; email: string | null } | null;
  quotes: { total: number }[] | null;
}

function mapStatus(status: string): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  switch (status) {
    case 'Oferta wysłana':
      return { label: 'Wysłana', variant: 'default' };
    case 'Zaakceptowany':
      return { label: 'Zaakceptowana', variant: 'secondary' };
    default:
      return { label: 'Szkic', variant: 'outline' };
  }
}

export default function Offers() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Send dialog state
  const [sendOffer, setSendOffer] = useState<OfferRow | null>(null);
  const [sendEmail, setSendEmail] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const createApproval = useCreateOfferApproval();
  const createOfferSend = useCreateOfferSend();
  const updateOfferSend = useUpdateOfferSend();

  const { data: offers, isLoading } = useQuery({
    queryKey: ['offers-home', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, project_name, status, created_at, clients(name, email), quotes(total)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as unknown as OfferRow[]) || [];
    },
    enabled: !!user,
  });

  const hasOffers = offers && offers.length > 0;

  const openSendDialog = (e: React.MouseEvent, offer: OfferRow) => {
    e.stopPropagation();
    setSendOffer(offer);
    setSendEmail(offer.clients?.email || '');
    setSendMessage(
      `Szanowny Kliencie,\n\nPrzesyłam ofertę "${offer.project_name}" do wglądu i akceptacji.\n\nPozdrawiam`
    );
  };

  const handleSend = async () => {
    if (!sendOffer) return;
    if (!sendEmail.trim()) {
      toast.error('Podaj adres email');
      return;
    }

    setIsSending(true);
    try {
      // 1. Create approval → get public token
      const approval = await createApproval.mutateAsync({
        projectId: sendOffer.id,
        clientName: sendOffer.clients?.name || '',
        clientEmail: sendEmail,
      });

      // 2. Build message with public link
      const publicUrl = `${window.location.origin}/offer/${approval.public_token}`;
      const htmlMessage = sendMessage.replace(/\n/g, '<br>') +
        `<div style="text-align:center;margin:24px 0;">` +
        `<a href="${publicUrl}" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Zobacz ofertę</a>` +
        `</div>`;

      // 3. Create offer_send record
      const offerSend = await createOfferSend.mutateAsync({
        project_id: sendOffer.id,
        client_email: sendEmail,
        subject: `Oferta – ${sendOffer.project_name}`,
        message: sendMessage,
        status: 'pending',
      });

      // 4. Send email via edge function
      const { error } = await supabase.functions.invoke('send-offer-email', {
        body: {
          offerSendId: offerSend.id,
          to: sendEmail,
          subject: `Oferta – ${sendOffer.project_name}`,
          message: htmlMessage,
          projectName: sendOffer.project_name,
        },
      });
      if (error) throw error;

      // 5. Update offer_send status
      await updateOfferSend.mutateAsync({
        id: offerSend.id,
        projectId: sendOffer.id,
        status: 'sent',
      });

      // 6. Update project status to "Oferta wysłana"
      await supabase
        .from('projects')
        .update({ status: 'Oferta wysłana' })
        .eq('id', sendOffer.id);

      // 7. Refresh offers list
      queryClient.invalidateQueries({ queryKey: ['offers-home'] });

      toast.success('Oferta wysłana!');
      setSendOffer(null);
    } catch (err) {
      console.error('Send error:', err);
      toast.error('Nie udało się wysłać oferty');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('nav.offers', 'Oferty')} | Majster.AI</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('nav.offers', 'Oferty')}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t('offers.subtitle', 'Zarządzaj swoimi ofertami i wycenami')}
            </p>
          </div>
          <Button onClick={() => navigate('/offers/new')} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            {t('offers.newOffer', '+ Nowa oferta')}
          </Button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !hasOffers && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h2 className="text-lg font-semibold mb-2">
                {t('offers.emptyTitle', 'Brak ofert')}
              </h2>
              <p className="text-muted-foreground text-sm max-w-sm mb-6">
                {t('offers.emptyDescription', 'Stwórz swoją pierwszą ofertę i wyślij ją do klienta.')}
              </p>
              <Button onClick={() => navigate('/offers/new')}>
                <Plus className="h-4 w-4 mr-2" />
                {t('offers.newOffer', '+ Nowa oferta')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Offers table */}
        {!isLoading && hasOffers && (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('offers.client', 'Klient')}</TableHead>
                      <TableHead>{t('offers.name', 'Nazwa')}</TableHead>
                      <TableHead className="text-right">{t('offers.amount', 'Kwota')}</TableHead>
                      <TableHead>{t('offers.date', 'Data')}</TableHead>
                      <TableHead>{t('offers.status', 'Status')}</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offers.map((offer) => {
                      const { label, variant } = mapStatus(offer.status);
                      const total = offer.quotes?.[0]?.total;
                      return (
                        <TableRow
                          key={offer.id}
                          className="cursor-pointer"
                          onClick={() => navigate(`/projects/${offer.id}`)}
                        >
                          <TableCell className="font-medium">
                            {offer.clients?.name || '—'}
                          </TableCell>
                          <TableCell>{offer.project_name}</TableCell>
                          <TableCell className="text-right">
                            {total != null ? formatCurrency(total) : '—'}
                          </TableCell>
                          <TableCell>
                            {new Date(offer.created_at).toLocaleDateString('pl-PL')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={variant}>{label}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => openSendDialog(e, offer)}
                              title="Wyślij ofertę"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {offers.map((offer) => {
                const { label, variant } = mapStatus(offer.status);
                const total = offer.quotes?.[0]?.total;
                return (
                  <Card
                    key={offer.id}
                    className="cursor-pointer active:scale-[0.98] transition-transform"
                    onClick={() => navigate(`/projects/${offer.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{offer.project_name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {offer.clients?.name || '—'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => openSendDialog(e, offer)}
                            title="Wyślij ofertę"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Badge variant={variant}>{label}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 text-sm">
                        <span className="text-muted-foreground">
                          {new Date(offer.created_at).toLocaleDateString('pl-PL')}
                        </span>
                        <span className="font-semibold">
                          {total != null ? formatCurrency(total) : '—'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Send Offer Dialog */}
      <Dialog open={!!sendOffer} onOpenChange={(open) => { if (!open) setSendOffer(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Wyślij ofertę</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="send-email">Email klienta *</Label>
              <Input
                id="send-email"
                type="email"
                value={sendEmail}
                onChange={(e) => setSendEmail(e.target.value)}
                placeholder="klient@example.com"
              />
            </div>
            <div>
              <Label htmlFor="send-message">Wiadomość</Label>
              <Textarea
                id="send-message"
                rows={5}
                value={sendMessage}
                onChange={(e) => setSendMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOffer(null)} disabled={isSending}>
              Anuluj
            </Button>
            <Button onClick={handleSend} disabled={isSending}>
              {isSending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Wyślij
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
