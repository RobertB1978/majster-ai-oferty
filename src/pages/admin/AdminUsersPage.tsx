import { Helmet } from 'react-helmet-async';
import { AdminUsersManager } from '@/components/admin/AdminUsersManager';

export default function AdminUsersPage() {
  return (
    <>
      <Helmet>
        <title>Użytkownicy | Owner Console | Majster.AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AdminUsersManager />
    </>
  );
}
