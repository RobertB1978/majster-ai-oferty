import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Store, 
  Search, 
  Plus, 
  MapPin,
  Star,
  Filter,
  Users
} from 'lucide-react';
import { SubcontractorCard } from '@/components/marketplace/SubcontractorCard';
import { useMySubcontractors, usePublicSubcontractors, useAddSubcontractor } from '@/hooks/useSubcontractors';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function Marketplace() {
  const { data: mySubcontractors = [], isLoading: loadingMy } = useMySubcontractors();
  const { data: publicSubcontractors = [], isLoading: loadingPublic } = usePublicSubcontractors();
  const addSubcontractor = useAddSubcontractor();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [newSubcontractor, setNewSubcontractor] = useState({
    company_name: '',
    contact_name: '',
    phone: '',
    email: '',
    description: '',
    location_city: '',
    hourly_rate: '',
    is_public: false,
  });

  const handleAddSubcontractor = async () => {
    if (!newSubcontractor.company_name.trim()) {
      toast.error('Podaj nazwę firmy');
      return;
    }
    
    await addSubcontractor.mutateAsync({
      company_name: newSubcontractor.company_name,
      contact_name: newSubcontractor.contact_name || null,
      phone: newSubcontractor.phone || null,
      email: newSubcontractor.email || null,
      description: newSubcontractor.description || null,
      location_city: newSubcontractor.location_city || null,
      location_lat: null,
      location_lng: null,
      hourly_rate: newSubcontractor.hourly_rate ? Number(newSubcontractor.hourly_rate) : null,
      is_public: newSubcontractor.is_public,
      avatar_url: null,
      portfolio_images: [],
    });
    
    setNewSubcontractor({
      company_name: '',
      contact_name: '',
      phone: '',
      email: '',
      description: '',
      location_city: '',
      hourly_rate: '',
      is_public: false,
    });
    setIsDialogOpen(false);
  };

  const filteredPublic = publicSubcontractors.filter((sub) => {
    const matchesSearch = sub.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCity = !cityFilter || sub.location_city?.toLowerCase().includes(cityFilter.toLowerCase());
    return matchesSearch && matchesCity;
  });

  const cities = [...new Set(publicSubcontractors.map(s => s.location_city).filter(Boolean))] as string[];

  return (
    <>
      <Helmet>
        <title>Marketplace | Majster.AI</title>
        <meta name="description" content="Znajdź i zarządzaj podwykonawcami" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Store className="h-6 w-6" />
              Marketplace podwykonawców
            </h1>
            <p className="text-muted-foreground">
              Znajdź podwykonawców lub dodaj własnych
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Dodaj podwykonawcę
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nowy podwykonawca</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <Label>Nazwa firmy *</Label>
                  <Input
                    value={newSubcontractor.company_name}
                    onChange={(e) => setNewSubcontractor({ ...newSubcontractor, company_name: e.target.value })}
                    placeholder="Firma Budowlana XYZ"
                  />
                </div>
                <div>
                  <Label>Osoba kontaktowa</Label>
                  <Input
                    value={newSubcontractor.contact_name}
                    onChange={(e) => setNewSubcontractor({ ...newSubcontractor, contact_name: e.target.value })}
                    placeholder="Jan Kowalski"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Telefon</Label>
                    <Input
                      value={newSubcontractor.phone}
                      onChange={(e) => setNewSubcontractor({ ...newSubcontractor, phone: e.target.value })}
                      placeholder="+48 123 456 789"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      value={newSubcontractor.email}
                      onChange={(e) => setNewSubcontractor({ ...newSubcontractor, email: e.target.value })}
                      placeholder="kontakt@firma.pl"
                    />
                  </div>
                </div>
                <div>
                  <Label>Miasto</Label>
                  <Input
                    value={newSubcontractor.location_city}
                    onChange={(e) => setNewSubcontractor({ ...newSubcontractor, location_city: e.target.value })}
                    placeholder="Warszawa"
                  />
                </div>
                <div>
                  <Label>Stawka godzinowa (PLN)</Label>
                  <Input
                    type="number"
                    value={newSubcontractor.hourly_rate}
                    onChange={(e) => setNewSubcontractor({ ...newSubcontractor, hourly_rate: e.target.value })}
                    placeholder="80"
                  />
                </div>
                <div>
                  <Label>Opis usług</Label>
                  <Textarea
                    value={newSubcontractor.description}
                    onChange={(e) => setNewSubcontractor({ ...newSubcontractor, description: e.target.value })}
                    placeholder="Specjalizujemy się w..."
                    rows={3}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Profil publiczny</Label>
                    <p className="text-xs text-muted-foreground">
                      Inni użytkownicy zobaczą tę firmę
                    </p>
                  </div>
                  <Switch
                    checked={newSubcontractor.is_public}
                    onCheckedChange={(checked) => setNewSubcontractor({ ...newSubcontractor, is_public: checked })}
                  />
                </div>
                <Button onClick={handleAddSubcontractor} className="w-full" disabled={addSubcontractor.isPending}>
                  Dodaj podwykonawcę
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="public">
          <TabsList>
            <TabsTrigger value="public" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Marketplace ({publicSubcontractors.length})
            </TabsTrigger>
            <TabsTrigger value="my" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Moi podwykonawcy ({mySubcontractors.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="public" className="mt-4 space-y-4">
            {/* Search and filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Szukaj podwykonawców..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-[180px]">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Miasto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Wszystkie miasta</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Public subcontractors grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPublic.map((subcontractor) => (
                <SubcontractorCard key={subcontractor.id} subcontractor={subcontractor} />
              ))}

              {filteredPublic.length === 0 && !loadingPublic && (
                <Card className="col-span-full">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Store className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">Brak podwykonawców</p>
                    <p className="text-sm text-muted-foreground">
                      Spróbuj zmienić kryteria wyszukiwania
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="my" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mySubcontractors.map((subcontractor) => (
                <SubcontractorCard key={subcontractor.id} subcontractor={subcontractor} />
              ))}

              {mySubcontractors.length === 0 && !loadingMy && (
                <Card className="col-span-full">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">Brak własnych podwykonawców</p>
                    <p className="text-sm text-muted-foreground">
                      Dodaj podwykonawców, z którymi współpracujesz
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
