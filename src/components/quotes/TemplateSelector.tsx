import { useState } from 'react';
import { useItemTemplates, ItemTemplate } from '@/hooks/useItemTemplates';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SearchInput } from '@/components/ui/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Plus, Loader2 } from 'lucide-react';

interface TemplateSelectorProps {
  onSelectTemplate: (template: ItemTemplate) => void;
}

export function TemplateSelector({ onSelectTemplate }: TemplateSelectorProps) {
  const { data: templates, isLoading } = useItemTemplates();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredTemplates = templates?.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSelect = (template: ItemTemplate) => {
    onSelectTemplate(template);
    setOpen(false);
    setSearch('');
    setCategoryFilter('all');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg">
          <Package className="mr-2 h-5 w-5" />
          Dodaj z szablonu
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Wybierz szablon</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4 sm:flex-row">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
            placeholder="Szukaj..."
            className="flex-1"
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="sm:w-36">
              <SelectValue placeholder="Kategoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie</SelectItem>
              <SelectItem value="Materiał">Materiał</SelectItem>
              <SelectItem value="Robocizna">Robocizna</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTemplates?.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {templates?.length === 0 
                ? 'Brak szablonów. Utwórz szablony w zakładce "Szablony pozycji".'
                : 'Brak wyników.'
              }
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTemplates?.map((template) => (
                <Card 
                  key={template.id} 
                  className="cursor-pointer transition-colors hover:bg-accent"
                  onClick={() => handleSelect(template)}
                >
                  <CardContent className="flex items-center justify-between p-3">
                    <div>
                      <p className="font-medium">{template.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {template.default_qty} {template.unit} × {Number(template.default_price).toFixed(2)} zł
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${
                        template.category === 'Materiał' 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                          : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      }`}>
                        {template.category}
                      </span>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
