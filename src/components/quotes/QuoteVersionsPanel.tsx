import { useState } from 'react';
import { useQuoteVersions, useCreateQuoteVersion, useSetActiveVersion, useDeleteQuoteVersion, QuoteSnapshot } from '@/hooks/useQuoteVersions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { History, Plus, Check, Eye, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface QuoteVersionsPanelProps {
  projectId: string;
  currentSnapshot: QuoteSnapshot;
  onLoadVersion?: (snapshot: QuoteSnapshot) => void;
}

export function QuoteVersionsPanel({ projectId, currentSnapshot, onLoadVersion }: QuoteVersionsPanelProps) {
  const { data: versions, isLoading } = useQuoteVersions(projectId);
  const createVersion = useCreateQuoteVersion();
  const setActive = useSetActiveVersion();
  const deleteVersion = useDeleteQuoteVersion();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewSnapshot, setPreviewSnapshot] = useState<QuoteSnapshot | null>(null);
  const [versionName, setVersionName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleSaveVersion = async () => {
    if (!versionName.trim()) {
      toast.error('Podaj nazwę wersji');
      return;
    }

    await createVersion.mutateAsync({
      projectId,
      versionName: versionName.trim(),
      snapshot: currentSnapshot,
      setActive: true,
    });

    setShowSaveDialog(false);
    setVersionName('');
  };

  const handleSetActive = async (versionId: string) => {
    await setActive.mutateAsync({ projectId, versionId });
  };

  const handlePreview = (snapshot: QuoteSnapshot) => {
    setPreviewSnapshot(snapshot);
    setShowPreviewDialog(true);
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      await deleteVersion.mutateAsync({ projectId, versionId: deleteConfirmId });
      setDeleteConfirmId(null);
    }
  };

  const handleLoadVersion = (snapshot: QuoteSnapshot) => {
    if (onLoadVersion) {
      onLoadVersion(snapshot);
      setShowPreviewDialog(false);
      toast.success('Wersja załadowana do edytora');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Wersje wyceny
          </CardTitle>
          <Button size="sm" onClick={() => setShowSaveDialog(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Zapisz wersję
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : versions?.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Brak zapisanych wersji. Kliknij "Zapisz wersję" aby zachować aktualny stan wyceny.
          </p>
        ) : (
          <div className="space-y-2">
            {versions?.map((version) => (
              <div 
                key={version.id} 
                className={`flex items-center justify-between rounded-lg border p-2 ${
                  version.is_active ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  {version.is_active && <Check className="h-4 w-4 text-primary" />}
                  <div>
                    <p className="text-sm font-medium">{version.version_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(version.created_at).toLocaleString('pl-PL')} • {Number(version.quote_snapshot.total).toFixed(2)} zł
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePreview(version.quote_snapshot)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {!version.is_active && (
                    <>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSetActive(version.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirmId(version.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Save Version Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zapisz wersję wyceny</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Nazwa wersji</Label>
            <Input
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="np. V2 - po poprawkach"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Anuluj</Button>
            <Button onClick={handleSaveVersion} disabled={createVersion.isPending}>
              {createVersion.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Zapisz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Podgląd wersji</DialogTitle>
          </DialogHeader>
          {previewSnapshot && (
            <div className="max-h-96 space-y-4 overflow-y-auto py-4">
              <div className="space-y-2">
                {previewSnapshot.positions.map((pos, idx) => (
                  <div key={idx} className="flex justify-between rounded border p-2 text-sm">
                    <span>{pos.name}</span>
                    <span>{pos.qty} {pos.unit} × {pos.price} zł = {(pos.qty * pos.price).toFixed(2)} zł</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Materiały:</span>
                  <span>{Number(previewSnapshot.summary_materials).toFixed(2)} zł</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Robocizna:</span>
                  <span>{Number(previewSnapshot.summary_labor).toFixed(2)} zł</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Marża ({previewSnapshot.margin_percent}%):</span>
                  <span>{((previewSnapshot.summary_materials + previewSnapshot.summary_labor) * previewSnapshot.margin_percent / 100).toFixed(2)} zł</span>
                </div>
                <div className="mt-2 flex justify-between font-bold">
                  <span>SUMA:</span>
                  <span>{Number(previewSnapshot.total).toFixed(2)} zł</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>Zamknij</Button>
            {previewSnapshot && onLoadVersion && (
              <Button onClick={() => handleLoadVersion(previewSnapshot)}>
                Załaduj do edytora
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć wersję?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta operacja jest nieodwracalna.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
