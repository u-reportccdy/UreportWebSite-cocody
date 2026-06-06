import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart2, 
  Calendar, 
  Boxes, 
  CreditCard, 
  Printer, 
  TrendingUp, 
  FileText, 
  Users, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { fetchStatsReport } from '../../services/stats.service';
import { Button } from '../../components/ui/Button';

export function Reports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<any>(null);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError('');
      const report = await fetchStatsReport();
      setData(report);
    } catch (err) {
      console.error(err);
      setError('Impossible de générer le rapport. Veuillez vérifier votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-16 text-center">
        <div className="w-12 h-12 border-4 border-[#0099DC] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 font-semibold">Agrégation des statistiques et génération du rapport...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-600">
          <AlertCircle className="w-6 h-6" />
        </div>
        <p className="text-gray-700 font-bold text-lg">{error || 'Une erreur est survenue'}</p>
        <Button onClick={loadReportData} className="px-6 py-2">Réessayer</Button>
      </div>
    );
  }

  const todayStr = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-8">
      
      {/* ==================== SCREEN VIEW (Hidden on Print) ==================== */}
      <div className="print:hidden space-y-8">
        
        {/* Top Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-md">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Rapport d'Impact & d'Activité</h1>
            <p className="text-gray-500 font-semibold text-xs mt-1">Agglomération des données des différents départements</p>
          </div>
          <Button 
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-6 h-12 font-bold shadow-md self-start sm:self-center"
          >
            <Printer className="w-5 h-5" />
            <span>Imprimer / Exporter le PDF</span>
          </Button>
        </div>

        {/* Dashboard Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Activities & Attendance */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-md relative overflow-hidden flex flex-col justify-between h-48">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50 rounded-bl-[80px] -z-0 flex items-center justify-end p-4 text-[#0099DC]/10">
              <Calendar className="w-12 h-12" />
            </div>
            <div className="z-10">
              <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Programme & Participation</span>
              <h3 className="text-3xl font-black text-gray-900 mt-2">{data.events.summary.length}</h3>
              <p className="text-gray-500 text-xs font-semibold mt-1">Activités organisées au total</p>
            </div>
            <div className="z-10 bg-[#0099DC]/5 border border-[#0099DC]/10 rounded-xl px-4 py-2 flex items-center justify-between text-xs text-slate-700 font-bold">
              <span>Taux de présence moyen</span>
              <span className="text-[#0099DC] font-black text-sm">{data.events.avg_attendance_rate}%</span>
            </div>
          </div>

          {/* Card 2: Logistics */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-md relative overflow-hidden flex flex-col justify-between h-48">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-[80px] -z-0 flex items-center justify-end p-4 text-amber-600/10">
              <Boxes className="w-12 h-12" />
            </div>
            <div className="z-10">
              <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Logistique & Ressources</span>
              <h3 className="text-3xl font-black text-gray-900 mt-2">{data.logistics.total_qty}</h3>
              <p className="text-gray-500 text-xs font-semibold mt-1">Équipements dans l'inventaire</p>
            </div>
            <div className="z-10 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 flex items-center justify-between text-xs text-slate-700 font-bold">
              <span>Réservations en attente</span>
              <span className="text-amber-600 font-black text-sm">{data.logistics.requests.pending}</span>
            </div>
          </div>

          {/* Card 3: Finances */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-md relative overflow-hidden flex flex-col justify-between h-48">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-[80px] -z-0 flex items-center justify-end p-4 text-emerald-600/10">
              <CreditCard className="w-12 h-12" />
            </div>
            <div className="z-10">
              <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Trésorerie & Cotisations</span>
              <h3 className="text-2xl font-black text-emerald-600 mt-2">
                {data.contributions.total_collected.toLocaleString('fr-FR')} XOF
              </h3>
              <p className="text-gray-500 text-xs font-semibold mt-1">Montant total collecté</p>
            </div>
            <div className="z-10 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 flex items-center justify-between text-xs text-slate-700 font-bold">
              <span>Transactions validées</span>
              <span className="text-emerald-600 font-black text-sm">{data.contributions.paid_count}</span>
            </div>
          </div>

        </div>

        {/* Detailed Sections Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left: Events Attendance list */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-md space-y-4">
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-3">
              <Calendar className="w-5 h-5 text-[#0099DC]" />
              <span>Assiduité par Activité</span>
            </h3>
            {data.events.summary.length === 0 ? (
              <p className="text-gray-500 text-center py-6 text-sm">Aucune activité enregistrée</p>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {data.events.summary.map((ev: any) => (
                  <div key={ev.event_id} className="flex justify-between items-center p-3.5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all text-sm">
                    <div>
                      <h4 className="font-bold text-gray-800 line-clamp-1">{ev.title}</h4>
                      <p className="text-xs font-medium text-gray-500 mt-0.5">
                        {ev.registered_count} inscrit(s) • {ev.attended_count} présent(s)
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                      ev.attendance_rate >= 75 ? 'bg-emerald-50 text-emerald-600' :
                      ev.attendance_rate >= 40 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {ev.attendance_rate}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Last 5 contributions */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-md space-y-4">
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-3">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <span>Dernières Cotisations</span>
            </h3>
            {data.contributions.history.length === 0 ? (
              <p className="text-gray-500 text-center py-6 text-sm">Aucune contribution enregistrée</p>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {data.contributions.history.slice(0, 7).map((c: any) => (
                  <div key={c.id} className="flex justify-between items-center p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-sm">
                    <div>
                      <h4 className="font-bold text-gray-800">{c.full_name}</h4>
                      <p className="text-xs font-semibold text-gray-500 mt-0.5">
                        {new Date(c.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="block font-black text-emerald-600">{c.amount.toLocaleString()} XOF</span>
                      <span className="text-[10px] text-gray-400 capitalize">{c.status === 'paid' ? 'Confirmé' : 'En attente'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>


      {/* ==================== PRINT VIEW (Optimized for A4 Print/PDF) ==================== */}
      <div className="hidden print:block bg-white text-black text-sm p-4 font-sans space-y-8">
        
        {/* Header Block */}
        <div className="flex justify-between items-end border-b-4 border-[#0099DC] pb-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0099DC] tracking-tight">U-REPORT COCODY</h1>
            <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mt-0.5">Plateforme d'engagement communautaire</p>
            <p className="text-xs text-slate-600 mt-2 font-medium">Rapport officiel à l'attention du Bureau Exécutif et du Secrétariat</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p className="font-bold text-black text-sm">Rapport d'Impact Général</p>
            <p>Généré le : {todayStr}</p>
            <p>Statut : Version Finale</p>
          </div>
        </div>

        {/* Executive Summary Block */}
        <div className="space-y-3">
          <h2 className="text-base font-extrabold text-[#0099DC] border-b border-slate-200 pb-1 uppercase tracking-wider">
            1. Synthèse Exécutive
          </h2>
          <p className="text-slate-700 leading-relaxed text-justify text-xs">
            Le présent rapport compile et présente les indicateurs clés de participation, d'assiduité, de gestion de stock matériel, 
            et la situation financière au titre de la période en cours. L'intégration modulaire des départements permet de mesurer 
            avec précision l'engagement terrain de la jeunesse et l'impact opérationnel de nos actions dans la commune de Cocody.
          </p>
        </div>

        {/* Indicators A4 grid */}
        <div className="space-y-3">
          <h2 className="text-base font-extrabold text-[#0099DC] border-b border-slate-200 pb-1 uppercase tracking-wider">
            2. Indicateurs Clés de Performance (KPI)
          </h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Activités Réalisées</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{data.events.summary.length}</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Assiduité moy. : {data.events.avg_attendance_rate}%</p>
            </div>
            <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Inventaire Matériel</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{data.logistics.total_qty}</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Matériel en stock : {data.logistics.total_items} types</p>
            </div>
            <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cotisations Collectées</span>
              <p className="text-2xl font-black text-emerald-700 mt-1">{data.contributions.total_collected.toLocaleString('fr-FR')} XOF</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">{data.contributions.paid_count} cotisations validées</p>
            </div>
          </div>
        </div>

        {/* Detailed Events Table */}
        <div className="space-y-3">
          <h2 className="text-base font-extrabold text-[#0099DC] border-b border-slate-200 pb-1 uppercase tracking-wider">
            3. Rapport Détaillé du Département Programme (Participation)
          </h2>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <th className="py-2.5 px-3">Titre de l'Activité</th>
                <th className="py-2.5 px-3 text-center">Inscrits</th>
                <th className="py-2.5 px-3 text-center">Présents</th>
                <th className="py-2.5 px-3 text-right">Taux de présence</th>
              </tr>
            </thead>
            <tbody>
              {data.events.summary.map((ev: any) => (
                <tr key={ev.event_id} className="border-b border-slate-200">
                  <td className="py-2 px-3 font-semibold text-slate-800">{ev.title}</td>
                  <td className="py-2 px-3 text-center text-slate-600">{ev.registered_count}</td>
                  <td className="py-2 px-3 text-center text-slate-600">{ev.attended_count}</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">{ev.attendance_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Logistics overview */}
        <div className="space-y-3">
          <h2 className="text-base font-extrabold text-[#0099DC] border-b border-slate-200 pb-1 uppercase tracking-wider">
            4. Bilan du Département Logistique
          </h2>
          <div className="grid grid-cols-2 gap-6 text-xs">
            <div className="space-y-1.5">
              <p className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-600 font-semibold">Total de catégories de matériel :</span>
                <span className="font-bold text-slate-900">{data.logistics.total_items}</span>
              </p>
              <p className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-600 font-semibold">Quantité totale de pièces en stock :</span>
                <span className="font-bold text-slate-900">{data.logistics.total_qty}</span>
              </p>
              <p className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-600 font-semibold">Pièces disponibles immédiatement :</span>
                <span className="font-bold text-emerald-700">{data.logistics.available_qty}</span>
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-600 font-semibold">Nombre total de demandes de réservation :</span>
                <span className="font-bold text-slate-900">{data.logistics.requests.total}</span>
              </p>
              <p className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-600 font-semibold">Demandes approuvées et traitées :</span>
                <span className="font-bold text-emerald-700">{data.logistics.requests.approved}</span>
              </p>
              <p className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-600 font-semibold">Demandes en cours de validation :</span>
                <span className="font-bold text-amber-700">{data.logistics.requests.pending}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Financial overview */}
        <div className="space-y-3">
          <h2 className="text-base font-extrabold text-[#0099DC] border-b border-slate-200 pb-1 uppercase tracking-wider">
            5. Bilan du Département Finances
          </h2>
          <div className="grid grid-cols-2 gap-6 text-xs">
            <div className="space-y-1.5">
              <p className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-600 font-semibold">Cotisations collectées (Confirmées) :</span>
                <span className="font-extrabold text-emerald-700">{data.contributions.total_collected.toLocaleString()} XOF</span>
              </p>
              <p className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-600 font-semibold">Cotisations en attente de traitement :</span>
                <span className="font-extrabold text-slate-500">{data.contributions.total_pending.toLocaleString()} XOF</span>
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-600 font-semibold">Nombre total de paiements validés :</span>
                <span className="font-bold text-slate-900">{data.contributions.paid_count}</span>
              </p>
              <p className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-600 font-semibold">Nombre total d'intentions de paiement :</span>
                <span className="font-bold text-slate-900">{data.contributions.pending_count + data.contributions.paid_count}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Signature Box */}
        <div className="pt-12 flex justify-between text-xs">
          <div className="w-56 text-center border-t border-slate-400 pt-2">
            <p className="font-bold">Le Secrétariat Général</p>
            <p className="text-[10px] text-slate-500 mt-1">U-Report Cocody</p>
          </div>
          <div className="w-56 text-center border-t border-slate-400 pt-2">
            <p className="font-bold">La Présidence</p>
            <p className="text-[10px] text-slate-500 mt-1">U-Report Cocody</p>
          </div>
        </div>

      </div>

    </div>
  );
}
