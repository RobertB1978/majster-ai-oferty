import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, FileText, Loader2 } from 'lucide-react';

interface OfferRow {
  id: string;
  project_name: string;
  status: string;
  created_at: string;
  clients: { name: string } | null;
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

  const { data: offers, isLoading } = useQuery({
    queryKey: ['offers-home', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, project_name, status, created_at, clients(name), quotes(total)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as unknown as OfferRow[]) || [];
    },
    enabled: !!user,
  });

  const hasOffers = offers && offers.length > 0;

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
                        <Badge variant={variant}>{label}</Badge>
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
    </>
  );
}
