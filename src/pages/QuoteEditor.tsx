import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { QuotePosition } from '@/types';

const units = ['szt.', 'm²', 'm', 'mb', 'kg', 'l', 'worek', 'kpl.', 'godz.', 'dni'];
const categories = ['Materiał', 'Robocizna'] as const;

export default function QuoteEditor() {
  const { id } = useParams<{ id: string }>();
  const { getProjectById, getQuoteByProjectId, saveQuote } = useData();
  const navigate = useNavigate();

  const project = getProjectById(id!);
  const existingQuote = getQuoteByProjectId(id!);

  const [positions, setPositions] = useState<QuotePosition[]>(existingQuote?.positions || []);
  const [marginPercent, setMarginPercent] = useState(existingQuote?.margin_percent || 10);

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

  const addPosition = () => {
    const newPosition: QuotePosition = {
      id: crypto.randomUUID(),
      name: '',
      qty: 1,
      unit: 'szt.',
      price: 0,
      category: 'Materiał',
    };
    setPositions([...positions, newPosition]);
  };

  const updatePosition = (positionId: string, field: keyof QuotePosition, value: any) => {
    setPositions(positions.map(p => 
      p.id === positionId ? { ...p, [field]: value } : p
    ));
  };

  const removePosition = (positionId: string) => {
    setPositions(positions.filter(p => p.id !== positionId));
  };

  const summaryMaterials = positions
    .filter(p => p.category === 'Materiał')
    .reduce((sum, p) => sum + p.qty * p.price, 0);

  const summaryLabor = positions
    .filter(p => p.category === 'Robocizna')
    .reduce((sum, p) => sum + p.qty * p.price, 0);

  const subtotal = summaryMaterials + summaryLabor;
  const total = subtotal * (1 + marginPercent / 100);

  const handleSave = () => {
    if (positions.length === 0) {
      toast.error('Dodaj przynajmniej jedną pozycję');
      return;
    }

    const emptyPositions = positions.filter(p => !p.name.trim());
    if (emptyPositions.length > 0) {
      toast.error('Uzupełnij nazwy wszystkich pozycji');
      return;
    }

    saveQuote(id!, positions, marginPercent);
    toast.success('Wycena zapisana');
    navigate(`/projects/${id}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" onClick={() => navigate(`/projects/${id}`)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Powrót do projektu
      </Button>

      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Wycena — {project.project_name}
        </h1>
      </div>

      <Button size="lg" onClick={addPosition}>
        <Plus className="mr-2 h-5 w-5" />
        Dodaj pozycję
      </Button>

      {/* Positions */}
      <div className="space-y-4">
        {positions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                Brak pozycji. Kliknij "Dodaj pozycję" aby rozpocząć wycenę.
              </p>
            </CardContent>
          </Card>
        ) : (
          positions.map((position, index) => (
            <Card key={position.id} className="animate-slide-in">
              <CardContent className="p-4">
                <div className="grid gap-4 sm:grid-cols-12">
                  <div className="sm:col-span-4">
                    <Label className="text-xs text-muted-foreground">Nazwa pozycji</Label>
                    <Input
                      value={position.name}
                      onChange={(e) => updatePosition(position.id, 'name', e.target.value)}
                      placeholder="np. Płytki ceramiczne"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <Label className="text-xs text-muted-foreground">Ilość</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={position.qty}
                      onChange={(e) => updatePosition(position.id, 'qty', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">Jednostka</Label>
                    <Select value={position.unit} onValueChange={(v) => updatePosition(position.id, 'unit', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">Cena jedn. (zł)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={position.price}
                      onChange={(e) => updatePosition(position.id, 'price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">Kategoria</Label>
                    <Select value={position.category} onValueChange={(v) => updatePosition(position.id, 'category', v as 'Materiał' | 'Robocizna')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end sm:col-span-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removePosition(position.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 text-right text-sm font-medium">
                  Suma: <span className="text-primary">{(position.qty * position.price).toFixed(2)} zł</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Podsumowanie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Suma materiałów:</span>
            <span className="font-medium">{summaryMaterials.toFixed(2)} zł</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Suma robocizny:</span>
            <span className="font-medium">{summaryLabor.toFixed(2)} zł</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Marża (%):</span>
            <Input
              type="number"
              min="0"
              max="100"
              className="w-24"
              value={marginPercent}
              onChange={(e) => setMarginPercent(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="border-t border-border pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Kwota całkowita:</span>
              <span className="text-primary">{total.toFixed(2)} zł</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button size="lg" onClick={handleSave} className="w-full sm:w-auto">
        <Save className="mr-2 h-5 w-5" />
        Zapisz wycenę
      </Button>
    </div>
  );
}
