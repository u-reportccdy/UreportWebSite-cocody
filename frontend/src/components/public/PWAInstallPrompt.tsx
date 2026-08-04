import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, PlusSquare, Smartphone, CheckCircle } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Détecter si l'application est déjà ouverte en mode Standalone (déjà installée)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Détecter si l'utilisateur a fermé l'invite récemment (dans les dernières 24h)
    const dismissedAt = localStorage.getItem('ureport_pwa_prompt_dismissed');
    if (dismissedAt) {
      const hoursSinceDismiss = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60);
      if (hoursSinceDismiss < 24) {
        return;
      }
    }

    // 2. Détecter si c'est un iPhone / iPad (iOS)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    if (iosDevice) {
      // Sur iOS Safari, il n'y a pas d'événement beforeinstallprompt, on affiche le guide après 3 secondes
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // 3. Sur Android / Chrome : Écouter l'événement native beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Afficher le pop-up après un court délai pour laisser charger la page
      setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Écouter si l'application vient d'être installée
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Déclencher l'invite native Android/Chrome
    await deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('ureport_pwa_prompt_dismissed', Date.now().toString());
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[9999] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-ureport-blue/20 p-5 overflow-hidden"
      >
        {/* Motif d'arrière-plan décoratif */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-ureport-blue/10 rounded-full blur-xl pointer-events-none" />

        {/* Bouton de fermeture */}
        <button
          onClick={handleDismiss}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          {/* Logo App */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0099DC] to-[#006699] flex items-center justify-center p-2.5 shadow-lg shadow-ureport-blue/30 shrink-0">
            <img
              src="/images/logo.png"
              alt="U-Report Logo"
              className="w-full h-full object-contain filter drop-shadow"
              onError={(e) => {
                // Fallback si l'image ne charge pas
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <div className="flex-1 pr-4">
            <h4 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
              Installer l'application U-Report
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Accédez plus rapidement à la communauté Cocody directement depuis votre écran d'accueil !
            </p>
          </div>
        </div>

        {/* CONTENU SPÉCIFIQUEselon la plateforme */}
        {isIOS ? (
          /* CAS iPHONE / iOS (Guide Safari) */
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3.5 text-xs text-slate-700 dark:text-slate-300">
            <p className="font-semibold text-ureport-blue mb-2 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" /> Pour installer sur votre iPhone :
            </p>
            <ol className="space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-ureport-blue/10 text-ureport-blue font-bold flex items-center justify-center text-[11px]">1</span>
                <span>Appuyez sur le bouton <strong>Partager</strong> <Share className="w-3.5 h-3.5 inline text-ureport-blue" /> en bas de Safari.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-ureport-blue/10 text-ureport-blue font-bold flex items-center justify-center text-[11px]">2</span>
                <span>Sélectionnez <strong>"Sur l'écran d'accueil"</strong> <PlusSquare className="w-3.5 h-3.5 inline text-ureport-blue" />.</span>
              </li>
            </ol>
          </div>
        ) : (
          /* CAS ANDROID / DESKTOP (Bouton d'installation directe) */
          <div className="mt-4 flex items-center gap-2.5">
            <button
              onClick={handleInstallClick}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-[#0099DC] to-[#007BB5] hover:from-[#0088CC] hover:to-[#006699] text-white font-bold text-sm rounded-2xl shadow-lg shadow-ureport-blue/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Installer maintenant</span>
            </button>
            <button
              onClick={handleDismiss}
              className="py-3 px-3.5 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-colors"
            >
              Plus tard
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
