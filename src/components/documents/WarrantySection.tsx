/**
 * WarrantySection — PR-18
 *
 * Accordion panel for ProjectHub.
 * - Empty state → "Dodaj gwarancję" → inline form
 * - Filled state → summary card + Download PDF + Save to dossier + Send email
 * - Expiry badge: green (active) / amber (< 30 days) / red (expired)
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Shield, Download, FolderOpen, Mail, Pencil, Trash2, Loader2, Plus,
} from 'lucide-react';

import {
  useWarranty,
  useUpsertWarranty,
  useDeleteWarranty,
  useMarkWarrantyPdfPath,
  daysUntilExpiry,
  type WarrantyFormData,
} from '@/hooks/useWarranty';
import { generateWarrantyPdfBlob, uploadWarrantyToDossier } from '@/lib/warrantyPdfGenerator';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SkeletonList } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/formatters';

// ── Types ─────────────────────────────────────────────────────────────────────

interface WarrantySectionProps {
  projectId: string;
  projectTitle: string;
}

// ── Empty state ───────────────────────────────────────────────────────────────

function WarrantyEmpty({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <Shield className="h-10 w-10 text-muted-foreground/40" />
      <p className="text-sm font-medium text-muted-foreground">{t('warranty.noWarranty')}</p>
      <p className="text-xs text-muted-foreground">{t('warranty.noWarrantyDesc')}</p>
      <Button size="sm" variant="outline" className="gap-2 mt-1" onClick={onAdd}>
        <Plus className="h-4 w-4" />
        {t('warranty.addWarranty')}
      </Button>
    </div>
  );
}

// ── Expiry badge ──────────────────────────────────────────────────────────────

function ExpiryBadge({ endDate }: { endDate: string }) {
  const { t } = useTranslation();
  const days = daysUntilExpiry(endDate);
  const label = days < 0
    ? t('warranty.expired')
    : t('warranty.expiresIn', { days });

  const cls = days < 0
    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    : days < 30
    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';

  return (
    <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', cls)}>
      {label}
    </span>
  );
}

// ── Warranty form ─────────────────────────────────────────────────────────────

const DEFAULT_MONTHS = 24;

function WarrantyForm({
  projectId,
  initial,
  onDone,
}: {
  projectId: string;
  initial?: Partial<WarrantyFormData>;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const upsert = useUpsertWarranty(projectId);

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<WarrantyFormData>({
    client_name: initial?.client_name ?? '',
    client_email: initial?.client_email ?? '',
    contact_phone: initial?.contact_phone ?? '',
    warranty_months: initial?.warranty_months ?? DEFAULT_MONTHS,
    start_date: initial?.start_date ?? today,
    scope_of_work: initial?.scope_of_work ?? '',
    exclusions: initial?.exclusions ?? '',
  });

  const set = (key: keyof WarrantyFormData, value: string | number) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await upsert.mutateAsync(form);
      toast.success(t('warranty.saveWarranty'));
      onDone();
    } catch {
      toast.error(t('common.errorGeneric'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 py-2">
      {/* Client */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            {t('warranty.fields.clientName')}
          </label>
          <Input
            value={form.client_name}
            onChange={e => set('client_name', e.target.value)}
            placeholder={t('warranty.placeholders.clientName')}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            {t('warranty.fields.contactPhone')}
          </label>
          <Input
            value={form.contact_phone}
            onChange={e => set('contact_phone', e.target.value)}
            placeholder={t('warranty.placeholders.contactPhone')}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          {t('warranty.fields.clientEmail')}
        </label>
        <Input
          type="email"
          value={form.client_email}
          onChange={e => set('client_email', e.target.value)}
          placeholder={t('warranty.placeholders.clientEmail')}
          className="h-8 text-sm"
        />
      </div>

      {/* Period */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            {t('warranty.fields.startDate')}
          </label>
          <Input
            type="date"
            value={form.start_date}
            onChange={e => set('start_date', e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            {t('warranty.fields.warrantyMonths')}
          </label>
          <Input
            type="number"
            min={1}
            max={120}
            value={form.warranty_months}
            onChange={e => set('warranty_months', parseInt(e.target.value, 10) || DEFAULT_MONTHS)}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Scope */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          {t('warranty.fields.scopeOfWork')}
        </label>
        <textarea
          value={form.scope_of_work}
          onChange={e => set('scope_of_work', e.target.value)}
          placeholder={t('warranty.placeholders.scopeOfWork')}
          rows={2}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      {/* Exclusions */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          {t('warranty.fields.exclusions')}
        </label>
        <textarea
          value={form.exclusions}
          onChange={e => set('exclusions', e.target.value)}
          placeholder={t('warranty.placeholders.exclusions')}
          rows={2}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" className="flex-1" disabled={upsert.isPending}>
          {upsert.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
          {t('warranty.saveWarranty')}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          {t('warranty.cancel')}
        </Button>
      </div>
    </form>
  );
}

// ── Warranty card (filled state) ──────────────────────────────────────────────

function WarrantyCard({
  projectId,
  projectTitle,
  onEdit,
}: {
  projectId: string;
  projectTitle: string;
  onEdit: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { data: warranty } = useWarranty(projectId);
  const deleteMut = useDeleteWarranty(projectId);
  const markPdf = useMarkWarrantyPdfPath(projectId);
  const [busy, setBusy] = useState<'pdf' | 'dossier' | 'email' | null>(null);

  if (!warranty) return null;

  const handleDownload = async () => {
    setBusy('pdf');
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_name, city')
        .maybeSingle();

      const blob = generateWarrantyPdfBlob({
        warranty,
        projectTitle,
        companyName: profile?.company_name ?? 'Majster',
        companyAddress: profile?.city ?? undefined,
        t,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gwarancja_${projectTitle.replace(/\s+/g, '_').slice(0, 30)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('common.errorGeneric'));
    } finally {
      setBusy(null);
    }
  };

  const handleSaveToDossier = async () => {
    setBusy('dossier');
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_name, city')
        .maybeSingle();

      const blob = generateWarrantyPdfBlob({
        warranty,
        projectTitle,
        companyName: profile?.company_name ?? 'Majster',
        companyAddress: profile?.city ?? undefined,
        t,
      });

      const path = await uploadWarrantyToDossier(blob, projectId, projectTitle);
      await markPdf.mutateAsync({ warrantyId: warranty.id, pdfPath: path });
      toast.success(t('warranty.savedToDossier'));
    } catch {
      toast.error(t('common.errorGeneric'));
    } finally {
      setBusy(null);
    }
  };

  const handleSendEmail = async () => {
    if (!warranty.client_email) {
      toast.error(t('warranty.emailError'));
      return;
    }
    setBusy('email');
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_name, city')
        .maybeSingle();

      const blob = generateWarrantyPdfBlob({
        warranty,
        projectTitle,
        companyName: profile?.company_name ?? 'Majster',
        companyAddress: profile?.city ?? undefined,
        t,
      });

      // Convert blob → base64 for Resend attachment
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const { error } = await supabase.functions.invoke('send-offer-email', {
        body: {
          to: warranty.client_email,
          subject: `${t('warranty.pdf.title')} — ${projectTitle}`,
          html: `<p>${t('warranty.email.greeting', { name: warranty.client_name ?? '' })}</p>
<p>${t('warranty.email.body', { project: projectTitle })}</p>
<p>${t('warranty.email.validUntil', { date: formatDate(warranty.end_date, i18n.language) })}</p>
<p>${t('warranty.email.contact')}</p>`,
          attachments: [
            {
              filename: `karta_gwarancyjna_${projectTitle.replace(/\s+/g, '_').slice(0, 30)}.pdf`,
              content: base64,
              contentType: 'application/pdf',
            },
          ],
        },
      });

      if (error) throw error;
      toast.success(t('warranty.emailSent', { email: warranty.client_email }));
    } catch {
      toast.error(t('warranty.emailError'));
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('warranty.deleteConfirm'))) return;
    try {
      await deleteMut.mutateAsync(warranty.id);
    } catch {
      toast.error(t('common.errorGeneric'));
    }
  };

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="rounded-lg border p-3 bg-muted/30 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{warranty.client_name || '—'}</span>
          </div>
          <ExpiryBadge endDate={warranty.end_date} />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{t('warranty.fields.warrantyMonths')}: <b className="text-foreground">{warranty.warranty_months}</b></span>
          <span>{t('warranty.pdf.endDate')}: <b className="text-foreground">{formatDate(warranty.end_date, i18n.language)}</b></span>
          {warranty.client_email && (
            <span className="col-span-2 truncate">{warranty.client_email}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleDownload} disabled={busy === 'pdf'}>
          {busy === 'pdf' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          {t('warranty.downloadPdf')}
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleSaveToDossier} disabled={busy === 'dossier'}>
          {busy === 'dossier' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FolderOpen className="h-3.5 w-3.5" />}
          {t('warranty.saveToDossier')}
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleSendEmail} disabled={busy === 'email' || !warranty.client_email}>
          {busy === 'email' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
          {t('warranty.sendEmail')}
        </Button>
        <Button size="sm" variant="ghost" className="gap-1.5 text-xs ml-auto" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
          {t('warranty.editWarranty')}
        </Button>
        <Button size="sm" variant="ghost" className="gap-1.5 text-xs text-destructive hover:text-destructive" onClick={handleDelete} disabled={deleteMut.isPending}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function WarrantySection({ projectId, projectTitle }: WarrantySectionProps) {
  const { data: warranty, isLoading } = useWarranty(projectId);
  const [editing, setEditing] = useState(false);

  if (isLoading) return <SkeletonList rows={2} />;

  if (!warranty && !editing) {
    return <WarrantyEmpty onAdd={() => setEditing(true)} />;
  }

  if (editing || !warranty) {
    return (
      <WarrantyForm
        projectId={projectId}
        initial={warranty ? {
          client_name: warranty.client_name ?? '',
          client_email: warranty.client_email ?? '',
          contact_phone: warranty.contact_phone ?? '',
          warranty_months: warranty.warranty_months,
          start_date: warranty.start_date,
          scope_of_work: warranty.scope_of_work ?? '',
          exclusions: warranty.exclusions ?? '',
        } : undefined}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <WarrantyCard
      projectId={projectId}
      projectTitle={projectTitle}
      onEdit={() => setEditing(true)}
    />
  );
}
