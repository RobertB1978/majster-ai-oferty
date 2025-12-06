import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Plus, 
  MapPin, 
  Phone, 
  Mail, 
  MoreVertical,
  Play,
  Pause,
  Coffee,
  UserCheck
} from 'lucide-react';
import { TeamLocationMap } from '@/components/map/TeamLocationMap';
import { 
  useTeamMembers, 
  useAddTeamMember, 
  useUpdateTeamMember, 
  useDeleteTeamMember,
  useRecordLocation 
} from '@/hooks/useTeamMembers';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const roleLabels: Record<string, string> = {
  worker: 'Pracownik',
  foreman: 'Brygadzista',
  manager: 'Kierownik',
};

export default function Team() {
  const { data: members = [], isLoading } = useTeamMembers();
  const addMember = useAddTeamMember();
  const updateMember = useUpdateTeamMember();
  const deleteMember = useDeleteTeamMember();
  const recordLocation = useRecordLocation();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'worker',
  });

  const handleAddMember = async () => {
    if (!newMember.name.trim()) {
      toast.error('Podaj imię i nazwisko');
      return;
    }
    
    await addMember.mutateAsync({
      name: newMember.name,
      phone: newMember.phone || null,
      email: newMember.email || null,
      role: newMember.role,
      is_active: true,
    });
    
    setNewMember({ name: '', phone: '', email: '', role: 'worker' });
    setIsDialogOpen(false);
  };

  const handleStartWork = (memberId: string, status: 'working' | 'traveling' | 'break' | 'idle') => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          recordLocation.mutate({
            teamMemberId: memberId,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            status,
          });
          toast.success(`Status zmieniony na: ${status === 'working' ? 'Pracuje' : status === 'traveling' ? 'W drodze' : status === 'break' ? 'Przerwa' : 'Bezczynny'}`);
        },
        (error) => {
          toast.error('Nie można uzyskać lokalizacji');
        }
      );
    } else {
      toast.error('Geolokalizacja nie jest obsługiwana');
    }
  };

  return (
    <>
      <Helmet>
        <title>Zespół | Majster.AI</title>
        <meta name="description" content="Zarządzaj zespołem i śledź lokalizację pracowników" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              Zespół
            </h1>
            <p className="text-muted-foreground">
              Zarządzaj pracownikami i śledź ich lokalizację
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Dodaj pracownika
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nowy pracownik</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Imię i nazwisko *</Label>
                  <Input
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    placeholder="Jan Kowalski"
                  />
                </div>
                <div>
                  <Label>Telefon</Label>
                  <Input
                    value={newMember.phone}
                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                    placeholder="+48 123 456 789"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    placeholder="jan@example.com"
                  />
                </div>
                <div>
                  <Label>Stanowisko</Label>
                  <Select value={newMember.role} onValueChange={(v) => setNewMember({ ...newMember, role: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="worker">Pracownik</SelectItem>
                      <SelectItem value="foreman">Brygadzista</SelectItem>
                      <SelectItem value="manager">Kierownik</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddMember} className="w-full" disabled={addMember.isPending}>
                  Dodaj pracownika
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="map">
          <TabsList>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Mapa
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Lista ({members.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-4">
            <TeamLocationMap />
          </TabsContent>

          <TabsContent value="list" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {members.map((member) => (
                <Card key={member.id}>
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-base">{member.name}</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {roleLabels[member.role] || member.role}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => updateMember.mutate({ id: member.id, is_active: !member.is_active })}>
                          {member.is_active ? 'Dezaktywuj' : 'Aktywuj'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => deleteMember.mutate(member.id)}
                        >
                          Usuń
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {member.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <a href={`tel:${member.phone}`} className="hover:underline">
                          {member.phone}
                        </a>
                      </div>
                    )}
                    {member.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <a href={`mailto:${member.email}`} className="hover:underline">
                          {member.email}
                        </a>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Badge variant={member.is_active ? 'default' : 'secondary'}>
                        {member.is_active ? 'Aktywny' : 'Nieaktywny'}
                      </Badge>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStartWork(member.id, 'working')}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Praca
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStartWork(member.id, 'traveling')}
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        Dojazd
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStartWork(member.id, 'break')}
                      >
                        <Coffee className="h-3 w-3 mr-1" />
                        Przerwa
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {members.length === 0 && !isLoading && (
                <Card className="col-span-full">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">Brak pracowników</p>
                    <p className="text-sm text-muted-foreground">
                      Dodaj pierwszego pracownika do zespołu
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
