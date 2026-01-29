/**
 * Invoices Page
 * Main page for invoice management
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { InvoicesList } from '../components/invoices/InvoicesList';
import { InvoiceDetail } from '../components/invoices/InvoiceDetail';

import type { Invoice } from '../types/invoices';

export default function InvoicesPage() {
  const { t } = useTranslation();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [view, setView] = useState<'list' | 'detail' | 'edit' | 'create'>('list');

  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setView('detail');
  };

  const handleBack = () => {
    setSelectedInvoice(null);
    setView('list');
  };

  const handleCreateNew = () => {
    setSelectedInvoice(null);
    setView('create');
  };

  const handleSendEmail = (invoiceId: string) => {
    // TODO: Open send email modal
    console.log('Send email for invoice:', invoiceId);
  };

  const handleRecordPayment = (invoiceId: string) => {
    // TODO: Open payment recording modal
    console.log('Record payment for invoice:', invoiceId);
  };

  return (
    <div className="space-y-6">
      {view === 'list' && (
        <InvoicesList
          onSelectInvoice={handleSelectInvoice}
          onCreateNew={handleCreateNew}
          onSendEmail={handleSendEmail}
        />
      )}

      {view === 'detail' && selectedInvoice && (
        <InvoiceDetail
          invoiceId={selectedInvoice.id}
          onBack={handleBack}
          onSendEmail={handleSendEmail}
          onRecordPayment={handleRecordPayment}
        />
      )}

      {view === 'create' && (
        <div className="p-8 text-center text-gray-500">
          {t('common.comingSoon', 'Funkcja w przygotowaniu')}
        </div>
      )}

      {view === 'edit' && (
        <div className="p-8 text-center text-gray-500">
          {t('common.comingSoon', 'Funkcja w przygotowaniu')}
        </div>
      )}
    </div>
  );
}
