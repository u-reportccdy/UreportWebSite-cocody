import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, CalendarIcon, Edit2Icon, Trash2Icon, XIcon, SearchIcon, Loader2, ExternalLink } from 'lucide-react';
import { 
  fetchGalleryAlbums, 
  createGalleryAlbum, 
  updateGalleryAlbum, 
  deleteGalleryAlbum 
} from '../../services/content.service';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { resizeImageToDataUrl } from '../../utils/imageResize';

export function Gallery() {
  const confirm = useConfirm();
  const [albums, setAlbums] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);

  const sanitizeImageUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    try {
      const parsed = new URL(trimmed);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : '';
    } catch {
      return '';
    }
  };

  // State for Album Modal (Add/Edit)
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<any | null>(null);
  const [albumPreview, setAlbumPreview] = useState('');
  const [coverSize, setCoverSize] = useState({ width: 1200, height: 675 });
  const [albumFormData, setAlbumFormData] = useState({
    title: '',
    date: '',
    cover: '',
    external_link: '',
  });

  const loadAlbums = async () => {
    try {
      setIsLoading(true);
      const rows = await fetchGalleryAlbums();
      setAlbums(rows || []);
    } catch (err) {
      console.error('Erreur chargement albums:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlbums();
  }, []);

  // Album CRUDS Handlers
  const handleOpenAlbumModal = (album: any = null) => {
    if (album) {
      setEditingAlbum(album);
      setAlbumPreview(album.cover_url || album.cover || '');
      setAlbumFormData({
        title: album.title || '',
        date: album.event_date || album.date || '',
        cover: album.cover_url || album.cover || '',
        external_link: album.external_link || '',
      });
    } else {
      setEditingAlbum(null);
      setAlbumPreview('');
      setAlbumFormData({
        title: '',
        date: '',
        cover: '',
        external_link: '',
      });
    }
    setIsAlbumModalOpen(true);
  };

  const handleAlbumCoverUpload = (file: File | null) => {
    if (!file) {
      setAlbumFormData(prev => ({ ...prev, cover: '' }));
      setAlbumPreview('');
      return;
    }
    resizeImageToDataUrl(file, coverSize).then((base64) => {
      setAlbumFormData(prev => ({ ...prev, cover: base64 }));
      setAlbumPreview(base64);
    }).catch(err => console.error('Erreur upload couverture:', err));
  };

  const handleSaveAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const payload = {
      title: albumFormData.title,
      event_date: albumFormData.date || null,
      cover_url: albumFormData.cover,
      external_link: albumFormData.external_link,
    };

    try {
      if (editingAlbum) {
        await updateGalleryAlbum(editingAlbum.id, payload);
      } else {
        await createGalleryAlbum(payload);
      }
      await loadAlbums();
      setIsAlbumModalOpen(false);
    } catch (err) {
      console.error('Erreur sauvegarde album:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAlbum = async (albumId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await confirm({ title: 'Supprimer cet album ?', message: 'Il sera retiré de l’administration et du site public.', confirmText: 'Supprimer', danger: true });
    if (!ok) return;
    try {
      await deleteGalleryAlbum(albumId);
      setAlbums(prev => prev.filter(a => a.id !== albumId));
    } catch (err) {
      console.error('Erreur suppression album:', err);
    }
  };

  const filteredAlbums = albums.filter(a => 
    a.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6" translate="no">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Rechercher un album..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 text-gray-900 placeholder-gray-500 shadow-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC]" 
          />
        </div>
        <button onClick={() => handleOpenAlbumModal()} className="flex items-center space-x-2 bg-[#0099DC] text-white px-4 py-2 rounded-lg hover:bg-[#007bb5] transition-colors whitespace-nowrap">
          <PlusIcon className="w-5 h-5" />
          <span>Créer un album</span>
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Chargement de la galerie...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAlbums.map((album) => (
            <div key={album.id} onClick={() => handleOpenAlbumModal(album)} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group cursor-pointer hover:shadow-md transition-all flex flex-col justify-between">
              <div className="relative h-48 overflow-hidden bg-gray-50">
                <img 
                  src={album.cover_url || album.cover || 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=500&auto=format&fit=crop&q=60'} 
                  alt={album.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute top-2 right-2 flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => handleDeleteAlbum(album.id, e)} className="p-1.5 bg-white/95 text-gray-700 hover:text-red-500 rounded-lg shadow-sm backdrop-blur-sm transition-colors" title="Supprimer">
                    <Trash2Icon className="w-4 h-4" />
                  </button>
                </div>
                {album.external_link && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 flex items-end justify-between">
                    <span className="text-white text-xs font-semibold px-2 py-0.5 bg-white/20 rounded backdrop-blur-sm flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> Lien Drive
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4 flex-grow flex flex-col justify-between">
                <h3 className="font-bold text-[#1E293B] mb-2 line-clamp-2 group-hover:text-[#0099DC] transition-colors">{album.title}</h3>
                <div className="flex items-center text-xs text-[#64748B] mt-auto">
                  <CalendarIcon className="w-3.5 h-3.5 mr-1" />
                  {album.event_date || album.date ? new Date(album.event_date || album.date).toLocaleDateString('fr-FR') : 'Non daté'}
                </div>
              </div>
            </div>
          ))}

          {filteredAlbums.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 text-center py-12 text-[#64748B]">
              Aucun album photo trouvé.
            </div>
          )}
        </div>
      )}

      {/* ALBUM ADD/EDIT MODAL */}
      <AnimatePresence>
        {isAlbumModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden my-8">
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">{editingAlbum ? "Modifier l'album" : 'Créer un nouvel album'}</h3>
                <button type="button" onClick={() => setIsAlbumModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XIcon className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSaveAlbum} className="p-5 sm:p-6 space-y-3 max-h-[calc(90vh-88px)] overflow-y-auto custom-scrollbar scroll-smooth overscroll-contain">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre de l'album</label>
                  <input required type="text" value={albumFormData.title} onChange={e => setAlbumFormData({ ...albumFormData, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de l'action / événement</label>
                  <input required type="date" value={albumFormData.date} onChange={e => setAlbumFormData({ ...albumFormData, date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent" />
                </div>
                <div className="grid gap-3">
                  <label className="block text-sm font-medium text-gray-700">Image de Couverture</label>
                  <input type="file" accept="image/*" onChange={e => handleAlbumCoverUpload(e.target.files?.[0] ?? null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#0099DC] file:text-white hover:file:bg-[#007bb5]" />
                  <input type="url" placeholder="Ou URL image couverture" value={albumFormData.cover.startsWith('data:') ? '' : albumFormData.cover} onChange={e => { const safeUrl = sanitizeImageUrl(e.target.value); setAlbumFormData({ ...albumFormData, cover: safeUrl }); setAlbumPreview(safeUrl); }} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent" />
                </div>
                {albumPreview && (
                  <div className="mt-3 relative h-40 rounded-lg overflow-hidden border border-gray-200">
                    <img src={albumPreview} alt="Aperçu" className="w-full h-full object-cover" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lien externe (Google Drive, Photos, etc.)</label>
                  <input type="url" placeholder="Ex: https://drive.google.com/drive/folders/..." value={albumFormData.external_link} onChange={e => setAlbumFormData({ ...albumFormData, external_link: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent" />
                  <p className="text-xs text-gray-500 mt-1">Au clic, l'utilisateur sera redirigé vers ce lien pour voir toutes les photos.</p>
                </div>
                <div className="pt-4 flex justify-end space-x-3">
                  <button type="button" onClick={() => setIsAlbumModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Annuler</button>
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


