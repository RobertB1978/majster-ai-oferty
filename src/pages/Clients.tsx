import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useClientsPaginated, useAddClient, useUpdateClient, useDeleteClient, Client } from '@/hooks/useClients';
import { useDebounce } from '@/hooks/useDebounce';
import { clientSchema } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchInput } from '@/components/ui/search-input';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Plus, Phone, Mail, MapPin, Pencil, Trash2, Users, Building2, Loader2, FileText } from 'lucide-react';
import { ClientsGridSkeleton } from '@/components/ui/skeleton-screens';
import { toast } from 'sonner';

interface ClientFormData {
  type: 'person' | 'company';
  name: string;
  company_name: string;
  nip: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

const INITIAL_FORM: ClientFormData = {
  type: 'person',
  name: '',
  company_name: '',
  nip: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
};

const PAGE_SIZE = 20;

export default function Clients() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const debouncedSearch = useDebounce(searchQuery, 300);

  const {
    data: paginatedResult,
    isLoading
  } = useClientsPaginated({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch,
  });

  const addClient = useAddClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const [isOpen, setIsOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clients = paginatedResult?.data || [];
  const totalPages = paginatedResult?.totalPages || 1;
  const totalCount = paginatedResult?.totalCount || 0;

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setIsOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setEditingClient(null);
    setErrors({});
  };

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        type: client.type || 'person',
        name: client.name,
        company_name: client.company_name || '',
        nip: client.nip || '',
        phone: client.phone || '',
        email: client.email || '',
        address: client.address || '',
        notes: client.notes || '',
      });
    } else {
      resetForm();
    }
    setIsOpen(true);
  };

  const validateForm = (): boolean => {
    const result = clientSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error(t('errors.formValidation'));
      return;
    }
    try {
      const payload = {
        type: formData.type,
        name: formData.name,
        company_name: formData.company_name || null,
        nip: formData.nip || null,
        phone: formData.phone || null,
        email: formData.email || null,
        address: formData.address || null,
        notes: formData.notes || null,
      };
      if (editingClient) {
        await updateClient.mutateAsync({ id: editingClient.id, ...payload });
      } else {
        await addClient.mutateAsync(payload);
      }
      setIsOpen(false);
      resetForm();
    } catch (_error) {
      // Error handled by hook
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`${t('clients.confirmDelete')} "${name}"?`)) {
      await deleteClient.mutateAsync(id);
    }
  };

  const showEmptyState = !isLoading && totalCount === 0 && !searchQuery;
  const showNoResults = !isLoading && clients.length === 0 && searchQuery;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            {t('clients.title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('clients.subtitle')}</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="lg" onClick={() => handleOpenDialog()} className="shadow-sm bg-primary hover:bg-primary/90 transition-colors">
              <Plus className="mr-2 h-5 w-5" />
              {t('clients.addClient')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {editingClient ? t('clients.editClient') : t('clients.newClient')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type selector */}
              <div className="space-y-2">
                <Label>{t('clients.type')}</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as 'person' | 'company' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="person">{t('clients.typePerson')}</SelectItem>
                    <SelectItem value="company">{t('clients.typeCompany')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">{t('clients.name')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('clients.namePlaceholder')}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              {/* Company name (visible for company type) */}
              {formData.type === 'company' && (
                <div className="space-y-2">
                  <Label htmlFor="company_name">{t('clients.companyName')}</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder={t('clients.companyNamePlaceholder')}
                    className={errors.company_name ? 'border-destructive' : ''}
                  />
                  {errors.company_name && <p className="text-sm text-destructive">{errors.company_name}</p>}
                </div>
              )}

              {/* NIP (visible for company type) */}
              {formData.type === 'company' && (
                <div className="space-y-2">
                  <Label htmlFor="nip">{t('clients.nip')}</Label>
                  <Input
                    id="nip"
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    placeholder={t('clients.nipPlaceholder')}
                    className={errors.nip ? 'border-destructive' : ''}
                  />
                  {errors.nip && <p className="text-sm text-destructive">{errors.nip}</p>}
                </div>
              )}

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">{t('clients.phone')}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={t('clients.phonePlaceholder')}
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">{t('clients.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t('clients.emailPlaceholder')}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">{t('clients.address')}</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={t('clients.addressPlaceholder')}
                  className={errors.address ? 'border-destructive' : ''}
                />
                {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">{t('clients.notes')}</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={t('clients.notesPlaceholder')}
                  rows={3}
                  className={errors.notes ? 'border-destructive' : ''}
                />
                {errors.notes && <p className="text-sm text-destructive">{errors.notes}</p>}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={addClient.isPending || updateClient.isPending}
              >
                {(addClient.isPending || updateClient.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingClient ? t('clients.saveChanges') : t('clients.addClient')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      {!showEmptyState && (
        <div className="max-w-md">
          <SearchInput
            placeholder={t('clients.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onClear={() => handleSearchChange('')}
          />
        </div>
      )}

      {isLoading ? (
        <ClientsGridSkeleton />
      ) : showEmptyState ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('clients.noClients')}</h3>
            <p className="text-muted-foreground mb-4">{t('clients.createFirst')}</p>
            <Button onClick={() => handleOpenDialog()} className="bg-primary">
              <Plus className="mr-2 h-4 w-4" />
              {t('clients.addClient')}
            </Button>
          </CardContent>
        </Card>
      ) : showNoResults ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-2">{t('common.none')}</p>
            <Button variant="outline" onClick={() => handleSearchChange('')}>
              {t('clients.clearSearch')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clients.map((client, index) => (
              <Card key={client.id} className="group hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-start justify-between text-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        {client.type === 'company'
                          ? <Building2 className="h-4 w-4 text-primary" />
                          : <Users className="h-4 w-4 text-primary" />}
                      </div>
                      <span className="line-clamp-1">{client.name}</span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenDialog(client)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(client.id, client.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {client.company_name && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4 shrink-0" />
                      <span className="truncate">{client.company_name}</span>
                    </div>
                  )}
                  {client.nip && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4 shrink-0" />
                      <span>{t('clients.nip')}: {client.nip}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 shrink-0" />
                      <a
                        href={`tel:${client.phone}`}
                        className="hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {client.phone}
                      </a>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 shrink-0" />
                      <a
                        href={`mailto:${client.email}`}
                        className="truncate hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {client.email}
                      </a>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      <span className="line-clamp-2">{client.address}</span>
                    </div>
                  )}
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
    </div>
  );
}
