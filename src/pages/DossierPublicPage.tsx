/**
 * DossierPublicPage — PR-16
 *
 * Public share page for project dossier. No login required.
 * Route: /d/:token
 *
 * Security:
 *  - Token resolved via SECURITY DEFINER function (resolve_dossier_share_token)
 *  - Returns ONLY: project title + items in allowed_categories (NO prices/costs)
 *  - Signed URLs generated client-side (1 h TTL) after token validation
 *  - Expired/invalid tokens: generic error (no info leakage)
 *  - IDOR: token → project scoped (server-side FK)
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FolderOpen, FileText, Clock, CheckCircle2, AlertCircle,
  Loader2, Download, ExternalLink,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/formatters';
import { DOSSIER_BUCKET, downloadDossierFile, type DossierCategory } from '@/hooks/useDossier';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PublicDossierItem {
  id: string;
  category: DossierCategory;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
  signed_url?: string;
}

interface PublicDossierData {
  project_title: string;
  project_status: string;
  allowed_categories: DossierCategory[];
  expires_at: string;
  items: PublicDossierItem[];
}

type LoadState =
  | { state: 'loading' }
  | { state: 'error'; code: 'not_found' | 'expired' | 'server_error' }
  | { state: 'ok'; dossier: PublicDossierData };

// ── Category labels (hardcoded for public page — no i18n key access issues) ──

const CATEGORY_LABELS: Record<string, string> = {
  CONTRACT:  'Umowy',
  PROTOCOL:  'Protokoły',
  RECEIPT:   'Rachunki',
  PHOTO:     'Fotoprotokół',
  GUARANTEE: 'Gwarancje',
  OTHER:     'Inne',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(DOSSIER_BUCKET)
    .createSignedUrl(filePath, 3600);
  if (error || !data?.signedUrl) return '';
  return data.signedUrl;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── PublicFileActions ─────────────────────────────────────────────────────────

function PublicFileActions({
  signedUrl,
  fileName,
  isImage,
}: {
  signedUrl: string;
  fileName: string;
  isImage: boolean;
}) {
  const { t } = useTranslation();
  const [downloading, setDownloading] = useState(false);

  const btnCls = cn(
    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
    'bg-blue-50 text-blue-700 hover:bg-blue-100',
    'dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50',
    'transition-colors shrink-0',
  );

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {/* Preview — opens in new tab */}
      <a
        href={signedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={btnCls}
        aria-label={t('dossier.public.openFile', { name: fileName })}
      >
        <ExternalLink className="w-3 h-3" />
        {t('dossier.public.open')}
      </a>

      {/* Download — saves to device */}
      {!isImage && (
        <button
          className={cn(btnCls, 'border-0 cursor-pointer')}
          disabled={downloading}
          aria-label={t('dossier.public.downloadFile', { name: fileName })}
          onClick={async () => {
            setDownloading(true);
            try {
              await downloadDossierFile(signedUrl, fileName);
            } catch {
              // silent on public page — no toast system
            } finally {
              setDownloading(false);
            }
          }}
        >
          {downloading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Download className="w-3 h-3" />
          )}
          {t('dossier.public.download')}
        </button>
      )}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DossierPublicPage() {
  const { token } = useParams<{ token: string }>();
  const { t, i18n } = useTranslation();
  const [load, setLoad] = useState<LoadState>({ state: 'loading' });

  useEffect(() => {
    if (!token) {
      setLoad({ state: 'error', code: 'not_found' });
      return;
    }

    (async () => {
      try {
        const { data, error } = await supabase.rpc('resolve_dossier_share_token', {
          p_token: token,
        });

        if (error) {
          setLoad({ state: 'error', code: 'server_error' });
          return;
        }

        const result = data as { error?: string } & PublicDossierData;

        if (result?.error === 'not_found') {
          setLoad({ state: 'error', code: 'not_found' });
          return;
        }
        if (result?.error === 'expired') {
          setLoad({ state: 'error', code: 'expired' });
          return;
        }

        // Fetch signed URLs for all items in parallel
        const itemsWithUrls = await Promise.all(
          (result.items ?? []).map(async (item) => ({
            ...item,
            signed_url: await fetchSignedUrl(item.file_path),
          }))
        );

        setLoad({
          state: 'ok',
          dossier: { ...result, items: itemsWithUrls },
        });
      } catch {
        setLoad({ state: 'error', code: 'server_error' });
      }
    })();
  }, [token]);

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (load.state === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
          <p className="text-sm text-muted-foreground">{t('dossier.public.loading')}</p>
        </div>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (load.state === 'error') {
    const isExpired = load.code === 'expired';
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">
              {isExpired ? t('dossier.public.expiredTitle') : t('dossier.public.notFoundTitle')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isExpired ? t('dossier.public.expiredDesc') : t('dossier.public.notFoundDesc')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── OK ──────────────────────────────────────────────────────────────────────
  const { dossier } = load;
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(dossier.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  const itemsByCategory = dossier.allowed_categories.reduce<
    Record<DossierCategory, PublicDossierItem[]>
  >((acc, cat) => {
    acc[cat] = dossier.items.filter((i) => i.category === cat);
    return acc;
  }, {} as Record<DossierCategory, PublicDossierItem[]>);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30 shrink-0">
              <FolderOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                {t('dossier.public.heading')}
              </p>
              <h1 className="text-xl font-bold mt-0.5 leading-tight">
                {dossier.project_title}
              </h1>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>
                  {t('dossier.public.expiresIn', { days: daysLeft })}
                </span>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                <span className="text-green-600 dark:text-green-500">{t('dossier.public.secure')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {dossier.items.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground">{t('dossier.public.noFiles')}</p>
          </div>
        ) : (
          dossier.allowed_categories.map((cat) => {
            const catItems = itemsByCategory[cat] ?? [];
            if (catItems.length === 0) return null;

            return (
              <div key={cat} className="bg-white dark:bg-gray-900 rounded-xl border shadow-sm overflow-hidden">
                {/* Category header */}
                <div className="px-4 py-3 border-b bg-gray-50 dark:bg-gray-800/50">
                  <h2 className="text-sm font-semibold">
                    {CATEGORY_LABELS[cat] ?? cat}
                  </h2>
                  <p className="text-xs text-muted-foreground">{catItems.length} {t('dossier.public.files')}</p>
                </div>

                {/* Files */}
                <div className="divide-y">
                  {catItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-800 shrink-0">
                        <FileText className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {[
                            formatBytes(item.size_bytes),
                            formatDate(item.created_at, i18n.language),
                          ].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      {item.signed_url ? (
                        <PublicFileActions
                          signedUrl={item.signed_url}
                          fileName={item.file_name}
                          isImage={!!item.mime_type?.startsWith('image/')}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {t('dossier.public.linkUnavailable')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-xs text-muted-foreground">
          {t('dossier.public.poweredBy')}
        </p>
      </div>
    </div>
  );
}
