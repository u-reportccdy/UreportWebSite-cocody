import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import api from '../services/api';

export function AdminGuard() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const checkAuth = async () => {
      try {
        const response = await api.get('/auth/admin/me');
        if (!active) return;
        const data = response.data?.data;
        if (data?.role) {
          sessionStorage.setItem('admin_role', data.role);
          sessionStorage.setItem('admin_email', data.email || '');
          setIsAuthenticated(true);
          setRole(data.role);
        } else {
          setIsAuthenticated(false);
          sessionStorage.removeItem('admin_role');
          sessionStorage.removeItem('admin_email');
        }
      } catch (err) {
        if (!active) return;
        setIsAuthenticated(false);
        sessionStorage.removeItem('admin_role');
        sessionStorage.removeItem('admin_email');
      } finally {
        if (active) setLoading(false);
      }
    };

    checkAuth();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 select-none">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#0099DC] border-t-transparent rounded-full animate-spin shadow-md" />
          <p className="text-gray-500 font-semibold text-sm animate-pulse">Vérification de la session en cours...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/portal" replace />;
  }

  return <Outlet />;
}


