import { Helmet } from 'react-helmet-async';
import { AdminContentEditor } from '@/components/admin/AdminContentEditor';

export default function AdminContentPage() {
  return (
    <>
      <Helmet>
        <title>Treści | Owner Console | Majster.AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AdminContentEditor />
    </>
  );
}
