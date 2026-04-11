/**
 * DossierPanel — PR-16
 *
 * Project dossier with category cards, file upload, signed URL preview,
 * delete, export (PDF summary), and share link generation.
 *
 * Categories: CONTRACT | PROTOCOL | RECEIPT | PHOTO | GUARANTEE | OTHER
 *
 * Security:
 *  - All files in private 'dossier' bucket (signed URLs, 1 h TTL)
 *  - RLS: user_id = auth.uid()
 *  - Share links: scoped to allowed_categories, 30-day TTL by default
 */

import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  FileText, FolderOpen, Receipt, Camera, Shield, MoreHorizontal,
  Upload, Trash2, Download, Share2, Loader2, Eye, Plus,
  Check, RefreshCw, BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  DOSSIER_CATEGORIES,
  type DossierCategory,
  type DossierItem,
  useDossierItems,
  useUploadDossierItem,
  useDeleteDossierItem,
  useExportDossierPdf,
  downloadDossierFile,
} from '@/hooks/useDossier';
import { DossierShareModal } from './DossierShareModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SkeletonList } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/formatters';

// ── Category metadata ─────────────────────────────────────────────────────────

const CATEGORY_ICON: Record<DossierCategory, React.ComponentType<{ className?: string }>> = {
  CONTRACT:  FileText,
  PROTOCOL:  FolderOpen,
  RECEIPT:   Receipt,
  PHOTO:     Camera,
  GUARANTEE: Shield,
  OTHER:     MoreHorizontal,
};

