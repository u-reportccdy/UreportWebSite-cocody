import { Navigate, Outlet } from 'react-router-dom';

export function SuperAdminGuard() {
  const role = sessionStorage.getItem('admin_role');

  if (!role) {
    return <Navigate to="/superadmin/login" replace />;
  }
  if (role !== 'superadmin') {
    return <Navigate to="/admin" replace />;
  }
  return <Outlet />;
}
