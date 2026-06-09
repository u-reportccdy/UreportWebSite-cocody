import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, SearchIcon, CalendarIcon, MapPinIcon, UsersIcon, MoreVerticalIcon, XIcon, Edit2Icon, Trash2Icon, Loader2, CheckSquareIcon, QrCode } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { createEvent, deleteEvent, fetchEvents, fetchEventRegistrations, markEventAttendance, registerForEvent, updateEvent } from '../../services/event.service';
import { fetchMemberActivities, fetchMembers } from '../../services/member.service';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { resizeImageToDataUrl } from '../../utils/imageResize';

const quillModules = { toolbar: [['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['clean']] };

const sanitizeImageSrc = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const allowedDataImagePattern =
    /^data:image\/(?:png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+$/i;
  if (allowedDataImagePattern.test(trimmed)) return trimmed;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return parsed.toString();
  } catch {
    return '';
  }
  return '';
};

const statusToApi: Record<string, string> = {
  'A venir': 'upcoming',
  Ouvert: 'ongoing',
  Termine: 'past',
};

const statusFromApi: Record<string, string> = {
  upcoming: 'A venir',
  ongoing: 'Ouvert',
  past: 'Termine',
  cancelled: 'Annule',
};

const memberStatusLabel: Record<string, string> = {
  aspirant: 'Aspirant',
  ureporter: 'U-Reporter',
  mentor: 'Mentor',
};

const normalizeEvent = (event: any) => ({
  ...event,
  date: event.date || event.event_date,
  time: event.time || [event.start_time, event.end_time].filter(Boolean).join(' - '),
  image: event.image || event.image_url,
  whatsapp_link: event.whatsapp_link || '',
  statusLabel: statusFromApi[event.status] || event.status,
  registered: event.registered || 0,
});

const normalizeClock = (value: string) => {
  const v = value.trim().toLowerCase().replace(/\s+/g, '');
  const hFormat = v.match(/^(\d{1,2})h(\d{2})$/);
  if (hFormat) {
    const h = hFormat[1].padStart(2, '0');
    const m = hFormat[2];
    return `${h}:${m}`;
  }
  const colonFormat = v.match(/^(\d{1,2}):(\d{2})$/);
  if (colonFormat) {
    const h = colonFormat[1].padStart(2, '0');
    const m = colonFormat[2];
    return `${h}:${m}`;
  }
  return '';
};

export function Events() {
  const confirm = useConfirm();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageSize, setImageSize] = useState({ width: 1200, height: 675 });
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    location: '',
    date: '',
    time: '',
    capacity: 100,
    status: 'A venir',
    category: 'Formation',
    image: '',
    whatsapp_link: '',
    description: '',
  });

  const [attendanceEventId, setAttendanceEventId] = useState<string | null>(null);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberResults, setMemberResults] = useState<any[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [qrEvent, setQrEvent] = useState<any | null>(null);

  const [profileMember, setProfileMember] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const slugify = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const rows = await fetchEvents();
      setEvents((rows || []).map(normalizeEvent));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents().catch(err => console.error('Erreur chargement activites admin:', err));
  }, []);

  useEffect(() => {
    const loadMembers = async () => {
      const rows = await fetchMembers(memberSearchQuery.trim());
      setMemberResults(rows || []);
    };
    loadMembers().catch(err => console.error('Erreur recherche membres:', err));
  }, [memberSearchQuery]);

  const filteredMemberResults = useMemo(() => {
    const q = memberSearchQuery.trim().toLowerCase();
    if (!q) return memberResults;
    return memberResults.filter((member: any) => {
      const fullName = String(member.full_name || '').toLowerCase();
      const phone = String(member.phone || '').toLowerCase();
      const email = String(member.email || '').toLowerCase();
      const status = String(member.status || '').toLowerCase();
      return fullName.includes(q) || phone.includes(q) || email.includes(q) || status.includes(q);
    });
  }, [memberResults, memberSearchQuery]);

  const filteredEvents = useMemo(
    () => events.filter(event => event.title?.toLowerCase().includes(searchQuery.toLowerCase())),
    [events, searchQuery],
  );

  const handleOpenAttendanceModal = async (eventId: string) => {
    setAttendanceEventId(eventId);
    setIsAttendanceModalOpen(true);
    setMemberSearchQuery('');
    const registrations = await fetchEventRegistrations(eventId);
    const selected = new Set<string>();
    registrations.forEach((reg: any) => {
      if (reg.member_id && reg.attended) selected.add(reg.member_id);
    });
    setSelectedMemberIds(selected);
  };

  const handleToggleAttendanceImmediate = async (member: any, checked: boolean) => {
    if (!attendanceEventId) return;
    const regs = await fetchEventRegistrations(attendanceEventId);
    const existing = regs.find((reg: any) => reg.member_id === member.id);

    if (!existing && checked) {
      const created = await registerForEvent(attendanceEventId, {
        member_id: member.id,
        full_name: member.full_name,
        phone: member.phone,
        email: member.email,
        member_status: member.status,
      });
      await markEventAttendance(attendanceEventId, created.id, true);
    }

    if (existing) {
      await markEventAttendance(attendanceEventId, existing.id, checked);
    }

    setSelectedMemberIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(member.id);
      else next.delete(member.id);
      return next;
    });
    await loadEvents();
  };

  const openProfileModal = async (member: any) => {
    setProfileMember(member);
    const data = await fetchMemberActivities(member.id);
    setProfileData(data);
    setIsProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
    setProfileData(null);
    setProfileMember(null);
  };

  const handleOpenModal = (event?: any) => {
    setActiveDropdownId(null);
    if (event) {
      setEditingEvent(event);
      setImagePreview(event.image || '');
      setFormData({
        title: event.title || '',
        location: event.location || '',
        date: event.date || '',
        time: event.time || '',
        capacity: event.capacity || 100,
        status: event.statusLabel || 'A venir',
        category: event.category || 'Formation',
        image: event.image || '',
        whatsapp_link: event.whatsapp_link || '',
        description: event.description || '',
      });
    } else {
      setEditingEvent(null);
      setImagePreview('');
      setFormData({ title: '', location: '', date: '', time: '', capacity: 100, status: 'A venir', category: 'Formation', image: '', whatsapp_link: '', description: '' });
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
    setActiveDropdownId(null);
    const ok = await confirm({
      title: 'Supprimer cette activité ?',
      message: 'Elle sera retirée de l’administration et du site public.',
      confirmText: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    await deleteEvent(id);
    setEvents(events.filter(event => event.id !== id));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const [rawStart, rawEnd] = formData.time.split('-').map(value => value.trim());
      const startTime = normalizeClock(rawStart);
      const endTime = normalizeClock(rawEnd || '');
      const payload = {
        title: formData.title,
        slug: editingEvent?.slug || slugify(formData.title),
        description: formData.description,
        location: formData.location,
        event_date: formData.date,
        start_time: startTime || null,
        end_time: endTime || null,
        image_url: formData.image,
        whatsapp_link: formData.whatsapp_link,
        category: formData.category,
        capacity: formData.capacity,
        status: statusToApi[formData.status] || 'upcoming',
      };

      if (editingEvent) await updateEvent(editingEvent.id, payload);
      else await createEvent(payload);

      await loadEvents();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Erreur save event:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6" translate="no">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Rechercher une activite..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 text-gray-900 placeholder-gray-500 shadow-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC]" />
        </div>
        <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 bg-[#0099DC] text-white px-4 py-2 rounded-lg hover:bg-[#007bb5] transition-colors whitespace-nowrap">
          <PlusIcon className="w-5 h-5" />
          <span>Creer une activite</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="md:col-span-2 xl:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-12">
            <div className="flex items-center justify-center gap-2 text-[#64748B]">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Chargement des activites...</span>
            </div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-sm text-[#64748B]">
            Aucune activite trouvee.
          </div>
        ) : filteredEvents.map(event => (
          <div key={event.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow relative">
            <div className="aspect-video w-full relative bg-gray-100">
              {event.image && <img src={event.image} className="w-full h-full object-cover" alt="" />}
              <div className="absolute top-4 left-4"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shadow-sm bg-white/90 backdrop-blur-sm text-[#0099DC]">{event.statusLabel}</span></div>
              <button onClick={() => setActiveDropdownId(activeDropdownId === event.id ? null : event.id)} className="absolute top-4 right-4 text-white hover:text-white p-1 rounded-md bg-black/20 hover:bg-black/40 backdrop-blur-sm transition-all"><MoreVerticalIcon className="w-5 h-5" /></button>
            </div>

            {activeDropdownId === event.id && (
              <div className="absolute right-4 top-12 w-48 bg-white border border-gray-100 shadow-lg rounded-lg py-1 z-10">
                <button onClick={() => handleOpenModal(event)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#0099DC] flex items-center"><Edit2Icon className="w-4 h-4 mr-2" /> Modifier</button>
                <button onClick={() => handleOpenAttendanceModal(event.id)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#0099DC] flex items-center"><CheckSquareIcon className="w-4 h-4 mr-2" /> Présences (cocher)</button>
                <button onClick={() => { setQrEvent(event); setActiveDropdownId(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#0099DC] flex items-center"><QrCode className="w-4 h-4 mr-2" /> QR Code Présence</button>
                <button onClick={() => handleDelete(event.id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"><Trash2Icon className="w-4 h-4 mr-2" /> Supprimer</button>
              </div>
            )}

            <div className="p-6">
              <span className="text-[10px] font-black uppercase tracking-wider text-ureport-blue/70 mb-1 block">{event.category || 'Formation'}</span>
              <h3 className="text-lg font-bold text-[#1E293B] line-clamp-1 mb-4">{event.title}</h3>
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-[#64748B]"><CalendarIcon className="w-4 h-4 mr-2 text-[#0099DC] shrink-0" />{event.date} - {event.time}</div>
                <div className="flex items-center text-sm text-[#64748B]"><MapPinIcon className="w-4 h-4 mr-2 text-[#0099DC] shrink-0" /><span className="line-clamp-1">{event.location}</span></div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center text-sm font-medium text-[#1E293B]"><UsersIcon className="w-4 h-4 mr-2 text-[#64748B]" />Inscriptions</div>
                  <span className="text-sm text-[#64748B]">{event.registered} / {event.capacity}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isAttendanceModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/60 overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-8">
              <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-xl font-black text-gray-900">Validation presence</h3>
                <button onClick={() => setIsAttendanceModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"><XIcon className="w-6 h-6" /></button>
              </div>
              <div className="p-6 space-y-4">
                <input type="text" placeholder="Rechercher un membre (nom, tel, email, statut)..." value={memberSearchQuery} onChange={e => setMemberSearchQuery(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099DC]" />
                <div className="max-h-[50vh] overflow-y-auto border border-gray-100 rounded-xl">
                  {filteredMemberResults.map(member => (
                    <div key={member.id} className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
                      <label className="flex items-center gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={selectedMemberIds.has(member.id)}
                          onChange={e => handleToggleAttendanceImmediate(member, e.target.checked)}
                          className="h-4 w-4"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-[#1E293B] truncate">{member.full_name}</div>
                          <div className="text-xs text-[#64748B] truncate">{member.phone} - {member.email || 'Sans email'} - {memberStatusLabel[member.status] || member.status}</div>
                        </div>
                      </label>
                      <button onClick={() => openProfileModal(member)} className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">Profil</button>
                    </div>
                  ))}
                  {filteredMemberResults.length === 0 && <div className="p-5 text-sm text-[#64748B]">Aucun membre.</div>}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isProfileModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/60 overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8">
              <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-xl font-black text-gray-900">Profil membre</h3>
                <button onClick={closeProfileModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"><XIcon className="w-6 h-6" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="font-bold text-[#1E293B]">{profileMember?.full_name}</p>
                  <p className="text-sm text-[#64748B]">{memberStatusLabel[profileData?.summary?.status] || profileData?.summary?.status || '-'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-200 p-3">
                    <p className="text-xs text-gray-500">Activites participees</p>
                    <p className="text-xl font-black text-[#0099DC]">{profileData?.summary?.activities_participated || 0}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3">
                    <p className="text-xs text-gray-500">Inscriptions totales</p>
                    <p className="text-xl font-black text-[#1E293B]">{profileData?.summary?.registrations_total || 0}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-200 p-3">
                    <p className="text-xs text-gray-500">Date de naissance</p>
                    <p className="text-sm font-bold text-[#1E293B]">{profileData?.summary?.birth_date || '-'}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3">
                    <p className="text-xs text-gray-500">Age</p>
                    <p className="text-xl font-black text-[#1E293B]">{profileData?.summary?.age ?? '-'}</p>
                  </div>
                </div>
                <div className="max-h-[40vh] overflow-y-auto border border-gray-100 rounded-xl">
                  {(profileData?.activities || []).map((activity: any) => (
                    <div key={activity.id} className="px-4 py-3 border-b border-gray-100">
                      <div className="font-semibold text-[#1E293B]">{activity.event_title || 'Activite'}</div>
                      <div className="text-xs text-[#64748B]">{activity.event_date || '-'} - {activity.event_location || '-'}</div>
                      <div className="text-xs mt-1 font-semibold">{activity.attended ? 'Present' : 'Absent'}</div>
                    </div>
                  ))}
                  {(profileData?.activities || []).length === 0 && <div className="p-5 text-sm text-[#64748B]">Aucune activite pour ce membre.</div>}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8">
              <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-xl font-black text-gray-900">{editingEvent ? "Modifier l'activite" : 'Creer une activite'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"><XIcon className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4 max-h-[calc(90vh-88px)] overflow-y-auto custom-scrollbar scroll-smooth overscroll-contain">
                <input required type="text" placeholder="Titre" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent focus:bg-white transition-all" />
                <div className="grid gap-3">
                  <input type="file" accept="image/*" onChange={async e => await handleImageUpload(e.target.files?.[0] ?? null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#0099DC] file:text-white hover:file:bg-[#007bb5]" />
                  <input type="url" placeholder="URL photo (optionnel)" value={formData.image.startsWith('data:') ? '' : formData.image} onChange={e => { const safeImageSrc = sanitizeImageSrc(e.target.value); setFormData({ ...formData, image: safeImageSrc }); setImagePreview(safeImageSrc); }} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent focus:bg-white transition-all" />
                </div>
                {imagePreview && <div className="mt-3 rounded-lg overflow-hidden border border-gray-200"><img src={imagePreview} alt="Apercu" className="w-full h-48 object-cover" /></div>}
                <div className="grid grid-cols-2 gap-4">
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent focus:bg-white"><option>Formation</option><option>Sante</option><option>Environnement</option><option>Culture</option><option>Communaute</option></select>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent focus:bg-white"><option>A venir</option><option>Ouvert</option><option>Termine</option></select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input required type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent focus:bg-white" />
                  <input required type="text" placeholder="09:00-16:00 ou 09h00-16h00" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent focus:bg-white" />
                </div>
                <input required type="text" placeholder="Lieu" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent focus:bg-white" />
                <input type="url" placeholder="Lien WhatsApp de l'activité (optionnel)" value={formData.whatsapp_link} onChange={e => setFormData({ ...formData, whatsapp_link: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent focus:bg-white" />
                <input required type="number" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent focus:bg-white" />
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden pb-12"><ReactQuill theme="snow" value={formData.description} onChange={value => setFormData({ ...formData, description: value })} modules={quillModules} className="h-48" /></div>
                <div className="pt-6 flex justify-end space-x-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all">Annuler</button>
                  <button type="submit" disabled={isSaving} className="px-8 py-2.5 bg-[#0099DC] text-white text-sm font-black rounded-xl hover:bg-[#007bb5] transition-all flex items-center justify-center">
                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />}
                    {editingEvent ? 'Modifier' : 'Creer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {qrEvent && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 overflow-y-auto backdrop-blur-xs">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 overflow-hidden text-center relative border border-slate-100">
              <button onClick={() => setQrEvent(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-650 hover:bg-slate-100 rounded-full transition-all"><XIcon className="w-5 h-5" /></button>
              
              <div className="space-y-4 mt-2">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0099DC] bg-[#0099DC]/10 px-2.5 py-1 rounded">CHECK-IN SUR TERRAIN</span>
                  <h3 className="text-base font-black text-slate-900 mt-3 leading-snug">{qrEvent.title}</h3>
                  <p className="text-[11px] text-slate-400 font-bold mt-1">{qrEvent.date} - {qrEvent.location}</p>
                </div>

                <div className="w-56 h-56 mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-center shadow-xs">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                      window.location.origin + '/events/' + qrEvent.id + '/checkin'
                    )}`}
                    alt="QR Code Présence"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500 font-bold max-w-xs mx-auto leading-relaxed">
                    Affichez ou imprimez ce QR Code. Les participants le scannent avec leur smartphone pour s'enregistrer instantanément à l'activité.
                  </p>
                  <div className="pt-2">
                    <a
                      href={window.location.origin + '/events/' + qrEvent.id + '/checkin'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-black text-[#0099DC] hover:underline"
                    >
                      Ouvrir le lien de check-in
                    </a>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setQrEvent(null)}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
