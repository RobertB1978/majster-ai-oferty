import { Helmet } from 'react-helmet-async';
import { AdminSystemSettings } from '@/components/admin/AdminSystemSettings';

export default function AdminSystemPage() {
  return (
    <>
      <Helmet>
        <title>System | Owner Console | Majster.AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AdminSystemSettings />
    </>
  );
}
