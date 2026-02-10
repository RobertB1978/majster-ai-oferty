import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { ApiKeysPanel } from '@/components/api/ApiKeysPanel';

export default function AdminApiPage() {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('admin.api')} | Owner Console | Majster.AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <ApiKeysPanel />
    </>
  );
}
