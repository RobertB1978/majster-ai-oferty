import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { AdminSystemSettings } from '@/components/admin/AdminSystemSettings';

export default function AdminSystemPage() {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('admin.system')} | Owner Console | Majster.AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AdminSystemSettings />
    </>
  );
}
