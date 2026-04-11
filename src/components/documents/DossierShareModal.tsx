/**
 * DossierShareModal — PR-16
 *
 * Modal for generating secure share links for the project dossier.
 * - Select categories to share (checkbox list)
 * - Generate link (UUID token, 30-day default expiry)
 * - Copy link / native share
 * - View existing tokens with expiry info
 * - Revoke token
 *
 * Security: token-scoped, expiry enforced server-side via resolve_dossier_share_token()
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, Link2, Copy, Check, Trash2, Loader2, Share2, Clock,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  DOSSIER_CATEGORIES,
  type DossierCategory,
  type DossierShareToken,
  useDossierShareTokens,
  useCreateDossierToken,
  useDeleteDossierToken,
  buildDossierShareUrl,
  daysUntilTokenExpiry,
} from '@/hooks/useDossier';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ── Props ─────────────────────────────────────────────────────────────────────

interface DossierShareModalProps {
  projectId: string;
  projectTitle: string;
  onClose: () => void;
}

// ── TokenRow ──────────────────────────────────────────────────────────────────

interface TokenRowProps {
  token: DossierShareToken;
  onRevoke: (token: DossierShareToken) => void;
}

function TokenRow({ token, onRevoke }: TokenRowProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  const url = buildDossierShareUrl(token.token);
  const days = daysUntilTokenExpiry(token.expires_at);
  const isExpired = days === 0;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(t('dossier.share.linkCopied'));
  };

  const handleRevoke = async () => {
    if (!confirmRevoke) {
      setConfirmRevoke(true);
      setTimeout(() => setConfirmRevoke(false), 3000);
      return;
    }
    setRevoking(true);
    await onRevoke(token);
    setRevoking(false);
  };

  return (
    <div className={cn(
      'border rounded-lg p-3 space-y-2',
      isExpired && 'opacity-60'
    )}>
      {/* Categories */}
      <div className="flex flex-wrap gap-1">
        {token.allowed_categories.map((cat) => (
          <Badge key={cat} variant="secondary" className="text-xs">
            {t('dossier.category.' + cat)}
          </Badge>
        ))}
        {token.label && (
          <span className="text-xs text-muted-foreground ml-1">{token.label}</span>
        )}
      </div>

      {/* URL row */}
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs bg-muted rounded px-2 py-1 truncate font-mono">
          {url}
        </code>
        <button
          className="flex items-center justify-center p-1.5 rounded hover:bg-muted transition-colors min-h-[44px] min-w-[44px]"
          onClick={handleCopy}
          aria-label={t('dossier.share.copyLink')}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
        <button
          className={cn(
            'flex items-center justify-center p-1.5 rounded transition-colors min-h-[44px] min-w-[44px]',
            confirmRevoke
              ? 'bg-destructive/10 text-destructive dark:bg-destructive/20'
              : 'hover:bg-muted text-muted-foreground hover:text-destructive'
          )}
          onClick={handleRevoke}
          disabled={revoking}
          aria-label={confirmRevoke ? t('dossier.share.confirmRevoke') : t('dossier.share.revokeLink')}
        >
          {revoking ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : confirmRevoke ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Expiry */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="w-3 h-3" />
        {isExpired
          ? t('dossier.share.expired')
          : t('dossier.share.expiresIn', { days })}
      </div>
    </div>
  );
}

// ── DossierShareModal ─────────────────────────────────────────────────────────

