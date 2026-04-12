import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { formatDate } from '@/lib/formatters';
import { useClientsPaginated, useAddClient, useUpdateClient, useDeleteClient, Client } from '@/hooks/useClients';
import { useDebounce } from '@/hooks/useDebounce';
import { clientSchema } from '@/lib/validations';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SearchInput } from '@/components/ui/search-input';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Plus, Phone, Mail, MapPin, Pencil, Trash2, Users, Loader2, FileText, FolderKanban, ArrowUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ClientsGridSkeleton } from '@/components/ui/skeleton-screens';
import { toast } from 'sonner';
import EmptyClients from '@/components/illustrations/EmptyClients';

interface ClientFormData {
  name: string;
  nip: string;
  phone: string;
  email: string;
  address: string;
}

type SortBy = 'newest' | 'oldest' | 'name_asc' | 'name_desc';

const PAGE_SIZE = 20;

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0] ?? '')
    .join('')
    .toUpperCase() || '?';
}

export default function Clients() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('newest');

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Paginated query with server-side search and sort
  const {
    data: paginatedResult,
    isLoading
  } = useClientsPaginated({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch,
    sortBy,
  });

  const addClient = useAddClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const [isOpen, setIsOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    nip: '',
    phone: '',
    email: '',
    address: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clients = paginatedResult?.data || [];
  const totalPages = paginatedResult?.totalPages || 1;
  const totalCount = paginatedResult?.totalCount || 0;

  // Auto-open modal when navigating to /app/customers/new
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setIsOpen(true);
      // Clean up the URL by removing the query param
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Reset to page 1 when search or sort changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value as SortBy);
    setPage(1);
  };

  const resetForm = () => {
    setFormData({ name: '', nip: '', phone: '', email: '', address: '' });
    setEditingClient(null);
    setErrors({});
  };

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        nip: client.nip || '',
        phone: client.phone || '',
        email: client.email || '',
        address: client.address || '',
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

    // Normalize NIP: trim whitespace so that blank-only input is treated as no NIP
    const normalizedData = { ...formData, nip: formData.nip.trim() };

    try {
      if (editingClient) {
        await updateClient.mutateAsync({ id: editingClient.id, ...normalizedData });
      } else {
        await addClient.mutateAsync(normalizedData);
      }
      setIsOpen(false);
      resetForm();
    } catch (_error) {
      // Error handled by hook
    }
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    await deleteClient.mutateAsync(clientToDelete.id);
    setClientToDelete(null);
  };

  const showEmptyState = !isLoading && totalCount === 0 && !searchQuery;
  const showNoResults = !isLoading && clients.length === 0 && searchQuery;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl flex items-center gap-3">
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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {editingClient ? t('clients.editClient') : t('clients.newClient')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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

      {/* Search + Sort toolbar */}
      {!showEmptyState && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-md flex-1">
            <SearchInput
              placeholder={t('clients.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onClear={() => handleSearchChange('')}
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t('clients.sortNewest')}</SelectItem>
                <SelectItem value="oldest">{t('clients.sortOldest')}</SelectItem>
                <SelectItem value="name_asc">{t('clients.sortNameAsc')}</SelectItem>
                <SelectItem value="name_desc">{t('clients.sortNameDesc')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Total count */}
      {!showEmptyState && !isLoading && totalCount > 0 && (
        <p className="text-sm text-muted-foreground">
          {t('clients.totalCount', { count: totalCount })}
        </p>
      )}

      {isLoading ? (
        <ClientsGridSkeleton />
      ) : showEmptyState ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-8 text-center">
            <EmptyClients size={160} className="mx-auto mb-2" />
            <h3 className="text-lg font-semibold mb-2">{t('clients.noClients')}</h3>
            <p className="text-muted-foreground mb-4">{t('clients.createFirst')}</p>
            <Button onClick={() => handleOpenDialog()} className="bg-primary min-h-[44px]">
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
              <Card key={client.id} className="group hover:shadow-card-hover motion-safe:hover:-translate-y-1 transition-all duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-start justify-between text-lg gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                          {getInitials(client.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="line-clamp-2 leading-tight">{client.name}</span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 min-h-[44px] min-w-[44px]"
                        onClick={() => handleOpenDialog(client)}
                        aria-label={t('clients.editClient')}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
                        onClick={() => setClientToDelete(client)}
                        aria-label={t('clients.deleteClient')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {client.nip && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium text-xs text-muted-foreground/70">NIP</span>
                      <span>{client.nip}</span>
                    </div>
                  )}
                  {client.phone && (
                    <a
                      href={`tel:${client.phone.replace(/\s/g, '')}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Phone className="h-4 w-4 shrink-0" />
                      <span>{client.phone}</span>
                    </a>
                  )}
                  {client.email && (
                    <a
                      href={`mailto:${client.email}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </a>
                  )}
                  {client.address && (
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(client.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      <span className="line-clamp-2">{client.address}</span>
                    </a>
                  )}
                  {/* Data dodania */}
                  {client.created_at && (
                    <div className="flex items-center gap-1 pt-1 text-xs text-muted-foreground/60">
                      <span>{t('clients.addedOn', { date: formatDate(client.created_at, i18n.language) })}</span>
                    </div>
                  )}
                  {/* Nawigacja relacyjna: oferty i projekty tego klienta */}
                  <div className="flex gap-2 pt-2 mt-2 border-t">
                    <Button variant="ghost" size="sm" className="h-11 min-h-[44px] text-xs px-2" asChild>
                      <Link to={`/app/offers?client=${encodeURIComponent(client.name)}`}>
                        <FileText className="h-3 w-3 mr-1" />
                        {t('clients.offers')}
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-11 min-h-[44px] text-xs px-2" asChild>
                      <Link to={`/app/projects?client=${encodeURIComponent(client.name)}`}>
                        <FolderKanban className="h-3 w-3 mr-1" />
                        {t('clients.projects')}
                      </Link>
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

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!clientToDelete} onOpenChange={(open) => { if (!open) setClientToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('clients.deleteClient')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('clients.deleteConfirmDesc', { name: clientToDelete?.name ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              onClick={handleDeleteConfirm}
              disabled={deleteClient.isPending}
            >
              {deleteClient.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('clients.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
