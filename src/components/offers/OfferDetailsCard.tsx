import { useTranslation } from 'react-i18next';
import { FileText, Building, Calendar, DollarSign, Clock, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/formatters';
import type { OfferData, QuotePosition } from './offerApprovalTypes';

interface OfferDetailsCardProps {
  offer: OfferData;
}

export function OfferDetailsCard({ offer }: OfferDetailsCardProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {t('offerApproval.details.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-3">
            <Building className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">{t('offerApproval.details.project')}</p>
              <p className="font-medium">{offer.project?.project_name ?? t('offerApproval.details.noName')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">{t('offerApproval.details.date')}</p>
              <p className="font-medium">{new Date(offer.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          {offer.valid_until && (
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">{t('offerApproval.details.validUntil')}</p>
                <p className="font-medium">{new Date(offer.valid_until).toLocaleDateString()}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 md:col-span-2">
            <DollarSign className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">{t('offerApproval.details.value')}</p>
              <p className="text-2xl font-bold text-primary">
                {offer.quote ? formatCurrency(offer.quote.total) : t('offerApproval.details.noQuote')}
              </p>
            </div>
          </div>
        </div>

        {/* Quote line items */}
        {offer.quote && Array.isArray(offer.quote.positions) && offer.quote.positions.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium mb-3">{t('offerApproval.positions.title')}</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted hover:bg-muted">
                    <TableHead className="p-3 h-auto">{t('offerApproval.positions.item')}</TableHead>
                    <TableHead className="p-3 h-auto text-right">{t('offerApproval.positions.quantity')}</TableHead>
                    <TableHead className="p-3 h-auto text-right">{t('offerApproval.positions.price')}</TableHead>
                    <TableHead className="p-3 h-auto text-right">{t('offerApproval.positions.value')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offer.quote.positions.map((pos: QuotePosition, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="p-3">{pos.name}</TableCell>
                      <TableCell className="p-3 text-right">{pos.qty} {pos.unit}</TableCell>
                      <TableCell className="p-3 text-right">{formatCurrency(pos.price)}</TableCell>
                      <TableCell className="p-3 text-right font-medium">{formatCurrency(pos.qty * pos.price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* PDF download */}
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => window.print()}
          >
            <Download className="h-4 w-4" />
            {t('offerApproval.actions.downloadPdf')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
