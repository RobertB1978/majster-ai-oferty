/**
 * ProjectPublicStatus — PR-13
 *
 * Public QR status page for clients. No login required.
 * Route: /p/:token
 *
 * Security:
 *   - Token resolved via SECURITY DEFINER function (server-side expiry + validation)
 *   - Returns ONLY: title, stages, progress_percent, dates — NO prices/amounts
 *   - Cross-tenant access impossible (token → single project FK)
 */

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Circle, Clock, FolderKanban, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/formatters';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PublicStage {
  name: string;
  due_date: string | null;
  is_done: boolean;
  sort_order: number;
}

interface PublicProjectData {
  title: string;
  status: string;
  progress_percent: number;
  start_date: string | null;
  end_date: string | null;
  stages_json: PublicStage[];
  created_at: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProjectPublicStatus() {
  const { token } = useParams<{ token: string }>();
  const { t, i18n } = useTranslation();

  const publicProjectQuery = useQuery({
    queryKey: ['projectPublicStatus', token],
    enabled: Boolean(token),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    retry: 1,
    queryFn: async () => {
      if (!token) throw new Error('missing_token');
      const { data, error } = await supabase.rpc('resolve_project_public_token', {
        p_token: token,
      });

      if (error) throw new Error('server_error');

      const result = data as Record<string, unknown>;
      if (result.error === 'expired') throw new Error('expired');
      if (result.error) throw new Error('not_found');

      return {
        project: result.project as PublicProjectData,
        expiresAt: result.expires_at as string,
      };
    },
  });

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (publicProjectQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (publicProjectQuery.isError) {
    const code = publicProjectQuery.error instanceof Error ? publicProjectQuery.error.message : 'server_error';
    const msgKey =
      code === 'expired'
        ? 'projectsV2.public.errorExpired'
        : 'projectsV2.public.errorNotFound';

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-sm w-full text-center space-y-3">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground" />
          <h1 className="text-lg font-semibold">{t(msgKey)}</h1>
          <p className="text-sm text-muted-foreground">{t('projectsV2.public.errorDesc')}</p>
        </div>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  const project = publicProjectQuery.data?.project;
  if (!project) {
    return null;
  }
  const stages = (project.stages_json ?? []).sort((a, b) => a.sort_order - b.sort_order);
  const doneCount = stages.filter(s => s.is_done).length;

  const STATUS_LABEL: Record<string, string> = {
    ACTIVE:    t('projectsV2.statusActive'),
    COMPLETED: t('projectsV2.statusCompleted'),
    ON_HOLD:   t('projectsV2.statusOnHold'),
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b px-4 py-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
          <FolderKanban className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('projectsV2.public.label')}</p>
          <h1 className="font-bold text-lg leading-tight">{project.title}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Status + Progress */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('projectsV2.public.status')}</span>
            <span className="text-sm font-semibold">
              {STATUS_LABEL[project.status] ?? project.status}
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('projectsV2.public.progress')}</span>
              <span className="font-semibold">{project.progress_percent}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${project.progress_percent}%` }}
              />
            </div>
          </div>
          {project.start_date && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('projectsV2.startDate')}</span>
              <span>{formatDate(project.start_date, i18n.language)}</span>
            </div>
          )}
          {project.end_date && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('projectsV2.hub.endDate')}</span>
              <span>{formatDate(project.end_date, i18n.language)}</span>
            </div>
          )}
        </div>

        {/* Stages */}
        {stages.length > 0 && (
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">{t('projectsV2.public.stages')}</h2>
              <span className="text-xs text-muted-foreground">
                {t('projectsV2.public.stagesProgress', { done: doneCount, total: stages.length })}
              </span>
            </div>
            <ul className="space-y-2">
              {stages.map((stage, idx) => (
                <li key={idx} className="flex items-center gap-2.5 text-sm">
                  {stage.is_done ? (
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={cn(stage.is_done && 'line-through text-muted-foreground')}>
                    {stage.name}
                  </span>
                  {stage.due_date && (
                    <span className="ml-auto text-xs text-muted-foreground shrink-0">
                      {formatDate(stage.due_date, i18n.language)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer note: no prices shown (PR-13 scope) */}
        <p className="text-xs text-muted-foreground text-center">
          {t('projectsV2.public.noPricesNote')}
        </p>

        {/* Powered by */}
        <p className="text-xs text-center text-muted-foreground/60">
          Majster.AI
        </p>
      </div>
    </div>
  );
}
