import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ShieldCheck, LogOut, Settings, Home, Menu, X } from 'lucide-react';

export function SuperAdminLayout() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen w-full flex bg-gray-100 text-gray-900 font-sans overflow-hidden relative">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`fixed md:relative z-50 w-64 bg-gray-900 text-white h-full flex flex-col shrink-0 overflow-hidden transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center space-x-2 h-16 px-6 bg-gray-950 border-b border-gray-800 shrink-0">
          <span className="text-2xl font-extrabold tracking-tight">
            <span className="text-[#0099DC]">U</span>
            <span className="text-white ml-0.5">Report</span>
          </span>
          <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full border border-red-400/20">
            Super Admin
          </span>
          <button
            className="md:hidden ml-auto p-1 text-gray-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5" onClick={() => setIsMobileMenuOpen(false)}>
          <Link to="/superadmin" className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-[#0099DC] text-white shadow-lg shadow-[#0099DC]/25 font-bold text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Centre Super Admin</span>
          </Link>
          <Link to="/" className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800/60 font-medium text-sm">
            <Home className="w-4 h-4" />
            <span>Retour au site</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={() => {
              sessionStorage.removeItem('admin_token');
              sessionStorage.removeItem('admin_role');
              sessionStorage.removeItem('admin_email');
              navigate('/superadmin/login');
            }}
            className="w-full flex items-center justify-center gap-2 text-sm bg-red-50 text-red-600 px-3 py-2 rounded-xl hover:bg-red-100 transition-all font-semibold"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center h-16 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-1 text-gray-600 hover:text-[#0099DC]"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg md:text-xl font-bold text-[#1E293B]">Pilotage Super Admin</h2>
          </div>
          <span className="inline-flex items-center gap-2 text-sm text-[#1E293B] font-semibold">
            <Settings className="w-4 h-4 text-[#0099DC]" />
            <span className="hidden sm:inline">Accès sensible</span>
          </span>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-y-auto" translate="no">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

