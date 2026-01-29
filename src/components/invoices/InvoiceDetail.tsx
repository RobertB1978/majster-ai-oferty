/**
 * InvoiceDetail Component
 * Display detailed view of a single invoice with payment tracking
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Send, Download, Plus } from 'lucide-react';
import { useInvoice } from '../../hooks/useInvoices';
import { useInvoicePayments } from '../../hooks/useInvoicePayments';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

import type { Invoice } from '../../types/invoices';

interface InvoiceDetailProps {
  invoiceId: string;
  onBack?: () => void;
  onEdit?: (invoice: Invoice) => void;
  onSendEmail?: (invoiceId: string) => void;
  onRecordPayment?: (invoiceId: string) => void;
}

export function InvoiceDetail({
  invoiceId,
  onBack,
  onEdit,
  onSendEmail,
  onRecordPayment,
}: InvoiceDetailProps) {
  const { t } = useTranslation();
  const { invoice, isLoading: invoiceLoading } = useInvoice(invoiceId);
  const { payments, isLoading: paymentsLoading } = useInvoicePayments(invoiceId);

  if (invoiceLoading) {
    return <div className="p-8 text-center">{t('common.loading', 'Ładowanie...')}</div>;
  }

  if (!invoice) {
    return (
      <div className="p-8 text-center text-red-600">
        {t('errors.invoiceNotFound', 'Faktura nie znaleziona')}
      </div>
    );
  }

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'default',
      issued: 'secondary',
      sent: 'outline',
      paid: 'default',
    };
    return colors[status] || 'default';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold">{invoice.invoice_number}</h1>
            <p className="text-gray-600">
              {t('labels.invoiceDate', 'Wystawiona')}: {new Date(invoice.invoice_date).toLocaleDateString('pl-PL')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {invoice.pdf_url && (
            <Button
              onClick={() => window.open(invoice.pdf_url)}
              variant="outline"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              PDF
            </Button>
          )}
          {invoice.status !== 'sent' && (
            <Button onClick={() => onSendEmail?.(invoiceId)} variant="outline" className="gap-2">
              <Send className="w-4 h-4" />
              {t('actions.send', 'Wyślij')}
            </Button>
          )}
          {invoice.status === 'draft' && (
            <Button onClick={() => onEdit?.(invoice)}>
              {t('common.edit', 'Edytuj')}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('labels.status', 'Status')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={getStatusBadgeColor(invoice.status)}>
              {invoice.status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('labels.paymentStatus', 'Status płatności')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">{invoice.payment_status}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('labels.dueDate', 'Termin płatności')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">
              {new Date(invoice.due_date).toLocaleDateString('pl-PL')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('labels.grossTotal', 'Razem brutto')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {invoice.gross_total.toLocaleString('pl-PL', {
                style: 'currency',
                currency: 'PLN',
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Client Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('labels.client', 'Klient')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-gray-600">{t('labels.name', 'Nazwa')}</p>
              <p className="font-semibold">{invoice.client_name}</p>
            </div>
            {invoice.client_nip && (
              <div>
                <p className="text-sm text-gray-600">NIP</p>
                <p className="font-mono">{invoice.client_nip}</p>
              </div>
            )}
            {invoice.client_email && (
              <div>
                <p className="text-sm text-gray-600">{t('labels.email', 'Email')}</p>
                <p>{invoice.client_email}</p>
              </div>
            )}
            {invoice.client_address && (
              <div>
                <p className="text-sm text-gray-600">{t('labels.address', 'Adres')}</p>
                <p>{invoice.client_address}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Issuer Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('labels.issuer', 'Wystawca')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-gray-600">{t('labels.company', 'Firma')}</p>
              <p className="font-semibold">{invoice.issuer_company_name}</p>
            </div>
            {invoice.issuer_nip && (
              <div>
                <p className="text-sm text-gray-600">NIP</p>
                <p className="font-mono">{invoice.issuer_nip}</p>
              </div>
            )}
            {invoice.issuer_address && (
              <div>
                <p className="text-sm text-gray-600">{t('labels.address', 'Adres')}</p>
                <p>{invoice.issuer_address}</p>
              </div>
            )}
            {invoice.issuer_bank_account && (
              <div>
                <p className="text-sm text-gray-600">{t('labels.bankAccount', 'Konto')}</p>
                <p className="font-mono text-sm">{invoice.issuer_bank_account}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>{t('labels.positions', 'Pozycje')}</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left py-2">{t('labels.description', 'Opis')}</th>
                <th className="text-right py-2">{t('labels.quantity', 'Ilość')}</th>
                <th className="text-right py-2">{t('labels.unitPrice', 'Cena j.')}</th>
                <th className="text-right py-2">{t('labels.netAmount', 'Netto')}</th>
                <th className="text-right py-2">VAT %</th>
                <th className="text-right py-2">VAT</th>
                <th className="text-right py-2">{t('labels.grossAmount', 'Brutto')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoice.line_items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-2">{item.description}</td>
                  <td className="text-right">{item.quantity.toFixed(2)}</td>
                  <td className="text-right">
                    {item.unitPrice.toLocaleString('pl-PL', {
                      style: 'currency',
                      currency: 'PLN',
                    })}
                  </td>
                  <td className="text-right">
                    {item.netAmount.toLocaleString('pl-PL', {
                      style: 'currency',
                      currency: 'PLN',
                    })}
                  </td>
                  <td className="text-right">{item.vatRate}%</td>
                  <td className="text-right">
                    {item.vatAmount.toLocaleString('pl-PL', {
                      style: 'currency',
                      currency: 'PLN',
                    })}
                  </td>
                  <td className="text-right font-semibold">
                    {item.grossAmount.toLocaleString('pl-PL', {
                      style: 'currency',
                      currency: 'PLN',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Separator className="my-4" />

          <div className="space-y-2 text-right">
            <div className="flex justify-end gap-40">
              <span>{t('labels.netTotal', 'Razem netto')}:</span>
              <span className="w-32">
                {invoice.net_total.toLocaleString('pl-PL', {
                  style: 'currency',
                  currency: 'PLN',
                })}
              </span>
            </div>
            <div className="flex justify-end gap-40">
              <span>{t('labels.vatTotal', 'Razem VAT')}:</span>
              <span className="w-32">
                {invoice.vat_total.toLocaleString('pl-PL', {
                  style: 'currency',
                  currency: 'PLN',
                })}
              </span>
            </div>
            <div className="flex justify-end gap-40 text-lg font-bold border-t pt-2">
              <span>{t('labels.grossTotal', 'Razem brutto')}:</span>
              <span className="w-32 text-xl">
                {invoice.gross_total.toLocaleString('pl-PL', {
                  style: 'currency',
                  currency: 'PLN',
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('labels.paymentHistory', 'Historia płatności')}</CardTitle>
          <Button
            size="sm"
            onClick={() => onRecordPayment?.(invoiceId)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('actions.recordPayment', 'Dodaj płatność')}
          </Button>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <p>{t('common.loading', 'Ładowanie...')}</p>
          ) : payments.length === 0 ? (
            <p className="text-gray-500">{t('emptyStates.noPayments', 'Brak płatności')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2">{t('labels.date', 'Data')}</th>
                  <th className="text-left py-2">{t('labels.method', 'Metoda')}</th>
                  <th className="text-right py-2">{t('labels.amount', 'Kwota')}</th>
                  <th className="text-left py-2">{t('labels.reference', 'Referencja')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map(payment => (
                  <tr key={payment.id}>
                    <td className="py-2">
                      {new Date(payment.payment_date).toLocaleDateString('pl-PL')}
                    </td>
                    <td className="py-2">{payment.payment_method || '-'}</td>
                    <td className="text-right py-2">
                      {payment.amount.toLocaleString('pl-PL', {
                        style: 'currency',
                        currency: 'PLN',
                      })}
                    </td>
                    <td className="py-2 text-gray-600">
                      {payment.reference_number || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>{t('labels.notes', 'Uwagi')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
