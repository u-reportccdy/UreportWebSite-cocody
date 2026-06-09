import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import { Navbar } from '../components/public/Navbar';
import { Footer } from '../components/public/Footer';
import { fetchSiteSettings } from '../services/content.service';

type MaintenanceState = {
  loading: boolean;
  active: boolean;
  message: string;
  imageUrl: string;
};

export function PublicLayout() {
  const location = useLocation();
  const [maintenance, setMaintenance] = useState<MaintenanceState>({
    loading: true,
    active: false,
    message: 'Le site est temporairement en maintenance.',
    imageUrl: '/images/logo-512.png',
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const settings = await fetchSiteSettings();
        if (!alive) return;
        setMaintenance({
          loading: false,
          active: !!settings?.site_under_maintenance,
          message: settings?.maintenance_message || 'Le site est temporairement en maintenance.',
          imageUrl: settings?.maintenance_image_url || '/images/logo-512.png',
        });
      } catch {
        if (!alive) return;
        setMaintenance(prev => ({ ...prev, loading: false }));
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  if (maintenance.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-700">
        Chargement...
      </div>
    );
  }

  if (maintenance.active) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10">
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(circle_at_top,#0ea5e933,transparent_32%),radial-gradient(circle_at_bottom_right,#f59e0b22,transparent_28%)]"
          animate={{ opacity: [0.75, 1, 0.8], scale: [1, 1.04, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/95 shadow-[0_30px_80px_rgba(15,23,42,0.55)] backdrop-blur"
          >
            <div className="border-b border-slate-100 bg-gradient-to-r from-sky-600 via-cyan-500 to-amber-400 px-8 py-10 text-white">
              <motion.div
                className="mx-auto mb-6 flex w-fit items-center justify-center rounded-full bg-slate-950/85 px-8 py-4 shadow-lg ring-1 ring-white/10"
                translate="no"
                initial={{ opacity: 0, y: -14 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  boxShadow: [
                    '0 10px 30px rgba(15,23,42,0.28)',
                    '0 18px 40px rgba(14,165,233,0.22)',
                    '0 10px 30px rgba(15,23,42,0.28)',
                  ],
                }}
                transition={{
                  opacity: { duration: 0.5, ease: 'easeOut' },
                  y: { duration: 0.5, ease: 'easeOut' },
                  boxShadow: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
                }}
              >
                <div className="flex flex-col items-start select-none">
                  <div className="flex items-baseline">
                    <motion.span
                      className="bg-gradient-to-r from-sky-400 from-50% to-white to-50% bg-clip-text text-3xl font-black leading-none tracking-tighter text-transparent"
                      animate={{ opacity: [1, 0.88, 1], scale: [1, 1.03, 1] }}
                      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      U
                    </motion.span>
                    <span className="ml-0.5 text-2xl font-bold leading-none tracking-tight text-white">
                      Report
                    </span>
                  </div>
                  <motion.span
                    className="mr-0.5 mt-0.5 self-end text-[10px] font-black uppercase leading-none tracking-[0.25em] text-sky-300"
                    animate={{ letterSpacing: ['0.25em', '0.32em', '0.25em'] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    Cocody
                  </motion.span>
                </div>
              </motion.div>
              <motion.div
                className="mx-auto flex max-w-2xl items-center gap-5"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1, ease: 'easeOut' }}
              >
                <motion.div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30"
                  animate={{ rotate: [0, -4, 4, 0], scale: [1, 1.04, 1] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ShieldAlert className="h-8 w-8" />
                </motion.div>
                <div>
                  <span className="mb-2 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                    Maintenance en cours
                  </span>
                  <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Nous améliorons actuellement la plateforme</h1>
                </div>
              </motion.div>
            </div>

            <motion.div
              className="px-8 py-10"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
            >
              <div className="mx-auto max-w-2xl space-y-6">
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.2, ease: 'easeOut' }}
                >
                  <h2 className="text-2xl font-bold text-slate-900">Site temporairement indisponible</h2>
                  <p className="text-base leading-8 text-slate-600">
                    {maintenance.message || 'Le site est actuellement en maintenance. Veuillez revenir plus tard.'}
                  </p>
                </motion.div>

                <motion.div
                  className="grid gap-3 sm:grid-cols-2"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.28, ease: 'easeOut' }}
                >
                  <motion.div
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                    whileHover={{ y: -4, boxShadow: '0 14px 30px rgba(15,23,42,0.08)' }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="text-sm font-semibold text-slate-900">Accès public suspendu</p>
                    <p className="mt-1 text-sm text-slate-600">Le contenu reviendra dès la fin des mises à jour en cours.</p>
                  </motion.div>
                  <motion.div
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                    whileHover={{ y: -4, boxShadow: '0 14px 30px rgba(15,23,42,0.08)' }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="text-sm font-semibold text-slate-900">Données préservées</p>
                    <p className="mt-1 text-sm text-slate-600">Cette interruption vise à déployer des changements en toute sécurité.</p>
                  </motion.div>
                </motion.div>

                <motion.div
                  className="flex justify-center"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.36, ease: 'easeOut' }}
                >
                  <motion.button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-600"
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Actualiser la page
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50 text-gray-900 w-full max-w-full overflow-x-hidden relative">
      <Navbar />
      <main className="flex-grow pt-20">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