// Categorical badge colours for document types — each needs distinct visual identity
const CATEGORY_COLOR: Record<DossierCategory, string> = {
  CONTRACT:  'bg-info/10 text-info dark:bg-info/20',
  PROTOCOL:  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', // intentional categorical — no DS token
  RECEIPT:   'bg-warning/10 text-warning dark:bg-warning/20',
  PHOTO:     'bg-success/10 text-success dark:bg-success/20',
  GUARANTEE: 'bg-destructive/10 text-destructive dark:bg-destructive/20',
  OTHER:     'bg-muted text-muted-foreground',
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface DossierPanelProps {
  projectId: string;
  projectTitle: string;
}

// ── CategoryCard ──────────────────────────────────────────────────────────────

interface CategoryCardProps {
  category: DossierCategory;
  items: DossierItem[];
  onUpload: (category: DossierCategory, file: File) => void;
  onDelete: (item: DossierItem) => void;
  uploading: boolean;
}

function CategoryCard({ category, items, onUpload, onDelete, uploading }: CategoryCardProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(false);

  const Icon = CATEGORY_ICON[category];
  const colorCls = CATEGORY_COLOR[category];
  const count = items.length;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(category, file);
      e.target.value = '';
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      {/* Header */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded((prev) => !prev)}
        role="button"
        aria-expanded={expanded}
        aria-label={t('dossier.category.' + category)}
      >
        <div className={cn('p-2 rounded-md', colorCls)}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight">{t('dossier.category.' + category)}</p>
        </div>
        <Badge variant="secondary" className="text-xs shrink-0">
          {count}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          disabled={uploading}
          aria-label={t('dossier.uploadAriaLabel', { category: t('dossier.category.' + category) })}
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFileChange}
          aria-hidden="true"
        />
      </div>

      {/* File list */}
      {expanded && (
        <div className="border-t divide-y">
          {count === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-muted-foreground">{t('dossier.emptyCategory')}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 gap-1.5"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="w-3 h-3" />
                {t('dossier.uploadFirst')}
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <FileRow key={item.id} item={item} onDelete={onDelete} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── FileRow ───────────────────────────────────────────────────────────────────

interface FileRowProps {
  item: DossierItem;
  onDelete: (item: DossierItem) => void;
}

function FileRow({ item, onDelete }: FileRowProps) {
  const { t, i18n } = useTranslation();
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const sizeLabel = item.size_bytes
    ? item.size_bytes < 1024 * 1024
      ? `${Math.ceil(item.size_bytes / 1024)} KB`
      : `${(item.size_bytes / (1024 * 1024)).toFixed(1)} MB`
    : null;

  const dateLabel = formatDate(item.created_at, i18n.language);

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    setDeleting(true);
    await onDelete(item);
    setDeleting(false);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 hover:bg-muted/20 transition-colors group">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate" title={item.file_name}>
          {item.file_name}
        </p>
        <p className="text-xs text-muted-foreground">
          {[sizeLabel, dateLabel, item.source === 'MANUAL' ? null : item.source?.toLowerCase()].filter(Boolean).join(' · ')}
        </p>
      </div>

      {item.signed_url ? (
        <>
          <a
            href={item.signed_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px]"
            aria-label={t('dossier.openFile')}
            title={t('dossier.openFile')}
            onClick={(e) => e.stopPropagation()}
          >
            <Eye className="w-3.5 h-3.5" />
          </a>
          <button
            className="flex items-center justify-center p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px]"
            aria-label={t('dossier.downloadFile')}
            title={t('dossier.downloadFile')}
            disabled={downloading}
            onClick={async (e) => {
              e.stopPropagation();
              setDownloading(true);
              try {
                await downloadDossierFile(item.file_path, item.file_name);
              } catch {
                toast.error(t('dossier.downloadError'));
              } finally {
                setDownloading(false);
              }
            }}
          >
            {downloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
          </button>
        </>
      ) : (
        <span className="text-xs text-muted-foreground italic">
          {t('dossier.urlUnavailable', { defaultValue: 'URL niedostępny' })}
        </span>
      )}

      <button
        className={cn(
          'flex items-center justify-center gap-1 p-1.5 rounded transition-colors min-h-[44px]',
          confirmDelete ? 'px-2' : 'min-w-[44px]',
          confirmDelete
            ? 'bg-destructive/10 text-destructive dark:bg-destructive/20'
            : 'hover:bg-muted text-muted-foreground hover:text-destructive'
        )}
        onClick={handleDelete}
        disabled={deleting}
        aria-label={confirmDelete ? t('dossier.confirmDelete') : t('dossier.deleteFile')}
        title={confirmDelete ? t('dossier.confirmDelete') : t('dossier.deleteFile')}
      >
        {deleting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : confirmDelete ? (
          <>
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs font-medium whitespace-nowrap">
              {t('dossier.confirmDeleteShort')}
            </span>
          </>
        ) : (
          <Trash2 className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}

// ── DossierPanel ──────────────────────────────────────────────────────────────

export function DossierPanel({ projectId, projectTitle }: DossierPanelProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showShareModal, setShowShareModal] = useState(false);
  const [uploadingCategory, setUploadingCategory] = useState<DossierCategory | null>(null);

  const { data: items = [], isLoading, error, refetch } = useDossierItems(projectId);
  const uploadItem = useUploadDossierItem();
  const deleteItem = useDeleteDossierItem();
  const exportPdf = useExportDossierPdf();

  const hasStaleUrls = items.length > 0 && items.some((i) => !i.signed_url);

  const itemsByCategory = DOSSIER_CATEGORIES.reduce<Record<DossierCategory, DossierItem[]>>(
    (acc, cat) => {
      acc[cat] = items.filter((i) => i.category === cat);
      return acc;
    },
    {} as Record<DossierCategory, DossierItem[]>
  );

  const handleUpload = async (category: DossierCategory, file: File) => {
    setUploadingCategory(category);
    try {
      await uploadItem.mutateAsync({ projectId, category, file });
      toast.success(t('dossier.uploadSuccess'));
    } catch (_err) {
      toast.error(t('dossier.uploadError'));
    } finally {
      setUploadingCategory(null);
    }
  };

  const handleDelete = async (item: DossierItem) => {
    try {
      await deleteItem.mutateAsync({ item });
      toast.success(t('dossier.deleteSuccess'));
    } catch {
      toast.error(t('dossier.deleteError'));
    }
  };

  const handleExport = () => {
    if (items.length === 0) {
      toast.info(t('dossier.exportEmpty'));
      return;
    }
    exportPdf.mutate({ projectTitle, items });
  };

  if (isLoading) return <SkeletonList rows={4} />;
  if (error) {
    return (
      <div className="py-8 text-center space-y-3">
        <FolderOpen className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          {t('dossier.loadErrorSoft')}
        </p>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => refetch()}>
          <RefreshCw className="h-3.5 w-3.5" />
          {t('dossier.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">
            {t('dossier.totalFiles', { count: items.length })}
          </p>
          {hasStaleUrls && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 h-7 text-warning hover:text-warning/80 hover:bg-warning/10 dark:text-warning dark:hover:bg-warning/20"
              onClick={() => refetch()}
            >
              <RefreshCw className="w-3 h-3" />
              {t('dossier.refreshUrls', { defaultValue: 'Odśwież linki' })}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8"
            onClick={() => navigate(`/app/document-templates?projectId=${projectId}`)}
          >
            <BookOpen className="w-3.5 h-3.5" />
            {t('dossier.generateFromTemplate')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8"
            onClick={handleExport}
            disabled={exportPdf.isPending}
          >
            {exportPdf.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {t('dossier.exportPdf')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8"
            onClick={() => setShowShareModal(true)}
          >
            <Share2 className="w-3.5 h-3.5" />
            {t('dossier.shareLink')}
          </Button>
        </div>
      </div>

      {/* Category cards */}
      <div className="space-y-2">
        {DOSSIER_CATEGORIES.map((cat) => (
          <CategoryCard
            key={cat}
            category={cat}
            items={itemsByCategory[cat]}
            onUpload={handleUpload}
            onDelete={handleDelete}
            uploading={uploadingCategory === cat}
          />
        ))}
      </div>

      {/* Share modal */}
      {showShareModal && (
        <DossierShareModal
          projectId={projectId}
          projectTitle={projectTitle}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
