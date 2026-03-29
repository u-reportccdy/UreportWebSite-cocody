import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, SearchIcon, Edit2Icon, Trash2Icon, EyeIcon, XIcon } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const initialArticles = [
  { 
    id: 1, 
    title: "L'impact de la jeunesse à Cocody : Bilan 2024", 
    category: 'Actualités', 
    status: 'Publié', 
    date: '14 Oct 2024', 
    views: 1240,
    image: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=800&q=80',
    excerpt: 'Retour sur les actions marquantes menées par la jeunesse engagée de Cocody au cours de lannée écoulée.',
    content: 'Découvrez notre bilan annuel complet sur lengagement citoyen...'
  },
  { 
    id: 2, 
    title: "Comment s'engager dans sa commune ?", 
    category: 'Formation', 
    status: 'Publié', 
    date: '10 Oct 2024', 
    views: 856,
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
    excerpt: 'Guide pratique pour rejoindre le mouvement et faire entendre votre voix dans votre communauté.',
    content: 'Vous souhaitez vous engager mais vous ne savez pas par où commencer ? Devenir U-Reporter est simple...'
  },
  { 
    id: 3, 
    title: 'Retour sur la journée de salubrité à la Riviera', 
    category: 'Communauté', 
    status: 'Brouillon', 
    date: '05 Oct 2024', 
    views: 0,
    image: 'https://images.unsplash.com/photo-1558522195-e1201b090344?auto=format&fit=crop&w=800&q=80',
    excerpt: 'Mobilisation massive pour une Riviera plus propre. Merci à tous les volontaires présents !',
    content: 'Une action concrète pour notre environnement qui a réuni plus de 100 jeunes...'
  }
];

const quillModules = {
  toolbar: [
    [{ 'header': [2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['blockquote'],
    ['link'],
    ['clean']
  ],
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'blockquote',
  'link'
];

export function Articles() {
  const [articles, setArticles] = useState(initialArticles);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [formData, setFormData] = useState({ 
    title: '', 
    category: 'Actualités', 
    status: 'Brouillon',
    image: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=800&q=80',
    excerpt: '',
    content: ''
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const filteredArticles = articles.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleOpenModal = (article: any = null) => {
    if (article) {
      setEditingArticle(article);
      setFormData({ 
        title: article.title, 
        category: article.category, 
        status: article.status,
        image: article.image || 'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=800&q=80',
        excerpt: article.excerpt || '',
        content: article.content || ''
      });
    } else {
      setEditingArticle(null);
      setFormData({ 
        title: '', 
        category: 'Actualités', 
        status: 'Brouillon',
        image: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=800&q=80',
        excerpt: '',
        content: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Voulez-vous vraiment supprimer cet article ?')) {
      setArticles(articles.filter(a => a.id !== id));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingArticle) {
      setArticles(articles.map(a => a.id === editingArticle.id ? { ...a, ...formData } : a));
    } else {
      const newArticle = {
        id: Date.now(),
        ...formData,
        date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
        views: 0
      };
      setArticles([newArticle, ...articles]);
    }
    setIsModalOpen(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }} 
      className="space-y-6"
      translate="no"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Rechercher un article..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 text-gray-900 placeholder-gray-500 shadow-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC]" />
        </div>
        <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 bg-[#0099DC] text-white px-4 py-2 rounded-lg hover:bg-[#007bb5] transition-colors whitespace-nowrap">
          <PlusIcon className="w-5 h-5" />
          <span>Créer un article</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[#64748B] text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Titre</th>
                <th className="px-6 py-4 font-medium">Catégorie</th>
                <th className="px-6 py-4 font-medium">Statut</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Vues</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredArticles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={article.image || 'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=100&q=80'} className="w-10 h-10 object-cover rounded" alt="" />
                      <p className="text-sm font-semibold text-[#1E293B]">{article.title}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="text-sm text-[#64748B] bg-gray-100 px-2.5 py-1 rounded-md">{article.category}</span></td>
                  <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${article.status === 'Publié' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{article.status}</span></td>
                  <td className="px-6 py-4 text-sm text-[#64748B]">{article.date}</td>
                  <td className="px-6 py-4 text-sm text-[#64748B]">{article.views.toLocaleString('fr-FR')}</td>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden my-8">
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">{editingArticle ? 'Modifier l\'article' : 'Créer un article'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XIcon className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                    <input required type="text" value={formData.title} onChange={e => handleInputChange('title', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0099DC]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image de couverture</label>
                    <div className="flex items-center gap-3">
                      {formData.image && (
                        <img src={formData.image} alt="Preview" className="w-10 h-10 object-cover rounded border border-gray-200" />
                      )}
                      <label className="flex-1 cursor-pointer">
                        <div className="w-full px-4 py-2 border border-dashed border-gray-300 rounded-lg text-xs text-center text-gray-500 hover:border-[#0099DC] hover:text-[#0099DC] transition-all">
                          Cliquer pour uploader
                        </div>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                handleInputChange('image', reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                    <select value={formData.category} onChange={e => handleInputChange('category', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0099DC]">
                      <option>Actualités</option>
                      <option>Formation</option>
                      <option>Communauté</option>
                      <option>Santé</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                    <select value={formData.status} onChange={e => handleInputChange('status', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0099DC]">
                      <option>Brouillon</option>
                      <option>Publié</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Résumé (apparaît sur la liste)</label>
                  <textarea rows={2} value={formData.excerpt} onChange={e => handleInputChange('excerpt', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0099DC]" placeholder="Bref résumé de l'article..." />
                </div>

                <div className="space-y-2 pb-16">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contenu complet</label>
                  <div className="bg-white rounded-lg border border-gray-300">
                    <ReactQuill 
                      theme="snow"
                      value={formData.content}
                      onChange={(val) => handleInputChange('content', val)}
                      modules={quillModules}
                      formats={quillFormats}
                      className="h-64 mb-12"
                      placeholder="Redigez votre contenu ici..."
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end space-x-3 sticky bottom-0 bg-white pb-2 z-10 border-t border-gray-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Annuler</button>
                  <button type="submit" className="px-4 py-2 bg-[#0099DC] text-white rounded-lg hover:bg-[#007bb5] transition-colors">{editingArticle ? 'Enregistrer' : 'Créer'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}