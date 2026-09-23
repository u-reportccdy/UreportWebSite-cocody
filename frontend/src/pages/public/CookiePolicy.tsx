import React, { useEffect } from 'react';
import { Cookie, Shield, Info, ArrowLeft } from 'lucide-react';
import { Link } from '../../components/public/Link';
import { PATHS } from '../../routes/paths';

export function CookiePolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6 sm:p-10 border border-slate-100 dark:border-slate-700">
        
        <Link 
          href={PATHS.PUBLIC.HOME}
          className="inline-flex items-center gap-2 text-sm font-semibold text-ureport-blue hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l'accueil</span>
        </Link>

        <div className="border-b border-slate-100 dark:border-slate-700 pb-6 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-ureport-blue text-xs font-bold uppercase tracking-wider mb-3">
            <Cookie className="w-4 h-4" /> Traçabilité & Transparence
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Politique d'Utilisation des Cookies
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Informations claires sur l'utilisation des traceurs et cookies techniques
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm leading-relaxed space-y-8">
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-ureport-blue" />
              1. Qu'est-ce qu'un cookie ?
            </h2>
            <p>
              Un cookie est un petit fichier texte déposé sur votre navigateur lors de la visite d'un site web. Il permet au site de se souvenir de vos actions, préférences de connexion et choix d'affichage.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-ureport-blue" />
              2. Cookies STRICTEMENT NÉCESSAIRES utilisés sur U-Report Cocody
            </h2>
            <p>
              Nous privilégions une politique d'utilisation éthique et minimale. Notre site utilise uniquement des cookies techniques essentiels pour assurer votre sécurité et la fluidité de votre navigation :
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Token de Session Membre / Device Token (`ureport_device_token`)</strong> : Permet d'éviter de vous redemander un code de validation OTP à chaque reconnexion sur un appareil reconnu.</li>
              <li><strong>Préférences de Consentement Cookie (`ureport_cookie_consent`)</strong> : Mémorise vos choix en matière de consentement.</li>
              <li><strong>Mesure d'audience anonyme (Vercel Speed Insights & Google Analytics Anonymisé)</strong> : Utilisé uniquement pour analyser la vitesse et les performances d'affichage du site sans recoupement publicitaire.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cookie className="w-5 h-5 text-ureport-blue" />
              3. Gestion et Supression de vos choix
            </h2>
            <p>
              Vous pouvez à tout moment modifier ou retirer votre consentement aux cookies non essentiels via notre bannière de consentement au bas de la page ou directement dans les paramètres de votre navigateur web.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
