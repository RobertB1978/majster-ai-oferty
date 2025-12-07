import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  Plus, 
  Users, 
  Settings,
  Crown,
  Shield,
  UserPlus,
  Loader2,
  Trash2
} from 'lucide-react';
import { 
  useOrganizations, 
  useOrganizationMembers,
  useCreateOrganization, 
  useRemoveMember,
  useUpdateMemberRole
} from '@/hooks/useOrganizations';
import { cn } from '@/lib/utils';

export function OrganizationManager() {
  const { t } = useTranslation();
  const { data: organizations, isLoading } = useOrganizations();
  const createOrg = useCreateOrganization();
  const removeMember = useRemoveMember();
  const updateRole = useUpdateMemberRole();
  
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');

  const { data: members } = useOrganizationMembers(selectedOrg);

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) return;
    
    await createOrg.mutateAsync({
      name: newOrgName,
      slug: newOrgSlug || newOrgName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    });
    
    setIsCreateDialogOpen(false);
    setNewOrgName('');
    setNewOrgSlug('');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin': return <Shield className="h-4 w-4 text-primary" />;
      default: return <Users className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{t('organizations.title', 'Organizacje')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('organizations.subtitle', 'Zarządzaj zespołami i firmami')}
            </p>
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('organizations.create', 'Utwórz organizację')}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Organizations list */}
        <div className="lg:col-span-1 space-y-3">
          <Label className="text-sm font-medium">{t('organizations.yourOrganizations', 'Twoje organizacje')}</Label>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : organizations && organizations.length > 0 ? (
            <div className="space-y-2">
              {organizations.map((org) => (
                <Card 
                  key={org.id}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-md',
                    selectedOrg === org.id && 'ring-2 ring-primary'
                  )}
                  onClick={() => setSelectedOrg(org.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{org.name}</p>
                        <p className="text-xs text-muted-foreground">/{org.slug}</p>
                      </div>
                      <Badge variant="outline">{org.plan_id}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {t('organizations.noOrganizations', 'Brak organizacji')}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('organizations.createFirst', 'Utwórz pierwszą')}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Members panel */}
        <div className="lg:col-span-2">
          {selectedOrg ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {t('organizations.members', 'Członkowie')}
                    </CardTitle>
                    <CardDescription>
                      {members?.length || 0} {t('organizations.membersCount', 'członków')}
                    </CardDescription>
                  </div>
                  <Button size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t('organizations.invite', 'Zaproś')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {members && members.length > 0 ? (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div 
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getRoleIcon(member.role)}
                          <div>
                            <p className="font-medium text-sm">{member.user_id.substring(0, 8)}...</p>
                            <p className="text-xs text-muted-foreground">
                              {member.accepted_at ? 'Zaakceptowano' : 'Oczekuje'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select 
                            value={member.role}
                            onValueChange={(value) => updateRole.mutate({
                              memberId: member.id,
                              organizationId: selectedOrg,
                              role: value as 'admin' | 'manager' | 'member'
                            })}
                            disabled={member.role === 'owner'}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">{t('organizations.roles.admin', 'Admin')}</SelectItem>
                              <SelectItem value="manager">{t('organizations.roles.manager', 'Manager')}</SelectItem>
                              <SelectItem value="member">{t('organizations.roles.member', 'Członek')}</SelectItem>
                            </SelectContent>
                          </Select>
                          {member.role !== 'owner' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => removeMember.mutate({
                                memberId: member.id,
                                organizationId: selectedOrg
                              })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {t('organizations.noMembers', 'Brak członków')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {t('organizations.selectOrg', 'Wybierz organizację, aby zarządzać członkami')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Organization Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t('organizations.create', 'Utwórz organizację')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="org-name">{t('organizations.name', 'Nazwa organizacji')}</Label>
              <Input
                id="org-name"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="Moja Firma Budowlana"
              />
            </div>
            <div>
              <Label htmlFor="org-slug">{t('organizations.slug', 'Identyfikator URL')}</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">/</span>
                <Input
                  id="org-slug"
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="moja-firma"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('organizations.slugHint', 'Zostanie użyty w adresie URL. Tylko małe litery, cyfry i myślniki.')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              {t('common.cancel', 'Anuluj')}
            </Button>
            <Button onClick={handleCreateOrg} disabled={createOrg.isPending || !newOrgName.trim()}>
              {createOrg.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('common.save', 'Utwórz')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
