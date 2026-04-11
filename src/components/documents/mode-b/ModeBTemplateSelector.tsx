/**
 * ModeBTemplateSelector — PR-04 (Mode B UI Flow) + PR-B4 (Publish Gate)
 *
 * Wyświetla publish-safe master templates Trybu B z bazy danych.
 * Pozwala użytkownikowi wybrać szablon i zainicjować nowy dokument DOCX.
 *
 * Publish-safe (PR-B4): hook zwraca tylko szablony z is_active=true i docx_master_path IS NOT NULL.
 * Stan pusty (brak publish-safe szablonów):
 *   Honest fallback — szablony pojawią się gdy właściciel prześle pliki DOCX i aktywuje rekordy.
 *   Nie tworzymy fake kart ani placeholder danych.
 *
 * Tworzenie instancji:
 *   Wywołuje useCreateModeBInstance — tworzy rekord draft w DB.
 *   file_docx = null (kopia robocza DOCX po uruchomieniu silnika dokumentów).
 */

import { type ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  ClipboardList,
  Paperclip,
  ShieldCheck,
  MoreHorizontal,
  Package,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useModeBMasterTemplates } from '@/hooks/useModeBMasterTemplates';
import { useCreateModeBInstance } from '@/hooks/useModeBDocumentInstances';
import { useToast } from '@/hooks/use-toast';
import type { DocumentMasterTemplate, MasterTemplateCategory } from '@/types/document-mode-b';
import { cn } from '@/lib/utils';

// ── Metadata wizualna ──────────────────────────────────────────────────────────

const CATEGORY_ICON: Record<MasterTemplateCategory, ComponentType<{ className?: string }>> = {
  CONTRACTS:  FileText,
  PROTOCOLS:  ClipboardList,
  ANNEXES:    Paperclip,
  COMPLIANCE: ShieldCheck,
  OTHER:      MoreHorizontal,
};

const CATEGORY_COLOR: Record<MasterTemplateCategory, string> = {
  CONTRACTS:  'bg-info/10 text-info border-info/30 dark:bg-info/20',
  PROTOCOLS:  'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800', // purple = no DS token, needs revision
  ANNEXES:    'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20',
  COMPLIANCE: 'bg-success/10 text-success border-success/30 dark:bg-success/20',
  OTHER:      'bg-muted text-muted-foreground border-border',
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface ModeBTemplateSelectorProps {
  projectId?: string | null;
  clientId?: string | null;
  offerId?: string | null;
  /** Opcjonalne zawężenie do konkretnej kategorii — używane przez /app/ready-documents (PR-B2) */
  category?: MasterTemplateCategory;
  /** Wywołane po pomyślnym utworzeniu instancji — przekazuje nowe instanceId */
  onInstanceCreated: (instanceId: string) => void;
}

// ── TemplateMasterCard ────────────────────────────────────────────────────────

interface TemplateMasterCardProps {
  template: DocumentMasterTemplate;
  onSelect: (template: DocumentMasterTemplate) => void;
  isPending: boolean;
}

function TemplateMasterCard({ template, onSelect, isPending }: TemplateMasterCardProps) {
  const { t } = useTranslation();
  const Icon = CATEGORY_ICON[template.category];
  const colorCls = CATEGORY_COLOR[template.category];

  return (
    <button
      className="w-full text-left border rounded-lg p-4 hover:bg-muted/40 hover:border-primary/30 transition-all duration-150 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
      onClick={() => onSelect(template)}
      disabled={isPending}
      aria-label={t('modeB.templateSelector.createDocumentAriaLabel', { name: template.name })}
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-md border shrink-0 mt-0.5', colorCls)}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight group-hover:text-primary transition-colors">
            {template.name}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge variant="secondary" className="text-xs h-5 px-1.5">
              {t(`modeB.qualityTier.${template.quality_tier}`)}
            </Badge>
            <span className="text-xs text-muted-foreground">v{template.version}</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  );
}

// ── ModeBTemplateSelector ─────────────────────────────────────────────────────

export function ModeBTemplateSelector({
  projectId,
  clientId,
  offerId,
  category,
  onInstanceCreated,
}: ModeBTemplateSelectorProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: templates = [], isLoading, isError } = useModeBMasterTemplates(category);
  const createInstance = useCreateModeBInstance();

  async function handleSelect(template: DocumentMasterTemplate) {
    try {
      const instance = await createInstance.mutateAsync({
        templateKey: template.template_key,
        masterTemplateId: template.id,
        masterTemplateVersion: template.version,
        projectId: projectId ?? null,
        clientId: clientId ?? null,
        offerId: offerId ?? null,
        title: template.name,
        qualityTier: template.quality_tier,
      });
      toast({ title: t('modeB.templateSelector.createSuccess', { name: template.name }) });
      onInstanceCreated(instance.id);
    } catch {
      toast({ variant: 'destructive', title: t('modeB.templateSelector.createError') });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">{t('modeB.templateSelector.loading')}</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-sm text-destructive">
        {t('modeB.templateSelector.loadError')}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-10 space-y-3">
        <Package className="w-10 h-10 mx-auto text-muted-foreground opacity-40" />
        <div>
          <p className="text-sm font-medium">{t('modeB.templateSelector.emptyTitle')}</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            {t('modeB.templateSelector.emptyDesc')}
          </p>
        </div>
      </div>
    );
  }

  // Group by category
  const grouped = templates.reduce<Partial<Record<MasterTemplateCategory, DocumentMasterTemplate[]>>>(
    (acc, tmpl) => {
      if (!acc[tmpl.category]) acc[tmpl.category] = [];
      acc[tmpl.category]!.push(tmpl);
      return acc;
    },
    {},
  );

  const categories = Object.keys(grouped) as MasterTemplateCategory[];

  return (
    <div className="space-y-5">
      {categories.map((cat) => (
        <div key={cat}>
          <div className="flex items-center gap-2 mb-3">
            {(() => {
              const Icon = CATEGORY_ICON[cat];
              return (
                <span className={cn('p-1.5 rounded-md border', CATEGORY_COLOR[cat])}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
              );
            })()}
            <h3 className="text-sm font-semibold">{t(`docTemplates.category.${cat}`)}</h3>
            <Badge variant="secondary" className="text-xs">{grouped[cat]!.length}</Badge>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {grouped[cat]!.map((tmpl) => (
              <TemplateMasterCard
                key={tmpl.id}
                template={tmpl}
                onSelect={handleSelect}
                isPending={createInstance.isPending}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
