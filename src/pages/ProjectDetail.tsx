import { useState, lazy, Suspense } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProject, useUpdateProject } from '@/hooks/useProjects';
import { useQuote } from '@/hooks/useQuotes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calculator, FileText, User, Calendar, Loader2, Download, Mail, Camera, Receipt, FileSignature, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { exportQuoteToExcel } from '@/lib/exportUtils';
import { OfferHistoryPanel } from '@/components/offers/OfferHistoryPanel';
import { OfferStatsPanel } from '@/components/offers/OfferStatsPanel';
import { SendOfferModal } from '@/components/offers/SendOfferModal';

// Lazy-load heavy tab components to reduce initial page bundle
const PhotoEstimationPanel = lazy(() => import('@/components/photos/PhotoEstimationPanel').then(m => ({ default: m.PhotoEstimationPanel })));
const PurchaseCostsPanel = lazy(() => import('@/components/costs/PurchaseCostsPanel').then(m => ({ default: m.PurchaseCostsPanel })));
const OfferApprovalPanel = lazy(() => import('@/components/offers/OfferApprovalPanel').then(m => ({ default: m.OfferApprovalPanel })));
const PdfPreviewPanel = lazy(() => import('@/components/offers/PdfPreviewPanel').then(m => ({ default: m.PdfPreviewPanel })));

const statuses = ['Nowy', 'Wycena w toku', 'Oferta wysłana', 'Zaakceptowany'] as const;

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading: projectLoading } = useProject(id!);
  const { data: quote, isLoading: quoteLoading } = useQuote(id!);
  const updateProject = useUpdateProject();
  const navigate = useNavigate();
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null); // Phase 5C: Track generated PDF URL

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={() => navigate('/projects')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Powrót do projektów
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Projekt nie został znaleziony.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStatusChange = async (status: string) => {
    await updateProject.mutateAsync({ 
      id: project.id, 
      status: status as typeof statuses[number] 
    });
  };

  const handleAddToQuote = (items: unknown[]) => {
    // Navigate to quote editor with items to add
    navigate(`/projects/${id}/quote`, { state: { addItems: items } });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" onClick={() => navigate('/projects')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Powrót do projektów
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {project.project_name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <Link to="/clients" className="hover:text-primary hover:underline">
                {project.clients?.name || 'Nieznany klient'}
              </Link>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(project.created_at).toLocaleDateString('pl-PL')}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Select value={project.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button size="lg" onClick={() => navigate(`/projects/${id}/quote`)}>
          <Calculator className="mr-2 h-5 w-5" />
          Edytuj wycenę
        </Button>
        <Button size="lg" variant="outline" onClick={() => navigate(`/projects/${id}/pdf`)}>
          <FileText className="mr-2 h-5 w-5" />
          Generuj ofertę PDF
        </Button>
        <Button size="lg" variant="outline" onClick={() => setSendModalOpen(true)}>
          <Mail className="mr-2 h-5 w-5" />
          Wyślij mailem
        </Button>
        {quote && (
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await exportQuoteToExcel({
                  projectName: project.project_name,
                  positions: quote.positions,
                  summaryMaterials: Number(quote.summary_materials),
                  summaryLabor: Number(quote.summary_labor),
                  marginPercent: Number(quote.margin_percent),
                  total: Number(quote.total),
                });
              } catch (error) {
                console.error('Failed to export Excel:', error);
                toast.error('Błąd podczas eksportu do Excel');
              }
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Eksport Excel
          </Button>
        )}
      </div>

      {/* Send Offer Modal - Phase 5C: Include PDF URL if generated */}
      <SendOfferModal
        open={sendModalOpen}
        onOpenChange={setSendModalOpen}
        projectId={id!}
        projectName={project.project_name}
        clientEmail={project.clients?.email || ''}
        clientName={project.clients?.name || ''}
        pdfUrl={generatedPdfUrl || undefined}
      />

      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-background">
            <FileText className="h-4 w-4" />
            Przegląd
          </TabsTrigger>
          <TabsTrigger value="photos" className="gap-2 data-[state=active]:bg-background">
            <Camera className="h-4 w-4" />
            Zdjęcia AI
          </TabsTrigger>
          <TabsTrigger value="costs" className="gap-2 data-[state=active]:bg-background">
            <Receipt className="h-4 w-4" />
            Koszty
          </TabsTrigger>
          <TabsTrigger value="approval" className="gap-2 data-[state=active]:bg-background">
            <FileSignature className="h-4 w-4" />
            E-Podpis
          </TabsTrigger>
          <TabsTrigger value="pdf" className="gap-2 data-[state=active]:bg-background">
            <Eye className="h-4 w-4" />
            Podgląd PDF
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          {/* Quote summary */}
          {quoteLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : quote ? (
            <Card>
              <CardHeader>
                <CardTitle>Podsumowanie wyceny</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Materiały:</span>
                    <span className="font-medium">{Number(quote.summary_materials).toFixed(2)} zł</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Robocizna:</span>
                    <span className="font-medium">{Number(quote.summary_labor).toFixed(2)} zł</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Marża ({quote.margin_percent}%):</span>
                    <span className="font-medium">
                      {((Number(quote.summary_materials) + Number(quote.summary_labor)) * Number(quote.margin_percent) / 100).toFixed(2)} zł
                    </span>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Kwota całkowita:</span>
                      <span className="text-primary">{Number(quote.total).toFixed(2)} zł</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  Brak wyceny. Kliknij "Edytuj wycenę" aby dodać pozycje kosztorysu.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Phase 6A: Offer Statistics */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Statystyki ofert</h3>
            <OfferStatsPanel />
          </div>

          {/* Offer History */}
          <div className="mt-6">
            <OfferHistoryPanel projectId={id!} />
          </div>
        </TabsContent>

        <TabsContent value="photos" className="mt-4">
          <Suspense fallback={<div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
            <PhotoEstimationPanel
              projectId={id!}
              projectName={project.project_name}
              onAddToQuote={handleAddToQuote}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="costs" className="mt-4">
          <Suspense fallback={<div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
            <PurchaseCostsPanel projectId={id!} />
          </Suspense>
        </TabsContent>

        <TabsContent value="approval" className="mt-4">
          <Suspense fallback={<div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
            <OfferApprovalPanel
              projectId={id!}
              clientName={project.clients?.name}
              clientEmail={project.clients?.email}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="pdf" className="mt-4">
          <Suspense fallback={<div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
            <PdfPreviewPanel
              projectId={id!}
              onPdfGenerated={setGeneratedPdfUrl}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
