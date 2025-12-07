import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Users, 
  Search, 
  MoreHorizontal, 
  Shield, 
  UserX, 
  Mail, 
  Calendar,
  Crown,
  UserCog,
  Ban,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface UserProfile {
  id: string;
  user_id: string;
  company_name: string;
  owner_name: string | null;
  email_for_offers: string | null;
  created_at: string;
}

interface UserSubscription {
  plan_id: string;
  status: string;
}

export function AdminUsersManager() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);

  // Fetch all profiles
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserProfile[];
    },
  });

  // Fetch user roles
  const { data: userRoles } = useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*');

      if (error) throw error;
      return data;
    },
  });

  // Fetch subscriptions
  const { data: subscriptions } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('user_id, plan_id, status');

      if (error) throw error;
      return data;
    },
  });

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'moderator' | 'user' }) => {
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: role,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      toast.success('Rola przypisana pomyślnie');
      setRoleDialogOpen(false);
    },
    onError: () => {
      toast.error('Błąd podczas przypisywania roli');
    },
  });

  // Remove role mutation
  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'moderator' | 'user' }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      toast.success('Rola usunięta');
    },
  });

  const getUserRole = (userId: string) => {
    const role = userRoles?.find(r => r.user_id === userId);
    return role?.role;
  };

  const getUserSubscription = (userId: string): UserSubscription | null => {
    const sub = subscriptions?.find(s => s.user_id === userId);
    return sub || null;
  };

  const filteredUsers = users?.filter(user => {
    const search = searchQuery.toLowerCase();
    return (
      user.company_name?.toLowerCase().includes(search) ||
      user.owner_name?.toLowerCase().includes(search) ||
      user.email_for_offers?.toLowerCase().includes(search)
    );
  });

  const getPlanBadgeVariant = (planId: string | undefined) => {
    switch (planId) {
      case 'enterprise': return 'default';
      case 'business': return 'secondary';
      case 'starter': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Zarządzanie użytkownikami
        </CardTitle>
        <CardDescription>
          Przeglądaj, edytuj i zarządzaj kontami użytkowników
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Szukaj użytkownika..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="outline">
            {filteredUsers?.length || 0} użytkowników
          </Badge>
        </div>

        {/* Users Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Firma / Użytkownik</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Rola</TableHead>
                <TableHead>Data rejestracji</TableHead>
                <TableHead className="w-[70px]">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Ładowanie...
                  </TableCell>
                </TableRow>
              ) : filteredUsers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Brak użytkowników
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers?.map((user) => {
                  const role = getUserRole(user.user_id);
                  const subscription = getUserSubscription(user.user_id);
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {role === 'admin' ? (
                              <Crown className="h-5 w-5 text-yellow-600" />
                            ) : role === 'moderator' ? (
                              <Shield className="h-5 w-5 text-blue-600" />
                            ) : (
                              <Users className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{user.company_name || 'Brak nazwy'}</p>
                            <p className="text-sm text-muted-foreground">{user.owner_name || '-'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{user.email_for_offers || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPlanBadgeVariant(subscription?.plan_id)}>
                          {subscription?.plan_id || 'free'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {role ? (
                          <Badge 
                            variant={role === 'admin' ? 'default' : 'secondary'}
                            className="flex items-center gap-1 w-fit"
                          >
                            {role === 'admin' && <Crown className="h-3 w-3" />}
                            {role === 'moderator' && <Shield className="h-3 w-3" />}
                            {role}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">user</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(user.created_at), 'dd MMM yyyy', { locale: pl })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Akcje</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setRoleDialogOpen(true);
                              }}
                            >
                              <UserCog className="h-4 w-4 mr-2" />
                              Zarządzaj rolami
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Wyślij email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Ban className="h-4 w-4 mr-2" />
                              Zablokuj konto
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Role Dialog */}
        <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Zarządzaj rolami użytkownika</DialogTitle>
              <DialogDescription>
                {selectedUser?.company_name} ({selectedUser?.owner_name})
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4"
                  onClick={() => selectedUser && assignRoleMutation.mutate({ 
                    userId: selectedUser.user_id, 
                    role: 'admin' as const
                  })}
                >
                  <Crown className="h-6 w-6 text-yellow-600" />
                  <span>Admin</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4"
                  onClick={() => selectedUser && assignRoleMutation.mutate({ 
                    userId: selectedUser.user_id, 
                    role: 'moderator' as const
                  })}
                >
                  <Shield className="h-6 w-6 text-blue-600" />
                  <span>Moderator</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4"
                  onClick={() => selectedUser && removeRoleMutation.mutate({ 
                    userId: selectedUser.user_id, 
                    role: getUserRole(selectedUser.user_id) || '' 
                  })}
                >
                  <UserX className="h-6 w-6 text-muted-foreground" />
                  <span>Usuń rolę</span>
                </Button>
              </div>
              
              {selectedUser && getUserRole(selectedUser.user_id) && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Aktualna rola: <strong>{getUserRole(selectedUser.user_id)}</strong></span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
                Zamknij
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
