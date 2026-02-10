import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { AdminDatabaseManager } from '@/components/admin/AdminDatabaseManager';

export default function AdminDatabasePage() {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('admin.database')} | Owner Console | Majster.AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AdminDatabaseManager />
    </>
  );
}
