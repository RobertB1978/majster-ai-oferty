import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useItemTemplatesPaginated, useCreateItemTemplate, useUpdateItemTemplate, useDeleteItemTemplate, ItemTemplate } from '@/hooks/useItemTemplates';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Loader2, Package, Download, Filter } from 'lucide-react';
import { SearchInput } from '@/components/ui/search-input';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { toast } from 'sonner';
import { defaultTemplates, trades } from '@/data/defaultTemplates';
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

const PAGE_SIZE = 20;

export default function ItemTemplates() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Materiał' | 'Robocizna'>('all');

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(search, 300);

  // Paginated query with server-side filtering
  const {
    data: paginatedResult,
    isLoading
  } = useItemTemplatesPaginated({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch,
    category: categoryFilter,
  });

  const createTemplate = useCreateItemTemplate();
  const updateTemplate = useUpdateItemTemplate();
  const deleteTemplate = useDeleteItemTemplate();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedDefaults, setSelectedDefaults] = useState<Set<number>>(new Set());
  const [importTradeFilter, setImportTradeFilter] = useState<string>('all');
  const [editingTemplate, setEditingTemplate] = useState<ItemTemplate | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isImporting, setIsImporting] = useState(false);

  const templates = paginatedResult?.data || [];
  const totalPages = paginatedResult?.totalPages || 1;
  const totalCount = paginatedResult?.totalCount || 0;

  const filteredDefaultTemplates = defaultTemplates.filter(t => 
    importTradeFilter === 'all' || t.trade === importTradeFilter
  );

  const handleImportSelected = async () => {
    if (selectedDefaults.size === 0) {
      toast.error(t('errors.selectTemplates'));
      return;
    }
    setIsImporting(true);
    try {
      const toImport = defaultTemplates.filter((_, i) => selectedDefaults.has(i));
      for (const template of toImport) {
        await createTemplate.mutateAsync({
          name: template.name,
          unit: template.unit,
          default_qty: template.default_qty,
          default_price: template.default_price,
          category: template.category,
          description: template.description,
        });
      }
      toast.success(t('messages.templatesImported', { count: toImport.length }));
      setIsImportDialogOpen(false);
      setSelectedDefaults(new Set());
    } catch {
      toast.error(t('errors.importFailed'));
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

  const selectAllFiltered = () => {
    const filteredIndices = defaultTemplates
      .map((t, i) => (importTradeFilter === 'all' || t.trade === importTradeFilter) ? i : -1)
      .filter(i => i !== -1);
    
    const allSelected = filteredIndices.every(i => selectedDefaults.has(i));
    
    if (allSelected) {
      const newSet = new Set(selectedDefaults);
      filteredIndices.forEach(i => newSet.delete(i));
      setSelectedDefaults(newSet);
    } else {
      const newSet = new Set(selectedDefaults);
      filteredIndices.forEach(i => newSet.add(i));
      setSelectedDefaults(newSet);
    }
  };

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value as typeof categoryFilter);
    setPage(1);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = t('validation.nameRequired');
    if (formData.default_qty <= 0) newErrors.default_qty = t('validation.quantityMustBePositive');
    if (formData.default_price < 0) newErrors.default_price = t('validation.priceCannotBeNegative');
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
      toast.error(t('errors.formValidation'));
      return;
    }
    try {
      if (editingTemplate) {
        await updateTemplate.mutateAsync({ id: editingTemplate.id, ...formData });
      } else {
        await createTemplate.mutateAsync(formData);
      }
      setIsDialogOpen(false);
    } catch (error) {
      // Error is already handled by the mutation hook's onError callback
      console.error('Failed to save template:', error);
    }
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            {t('templates.title')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t('templates.count', { count: totalCount })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Download className="mr-2 h-4 w-4" />
            {t('templates.import')} ({defaultTemplates.length})
          </Button>
          <Button onClick={() => handleOpenDialog()} className="bg-primary">
            <Plus className="mr-2 h-5 w-5" />
            {t('templates.newTemplate')}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <SearchInput
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          onClear={() => handleSearchChange('')}
          placeholder={t('templates.searchPlaceholder')}
          className="sm:w-64"
        />
        <Select value={categoryFilter} onValueChange={handleCategoryChange}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder={t('templates.category')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="Materiał">{t('templates.categories.material')}</SelectItem>
            <SelectItem value="Robocizna">{t('templates.categories.labor')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              {totalCount === 0 && !search && categoryFilter === 'all' ? t('templates.noTemplates') : t('templates.noResults')}
            </p>
            {totalCount === 0 && !search && categoryFilter === 'all' && (
              <Button onClick={() => setIsImportDialogOpen(true)}>
                <Download className="mr-2 h-4 w-4" />
                {t('templates.importReady')}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-medium leading-tight">{template.name}</CardTitle>
                  <Badge
                    variant={template.category === 'Materiał' ? 'default' : 'secondary'}
                    className="shrink-0 text-xs"
                  >
                    {template.category === 'Materiał'
                      ? t('templates.categories.material')
                      : t('templates.categories.labor')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>{template.default_qty} {template.unit} × {Number(template.default_price).toFixed(0)} zł</p>
                  {template.description && (
                    <p className="text-xs line-clamp-2">{template.description}</p>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenDialog(template)}>
                    <Edit className="mr-1 h-3 w-3" />
                    {t('common.edit')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteConfirmId(template.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={PAGE_SIZE}
            totalItems={totalCount}
          />
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTemplate ? t('templates.editTemplate') : t('templates.newTemplate')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>{t('common.name')} *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('templates.namePlaceholder')}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('templates.quantity')}</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.default_qty}
                  onChange={(e) => setFormData({ ...formData, default_qty: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>{t('templates.unit')}</Label>
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
                <Label>{t('templates.price')}</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.default_price}
                  onChange={(e) => setFormData({ ...formData, default_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>{t('templates.category')}</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v as 'Materiał' | 'Robocizna' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Materiał">{t('templates.categories.material')}</SelectItem>
                    <SelectItem value="Robocizna">{t('templates.categories.labor')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>{t('common.description')}</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('templates.descriptionPlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={createTemplate.isPending || updateTemplate.isPending}>
              {(createTemplate.isPending || updateTemplate.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTemplate ? t('common.save') : t('templates.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              {t('templates.importDialogTitle', { count: defaultTemplates.length })}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-2 py-2 border-b">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={importTradeFilter} onValueChange={setImportTradeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('templates.filterByTrade')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('templates.allTrades')}</SelectItem>
                {trades.map(trade => (
                  <SelectItem key={trade} value={trade}>{trade}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {t('templates.selected')}: {selectedDefaults.size}
              </span>
              <Button variant="ghost" size="sm" onClick={selectAllFiltered}>
                {t('templates.selectVisible')}
              </Button>
            </div>
          </div>
          
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-1">
              {filteredDefaultTemplates.map((template, _index) => {
                const originalIndex = defaultTemplates.indexOf(template);
                return (
                  <div
                    key={originalIndex}
                    onClick={() => toggleDefaultTemplate(originalIndex)}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      selectedDefaults.has(originalIndex) ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50 border-transparent'
                    }`}
                  >
                    <Checkbox checked={selectedDefaults.has(originalIndex)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{template.name}</span>
                        <Badge variant={template.category === 'Materiał' ? 'default' : 'secondary'} className="text-xs shrink-0">
                          {template.category === 'Materiał'
                            ? t('templates.categories.material')
                            : t('templates.categories.labor')}
                        </Badge>
                        {template.trade && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            {template.trade}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {template.default_qty} {template.unit} × {template.default_price} zł
                        {template.description && ` • ${template.description}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button
              onClick={handleImportSelected}
              disabled={isImporting || selectedDefaults.size === 0}
              className="bg-primary"
            >
              {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('templates.import')} ({selectedDefaults.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.deleteTemplate')}</AlertDialogTitle>
            <AlertDialogDescription>{t('dialogs.irreversibleOperation')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}