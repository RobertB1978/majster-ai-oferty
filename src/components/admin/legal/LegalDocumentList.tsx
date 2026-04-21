import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Search, FileText, CheckCircle2, Archive, Pencil } from 'lucide-react';
import type { LegalDocumentGroup, LegalDocument, LegalDocumentSlug } from '@/types/legal';
import { useAdminLegalDocumentGroups, useCreateDraftFromPublished } from '@/hooks/useLegalCms';
import { toast } from 'sonner';

interface LegalDocumentListProps {
  onSelect: (doc: LegalDocument) => void;
  onNewDraft: (slug: LegalDocumentSlug, language: string) => void;
  selectedId?: string;
}

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  published: { label: 'Opublikowany', variant: 'default' },
  draft:     { label: 'Szkic',        variant: 'secondary' },
  archived:  { label: 'Archiwalny',   variant: 'outline' },
};

const SLUG_LABELS: Record<LegalDocumentSlug, string> = {
  privacy: 'Polityka prywatności',
  terms:   'Regulamin',
  cookies: 'Polityka cookies',
  dpa:     'DPA',
  rodo:    'RODO',
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_BADGE[status] ?? { label: status, variant: 'outline' as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function GroupRow({
  group,
  onSelect,
  selectedId,
  onCreateDraft,
}: {
  group: LegalDocumentGroup;
  onSelect: (doc: LegalDocument) => void;
  selectedId?: string;
  onCreateDraft: (slug: LegalDocumentSlug, language: string) => void;
}) {
  const allDocs: LegalDocument[] = [
    ...(group.published ? [group.published] : []),
    ...group.drafts,
  ];

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* group header */}
      <div className="flex items-center justify-between gap-2 px-4 py-2 bg-muted/40 border-b">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">
            {SLUG_LABELS[group.slug] ?? group.slug}
          </span>
          <Badge variant="outline" className="text-xs font-mono">{group.language.toUpperCase()}</Badge>
        </div>
        {!group.drafts.length && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1"
            onClick={() => onCreateDraft(group.slug, group.language)}
          >
            <PlusCircle className="h-3 w-3" />
            Nowy szkic
          </Button>
        )}
      </div>

      {/* rows */}
      {allDocs.map((doc) => (
        <button
          key={doc.id}
          type="button"
          onClick={() => onSelect(doc)}
          className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-accent/50 border-b last:border-0 ${
            selectedId === doc.id ? 'bg-accent' : ''
          }`}
        >
          <div className="flex flex-col gap-0.5">
            <span className="font-medium truncate max-w-xs">{doc.title}</span>
            <span className="text-xs text-muted-foreground font-mono">v{doc.version}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={doc.status} />
            {doc.status === 'published' && (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            )}
            {doc.status === 'draft' && (
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            {doc.status === 'archived' && (
              <Archive className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        </button>
      ))}

      {allDocs.length === 0 && (
        <div className="px-4 py-3 text-xs text-muted-foreground italic">
          Brak dokumentów w tej grupie.
        </div>
      )}
    </div>
  );
}

export function LegalDocumentList({ onSelect, onNewDraft, selectedId }: LegalDocumentListProps) {
  const [search, setSearch] = useState('');
  const { groups, isLoading, error } = useAdminLegalDocumentGroups();
  const createDraft = useCreateDraftFromPublished();

  const filtered = groups.filter((g) => {
    const q = search.toLowerCase();
    return (
      g.slug.includes(q) ||
      g.language.includes(q) ||
      (SLUG_LABELS[g.slug] ?? '').toLowerCase().includes(q) ||
      g.published?.title.toLowerCase().includes(q) ||
      g.drafts.some((d) => d.title.toLowerCase().includes(q))
    );
  });

  async function handleCreateDraft(slug: LegalDocumentSlug, language: string) {
    const group = groups.find((g) => g.slug === slug && g.language === language);
    if (group?.published) {
      try {
        const newId = await createDraft.mutateAsync({ slug, language });
        toast.success('Szkic utworzony na podstawie opublikowanej wersji.');
        const newDraft = groups
          .flatMap((g) => g.drafts)
          .find((d) => d.id === newId);
        if (newDraft) onSelect(newDraft);
      } catch (e) {
        toast.error(`Błąd tworzenia szkicu: ${(e as Error).message}`);
      }
    } else {
      onNewDraft(slug, language);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive p-4 border border-destructive/30 rounded-lg">
        Błąd ładowania dokumentów: {error.message}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-8"
          placeholder="Szukaj dokumentu…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          Brak dokumentów spełniających kryteria.
        </p>
      ) : (
        filtered.map((g) => (
          <GroupRow
            key={`${g.slug}:${g.language}`}
            group={g}
            onSelect={onSelect}
            selectedId={selectedId}
            onCreateDraft={handleCreateDraft}
          />
        ))
      )}
    </div>
  );
}
