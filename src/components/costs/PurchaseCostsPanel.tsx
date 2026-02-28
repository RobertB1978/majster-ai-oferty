import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Receipt, Upload, FileText, Sparkles, Trash2, Download, Loader2 } from 'lucide-react';
import { usePurchaseCosts, useUploadInvoice, useProcessInvoiceOCR, useDeletePurchaseCost } from '@/hooks/usePurchaseCosts';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface PurchaseCostsPanelProps {
  projectId: string;
}

export function PurchaseCostsPanel({ projectId }: PurchaseCostsPanelProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: costs = [] } = usePurchaseCosts(projectId);
  const uploadInvoice = useUploadInvoice();
  const processOCR = useProcessInvoiceOCR();
  const deleteCost = useDeletePurchaseCost();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await uploadInvoice.mutateAsync({ projectId, file });

    // Auto-start OCR
    if (result.document_url) {
      await processOCR.mutateAsync({
        costId: result.id,
        projectId,
        documentUrl: result.document_url
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const totalNet = costs.reduce((sum, c) => sum + Number(c.net_amount), 0);
  const totalVat = costs.reduce((sum, c) => sum + Number(c.vat_amount), 0);
  const totalGross = costs.reduce((sum, c) => sum + Number(c.gross_amount), 0);

  const exportToCSV = () => {
    const headers = [
      t('finance.supplier'),
      t('finance.invoiceNumber'),
      t('finance.date'),
      t('finance.netAmount'),
      t('finance.vatAmount'),
      t('finance.grossAmount'),
    ];
    const rows = costs.map(c => [
      c.supplier_name || '',
      c.invoice_number || '',
      c.invoice_date ? format(new Date(c.invoice_date), 'dd MMM yyyy', { locale: pl }) : '',
      String(c.net_amount),
      String(c.vat_amount),
      String(c.gross_amount),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'costs.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const ocrStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return t('finance.ocrDone');
      case 'processing': return 'OCR...';
      case 'pending': return t('finance.ocrWaiting');
      case 'failed': return t('finance.ocrError');
      default: return status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {t('finance.purchaseCostsOcr')}
          </span>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline" size="sm" disabled={costs.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              size="sm"
              disabled={uploadInvoice.isPending}
            >
              {uploadInvoice.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {uploadInvoice.isPending ? t('messages.uploading') : t('finance.addInvoice')}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={handleFileSelect}
        />

        {costs.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              {t('finance.addInvoicesHint')}
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('finance.supplier')}</TableHead>
                  <TableHead>{t('finance.invoiceNumber')}</TableHead>
                  <TableHead>{t('finance.date')}</TableHead>
                  <TableHead className="text-right">{t('finance.netAmount')}</TableHead>
                  <TableHead className="text-right">{t('finance.vatAmount')}</TableHead>
                  <TableHead className="text-right">{t('finance.grossAmount')}</TableHead>
                  <TableHead>{t('finance.status')}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costs.map((cost) => (
                  <TableRow key={cost.id}>
                    <TableCell>{cost.supplier_name || '-'}</TableCell>
                    <TableCell>{cost.invoice_number || '-'}</TableCell>
                    <TableCell>
                      {cost.invoice_date
                        ? format(new Date(cost.invoice_date), 'dd MMM yyyy', { locale: pl })
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(cost.net_amount).toLocaleString()} zł
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(cost.vat_amount).toLocaleString()} zł
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {Number(cost.gross_amount).toLocaleString()} zł
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          cost.ocr_status === 'completed' ? 'default' :
                          cost.ocr_status === 'processing' ? 'secondary' :
                          cost.ocr_status === 'failed' ? 'destructive' : 'outline'
                        }
                      >
                        {ocrStatusLabel(cost.ocr_status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {cost.ocr_status === 'pending' && cost.document_url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => processOCR.mutate({
                              costId: cost.id,
                              projectId,
                              documentUrl: cost.document_url!
                            })}
                          >
                            <Sparkles className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteCost.mutate({ costId: cost.id, projectId })}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4 p-4 bg-muted rounded-lg grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">{t('finance.netTotal')}</p>
                <p className="font-bold text-lg">{totalNet.toLocaleString()} zł</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('finance.vatTotal')}</p>
                <p className="font-bold text-lg">{totalVat.toLocaleString()} zł</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('finance.grossTotal')}</p>
                <p className="font-bold text-lg">{totalGross.toLocaleString()} zł</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
