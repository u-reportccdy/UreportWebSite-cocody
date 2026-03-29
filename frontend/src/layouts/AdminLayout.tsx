import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { PATHS } from '../routes/paths';

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    navigate('/');
  };
  
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('articles')) return 'Articles';
    if (path.includes('events')) return 'Événements';
    if (path.includes('inscriptions')) return 'Inscriptions';
    if (path.includes('partners')) return 'Partenaires';
    return 'Tableau de bord';
  };

  return (
    <div className="min-h-screen flex bg-gray-100 text-gray-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
        <div className="flex items-center space-x-2 h-16 px-6 bg-gray-950 border-b border-gray-800 shrink-0">
          <span className="text-2xl font-extrabold tracking-tight">
            <span className="text-[#0099DC]">U</span>
            <span className="text-white ml-0.5">Report</span>
          </span>
          <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-[#0099DC] bg-[#0099DC]/10 px-2.5 py-1 rounded-full border border-[#0099DC]/20">
            Admin
          </span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to={PATHS.ADMIN.DASHBOARD} className="block px-3 py-2 rounded hover:bg-gray-800 transition font-medium">Tableau de bord</Link>
          <Link to={PATHS.ADMIN.ARTICLES} className="block px-3 py-2 rounded hover:bg-gray-800 transition font-medium">Articles</Link>
          <Link to={PATHS.ADMIN.EVENTS} className="block px-3 py-2 rounded hover:bg-gray-800 transition">Événements</Link>
          <Link to={PATHS.ADMIN.INSCRIPTIONS} className="block px-3 py-2 rounded hover:bg-gray-800 transition">Inscriptions</Link>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <Link to={PATHS.PUBLIC.HOME} className="block w-full text-center px-3 py-2 bg-gray-800 rounded hover:bg-gray-700 transition">Retour au site</Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center h-16 shrink-0 z-10">
          <h2 className="text-xl font-semibold text-[#1E293B]">{getPageTitle()}</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 font-medium">Admin connecté</span>
            <button 
              onClick={handleLogout}
              className="text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded-md hover:bg-red-100 transition font-medium"
            >
              Déconnexion
            </button>
          </div>
        </header>

        <main className="flex-1 p-6" translate="no">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
