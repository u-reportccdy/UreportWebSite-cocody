import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SearchIcon, DownloadIcon, FilterIcon, CheckCircle2Icon, XCircleIcon } from 'lucide-react';

const initialInscriptions = [
  { id: 1, name: 'Kouassi Jean', email: 'jean.kouassi@email.ci', phone: '+225 0102030405', event: 'Formation en leadership jeune', date: '15 Oct 2024', status: 'Confirmé' },
  { id: 2, name: 'Touré Aminata', email: 'atoure99@email.ci', phone: '+225 0506070809', event: 'Campagne de propreté Cocody', date: '14 Oct 2024', status: 'Confirmé' },
  { id: 3, name: 'Bamba Seydou', email: 'seydou.b@email.ci', phone: '+225 0708091011', event: 'Journée de sensibilisation', date: '14 Oct 2024', status: 'Annulé' },
  { id: 4, name: 'Koffi Marie', email: 'marie.koffi@email.ci', phone: '+225 0123456789', event: 'Formation en leadership jeune', date: '13 Oct 2024', status: 'Confirmé' },
  { id: 5, name: 'Diarrassouba Ibrahim', email: 'ib.diarra@email.ci', phone: '+225 0555667788', event: 'Campagne de propreté Cocody', date: '12 Oct 2024', status: 'En attente' }
];

export function Inscriptions() {
  const [inscriptions, setInscriptions] = useState(initialInscriptions);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredInscriptions = inscriptions.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleValidate = (id: number) => {
    setInscriptions(inscriptions.map(inf => inf.id === id ? { ...inf, status: 'Confirmé' } : inf));
  };

  const handleCancel = (id: number) => {
    setInscriptions(inscriptions.map(inf => inf.id === id ? { ...inf, status: 'Annulé' } : inf));
  };

  const handleExportCSV = () => {
    // Définition des colonnes
    const headers = ['Nom', 'Email', 'Téléphone', 'Evénement', 'Date d\'inscription', 'Statut'];
    
    // Transformation des données en lignes CSV
    const csvContent = inscriptions.map(user => [
      `"${user.name}"`,
      `"${user.email}"`,
      `"${user.phone}"`,
      `"${user.event}"`,
      `"${user.date}"`,
      `"${user.status}"`
    ].join(',')).join('\n');

    // Ajout du BOM UTF-8 pour le support des accents dans Excel
    const fullContent = '\uFEFF' + headers.join(',') + '\n' + csvContent;
    
    // Création du lien de téléchargement
    const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `inscriptions_ureport_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Rechercher un participant..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 text-gray-900 placeholder-gray-500 shadow-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC]" />
          </div>
          <button className="flex items-center justify-center px-4 py-2 border border-gray-200 rounded-lg text-[#64748B] hover:bg-gray-50 transition-colors">
            <FilterIcon className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Filtrer</span>
          </button>
        </div>
        <button onClick={handleExportCSV} className="flex items-center space-x-2 bg-white border border-gray-200 text-[#1E293B] px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap w-full sm:w-auto justify-center">
          <DownloadIcon className="w-5 h-5" />
          <span>Exporter CSV</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[#64748B] text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Participant</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Événement</th>
                <th className="px-6 py-4 font-medium">Date d'inscription</th>
                <th className="px-6 py-4 font-medium">Statut</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInscriptions.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-[#0099DC] bg-opacity-10 flex items-center justify-center text-[#0099DC] font-bold text-xs">
                        {user.name.charAt(0)}
                        {user.name.split(' ')[1]?.charAt(0)}
                    </div>
                      <span className="text-sm font-semibold text-[#1E293B]">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-[#1E293B]">{user.email}</div>
                    <div className="text-xs text-[#64748B]">{user.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#64748B]">{user.event}</td>
                  <td className="px-6 py-4 text-sm text-[#64748B]">{user.date}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${user.status === 'Confirmé' ? 'bg-green-100 text-green-700' : user.status === 'Annulé' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleValidate(user.id)} className="p-1.5 text-gray-400 hover:text-[#6CC24A] transition-colors rounded-md hover:bg-green-50" title="Valider">
                      <CheckCircle2Icon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleCancel(user.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-md hover:bg-red-50" title="Annuler">
                      <XCircleIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}