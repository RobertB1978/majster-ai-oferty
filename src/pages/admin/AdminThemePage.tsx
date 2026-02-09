import { Helmet } from 'react-helmet-async';
import { AdminThemeEditor } from '@/components/admin/AdminThemeEditor';

export default function AdminThemePage() {
  return (
    <>
      <Helmet>
        <title>Motyw | Owner Console | Majster.AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AdminThemeEditor />
    </>
  );
}
