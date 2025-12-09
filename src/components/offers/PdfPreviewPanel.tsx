import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  FileText, 
  Eye, 
  Download, 
  Edit, 
  Loader2,
  CheckCircle,
  Send
} from 'lucide-react';
import { usePdfData, useSavePdfData, PdfData } from '@/hooks/usePdfData';
import { useQuote, QuotePosition } from '@/hooks/useQuotes';
import { useProject } from '@/hooks/useProjects';
import { useProfile } from '@/hooks/useProfile';
import { formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';

interface PdfPreviewPanelProps {
  projectId: string;
}

export function PdfPreviewPanel({ projectId }: PdfPreviewPanelProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const { data: pdfData, isLoading: pdfLoading } = usePdfData(projectId);
  const { data: quote } = useQuote(projectId);
  const { data: project } = useProject(projectId);
  const { data: profile } = useProfile();
  const savePdfData = useSavePdfData();

  const [formData, setFormData] = useState({
    version: 'standard' as 'standard' | 'premium',
    title: '',
    offer_text: '',
    terms: '',
    deadline_text: '',
  });

  // Initialize form when data loads
  useEffect(() => {
    if (pdfData) {
      setFormData({
        version: pdfData.version,
        title: pdfData.title,
        offer_text: pdfData.offer_text,
        terms: pdfData.terms,
        deadline_text: pdfData.deadline_text,
      });
    } else if (project) {
      setFormData({
        version: 'standard',
        title: `Oferta - ${project.project_name}`,
        offer_text: 'Szanowni Państwo,\n\nZ przyjemnością przedstawiamy ofertę na wykonanie prac zgodnie z poniższym kosztorysem.',
        terms: 'Warunki płatności: 50% zaliczka, 50% po wykonaniu.\nGwarancja: 24 miesiące na wykonane prace.',
        deadline_text: 'Termin realizacji: do uzgodnienia.',
      });
    }
  }, [pdfData, project]);

  const handleSave = async () => {
    await savePdfData.mutateAsync({
      projectId,
      ...formData,
    });
    setIsEditMode(false);
    toast.success('Dane oferty zapisane');
  };

  if (pdfLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Podgląd oferty PDF
          </span>
          <div className="flex gap-2">
            {isEditMode ? (
              <>
                <Button variant="outline" onClick={() => setIsEditMode(false)}>
                  Anuluj
                </Button>
                <Button onClick={handleSave} disabled={savePdfData.isPending}>
                  {savePdfData.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Zapisz
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditMode(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edytuj
                </Button>
                <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Eye className="h-4 w-4 mr-2" />
                      Podgląd
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                    <DialogHeader>
                      <DialogTitle>Podgląd oferty PDF</DialogTitle>
                    </DialogHeader>
                    
                    {/* PDF Preview */}
                    <div className="bg-white text-black p-8 rounded-lg shadow-lg" style={{ minHeight: '800px' }}>
                      {/* Header */}
                      <div className="flex justify-between items-start mb-8 border-b pb-6">
                        <div>
                          {profile?.logo_url && (
                            <img src={profile.logo_url} alt="Logo" className="h-16 mb-2" />
                          )}
                          <h1 className="text-2xl font-bold text-gray-800">
                            {profile?.company_name || 'Nazwa firmy'}
                          </h1>
                          <p className="text-sm text-gray-600">
                            {profile?.street}, {profile?.postal_code} {profile?.city}
                          </p>
                          <p className="text-sm text-gray-600">NIP: {profile?.nip}</p>
                        </div>
                        <div className="text-right">
                          <h2 className="text-xl font-bold text-gray-800">{formData.title || pdfData?.title}</h2>
                          <p className="text-sm text-gray-600">Data: {new Date().toLocaleDateString('pl-PL')}</p>
                        </div>
                      </div>

                      {/* Client info */}
                      {project?.clients && (
                        <div className="mb-6">
                          <h3 className="font-semibold text-gray-700 mb-2">Klient:</h3>
                          <p>{project.clients.name}</p>
                          {project.clients.address && <p className="text-sm text-gray-600">{project.clients.address}</p>}
                        </div>
                      )}

                      {/* Offer text */}
                      <div className="mb-6">
                        <p className="whitespace-pre-line text-gray-700">
                          {formData.offer_text || pdfData?.offer_text}
                        </p>
                      </div>

                      {/* Quote table */}
                      {quote && (
                        <div className="mb-6">
                          <h3 className="font-semibold text-gray-700 mb-3">Kosztorys:</h3>
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border p-2 text-left">Lp.</th>
                                <th className="border p-2 text-left">Nazwa</th>
                                <th className="border p-2 text-right">Ilość</th>
                                <th className="border p-2 text-left">Jedn.</th>
                                <th className="border p-2 text-right">Cena</th>
                                <th className="border p-2 text-right">Wartość</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(quote.positions as QuotePosition[]).map((pos, idx) => (
                                <tr key={idx}>
                                  <td className="border p-2">{idx + 1}</td>
                                  <td className="border p-2">{pos.name}</td>
                                  <td className="border p-2 text-right">{pos.qty}</td>
                                  <td className="border p-2">{pos.unit}</td>
                                  <td className="border p-2 text-right">{formatCurrency(pos.price)}</td>
                                  <td className="border p-2 text-right font-medium">
                                    {formatCurrency(pos.qty * pos.price)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="bg-gray-50">
                                <td colSpan={5} className="border p-2 text-right font-medium">Materiały:</td>
                                <td className="border p-2 text-right">{formatCurrency(Number(quote.summary_materials))}</td>
                              </tr>
                              <tr className="bg-gray-50">
                                <td colSpan={5} className="border p-2 text-right font-medium">Robocizna:</td>
                                <td className="border p-2 text-right">{formatCurrency(Number(quote.summary_labor))}</td>
                              </tr>
                              <tr className="bg-gray-100 font-bold">
                                <td colSpan={5} className="border p-2 text-right">RAZEM:</td>
                                <td className="border p-2 text-right text-lg">{formatCurrency(Number(quote.total))}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}

                      {/* Terms */}
                      <div className="mb-6">
                        <h3 className="font-semibold text-gray-700 mb-2">Warunki:</h3>
                        <p className="whitespace-pre-line text-sm text-gray-600">
                          {formData.terms || pdfData?.terms}
                        </p>
                      </div>

                      {/* Deadline */}
                      <div className="mb-8">
                        <p className="text-gray-700">{formData.deadline_text || pdfData?.deadline_text}</p>
                      </div>

                      {/* Signature */}
                      <div className="flex justify-between mt-12 pt-8 border-t">
                        <div className="text-center">
                          <div className="h-16 border-b border-gray-300 w-48 mb-2" />
                          <p className="text-sm text-gray-600">Podpis wykonawcy</p>
                        </div>
                        <div className="text-center">
                          <div className="h-16 border-b border-gray-300 w-48 mb-2" />
                          <p className="text-sm text-gray-600">Podpis klienta</p>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
                        <p>Oferta ważna 30 dni od daty wystawienia</p>
                        <p>Wygenerowano w systemie Majster.AI</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" className="flex-1" onClick={() => window.print()}>
                        <Download className="h-4 w-4 mr-2" />
                        Pobierz PDF
                      </Button>
                      <Button className="flex-1">
                        <Send className="h-4 w-4 mr-2" />
                        Wyślij do klienta
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEditMode ? (
          <div className="space-y-4">
            <div>
              <Label>Tytuł oferty</Label>
              <Input 
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Oferta - Nazwa projektu"
              />
            </div>
            <div>
              <Label>Tekst wstępny</Label>
              <Textarea 
                value={formData.offer_text}
                onChange={(e) => setFormData({ ...formData, offer_text: e.target.value })}
                rows={4}
                placeholder="Szanowni Państwo..."
              />
            </div>
            <div>
              <Label>Warunki</Label>
              <Textarea 
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                rows={3}
                placeholder="Warunki płatności, gwarancja..."
              />
            </div>
            <div>
              <Label>Termin realizacji</Label>
              <Input 
                value={formData.deadline_text}
                onChange={(e) => setFormData({ ...formData, deadline_text: e.target.value })}
                placeholder="Termin realizacji: ..."
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge variant={pdfData ? 'default' : 'secondary'}>
                {pdfData ? 'Skonfigurowana' : 'Wymaga konfiguracji'}
              </Badge>
              {pdfData && (
                <span className="text-sm text-muted-foreground">
                  Wersja: {pdfData.version === 'premium' ? 'Premium' : 'Standard'}
                </span>
              )}
            </div>
            
            {pdfData ? (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium mb-2">{pdfData.title}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {pdfData.offer_text}
                </p>
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground">
                  Kliknij "Edytuj" aby skonfigurować treść oferty
                </p>
              </div>
            )}

            {quote && (
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                <span className="text-sm">Wartość oferty</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(Number(quote.total))}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
