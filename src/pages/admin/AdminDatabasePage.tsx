import { Helmet } from 'react-helmet-async';
import { AdminDatabaseManager } from '@/components/admin/AdminDatabaseManager';

export default function AdminDatabasePage() {
  return (
    <>
      <Helmet>
        <title>Baza danych | Owner Console | Majster.AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AdminDatabaseManager />
    </>
  );
}
