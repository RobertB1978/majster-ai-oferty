import { useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
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
  Coffee,
  UserCheck,
  Loader2
} from 'lucide-react';

// Lazy-load map to avoid bundling Leaflet (~150KB) with Team page
const TeamLocationMap = lazy(() => import('@/components/map/TeamLocationMap').then(m => ({ default: m.TeamLocationMap })));
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

export default function Team() {
  const { t } = useTranslation();
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

  const roleLabels: Record<string, string> = {
    worker: t('team.roles.worker'),
    foreman: t('team.roles.foreman'),
    manager: t('team.roles.manager'),
  };

  const statusLabels: Record<string, string> = {
    working: t('team.statuses.working'),
    traveling: t('team.statuses.traveling'),
    break: t('team.statuses.break'),
    idle: t('team.statuses.idle'),
  };

  const handleAddMember = async () => {
    if (!newMember.name.trim()) {
      toast.error(t('errors.required'));
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
          toast.success(`${t('common.status')}: ${statusLabels[status]}`);
        },
        (_error) => {
          toast.error(t('errors.networkError'));
        }
      );
    } else {
      toast.error(t('errors.networkError'));
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('team.title')} | Majster.AI</title>
        <meta name="description" content={t('team.subtitle')} />
      </Helmet>

      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow shadow-md">
                <Users className="h-5 w-5 text-primary-foreground" />
              </div>
              {t('team.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('team.subtitle')}
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-lg bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all duration-300">
                <Plus className="h-4 w-4 mr-2" />
                {t('team.addMember')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  {t('team.addMember')}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>{t('team.name')} *</Label>
                  <Input
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    placeholder="Jan Kowalski"
                  />
                </div>
                <div>
                  <Label>{t('team.phone')}</Label>
                  <Input
                    value={newMember.phone}
                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                    placeholder="+48 123 456 789"
                  />
                </div>
                <div>
                  <Label>{t('team.email')}</Label>
                  <Input
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    placeholder="jan@example.com"
                  />
                </div>
                <div>
                  <Label>{t('team.role')}</Label>
                  <Select value={newMember.role} onValueChange={(v) => setNewMember({ ...newMember, role: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="worker">{t('team.roles.worker')}</SelectItem>
                      <SelectItem value="foreman">{t('team.roles.foreman')}</SelectItem>
                      <SelectItem value="manager">{t('team.roles.manager')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddMember} className="w-full" disabled={addMember.isPending}>
                  {t('team.addMember')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="map">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="map" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <MapPin className="h-4 w-4" />
              {t('team.mapView')}
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Users className="h-4 w-4" />
              {t('team.listView')} ({members.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-4">
            <Card className="overflow-hidden">
              <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
                <TeamLocationMap />
              </Suspense>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {members.map((member, index) => (
                <Card key={member.id} className="group hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300" style={{ animationDelay: `${index * 50}ms` }}>
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
                          {member.is_active ? t('common.inactive') : t('common.active')}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => deleteMember.mutate(member.id)}
                        >
                          {t('common.delete')}
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
                        {member.is_active ? t('common.active') : t('common.inactive')}
                      </Badge>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStartWork(member.id, 'working')}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        {t('team.startWork')}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStartWork(member.id, 'traveling')}
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        {t('team.traveling')}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStartWork(member.id, 'break')}
                      >
                        <Coffee className="h-3 w-3 mr-1" />
                        {t('team.onBreak')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {members.length === 0 && !isLoading && (
                <Card className="col-span-full border-dashed border-2">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{t('team.noMembers')}</h3>
                    <p className="text-muted-foreground mb-4">
                      {t('team.noMembersDesc')}
                    </p>
                    <Button onClick={() => setIsDialogOpen(true)} className="bg-gradient-to-r from-primary to-primary-glow">
                      <Plus className="mr-2 h-4 w-4" />
                      {t('team.addMember')}
                    </Button>
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