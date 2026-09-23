import React, { useEffect } from 'react';
import { Building2, Globe, Shield, ArrowLeft } from 'lucide-react';
import { Link } from '../../components/public/Link';
import { PATHS } from '../../routes/paths';

export function LegalNotice() {
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
            <Building2 className="w-4 h-4" /> Identification Éditeur
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Mentions Légales
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Informations obligatoires d'identification de l'éditeur et de l'hébergeur
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm leading-relaxed space-y-8">
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-ureport-blue" />
              1. Éditeur de la plateforme
            </h2>
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-mono space-y-1.5">
              <p><strong>Nom de l'organisation :</strong> Comité Local U-Report Cocody</p>
              <p><strong>Statut :</strong> Initiative communautaire de jeunesse rattachée à U-Report Côte d'Ivoire / UNICEF</p>
              <p><strong>Siège social / Commune :</strong> Cocody, Abidjan, Côte d'Ivoire</p>
              <p><strong>Email officiel :</strong> ureportcocody01@hotmail.com</p>
              <p><strong>Directeur de la Publication :</strong> Coordination Générale U-Report Cocody</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-ureport-blue" />
              2. Hébergement de la plateforme
            </h2>
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-mono space-y-1.5">
              <p><strong>Hébergeur Frontend :</strong> Vercel Inc. (340 S Lemon Ave #4133 Walnut, CA 91789, USA)</p>
              <p><strong>Hébergeur Backend & Base de données :</strong> Render Services & Supabase Inc. (San Francisco, CA, USA)</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-ureport-blue" />
              3. Propriété Intellectuelle
            </h2>
            <p>
              L'ensemble des contenus (textes, visuels, logos, vidéos, articles et graphismes) présents sur cette plateforme sont protégés par les lois en vigueur relatives à la propriété intellectuelle. Toute reproduction ou représentation totale ou partielle sans l'autorisation expresse du bureau U-Report Cocody est strictement interdite.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
