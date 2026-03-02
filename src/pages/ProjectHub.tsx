/**
 * ProjectHub — PR-13 + PR-15 + PR-16
 *
 * Project detail "hub" screen with accordion sections.
 * Sections: Stages | Costs | Documents (Dossier) | Photo Report | Acceptance Checklist
 * PR-15: Photo Report (BEFORE/DURING/AFTER/ISSUE) + Checklist + Signature.
 * PR-16: Dossier — document folder with categories, upload, export, share link.
 * Works with FF_NEW_SHELL ON/OFF.
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  ArrowLeft, Phone, ChevronDown, ChevronUp, QrCode,
  Copy, Check, Loader2, Plus, Trash2, RefreshCw,
} from 'lucide-react';

import {
  useProjectV2,
  useUpdateProjectV2,
  useProjectPublicToken,
  useCreateProjectPublicToken,
  buildProjectStatusUrl,
  daysUntilTokenExpiry,
  type ProjectStage,
} from '@/hooks/useProjectsV2';
import { BurnBarSection } from '@/components/costs/BurnBarSection';
import { PhotoReportPanel } from '@/components/photos/PhotoReportPanel';
import { AcceptanceChecklistPanel } from '@/components/photos/AcceptanceChecklistPanel';
import { DossierPanel } from '@/components/documents/DossierPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { SkeletonList } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

type SectionId = 'stages' | 'costs' | 'documents' | 'photoReport' | 'checklist';

interface AccordionSection {
  id: SectionId;
  titleKey: string;
}

const SECTIONS: AccordionSection[] = [
  { id: 'stages',      titleKey: 'projectsV2.hub.sectionStages' },
  { id: 'costs',       titleKey: 'projectsV2.hub.sectionCosts' },
  { id: 'documents',   titleKey: 'projectsV2.hub.sectionDocuments' },
  { id: 'photoReport', titleKey: 'projectsV2.hub.sectionPhotoReport' },
  { id: 'checklist',   titleKey: 'projectsV2.hub.sectionChecklist' },
];

const STATUS_BADGE: Record<string, string> = {
  ACTIVE:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  ON_HOLD:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const STATUS_I18N: Record<string, string> = {
  ACTIVE:    'projectsV2.statusActive',
  COMPLETED: 'projectsV2.statusCompleted',
  ON_HOLD:   'projectsV2.statusOnHold',
};

// ── StagesPanel ───────────────────────────────────────────────────────────────

interface StagesPanelProps {
  stages: ProjectStage[];
  progress: number;
  projectId: string;
}

function StagesPanel({ stages, progress, projectId }: StagesPanelProps) {
  const { t } = useTranslation();
  const updateProject = useUpdateProjectV2();
  const [localProgress, setLocalProgress] = useState(progress);
  const [newStageName, setNewStageName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleProgressSave = async () => {
    setSaving(true);
    try {
      await updateProject.mutateAsync({ id: projectId, progress_percent: localProgress });
      toast.success(t('projectsV2.hub.progressSaved'));
    } catch {
      toast.error(t('projectsV2.hub.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStage = async (idx: number) => {
    const updated = stages.map((s, i) => i === idx ? { ...s, is_done: !s.is_done } : s);
    const donePct = Math.round((updated.filter(s => s.is_done).length / updated.length) * 100);
    try {
      await updateProject.mutateAsync({
        id: projectId,
        stages_json: updated,
        progress_percent: updated.length > 0 ? donePct : localProgress,
      });
      if (updated.length > 0) setLocalProgress(donePct);
    } catch {
      toast.error(t('projectsV2.hub.saveError'));
    }
  };

  const handleAddStage = async () => {
    const name = newStageName.trim();
    if (!name) return;
    const updated: ProjectStage[] = [
      ...stages,
      { name, due_date: null, is_done: false, sort_order: stages.length },
    ];
    try {
      await updateProject.mutateAsync({ id: projectId, stages_json: updated });
      setNewStageName('');
    } catch {
      toast.error(t('projectsV2.hub.saveError'));
    }
  };

  const handleRemoveStage = async (idx: number) => {
    const updated = stages.filter((_, i) => i !== idx).map((s, i) => ({ ...s, sort_order: i }));
    try {
      await updateProject.mutateAsync({ id: projectId, stages_json: updated });
    } catch {
      toast.error(t('projectsV2.hub.saveError'));
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('projectsV2.hub.progress')}</span>
          <span className="font-semibold">{localProgress}%</span>
        </div>
        <Slider
          value={[localProgress]}
          onValueChange={([v]) => setLocalProgress(v)}
          onValueCommit={handleProgressSave}
          min={0} max={100} step={5}
          aria-label={t('projectsV2.hub.progressAriaLabel')}
        />
        {localProgress !== progress && (
          <Button size="sm" variant="outline" onClick={handleProgressSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {t('projectsV2.hub.saveProgress')}
          </Button>
        )}
      </div>

      {/* Stages list */}
      {stages.length > 0 && (
        <ul className="space-y-1">
          {stages.map((stage, idx) => (
            <li
              key={idx}
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <button
                className={cn(
                  'h-4 w-4 shrink-0 rounded border-2 transition-colors',
                  stage.is_done
                    ? 'border-green-500 bg-green-500'
                    : 'border-muted-foreground'
                )}
                onClick={() => handleToggleStage(idx)}
                aria-label={stage.is_done ? t('projectsV2.hub.undoStage') : t('projectsV2.hub.doneStage')}
              />
              <span className={cn('flex-1', stage.is_done && 'line-through text-muted-foreground')}>
                {stage.name}
              </span>
              {stage.due_date && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(stage.due_date).toLocaleDateString('pl-PL')}
                </span>
              )}
              <button
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                onClick={() => handleRemoveStage(idx)}
                aria-label={t('projectsV2.hub.removeStage')}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add stage */}
      <div className="flex gap-2">
        <Input
          value={newStageName}
          onChange={(e) => setNewStageName(e.target.value)}
          placeholder={t('projectsV2.hub.stagePlaceholder')}
          onKeyDown={(e) => e.key === 'Enter' && handleAddStage()}
          className="flex-1 h-9 text-sm"
        />
        <Button size="sm" variant="outline" onClick={handleAddStage} disabled={!newStageName.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ── QrTokenPanel ──────────────────────────────────────────────────────────────

function QrTokenPanel({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const { data: token, isLoading } = useProjectPublicToken(projectId);
  const createToken = useCreateProjectPublicToken(projectId);
  const [copied, setCopied] = useState(false);

  const days = token ? daysUntilTokenExpiry(token.expires_at) : 0;
  const isExpired = days <= 0;
  const url = token ? buildProjectStatusUrl(token.token) : null;

  const handleCopy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(t('projectsV2.hub.qrLinkCopied'));
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCreate = async () => {
    try {
      await createToken.mutateAsync();
      toast.success(t('projectsV2.hub.qrLinkCreated'));
    } catch {
      toast.error(t('projectsV2.hub.qrLinkError'));
    }
  };

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <QrCode className="h-4 w-4 text-muted-foreground shrink-0" />
        <p className="text-sm font-medium">{t('projectsV2.hub.qrTitle')}</p>
      </div>

      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : token && !isExpired && url ? (
        <div className="space-y-2">
          <Badge variant="outline" className="text-xs">
            {t('projectsV2.hub.qrExpiresIn', { days })}
          </Badge>
          <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2">
            <span className="flex-1 text-xs text-muted-foreground truncate font-mono">{url}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCopy}>
              {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              {copied ? t('projectsV2.hub.qrLinkCopied') : t('projectsV2.hub.qrCopy')}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCreate} disabled={createToken.isPending} className="gap-1.5">
              <RefreshCw className={cn('h-4 w-4', createToken.isPending && 'animate-spin')} />
              {t('projectsV2.hub.qrRefresh')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {token && isExpired && (
            <Badge variant="destructive" className="text-xs">{t('projectsV2.hub.qrExpired')}</Badge>
          )}
          <p className="text-xs text-muted-foreground">{t('projectsV2.hub.qrHint')}</p>
          <Button size="sm" onClick={handleCreate} disabled={createToken.isPending} className="gap-2">
            {createToken.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
            {createToken.isPending ? t('projectsV2.hub.qrCreating') : t('projectsV2.hub.qrCreate')}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── ProjectHub ────────────────────────────────────────────────────────────────

export default function ProjectHub() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState<SectionId>('stages');

  const { data: project, isLoading, isError, refetch } = useProjectV2(id);

  if (isLoading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <SkeletonList rows={5} />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <ErrorState
          title={t('projectsV2.hub.loadError')}
          description={t('projectsV2.hub.loadErrorDesc')}
          retryLabel={t('projectsV2.errorRetry')}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const toggleSection = (section: SectionId) => {
    setOpenSection(prev => prev === section ? 'stages' : section);
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Back button */}
      <button
        className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors"
        onClick={() => navigate('/app/projects')}
      >
        <ArrowLeft className="h-4 w-4" />
        {t('projectsV2.hub.back')}
      </button>

      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{project.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge className={cn('text-[11px] font-semibold px-2 py-0.5', STATUS_BADGE[project.status])}>
              {t(STATUS_I18N[project.status] ?? 'projectsV2.statusActive')}
            </Badge>
            {project.start_date && (
              <span className="text-xs text-muted-foreground">
                {t('projectsV2.startDate')}: {new Date(project.start_date).toLocaleDateString('pl-PL')}
              </span>
            )}
            {project.end_date && (
              <span className="text-xs text-muted-foreground">
                {t('projectsV2.hub.endDate')}: {new Date(project.end_date).toLocaleDateString('pl-PL')}
              </span>
            )}
          </div>
        </div>
        {/* Placeholder for client phone — PR-13 scope */}
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground" aria-label={t('projectsV2.hub.callClient')} disabled>
          <Phone className="h-4 w-4" />
        </Button>
      </div>

      {/* QR Status Link panel */}
      <div className="mb-4">
        <QrTokenPanel projectId={project.id} />
      </div>

      {/* Accordion sections */}
      <div className="space-y-2">
        {SECTIONS.map((section) => {
          const isOpen = openSection === section.id;
          return (
            <div key={section.id} className="rounded-lg border bg-card overflow-hidden">
              <button
                className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium hover:bg-accent/30 transition-colors"
                onClick={() => toggleSection(section.id)}
                aria-expanded={isOpen}
              >
                <span>{t(section.titleKey)}</span>
                {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-2 border-t">
                  {section.id === 'stages' && (
                    <StagesPanel
                      stages={project.stages_json}
                      progress={project.progress_percent}
                      projectId={project.id}
                    />
                  )}
                  {section.id === 'costs' && (
                    <BurnBarSection project={project} />
                  )}
                  {section.id === 'documents' && (
                    <DossierPanel
                      projectId={project.id}
                      projectTitle={project.title}
                    />
                  )}
                  {section.id === 'photoReport' && (
                    <PhotoReportPanel projectId={project.id} />
                  )}
                  {section.id === 'checklist' && (
                    <AcceptanceChecklistPanel projectId={project.id} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
