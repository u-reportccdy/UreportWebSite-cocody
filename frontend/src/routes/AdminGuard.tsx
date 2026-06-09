import { Navigate, Outlet } from 'react-router-dom';

export function AdminGuard() {
  const isAuthenticated = !!sessionStorage.getItem('admin_role');
  const role = sessionStorage.getItem('admin_role');

  if (!isAuthenticated) {
    return <Navigate to="/portal" replace />;
  }
  if (role === 'superadmin') {
    return <Navigate to="/superadmin" replace />;
  }

  return <Outlet />;
}

