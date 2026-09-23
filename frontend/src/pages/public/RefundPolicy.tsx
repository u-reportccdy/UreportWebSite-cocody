import React, { useEffect } from 'react';
import { CreditCard, Heart, HelpCircle, ArrowLeft } from 'lucide-react';
import { Link } from '../../components/public/Link';
import { PATHS } from '../../routes/paths';

export function RefundPolicy() {
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
            <CreditCard className="w-4 h-4" /> Cotisations & Dons Associatifs
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Politique de Cotisations & Remboursements
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Dispositions relatives aux paiements des membres et contributions solidaires
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm leading-relaxed space-y-8">
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-ureport-blue" />
              1. Nature des Paiements
            </h2>
            <p>
              Les contributions financières effectuées sur le site (Cotisations statutaires de membre, dons volontaires pour les activités sur le terrain, achat de t-shirts ou kits U-Report) constituent des <strong>contributions associatives destinées au financement exclusif des projets communautaires</strong> et de sensibilisation pour les jeunes de Cocody.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-ureport-blue" />
              2. Politique de Remboursement
            </h2>
            <p>
              En raison de leur nature d'engagement solidaire et associatif non lucratif :
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Remboursement standard :</strong> Les cotisations et dons validés sont considérés comme définitifs et ne font pas l'objet d'un droit de rétractation commercial classique.</li>
              <li><strong>Cas d'erreur technique ou de double débit :</strong> En cas de bogue technique, de double prélèvement involontaire ou d'erreur avérée lors de la transaction via Mobile Money (Orange, MTN, Moov, Wave) ou carte bancaire, un remboursement intégral ou un avoir sera effectué après vérification par la Trésorerie.</li>
            </ul>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-slate-700 pt-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-ureport-blue" />
              3. Procédure de Réclamation
            </h2>
            <p>
              Pour toute réclamation financière ou demande d'assistance relative à une transaction, vous pouvez contacter la commission Finances de U-Report Cocody :
            </p>
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-mono space-y-1">
              <p><strong>Service Trésorerie :</strong> ureportcocody01@hotmail.com</p>
              <p><strong>Objet recommandé :</strong> Réclamation Paiement / Référence Transaction</p>
              <p><strong>Délai de traitement :</strong> Sous 48 heures ouvrées</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
