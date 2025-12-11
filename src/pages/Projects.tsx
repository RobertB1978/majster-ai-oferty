import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProjectsPaginated, useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchInput } from '@/components/ui/search-input';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Plus, Loader2, FolderKanban, Download } from 'lucide-react';
import { exportProjectsToCSV } from '@/lib/exportUtils';

const statusColors: Record<string, string> = {
  'Nowy': 'bg-muted text-muted-foreground',
  'Wycena w toku': 'bg-warning/10 text-warning',
  'Oferta wysłana': 'bg-primary/10 text-primary',
  'Zaakceptowany': 'bg-success/10 text-success',
};

const PAGE_SIZE = 20;

export default function Projects() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Nowy' | 'Wycena w toku' | 'Oferta wysłana' | 'Zaakceptowany'>('all');

  // Paginated query with server-side filtering
  const {
    data: paginatedResult,
    isLoading
  } = useProjectsPaginated({
    page,
    pageSize: PAGE_SIZE,
    search: searchQuery,
    status: statusFilter,
  });

  // For CSV export - fetch all projects (only when needed)
  const { data: allProjects = [] } = useProjects();

  const projects = paginatedResult?.data || [];
  const totalPages = paginatedResult?.totalPages || 1;
  const totalCount = paginatedResult?.totalCount || 0;

  const statusOptions = [
    { value: 'all', label: t('projects.allStatuses') },
    { value: 'Nowy', label: t('projects.statuses.new') },
    { value: 'Wycena w toku', label: t('projects.statuses.inProgress') },
    { value: 'Oferta wysłana', label: t('projects.statuses.sent') },
    { value: 'Zaakceptowany', label: t('projects.statuses.accepted') },
  ];

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as typeof statusFilter);
    setPage(1);
  };

  // Show empty state only when no filters are applied
  const showEmptyState = !isLoading && totalCount === 0 && !searchQuery && statusFilter === 'all';
  const showNoResults = !isLoading && projects.length === 0 && (searchQuery || statusFilter !== 'all');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow shadow-md">
              <FolderKanban className="h-5 w-5 text-primary-foreground" />
            </div>
            {t('projects.title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('projects.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          {totalCount > 0 && (
            <Button variant="outline" onClick={() => exportProjectsToCSV(allProjects)} className="hover:bg-primary/5">
              <Download className="mr-2 h-4 w-4" />
              {t('projects.exportBtn')}
            </Button>
          )}
          <Button size="lg" onClick={() => navigate('/projects/new')} className="shadow-lg bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all duration-300">
            <Plus className="mr-2 h-5 w-5" />
            {t('projects.newProject')}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      {!showEmptyState && (
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1 max-w-md">
            <SearchInput
              placeholder={t('projects.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onClear={() => handleSearchChange('')}
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={t('projects.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          </div>
        </div>
      ) : showEmptyState ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <FolderKanban className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('projects.noProjects')}</h3>
            <p className="text-muted-foreground mb-4">{t('projects.createFirst')}</p>
            <Button onClick={() => navigate('/projects/new')} className="bg-gradient-to-r from-primary to-primary-glow">
              <Plus className="mr-2 h-4 w-4" />
              {t('projects.newProject')}
            </Button>
          </CardContent>
        </Card>
      ) : showNoResults ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-2">{t('common.none')}</p>
            <div className="mt-2 flex justify-center gap-2">
              {searchQuery && (
                <Button variant="outline" size="sm" onClick={() => handleSearchChange('')}>
                  Wyczyść wyszukiwanie
                </Button>
              )}
              {statusFilter !== 'all' && (
                <Button variant="outline" size="sm" onClick={() => handleStatusChange('all')}>
                  {t('common.all')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {projects.map((project, index) => (
              <Card key={project.id} className="group hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300" style={{ animationDelay: `${index * 30}ms` }}>
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1 flex-1">
                    <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{project.project_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('projects.client')}: {project.clients?.name || t('common.none')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={statusColors[project.status] || statusColors['Nowy']}>
                      {project.status}
                    </Badge>
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      {t('projects.open')}
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
    </div>
  );
}
