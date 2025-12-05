import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '@/hooks/useProjects';
import { useQuote } from '@/hooks/useQuotes';
import { usePdfData, useSavePdfData } from '@/hooks/usePdfData';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Download, Wrench, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PdfGenerator() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading: projectLoading } = useProject(id!);
  const { data: quote, isLoading: quoteLoading } = useQuote(id!);
  const { data: existingPdfData, isLoading: pdfDataLoading } = usePdfData(id!);
  const { data: profile } = useProfile();
  const savePdfData = useSavePdfData();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [version, setVersion] = useState<'standard' | 'premium'>('standard');
  const [title, setTitle] = useState('');
  const [offerText, setOfferText] = useState('Szanowni Państwo,\n\nZ przyjemnością przedstawiamy ofertę na realizację prac.');
  const [deadlineText, setDeadlineText] = useState('Do ustalenia');
  const [terms, setTerms] = useState('Płatność: 50% zaliczki, 50% po wykonaniu prac.\nGwarancja: 24 miesiące na wykonane prace.');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (existingPdfData && !isInitialized) {
      setVersion(existingPdfData.version as 'standard' | 'premium');
      setTitle(existingPdfData.title);
      setOfferText(existingPdfData.offer_text || offerText);
      setDeadlineText(existingPdfData.deadline_text || deadlineText);
      setTerms(existingPdfData.terms || terms);
      setIsInitialized(true);
    } else if (!pdfDataLoading && !existingPdfData && project && !isInitialized) {
      setTitle(`Oferta - ${project.project_name}`);
      setIsInitialized(true);
    }
  }, [existingPdfData, pdfDataLoading, project, isInitialized]);

  if (projectLoading || quoteLoading || pdfDataLoading) {
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
          Powrót
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Projekt nie został znaleziony.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Profile data with fallbacks
  const companyName = profile?.company_name || 'Majster.AI';
  const ownerName = profile?.owner_name || '';
  const nip = profile?.nip || '';
  const street = profile?.street || '';
  const city = profile?.city || '';
  const postalCode = profile?.postal_code || '';
  const phone = profile?.phone || '';
  const emailForOffers = profile?.email_for_offers || '';
  const bankAccount = profile?.bank_account || '';
  const logoUrl = profile?.logo_url || '';

  const fullAddress = [street, postalCode && city ? `${postalCode} ${city}` : city].filter(Boolean).join(', ');

  const handleGeneratePdf = async () => {
    if (!title.trim()) {
      toast.error('Podaj tytuł oferty');
      return;
    }

    await savePdfData.mutateAsync({
      projectId: id!,
      version,
      title,
      offer_text: offerText,
      terms,
      deadline_text: deadlineText,
    });
    
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Nie można otworzyć okna drukowania. Odblokuj wyskakujące okna.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1a1a1a; }
            .header { ${version === 'premium' ? 'background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px;' : 'margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px;'} }
            .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
            .logo img { width: 60px; height: 60px; object-fit: contain; border-radius: 8px; }
            .logo-icon { width: 40px; height: 40px; background: ${version === 'premium' ? 'white' : '#2563eb'}; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: ${version === 'premium' ? '#2563eb' : 'white'}; font-weight: bold; }
            .logo-text { font-size: 24px; font-weight: bold; }
            .company-info { font-size: 12px; opacity: 0.9; margin-top: 8px; }
            h1 { font-size: 28px; margin-bottom: 8px; }
            .date { font-size: 14px; opacity: 0.8; }
            .client-info { margin-bottom: 30px; padding: 20px; background: #f9fafb; border-radius: 8px; }
            .client-info h3 { font-size: 14px; color: #6b7280; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
            .client-info p { margin: 4px 0; }
            .offer-text { margin-bottom: 30px; line-height: 1.6; white-space: pre-wrap; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: ${version === 'premium' ? '#2563eb' : '#f3f4f6'}; color: ${version === 'premium' ? 'white' : '#1a1a1a'}; text-align: left; padding: 12px; font-weight: 600; }
            td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
            .summary { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .summary-total { font-size: 20px; font-weight: bold; color: #2563eb; border-top: 2px solid #e5e7eb; padding-top: 12px; margin-top: 12px; }
            .terms { margin-bottom: 30px; }
            .terms h3 { font-size: 16px; margin-bottom: 12px; }
            .terms p { line-height: 1.6; white-space: pre-wrap; color: #4b5563; }
            .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            .bank-info { margin-top: 20px; padding: 15px; background: #f0f9ff; border-radius: 8px; font-size: 13px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    toast.success('PDF wygenerowany');
  };

  const hasQuotePositions = quote && quote.positions && quote.positions.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" onClick={() => navigate(`/projects/${id}`)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Powrót do projektu
      </Button>

      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Oferta PDF — {project.project_name}
        </h1>
      </div>

      {/* Warning if no profile */}
      {!profile?.company_name && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-warning" />
            <div>
              <p className="font-medium">Uzupełnij profil firmy</p>
              <p className="text-sm text-muted-foreground">
                <Button variant="link" className="h-auto p-0" onClick={() => navigate('/profile')}>
                  Przejdź do profilu
                </Button> aby dodać dane firmy do oferty.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ustawienia oferty</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Wersja oferty</Label>
                <Select value={version} onValueChange={(v) => setVersion(v as 'standard' | 'premium')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium (z nagłówkiem)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tytuł oferty *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tekst oferty</Label>
                <Textarea value={offerText} onChange={(e) => setOfferText(e.target.value)} rows={4} />
              </div>
              <div className="space-y-2">
                <Label>Termin realizacji</Label>
                <Input value={deadlineText} onChange={(e) => setDeadlineText(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Warunki</Label>
                <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={4} />
              </div>
            </CardContent>
          </Card>

          <Button size="lg" onClick={handleGeneratePdf} className="w-full" disabled={savePdfData.isPending}>
            {savePdfData.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Download className="mr-2 h-5 w-5" />
            Generuj i pobierz PDF
          </Button>
        </div>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Podgląd</CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={printRef} className="rounded-lg border border-border bg-card p-6 text-sm" style={{ maxHeight: '70vh', overflow: 'auto' }}>
              {/* Header */}
              <div className={version === 'premium' ? 'mb-6 rounded-lg bg-primary p-6 text-primary-foreground' : 'mb-6 border-b pb-4'}>
                <div className="mb-3 flex items-center gap-3">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-12 w-12 rounded-lg object-contain" />
                  ) : (
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${version === 'premium' ? 'bg-primary-foreground text-primary' : 'bg-primary text-primary-foreground'}`}>
                      <Wrench className="h-5 w-5" />
                    </div>
                  )}
                  <span className="text-xl font-bold">{companyName}</span>
                </div>
                {(nip || fullAddress || phone || emailForOffers) && (
                  <div className="text-xs opacity-90">
                    {nip && <p>NIP: {nip}</p>}
                    {fullAddress && <p>{fullAddress}</p>}
                    {phone && <p>Tel: {phone}</p>}
                    {emailForOffers && <p>Email: {emailForOffers}</p>}
                  </div>
                )}
                <h1 className="mt-4 text-2xl font-bold">{title || 'Oferta'}</h1>
                <p className="mt-1 opacity-80">Data: {new Date().toLocaleDateString('pl-PL')}</p>
              </div>

              {/* Client info */}
              {project.clients && (
                <div className="mb-6 rounded-lg bg-muted p-4">
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Klient</h3>
                  <p className="font-medium">{project.clients.name}</p>
                  {project.clients.address && <p className="text-muted-foreground">{project.clients.address}</p>}
                  {project.clients.phone && <p className="text-muted-foreground">{project.clients.phone}</p>}
                  {project.clients.email && <p className="text-muted-foreground">{project.clients.email}</p>}
                </div>
              )}

              {/* Offer text */}
              {version === 'premium' && offerText && (
                <div className="mb-6 whitespace-pre-wrap leading-relaxed">{offerText}</div>
              )}

              {/* Quote table */}
              {hasQuotePositions ? (
                <table className="mb-6 w-full text-left">
                  <thead>
                    <tr className={version === 'premium' ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                      <th className="p-3 font-medium">Pozycja</th>
                      <th className="p-3 font-medium">Ilość</th>
                      <th className="p-3 font-medium">Cena</th>
                      <th className="p-3 font-medium text-right">Suma</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.positions.map((pos: any) => (
                      <tr key={pos.id} className="border-b border-border">
                        <td className="p-3">{pos.name}</td>
                        <td className="p-3">{pos.qty} {pos.unit}</td>
                        <td className="p-3">{pos.price.toFixed(2)} zł</td>
                        <td className="p-3 text-right">{(pos.qty * pos.price).toFixed(2)} zł</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="mb-6 rounded-lg bg-muted p-4 text-center text-muted-foreground">
                  Brak pozycji w wycenie
                </div>
              )}

              {/* Summary */}
              {quote && (
                <div className="mb-6 rounded-lg bg-muted p-4">
                  <div className="mb-2 flex justify-between">
                    <span>Materiały:</span>
                    <span>{Number(quote.summary_materials || 0).toFixed(2)} zł</span>
                  </div>
                  <div className="mb-2 flex justify-between">
                    <span>Robocizna:</span>
                    <span>{Number(quote.summary_labor || 0).toFixed(2)} zł</span>
                  </div>
                  <div className="mb-2 flex justify-between">
                    <span>Marża ({quote.margin_percent || 0}%):</span>
                    <span>{((Number(quote.summary_materials || 0) + Number(quote.summary_labor || 0)) * Number(quote.margin_percent || 0) / 100).toFixed(2)} zł</span>
                  </div>
                  <div className="mt-3 flex justify-between border-t border-border pt-3 text-lg font-bold">
                    <span>Razem:</span>
                    <span className="text-primary">{Number(quote.total || 0).toFixed(2)} zł</span>
                  </div>
                </div>
              )}

              {/* Deadline */}
              {deadlineText && (
                <div className="mb-4">
                  <h3 className="mb-1 font-medium">Termin realizacji</h3>
                  <p className="text-muted-foreground">{deadlineText}</p>
                </div>
              )}

              {/* Terms */}
              {terms && (
                <div className="mb-6">
                  <h3 className="mb-1 font-medium">Warunki</h3>
                  <p className="whitespace-pre-wrap text-muted-foreground">{terms}</p>
                </div>
              )}

              {/* Bank account */}
              {bankAccount && (
                <div className="mb-6 rounded-lg bg-accent/50 p-4">
                  <h3 className="mb-1 text-sm font-medium">Numer konta do wpłat</h3>
                  <p className="font-mono text-sm">{bankAccount}</p>
                </div>
              )}

              {/* Footer */}
              <div className="mt-8 border-t border-border pt-4 text-center text-xs text-muted-foreground">
                Oferta wygenerowana w Majster.AI
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
