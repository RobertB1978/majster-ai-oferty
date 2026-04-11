import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  Search,
  Edit,
  Trash2,
  Activity,
} from 'lucide-react';
import { TeamLocationMap } from '@/components/map/TeamLocationMap';
import {
  useTeamMembers,
  useAddTeamMember,
  useUpdateTeamMember,
  useDeleteTeamMember,
  useRecordLocation,
  useTeamLocations,
  type TeamMember,
  type TeamLocation,
} from '@/hooks/useTeamMembers';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

const STATUS_COLORS: Record<string, string> = {
  working: '#22c55e',
  traveling: '#3b82f6',
  break: '#f59e0b',
  idle: '#6b7280',
};

function MemberCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Team() {
  const { t } = useTranslation();
  const { data: members = [], isLoading } = useTeamMembers();
  const addMember = useAddTeamMember();
  const updateMember = useUpdateTeamMember();
  const deleteMember = useDeleteTeamMember();
  const recordLocation = useRecordLocation();
  const { data: locations = [] } = useTeamLocations();

  // Latest status per member
  const latestStatusMap = useMemo(() => {
    const map = new Map<string, TeamLocation['status']>();
    (locations as Array<TeamLocation & { team_members?: { name: string } }>).forEach((loc) => {
      if (!map.has(loc.team_member_id)) {
        map.set(loc.team_member_id, loc.status);
      }
    });
    return map;
  }, [locations]);

  // Stats
  const stats = useMemo(() => {
    const activeMembers = members.filter((m) => m.is_active).length;
    const statuses = Array.from(latestStatusMap.values());
    return {
      total: members.length,
      active: activeMembers,
      working: statuses.filter((s) => s === 'working').length,
      onBreak: statuses.filter((s) => s === 'break').length,
    };
  }, [members, latestStatusMap]);

  // Search
  const [search, setSearch] = useState('');
  const filteredMembers = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.phone?.includes(q),
    );
  }, [members, search]);

  // Add / Edit dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'worker',
  });

  const openAddDialog = () => {
    setEditingMember(null);
    setFormData({ name: '', phone: '', email: '', role: 'worker' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      phone: member.phone || '',
      email: member.email || '',
      role: member.role,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error(t('errors.required'));
      return;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error(t('errors.invalidEmail'));
      return;
    }

    try {
      if (editingMember) {
        await updateMember.mutateAsync({
          id: editingMember.id,
          name: formData.name,
          phone: formData.phone || null,
          email: formData.email || null,
          role: formData.role,
        });
      } else {
        await addMember.mutateAsync({
          name: formData.name,
          phone: formData.phone || null,
          email: formData.email || null,
          role: formData.role,
          is_active: true,
        });
      }
      setIsDialogOpen(false);
    } catch {
      // Error toast shown by mutation onError callback — dialog stays open for retry
    }
  };

  // Delete confirmation
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);

  const handleConfirmDelete = () => {
    if (deletingMember) {
      deleteMember.mutate(deletingMember.id);
      setDeletingMember(null);
    }
  };

  const handleStartWork = (
    memberId: string,
    status: 'working' | 'traveling' | 'break' | 'idle',
  ) => {
    if (!('geolocation' in navigator)) {
      toast.error(t('errors.geolocationUnavailable'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        recordLocation.mutate(
          {
            teamMemberId: memberId,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            status,
          },
          {
            onSuccess: () => {
              toast.success(
                `${t('common.status')}: ${t(`team.statuses.${status}`)}`,
                { id: 'team-status-update' },
              );
            },
          },
        );
      },
      () => {
        toast.error(t('errors.geolocationDenied'));
      },
    );
  };

  // Signal to CSS that a Leaflet map is on this page.
  // Disables backdrop-filter on shell chrome — prevents GPU compositing
  // conflicts with Leaflet tiles on Android Chrome.
  useEffect(() => {
    document.body.setAttribute('data-has-leaflet-map', 'true');
    return () => document.body.removeAttribute('data-has-leaflet-map');
  }, []);

  const roleLabels: Record<string, string> = {
    worker: t('team.roles.worker'),
    foreman: t('team.roles.foreman'),
    manager: t('team.roles.manager'),
  };

  const isSaving = addMember.isPending || updateMember.isPending;

  return (
    <>
      <Helmet>
        <title>{t('team.title')} | Majster.AI</title>
        <meta name="description" content={t('team.subtitle')} />
      </Helmet>

      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm">
                <Users className="h-5 w-5 text-primary-foreground" />
              </div>
              {t('team.title')}
            </h1>
            <p className="text-muted-foreground mt-1">{t('team.subtitle')}</p>
          </div>

          <Button
            size="lg"
            className="shadow-sm bg-primary hover:bg-primary/90 transition-colors"
            onClick={openAddDialog}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('team.addMember')}
          </Button>
        </div>

        {/* Stats bar */}
        {(members.length > 0 || isLoading) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: t('team.stats.total'), value: stats.total, color: 'text-foreground', icon: <Users className="h-4 w-4" /> },
              { label: t('team.stats.active'), value: stats.active, color: 'text-primary', icon: <Activity className="h-4 w-4" /> },
              { label: t('team.stats.working'), value: stats.working, color: '', style: { color: STATUS_COLORS.working }, icon: <Play className="h-4 w-4" /> },
              { label: t('team.stats.onBreak'), value: stats.onBreak, color: '', style: { color: STATUS_COLORS.break }, icon: <Coffee className="h-4 w-4" /> },
            ].map((stat) => (
              <Card key={stat.label} className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-muted-foreground">{stat.icon}</span>
                  {isLoading ? (
                    <Skeleton className="h-7 w-8" />
                  ) : (
                    <span
                      className={`text-2xl font-bold ${stat.color}`}
                      style={'style' in stat ? stat.style : undefined}
                    >
                      {stat.value}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
              </Card>
            ))}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="map">
          <TabsList className="bg-muted/50">
            <TabsTrigger
              value="map"
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <MapPin className="h-4 w-4" />
              {t('team.mapView')}
            </TabsTrigger>
            <TabsTrigger
              value="list"
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Users className="h-4 w-4" />
              {t('team.listView')} ({members.length})
            </TabsTrigger>
          </TabsList>

          {/* Map tab */}
          <TabsContent value="map" className="mt-4">
            <TeamLocationMap />
          </TabsContent>

          {/* List tab */}
          <TabsContent value="list" className="mt-4 space-y-4">
            {/* Search */}
            {members.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  className="pl-9"
                  placeholder={t('team.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Loading skeletons */}
              {isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <MemberCardSkeleton key={i} />
                ))}

              {/* Member cards */}
              {!isLoading &&
                filteredMembers.map((member, index) => {
                  const workStatus = latestStatusMap.get(member.id);

                  return (
                    <Card
                      key={member.id}
                      className={`group hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 ${!member.is_active ? 'opacity-60' : ''}`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <CardHeader className="flex flex-row items-start justify-between pb-2">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-lg font-semibold text-primary">
                                {member.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            {/* Status dot */}
                            {member.is_active && workStatus && workStatus !== 'idle' && (
                              <span
                                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background"
                                style={{ backgroundColor: STATUS_COLORS[workStatus] }}
                              />
                            )}
                          </div>
                          <div>
                            <CardTitle className="text-base leading-tight">
                              {member.name}
                            </CardTitle>
                            <Badge variant="secondary" className="text-xs mt-0.5">
                              {roleLabels[member.role] || member.role}
                            </Badge>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="min-h-[44px] min-w-[44px]"
                              aria-label={t('team.memberOptions')}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(member)}>
                              <Edit className="h-4 w-4 mr-2" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                updateMember.mutate({
                                  id: member.id,
                                  is_active: !member.is_active,
                                })
                              }
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              {member.is_active ? t('common.inactive') : t('common.active')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeletingMember(member)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        {member.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4 shrink-0" />
                            <a href={`tel:${member.phone}`} className="hover:underline truncate">
                              {member.phone}
                            </a>
                          </div>
                        )}
                        {member.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4 shrink-0" />
                            <a
                              href={`mailto:${member.email}`}
                              className="hover:underline truncate"
                            >
                              {member.email}
                            </a>
                          </div>
                        )}

                        {/* Status badge */}
                        <div className="flex items-center gap-2 pt-1 border-t">
                          {workStatus && member.is_active ? (
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: STATUS_COLORS[workStatus] }}
                              />
                              <Badge variant="default" className="text-xs">
                                {t(`team.statuses.${workStatus}`)}
                              </Badge>
                            </div>
                          ) : (
                            <Badge
                              variant={member.is_active ? 'outline' : 'secondary'}
                              className="text-xs"
                            >
                              {member.is_active ? t('common.active') : t('common.inactive')}
                            </Badge>
                          )}
                        </div>

                        {/* Action buttons */}
                        {member.is_active && (
                          <div className="flex flex-wrap gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 min-w-0 text-xs h-8"
                              onClick={() => handleStartWork(member.id, 'working')}
                              disabled={recordLocation.isPending}
                            >
                              <Play className="h-3 w-3 mr-1 shrink-0" />
                              <span className="truncate">{t('team.startWork')}</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 min-w-0 text-xs h-8"
                              onClick={() => handleStartWork(member.id, 'traveling')}
                              disabled={recordLocation.isPending}
                            >
                              <MapPin className="h-3 w-3 mr-1 shrink-0" />
                              <span className="truncate">{t('team.traveling')}</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 min-w-0 text-xs h-8"
                              onClick={() => handleStartWork(member.id, 'break')}
                              disabled={recordLocation.isPending}
                            >
                              <Coffee className="h-3 w-3 mr-1 shrink-0" />
                              <span className="truncate">{t('team.onBreak')}</span>
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

              {/* No results after search */}
              {!isLoading && members.length > 0 && filteredMembers.length === 0 && (
                <Card className="col-span-full border-dashed border-2">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Search className="h-10 w-10 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground text-sm">{t('common.none')}</p>
                  </CardContent>
                </Card>
              )}

              {/* Empty state */}
              {!isLoading && members.length === 0 && (
                <Card className="col-span-full border-dashed border-2">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{t('team.noMembers')}</h3>
                    <p className="text-muted-foreground mb-4 text-sm text-center">
                      {t('team.noMembersDesc')}
                    </p>
                    <Button onClick={openAddDialog} className="bg-primary">
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

      {/* Add / Edit dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              {editingMember ? t('team.editMember') : t('team.addMember')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="member-name">
                {t('team.name')} *
              </Label>
              <Input
                id="member-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('team.namePlaceholder')}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>
            <div>
              <Label htmlFor="member-phone">{t('team.phone')}</Label>
              <Input
                id="member-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder={t('team.phonePlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="member-email">{t('team.email')}</Label>
              <Input
                id="member-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t('team.emailPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="member-role">{t('team.role')}</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => setFormData({ ...formData, role: v })}
              >
                <SelectTrigger id="member-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="worker">{t('team.roles.worker')}</SelectItem>
                  <SelectItem value="foreman">{t('team.roles.foreman')}</SelectItem>
                  <SelectItem value="manager">{t('team.roles.manager')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
              >
                {t('common.cancel')}
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={isSaving}
              >
                {editingMember ? t('team.saveChanges') : t('team.addMember')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingMember} onOpenChange={(o) => !o && setDeletingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('team.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('team.deleteConfirmDesc', { name: deletingMember?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              {t('team.deleteConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
