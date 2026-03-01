import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useLineItemsPaginated,
  useCreateLineItem,
  useUpdateLineItem,
  useDeleteLineItem,
  useToggleLineItemFavorite,
  LineItem,
  LineItemType,
} from '@/hooks/useLineItems';
import { useDebounce } from '@/hooks/useDebounce';
import { lineItemSchema } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/ui/search-input';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Plus, Edit, Trash2, Loader2, BookOpen, Star } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const UNITS = ['szt.', 'm²', 'm', 'mb', 'kg', 'l', 'worek', 'kpl.', 'godz.', 'dni', 'ryczałt'];

const ITEM_TYPES: LineItemType[] = ['material', 'labor', 'service', 'travel', 'lump_sum'];

const VAT_RATES = [0, 5, 8, 23];

interface FormData {
  name: string;
  category: string;
  description: string;
  unit: string;
  unit_price_net: number;
  vat_rate: number | undefined;
  item_type: LineItemType;
  favorite: boolean;
}

const INITIAL_FORM: FormData = {
  name: '',
  category: '',
  description: '',
  unit: 'szt.',
  unit_price_net: 0,
  vat_rate: 23,
  item_type: 'material',
  favorite: false,
};

const PAGE_SIZE = 20;

export default function PriceLibrary() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | LineItemType>('all');

  const debouncedSearch = useDebounce(search, 300);

  const { data: paginatedResult, isLoading } = useLineItemsPaginated({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch,
    item_type: typeFilter,
  });

  const createItem = useCreateLineItem();
  const updateItem = useUpdateLineItem();
  const deleteItem = useDeleteLineItem();
  const toggleFavorite = useToggleLineItemFavorite();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LineItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const items = paginatedResult?.data || [];
  const totalPages = paginatedResult?.totalPages || 1;
  const totalCount = paginatedResult?.totalCount || 0;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleTypeChange = (value: string) => {
    setTypeFilter(value as 'all' | LineItemType);
    setPage(1);
  };

  const handleOpenDialog = (item?: LineItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category || '',
        description: item.description || '',
        unit: item.unit,
        unit_price_net: Number(item.unit_price_net),
        vat_rate: item.vat_rate != null ? Number(item.vat_rate) : undefined,
        item_type: item.item_type,
        favorite: item.favorite,
      });
    } else {
      setEditingItem(null);
      setFormData(INITIAL_FORM);
    }
    setErrors({});
    setIsDialogOpen(true);
  };

  const validateForm = (): boolean => {
    const result = lineItemSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) newErrors[err.path[0] as string] = err.message;
      });
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error(t('errors.formValidation'));
      return;
    }
    try {
      const payload = {
        name: formData.name,
        category: formData.category || null,
        description: formData.description || null,
        unit: formData.unit,
        unit_price_net: formData.unit_price_net,
        vat_rate: formData.vat_rate ?? null,
        item_type: formData.item_type,
        favorite: formData.favorite,
      };
      if (editingItem) {
        await updateItem.mutateAsync({ id: editingItem.id, ...payload });
      } else {
        await createItem.mutateAsync(payload);
      }
      setIsDialogOpen(false);
    } catch (_error) {
      // Error handled by hook
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      await deleteItem.mutateAsync(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleToggleFavorite = async (item: LineItem) => {
    await toggleFavorite.mutateAsync({ id: item.id, favorite: !item.favorite });
  };

  const showEmptyState = !isLoading && totalCount === 0 && !search && typeFilter === 'all';
  const showNoResults = !isLoading && items.length === 0 && (search || typeFilter !== 'all');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            {t('priceLibrary.title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('priceLibrary.subtitle')}</p>
        </div>
        <Button
          size="lg"
          onClick={() => handleOpenDialog()}
          className="shadow-sm bg-primary hover:bg-primary/90 transition-colors"
        >
          <Plus className="mr-2 h-5 w-5" />
          {t('priceLibrary.addItem')}
        </Button>
      </div>

      {/* Filters */}
      {!showEmptyState && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            onClear={() => handleSearchChange('')}
            placeholder={t('priceLibrary.searchPlaceholder')}
            className="sm:max-w-xs"
          />
          <Select value={typeFilter} onValueChange={handleTypeChange}>
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder={t('priceLibrary.filterByType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {ITEM_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`priceLibrary.types.${type}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : showEmptyState ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('priceLibrary.noItems')}</h3>
            <p className="text-muted-foreground mb-4">{t('priceLibrary.noItemsDesc')}</p>
            <Button onClick={() => handleOpenDialog()} className="bg-primary">
              <Plus className="mr-2 h-4 w-4" />
              {t('priceLibrary.addFirstItem')}
            </Button>
          </CardContent>
        </Card>
      ) : showNoResults ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-2">{t('priceLibrary.noResults')}</p>
            <Button variant="outline" onClick={() => { handleSearchChange(''); setTypeFilter('all'); }}>
              {t('common.clearFilters')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-medium leading-tight line-clamp-2">
                        {item.name}
                      </CardTitle>
                      {item.category && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.category}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => handleToggleFavorite(item)}
                        className={cn(
                          'h-7 w-7 flex items-center justify-center rounded transition-colors',
                          item.favorite
                            ? 'text-amber-500 hover:text-amber-600'
                            : 'text-muted-foreground hover:text-amber-400'
                        )}
                        title={t(item.favorite ? 'priceLibrary.unfavorite' : 'priceLibrary.favorite')}
                      >
                        <Star className={cn('h-4 w-4', item.favorite && 'fill-current')} />
                      </button>
                      <Badge
                        variant={item.item_type === 'labor' ? 'secondary' : 'default'}
                        className="text-xs shrink-0"
                      >
                        {t(`priceLibrary.types.${item.item_type}`)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm mb-3">
                    <p className="font-semibold text-foreground">
                      {Number(item.unit_price_net).toFixed(2)} {t('priceLibrary.currencyNet')} / {item.unit}
                    </p>
                    {item.vat_rate != null && (
                      <p className="text-xs text-muted-foreground">
                        {t('priceLibrary.vat')}: {item.vat_rate}%
                      </p>
                    )}
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(item)}>
                      <Edit className="mr-1 h-3 w-3" />
                      {t('common.edit')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteConfirmId(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

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
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? t('priceLibrary.editItem') : t('priceLibrary.newItem')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Name */}
            <div>
              <Label>{t('common.name')} *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('priceLibrary.namePlaceholder')}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
            </div>

            {/* Item type */}
            <div>
              <Label>{t('priceLibrary.itemType')} *</Label>
              <Select
                value={formData.item_type}
                onValueChange={(v) => setFormData({ ...formData, item_type: v as LineItemType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`priceLibrary.types.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div>
              <Label>{t('priceLibrary.category')}</Label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder={t('priceLibrary.categoryPlaceholder')}
              />
            </div>

            {/* Unit + Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('priceLibrary.unit')} *</Label>
                <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.unit && <p className="mt-1 text-xs text-destructive">{errors.unit}</p>}
              </div>
              <div>
                <Label>{t('priceLibrary.unitPriceNet')} *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unit_price_net}
                  onChange={(e) => setFormData({ ...formData, unit_price_net: parseFloat(e.target.value) || 0 })}
                  className={errors.unit_price_net ? 'border-destructive' : ''}
                />
                {errors.unit_price_net && <p className="mt-1 text-xs text-destructive">{errors.unit_price_net}</p>}
              </div>
            </div>

            {/* VAT rate */}
            <div>
              <Label>{t('priceLibrary.vatRate')}</Label>
              <Select
                value={formData.vat_rate?.toString() ?? ''}
                onValueChange={(v) => setFormData({ ...formData, vat_rate: v ? Number(v) : undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('priceLibrary.vatRatePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {VAT_RATES.map((rate) => (
                    <SelectItem key={rate} value={rate.toString()}>{rate}%</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <Label>{t('common.description')}</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('priceLibrary.descriptionPlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button
              onClick={handleSave}
              disabled={createItem.isPending || updateItem.isPending}
            >
              {(createItem.isPending || updateItem.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingItem ? t('common.save') : t('priceLibrary.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('priceLibrary.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('dialogs.irreversibleOperation')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
