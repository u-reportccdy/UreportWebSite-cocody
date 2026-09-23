import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, ShieldCheck, Check, X } from 'lucide-react';
import { Link } from './Link';
import { PATHS } from '../../routes/paths';

export const CookieConsentBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('ureport_cookie_consent');
    if (!consent) {
      // Petite temporisation pour ne pas gêner le chargement initial
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('ureport_cookie_consent', JSON.stringify({
      acceptedAt: new Date().toISOString(),
      analytics: true,
      necessary: true,
    }));
    setShowBanner(false);
  };

  const handleDeclineOptional = () => {
    localStorage.setItem('ureport_cookie_consent', JSON.stringify({
      acceptedAt: new Date().toISOString(),
      analytics: false,
      necessary: true,
    }));
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="fixed bottom-4 left-4 right-4 sm:left-6 sm:max-w-lg z-[9998] bg-slate-900/95 backdrop-blur-md text-white rounded-3xl shadow-2xl p-5 border border-slate-700/80"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-ureport-blue/20 text-ureport-blue flex items-center justify-center shrink-0 mt-0.5">
            <Cookie className="w-5 h-5 text-[#0099DC]" />
          </div>
          <div className="flex-1 pr-2">
            <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
              <span>Respect de votre vie privée</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Nous utilisons des cookies essentiels pour sécuriser votre authentification et mesurer l'audience anonyme du site sans revente publicitaire.{' '}
              <Link 
                href={PATHS.PUBLIC.COOKIES} 
                className="text-[#0099DC] hover:underline font-semibold"
              >
                En savoir plus
              </Link>.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={handleAcceptAll}
            className="flex-1 py-2.5 px-4 bg-[#0099DC] hover:bg-[#0088CC] text-white font-bold text-xs rounded-xl shadow-lg shadow-ureport-blue/20 transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Tout Accepter</span>
          </button>
          
          <button
            onClick={handleDeclineOptional}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition-colors"
          >
            Essentiels uniquement
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
