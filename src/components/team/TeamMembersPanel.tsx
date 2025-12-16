import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Phone, Mail, Trash2, Edit, MapPin } from 'lucide-react';
import { useTeamMembers, useAddTeamMember, useUpdateTeamMember, useDeleteTeamMember } from '@/hooks/useTeamMembers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function TeamMembersPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'worker',
    is_active: true
  });

  const { data: members = [], isLoading } = useTeamMembers();
  const addMember = useAddTeamMember();
  const updateMember = useUpdateTeamMember();
  const deleteMember = useDeleteTeamMember();

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', role: 'worker', is_active: true });
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!formData.name) return;

    if (editingId) {
      await updateMember.mutateAsync({ id: editingId, ...formData });
    } else {
      await addMember.mutateAsync(formData);
    }
    
    setIsOpen(false);
    resetForm();
  };

  const handleEdit = (member: unknown) => {
    setFormData({
      name: member.name,
      phone: member.phone || '',
      email: member.email || '',
      role: member.role,
      is_active: member.is_active
    });
    setEditingId(member.id);
    setIsOpen(true);
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'manager': return 'Kierownik';
      case 'foreman': return 'Brygadzista';
      case 'worker': return 'Pracownik';
      default: return role;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Zespół ({members.length})
          </span>
          <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Dodaj
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edytuj pracownika' : 'Dodaj pracownika'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Imię i nazwisko *</Label>
                  <Input 
                    value={formData.name} 
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input 
                    value={formData.phone} 
                    onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    value={formData.email} 
                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rola</Label>
                  <Select value={formData.role} onValueChange={(v) => setFormData(p => ({ ...p, role: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">Kierownik</SelectItem>
                      <SelectItem value="foreman">Brygadzista</SelectItem>
                      <SelectItem value="worker">Pracownik</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSubmit} className="w-full">
                  {editingId ? 'Zapisz zmiany' : 'Dodaj pracownika'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Brak pracowników</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div 
                key={member.id} 
                className={`p-4 rounded-lg border ${member.is_active ? 'bg-card' : 'bg-muted opacity-60'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-medium text-primary">
                        {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {getRoleName(member.role)}
                        </Badge>
                        {!member.is_active && <Badge variant="secondary">Nieaktywny</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(member)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => deleteMember.mutate(member.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                
                {(member.phone || member.email) && (
                  <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                    {member.phone && (
                      <a href={`tel:${member.phone}`} className="flex items-center gap-1 hover:text-foreground">
                        <Phone className="h-3 w-3" />
                        {member.phone}
                      </a>
                    )}
                    {member.email && (
                      <a href={`mailto:${member.email}`} className="flex items-center gap-1 hover:text-foreground">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
