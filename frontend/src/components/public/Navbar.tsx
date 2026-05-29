import React, { useState, useEffect, useRef } from 'react';
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
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const lastScrollY = useRef(0);
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

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      setIsScrolled(currentY > 12);

      if (isNavExpanded && Math.abs(currentY - lastScrollY.current) > 4) {
        setIsNavExpanded(false);
      }

      lastScrollY.current = currentY;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isNavExpanded]);

  useEffect(() => {
    if (!isScrolled) setIsNavExpanded(false);
  }, [isScrolled]);

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
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/10 backdrop-blur-3xl border-b border-white/25 shadow-[0_14px_36px_rgba(15,23,42,0.12)]'
            : 'bg-white/88 backdrop-blur-md border-b border-gray-100 shadow-sm'
        }`}
      >
        {isScrolled && (
          <motion.div
            aria-hidden
            className="hidden md:block absolute inset-0 pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute -left-1/4 top-0 h-full w-1/2 bg-white/20 blur-2xl"
              animate={{ x: ['-10%', '140%'] }}
              transition={{ duration: 5.2, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute -right-1/4 top-0 h-full w-1/2 bg-cyan-100/15 blur-2xl"
              animate={{ x: ['10%', '-140%'] }}
              transition={{ duration: 5.8, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        )}
        <AnimatePresence>
          {isScrolled && !isNavExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40"
            >
              <button
                onClick={() => setIsNavExpanded(prev => !prev)}
                className="relative overflow-hidden rounded-full border border-white/40 bg-white/28 backdrop-blur-3xl shadow-[0_8px_24px_rgba(15,23,42,0.12)] px-6 py-2 pointer-events-auto"
                aria-label="Afficher ou masquer la navigation"
              >
                <motion.span
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: [0, 1, 1], opacity: [0, 0.35, 0] }}
                  transition={{ duration: 0.9, ease: 'easeInOut', times: [0, 0.45, 1] }}
                  className="absolute left-0 top-0 h-full w-1/2 origin-right bg-white/30"
                />
                <motion.span
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: [0, 1, 1], opacity: [0, 0.35, 0] }}
                  transition={{ duration: 0.9, ease: 'easeInOut', times: [0, 0.45, 1] }}
                  className="absolute right-0 top-0 h-full w-1/2 origin-left bg-white/30"
                />
                <motion.span
                  aria-hidden
                  className="absolute -left-1/4 top-0 h-full w-1/3 bg-white/45 blur-md"
                  animate={{ x: ['-20%', '260%'] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: [1, 0.75, 1, 0.65, 1],
                    scale: [1, 1.02, 1, 1.015, 1],
                    filter: [
                      'drop-shadow(0 0 0 rgba(14,165,233,0))',
                      'drop-shadow(0 0 6px rgba(14,165,233,0.45))',
                      'drop-shadow(0 0 0 rgba(14,165,233,0))',
                      'drop-shadow(0 0 9px rgba(14,165,233,0.55))',
                      'drop-shadow(0 0 0 rgba(14,165,233,0))'
                    ]
                  }}
                  transition={{
                    delay: 0.18,
                    duration: 3.8,
                    ease: 'easeInOut',
                    repeat: Infinity
                  }}
                  className="relative z-10 flex items-center"
                >
                  <div className="flex flex-col items-start select-none" translate="no">
                    <div className="flex items-baseline">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-ureport-blue from-50% to-black to-50% font-black text-2xl tracking-tighter leading-none">
                        U
                      </span>
                      <span className="text-black font-bold text-xl ml-0.5 tracking-tight leading-none">
                        Report
                      </span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-[0.22em] text-ureport-blue mt-0.5 leading-none self-end mr-0.5">
                      Cocody
                    </span>
                  </div>
                </motion.div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {isScrolled && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.94 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className={`md:hidden absolute left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${
                isOpen ? 'top-2' : 'top-1/2 -translate-y-1/2'
              }`}
            >
              <button
                onClick={() => setIsOpen(prev => !prev)}
                className="relative overflow-hidden rounded-full border border-white/40 bg-white/25 backdrop-blur-3xl shadow-[0_8px_24px_rgba(15,23,42,0.12)] px-4 py-2"
                aria-label="Afficher le menu mobile"
              >
                <span className="text-sm font-semibold text-gray-800">
                  {isOpen ? (
                    'Fermer'
                  ) : (
                    <span
                      className="text-transparent bg-clip-text bg-gradient-to-r from-ureport-blue from-50% to-black to-50% font-black text-xl tracking-tighter leading-none"
                      translate="no"
                    >
                      U
                    </span>
                  )}
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex justify-between transition-all duration-300 ${isScrolled ? 'h-14' : 'h-20'}`}>
            <div className={`flex items-center transition-all duration-300 ${
              isScrolled && !isNavExpanded ? 'opacity-0 -translate-x-8 pointer-events-none' : 'opacity-100 translate-x-0'
            }`}>
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
            <div className={`hidden md:flex items-center space-x-8 transition-all duration-300 ${
              isScrolled && !isNavExpanded ? 'opacity-0 translate-x-8 pointer-events-none' : 'opacity-100 translate-x-0'
            }`}>
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
            <div className={`flex items-center md:hidden transition-all duration-300 ${isScrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
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
              className={`md:hidden overflow-hidden ${
                isScrolled
                  ? 'bg-white/60 backdrop-blur-2xl border-b border-white/35'
                  : 'bg-white border-b border-gray-100'
              }`}>
              <div className="px-4 pt-2 pb-6 space-y-2">
                {displayedLinks.map((link, index) =>
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: index * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`block px-4 py-3 rounded-xl text-base font-semibold ${isActive(link.href) ? 'bg-ureport-light text-ureport-blue' : 'text-gray-600 hover:bg-gray-50'}`}>
                      {link.name}
                    </Link>
                  </motion.div>
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



