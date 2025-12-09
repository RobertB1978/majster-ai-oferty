import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera, Upload, Sparkles, Trash2, Plus, Eye, Loader2 } from 'lucide-react';
import { useProjectPhotos, useUploadProjectPhoto, useAnalyzePhoto, useDeleteProjectPhoto } from '@/hooks/useProjectPhotos';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PhotoEstimationPanelProps {
  projectId: string;
  projectName: string;
  onAddToQuote?: (items: any[]) => void;
}

export function PhotoEstimationPanel({ projectId, projectName, onAddToQuote }: PhotoEstimationPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const { data: photos = [], isLoading } = useProjectPhotos(projectId);
  const uploadPhoto = useUploadProjectPhoto();
  const analyzePhoto = useAnalyzePhoto();
  const deletePhoto = useDeleteProjectPhoto();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    for (const file of Array.from(files)) {
      await uploadPhoto.mutateAsync({ projectId, file });
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async (photo: any) => {
    await analyzePhoto.mutateAsync({
      photoId: photo.id,
      projectId,
      imageUrl: photo.photo_url,
      projectName
    });
  };

  const handleAddToQuote = (analysis: any) => {
    if (!onAddToQuote) return;
    
    const items = [
      ...(analysis.works || []).map((w: any) => ({
        name: w.name,
        category: w.category,
        unit: w.unit,
        qty: w.estimatedQty,
        price: w.estimatedPrice,
        notes: w.notes
      })),
      ...(analysis.materials || []).map((m: any) => ({
        name: m.name,
        category: m.category,
        unit: m.unit,
        qty: m.estimatedQty,
        price: m.estimatedPrice,
        notes: m.notes
      }))
    ];
    
    onAddToQuote(items);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Wycena ze zdjęć AI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Wycena ze zdjęć AI
          </span>
          <Button
            onClick={() => fileInputRef.current?.click()}
            size="sm"
            disabled={uploadPhoto.isPending}
          >
            {uploadPhoto.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {uploadPhoto.isPending ? 'Przesyłanie...' : 'Dodaj zdjęcia'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        {photos.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              Dodaj zdjęcia projektu, a AI wygeneruje wycenę
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.photo_url}
                  alt={photo.file_name}
                  className="w-full h-32 object-cover rounded-lg"
                />
                
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  {photo.analysis_status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => handleAnalyze(photo)}
                      disabled={analyzePhoto.isPending}
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      Analizuj
                    </Button>
                  )}
                  
                  {photo.analysis_status === 'completed' && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="secondary">
                          <Eye className="h-4 w-4 mr-1" />
                          Wyniki
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle>Analiza AI</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="max-h-[60vh]">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Podsumowanie</h4>
                              <p className="text-sm text-muted-foreground">
                                {photo.analysis_result?.summary}
                              </p>
                            </div>
                            
                            {photo.analysis_result?.works?.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2">Prace ({photo.analysis_result.works.length})</h4>
                                <div className="space-y-2">
                                  {photo.analysis_result.works.map((work: any, i: number) => (
                                    <div key={i} className="p-2 bg-muted rounded text-sm">
                                      <div className="flex justify-between">
                                        <span>{work.name}</span>
                                        <span>{work.estimatedQty} {work.unit} × {work.estimatedPrice} zł</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {photo.analysis_result?.materials?.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2">Materiały ({photo.analysis_result.materials.length})</h4>
                                <div className="space-y-2">
                                  {photo.analysis_result.materials.map((mat: any, i: number) => (
                                    <div key={i} className="p-2 bg-muted rounded text-sm">
                                      <div className="flex justify-between">
                                        <span>{mat.name}</span>
                                        <span>{mat.estimatedQty} {mat.unit} × {mat.estimatedPrice} zł</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-4 p-4 bg-primary/10 rounded-lg">
                              <div>
                                <p className="text-sm text-muted-foreground">Robocizna</p>
                                <p className="font-bold">{photo.analysis_result?.estimatedTotalLabor?.toLocaleString()} zł</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Materiały</p>
                                <p className="font-bold">{photo.analysis_result?.estimatedTotalMaterials?.toLocaleString()} zł</p>
                              </div>
                            </div>
                            
                            {onAddToQuote && (
                              <Button 
                                onClick={() => handleAddToQuote(photo.analysis_result)} 
                                className="w-full"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Dodaj do wyceny
                              </Button>
                            )}
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deletePhoto.mutate({ photoId: photo.id, projectId })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <Badge 
                  className="absolute top-2 right-2"
                  variant={
                    photo.analysis_status === 'completed' ? 'default' :
                    photo.analysis_status === 'analyzing' ? 'secondary' :
                    photo.analysis_status === 'failed' ? 'destructive' : 'outline'
                  }
                >
                  {photo.analysis_status === 'completed' && 'Gotowe'}
                  {photo.analysis_status === 'analyzing' && 'Analizuję...'}
                  {photo.analysis_status === 'pending' && 'Oczekuje'}
                  {photo.analysis_status === 'failed' && 'Błąd'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
