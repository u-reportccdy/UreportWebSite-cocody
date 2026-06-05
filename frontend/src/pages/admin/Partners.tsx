import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, ExternalLinkIcon, Edit2Icon, Trash2Icon, XIcon, Loader2 } from 'lucide-react';
import { createPartner, deletePartner, fetchPartners, updatePartner } from '../../services/content.service';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { resizeImageToDataUrl } from '../../utils/imageResize';

export function Partners() {
  const confirm = useConfirm();
  const [partners, setPartners] = useState<any[]>([]);
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', type: 'Institutionnel', website: '', logo: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [logoSize, setLogoSize] = useState({ width: 300, height: 300 });

  const loadPartners = async () => {
    setIsLoading(true);
    try {
      const rows = await fetchPartners();
      setPartners(rows.map((partner: any) => ({ ...partner, logo: partner.logo || partner.logo_url })));
    } catch (err) {
      console.error('Erreur chargement partenaires:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
  }, []);

  const handleOpenModal = (partner: any = null) => {
    if (partner) {
      setEditingPartner(partner);
      setLogoPreview(partner.logo || '');
      setFormData({ name: partner.name, type: partner.type, website: partner.website, logo: partner.logo });
    } else {
      setEditingPartner(null);
      setLogoPreview('');
      setFormData({ name: '', type: 'Institutionnel', website: '', logo: '' });
    }
    setIsModalOpen(true);
  };

  const handleLogoUpload = async (file: File | null) => {
    if (!file) {
      setFormData(prev => ({ ...prev, logo: '' }));
      setLogoPreview('');
      return;
    }

    return new Promise<void>((resolve, reject) => {
      resizeImageToDataUrl(file, logoSize).then((logoData) => {
        setFormData(prev => ({ ...prev, logo: logoData }));
        setLogoPreview(logoData);
        resolve();
      }).catch(reject);
    });
  };

  const sanitizeUrl = (url: string) => {
    if (!url) return '#';
    const trimmed = url.trim();

    if (trimmed.startsWith('data:')) {
      return trimmed;
    }

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'data:') {
        return trimmed;
      }
    } catch (e) {
      if (trimmed.startsWith('/') || trimmed.startsWith('./')) {
        return trimmed;
      }
    }

    return '#';
  };

  const handleLogoError = (id: string) => {
    setLogoErrors(prev => ({ ...prev, [id]: true }));
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: 'Supprimer ce partenaire ?', message: 'Il sera retiré de l’administration et du site public.', confirmText: 'Supprimer', danger: true });
    if (!ok) return;
    await deletePartner(id);
    setPartners(partners.filter(p => p.id !== id));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const finalLogo = formData.logo || `https://placehold.co/200x200/0099DC/FFFFFF?text=${formData.name.substring(0, 3).toUpperCase()}`;
    const payload = {
      name: formData.name,
      type: formData.type,
      website: formData.website,
      logo_url: finalLogo,
      active: true,
    };
    
    try {
      if (editingPartner) {
        await updatePartner(editingPartner.id, payload);
      } else {
        await createPartner(payload);
      }
      await loadPartners();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Erreur enregistrement partenaire:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6" translate="no">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#1E293B]">Réseau de Partenaires</h2>
        <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 bg-[#0099DC] text-white px-4 py-2 rounded-lg hover:bg-[#007bb5] transition-colors">
          <PlusIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Ajouter un partenaire</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 bg-white rounded-xl shadow-sm border border-gray-100 p-12">
            <div className="flex items-center justify-center gap-2 text-[#64748B]">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Chargement des partenaires...</span>
            </div>
          </div>
        ) : partners.length === 0 ? (
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-sm text-[#64748B]">
            Aucun partenaire trouve.
          </div>
        ) : partners.map((partner) => (
          <div key={partner.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center group hover:shadow-md transition-shadow">
            <div className="w-24 h-24 rounded-full border-4 border-gray-50 mb-4 overflow-hidden bg-white shadow-sm flex items-center justify-center">
              <img 
                src={logoErrors[partner.id] ? 'https://placehold.co/200x200/CCC/FFF?text=LOGO' : sanitizeUrl(partner.logo)} 
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden relative z-[60]">
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">{editingPartner ? 'Modifier le partenaire' : 'Ajouter un partenaire'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XIcon className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-3 max-h-[calc(90vh-88px)] overflow-y-auto custom-scrollbar scroll-smooth overscroll-contain">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type de partenaire</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent">
                    <option>Institutionnel</option>
                    <option>Gouvernemental</option>
                    <option>Sponsor Privé</option>
                    <option>ONG</option>
                    <option>Académique</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site Web</label>
                  <input required type="text" placeholder="example.com" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo du Partenaire</label>
                  <div className="grid gap-3">
                    <input type="file" accept="image/*" onChange={async e => await handleLogoUpload(e.target.files?.[0] ?? null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#0099DC] file:text-white hover:file:bg-[#007bb5]" />
                    <input type="url" placeholder="URL du Logo (optionnel)" value={formData.logo.startsWith('data:') ? '' : formData.logo} onChange={e => { setFormData({...formData, logo: e.target.value}); setLogoPreview(e.target.value); }} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent" />
                  </div>
                  {logoPreview && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 flex justify-center bg-gray-50 p-4">
                      <img src={logoPreview} alt="Aperçu" className="h-20 object-contain" />
                    </div>
                  )}
                </div>
                <div className="pt-4 flex justify-end space-x-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Annuler</button>
                  <button type="submit" disabled={isSaving} className="px-4 py-2 bg-[#0099DC] text-white rounded-lg hover:bg-[#007bb5] transition-colors flex items-center justify-center">
                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />}
                    {editingPartner ? 'Enregistrer' : 'Créer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


