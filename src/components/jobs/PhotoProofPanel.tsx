import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, ImageIcon } from 'lucide-react';

interface PhotoProof {
  id: string;
  url: string;
  name: string;
  addedAt: string;
}

export function PhotoProofPanel() {
  const { t } = useTranslation();
  const [photos, setPhotos] = useState<PhotoProof[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newPhotos: PhotoProof[] = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((f) => ({
        id: crypto.randomUUID(),
        url: URL.createObjectURL(f),
        name: f.name,
        addedAt: new Date().toISOString(),
      }));
    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo) URL.revokeObjectURL(photo.url);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          {t('photoProof.title')}
        </CardTitle>
        <CardDescription>
          {t('photoProof.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop zone */}
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors hover:border-primary/50"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">
            {t('photoProof.dropHint')}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px]"
            onClick={() => fileRef.current?.click()}
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            {t('photoProof.selectFiles')}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {/* Photo grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="group relative aspect-square rounded-lg overflow-hidden border">
                <img
                  src={photo.url}
                  alt={photo.name}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => removePhoto(photo.id)}
                  className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={t('photoProof.removePhoto')}
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-black/60 px-2 py-1">
                  <p className="text-xs text-white truncate">{photo.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {photos.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('photoProof.empty')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
