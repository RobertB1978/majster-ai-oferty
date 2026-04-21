import BreachRegister from '@/components/admin/BreachRegister';
import { useAdminRole } from '@/hooks/useAdminRole';
import { ShieldOff } from 'lucide-react';

export default function AdminBreachPage() {
  const { isAdmin, isLoading } = useAdminRole();

  if (isLoading) return null;

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
        <ShieldOff className="h-10 w-10 opacity-40" />
        <p>Brak uprawnień do przeglądania rejestru naruszeń.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-6">
      <BreachRegister />
    </div>
  );
}
