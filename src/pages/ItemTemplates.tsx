import { useState } from 'react';
import { useItemTemplates, useCreateItemTemplate, useUpdateItemTemplate, useDeleteItemTemplate, ItemTemplate } from '@/hooks/useItemTemplates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Loader2, Package, Download } from 'lucide-react';
import { SearchInput } from '@/components/ui/search-input';
import { toast } from 'sonner';
import { defaultTemplates } from '@/data/defaultTemplates';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

const units = ['szt.', 'm²', 'm', 'mb', 'kg', 'l', 'worek', 'kpl.', 'godz.', 'dni'];
const categories = ['Materiał', 'Robocizna'] as const;

interface TemplateFormData {
  name: string;
  unit: string;
  default_qty: number;
  default_price: number;
  category: 'Materiał' | 'Robocizna';
  description: string;
}

const initialFormData: TemplateFormData = {
  name: '',
  unit: 'szt.',
  default_qty: 1,
  default_price: 0,
  category: 'Materiał',
  description: '',
};

export default function ItemTemplates() {
  const { data: templates, isLoading } = useItemTemplates();
  const createTemplate = useCreateItemTemplate();
  const updateTemplate = useUpdateItemTemplate();
  const deleteTemplate = useDeleteItemTemplate();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedDefaults, setSelectedDefaults] = useState<Set<number>>(new Set());
  const [editingTemplate, setEditingTemplate] = useState<ItemTemplate | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isImporting, setIsImporting] = useState(false);

  const handleImportSelected = async () => {
    if (selectedDefaults.size === 0) {
      toast.error('Wybierz szablony do importu');
      return;
    }
    setIsImporting(true);
    try {
      const toImport = defaultTemplates.filter((_, i) => selectedDefaults.has(i));
      for (const template of toImport) {
        await createTemplate.mutateAsync(template);
      }
      toast.success(`Zaimportowano ${toImport.length} szablonów`);
      setIsImportDialogOpen(false);
      setSelectedDefaults(new Set());
    } catch {
      toast.error('Błąd podczas importu');
    } finally {
      setIsImporting(false);
    }
  };

  const toggleDefaultTemplate = (index: number) => {
    const newSet = new Set(selectedDefaults);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedDefaults(newSet);
  };

  const selectAllDefaults = () => {
    if (selectedDefaults.size === defaultTemplates.length) {
      setSelectedDefaults(new Set());
    } else {
      setSelectedDefaults(new Set(defaultTemplates.map((_, i) => i)));
    }
  };

  const filteredTemplates = templates?.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                          (t.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Nazwa jest wymagana';
    if (formData.default_qty <= 0) newErrors.default_qty = 'Ilość musi być > 0';
    if (formData.default_price < 0) newErrors.default_price = 'Cena nie może być ujemna';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenDialog = (template?: ItemTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        unit: template.unit,
        default_qty: Number(template.default_qty),
        default_price: Number(template.default_price),
        category: template.category,
        description: template.description || '',
      });
    } else {
      setEditingTemplate(null);
      setFormData(initialFormData);
    }
    setErrors({});
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Popraw błędy w formularzu');
      return;
    }
    try {
      if (editingTemplate) {
        await updateTemplate.mutateAsync({ id: editingTemplate.id, ...formData });
      } else {
        await createTemplate.mutateAsync(formData);
      }
      setIsDialogOpen(false);
    } catch {}
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      await deleteTemplate.mutateAsync(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow shadow-md">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            Szablony pozycji
          </h1>
          <p className="mt-1 text-muted-foreground">
            Twórz szablony często używanych pozycji do szybszego tworzenia wycen.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Download className="mr-2 h-4 w-4" />
            Importuj gotowe
          </Button>
          <Button size="lg" onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-primary to-primary-glow">
            <Plus className="mr-2 h-5 w-5" />
            Nowy szablon
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          placeholder="Szukaj szablonu..."
          className="sm:w-64"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Kategoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie</SelectItem>
            <SelectItem value="Materiał">Materiał</SelectItem>
            <SelectItem value="Robocizna">Robocizna</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredTemplates?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              {templates?.length === 0 ? 'Brak szablonów.' : 'Brak wyników dla podanych filtrów.'}
            </p>
            {templates?.length === 0 && (
              <Button onClick={() => setIsImportDialogOpen(true)}>
                <Download className="mr-2 h-4 w-4" />
                Importuj gotowe szablony
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates?.map((template) => (
            <Card key={template.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <Badge variant={template.category === 'Materiał' ? 'default' : 'secondary'}>
                    {template.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Ilość: {template.default_qty} {template.unit}</p>
                  <p>Cena: {Number(template.default_price).toFixed(2)} zł</p>
                  {template.description && <p className="text-xs">{template.description}</p>}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenDialog(template)}>
                    <Edit className="mr-1 h-4 w-4" />
                    Edytuj
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteConfirmId(template.id)}>
                    <Trash2 className="mr-1 h-4 w-4" />
                    Usuń
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edytuj szablon' : 'Nowy szablon'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nazwa *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="np. Płytki ceramiczne 60x60"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Domyślna ilość *</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.default_qty}
                  onChange={(e) => setFormData({ ...formData, default_qty: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Jednostka</Label>
                <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (<SelectItem key={unit} value={unit}>{unit}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cena (zł)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.default_price}
                  onChange={(e) => setFormData({ ...formData, default_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Kategoria</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v as 'Materiał' | 'Robocizna' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Opis</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Dodatkowe informacje..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Anuluj</Button>
            <Button onClick={handleSave} disabled={createTemplate.isPending || updateTemplate.isPending}>
              {(createTemplate.isPending || updateTemplate.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTemplate ? 'Zapisz' : 'Utwórz'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importuj gotowe szablony</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">
              Wybrano: {selectedDefaults.size} z {defaultTemplates.length}
            </span>
            <Button variant="ghost" size="sm" onClick={selectAllDefaults}>
              {selectedDefaults.size === defaultTemplates.length ? 'Odznacz wszystko' : 'Zaznacz wszystko'}
            </Button>
          </div>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {defaultTemplates.map((template, index) => (
                <div
                  key={index}
                  onClick={() => toggleDefaultTemplate(index)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedDefaults.has(index) ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                  }`}
                >
                  <Checkbox checked={selectedDefaults.has(index)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{template.name}</span>
                      <Badge variant={template.category === 'Materiał' ? 'default' : 'secondary'} className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {template.default_qty} {template.unit} × {template.default_price} zł
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>Anuluj</Button>
            <Button onClick={handleImportSelected} disabled={isImporting || selectedDefaults.size === 0}>
              {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Importuj ({selectedDefaults.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć szablon?</AlertDialogTitle>
            <AlertDialogDescription>Ta operacja jest nieodwracalna.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Usuń</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}