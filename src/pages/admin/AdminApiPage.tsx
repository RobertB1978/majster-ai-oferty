import { Helmet } from 'react-helmet-async';
import { ApiKeysPanel } from '@/components/api/ApiKeysPanel';

export default function AdminApiPage() {
  return (
    <>
      <Helmet>
        <title>API | Owner Console | Majster.AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <ApiKeysPanel />
    </>
  );
}
