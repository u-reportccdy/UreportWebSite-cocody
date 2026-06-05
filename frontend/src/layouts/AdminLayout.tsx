import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  Users, 
  Image as ImageIcon, 
  MessageSquare, 
  Handshake, 
  BarChart2, 
  Mail, 
  LogOut, 
  Globe,
  Settings as SettingsIcon,
  Search,
  UsersRound,
  Menu,
  X
} from 'lucide-react';
import { PATHS } from '../routes/paths';
import { logoutAdmin } from '../services/auth.service';

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleLogout = async () => {
    try {
      await logoutAdmin();
    } catch {
      // Ignore logout API failures and clear client metadata anyway.
    }
    sessionStorage.removeItem('admin_role');
    sessionStorage.removeItem('admin_email');
    navigate('/');
  };
  
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('articles')) return 'Gestion des Articles';
    if (path.includes('events')) return 'Gestion des Événements';
    if (path.includes('inscriptions')) return 'Gestion des Inscriptions';
    if (path.includes('member-search')) return 'Chercher un U-Report';
    if (path.includes('team')) return 'Gestion Notre Équipe';
    if (path.includes('partners')) return 'Gestion des Partenaires';
    if (path.includes('stats')) return 'Statistiques d\'Impact';
    if (path.includes('gallery')) return 'Gestion de la Galerie';
    if (path.includes('testimonials')) return 'Gestion des Témoignages';
    if (path.includes('newsletter')) return 'Gestion de la Newsletter';
    if (path.includes('settings')) return 'Paramètres de l\'Accueil';
    return 'Tableau de bord';
  };

  const isActive = (path: string) => {
    if (path === PATHS.ADMIN.DASHBOARD) {
      return location.pathname === PATHS.ADMIN.DASHBOARD;
    }
    return location.pathname.startsWith(path);
  };

  const getLinkClass = (path: string) => {
    const active = isActive(path);
    return `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-sm ${
      active 
        ? 'bg-[#0099DC] text-white shadow-lg shadow-[#0099DC]/25 font-bold scale-[1.02]' 
        : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
    }`;
  };

  return (
    <div className="h-screen w-full flex bg-gray-100 text-gray-900 font-sans overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:relative z-50 w-64 bg-gray-900 text-white h-full flex flex-col shrink-0 overflow-hidden transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Title Area */}
        <div className="flex items-center space-x-2 h-16 px-6 bg-gray-950 border-b border-gray-800 shrink-0">
          <span className="text-2xl font-extrabold tracking-tight">
            <span className="text-[#0099DC]">U</span>
            <span className="text-white ml-0.5">Report</span>
          </span>
          <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-[#0099DC] bg-[#0099DC]/10 px-2.5 py-1 rounded-full border border-[#0099DC]/20">
            Admin
          </span>
          <button 
            className="md:hidden ml-auto p-1 text-gray-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sidebar */}
        <nav className="flex-1 p-4 pr-2 space-y-1.5 overflow-y-auto sidebar-scrollbar" onClick={() => setIsMobileMenuOpen(false)}>
          <Link to={PATHS.ADMIN.DASHBOARD} className={getLinkClass(PATHS.ADMIN.DASHBOARD)}>
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Tableau de bord</span>
          </Link>
          
          <Link to={PATHS.ADMIN.ARTICLES} className={getLinkClass(PATHS.ADMIN.ARTICLES)}>
            <FileText className="w-4 h-4 shrink-0" />
            <span>Articles</span>
          </Link>
          
          <Link to={PATHS.ADMIN.EVENTS} className={getLinkClass(PATHS.ADMIN.EVENTS)}>
            <Calendar className="w-4 h-4 shrink-0" />
            <span>Événements</span>
          </Link>
          
          <Link to={PATHS.ADMIN.INSCRIPTIONS} className={getLinkClass(PATHS.ADMIN.INSCRIPTIONS)}>
            <Users className="w-4 h-4 shrink-0" />
            <span>Inscriptions</span>
          </Link>

          <Link to={PATHS.ADMIN.MEMBER_SEARCH} className={getLinkClass(PATHS.ADMIN.MEMBER_SEARCH)}>
            <Search className="w-4 h-4 shrink-0" />
            <span>Chercher un U-Report</span>
          </Link>

          <Link to={PATHS.ADMIN.TEAM} className={getLinkClass(PATHS.ADMIN.TEAM)}>
            <UsersRound className="w-4 h-4 shrink-0" />
            <span>Notre Équipe</span>
          </Link>
          
          <Link to={PATHS.ADMIN.GALLERY} className={getLinkClass(PATHS.ADMIN.GALLERY)}>
            <ImageIcon className="w-4 h-4 shrink-0" />
            <span>Galerie Photo</span>
          </Link>
          
          <Link to={PATHS.ADMIN.TESTIMONIALS} className={getLinkClass(PATHS.ADMIN.TESTIMONIALS)}>
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>Témoignages</span>
          </Link>
          
          <Link to={PATHS.ADMIN.PARTNERS} className={getLinkClass(PATHS.ADMIN.PARTNERS)}>
            <Handshake className="w-4 h-4 shrink-0" />
            <span>Partenaires</span>
          </Link>
          
          <Link to={PATHS.ADMIN.STATS} className={getLinkClass(PATHS.ADMIN.STATS)}>
            <BarChart2 className="w-4 h-4 shrink-0" />
            <span>Statistiques</span>
          </Link>
          
          <Link to={PATHS.ADMIN.NEWSLETTER} className={getLinkClass(PATHS.ADMIN.NEWSLETTER)}>
            <Mail className="w-4 h-4 shrink-0" />
            <span>Newsletter</span>
          </Link>

          <Link to={PATHS.ADMIN.SETTINGS} className={getLinkClass(PATHS.ADMIN.SETTINGS)}>
            <SettingsIcon className="w-4 h-4 shrink-0" />
            <span>Paramètres Accueil</span>
          </Link>
        </nav>

        {/* Footer Area */}
        <div className="p-4 border-t border-gray-800 space-y-2 shrink-0">
          <Link 
            to={PATHS.PUBLIC.HOME} 
            className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 bg-gray-850 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-xl transition text-sm font-medium text-gray-300 hover:text-white"
          >
            <Globe className="w-4 h-4" />
            <span>Retour au site</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Workspace - Défilement indépendant */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center h-16 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-1 text-gray-600 hover:text-[#0099DC]"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg md:text-xl font-bold text-[#1E293B] truncate max-w-[150px] sm:max-w-[250px] md:max-w-none">{getPageTitle()}</h2>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden sm:flex items-center space-x-2">
              <img
                src="https://ui-avatars.com/api/?name=Admin+Cocody&background=0099DC&color=fff"
                alt="Admin"
                className="w-8 h-8 rounded-full border" 
              />
              <span className="text-sm text-gray-700 font-bold">Administrateur</span>
            </div>
            <button 
              onClick={() => void handleLogout()}
              className="flex items-center space-x-1 text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded-xl hover:bg-red-100 transition-all font-semibold"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </header>

        {/* C'est ce main qui défile au besoin */}
        <main className="flex-1 p-6 overflow-y-auto" translate="no">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


