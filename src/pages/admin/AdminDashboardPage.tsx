import { Helmet } from 'react-helmet-async';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export default function AdminDashboardPage() {
  return (
    <>
      <Helmet>
        <title>Dashboard | Owner Console | Majster.AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AdminDashboard />
    </>
  );
}
