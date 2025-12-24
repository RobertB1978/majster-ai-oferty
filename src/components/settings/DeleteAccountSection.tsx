/**
 * GDPR-compliant Account Deletion Component
 *
 * Umożliwia użytkownikowi całkowite usunięcie konta i wszystkich danych
 * zgodnie z Art. 17 RODO (Right to Erasure / Right to be Forgotten)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function DeleteAccountSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;

    if (confirmText !== 'DELETE') {
      toast.error('Proszę wpisać DELETE aby potwierdzić');
      return;
    }

    setIsDeleting(true);

    try {
      // Wywołaj Edge Function do usunięcia konta i wszystkich danych
      const { data, error } = await supabase.functions.invoke('delete-user-account', {
        body: { userId: user.id },
      });

      if (error) throw error;

      // Wyloguj użytkownika
      await supabase.auth.signOut();

      toast.success('Konto zostało usunięte', {
        description: 'Wszystkie Twoje dane zostały trwale usunięte.',
      });

      // Przekieruj do strony głównej
      navigate('/login');
    } catch (error: unknown) {
      console.error('Error deleting account:', error);
      toast.error('Błąd przy usuwaniu konta', {
        description: error.message || 'Spróbuj ponownie później',
      });
    } finally {
      setIsDeleting(false);
      setIsDialogOpen(false);
      setConfirmText('');
    }
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Strefa Niebezpieczna
        </CardTitle>
        <CardDescription>
          Nieodwracalne działania dotyczące Twojego konta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Usunięcie konta jest <strong>nieodwracalne</strong>. Wszystkie Twoje dane, projekty,
            klienci, wyceny i dokumenty zostaną trwale usunięte.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <h4 className="font-medium">Co zostanie usunięte:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Wszystkie projekty i wyceny</li>
            <li>Wszyscy klienci i ich dane kontaktowe</li>
            <li>Historia finansowa i faktury</li>
            <li>Kalendarz i wydarzenia</li>
            <li>Szablony pozycji i ustawienia</li>
            <li>Profil firmowy i dokumenty</li>
            <li>Konto użytkownika i dane logowania</li>
          </ul>
        </div>

        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <Trash2 className="mr-2 h-4 w-4" />
              Usuń Konto Całkowicie
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Czy na pewno chcesz usunąć konto?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <p>
                  Ta operacja jest <strong className="text-destructive">NIEODWRACALNA</strong>.
                  Wszystkie Twoje dane zostaną trwale usunięte z naszych systemów zgodnie z RODO.
                </p>
                <p>Przed usunięciem konta rozważ:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Eksport ważnych danych (projekty, klienci)</li>
                  <li>Pobranie kopii faktur i dokumentów</li>
                  <li>Anulowanie aktywnej subskrypcji</li>
                </ul>
                <div className="space-y-2 pt-4">
                  <Label htmlFor="confirm-delete">
                    Wpisz <code className="font-mono font-bold">DELETE</code> aby potwierdzić:
                  </Label>
                  <Input
                    id="confirm-delete"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    disabled={isDeleting}
                    autoComplete="off"
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={confirmText !== 'DELETE' || isDeleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isDeleting ? 'Usuwanie...' : 'Usuń Konto Trwale'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <p className="text-xs text-muted-foreground">
          Zgodnie z Art. 17 RODO (Prawo do Bycia Zapomnianym), masz prawo do usunięcia wszystkich
          swoich danych osobowych. Operacja zajmuje do 30 dni.
        </p>
      </CardContent>
    </Card>
  );
}