export function DossierShareModal({ projectId, projectTitle, onClose }: DossierShareModalProps) {
  const { t } = useTranslation();
  const [selectedCats, setSelectedCats] = useState<Set<DossierCategory>>(
    new Set(DOSSIER_CATEGORIES)
  );
  const [label, setLabel] = useState('');
  const [newTokenUrl, setNewTokenUrl] = useState<string | null>(null);
  const [newTokenCopied, setNewTokenCopied] = useState(false);

  const { data: tokens = [], isLoading: tokensLoading } = useDossierShareTokens(projectId);
  const createToken = useCreateDossierToken();
  const deleteToken = useDeleteDossierToken();

  const toggleCat = (cat: DossierCategory) => {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const handleGenerate = async () => {
    if (selectedCats.size === 0) {
      toast.warning(t('dossier.share.noCategorySelected'));
      return;
    }
    try {
      const token = await createToken.mutateAsync({
        project_id: projectId,
        allowed_categories: [...selectedCats],
        label: label.trim() || undefined,
        expires_days: 30,
      });
      const url = buildDossierShareUrl(token.token);
      setNewTokenUrl(url);
      toast.success(t('dossier.share.linkGenerated'));
    } catch {
      toast.error(t('dossier.share.generateError'));
    }
  };

  const handleCopyNew = async () => {
    if (!newTokenUrl) return;
    await navigator.clipboard.writeText(newTokenUrl);
    setNewTokenCopied(true);
    setTimeout(() => setNewTokenCopied(false), 2000);
    toast.success(t('dossier.share.linkCopied'));
  };

  const handleNativeShare = async () => {
    if (!newTokenUrl) return;
    try {
      await navigator.share({ title: `Teczka: ${projectTitle}`, url: newTokenUrl });
    } catch {
      // User cancelled or not supported — fallback to copy
      handleCopyNew();
    }
  };

  const handleRevoke = async (token: DossierShareToken) => {
    try {
      await deleteToken.mutateAsync({ token });
      toast.success(t('dossier.share.linkRevoked'));
    } catch {
      toast.error(t('dossier.share.revokeError'));
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-background w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <h2 className="font-semibold text-base">{t('dossier.share.title')}</h2>
            <p className="text-xs text-muted-foreground truncate max-w-[250px]">{projectTitle}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-11 w-11 min-h-[44px] min-w-[44px]" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-5">
          {/* New token form */}
          <div className="space-y-3">
            <p className="text-sm font-medium">{t('dossier.share.selectCategories')}</p>
            <div className="grid grid-cols-2 gap-2">
              {DOSSIER_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors text-left',
                    selectedCats.has(cat)
                      ? 'border-primary bg-primary/5 text-primary dark:bg-primary/10'
                      : 'border-border hover:bg-muted/50'
                  )}
                  onClick={() => toggleCat(cat)}
                  aria-pressed={selectedCats.has(cat)}
                >
                  <div className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                    selectedCats.has(cat)
                      ? 'bg-primary border-primary'
                      : 'border-gray-300 dark:border-gray-600'
                  )}>
                    {selectedCats.has(cat) && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span className="truncate">{t('dossier.category.' + cat)}</span>
                </button>
              ))}
            </div>

            {/* Optional label */}
            <div>
              <label className="text-xs text-muted-foreground" htmlFor="dossier-share-label">
                {t('dossier.share.labelPlaceholder')}
              </label>
              <input
                id="dossier-share-label"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={t('dossier.share.labelExample')}
                className="mt-1 w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={80}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              {t('dossier.share.expiryNote')}
            </p>

            <Button
              className="w-full gap-2"
              onClick={handleGenerate}
              disabled={createToken.isPending || selectedCats.size === 0}
            >
              {createToken.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Link2 className="w-4 h-4" />
              )}
              {t('dossier.share.generate')}
            </Button>

            {/* New token result */}
            {newTokenUrl && (
              <div className="border border-success/30 bg-success/5 dark:border-success/40 dark:bg-success/10 rounded-lg p-3 space-y-2">
                <p className="text-xs font-medium text-success">
                  {t('dossier.share.linkReady')}
                </p>
                <code className="block text-xs bg-white dark:bg-black/20 rounded px-2 py-1.5 font-mono break-all">
                  {newTokenUrl}
                </code>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1.5"
                    onClick={handleCopyNew}
                  >
                    {newTokenCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {t('dossier.share.copyLink')}
                  </Button>
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1.5"
                      onClick={handleNativeShare}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      {t('dossier.share.shareNative')}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Existing tokens */}
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('dossier.share.existingLinks')}</p>
            {tokensLoading ? (
              <p className="text-xs text-muted-foreground">{t('dossier.share.loadingLinks')}</p>
            ) : tokens.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t('dossier.share.noLinks')}</p>
            ) : (
              <div className="space-y-2">
                {tokens.map((tok) => (
                  <TokenRow key={tok.id} token={tok} onRevoke={handleRevoke} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
