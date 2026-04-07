/**
 * ModeBTemplateSelector — PR-04 (Mode B UI Flow)
 *
 * Wyświetla dostępne master templates Trybu B z bazy danych.
 * Pozwala użytkownikowi wybrać szablon i zainicjować nowy dokument DOCX.
 *
 * Stan pusty (brak szablonów w DB):
 *   Honest fallback — szablony pojawią się w PR-05a/05b/05c.
 *   Nie tworzymy fake kart ani placeholder danych.
 *
 * Tworzenie instancji:
 *   Wywołuje useCreateModeBInstance — tworzy rekord draft w DB.
 *   file_docx = null (Edge Function DOCX dopiero w PR-02/05).
 */

import { type ComponentType } from 'react';
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
import { Button } from '@/components/ui/button';
import { useModeBMasterTemplates } from '@/hooks/useModeBMasterTemplates';
import { useCreateModeBInstance } from '@/hooks/useModeBDocumentInstances';
import { useGenerateModeBDocx } from '@/hooks/useGenerateModeBDocx';
import { useToast } from '@/hooks/use-toast';
import type { DocumentMasterTemplate, MasterTemplateCategory, QualityTier } from '@/types/document-mode-b';
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
  CONTRACTS:  'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  PROTOCOLS:  'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  ANNEXES:    'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  COMPLIANCE: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  OTHER:      'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
};

const QUALITY_LABEL: Record<QualityTier, string> = {
  short_form: 'Uproszczony',
  standard:   'Standardowy',
  premium:    'Premium',
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface ModeBTemplateSelectorProps {
  projectId?: string | null;
  clientId?: string | null;
  offerId?: string | null;
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
  const Icon = CATEGORY_ICON[template.category];
  const colorCls = CATEGORY_COLOR[template.category];

  return (
    <button
      className="w-full text-left border rounded-lg p-4 hover:bg-muted/40 hover:border-primary/30 transition-all duration-150 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
      onClick={() => onSelect(template)}
      disabled={isPending}
      aria-label={`Utwórz dokument: ${template.name}`}
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
              {QUALITY_LABEL[template.quality_tier]}
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
  onInstanceCreated,
}: ModeBTemplateSelectorProps) {
  const { toast } = useToast();
  const { data: templates = [], isLoading, isError } = useModeBMasterTemplates();
  const createInstance = useCreateModeBInstance();
  const generateDocx = useGenerateModeBDocx();

  async function handleSelect(template: DocumentMasterTemplate) {
    let instanceId: string | null = null;
    try {
      // Krok 1 — utwórz rekord draft (file_docx = null)
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
      instanceId = instance.id;

      // Krok 2 — wygeneruj DOCX przez Edge Function
      await generateDocx.mutateAsync({
        instanceId: instance.id,
        templateKey: template.template_key,
      });

      toast({ title: `Dokument "${template.name}" gotowy do pobrania` });
      onInstanceCreated(instance.id);
    } catch {
      // Jeśli instancja została utworzona ale generacja DOCX nie powiodła się,
      // przekazujemy instanceId — użytkownik widzi draft z wyłączonym przyciskiem pobierania.
      toast({
        variant: 'destructive',
        title: 'Błąd generowania DOCX',
        description: 'Szkic dokumentu został utworzony, ale plik DOCX nie jest jeszcze dostępny.',
      });
      if (instanceId) onInstanceCreated(instanceId);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Ładowanie szablonów…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-sm text-destructive">
        Błąd pobierania szablonów. Odśwież stronę.
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-10 space-y-3">
        <Package className="w-10 h-10 mx-auto text-muted-foreground opacity-40" />
        <div>
          <p className="text-sm font-medium">Szablony dokumentów wkrótce</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Biblioteka szablonów DOCX (umowy, protokoły, aneksy) zostanie uzupełniona
            w kolejnym etapie wdrożenia.
          </p>
        </div>
        <Button variant="outline" size="sm" disabled>
          Sprawdź ponownie
        </Button>
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
            <h3 className="text-sm font-semibold capitalize">{cat.toLowerCase()}</h3>
            <Badge variant="secondary" className="text-xs">{grouped[cat]!.length}</Badge>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {grouped[cat]!.map((tmpl) => (
              <TemplateMasterCard
                key={tmpl.id}
                template={tmpl}
                onSelect={handleSelect}
                isPending={createInstance.isPending || generateDocx.isPending}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
