/**
 * GlobalSearch — roadmap §9 (keyboard shortcut `/`)
 *
 * A command-palette that opens when:
 *  - User presses `/` in Dense Mode (wired via data-global-search attribute)
 *  - User presses Ctrl+K / Cmd+K anywhere (universal)
 *
 * Searches offers, clients, and projects in real-time via Supabase.
 * Navigates to the appropriate detail/list page on selection.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { FileText, Users, FolderOpen, Search } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  type: 'offer' | 'client' | 'project';
}

// ── Search query ──────────────────────────────────────────────────────────────

async function runSearch(term: string, userId: string): Promise<SearchResult[]> {
  if (!term.trim()) return [];

  const like = `%${term.trim()}%`;

  const [offersRes, clientsRes, projectsRes] = await Promise.all([
    supabase
      .from('offers')
      .select('id, title, status')
      .eq('user_id', userId)
      .ilike('title', like)
      .limit(5),

    supabase
      .from('clients')
      .select('id, name, phone')
      .eq('user_id', userId)
      .ilike('name', like)
      .limit(5),

    supabase
      .from('v2_projects')
      .select('id, title, status')
      .eq('user_id', userId)
      .ilike('title', like)
      .limit(5),
  ]);

  const results: SearchResult[] = [];

  for (const o of offersRes.data ?? []) {
    results.push({
      id: o.id,
      label: o.title ?? o.id.slice(0, 8),
      sublabel: o.status,
      href: `/app/offers/${o.id}`,
      type: 'offer',
    });
  }

  for (const c of clientsRes.data ?? []) {
    results.push({
      id: c.id,
      label: c.name,
      sublabel: c.phone ?? undefined,
      href: `/app/customers/${c.id}`,
      type: 'client',
    });
  }

  for (const p of projectsRes.data ?? []) {
    results.push({
      id: p.id,
      label: p.title,
      sublabel: p.status,
      href: `/app/projects/${p.id}`,
      type: 'project',
    });
  }

  return results;
}

// ── Component ─────────────────────────────────────────────────────────────────

const TYPE_ICONS = {
  offer: FileText,
  client: Users,
  project: FolderOpen,
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 250);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  // Hidden anchor input — focused by keyboard shortcut `/` in useKeyboardShortcuts
  const anchorRef = useRef<HTMLInputElement>(null);

  // Open on Ctrl+K / Cmd+K (universal, regardless of dense mode)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // When hidden anchor is focused (by `/` shortcut), open the palette
  useEffect(() => {
    const el = anchorRef.current;
    if (!el) return;
    function handleFocus() {
      setOpen(true);
      // Immediately blur the hidden input so it doesn't steal further keystrokes
      el?.blur();
    }
    el.addEventListener('focus', handleFocus);
    return () => el.removeEventListener('focus', handleFocus);
  }, []);

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['global-search', debouncedQuery, user?.id],
    queryFn: () => runSearch(debouncedQuery, user!.id),
    enabled: !!user && debouncedQuery.length >= 2,
    staleTime: 30_000,
  });

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false);
      navigate(href);
    },
    [navigate],
  );

  // Group results by type
  const offers = results.filter((r) => r.type === 'offer');
  const clients = results.filter((r) => r.type === 'client');
  const projects = results.filter((r) => r.type === 'project');

  return (
    <>
      {/*
        Hidden anchor input — `data-global-search` attribute.
        The keyboard shortcut in useKeyboardShortcuts does:
          document.querySelector('[data-global-search]')?.focus()
        Focusing this element triggers the `focus` handler above,
        which opens the palette and immediately blurs the input.
      */}
      <input
        ref={anchorRef}
        data-global-search
        aria-hidden="true"
        tabIndex={-1}
        readOnly
        className="sr-only"
      />

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder={t('globalSearch.placeholder', 'Szukaj ofert, klientów, projektów…')}
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {/* Loading indicator */}
          {isFetching && debouncedQuery.length >= 2 && (
            <div className="py-3 px-4 text-sm text-muted-foreground flex items-center gap-2">
              <Search className="h-4 w-4 animate-pulse" />
              {t('globalSearch.searching', 'Szukam…')}
            </div>
          )}

          {/* Empty state — only when user has typed enough and we're not fetching */}
          {!isFetching && debouncedQuery.length >= 2 && results.length === 0 && (
            <CommandEmpty>{t('globalSearch.noResults', 'Brak wyników')}</CommandEmpty>
          )}

          {/* Default hint when query is too short */}
          {debouncedQuery.length < 2 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {t('globalSearch.hint', 'Wpisz co najmniej 2 znaki, aby wyszukać')}
            </div>
          )}

          {/* Offers */}
          {offers.length > 0 && (
            <CommandGroup heading={t('globalSearch.offers', 'Oferty')}>
              {offers.map((r) => {
                const Icon = TYPE_ICONS[r.type];
                return (
                  <CommandItem
                    key={r.id}
                    value={`offer-${r.id}`}
                    onSelect={() => handleSelect(r.href)}
                    className="flex items-center gap-3"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{r.label}</span>
                    {r.sublabel && (
                      <span className="text-xs text-muted-foreground shrink-0">{r.sublabel}</span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {offers.length > 0 && (clients.length > 0 || projects.length > 0) && (
            <CommandSeparator />
          )}

          {/* Clients */}
          {clients.length > 0 && (
            <CommandGroup heading={t('globalSearch.clients', 'Klienci')}>
              {clients.map((r) => {
                const Icon = TYPE_ICONS[r.type];
                return (
                  <CommandItem
                    key={r.id}
                    value={`client-${r.id}`}
                    onSelect={() => handleSelect(r.href)}
                    className="flex items-center gap-3"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{r.label}</span>
                    {r.sublabel && (
                      <span className="text-xs text-muted-foreground shrink-0">{r.sublabel}</span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {clients.length > 0 && projects.length > 0 && <CommandSeparator />}

          {/* Projects */}
          {projects.length > 0 && (
            <CommandGroup heading={t('globalSearch.projects', 'Projekty')}>
              {projects.map((r) => {
                const Icon = TYPE_ICONS[r.type];
                return (
                  <CommandItem
                    key={r.id}
                    value={`project-${r.id}`}
                    onSelect={() => handleSelect(r.href)}
                    className="flex items-center gap-3"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{r.label}</span>
                    {r.sublabel && (
                      <span className="text-xs text-muted-foreground shrink-0">{r.sublabel}</span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
