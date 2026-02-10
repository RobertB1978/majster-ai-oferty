import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { AdminThemeEditor } from '@/components/admin/AdminThemeEditor';

export default function AdminThemePage() {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('admin.theme')} | Owner Console | Majster.AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AdminThemeEditor />
    </>
  );
}
