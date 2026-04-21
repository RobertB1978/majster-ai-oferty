import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ShieldOff, FileText } from 'lucide-react';
import { useAdminRole } from '@/hooks/useAdminRole';
import { LegalDocumentList } from '@/components/admin/legal/LegalDocumentList';
import { LegalDocumentEditor } from '@/components/admin/legal/LegalDocumentEditor';
import { useSaveLegalDraft, useAdminLegalDocuments } from '@/hooks/useLegalCms';
import type { LegalDocument, LegalDocumentSlug } from '@/types/legal';
import { toast } from 'sonner';

export default function AdminLegalDocumentsPage() {
  const { isAdmin, isLoading } = useAdminRole();
  const [selectedDoc, setSelectedDoc] = useState<LegalDocument | null>(null);
  const saveDraft = useSaveLegalDraft();
  const { data: allDocs, refetch } = useAdminLegalDocuments();

  if (isLoading) return null;

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
        <ShieldOff className="h-10 w-10 opacity-40" />
        <p>Brak uprawnień do zarządzania dokumentami prawnymi.</p>
      </div>
    );
  }

  async function handleNewDraft(slug: LegalDocumentSlug, language: string) {
    try {
      const created = await saveDraft.mutateAsync({
        input: {
          slug,
          language,
          version: '1.0',
          title: slug.toUpperCase(),
          content: '',
          effective_at: null,
        },
      });
      await refetch();
      const fresh = allDocs?.find((d) => d.id === created.id) ?? created;
      setSelectedDoc(fresh);
      toast.success('Pusty szkic utworzony. Uzupełnij treść i zapisz.');
    } catch (e) {
      toast.error(`Błąd tworzenia szkicu: ${(e as Error).message}`);
    }
  }

  function handleSelect(doc: LegalDocument) {
    setSelectedDoc(doc);
  }

  function handleClose() {
    setSelectedDoc(null);
  }

  return (
    <>
      <Helmet>
        <title>Dokumenty prawne | Admin | Majster.AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="container max-w-7xl py-6 flex flex-col gap-6">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-xl font-semibold">Dokumenty prawne — CMS</h1>
            <p className="text-sm text-muted-foreground">
              Zarządzaj szkicami i publikuj dokumenty bez deploya ani edycji plików JSON.
            </p>
          </div>
        </div>

        {/* Two-column layout: list + editor */}
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
          {/* Left: document list */}
          <div className="sticky top-4">
            <LegalDocumentList
              onSelect={handleSelect}
              onNewDraft={handleNewDraft}
              selectedId={selectedDoc?.id}
            />
          </div>

          {/* Right: editor panel */}
          <div className="border rounded-lg p-5 min-h-[500px]">
            {selectedDoc ? (
              <LegalDocumentEditor
                document={selectedDoc}
                onClose={handleClose}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
                <FileText className="h-10 w-10 opacity-30" />
                <p className="text-sm">Wybierz dokument z listy lub utwórz nowy szkic.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
