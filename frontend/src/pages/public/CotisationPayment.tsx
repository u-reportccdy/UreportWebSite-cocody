import React, { useMemo, useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, CheckCircle2, AlertCircle, ArrowLeft,
  Loader2, Heart, ChevronRight, Printer, ArrowRight, Smartphone
} from 'lucide-react';
import { PATHS } from '../../routes/paths';
import { loadMemberSession } from '../../utils/memberSession';
import { initiateContribution, fetchMemberContributions, fetchPaymentLinks } from '../../services/member.service';

const PRESET_AMOUNTS = [500, 1000, 2000, 5000, 10000];

// Méthodes de paiement Ivoiriennes par défaut
const DEFAULT_PAYMENT_METHODS = [
  {
    id: 'wave',
    label: 'Wave',
    color: 'from-blue-500 to-blue-600',
    logo: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
        <circle cx="20" cy="20" r="20" fill="#1B9AF5"/>
        <path d="M10 20c2-4 5-6 8-6s5 3 6 5 3 5 6 5" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"/>
        <path d="M8 24c2-4 5-6 8-6s5 3 6 5 3 5 6 5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5"/>
      </svg>
    ),
    description: 'Paiement instantané via Wave',
  },
  {
    id: 'orange_money',
    label: 'Orange Money',
    color: 'from-orange-500 to-orange-600',
    logo: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
        <circle cx="20" cy="20" r="20" fill="#FF7900"/>
        <circle cx="20" cy="20" r="10" fill="white"/>
        <circle cx="20" cy="20" r="5" fill="#FF7900"/>
      </svg>
    ),
    description: 'Paiement via Orange Money',
  },
  {
    id: 'mtn',
    label: 'MTN Mobile Money',
    color: 'from-yellow-400 to-yellow-500',
    logo: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
        <circle cx="20" cy="20" r="20" fill="#FFCC00"/>
        <text x="20" y="25" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#333">MTN</text>
      </svg>
    ),
    description: 'Paiement via MTN MoMo',
  },
  {
    id: 'moov',
    label: 'Moov Money',
    color: 'from-blue-700 to-blue-800',
    logo: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
        <circle cx="20" cy="20" r="20" fill="#003087"/>
        <text x="20" y="25" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">MOOV</text>
      </svg>
    ),
    description: 'Paiement via Moov Money',
  },
];

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

  // Step: 'amount' | 'method' | 'success'
  const [step, setStep] = useState<'amount' | 'method' | 'success'>('amount');
  const [selectedAmount, setSelectedAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [contributions, setContributions] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState(DEFAULT_PAYMENT_METHODS);
  const [configuredLinks, setConfiguredLinks] = useState<any[]>([]);

  useEffect(() => {
    if (!session) return;
    fetchMemberContributions(session.id)
      .then(data => setContributions(data || []))
      .catch(() => setContributions([]))
      .finally(() => setHistoryLoading(false));

    // Charger les liens configurés par l'admin
    fetchPaymentLinks()
      .then(links => {
        if (links && links.length > 0) {
          setConfiguredLinks(links);
          // Fusionner les méthodes avec les liens configurés
          const enriched = DEFAULT_PAYMENT_METHODS.map(m => {
            const match = links.find(l =>
              l.label?.toLowerCase().includes(m.id) ||
              m.label.toLowerCase().includes(l.label?.toLowerCase() || '')
            );
            return { ...m, configuredUrl: match?.url || null };
          });
          setPaymentMethods(enriched as any);
        }
      })
      .catch(() => {});
  }, [session?.id]);

  if (!session) return <Navigate to={PATHS.PUBLIC.HOME} replace />;

  const finalAmount = customAmount ? parseInt(customAmount, 10) || 0 : selectedAmount;

  const handleConfirmAmount = () => {
    if (finalAmount < 100) { setError('Le montant minimum est de 100 XOF.'); return; }
    setError('');
    setStep('method');
  };

  const handlePay = async () => {
    if (!selectedMethod) { setError('Veuillez sélectionner un moyen de paiement.'); return; }
    setError('');
    setLoading(true);
    try {
      // Trouver le lien de paiement correspondant à la méthode
      const method = (paymentMethods as any[]).find(m => m.id === selectedMethod);
      const paymentUrl = method?.configuredUrl || null;

      const result = await initiateContribution({
        member_id: session.id,
        full_name: session.full_name,
        phone: session.phone,
        email: session.email || '',
        amount: finalAmount,
        ...(paymentUrl ? {} : {}),
      });

      const redirectUrl = result?.payment_url || paymentUrl;
      if (redirectUrl) {
        window.open(redirectUrl, '_blank', 'noopener,noreferrer');
      }
      setStep('success');
      const contribs = await fetchMemberContributions(session.id).catch(() => []);
      setContributions(contribs || []);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || '';
      if (detail.toLowerCase().includes('no payment link') || detail.toLowerCase().includes('not configured')) {
        setError("Aucun lien de paiement n'est configuré pour ce moyen. Veuillez contacter l'administration.");
      } else {
        setError(detail || 'Une erreur est survenue. Réessayez plus tard.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-10 px-4 min-h-[80vh] bg-gradient-to-br from-[#f0f9ff] via-white to-blue-50/30">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          {step === 'method' ? (
            <button onClick={() => { setStep('amount'); setSelectedMethod(null); setError(''); }} className="p-2 rounded-xl bg-white border border-gray-200 hover:border-[#0099DC] transition-colors text-gray-500 hover:text-[#0099DC]">
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <Link to={PATHS.PUBLIC.MEMBER_PROFILE} className="p-2 rounded-xl bg-white border border-gray-200 hover:border-[#0099DC] transition-colors text-gray-500 hover:text-[#0099DC]">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}
          <div>
            <h1 className="text-2xl font-black text-gray-900">Payer ma cotisation</h1>
            <p className="text-sm text-gray-500 font-semibold">Soutenez les activités de la communauté U-Report Cocody</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${step === 'amount' ? 'bg-[#0099DC] text-white shadow' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
            {step !== 'amount' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span>1</span>}
            Montant
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${step === 'method' ? 'bg-[#0099DC] text-white shadow' : step === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-gray-100 text-gray-400'}`}>
            {step === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span>2</span>}
            Moyen de paiement
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${step === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-gray-100 text-gray-400'}`}>
            {step === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span>3</span>}
            Confirmation
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* ── STEP 1 : MONTANT ── */}
          {step === 'amount' && (
            <motion.div key="amount" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 space-y-7">

              {/* Membre */}
              <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#0099DC] flex items-center justify-center text-white font-black text-lg shrink-0">
                  {session.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{session.full_name}</p>
                  <p className="text-sm text-gray-500">{session.phone}{session.email ? ` · ${session.email}` : ''}</p>
                </div>
              </div>

              {/* Montants */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Choisissez un montant (XOF)</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
                  {PRESET_AMOUNTS.map(amount => (
                    <button
                      key={amount}
                      onClick={() => { setSelectedAmount(amount); setCustomAmount(''); setError(''); }}
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
                    onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(0); setError(''); }}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-[#0099DC] bg-gray-50 focus:bg-white transition-all text-sm font-semibold"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">XOF</span>
                </div>
              </div>

              {/* Total */}
              <div className="bg-gradient-to-r from-[#0099DC]/10 to-blue-100/20 rounded-2xl p-5 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700">Montant total</span>
                <span className="text-2xl font-black text-[#0099DC]">{finalAmount > 0 ? finalAmount.toLocaleString() : '—'} XOF</span>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2.5 text-sm font-semibold text-red-600">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /><span>{error}</span>
                </div>
              )}

              <button
                onClick={handleConfirmAmount}
                disabled={finalAmount < 100}
                className="w-full py-4 bg-[#0099DC] hover:bg-[#007cb0] disabled:bg-gray-200 disabled:cursor-not-allowed text-white rounded-2xl font-black text-base transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <span>Continuer</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* ── STEP 2 : MOYEN DE PAIEMENT ── */}
          {step === 'method' && (
            <motion.div key="method" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 space-y-6">

              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-gray-900">Moyen de paiement</h2>
                  <p className="text-sm text-gray-500 font-semibold mt-1">Sélectionnez votre opérateur</p>
                </div>
                <div className="bg-[#0099DC]/10 px-4 py-2 rounded-xl">
                  <span className="text-lg font-black text-[#0099DC]">{finalAmount.toLocaleString()} XOF</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paymentMethods.map(method => (
                  <button
                    key={method.id}
                    onClick={() => { setSelectedMethod(method.id); setError(''); }}
                    className={`group relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                      selectedMethod === method.id
                        ? 'border-[#0099DC] bg-[#0099DC]/5 shadow-md'
                        : 'border-gray-200 hover:border-[#0099DC]/50 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${method.color} flex items-center justify-center shrink-0 shadow`}>
                      {method.logo}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-gray-900 text-sm">{method.label}</p>
                      <p className="text-xs text-gray-500 font-semibold mt-0.5">{method.description}</p>
                    </div>
                    {selectedMethod === method.id && (
                      <CheckCircle2 className="w-5 h-5 text-[#0099DC] absolute top-3 right-3 shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {/* Option: carte bancaire */}
              <div className="border-t border-gray-100 pt-4">
                <button
                  onClick={() => { setSelectedMethod('card'); setError(''); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                    selectedMethod === 'card'
                      ? 'border-[#0099DC] bg-[#0099DC]/5 shadow-md'
                      : 'border-gray-200 hover:border-[#0099DC]/50 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shrink-0 shadow">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-black text-gray-900 text-sm">Carte Bancaire / Visa</p>
                    <p className="text-xs text-gray-500 font-semibold mt-0.5">Visa, Mastercard, carte prépayée</p>
                  </div>
                  {selectedMethod === 'card' && (
                    <CheckCircle2 className="w-5 h-5 text-[#0099DC] ml-auto shrink-0" />
                  )}
                </button>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2.5 text-sm font-semibold text-red-600">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /><span>{error}</span>
                </div>
              )}

              <button
                onClick={handlePay}
                disabled={loading || !selectedMethod}
                className="w-full py-4 bg-[#0099DC] hover:bg-[#007cb0] disabled:bg-gray-200 disabled:cursor-not-allowed text-white rounded-2xl font-black text-base transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Smartphone className="w-5 h-5" />}
                {loading ? 'Redirection en cours...' : `Payer ${finalAmount.toLocaleString()} XOF`}
                {!loading && <ChevronRight className="w-5 h-5" />}
              </button>

              <p className="text-center text-xs text-gray-400 font-semibold flex items-center justify-center gap-1">
                <Heart className="w-3.5 h-3.5 text-red-400" />
                Merci pour votre soutien à la communauté U-Report Cocody
              </p>
            </motion.div>
          )}

          {/* ── STEP 3 : SUCCÈS ── */}
          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl border border-gray-100 shadow-xl p-12 text-center space-y-5">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900">Redirection effectuée !</h2>
                <p className="text-gray-500 font-semibold mt-2 text-sm max-w-sm mx-auto">
                  La page de paiement s'est ouverte dans un nouvel onglet. Complétez votre paiement sur la plateforme de votre opérateur.
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-700 font-semibold">
                Votre cotisation apparaîtra dans votre historique une fois le paiement confirmé par l'opérateur.
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <button
                  onClick={() => { setStep('amount'); setSelectedMethod(null); setError(''); }}
                  className="px-6 py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:border-[#0099DC] hover:text-[#0099DC] transition-all text-sm"
                >
                  Faire un autre paiement
                </button>
                <Link to={PATHS.PUBLIC.MEMBER_PROFILE} className="px-6 py-3 bg-[#0099DC] text-white rounded-xl font-bold text-sm hover:bg-[#007cb0] transition-all">
                  Voir mon profil
                </Link>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Historique */}
        {step !== 'method' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8">
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
        )}

      </div>
    </section>
  );
}
