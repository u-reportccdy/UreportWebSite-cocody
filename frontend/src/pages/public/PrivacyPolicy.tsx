import React, { useEffect } from 'react';
import { ShieldCheck, Lock, Eye, FileText, UserCheck, Mail, ArrowLeft } from 'lucide-react';
import { Link } from '../../components/public/Link';
import { PATHS } from '../../routes/paths';

export function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6 sm:p-10 border border-slate-100 dark:border-slate-700">
        
        {/* Navigation retour */}
        <Link 
          href={PATHS.PUBLIC.HOME}
          className="inline-flex items-center gap-2 text-sm font-semibold text-ureport-blue hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l'accueil</span>
        </Link>

        {/* En-tête */}
        <div className="border-b border-slate-100 dark:border-slate-700 pb-6 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-ureport-blue text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-4 h-4" /> Protection des Données Personnelles
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Politique de Confidentialité
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Dernière mise à jour : 23 Septembre 2026 • Conforme à la Loi Ivoirienne n° 2013-450 & aux normes internationales (RGPD)
          </p>
        </div>

        {/* Corps de la Politique */}
        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm leading-relaxed space-y-8">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-ureport-blue" />
              1. Engagement & Transparence
            </h2>
            <p>
              Le comité local <strong>U-Report Cocody</strong> s'engage fermement à protéger la vie privée des jeunes, bénévoles et membres de sa communauté. La présente Politique de Confidentialité détaille la manière dont nous collectons, utilisons, traitons et protégeons vos données à caractère personnel conformément à la <strong>Loi n° 2013-450 du 19 juin 2013 relative à la protection des données à caractère personnel en Côte d'Ivoire</strong>.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-ureport-blue" />
              2. Principes de Collecte Minimale des Données
            </h2>
            <p>
              Conformément au principe de minimisation des données, nous ne collectons strictemenent que les informations nécessaires au bon fonctionnement de l'association, à la vérification de l'identité de nos bénévoles et à l'organisation des activités communautaires :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Nom complet (Nom & Prénoms)</strong> : Pour vous identifier sur votre badge et lors des activités.</li>
              <li><strong>Numéro de téléphone</strong> : Pour l'authentification sécurisée par code unique (OTP/SMS) et la mémorisation de vos appareils de confiance.</li>
              <li><strong>Adresse e-mail</strong> : Pour l'envoi de vos informations de compte, notifications d'événements et convocations de département.</li>
              <li><strong>Date de naissance</strong> : Nécessaire exclusivement pour l'attribution automatique de votre statut d'âge (Junior : 15-18 ans, Senior : 19-25 ans, Mentor : 26 ans et plus).</li>
              <li><strong>Commune / Quartier de résidence</strong> : Pour cartographier la présence citoyenne à Cocody.</li>
              <li><strong>Genre / Sexe (facultatif)</strong> : À des fins statistiques anonymes sur la parité dans nos instances.</li>
            </ul>
            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-4 text-xs text-blue-900 dark:text-blue-200">
              <strong>🔒 Aucune revente de données :</strong> Vos données personnelles ne seront <strong>jamais vendues, louées ni cédées</strong> à des entreprises commerciales ou tierces parties à des fins marketing.
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-ureport-blue" />
              3. Sécurité et Stockage des Données
            </h2>
            <p>
              Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles renforcées :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Chiffrement SSL/TLS de toutes les communications de bout en bout (HTTPS).</li>
              <li>Accès restreint par rôles stricts (Row Level Security) sur nos bases de données sécurisées Supabase.</li>
              <li>Authentification sans mot de passe stocké en clair via jetons sécurisés et OTP uniques à durée de vie limitée.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-ureport-blue" />
              4. Vos Droits (Accès, Rectification, Suppression)
            </h2>
            <p>
              Conformément à la réglementation en vigueur, vous disposez à tout moment des droits suivants sur vos données :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Droit d'accès et de rectification</strong> : Vous pouvez consulter et modifier vos informations directement depuis votre espace profil membre.</li>
              <li><strong>Droit à l'oubli / Suppression</strong> : Vous pouvez demander la suppression définitive de votre compte et de toutes vos données personnelles associées.</li>
              <li><strong>Droit d'opposition</strong> : Vous pouvez vous désinscrire à tout moment de nos communications ou de la newsletter.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 border-t border-slate-100 dark:border-slate-700 pt-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-ureport-blue" />
              5. Contact & Délégué à la Protection des Données
            </h2>
            <p>
              Pour exercer vos droits ou pour toute question relative à la protection de vos données personnelles, vous pouvez contacter le secrétariat U-Report Cocody :
            </p>
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-mono space-y-1">
              <p><strong>Email :</strong> ureportcocody01@hotmail.com</p>
              <p><strong>Adresse :</strong> Cocody, Abidjan, Côte d'Ivoire</p>
              <p><strong>Organisation :</strong> Comité Local U-Report Cocody</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
