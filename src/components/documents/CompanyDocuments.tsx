import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  FileText, Upload, Trash2, Download, Plus, Award, FileCheck, Shield,
  Loader2, AlertCircle, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { validateFile, FILE_VALIDATION_CONFIGS } from '@/lib/fileValidation';

interface CompanyDocument {
  id: string;
  user_id: string;
  document_type: 'uprawnienia' | 'referencje' | 'certyfikat' | 'polisa' | 'inne';
  name: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_size: number | null;
  created_at: string;
}

const documentTypeConfig = {
  uprawnienia: { label: 'Uprawnienia', icon: Award, color: 'bg-blue-500' },
  referencje: { label: 'Referencje', icon: FileCheck, color: 'bg-green-500' },
  certyfikat: { label: 'Certyfikat', icon: Shield, color: 'bg-purple-500' },
  polisa: { label: 'Polisa OC', icon: Shield, color: 'bg-orange-500' },
  inne: { label: 'Inne', icon: FileText, color: 'bg-gray-500' },
};

export function CompanyDocuments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newDoc, setNewDoc] = useState({
    name: '',
    document_type: 'uprawnienia' as const,
    description: '',
  });

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['company-documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_documents')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CompanyDocument[];
    },
    enabled: !!user,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('Not authenticated');

      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('company-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('company-documents')
        .getPublicUrl(fileName);

      // Save document record
      const { error: insertError } = await supabase
        .from('company_documents')
        .insert({
          user_id: user.id,
          document_type: newDoc.document_type,
          name: newDoc.name || file.name,
          description: newDoc.description || null,
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_size: file.size,
        });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-documents'] });
      toast.success('Dokument został dodany');
      setIsDialogOpen(false);
      setNewDoc({ name: '', document_type: 'uprawnienia', description: '' });
    },
    onError: (error) => {
      toast.error('Błąd przy dodawaniu dokumentu');
      console.error(error);
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (doc: CompanyDocument) => {
      // Delete from storage
      const filePath = doc.file_url.split('/company-documents/')[1];
      if (filePath) {
        await supabase.storage.from('company-documents').remove([filePath]);
      }

      // Delete record
      const { error } = await supabase
        .from('company_documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-documents'] });
      toast.success('Dokument usunięty');
    },
    onError: () => {
      toast.error('Błąd przy usuwaniu dokumentu');
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, FILE_VALIDATION_CONFIGS.document);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    uploadMutation.mutate(file);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Dokumenty firmowe
            </CardTitle>
            <CardDescription>
              Uprawnienia, referencje, certyfikaty i polisy do załączenia do ofert
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Dodaj dokument
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dodaj nowy dokument</DialogTitle>
                <DialogDescription>
                  Prześlij dokument, który będzie można załączać do ofert
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Typ dokumentu</Label>
                  <Select
                    value={newDoc.document_type}
                    onValueChange={(val: string) => setNewDoc({ ...newDoc, document_type: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(documentTypeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <config.icon className="h-4 w-4" />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nazwa dokumentu</Label>
                  <Input
                    value={newDoc.name}
                    onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                    placeholder="np. Uprawnienia elektryczne SEP"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Opis (opcjonalnie)</Label>
                  <Input
                    value={newDoc.description}
                    onChange={(e) => setNewDoc({ ...newDoc, description: e.target.value })}
                    placeholder="Krótki opis dokumentu"
                  />
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />

                <Button
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Przesyłanie...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Wybierz plik i prześlij
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Akceptowane formaty: PDF, JPG, PNG, DOC. Max 10MB
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">Brak dokumentów</p>
            <p className="text-sm text-muted-foreground">
              Dodaj uprawnienia, referencje lub certyfikaty
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {documents.map((doc) => {
              const config = documentTypeConfig[doc.document_type];
              const Icon = config.icon;
              
              return (
                <div
                  key={doc.id}
                  className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{doc.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {config.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(doc.file_size)}
                      </span>
                    </div>
                    {doc.description && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {doc.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(doc.created_at), 'd MMM yyyy', { locale: pl })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => window.open(doc.file_url, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = doc.file_url;
                        a.download = doc.file_name;
                        a.click();
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(doc)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
