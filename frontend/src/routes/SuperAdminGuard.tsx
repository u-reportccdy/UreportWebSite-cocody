import { Navigate, Outlet } from 'react-router-dom';

export function SuperAdminGuard() {
  const token = sessionStorage.getItem('admin_token');
  const role = sessionStorage.getItem('admin_role');

  if (!token) {
    return <Navigate to="/superadmin/login" replace />;
  }
  if (role !== 'superadmin') {
    return <Navigate to="/admin" replace />;
  }
  return <Outlet />;
}
