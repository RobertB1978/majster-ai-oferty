/**
 * TemplatesLibrary — PR-17
 *
 * Shows all document templates grouped by category.
 * Search by title/description. Category filter cards.
 * Clicking a template opens the TemplateEditor.
 *
 * Works with FF_NEW_SHELL ON/OFF.
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  ClipboardList,
  Paperclip,
  ShieldCheck,
  MoreHorizontal,
  Search,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

import {
  ALL_TEMPLATES,
  TEMPLATE_CATEGORIES,
  TEMPLATE_CATEGORY_TITLE_KEY,
  getTemplatesByCategory,
  type TemplateCategory,
  type DocumentTemplate,
} from '@/data/documentTemplates';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ── Category metadata ─────────────────────────────────────────────────────────

const CATEGORY_ICON: Record<TemplateCategory, React.ComponentType<{ className?: string }>> = {
  CONTRACTS:  FileText,
  PROTOCOLS:  ClipboardList,
  ANNEXES:    Paperclip,
  COMPLIANCE: ShieldCheck,
  OTHER:      MoreHorizontal,
};

const CATEGORY_COLOR: Record<TemplateCategory, string> = {
  CONTRACTS:  'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  PROTOCOLS:  'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  ANNEXES:    'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  COMPLIANCE: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  OTHER:      'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
};

const CATEGORY_ACTIVE_COLOR: Record<TemplateCategory, string> = {
  CONTRACTS:  'ring-blue-500 bg-blue-50 dark:bg-blue-900/20',
  PROTOCOLS:  'ring-purple-500 bg-purple-50 dark:bg-purple-900/20',
  ANNEXES:    'ring-orange-500 bg-orange-50 dark:bg-orange-900/20',
  COMPLIANCE: 'ring-green-500 bg-green-50 dark:bg-green-900/20',
  OTHER:      'ring-gray-400 bg-gray-50 dark:bg-gray-800',
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface TemplatesLibraryProps {
  onSelectTemplate: (template: DocumentTemplate) => void;
}

// ── TemplateCard ──────────────────────────────────────────────────────────────

interface TemplateCardProps {
  template: DocumentTemplate;
  onSelect: () => void;
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const { t } = useTranslation();
  const Icon = CATEGORY_ICON[template.category];
  const colorCls = CATEGORY_COLOR[template.category];

  return (
    <button
      className="w-full text-left border rounded-lg p-4 hover:bg-muted/40 hover:border-primary/30 transition-all duration-150 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      onClick={onSelect}
      aria-label={t(template.titleKey)}
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-md border shrink-0 mt-0.5', colorCls)}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight group-hover:text-primary transition-colors">
            {t(template.titleKey)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
            {t(template.descriptionKey)}
          </p>
          {template.references.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5">
              <BookOpen className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {t('docTemplates.library.referencesCount', { count: template.references.length })}
              </span>
            </div>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  );
}

// ── CategoryFilterChip ────────────────────────────────────────────────────────

interface CategoryFilterChipProps {
  category: TemplateCategory;
  count: number;
  active: boolean;
  onClick: () => void;
}

function CategoryFilterChip({ category, count, active, onClick }: CategoryFilterChipProps) {
  const { t } = useTranslation();
  const Icon = CATEGORY_ICON[category];
  const colorCls = CATEGORY_COLOR[category];
  const activeCls = CATEGORY_ACTIVE_COLOR[category];

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        active
          ? cn('ring-2', activeCls)
          : 'border-border hover:border-primary/40 hover:bg-muted/40'
      )}
      aria-pressed={active}
    >
      <span className={cn('p-1 rounded', colorCls)}>
        <Icon className="w-3.5 h-3.5" />
      </span>
      <span className="hidden sm:inline">{t(TEMPLATE_CATEGORY_TITLE_KEY[category])}</span>
      <Badge variant="secondary" className="text-xs h-5 px-1.5">
        {count}
      </Badge>
    </button>
  );
}

// ── TemplatesLibrary ──────────────────────────────────────────────────────────

export function TemplatesLibrary({ onSelectTemplate }: TemplatesLibraryProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | null>(null);

  const filtered = useMemo(() => {
    let list = ALL_TEMPLATES;

    if (activeCategory) {
      list = list.filter((tmpl) => tmpl.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (tmpl) =>
          t(tmpl.titleKey).toLowerCase().includes(q) ||
          t(tmpl.descriptionKey).toLowerCase().includes(q)
      );
    }

    return list;
  }, [search, activeCategory, t]);

  // Group by category for display
  const grouped = useMemo(() => {
    const categories = activeCategory
      ? [activeCategory]
      : TEMPLATE_CATEGORIES;

    return categories
      .map((cat) => ({
        category: cat,
        templates: filtered.filter((tmpl) => tmpl.category === cat),
      }))
      .filter((g) => g.templates.length > 0);
  }, [filtered, activeCategory]);

  const handleCategoryClick = (cat: TemplateCategory) => {
    setActiveCategory((prev) => (prev === cat ? null : cat));
    setSearch('');
  };

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('docTemplates.library.searchPlaceholder')}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setActiveCategory(null);
          }}
          className="pl-9 h-10"
          aria-label={t('docTemplates.library.searchAriaLabel')}
        />
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2">
        {TEMPLATE_CATEGORIES.map((cat) => (
          <CategoryFilterChip
            key={cat}
            category={cat}
            count={getTemplatesByCategory(cat).length}
            active={activeCategory === cat}
            onClick={() => handleCategoryClick(cat)}
          />
        ))}
      </div>

      {/* Template groups */}
      {grouped.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">{t('docTemplates.library.noResults')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ category, templates }) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                {(() => {
                  const Icon = CATEGORY_ICON[category];
                  return (
                    <span className={cn('p-1.5 rounded-md border', CATEGORY_COLOR[category])}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                  );
                })()}
                <h3 className="text-sm font-semibold">
                  {t(TEMPLATE_CATEGORY_TITLE_KEY[category])}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {templates.length}
                </Badge>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {templates.map((tmpl) => (
                  <TemplateCard
                    key={tmpl.key}
                    template={tmpl}
                    onSelect={() => onSelectTemplate(tmpl)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
