import React, { useEffect } from 'react';
import { Scale, CheckCircle2, AlertTriangle, ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from '../../components/public/Link';
import { PATHS } from '../../routes/paths';

export function TermsOfService() {
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
            <Scale className="w-4 h-4" /> Réglementation & Engagement Citoyen
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Conditions Générales d'Utilisation (CGU)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            En vigueur au 23 Septembre 2026 • Régissant l'utilisation du site U-Report Cocody
          </p>
        </div>

        {/* Corps des CGU */}
        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm leading-relaxed space-y-8">
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-ureport-blue" />
              1. Objet & Présentation
            </h2>
            <p>
              Le site internet <strong>U-Report Cocody</strong> a pour objet de sensibiliser, mobiliser et coordonner la jeunesse de Cocody autour d'activités citoyennes, écologiques, éducatives et sociales. L'accès au site et son utilisation impliquent l'acceptation sans réserve des présentes Conditions Générales d'Utilisation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-ureport-blue" />
              2. Inscription & Engagement du Membre
            </h2>
            <p>
              Toute personne souhaitant s'inscrire en tant que U-Reporter s'engage à fournir des informations exactes (Nom, Prénoms, Numéro de téléphone portable valide) et à mettre à jour son profil si nécessaire. L'inscription est ouverte à tous les jeunes et sympathisants désireux de s'engager positivement pour la commune de Cocody.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-ureport-blue" />
              3. Règles de Conduite & Respect de la Communauté
            </h2>
            <p>
              Les membres et utilisateurs s'interdisent tout comportement haineux, propos diffamatoires, discriminations, harcèlement ou tentative d'altération du site. Le comité d'administration U-Report Cocody se réserve le droit de suspendre ou supprimer tout compte ne respectant pas les valeurs d'entraide et de citoyenneté.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-ureport-blue" />
              4. Droit Applicable & Juridiction Compétente
            </h2>
            <p>
              Les présentes CGU sont soumises au droit en vigueur en <strong>République de Côte d'Ivoire</strong>. En cas de litige relatif à l'interprétation ou à l'exécution des présentes, les parties s'efforceront de trouver une solution amiable avant toute action judiciaire devant les tribunaux compétents d'Abidjan.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
