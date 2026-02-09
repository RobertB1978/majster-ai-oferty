import { Helmet } from 'react-helmet-async';
import { AuditLogPanel } from '@/components/admin/AuditLogPanel';

export default function AdminAuditPage() {
  return (
    <>
      <Helmet>
        <title>Logi | Owner Console | Majster.AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AuditLogPanel />
    </>
  );
}
