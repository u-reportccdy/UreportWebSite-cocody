import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, SearchIcon, CalendarIcon, MapPinIcon, UsersIcon, MoreVerticalIcon, XIcon, Edit2Icon, Trash2Icon } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const initialEvents = [
  { 
    id: 1, 
    title: 'Journée de sensibilisation au VIH/SIDA', 
    date: '15 Oct 2024', 
    time: '08:00 - 14:00', 
    location: 'Université FHB, Cocody', 
    status: 'À venir', 
    registered: 145, 
    capacity: 200,
    category: 'Santé',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
    description: 'Une journée dédiée à linformation et au dépistage gratuit pour tous les étudiants.'
  },
  { 
    id: 2, 
    title: 'Formation en leadership jeune', 
    date: '22 Oct 2024', 
    time: '09:00 - 16:00', 
    location: 'Mairie de Cocody', 
    status: 'Ouvert', 
    registered: 42, 
    capacity: 50,
    category: 'Formation',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80',
    description: 'Atelier intensif sur le leadership, la prise de parole en public et la gestion de projets.'
  }
];

const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['clean']
  ],
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Ouvert': return 'bg-green-100 text-green-700';
    case 'À venir': return 'bg-blue-100 text-blue-700';
    case 'Terminé': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export function Events() {
  const [events, setEvents] = useState(initialEvents);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [formData, setFormData] = useState({ 
    title: '', 
    location: '', 
    date: '', 
    time: '', 
    capacity: 100, 
    status: 'À venir',
    category: 'Formation',
    image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80',
    description: ''
  });
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const filteredEvents = events.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleOpenModal = (evt: any = null) => {
    setActiveDropdownId(null);
    if (evt) {
      setEditingEvent(evt);
      setFormData({ 
        title: evt.title, 
        location: evt.location, 
        date: evt.date, 
        time: evt.time, 
        capacity: evt.capacity, 
        status: evt.status,
        category: evt.category || 'Formation',
        image: evt.image || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80',
        description: evt.description || ''
      });
    } else {
      setEditingEvent(null);
      setFormData({ 
        title: '', 
        location: '', 
        date: '', 
        time: '', 
        capacity: 100, 
        status: 'À venir',
        category: 'Formation',
        image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80',
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setActiveDropdownId(null);
    if (window.confirm('Voulez-vous vraiment supprimer cet événement ?')) {
      setEvents(events.filter(e => e.id !== id));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEvent) {
      setEvents(events.map(ev => ev.id === editingEvent.id ? { ...ev, ...formData } : ev));
    } else {
      const newEvent = {
        id: Date.now(),
        ...formData,
        registered: 0
      };
      setEvents([newEvent, ...events]);
    }
    setIsModalOpen(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6" translate="no">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Rechercher un événement..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 text-gray-900 placeholder-gray-500 shadow-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC]" />
        </div>
        <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 bg-[#0099DC] text-white px-4 py-2 rounded-lg hover:bg-[#007bb5] transition-colors whitespace-nowrap">
          <PlusIcon className="w-5 h-5" />
          <span>Créer un événement</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <div key={event.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow relative">
            <div className="aspect-video w-full relative">
              <img src={event.image || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=400&q=80'} className="w-full h-full object-cover" alt="" />
              <div className="absolute top-4 left-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shadow-sm bg-white/90 backdrop-blur-sm ${getStatusColor(event.status)}`}>
                  {event.status}
                </span>
              </div>
              <button onClick={() => setActiveDropdownId(activeDropdownId === event.id ? null : event.id)} className="absolute top-4 right-4 text-white hover:text-white p-1 rounded-md bg-black/20 hover:bg-black/40 backdrop-blur-sm transition-all">
                <MoreVerticalIcon className="w-5 h-5" />
              </button>
            </div>

            {activeDropdownId === event.id && (
              <div className="absolute right-4 top-12 w-36 bg-white border border-gray-100 shadow-lg rounded-lg py-1 z-10">
                <button onClick={() => handleOpenModal(event)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#0099DC] flex items-center">
                  <Edit2Icon className="w-4 h-4 mr-2" /> Modifier
                </button>
                <button onClick={() => handleDelete(event.id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
                  <Trash2Icon className="w-4 h-4 mr-2" /> Supprimer
                </button>
              </div>
            )}

            <div className="p-6">
              <div className="mb-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-ureport-blue/70 mb-1 block">
                  {event.category || 'Formation'}
                </span>
                <h3 className="text-lg font-bold text-[#1E293B] line-clamp-1">{event.title}</h3>
              </div>
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-[#64748B]">
                  <CalendarIcon className="w-4 h-4 mr-2 text-[#0099DC] shrink-0" />
                  {event.date} • {event.time}
                </div>
                <div className="flex items-center text-sm text-[#64748B]">
                  <MapPinIcon className="w-4 h-4 mr-2 text-[#0099DC] shrink-0" />
                  <span className="line-clamp-1">{event.location}</span>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center text-sm font-medium text-[#1E293B]">
                    <UsersIcon className="w-4 h-4 mr-2 text-[#64748B]" />
                    Inscriptions
                  </div>
                  <span className="text-sm text-[#64748B]">{event.registered} / {event.capacity}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${event.registered >= event.capacity ? 'bg-red-500' : 'bg-[#0099DC]'}`} style={{ width: `${(event.registered / event.capacity) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8">
              <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-xl font-black text-gray-900">{editingEvent ? 'Modifier l\'événement' : 'Créer un événement'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"><XIcon className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Titre</label>
                    <input required type="text" value={formData.title} onChange={e => handleInputChange('title', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0099DC] focus:bg-white transition-all outline-none" placeholder="Ex: Campagne de salubrité" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Photo de couverture</label>
                    <div className="flex items-center gap-3">
                      {formData.image && (
                        <img src={formData.image} alt="" className="w-12 h-10 object-cover rounded-lg border border-gray-200 shadow-sm" />
                      )}
                      <label className="flex-1 cursor-pointer group">
                        <div className="w-full px-4 py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-400 group-hover:border-[#0099DC] group-hover:text-[#0099DC] transition-all text-center">
                          Choisir une photo
                        </div>
                        <input type="file" accept="image/*" className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => handleInputChange('image', reader.result as string);
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
                    <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Catégorie</label>
                    <select value={formData.category} onChange={e => handleInputChange('category', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0099DC] focus:bg-white outline-none">
                      <option>Formation</option>
                      <option>Santé</option>
                      <option>Environnement</option>
                      <option>Culture</option>
                      <option>Communauté</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Statut</label>
                    <select value={formData.status} onChange={e => handleInputChange('status', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0099DC] focus:bg-white outline-none">
                      <option>À venir</option>
                      <option>Ouvert</option>
                      <option>Terminé</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Date</label>
                    <input required type="text" placeholder="Ex: 22 Oct 2024" value={formData.date} onChange={e => handleInputChange('date', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0099DC] focus:bg-white outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Heure</label>
                    <input required type="text" placeholder="Ex: 09:00 - 16:00" value={formData.time} onChange={e => handleInputChange('time', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0099DC] focus:bg-white outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Lieu</label>
                  <input required type="text" value={formData.location} onChange={e => handleInputChange('location', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0099DC] focus:bg-white outline-none" placeholder="Ex: Mairie de Cocody" />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Capacité maximale</label>
                  <input required type="number" value={formData.capacity} onChange={e => handleInputChange('capacity', parseInt(e.target.value) || 0)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0099DC] focus:bg-white outline-none" />
                </div>

                <div className="space-y-2 pb-12">
                  <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Description & Programme</label>
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <ReactQuill theme="snow" value={formData.description} onChange={(val) => handleInputChange('description', val)} modules={quillModules} className="h-48 mb-12" placeholder="Détaillez le programme..." />
                  </div>
                </div>

                <div className="pt-6 flex justify-end space-x-3 sticky bottom-0 bg-white/80 backdrop-blur-sm pb-2 z-10 border-t border-gray-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all">Annuler</button>
                  <button type="submit" className="px-8 py-2.5 bg-[#0099DC] text-white text-sm font-black rounded-xl hover:bg-[#007bb5] shadow-lg shadow-[#0099DC]/30 transition-all transform active:scale-95">{editingEvent ? 'Modifier' : 'Créer'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}