import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, QuoteIcon, CheckIcon, XIcon, Trash2Icon, Edit2Icon, SearchIcon, Loader2 } from 'lucide-react';
import { createTestimonial, deleteTestimonial, fetchTestimonials, updateTestimonial } from '../../services/content.service';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { resizeImageToDataUrl } from '../../utils/imageResize';

export function Testimonials() {
  const confirm = useConfirm();
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<any>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [formData, setFormData] = useState({
    fullName: '',
    role: '',
    content: '',
    avatar: '',
    status: 'draft' as 'draft' | 'published',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [avatarSize, setAvatarSize] = useState({ width: 300, height: 300 });

  const sanitizeAvatarUrl = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('data:image/')) return trimmed;
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return trimmed;
      }
    } catch {
      return '';
    }
    return '';
  };

  const loadTestimonials = async () => {
    try {
      setIsLoading(true);
      const rows = await fetchTestimonials();
      setTestimonials(rows.map((row: any) => ({
        ...row,
        avatar: row.avatar || row.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.full_name || 'U')}&background=0099DC&color=fff`,
      })));
    } catch (err) {
      console.error('Erreur chargement témoignages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTestimonials();
  }, []);

  const handleOpenModal = (testimonial: any = null) => {
    if (testimonial) {
      setEditingTestimonial(testimonial);
      setAvatarPreview(testimonial.avatar || '');
      setFormData({
        fullName: testimonial.full_name || '',
        role: testimonial.role || '',
        content: testimonial.content || '',
        avatar: testimonial.avatar || '',
        status: testimonial.status || 'draft',
      });
    } else {
      setEditingTestimonial(null);
      setAvatarPreview('');
      setFormData({
        fullName: '',
        role: '',
        content: '',
        avatar: '',
        status: 'draft',
      });
    }
    setIsModalOpen(true);
  };

  const handleAvatarUpload = async (file: File | null) => {
    if (!file) {
      setFormData(prev => ({ ...prev, avatar: '' }));
      setAvatarPreview('');
      return;
    }

    return new Promise<void>((resolve, reject) => {
      resizeImageToDataUrl(file, avatarSize).then((avatarData) => {
        setFormData(prev => ({ ...prev, avatar: avatarData }));
        setAvatarPreview(avatarData);
        resolve();
      }).catch(reject);
    });
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: 'Supprimer ce témoignage ?', message: 'Il sera retiré de l’administration et du site public.', confirmText: 'Supprimer', danger: true });
    if (!ok) return;
    try {
      await deleteTestimonial(id);
      setTestimonials(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Erreur suppression témoignage:', err);
    }
  };

  const handleStatusChange = async (id: string, status: 'draft' | 'published') => {
    try {
      await updateTestimonial(id, { status });
      await loadTestimonials();
    } catch (err) {
      console.error('Erreur changement statut témoignage:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const payload = {
      full_name: formData.fullName,
      role: formData.role,
      content: formData.content,
      avatar_url: formData.avatar,
      status: formData.status,
    };

    try {
      if (editingTestimonial) {
        await updateTestimonial(editingTestimonial.id, payload);
      } else {
        await createTestimonial(payload);
      }
      await loadTestimonials();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Erreur enregistrement témoignage:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredTestimonials = testimonials.filter(t => 
    t.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6" translate="no">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Rechercher un témoignage..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 text-gray-900 placeholder-gray-500 shadow-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC]" 
          />
        </div>
        <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 bg-[#0099DC] text-white px-4 py-2 rounded-lg hover:bg-[#007bb5] transition-colors whitespace-nowrap">
          <PlusIcon className="w-5 h-5" />
          <span>Ajouter un témoignage</span>
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Loader2 className="w-10 h-10 text-[#0099DC] animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-[#64748B]">Chargement des témoignages...</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTestimonials.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative flex flex-col justify-between group hover:shadow-md transition-shadow">
            <QuoteIcon className="absolute top-6 right-6 w-8 h-8 text-gray-100 shrink-0" />
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <img src={item.avatar} alt={item.full_name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <h3 className="font-bold text-[#1E293B]">{item.full_name}</h3>
                  <p className="text-sm text-[#64748B]">{item.role}</p>
                </div>
              </div>
              <p className="text-[#1E293B] text-sm italic mb-6 relative z-10">
                "{item.content}"
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {item.status === 'published' ? 'Publié' : 'Brouillon'}
              </span>

              <div className="flex items-center space-x-2">
                {item.status === 'draft' ? (
                  <button onClick={() => handleStatusChange(item.id, 'published')} className="flex items-center space-x-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded hover:bg-green-100 transition-colors">
                    <CheckIcon className="w-3.5 h-3.5" /> <span>Approuver</span>
                  </button>
                ) : (
                  <button onClick={() => handleStatusChange(item.id, 'draft')} className="flex items-center space-x-1 text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded hover:bg-yellow-100 transition-colors">
                    <XIcon className="w-3.5 h-3.5" /> <span>Dépublier</span>
                  </button>
                )}
                <button onClick={() => handleOpenModal(item)} className="p-1.5 text-gray-400 hover:text-[#0099DC] transition-colors rounded-md hover:bg-blue-50" title="Modifier">
                  <Edit2Icon className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-md hover:bg-red-50" title="Supprimer">
                  <Trash2Icon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredTestimonials.length === 0 && (
          <div className="md:col-span-2 text-center py-12 text-[#64748B]">
            Aucun témoignage trouvé.
          </div>
        )}
      </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden my-8">
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">{editingTestimonial ? "Modifier le témoignage" : 'Créer un témoignage'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XIcon className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-3 max-h-[calc(90vh-88px)] overflow-y-auto custom-scrollbar scroll-smooth overscroll-contain">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                  <input required type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rôle / Fonction</label>
                  <input required type="text" placeholder="Ex: Étudiante, U-Reporter" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contenu du témoignage</label>
                  <textarea required rows={4} value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent resize-none" />
                </div>
                <div className="grid gap-3">
                  <label className="block text-sm font-medium text-gray-700">Photo / Avatar</label>
                  <input type="file" accept="image/*" onChange={async e => await handleAvatarUpload(e.target.files?.[0] ?? null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#0099DC] file:text-white hover:file:bg-[#007bb5]" />
                  <input type="url" placeholder="URL photo (optionnel)" value={formData.avatar.startsWith('data:') ? '' : formData.avatar} onChange={e => { const safeAvatarUrl = sanitizeAvatarUrl(e.target.value); setFormData({ ...formData, avatar: safeAvatarUrl }); setAvatarPreview(safeAvatarUrl); }} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent" />
                </div>
                {avatarPreview && (
                  <div className="mt-3 flex justify-center">
                    <img src={avatarPreview} alt="Aperçu" className="w-20 h-20 rounded-full object-cover border border-gray-200" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent">
                    <option value="draft">Brouillon</option>
                    <option value="published">Publié</option>
                  </select>
                </div>
                <div className="pt-4 flex justify-end space-x-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Annuler</button>
                  <button type="submit" disabled={isSaving} className="px-4 py-2 bg-[#0099DC] text-white rounded-lg hover:bg-[#007bb5] transition-colors flex items-center justify-center">
                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />}
                    Enregistrer
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


