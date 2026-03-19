/**
 * TemplateEditor — PR-17
 *
 * Full-screen editor for a document template.
 * Left: accordion sections | Right: form fields
 * Auto-fill from Company/Client/Offer/Project.
 * Actions: Generate PDF, Save to Dossier.
 *
 * Works with FF_NEW_SHELL ON/OFF.
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Download,
  FolderOpen,
  Loader2,
  BookOpen,
  ChevronRight,
  Sparkles,
  Save,
} from 'lucide-react';

import type { DocumentTemplate, TemplateField, TemplateSection } from '@/data/documentTemplates';
import {
  useAutofillContext,
  useCreateDocumentInstance,
  useUpdateDocumentInstance,
  resolveAutofill,
  type AutofillContext,
} from '@/hooks/useDocumentInstances';
import { generateTemplatePdf, uploadTemplatePdf } from '@/lib/templatePdfGenerator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDate } from '@/lib/formatters';

// ── Props ─────────────────────────────────────────────────────────────────────

interface TemplateEditorProps {
  template: DocumentTemplate;
  projectId?: string | null;
  clientId?: string | null;
  offerId?: string | null;
  onBack: () => void;
  onSaved?: (instanceId: string) => void;
}

// ── FieldRenderer ─────────────────────────────────────────────────────────────

interface FieldRendererProps {
  field: TemplateField;
  value: string;
  onChange: (val: string) => void;
  autofillCtx?: AutofillContext;
  onAutofill?: () => void;
}

function FieldRenderer({ field, value, onChange, autofillCtx, onAutofill }: FieldRendererProps) {
  const { t } = useTranslation();
  const hasAutofill = !!field.autofill && !!autofillCtx;
  const canAutofill =
    hasAutofill &&
    !value &&
    resolveAutofill(field.autofill!, autofillCtx!) !== '';

  const labelId = `field-${field.key}`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={labelId} className="text-sm font-medium">
          {t(field.labelKey)}
          {field.required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        {canAutofill && (
          <button
            type="button"
            onClick={onAutofill}
            className="text-xs text-primary flex items-center gap-0.5 hover:underline"
            aria-label={t('docTemplates.editor.autofillField', { field: t(field.labelKey) })}
          >
            <Sparkles className="w-3 h-3" />
            {t('docTemplates.editor.autofill')}
          </button>
        )}
      </div>

      {field.type === 'textarea' ? (
        <Textarea
          id={labelId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ''}
          rows={3}
          className="resize-y text-sm"
        />
      ) : field.type === 'select' ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id={labelId} className="h-9 text-sm">
            <SelectValue placeholder={t('docTemplates.editor.selectPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((opt) => (
              <SelectItem key={opt} value={opt}>
                {t(`docTemplates.selectValues.${opt.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.type === 'checkbox' ? (
        <div className="flex items-center gap-2">
          <Checkbox
            id={labelId}
            checked={value === 'true'}
            onCheckedChange={(checked) => onChange(checked ? 'true' : 'false')}
          />
          <Label htmlFor={labelId} className="text-sm font-normal cursor-pointer">
            {t('docTemplates.editor.checkboxYes')}
          </Label>
        </div>
      ) : (
        <Input
          id={labelId}
          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ''}
          className="h-9 text-sm"
        />
      )}
    </div>
  );
}

// ── SectionAccordion ──────────────────────────────────────────────────────────

interface SectionAccordionProps {
  section: TemplateSection;
  data: Record<string, string>;
  onChange: (key: string, value: string) => void;
  autofillCtx?: AutofillContext;
  onAutofillField: (field: TemplateField) => void;
  defaultOpen?: boolean;
}

function SectionAccordion({
  section,
  data,
  onChange,
  autofillCtx,
  onAutofillField,
  defaultOpen = false,
}: SectionAccordionProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);

  const filledCount = section.fields.filter((f) => !!data[f.key]).length;
  const totalCount = section.fields.length;

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
      >
        <div className="flex-1 text-left">
          <p className="text-sm font-medium">{t(section.titleKey)}</p>
        </div>
        <Badge variant={filledCount === totalCount ? 'default' : 'secondary'} className="text-xs">
          {filledCount}/{totalCount}
        </Badge>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {open && (
        <div className="border-t p-4 space-y-4">
          {section.fields.map((field) => (
            <FieldRenderer
              key={field.key}
              field={field}
              value={data[field.key] ?? ''}
              onChange={(val) => onChange(field.key, val)}
              autofillCtx={autofillCtx}
              onAutofill={() => onAutofillField(field)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── ReferencesPanel ───────────────────────────────────────────────────────────

function ReferencesPanel({ template }: { template: DocumentTemplate }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  if (template.references.length === 0) return null;

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center gap-2 p-3 hover:bg-muted/30 transition-colors"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
      >
        <BookOpen className="w-4 h-4 text-primary shrink-0" />
        <p className="flex-1 text-left text-sm font-medium">{t('docTemplates.editor.references')}</p>
        <Badge variant="secondary" className="text-xs">
          {template.references.length}
        </Badge>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {open && (
        <div className="border-t p-4 space-y-2">
          {template.references.map((ref, i) => (
            <div key={i} className="flex items-start gap-2">
              <ChevronRight className="w-3 h-3 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                {ref.url ? (
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-primary"
                  >
                    {ref.text}
                  </a>
                ) : (
                  ref.text
                )}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── TemplateEditor ────────────────────────────────────────────────────────────

export function TemplateEditor({
  template,
  projectId,
  clientId,
  offerId,
  onBack,
  onSaved,
}: TemplateEditorProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [data, setData] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const section of template.sections) {
      for (const field of section.fields) {
        if (field.defaultValue) init[field.key] = field.defaultValue;
      }
    }
    return init;
  });

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSavingDossier, setIsSavingDossier] = useState(false);
  const [instanceId, setInstanceId] = useState<string | null>(null);

  const autofillQuery = useAutofillContext({ projectId, clientId, offerId });
  const createInstance = useCreateDocumentInstance();
  const updateInstance = useUpdateDocumentInstance();

  // Auto-fill fields from context on load
  useEffect(() => {
    if (!autofillQuery.data) return;
    const ctx = autofillQuery.data;
    setData((prev) => {
      const next = { ...prev };
      for (const section of template.sections) {
        for (const field of section.fields) {
          if (field.autofill && !next[field.key]) {
            const filled = resolveAutofill(field.autofill, ctx);
            if (filled) next[field.key] = filled;
          }
        }
      }
      return next;
    });
  }, [autofillQuery.data, template.sections]);

  const handleFieldChange = useCallback((key: string, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleAutofillField = useCallback(
    (field: TemplateField) => {
      if (!field.autofill || !autofillQuery.data) return;
      const filled = resolveAutofill(field.autofill, autofillQuery.data);
      if (filled) {
        setData((prev) => ({ ...prev, [field.key]: filled }));
      }
    },
    [autofillQuery.data]
  );

  const handleAutofillAll = () => {
    if (!autofillQuery.data) return;
    const ctx = autofillQuery.data;
    setData((prev) => {
      const next = { ...prev };
      for (const section of template.sections) {
        for (const field of section.fields) {
          if (field.autofill) {
            const filled = resolveAutofill(field.autofill, ctx);
            if (filled) next[field.key] = filled;
          }
        }
      }
      return next;
    });
    toast.success(t('docTemplates.editor.autofillAllDone'));
  };

  // Validate required fields
  const validateRequired = (): boolean => {
    const missing: string[] = [];
    for (const section of template.sections) {
      for (const field of section.fields) {
        if (field.required && !data[field.key]) {
          missing.push(t(field.labelKey));
        }
      }
    }
    if (missing.length > 0) {
      toast.error(
        t('docTemplates.editor.requiredFields', { fields: missing.slice(0, 3).join(', ') })
      );
      return false;
    }
    return true;
  };

  // Ensure or reuse instance
  const ensureInstance = async (): Promise<string> => {
    if (instanceId) return instanceId;

    const result = await createInstance.mutateAsync({
      template,
      locale: 'pl',
      projectId,
      clientId,
      offerId,
      dataJson: data,
    });
    setInstanceId(result.id);
    return result.id;
  };

  // Generate PDF
  const handleGeneratePdf = async () => {
    if (!validateRequired()) return;
    if (!user) return;
    setIsGeneratingPdf(true);

    try {
      const pdfBlob = await generateTemplatePdf({
        template,
        data,
        autofillContext: autofillQuery.data ?? {},
        locale: 'pl',
        t,
      });

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      const safeTitle = t(template.titleKey)
        .replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s]/gi, '')
        .trim() || template.key;
      link.href = url;
      link.download = `${safeTitle}_${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(t('docTemplates.editor.pdfDownloaded'));
    } catch (_err) {
      toast.error(t('docTemplates.editor.pdfError'));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Save to dossier
  const handleSaveToDossier = async () => {
    if (!validateRequired()) return;
    if (!user) return;
    if (!projectId) {
      toast.error(t('docTemplates.editor.projectRequired'));
      return;
    }

    setIsSavingDossier(true);
    try {
      // 1. Generate PDF blob
      const pdfBlob = await generateTemplatePdf({
        template,
        data,
        autofillContext: autofillQuery.data ?? {},
        locale: 'pl',
        t,
      });

      // 2. Ensure instance exists
      const iid = await ensureInstance();

      // 3. Upload PDF to dossier bucket
      const pdfPath = await uploadTemplatePdf({
        userId: user.id,
        projectId,
        instanceId: iid,
        templateKey: template.key,
        pdfBlob,
      });

      // 4. Create dossier item
      const safeTitle = t(template.titleKey).trim() || template.key;
      const fileName = `${safeTitle}_${formatDate(new Date(), i18n.language).replace(/\./g, '-')}.pdf`;

      const { data: dossierItem, error: dossierErr } = await supabase
        .from('project_dossier_items')
        .insert({
          user_id: user.id,
          project_id: projectId,
          category: template.dossierCategory,
          file_path: pdfPath,
          file_name: fileName,
          mime_type: 'application/pdf',
          size_bytes: pdfBlob.size,
          source: 'MANUAL',
        })
        .select('id')
        .single();

      if (dossierErr) throw dossierErr;

      // 5. Update instance with pdf_path + dossier_item_id
      await updateInstance.mutateAsync({
        id: iid,
        dataJson: data,
        pdfPath,
        dossierItemId: dossierItem.id,
      });

      toast.success(t('docTemplates.editor.savedToDossier'));
      onSaved?.(iid);
    } catch (_err) {
      toast.error(t('docTemplates.editor.saveError'));
    } finally {
      setIsSavingDossier(false);
    }
  };

  const isBusy = isGeneratingPdf || isSavingDossier;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card sticky top-0 z-10">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onBack} disabled={isBusy}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold truncate">{t(template.titleKey)}</h2>
          <p className="text-xs text-muted-foreground truncate">
            {t(template.descriptionKey)}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-8 shrink-0"
          onClick={handleAutofillAll}
          disabled={isBusy || !autofillQuery.data}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('docTemplates.editor.autofillAll')}</span>
        </Button>
      </div>

      {/* Body: sections */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {template.sections.map((section, idx) => (
          <SectionAccordion
            key={section.key}
            section={section}
            data={data}
            onChange={handleFieldChange}
            autofillCtx={autofillQuery.data}
            onAutofillField={handleAutofillField}
            defaultOpen={idx === 0}
          />
        ))}

        {/* References */}
        <ReferencesPanel template={template} />
      </div>

      {/* Sticky footer actions */}
      <div className="border-t bg-card px-4 py-3 flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={handleGeneratePdf}
          disabled={isBusy}
        >
          {isGeneratingPdf ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isGeneratingPdf
            ? t('docTemplates.editor.generatingPdf')
            : t('docTemplates.editor.generatePdf')}
        </Button>

        <Button
          className="flex-1 gap-2"
          onClick={handleSaveToDossier}
          disabled={isBusy || !projectId}
          title={!projectId ? t('docTemplates.editor.projectRequired') : undefined}
        >
          {isSavingDossier ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FolderOpen className="w-4 h-4" />
          )}
          {isSavingDossier
            ? t('docTemplates.editor.saving')
            : t('docTemplates.editor.saveToDossier')}
        </Button>

        {instanceId && (
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={async () => {
              await updateInstance.mutateAsync({ id: instanceId, dataJson: data });
              toast.success(t('docTemplates.editor.draftSaved'));
            }}
            disabled={isBusy}
            title={t('docTemplates.editor.saveDraft')}
          >
            <Save className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
