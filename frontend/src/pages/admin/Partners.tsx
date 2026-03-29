import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, ExternalLinkIcon, Edit2Icon, Trash2Icon, XIcon } from 'lucide-react';

const initialPartners = [
  { id: 1, name: "UNICEF Côte d'Ivoire", type: 'Institutionnel', website: 'unicef.org/cotedivoire', logo: 'https://placehold.co/200x200/0099DC/FFFFFF?text=UNICEF' },
  { id: 2, name: 'Mairie de Cocody', type: 'Gouvernemental', website: 'mairiecocody.ci', logo: 'https://placehold.co/200x200/6CC24A/FFFFFF?text=MAIRIE' },
  { id: 3, name: 'Orange CI', type: 'Sponsor Privé', website: 'orange.ci', logo: 'https://placehold.co/200x200/FF7900/FFFFFF?text=ORANGE' },
  { id: 4, name: 'Croix-Rouge CI', type: 'ONG', website: 'croixrouge-ci.org', logo: 'https://placehold.co/200x200/ef4444/FFFFFF?text=CROIXROUGE' },
  { id: 5, name: 'Université FHB', type: 'Académique', website: 'univ-fhb.edu.ci', logo: 'https://placehold.co/200x200/1E293B/FFFFFF?text=UFHB' }
];

export function Partners() {
  const [partners, setPartners] = useState(initialPartners);
  const [logoErrors, setLogoErrors] = useState<Record<number, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', type: 'Institutionnel', website: '', logo: '' });

  const handleOpenModal = (partner: any = null) => {
    if (partner) {
      setEditingPartner(partner);
      setFormData({ name: partner.name, type: partner.type, website: partner.website, logo: partner.logo });
    } else {
      setEditingPartner(null);
      setFormData({ name: '', type: 'Institutionnel', website: '', logo: '' });
    }
    setIsModalOpen(true);
  };

  const sanitizeUrl = (url: string) => {
    if (!url) return '#';
    const trimmed = url.trim();
    // Bloquer les protocoles dangereux (javascript, vbscript, data) avec Regex insensible à la casse
    if (/^(javascript|vbscript|data):/i.test(trimmed)) {
      return '#';
    }
    return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  };

  const handleLogoError = (id: number) => {
    setLogoErrors(prev => ({ ...prev, [id]: true }));
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce partenaire ?')) {
      setPartners(partners.filter(p => p.id !== id));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalLogo = formData.logo || `https://placehold.co/200x200/0099DC/FFFFFF?text=${formData.name.substring(0, 3).toUpperCase()}`;
    
    if (editingPartner) {
      setPartners(partners.map(p => p.id === editingPartner.id ? { ...p, ...formData, logo: finalLogo } : p));
    } else {
      setPartners([...partners, { id: Date.now(), ...formData, logo: finalLogo }]);
    }
    setIsModalOpen(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#1E293B]">Réseau de Partenaires</h2>
        <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 bg-[#0099DC] text-white px-4 py-2 rounded-lg hover:bg-[#007bb5] transition-colors">
          <PlusIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Ajouter un partenaire</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {partners.map((partner) => (
          <div key={partner.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center group hover:shadow-md transition-shadow">
            <div className="w-24 h-24 rounded-full border-4 border-gray-50 mb-4 overflow-hidden bg-white shadow-sm flex items-center justify-center">
              <img 
                src={logoErrors[partner.id] ? `https://placehold.co/200x200/CCC/FFF?text=${partner.name.substring(0, 1)}` : partner.logo} 
                alt={`${partner.name} logo`} 
                className="w-full h-full object-cover" 
                onError={() => handleLogoError(partner.id)} 
              />
            </div>
            <h3 className="font-bold text-[#1E293B] mb-1">{partner.name}</h3>
            <span className="text-xs font-medium text-[#0099DC] bg-blue-50 px-2 py-1 rounded-md mb-4">{partner.type}</span>
            <a 
              href={sanitizeUrl(partner.website)} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center text-sm text-[#64748B] hover:text-[#0099DC] transition-colors mb-6 break-all"
            >
              {partner.website} <ExternalLinkIcon className="w-3 h-3 ml-1 shrink-0" />
            </a>

            <div className="flex items-center justify-center space-x-3 w-full pt-4 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleOpenModal(partner)} className="text-gray-400 hover:text-[#6CC24A] transition-colors p-2 rounded-md hover:bg-green-50"><Edit2Icon className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(partner.id)} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-md hover:bg-red-50"><Trash2Icon className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden relative z-[60]">
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">{editingPartner ? 'Modifier le partenaire' : 'Ajouter un partenaire'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XIcon className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0099DC]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type de partenaire</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0099DC]">
                    <option>Institutionnel</option>
                    <option>Gouvernemental</option>
                    <option>Sponsor Privé</option>
                    <option>ONG</option>
                    <option>Académique</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site Web</label>
                  <input required type="text" placeholder="example.com" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0099DC]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL du Logo (Optionnel)</label>
                  <input type="url" placeholder="https://..." value={formData.logo} onChange={e => setFormData({...formData, logo: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0099DC]" />
                </div>
                <div className="pt-4 flex justify-end space-x-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Annuler</button>
                  <button type="submit" className="px-4 py-2 bg-[#0099DC] text-white rounded-lg hover:bg-[#007bb5] transition-colors">{editingPartner ? 'Enregistrer' : 'Créer'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}