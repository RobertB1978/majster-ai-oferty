import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { AdminContentEditor } from '@/components/admin/AdminContentEditor';

export default function AdminContentPage() {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('admin.content')} | Owner Console | Majster.AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AdminContentEditor />
    </>
  );
}
