import { cookies } from 'next/headers';
import AdminPageClient from './AdminPageClient';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const initialIsAuthenticated = cookieStore.get('carvipix_admin_session')?.value === '1';

  return <AdminPageClient initialIsAuthenticated={initialIsAuthenticated} />;
}
