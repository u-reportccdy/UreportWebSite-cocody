import React, { useMemo, useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, CheckCircle2, AlertCircle, ArrowLeft, Loader2, Heart, ChevronRight, Printer } from 'lucide-react';
import { PATHS } from '../../routes/paths';
import { loadMemberSession } from '../../utils/memberSession';
import { initiateContribution, fetchMemberContributions } from '../../services/member.service';

const PRESET_AMOUNTS = [500, 1000, 2000, 5000, 10000];

interface MemberSession {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
}

function printReceipt(c: any) {
  const w = window.open('', '_blank', 'width=600,height=700');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Reçu Cotisation</title>
  <style>body{font-family:Arial,sans-serif;margin:40px;color:#1a1a1a}h1{color:#0099DC;font-size:22px}.label{color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.05em}.badge{display:inline-block;padding:4px 12px;border-radius:20px;background:#d1fae5;color:#065f46;font-weight:700;font-size:12px}</style></head>
  <body>
  <h1>Reçu de cotisation</h1>
  <p class="label">Référence</p><p><strong>#${c.id?.substring(0, 8).toUpperCase()}</strong></p>
  <p class="label">Montant</p><p><strong>${c.amount?.toLocaleString()} XOF</strong></p>
  <p class="label">Statut</p><p><span class="badge">Payé</span></p>
  <p class="label">Référence paiement</p><p>${c.provider_reference || 'N/A'}</p>
  <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb"/>
  <p style="font-size:12px;color:#9ca3af;text-align:center">U-Report Cocody</p>
  </body></html>`);
  w.document.close();
  w.print();
}

export function CotisationPayment() {
  const session = useMemo<MemberSession | null>(() => loadMemberSession(), []);
  const [selectedAmount, setSelectedAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [contributions, setContributions] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    fetchMemberContributions(session.id)
      .then(data => setContributions(data || []))
      .catch(() => setContributions([]))
      .finally(() => setHistoryLoading(false));
  }, [session?.id]);

  if (!session) return <Navigate to={PATHS.PUBLIC.HOME} replace />;

  const finalAmount = customAmount ? parseInt(customAmount, 10) || 0 : selectedAmount;

  const handlePay = async () => {
    if (finalAmount < 100) { setError('Le montant minimum est de 100 XOF.'); return; }
    setError('');
    setLoading(true);
    try {
      const result = await initiateContribution({
        member_id: session.id,
        full_name: session.full_name,
        phone: session.phone,
        email: session.email || '',
        amount: finalAmount,
      });
      if (result?.payment_url) {
        window.open(result.payment_url, '_blank', 'noopener,noreferrer');
        setSuccess(true);
        const contribs = await fetchMemberContributions(session.id).catch(() => []);
        setContributions(contribs || []);
      } else {
        setError("Lien de paiement non configuré. Contactez l'administration.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-10 px-4 min-h-[80vh] bg-gradient-to-br from-[#f0f9ff] via-white to-blue-50/30">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link to={PATHS.PUBLIC.MEMBER_PROFILE} className="p-2 rounded-xl bg-white border border-gray-200 hover:border-[#0099DC] transition-colors text-gray-500 hover:text-[#0099DC]">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Payer ma cotisation</h1>
            <p className="text-sm text-gray-500 font-semibold">Soutenez les activités de la communauté U-Report Cocody</p>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 space-y-7">
          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#0099DC] flex items-center justify-center text-white font-black text-lg shrink-0">
              {session.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-900">{session.full_name}</p>
              <p className="text-sm text-gray-500">{session.phone}{session.email ? ` · ${session.email}` : ''}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Choisissez un montant (XOF)</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
              {PRESET_AMOUNTS.map(amount => (
                <button
                  key={amount}
                  onClick={() => { setSelectedAmount(amount); setCustomAmount(''); }}
                  className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                    selectedAmount === amount && !customAmount
                      ? 'bg-[#0099DC] text-white border-[#0099DC] shadow-md'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-[#0099DC] hover:text-[#0099DC]'
                  }`}
                >
                  {amount.toLocaleString()}
                </button>
              ))}
            </div>
            <div className="relative">
              <input
                type="number"
                placeholder="Ou saisissez un montant personnalisé..."
                min={100}
                value={customAmount}
                onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(0); }}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-[#0099DC] bg-gray-50 focus:bg-white transition-all text-sm font-semibold"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">XOF</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#0099DC]/10 to-blue-100/20 rounded-2xl p-5 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-700">Montant total</span>
            <span className="text-2xl font-black text-[#0099DC]">{finalAmount > 0 ? finalAmount.toLocaleString() : '—'} XOF</span>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2.5 text-sm font-semibold text-red-600">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /><span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-2.5 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <span>La page de paiement a été ouverte dans un nouvel onglet. Votre cotisation apparaîtra dans l'historique une fois le paiement confirmé.</span>
            </div>
          )}

          <button
            onClick={handlePay}
            disabled={loading || finalAmount < 100}
            className="w-full py-4 bg-[#0099DC] hover:bg-[#007cb0] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-2xl font-black text-base transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
            {loading ? 'Redirection en cours...' : `Payer ${finalAmount > 0 ? finalAmount.toLocaleString() + ' XOF' : ''}`}
            {!loading && <ChevronRight className="w-5 h-5" />}
          </button>

          <p className="text-center text-xs text-gray-400 font-semibold flex items-center justify-center gap-1">
            <Heart className="w-3.5 h-3.5 text-red-400" />
            Merci pour votre soutien à la communauté U-Report Cocody
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8">
          <h2 className="text-lg font-black text-gray-900 mb-5 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#0099DC]" /> Historique de mes paiements
          </h2>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm font-semibold">Chargement...</span>
            </div>
          ) : contributions.length === 0 ? (
            <p className="text-center py-8 text-sm text-gray-500 font-semibold">Aucun paiement effectué pour le moment.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <th className="py-3 pr-4">Réf.</th><th className="py-3 pr-4">Date</th><th className="py-3 pr-4">Montant</th><th className="py-3 pr-4">Statut</th><th className="py-3 text-right">Reçu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {contributions.map((c: any) => (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 pr-4 text-sm font-bold text-gray-700">#{c.id.substring(0, 8).toUpperCase()}</td>
                      <td className="py-3.5 pr-4 text-xs text-gray-500 font-semibold">{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                      <td className="py-3.5 pr-4 text-sm font-extrabold text-[#0099DC]">{c.amount?.toLocaleString()} XOF</td>
                      <td className="py-3.5 pr-4">
                        {c.status === 'paid' ? <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[11px] font-bold text-emerald-600">Payé</span>
                         : c.status === 'pending' ? <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-100 text-[11px] font-bold text-amber-600">En attente</span>
                         : <span className="px-2.5 py-1 rounded-full bg-red-50 border border-red-100 text-[11px] font-bold text-red-600">Échoué</span>}
                      </td>
                      <td className="py-3.5 text-right">
                        {c.status === 'paid' && (
                          <button onClick={() => printReceipt(c)} className="p-1.5 hover:bg-[#0099DC]/10 text-[#0099DC] rounded-lg transition-all" title="Imprimer le reçu">
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
