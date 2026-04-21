import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Save, Globe, Eye, GitCompare, AlertTriangle, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import type { LegalDocument } from '@/types/legal';
import { LegalDocumentDiff } from './LegalDocumentDiff';
import { useSaveLegalDraft, usePublishLegalDocument, useAdminLegalDocuments } from '@/hooks/useLegalCms';

const schema = z.object({
  title:        z.string().min(1, 'Tytuł jest wymagany'),
  version:      z.string().min(1, 'Wersja jest wymagana'),
  language:     z.string().min(2, 'Język jest wymagany'),
  content:      z.string().min(1, 'Treść jest wymagana'),
  effective_at: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface LegalDocumentEditorProps {
  document: LegalDocument;
  onClose: () => void;
}

export function LegalDocumentEditor({ document: doc, onClose }: LegalDocumentEditorProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'diff'>('edit');
  const save    = useSaveLegalDraft();
  const publish = usePublishLegalDocument();
  const { data: allDocs } = useAdminLegalDocuments();

  const isReadonly = doc.status === 'published' || doc.status === 'archived';

  const publishedVersion: LegalDocument | null =
    allDocs?.find(
      (d) => d.slug === doc.slug && d.language === doc.language && d.status === 'published'
    ) ?? null;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title:        doc.title,
      version:      doc.version,
      language:     doc.language,
      content:      doc.content,
      effective_at: doc.effective_at ?? '',
    },
  });

  // Reset form when document changes (different doc selected)
  useEffect(() => {
    reset({
      title:        doc.title,
      version:      doc.version,
      language:     doc.language,
      content:      doc.content,
      effective_at: doc.effective_at ?? '',
    });
    setActiveTab('edit');
  }, [doc.id, reset]);

  const previewContent = watch('content');

  async function onSave(values: FormValues) {
    try {
      await save.mutateAsync({
        id: doc.id,
        input: {
          slug:         doc.slug,
          language:     values.language,
          version:      values.version,
          title:        values.title,
          content:      values.content,
          effective_at: values.effective_at || null,
        },
      });
      toast.success('Szkic zapisany.');
    } catch (e) {
      toast.error(`Błąd zapisu: ${(e as Error).message}`);
    }
  }

  async function onPublish() {
    try {
      await publish.mutateAsync(doc.id);
      toast.success('Dokument opublikowany.');
      onClose();
    } catch (e) {
      toast.error(`Błąd publikacji: ${(e as Error).message}`);
    }
  }

  const statusColors: Record<string, string> = {
    draft:     'secondary',
    published: 'default',
    archived:  'outline',
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold truncate max-w-sm">{doc.title}</h2>
            <Badge variant={statusColors[doc.status] as 'secondary' | 'default' | 'outline'}>
              {doc.status === 'draft' ? 'Szkic' : doc.status === 'published' ? 'Opublikowany' : 'Archiwalny'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            {doc.slug} · {doc.language.toUpperCase()} · v{doc.version}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Separator />

      {/* Readonly notice */}
      {isReadonly && (
        <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Dokument {doc.status === 'published' ? 'opublikowany' : 'archiwalny'} jest tylko do odczytu.
            Aby edytować, utwórz nowy szkic.
          </span>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="edit" className="gap-1.5">
            <Save className="h-3.5 w-3.5" />
            Edycja
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            Podgląd
          </TabsTrigger>
          <TabsTrigger value="diff" className="gap-1.5">
            <GitCompare className="h-3.5 w-3.5" />
            Diff
          </TabsTrigger>
        </TabsList>

        {/* ── Edit ── */}
        <TabsContent value="edit" className="flex-1 mt-4">
          <form onSubmit={handleSubmit(onSave)} className="flex flex-col gap-4 h-full">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="title">Tytuł</Label>
                <Input
                  id="title"
                  disabled={isReadonly}
                  {...register('title')}
                  placeholder="np. Polityka prywatności"
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="version">Wersja</Label>
                <Input
                  id="version"
                  disabled={isReadonly}
                  {...register('version')}
                  placeholder="np. 1.1"
                />
                {errors.version && (
                  <p className="text-xs text-destructive">{errors.version.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="language">Język</Label>
                <Input
                  id="language"
                  disabled={isReadonly}
                  {...register('language')}
                  placeholder="pl"
                  maxLength={5}
                />
                {errors.language && (
                  <p className="text-xs text-destructive">{errors.language.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="effective_at">Data wejścia w życie (opcjonalna)</Label>
                <Input
                  id="effective_at"
                  type="date"
                  disabled={isReadonly}
                  {...register('effective_at')}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="content">Treść dokumentu</Label>
              <textarea
                id="content"
                disabled={isReadonly}
                {...register('content')}
                className="flex-1 min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                placeholder="Wpisz treść dokumentu prawnego…"
              />
              {errors.content && (
                <p className="text-xs text-destructive">{errors.content.message}</p>
              )}
            </div>

            {/* Action buttons */}
            {!isReadonly && (
              <div className="flex items-center justify-between gap-3 pt-1">
                <Button
                  type="submit"
                  variant="outline"
                  disabled={save.isPending || !isDirty}
                  className="gap-2"
                >
                  {save.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Zapisz szkic
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      disabled={publish.isPending || isDirty}
                      className="gap-2"
                    >
                      {publish.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Globe className="h-4 w-4" />
                      )}
                      Opublikuj
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Opublikować dokument?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Szkic <strong>{doc.title}</strong> (v{doc.version}) zostanie opublikowany.
                        {publishedVersion && (
                          <> Aktualna wersja <strong>v{publishedVersion.version}</strong> zostanie zarchiwizowana.</>
                        )}
                        {' '}Tej operacji nie można cofnąć przez ten panel.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Anuluj</AlertDialogCancel>
                      <AlertDialogAction onClick={onPublish}>Publikuj</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {isDirty && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 ml-auto">
                    Niezapisane zmiany — zapisz przed publikacją.
                  </p>
                )}
              </div>
            )}
          </form>
        </TabsContent>

        {/* ── Preview ── */}
        <TabsContent value="preview" className="mt-4">
          <div className="rounded-md border bg-background p-6 max-h-[60vh] overflow-auto">
            <h3 className="text-lg font-semibold mb-4">{watch('title') || doc.title}</h3>
            <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed text-foreground">
              {previewContent || doc.content}
            </pre>
          </div>
        </TabsContent>

        {/* ── Diff ── */}
        <TabsContent value="diff" className="mt-4">
          <LegalDocumentDiff
            published={publishedVersion}
            draft={{ ...doc, content: previewContent || doc.content }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
