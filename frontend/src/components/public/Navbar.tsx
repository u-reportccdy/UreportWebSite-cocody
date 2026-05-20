import React, { useState, useEffect } from 'react';
import { Menu, X, LogOut, User } from 'lucide-react';
import { Link } from './Link';
import { Button } from '../ui/Button';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { JoinModal } from './JoinModal';
import { PATHS } from '../../routes/paths';

interface MemberSession {
  id: string;
  full_name?: string;
  phone: string;
  email?: string;
  status?: string;
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [session, setSession] = useState<MemberSession | null>(() => {
    const saved = localStorage.getItem('member_session');
    if (!saved) return null;
    try {
      return JSON.parse(saved) as MemberSession;
    } catch {
      return null;
    }
  });
  const location = useLocation();
  const path = location.pathname;
  const navLinks = [
    { name: 'Accueil', href: '/' },
    { name: 'Événements', href: '/events' },
    { name: 'Articles', href: '/articles' },
    { name: 'Galerie', href: '/gallery' },
    { name: 'À Propos', href: '/about' }
  ];
  const protectedLinks = [{ name: 'Paiement cotisation', href: PATHS.PUBLIC.CONTRIBUTION_PAYMENT }];
  const displayedLinks = session ? [...navLinks, ...protectedLinks] : navLinks;

  useEffect(() => {
    const onStorage = () => {
      const saved = localStorage.getItem('member_session');
      if (!saved) {
        setSession(null);
        return;
      }
      try {
        setSession(JSON.parse(saved) as MemberSession);
      } catch {
        setSession(null);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('member_session');
    setSession(null);
  };

  const isActive = (href: string) => {
    if (href === '/' && path === '/') return true;
    if (href !== '/' && path.startsWith(href)) return true;
    return false;
  };

  const displayName = (session?.full_name || 'Membre').trim();
  const firstName = displayName.split(' ')[0] || 'Membre';

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <Link href="/">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-start select-none" translate="no">
                    <div className="flex items-baseline">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-ureport-blue from-50% to-black to-50% font-black text-3xl tracking-tighter leading-none">
                        U
                      </span>
                      <span className="text-black font-bold text-2xl ml-0.5 tracking-tight leading-none">
                        Report
                      </span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-ureport-blue mt-0.5 leading-none self-end mr-0.5">
                      Cocody
                    </span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              {displayedLinks.map((link) =>
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-semibold transition-colors hover:text-ureport-blue relative ${isActive(link.href) ? 'text-ureport-blue' : 'text-gray-600'}`}>
                  {link.name}
                  {isActive(link.href) &&
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute -bottom-2 left-0 right-0 h-1 bg-ureport-blue rounded-t-full" />
                  }
                </Link>
              )}
              {session ? (
                <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-full border border-ureport-blue/15 shadow-sm">
                  <User className="w-4 h-4 text-ureport-blue shrink-0" />
                  <span className="text-sm font-semibold text-gray-800 truncate max-w-[120px]">
                    {firstName}
                  </span>
                  <button 
                    onClick={handleLogout} 
                    className="p-1 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-full transition-all shrink-0"
                    title="Se déconnecter"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Button size="sm" onClick={() => setIsJoinModalOpen(true)}>
                  Connexion
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-gray-600 hover:text-ureport-blue focus:outline-none p-2">
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen &&
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-gray-100 overflow-hidden">
              <div className="px-4 pt-2 pb-6 space-y-2">
                {displayedLinks.map((link) =>
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-base font-semibold ${isActive(link.href) ? 'bg-ureport-light text-ureport-blue' : 'text-gray-600 hover:bg-gray-50'}`}>
                    {link.name}
                  </Link>
                )}
                <div className="pt-4 px-4">
                  {session ? (
                    <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-ureport-blue" />
                        <span className="text-base font-bold text-gray-800">{displayName}</span>
                      </div>
                      <span className="text-xs text-gray-500 capitalize px-7">Profil: {session.status}</span>
                      <Button fullWidth variant="outline" className="mt-2 text-red-500 border-red-200 hover:bg-red-50" onClick={handleLogout}>
                        <LogOut className="w-4 h-4 mr-2" /> Se déconnecter
                      </Button>
                    </div>
                  ) : (
                    <Button fullWidth onClick={() => { setIsOpen(false); setIsJoinModalOpen(true); }}>
                      Connexion
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          }
        </AnimatePresence>
      </nav>

      <JoinModal 
        isOpen={isJoinModalOpen} 
        onClose={() => setIsJoinModalOpen(false)} 
        onSuccess={(member: MemberSession) => {
          setSession(member);
        }}
      />
    </>
  );
}
