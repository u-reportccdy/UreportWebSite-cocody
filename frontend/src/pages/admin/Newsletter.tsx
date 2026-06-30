import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Users, Search, Download, Send, Loader2, CheckCircle2, AlertCircle, UserX, RefreshCw } from 'lucide-react';
import api from '../../services/api';

interface Subscriber {
  id: string;
  email: string;
  full_name: string;
  status: 'active' | 'unsubscribed';
  created_at: string;
}

export function Newsletter() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'unsubscribed'>('all');
  const [sendSubject, setSendSubject] = useState('');
  const [sendBody, setSendBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState('');
  const [sendError, setSendError] = useState('');
  const [showSendPanel, setShowSendPanel] = useState(false);

  const loadSubscribers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/newsletter/subscribers');
      setSubscribers(res.data.data || []);
    } catch {
      setSubscribers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSubscribers(); }, []);

  const filtered = subscribers.filter(s => {
    const matchSearch = !searchQuery || s.email.toLowerCase().includes(searchQuery.toLowerCase()) || s.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const activeCount = subscribers.filter(s => s.status === 'active').length;
  const unsubCount = subscribers.filter(s => s.status === 'unsubscribed').length;

  const handleExport = () => {
    const csv = ['Email,Nom,Statut,Date inscription', ...filtered.map(s => `${s.email},"${s.full_name}",${s.status},${new Date(s.created_at).toLocaleDateString('fr-FR')}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'newsletter_abonnes.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendNewsletter = async () => {
    if (!sendSubject.trim() || !sendBody.trim()) { setSendError('Objet et message sont requis.'); return; }
    setSendError(''); setSendSuccess(''); setIsSending(true);
    try {
      await api.post('/newsletter/send', { subject: sendSubject, body: sendBody });
      setSendSuccess(`Newsletter envoyée à ${activeCount} abonné(s) avec succès !`);
      setSendSubject(''); setSendBody('');
    } catch (err: any) {
      setSendError(err?.response?.data?.detail || "Erreur lors de l'envoi.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Newsletter</h1>
          <p className="text-sm text-gray-500 font-semibold mt-1">Gérez vos abonnés et envoyez des communications groupées.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadSubscribers} className="p-2.5 rounded-xl bg-white border border-gray-200 hover:border-[#0099DC] transition-colors text-gray-500 hover:text-[#0099DC]"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:border-[#0099DC] hover:text-[#0099DC] transition-all"><Download className="w-4 h-4" />Exporter CSV</button>
          <button onClick={() => setShowSendPanel(!showSendPanel)} className="flex items-center gap-2 px-4 py-2.5 bg-[#0099DC] text-white rounded-xl text-sm font-black hover:bg-[#007cb0] transition-all shadow-md"><Send className="w-4 h-4" />Envoyer une newsletter</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total abonnés', value: subscribers.length, icon: Users, color: 'text-[#0099DC]', bg: 'bg-blue-50' },
          { label: 'Actifs', value: activeCount, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Désabonnés', value: unsubCount, icon: UserX, color: 'text-red-500', bg: 'bg-red-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 font-semibold">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Send panel */}
      {showSendPanel && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 space-y-4">
          <h2 className="font-black text-gray-900 flex items-center gap-2"><Mail className="w-5 h-5 text-[#0099DC]" />Composer et envoyer une newsletter</h2>
          <p className="text-xs text-gray-500 font-semibold">Cette newsletter sera envoyée à <strong>{activeCount} abonné(s) actif(s)</strong>.</p>
          {sendError && <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm font-semibold text-red-600 flex gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{sendError}</div>}
          {sendSuccess && <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm font-semibold text-emerald-700 flex gap-2"><CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />{sendSuccess}</div>}
          <input value={sendSubject} onChange={e => setSendSubject(e.target.value)} placeholder="Objet de la newsletter..." className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0099DC] text-sm font-semibold bg-gray-50 focus:bg-white transition-all" />
          <textarea value={sendBody} onChange={e => setSendBody(e.target.value)} placeholder="Rédigez votre message ici..." rows={6} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0099DC] text-sm bg-gray-50 focus:bg-white transition-all resize-none" />
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowSendPanel(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all">Annuler</button>
            <button onClick={handleSendNewsletter} disabled={isSending} className="flex items-center gap-2 px-6 py-2.5 bg-[#0099DC] text-white rounded-xl text-sm font-black hover:bg-[#007cb0] transition-all disabled:opacity-50">
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isSending ? 'Envoi...' : 'Envoyer'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Rechercher un abonné..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold bg-white focus:outline-none focus:border-[#0099DC] transition-all" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold bg-white focus:outline-none focus:border-[#0099DC] transition-all">
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs seulement</option>
          <option value="unsubscribed">Désabonnés</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm font-semibold">Chargement des abonnés...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-bold">Aucun abonné trouvé</p>
            <p className="text-sm text-gray-400 mt-1">Les personnes qui s'inscrivent à la newsletter depuis le site apparaîtront ici.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="border-b border-gray-100 bg-gray-50/50">
              <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-4 px-5">Nom</th>
                <th className="py-4 px-5">Email</th>
                <th className="py-4 px-5">Statut</th>
                <th className="py-4 px-5">Inscrit le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-5 text-sm font-semibold text-gray-900">{s.full_name || '—'}</td>
                  <td className="py-4 px-5 text-sm text-gray-600">{s.email}</td>
                  <td className="py-4 px-5">
                    {s.status === 'active'
                      ? <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[11px] font-bold text-emerald-600">Actif</span>
                      : <span className="px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200 text-[11px] font-bold text-gray-500">Désabonné</span>
                    }
                  </td>
                  <td className="py-4 px-5 text-sm text-gray-400 font-semibold">{new Date(s.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}
