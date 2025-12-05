import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Download, FileText, Wrench } from 'lucide-react';
import { toast } from 'sonner';

export default function PdfGenerator() {
  const { id } = useParams<{ id: string }>();
  const { getProjectById, getQuoteByProjectId, getClientById, getPdfDataByProjectId, savePdfData } = useData();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const project = getProjectById(id!);
  const quote = getQuoteByProjectId(id!);
  const existingPdfData = getPdfDataByProjectId(id!);

  const [version, setVersion] = useState<'standard' | 'premium'>(existingPdfData?.version || 'standard');
  const [title, setTitle] = useState(existingPdfData?.title || `Oferta - ${project?.project_name || ''}`);
  const [offerText, setOfferText] = useState(existingPdfData?.offer_text || 'Szanowni Państwo,\n\nZ przyjemnością przedstawiamy ofertę na realizację prac.');
  const [deadlineText, setDeadlineText] = useState(existingPdfData?.deadline_text || 'Do ustalenia');
  const [terms, setTerms] = useState(existingPdfData?.terms || 'Płatność: 50% zaliczki, 50% po wykonaniu prac.\nGwarancja: 24 miesiące na wykonane prace.');

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

  const client = getClientById(project.client_id);

  const handleGeneratePdf = () => {
    savePdfData(id!, { version, title, offer_text: offerText, terms, deadline_text: deadlineText });
    
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
            .logo-icon { width: 40px; height: 40px; background: ${version === 'premium' ? 'white' : '#2563eb'}; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: ${version === 'premium' ? '#2563eb' : 'white'}; font-weight: bold; }
            .logo-text { font-size: 24px; font-weight: bold; }
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
                <Label>Tytuł oferty</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tekst oferty</Label>
                <Textarea
                  value={offerText}
                  onChange={(e) => setOfferText(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Termin realizacji</Label>
                <Input value={deadlineText} onChange={(e) => setDeadlineText(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Warunki</Label>
                <Textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button size="lg" onClick={handleGeneratePdf} className="flex-1">
              <Download className="mr-2 h-5 w-5" />
              Generuj i pobierz PDF
            </Button>
          </div>
        </div>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Podgląd</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              ref={printRef}
              className="rounded-lg border border-border bg-card p-6 text-sm"
              style={{ maxHeight: '70vh', overflow: 'auto' }}
            >
              {/* Header */}
              <div className={version === 'premium' ? 'mb-6 rounded-lg bg-primary p-6 text-primary-foreground' : 'mb-6 border-b pb-4'}>
                <div className="mb-3 flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${version === 'premium' ? 'bg-primary-foreground text-primary' : 'bg-primary text-primary-foreground'}`}>
                    <Wrench className="h-5 w-5" />
                  </div>
                  <span className="text-xl font-bold">Majster.AI</span>
                </div>
                <h1 className="text-2xl font-bold">{title}</h1>
                <p className="mt-1 opacity-80">
                  Data: {new Date().toLocaleDateString('pl-PL')}
                </p>
              </div>

              {/* Client info */}
              {client && (
                <div className="mb-6 rounded-lg bg-muted p-4">
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Klient
                  </h3>
                  <p className="font-medium">{client.name}</p>
                  {client.address && <p className="text-muted-foreground">{client.address}</p>}
                  {client.phone && <p className="text-muted-foreground">{client.phone}</p>}
                  {client.email && <p className="text-muted-foreground">{client.email}</p>}
                </div>
              )}

              {/* Offer text */}
              {version === 'premium' && offerText && (
                <div className="mb-6 whitespace-pre-wrap leading-relaxed">
                  {offerText}
                </div>
              )}

              {/* Quote table */}
              {quote && quote.positions.length > 0 && (
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
                    {quote.positions.map((pos) => (
                      <tr key={pos.id} className="border-b border-border">
                        <td className="p-3">{pos.name}</td>
                        <td className="p-3">{pos.qty} {pos.unit}</td>
                        <td className="p-3">{pos.price.toFixed(2)} zł</td>
                        <td className="p-3 text-right">{(pos.qty * pos.price).toFixed(2)} zł</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Summary */}
              {quote && (
                <div className="mb-6 rounded-lg bg-muted p-4">
                  <div className="mb-2 flex justify-between">
                    <span>Materiały:</span>
                    <span>{quote.summary_materials.toFixed(2)} zł</span>
                  </div>
                  <div className="mb-2 flex justify-between">
                    <span>Robocizna:</span>
                    <span>{quote.summary_labor.toFixed(2)} zł</span>
                  </div>
                  <div className="mb-2 flex justify-between">
                    <span>Marża ({quote.margin_percent}%):</span>
                    <span>{((quote.summary_materials + quote.summary_labor) * quote.margin_percent / 100).toFixed(2)} zł</span>
                  </div>
                  <div className="mt-3 flex justify-between border-t border-border pt-3 text-lg font-bold">
                    <span>Razem:</span>
                    <span className="text-primary">{quote.total.toFixed(2)} zł</span>
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

              {/* Footer */}
              <div className="mt-8 border-t border-border pt-4 text-center text-xs text-muted-foreground">
                Wygenerowano w Majster.AI
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
