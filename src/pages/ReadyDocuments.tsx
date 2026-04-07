/**
 * ReadyDocuments page — PR-B1 (Variant B Shell)
 *
 * Route: /app/ready-documents
 *
 * Premium workspace for ready-made DOCX documents.
 * PR-B1: shell only — empty state, category navigation, layout structure.
 * Real data + document selector wired in PR-B2.
 *
 * Desktop: split layout — category/list panel (left) + content panel (right)
 * Mobile: full-width stacked layout
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileCheck, FileText, ClipboardList, FileStack, ShieldCheck, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Category definitions ──────────────────────────────────────────────────────

type DocumentCategory = 'CONTRACTS' | 'PROTOCOLS' | 'ANNEXES' | 'COMPLIANCE' | 'OTHER';

interface CategoryMeta {
  id: DocumentCategory;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORIES: CategoryMeta[] = [
  { id: 'CONTRACTS',  labelKey: 'readyDocs.categories.contracts',  icon: FileText },
  { id: 'PROTOCOLS',  labelKey: 'readyDocs.categories.protocols',  icon: ClipboardList },
  { id: 'ANNEXES',    labelKey: 'readyDocs.categories.annexes',    icon: FileStack },
  { id: 'COMPLIANCE', labelKey: 'readyDocs.categories.compliance', icon: ShieldCheck },
  { id: 'OTHER',      labelKey: 'readyDocs.categories.other',      icon: MoreHorizontal },
];

// ── ReadyDocuments ────────────────────────────────────────────────────────────

export default function ReadyDocuments() {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<DocumentCategory>('CONTRACTS');

  return (
    <div className="h-full min-h-[calc(100vh-4rem)]">
      {/* ── Desktop: split layout ─────────────────────────────────────────── */}
      <div className="lg:grid lg:grid-cols-[320px_1fr] lg:h-full">

        {/* Left panel — category nav + document list */}
        <div className="flex flex-col border-r border-border bg-muted/20 lg:h-full lg:overflow-y-auto">

          {/* Page header */}
          <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <FileCheck className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold truncate">{t('readyDocs.page.title')}</h1>
              <p className="text-xs text-muted-foreground truncate">{t('readyDocs.page.subtitle')}</p>
            </div>
          </div>

          {/* Category tabs */}
          <nav className="px-3 py-3 space-y-0.5" aria-label={t('readyDocs.page.title')}>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150 min-h-[44px]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2',
                    isActive
                      ? 'bg-gradient-to-r from-primary/15 to-primary/5 text-primary font-semibold shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} />
                  <span className="truncate">{t(cat.labelKey)}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right panel — empty state (PR-B1 shell) */}
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center lg:h-full">
          <div className="p-4 rounded-2xl bg-muted/50 mb-5">
            <FileCheck className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <h2 className="text-base font-semibold text-foreground mb-2">
            {t('readyDocs.emptyState.title')}
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            {t('readyDocs.emptyState.description')}
          </p>
        </div>
      </div>
    </div>
  );
}
