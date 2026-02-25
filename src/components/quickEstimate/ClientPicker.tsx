import { useState } from 'react';
import { useClients, useAddClient } from '@/hooks/useClients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertCircle, Loader2, Plus, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientPickerProps {
  value: string;
  onChange: (id: string) => void;
  hasError?: boolean;
}

interface NewClientForm {
  name: string;
  phone: string;
  email: string;
}

export function ClientPicker({ value, onChange, hasError = false }: ClientPickerProps) {
  const { data: clients = [], isLoading } = useClients();
  const addClient = useAddClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [form, setForm] = useState<NewClientForm>({ name: '', phone: '', email: '' });

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    const newClient = await addClient.mutateAsync({
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address: null,
    });
    onChange(newClient.id);
    setShowAddDialog(false);
    setForm({ name: '', phone: '', email: '' });
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setShowAddDialog(false);
      setForm({ name: '', phone: '', email: '' });
    }
  };

  return (
    <>
      <Card className={cn('border', hasError && 'border-destructive')}>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            Klient
            <span className="text-destructive" aria-hidden="true">*</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4 space-y-2">
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className={cn(hasError && 'border-destructive focus:ring-destructive')}>
              <SelectValue
                placeholder={isLoading ? 'Ładowanie...' : 'Wybierz klienta'}
              />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
              {!isLoading && clients.length === 0 && (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  Brak klientów
                </div>
              )}
            </SelectContent>
          </Select>

          {hasError && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3 shrink-0" />
              Wybierz klienta przed zapisaniem wyceny
            </p>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Dodaj nowego klienta
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nowy klient</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="new-client-name">
                Nazwa <span className="text-destructive">*</span>
              </Label>
              <Input
                id="new-client-name"
                placeholder="np. Jan Kowalski"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-client-phone">Telefon</Label>
              <Input
                id="new-client-phone"
                placeholder="np. 600 100 200"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-client-email">Email</Label>
              <Input
                id="new-client-email"
                type="email"
                placeholder="np. jan@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Anuluj
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!form.name.trim() || addClient.isPending}
            >
              {addClient.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Dodaj klienta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
