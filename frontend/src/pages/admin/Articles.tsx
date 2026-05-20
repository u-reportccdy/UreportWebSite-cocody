import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, SearchIcon, Edit2Icon, Trash2Icon, XIcon, Loader2 } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { createArticle, deleteArticle, fetchArticles, updateArticle } from '../../services/article.service';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { resizeImageToDataUrl } from '../../utils/imageResize';

const quillModules = {
  toolbar: [[{ header: [2, 3, false] }], ['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link'], ['clean']],
};

export function Articles() {
  const confirm = useConfirm();
  const [articles, setArticles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageSize, setImageSize] = useState({ width: 1200, height: 675 });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Actualites',
    status: 'Brouillon',
    image: '',
    excerpt: '',
    content: '',
    author: 'U-Report Cocody',
  });

  const slugify = (value: string) =>
    value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const loadArticles = async () => {
    setIsLoading(true);
    try {
      const rows = await fetchArticles();
      setArticles(rows.map((article: any) => ({
        ...article,
        image: article.image || article.image_url,
        date: article.date || article.published_at || article.created_at,
        statusLabel: article.status === 'published' ? 'Publie' : 'Brouillon',
        views: article.views || 0,
      })));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadArticles().catch(err => console.error('Erreur chargement articles admin:', err));
  }, []);

  const filteredArticles = articles.filter(article => article.title?.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleOpenModal = (article: any = null) => {
    if (article) {
      setEditingArticle(article);
      setImagePreview(article.image || '');
      setFormData({
        title: article.title || '',
        category: article.category || 'Actualites',
        status: article.status === 'published' ? 'Publie' : 'Brouillon',
        image: article.image || '',
        excerpt: article.excerpt || '',
        content: article.content || '',
        author: article.author || 'U-Report Cocody',
      });
    } else {
      setEditingArticle(null);
      setImagePreview('');
      setFormData({ title: '', category: 'Actualites', status: 'Brouillon', image: '', excerpt: '', content: '', author: 'U-Report Cocody' });
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = async (file: File | null) => {
    if (!file) {
      setFormData(prev => ({ ...prev, image: '' }));
      setImagePreview('');
      return;
    }

    return new Promise<void>((resolve, reject) => {
      resizeImageToDataUrl(file, imageSize).then((imageData) => {
        setFormData(prev => ({ ...prev, image: imageData }));
        setImagePreview(imageData);
        resolve();
      }).catch(reject);
    });
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Supprimer cette publication ?',
      message: 'Elle sera retirée de l’administration et du site public.',
      confirmText: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    await deleteArticle(id);
    setArticles(articles.filter(article => article.id !== id));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        title: formData.title,
        slug: editingArticle?.slug || slugify(formData.title),
        excerpt: formData.excerpt,
        content: formData.content,
        image_url: formData.image,
        category: formData.category,
        author: formData.author || 'U-Report Cocody',
        status: formData.status === 'Publie' ? 'published' : 'draft',
        published_at: formData.status === 'Publie' ? new Date().toISOString() : null,
      };

      if (editingArticle) {
        await updateArticle(editingArticle.id, payload);
      } else {
        await createArticle(payload);
      }
      await loadArticles();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Erreur save article:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6" translate="no">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Rechercher un article..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 text-gray-900 placeholder-gray-500 shadow-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC]" />
        </div>
        <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 bg-[#0099DC] text-white px-4 py-2 rounded-lg hover:bg-[#007bb5] transition-colors whitespace-nowrap">
          <PlusIcon className="w-5 h-5" />
          <span>Creer un article</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[#64748B] text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Titre</th>
                <th className="px-6 py-4 font-medium">Categorie</th>
                <th className="px-6 py-4 font-medium">Statut</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12">
                    <div className="flex items-center justify-center gap-2 text-[#64748B]">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm font-medium">Chargement des articles...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-[#64748B]">
                    Aucun article trouve.
                  </td>
                </tr>
              ) : filteredArticles.map(article => (
                <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {article.image && <img src={article.image} className="w-10 h-10 object-cover rounded" alt="" />}
                      <p className="text-sm font-semibold text-[#1E293B]">{article.title}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="text-sm text-[#64748B] bg-gray-100 px-2.5 py-1 rounded-md">{article.category}</span></td>
                  <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${article.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{article.statusLabel}</span></td>
                  <td className="px-6 py-4 text-sm text-[#64748B]">{article.date ? new Date(article.date).toLocaleDateString('fr-FR') : ''}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleOpenModal(article)} className="p-1.5 text-gray-400 hover:text-[#6CC24A] transition-colors rounded-md hover:bg-green-50"><Edit2Icon className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(article.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-md hover:bg-red-50"><Trash2Icon className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden my-8">
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">{editingArticle ? "Modifier l'article" : 'Creer un article'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XIcon className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-3 max-h-[calc(90vh-88px)] overflow-y-auto custom-scrollbar scroll-smooth overscroll-contain">
                <input required type="text" placeholder="Titre" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent" />
                <div className="grid gap-3">
                  <input type="file" accept="image/*" onChange={async e => await handleImageUpload(e.target.files?.[0] ?? null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#0099DC] file:text-white hover:file:bg-[#007bb5]" />
                  <input type="url" placeholder="URL image (optionnel)" value={formData.image.startsWith('data:') ? '' : formData.image} onChange={e => { setFormData({ ...formData, image: e.target.value }); setImagePreview(e.target.value); }} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent" />
                </div>
                {imagePreview && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
                    <img src={imagePreview} alt="Aperçu" className="w-full h-48 object-cover" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent">
                    <option>Actualites</option><option>Formation</option><option>Communaute</option><option>Sante</option>
                  </select>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent">
                    <option>Brouillon</option><option>Publie</option>
                  </select>
                </div>
                <input required type="text" placeholder="Auteur de l'article" value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent" />
                <textarea rows={2} placeholder="Resume" value={formData.excerpt} onChange={e => setFormData({ ...formData, excerpt: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent" />
                <div className="bg-white rounded-lg border border-gray-300 pb-12">
                  <ReactQuill theme="snow" value={formData.content} onChange={value => setFormData({ ...formData, content: value })} modules={quillModules} className="h-64" />
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


