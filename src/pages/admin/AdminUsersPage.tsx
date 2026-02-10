import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { AdminUsersManager } from '@/components/admin/AdminUsersManager';

export default function AdminUsersPage() {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('admin.users')} | Owner Console | Majster.AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AdminUsersManager />
    </>
  );
}
