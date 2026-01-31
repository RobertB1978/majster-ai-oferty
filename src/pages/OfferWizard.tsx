import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAddClient } from '@/hooks/useClients';
import { useAddProject } from '@/hooks/useProjects';
import { useSaveQuote } from '@/hooks/useQuotes';
import { formatCurrency } from '@/lib/formatters';
import { ArrowLeft, ArrowRight, Plus, Trash2, Save, Eye, Loader2 } from 'lucide-react';
import type { QuotePosition } from '@/hooks/useQuotes';

interface WizardPosition {
  id: string;
  name: string;
  qty: number;
  unit: string;
  price: number;
  category: 'Materiał' | 'Robocizna';
}

const UNITS = ['szt.', 'm', 'm²', 'm³', 'kg', 'l', 'kpl', 'godz.'];

export default function OfferWizard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);

  // Step 1 state
  const [offerName, setOfferName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Step 2 state
  const [positions, setPositions] = useState<WizardPosition[]>([]);

  // Step 3 state
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const addClient = useAddClient();
  const addProject = useAddProject();
  const saveQuote = useSaveQuote();

  // Calculations
  const totalAmount = positions.reduce((sum, p) => sum + p.qty * p.price, 0);

  // Validation
  const canProceedStep1 = offerName.trim().length > 0 && clientName.trim().length > 0;
  const canProceedStep2 = positions.length > 0 && positions.every(p => p.name.trim() && p.qty > 0);

  const addPosition = () => {
    setPositions(prev => [...prev, {
      id: crypto.randomUUID(),
      name: '',
      qty: 1,
      unit: 'szt.',
      price: 0,
      category: 'Materiał',
    }]);
  };

  const updatePosition = (id: string, field: keyof WizardPosition, value: string | number) => {
    setPositions(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removePosition = (id: string) => {
    setPositions(prev => prev.filter(p => p.id !== id));
  };

  const handleSave = async () => {
    if (!canProceedStep1 || !canProceedStep2) {
      toast.error('Uzupełnij wszystkie wymagane pola');
      return;
    }

    setIsSaving(true);
    try {
      const client = await addClient.mutateAsync({
        name: clientName,
        email: clientEmail || null,
        phone: clientPhone || null,
        address: null,
      });

      const project = await addProject.mutateAsync({
        project_name: offerName,
        client_id: client.id,
        status: 'Nowy',
      });

      await saveQuote.mutateAsync({
        projectId: project.id,
        positions: positions as QuotePosition[],
        marginPercent: 0,
      });

      toast.success('Oferta zapisana jako szkic');
      navigate(`/projects/${project.id}`);
    } catch {
      toast.error('Błąd podczas zapisywania oferty');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('offers.newOffer', 'Nowa oferta')} | Majster.AI</title>
      </Helmet>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s === step ? 'bg-primary text-primary-foreground' :
                s < step ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {s}
              </div>
              {s < 3 && <div className={`w-8 h-px ${s < step ? 'bg-primary' : 'bg-border'}`} />}
            </div>
          ))}
          <span className="ml-2 font-medium">
            {step === 1 && 'Klient'}
            {step === 2 && 'Pozycje'}
            {step === 3 && 'Podsumowanie'}
          </span>
        </div>

        {/* Step 1: Client */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Dane klienta i oferty</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="offerName">Nazwa oferty *</Label>
                <Input
                  id="offerName"
                  value={offerName}
                  onChange={e => setOfferName(e.target.value)}
                  placeholder="np. Remont łazienki ul. Kwiatowa 5"
                />
              </div>
              <div>
                <Label htmlFor="clientName">Nazwa klienta *</Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="np. Jan Kowalski"
                />
              </div>
              <div>
                <Label htmlFor="clientEmail">Email (opcjonalnie)</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                  placeholder="jan@example.com"
                />
              </div>
              <div>
                <Label htmlFor="clientPhone">Telefon (opcjonalnie)</Label>
                <Input
                  id="clientPhone"
                  type="tel"
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  placeholder="+48 123 456 789"
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>
                  Dalej <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Positions */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Pozycje wyceny
                <Button size="sm" variant="outline" onClick={addPosition}>
                  <Plus className="h-4 w-4 mr-1" /> Dodaj
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {positions.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Dodaj pierwszą pozycję do wyceny
                </p>
              )}
              {positions.map((pos, idx) => (
                <div key={pos.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">#{idx + 1}</span>
                    <Button size="icon" variant="ghost" onClick={() => removePosition(pos.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <Input
                    value={pos.name}
                    onChange={e => updatePosition(pos.id, 'name', e.target.value)}
                    placeholder="Nazwa pozycji"
                  />
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <Label className="text-xs">Ilość</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={pos.qty}
                        onChange={e => updatePosition(pos.id, 'qty', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Jednostka</Label>
                      <Select value={pos.unit} onValueChange={v => updatePosition(pos.id, 'unit', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Cena (PLN)</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={pos.price}
                        onChange={e => updatePosition(pos.id, 'price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Kategoria</Label>
                      <Select value={pos.category} onValueChange={v => updatePosition(pos.id, 'category', v as WizardPosition['category'])}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Materiał">Materiał</SelectItem>
                          <SelectItem value="Robocizna">Robocizna</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="text-right text-sm font-medium">
                    = {formatCurrency(pos.qty * pos.price)}
                  </div>
                </div>
              ))}

              {positions.length > 0 && (
                <div className="text-right font-semibold text-lg pt-2 border-t">
                  Suma: {formatCurrency(totalAmount)}
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Wstecz
                </Button>
                <Button onClick={() => setStep(3)} disabled={!canProceedStep2}>
                  Dalej <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Summary */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Podsumowanie oferty</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <span className="text-muted-foreground">Nazwa oferty:</span>
                <span className="font-medium">{offerName}</span>
                <span className="text-muted-foreground">Klient:</span>
                <span className="font-medium">{clientName}</span>
                {clientEmail && (
                  <>
                    <span className="text-muted-foreground">Email:</span>
                    <span>{clientEmail}</span>
                  </>
                )}
                {clientPhone && (
                  <>
                    <span className="text-muted-foreground">Telefon:</span>
                    <span>{clientPhone}</span>
                  </>
                )}
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2">Pozycja</th>
                      <th className="text-right p-2">Ilość</th>
                      <th className="text-right p-2">Cena</th>
                      <th className="text-right p-2">Wartość</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map(pos => (
                      <tr key={pos.id} className="border-t">
                        <td className="p-2">{pos.name}</td>
                        <td className="text-right p-2">{pos.qty} {pos.unit}</td>
                        <td className="text-right p-2">{formatCurrency(pos.price)}</td>
                        <td className="text-right p-2 font-medium">{formatCurrency(pos.qty * pos.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t bg-muted/30">
                    <tr>
                      <td colSpan={3} className="p-2 text-right font-semibold">Razem:</td>
                      <td className="p-2 text-right font-bold text-lg">{formatCurrency(totalAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Wstecz
                </Button>
                <div className="flex-1" />
                <Button variant="outline" onClick={() => setShowPreview(true)}>
                  <Eye className="h-4 w-4 mr-2" /> Podgląd
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Zapisz szkic
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{offerName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium">{clientName}</p>
              {clientEmail && <p className="text-muted-foreground">{clientEmail}</p>}
              {clientPhone && <p className="text-muted-foreground">{clientPhone}</p>}
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2">Pozycja</th>
                    <th className="text-right p-2">Wartość</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map(pos => (
                    <tr key={pos.id} className="border-t">
                      <td className="p-2">{pos.name} ({pos.qty} {pos.unit})</td>
                      <td className="text-right p-2">{formatCurrency(pos.qty * pos.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-right font-bold text-lg">
              Razem: {formatCurrency(totalAmount)}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
