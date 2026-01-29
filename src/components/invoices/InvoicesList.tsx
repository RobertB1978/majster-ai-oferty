/**
 * InvoicesList Component
 * Display all invoices with filtering, sorting, and quick actions
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, FileText, Send, Download, Trash2, Edit, Eye } from 'lucide-react';
import { useInvoices } from '../../hooks/useInvoices';
import { useDeleteInvoice } from '../../hooks/useInvoices';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

import type { Invoice, InvoiceStatus, PaymentStatus } from '../../types/invoices';

interface InvoiceListProps {
  onSelectInvoice?: (invoice: Invoice) => void;
  onCreateNew?: () => void;
  onSendEmail?: (invoiceId: string) => void;
}

export function InvoicesList({
  onSelectInvoice,
  onCreateNew,
  onSendEmail,
}: InvoiceListProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'all'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch invoices
  const { invoices, isLoading, refetch } = useInvoices({
    filters: {
      status: statusFilter !== 'all' ? [statusFilter] : undefined,
      paymentStatus: paymentFilter !== 'all' ? [paymentFilter] : undefined,
      search: searchTerm || undefined,
    },
  });

  const { deleteInvoice } = useDeleteInvoice();

  // Filter by search term (client-side, can also be done server-side)
  const filtered = invoices.filter(
    inv =>
      !searchTerm ||
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    deleteInvoice(id);
    setDeleteId(null);
    refetch();
  };

  const getStatusColor = (status: InvoiceStatus) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      issued: 'bg-blue-100 text-blue-800',
      sent: 'bg-cyan-100 text-cyan-800',
      viewed: 'bg-purple-100 text-purple-800',
      paid: 'bg-green-100 text-green-800',
      refunded: 'bg-orange-100 text-orange-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      partial: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('invoices', 'Faktury')}</h1>
        <Button onClick={onCreateNew} className="gap-2">
          <Plus className="w-4 h-4" />
          {t('actions.createInvoice', 'Nowa Faktura')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder={t('labels.search', 'Szukaj...')}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-64"
        />
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t('labels.status', 'Status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie</SelectItem>
            <SelectItem value="draft">Szkic</SelectItem>
            <SelectItem value="issued">Wystawiona</SelectItem>
            <SelectItem value="sent">Wysłana</SelectItem>
            <SelectItem value="paid">Zapłacona</SelectItem>
          </SelectContent>
        </Select>

        <Select value={paymentFilter} onValueChange={v => setPaymentFilter(v as any)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t('labels.paymentStatus', 'Płatność')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie</SelectItem>
            <SelectItem value="pending">Oczekujące</SelectItem>
            <SelectItem value="partial">Częściowo</SelectItem>
            <SelectItem value="paid">Zapłacone</SelectItem>
            <SelectItem value="overdue">Zaległy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            {t('common.loading', 'Ładowanie...')}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {t('emptyStates.noInvoices', 'Brak faktur')}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('labels.invoiceNumber', 'Numer faktury')}</TableHead>
                <TableHead>{t('labels.client', 'Klient')}</TableHead>
                <TableHead className="text-right">
                  {t('labels.grossTotal', 'Razem brutto')}
                </TableHead>
                <TableHead>{t('labels.status', 'Status')}</TableHead>
                <TableHead>{t('labels.paymentStatus', 'Płatność')}</TableHead>
                <TableHead>{t('labels.dueDate', 'Termin')}</TableHead>
                <TableHead>{t('common.actions', 'Akcje')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(invoice => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono font-semibold">
                    {invoice.invoice_number}
                  </TableCell>
                  <TableCell>{invoice.client_name}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {invoice.gross_total.toLocaleString('pl-PL', {
                      style: 'currency',
                      currency: 'PLN',
                    })}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}
                    >
                      {invoice.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(invoice.payment_status)}`}
                    >
                      {invoice.payment_status}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(invoice.due_date).toLocaleDateString('pl-PL')}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectInvoice?.(invoice)}
                        title="Wyświetl"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {invoice.status === 'draft' && (
                        <Button
                          variant="outline"
                          size="sm"
                          title="Edytuj"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {invoice.pdf_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(invoice.pdf_url)}
                          title="Pobierz PDF"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      {invoice.status !== 'sent' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSendEmail?.(invoice.id)}
                          title="Wyślij email"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      )}
                      {invoice.status === 'draft' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteId(invoice.id)}
                          title="Usuń"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.deleteInvoice', 'Usunąć fakturę?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'dialogs.deleteInvoiceDescription',
                'Tej czynności nie można cofnąć. Faktura będzie permanentnie usunięta.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>{t('common.cancel', 'Anuluj')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteId && handleDelete(deleteId)}
            className="bg-red-600 hover:bg-red-700"
          >
            {t('common.delete', 'Usuń')}
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
