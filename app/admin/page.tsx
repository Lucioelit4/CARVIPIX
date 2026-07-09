import { cookies } from 'next/headers';
import AdminPageClient from './AdminPageClient';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const initialIsAuthenticated = Boolean(cookieStore.get('carvipix_admin_session')?.value);

  return <AdminPageClient initialIsAuthenticated={initialIsAuthenticated} />;
}
