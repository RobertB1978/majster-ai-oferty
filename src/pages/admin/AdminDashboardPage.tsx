import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('admin.dashboard')} | Owner Console | Majster.AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AdminDashboard />
    </>
  );
}
