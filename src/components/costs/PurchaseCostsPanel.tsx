import { useState, useRef } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: costs = [], isLoading } = usePurchaseCosts(projectId);
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
    const headers = ['Dostawca', 'Nr faktury', 'Data', 'Netto', 'VAT', 'Brutto'];
    const rows = costs.map(c => [
      c.supplier_name || '',
      c.invoice_number || '',
      c.invoice_date || '',
      c.net_amount,
      c.vat_amount,
      c.gross_amount
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `koszty_zakupu_${projectId}.csv`;
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Koszty zakupu (OCR)
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
              {uploadInvoice.isPending ? 'Przesyłanie...' : 'Dodaj fakturę'}
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
              Dodaj faktury zakupowe, a AI automatycznie odczyta dane
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dostawca</TableHead>
                  <TableHead>Nr faktury</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Netto</TableHead>
                  <TableHead className="text-right">VAT</TableHead>
                  <TableHead className="text-right">Brutto</TableHead>
                  <TableHead>Status</TableHead>
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
                        {cost.ocr_status === 'completed' && 'Gotowe'}
                        {cost.ocr_status === 'processing' && 'OCR...'}
                        {cost.ocr_status === 'pending' && 'Oczekuje'}
                        {cost.ocr_status === 'failed' && 'Błąd'}
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
                <p className="text-sm text-muted-foreground">Suma netto</p>
                <p className="font-bold text-lg">{totalNet.toLocaleString()} zł</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Suma VAT</p>
                <p className="font-bold text-lg">{totalVat.toLocaleString()} zł</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Suma brutto</p>
                <p className="font-bold text-lg">{totalGross.toLocaleString()} zł</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
