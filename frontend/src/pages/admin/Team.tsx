import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, Edit2Icon, Trash2Icon, XIcon, Loader2 } from 'lucide-react';
import { createTeamMember, deleteTeamMember, fetchTeamMembers, updateTeamMember } from '../../services/content.service';
import { useConfirm } from '../../components/ui/ConfirmDialog';

export function Team() {
  const confirm = useConfirm();
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const toSafeImageSrc = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('/')) return trimmed;
    if (/^data:image\/[a-zA-Z+.-]+;base64,[a-zA-Z0-9+/=]+$/.test(trimmed)) return trimmed;
    try {
      const parsed = new URL(trimmed, window.location.origin);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.toString();
    } catch {
      return '';
    }
    return '';
  };
  const [formData, setFormData] = useState({
    full_name: '',
    role: '',
    team_type: 'bureau',
    bio: '',
    photo_url: '',
    sort_order: 0,
    active: true,
  });

  const load = async () => {
    setIsLoading(true);
    try {
      const rows = await fetchTeamMembers();
      setMembers(rows || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load().catch(err => console.error('Erreur chargement équipe:', err));
  }, []);

  const handleOpen = (member: any = null) => {
    if (member) {
      setEditing(member);
      setFormData({
        full_name: member.full_name || '',
        role: member.role || '',
        team_type: member.team_type || 'bureau',
        bio: member.bio || '',
        photo_url: member.photo_url || '',
        sort_order: member.sort_order || 0,
        active: member.active ?? true,
      });
      setPhotoPreview(member.photo_url || '');
    } else {
      setEditing(null);
      setFormData({ full_name: '', role: '', team_type: 'bureau', bio: '', photo_url: '', sort_order: 0, active: true });
      setPhotoPreview('');
    }
    setIsModalOpen(true);
  };

  const handlePhotoUpload = async (file: File | null) => {
    if (!file) {
      setFormData(prev => ({ ...prev, photo_url: '' }));
      setPhotoPreview('');
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const imageData = reader.result as string;
        setFormData(prev => ({ ...prev, photo_url: imageData }));
        setPhotoPreview(imageData);
        resolve();
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, sort_order: Number(formData.sort_order) || 0 };
    if (editing) await updateTeamMember(editing.id, payload);
    else await createTeamMember(payload);
    await load();
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: 'Supprimer ce membre ?', message: 'Il sera retiré de l’administration et du site public.', confirmText: 'Supprimer', danger: true });
    if (!ok) return;
    await deleteTeamMember(id);
    setMembers(prev => prev.filter(item => item.id !== id));
  };

  const bureau = members.filter(member => member.team_type === 'bureau');
  const devs = members.filter(member => member.team_type === 'developer');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6" translate="no">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#1E293B]">Notre Équipe</h2>
        <button onClick={() => handleOpen()} className="flex items-center space-x-2 bg-[#0099DC] text-white px-4 py-2 rounded-lg hover:bg-[#007bb5]">
          <PlusIcon className="w-5 h-5" />
          <span>Ajouter un membre</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-[#1E293B] mb-3">Membres du bureau</h3>
          <div className="space-y-2">
            {isLoading && (
              <div className="p-6">
                <div className="flex items-center justify-center gap-2 text-[#64748B]">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">Chargement de l'equipe...</span>
                </div>
              </div>
            )}
            {!isLoading && (
              <>
            {bureau.map(member => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={member.photo_url || 'https://placehold.co/80x80'} alt={member.full_name} className="w-10 h-10 rounded-full object-cover" />
                  <div className="min-w-0">
                    <div className="font-semibold text-[#1E293B] truncate">{member.full_name}</div>
                    <div className="text-xs text-[#64748B] truncate">{member.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpen(member)} className="p-2 text-gray-400 hover:text-[#0099DC]"><Edit2Icon className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(member.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2Icon className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            {bureau.length === 0 && <div className="text-sm text-[#64748B] p-3">Aucun membre du bureau.</div>}
              </>
            )}
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-[#1E293B] mb-3">Développeurs de l'application</h3>
          <div className="space-y-2">
            {!isLoading && (
              <>
            {devs.map(member => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={member.photo_url || 'https://placehold.co/80x80'} alt={member.full_name} className="w-10 h-10 rounded-full object-cover" />
                  <div className="min-w-0">
                    <div className="font-semibold text-[#1E293B] truncate">{member.full_name}</div>
                    <div className="text-xs text-[#64748B] truncate">{member.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpen(member)} className="p-2 text-gray-400 hover:text-[#0099DC]"><Edit2Icon className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(member.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2Icon className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            {devs.length === 0 && <div className="text-sm text-[#64748B] p-3">Aucun développeur.</div>}
              </>
            )}
          </div>
        </section>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">{editing ? 'Modifier membre' : 'Ajouter membre'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XIcon className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-3 max-h-[calc(90vh-88px)] overflow-y-auto custom-scrollbar scroll-smooth overscroll-contain">
                <input required type="text" placeholder="Nom complet" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                <input required type="text" placeholder="Fonction / Poste" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                <select value={formData.team_type} onChange={e => setFormData({ ...formData, team_type: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option value="bureau">Bureau</option>
                  <option value="developer">Développeur</option>
                </select>
                <textarea rows={3} placeholder="Bio (optionnel)" value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Photo</label>
                  <input type="file" accept="image/*" onChange={async e => await handlePhotoUpload(e.target.files?.[0] ?? null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#0099DC] file:text-white hover:file:bg-[#007bb5]" />
                  <input type="url" placeholder="URL photo (optionnel)" value={formData.photo_url.startsWith('data:') ? '' : formData.photo_url} onChange={e => { const nextValue = e.target.value; const safePreview = toSafeImageSrc(nextValue); setFormData({ ...formData, photo_url: nextValue }); setPhotoPreview(safePreview); }} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  {photoPreview && <img src={photoPreview} alt="Aperçu" className="w-20 h-20 rounded-full object-cover border border-gray-200" />}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Ordre d'affichage</label>
                  <input type="number" min={0} value={formData.sort_order} onChange={e => setFormData({ ...formData, sort_order: Number(e.target.value) })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  <p className="text-xs text-gray-500">Plus petit = affiché en premier. Laisser `0` si vous n'avez pas d'ordre particulier.</p>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })} /> Actif</label>
                <div className="pt-2 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
                  <button type="submit" className="px-4 py-2 bg-[#0099DC] text-white rounded-lg hover:bg-[#007bb5]">Enregistrer</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
