import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Boxes,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  RotateCcw,
  Calendar,
  Loader2,
  AlertTriangle,
  FileText,
  Shirt,
  Users,
  Eye,
  Check,
  X,
  Hourglass,
  Clock,
  Award,
  MessageSquare,
  MessageCircle,
  Briefcase,
  LayoutDashboard,
  Save,
  Share2,
  RefreshCw,
  TrendingUp,
  Sliders,
  CheckSquare,
  ClipboardList
} from 'lucide-react';
import {
  fetchMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  fetchLogisticsRequests,
  createLogisticsRequest,
  updateLogisticsRequest,
  deleteLogisticsRequest
} from '../../services/logistics.service';
import { fetchEvents, fetchEventRegistrations, fetchAttendanceSummary, markEventAttendance } from '../../services/event.service';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import api from '../../services/api';

export function Logistics() {
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState<'fiche_individuelle' | 'overview' | 'presences' | 'inventory' | 'requests'>('fiche_individuelle');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fiche Individuelle search & details state
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [selectedMemberProfile, setSelectedMemberProfile] = useState<any | null>(null);
  const [isUpdatingMemberTshirt, setIsUpdatingMemberTshirt] = useState(false);
  
  // Notes state
  const [notesText, setNotesText] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Pagination for activities
  const [activityPage, setActivityPage] = useState(1);
  const activitiesPerPage = 5;

  // Materials state
  const [materials, setMaterials] = useState<any[]>([]);
  const [materialSearch, setMaterialSearch] = useState('');
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [materialForm, setMaterialForm] = useState({
    name: '',
    total_quantity: 0,
    available_quantity: 0,
    condition: 'good'
  });

  // Requests state
  const [requests, setRequests] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    event_id: '',
    material_id: '',
    quantity: 1
  });

  // Suivi des Présences states
  const [selectedRegEventId, setSelectedRegEventId] = useState('');
  const [regEventQuery, setRegEventQuery] = useState('');
  const [isRegEventListOpen, setIsRegEventListOpen] = useState(false);
  const [eventRegs, setEventRegs] = useState<any[]>([]);
  const [eventRegSummary, setEventRegSummary] = useState<any>(null);
  const [isRegsLoading, setIsRegsLoading] = useState(false);
  const [regsSearchQuery, setRegsSearchQuery] = useState('');

  // Global stats state
  const [globalStats, setGlobalStats] = useState({
    totalUReporters: 0,
    tshirtsDistributed: 0,
    tshirtsPending: 0,
    activePercent: 0,
  });

  // Load initial data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [materialsData, requestsData, eventsData] = await Promise.all([
        fetchMaterials(),
        fetchLogisticsRequests(),
        fetchEvents()
      ]);
      setMaterials(materialsData || []);
      setRequests(requestsData || []);
      setEvents(eventsData || []);
      
      // Load members to calculate stats
      const membersRes = await api.get('/members');
      const allMembers = membersRes.data.data || [];
      const activeUReporters = allMembers.filter((m: any) => m.status === 'ureporter' || m.status === 'mentor');
      const distributed = activeUReporters.filter((m: any) => m.tshirt_received);
      const pending = activeUReporters.filter((m: any) => !m.tshirt_received);
      
      setGlobalStats({
        totalUReporters: activeUReporters.length,
        tshirtsDistributed: distributed.length,
        tshirtsPending: pending.length,
        activePercent: activeUReporters.length ? Math.round((distributed.length / activeUReporters.length) * 100) : 0
      });
    } catch (error) {
      console.error('Erreur de chargement des données logistiques:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData().catch(err => console.error(err));
  }, []);

  const loadEventRegistrations = async (eventId: string) => {
    if (!eventId) return;
    setIsRegsLoading(true);
    try {
      const [regRows, attendanceSummary] = await Promise.all([
        fetchEventRegistrations(eventId),
        fetchAttendanceSummary(eventId),
      ]);
      setEventRegs(regRows || []);
      setEventRegSummary(attendanceSummary);
    } catch (err) {
      console.error('Erreur chargement presences logistique:', err);
    } finally {
      setIsRegsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRegEventId) {
      loadEventRegistrations(selectedRegEventId);
    }
  }, [selectedRegEventId]);

  const handleToggleAttendance = async (registrationId: string, attended: boolean) => {
    if (!selectedRegEventId) return;
    try {
      await markEventAttendance(selectedRegEventId, registrationId, attended);
      await loadEventRegistrations(selectedRegEventId);
      await loadData(); // Refresh overview numbers
    } catch (err) {
      console.error('Erreur toggle attendance:', err);
      alert('Une erreur est survenue.');
    }
  };

  const handleExportRegsCSV = () => {
    const selectedEvent = events.find(e => e.id === selectedRegEventId);
    const escapeCsv = (value: any) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rowsToExport = eventRegs.filter(user => {
      const haystack = `${user.full_name || ''} ${user.email || ''} ${user.phone || ''}`.toLowerCase();
      return haystack.includes(regsSearchQuery.toLowerCase());
    });
    if (rowsToExport.length === 0) {
      alert("Aucune donnée à exporter.");
      return;
    }
    const headers = ['Nom', 'Email', 'Telephone', 'Statut membre', 'Presence', 'Date inscription'];
    const csvContent = rowsToExport.map(user => [
      escapeCsv(user.full_name || user.name || ''),
      escapeCsv(user.email || ''),
      escapeCsv(user.phone || user.telephone || ''),
      escapeCsv(user.member_status || user.status || ''),
      escapeCsv(user.attended ? 'Present' : 'Absent'),
      escapeCsv(user.created_at || user.date_inscription || ''),
    ].join(';')).join('\r\n');

    const title = selectedEvent ? selectedEvent.title : 'activite';
    const fullContent = '\uFEFF' + 'sep=;\r\n' + headers.join(';') + '\r\n' + csvContent;
    const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `presences_${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered materials list
  const filteredMaterials = useMemo(() => {
    return materials.filter(m =>
      m.name?.toLowerCase().includes(materialSearch.toLowerCase())
    );
  }, [materials, materialSearch]);

  // Open modal for material creation/edit
  const handleOpenMaterialModal = (material?: any) => {
    if (material) {
      setEditingMaterial(material);
      setMaterialForm({
        name: material.name,
        total_quantity: material.total_quantity,
        available_quantity: material.available_quantity,
        condition: material.condition
      });
    } else {
      setEditingMaterial(null);
      setMaterialForm({
        name: '',
        total_quantity: 0,
        available_quantity: 0,
        condition: 'good'
      });
    }
    setIsMaterialModalOpen(true);
  };

  // Save material changes
  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingMaterial) {
        const diff = materialForm.total_quantity - editingMaterial.total_quantity;
        const finalAvailable = Math.max(0, editingMaterial.available_quantity + diff);

        await updateMaterial(editingMaterial.id, {
          ...materialForm,
          available_quantity: finalAvailable
        });
      } else {
        await createMaterial({
          ...materialForm,
          available_quantity: materialForm.total_quantity
        });
      }
      setIsMaterialModalOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete material
  const handleDeleteMaterial = async (id: string) => {
    const ok = await confirm({
      title: 'Supprimer ce matériel ?',
      message: 'Cela supprimera également l’historique des réservations associées.',
      confirmText: 'Supprimer',
      danger: true
    });
    if (!ok) return;

    try {
      await deleteMaterial(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Save new logistics request
  const handleSaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.event_id || !requestForm.material_id || requestForm.quantity <= 0) return;

    const selectedMat = materials.find(m => m.id === requestForm.material_id);
    if (!selectedMat) return;
    if (selectedMat.available_quantity < requestForm.quantity) {
      alert(`Stock insuffisant. Disponible: ${selectedMat.available_quantity}`);
      return;
    }

    setIsSaving(true);
    try {
      await createLogisticsRequest({
        ...requestForm,
        status: 'pending'
      });
      setIsRequestModalOpen(false);
      setRequestForm({ event_id: '', material_id: '', quantity: 1 });
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Update request status
  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected' | 'returned') => {
    try {
      await updateLogisticsRequest(id, { status });
      await loadData();
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      alert('Une erreur est survenue lors du changement de statut.');
    }
  };

  // Delete reservation request
  const handleDeleteRequest = async (id: string) => {
    const ok = await confirm({
      title: 'Supprimer cette demande ?',
      message: 'Cette action annulera et supprimera définitivement la réservation.',
      confirmText: 'Supprimer',
      danger: true
    });
    if (!ok) return;

    try {
      await deleteLogisticsRequest(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Search members for custom combobox
  const handleSearchMembers = async (queryStr: string) => {
    setMemberSearchQuery(queryStr);
    if (!queryStr.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    setIsSearchingMembers(true);
    setShowSearchDropdown(true);
    try {
      const response = await api.get(`/members`, { params: { q: queryStr } });
      setSearchResults(response.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingMembers(false);
    }
  };

  // Select a member and load their activities & awards
  const handleSelectMember = async (member: any) => {
    setSelectedMember(member);
    setNotesText(member.integration_note || '');
    setActivityPage(1);
    setSelectedMemberProfile(null);
    try {
      const response = await api.get(`/members/${member.id}/activities`);
      setSelectedMemberProfile(response.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Update fields on member profile (interview, tshirt, is_pco, commission)
  const handleUpdateMemberField = async (field: string, value: any) => {
    if (!selectedMember) return;
    setIsUpdatingMemberTshirt(true);
    try {
      const response = await api.patch(`/members/${selectedMember.id}`, { [field]: value });
      const updated = Array.isArray(response.data.data) ? response.data.data[0] : response.data.data;
      setSelectedMember(updated);
      
      // Update local cache details
      const profileRes = await api.get(`/members/${selectedMember.id}/activities`);
      setSelectedMemberProfile(profileRes.data.data);
      
      // Refresh global stats too
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la mise à jour des informations.');
    } finally {
      setIsUpdatingMemberTshirt(false);
    }
  };

  // Save notes
  const handleSaveNotes = async () => {
    if (!selectedMember) return;
    setIsSavingNotes(true);
    try {
      await api.patch(`/members/${selectedMember.id}`, { integration_note: notesText });
      setSelectedMember((prev: any) => ({ ...prev, integration_note: notesText }));
      alert('Notes enregistrées avec succès !');
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la sauvegarde des notes.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Age group helper
  const getAgeGroupLabel = (birthDateStr: string) => {
    if (!birthDateStr) return 'Non renseigné';
    try {
      const birth = new Date(birthDateStr);
      const now = new Date();
      const age = now.getFullYear() - birth.getFullYear() - (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate()) ? 1 : 0);
      if (age < 18) return 'Moins de 18 ans';
      if (age >= 18 && age <= 21) return '18-21 ans';
      if (age >= 22 && age <= 25) return '22-25 ans';
      if (age >= 26 && age <= 30) return '26-30 ans';
      return 'Plus de 30 ans';
    } catch (err) {
      return 'Non renseigné';
    }
  };

  const getMembershipDurationMonths = (createdAtStr: string) => {
    if (!createdAtStr) return 0;
    const created = new Date(createdAtStr);
    const now = new Date();
    return (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
  };

  const getMembershipMonthYear = (createdAtStr: string) => {
    if (!createdAtStr) return 'N/A';
    try {
      return new Date(createdAtStr).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    } catch (err) {
      return 'N/A';
    }
  };

  const hasTwoConsecutiveAttendances = (activities: any[]) => {
    if (!activities || activities.length < 2) return false;
    const sorted = [...activities]
      .filter((a: any) => a.event_date)
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].attended && sorted[i+1].attended) {
        return true;
      }
    }
    return false;
  };

  const getConditionBadge = (cond: string) => {
    switch (cond) {
      case 'good':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-150 text-green-800 border border-green-200">Excellent</span>;
      case 'damaged':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">Endommagé</span>;
      case 'lost':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">Perdu</span>;
      default:
        return null;
    }
  };

  const getStatusBadge = (stat: string) => {
    switch (stat) {
      case 'pending':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">En attente</span>;
      case 'approved':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-150 text-green-800 border border-green-200">Approuvé</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">Refusé</span>;
      case 'returned':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">Retourné</span>;
      default:
        return null;
    }
  };

  // Activity list variables
  const memberActivities = selectedMemberProfile?.activities || [];
  const totalActivities = memberActivities.length;
  const totalPages = Math.ceil(totalActivities / activitiesPerPage) || 1;
  const paginatedActivities = useMemo(() => {
    const start = (activityPage - 1) * activitiesPerPage;
    return memberActivities.slice(start, start + activitiesPerPage);
  }, [memberActivities, activityPage]);

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[720px] bg-slate-50 border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      
      {/* Looker Studio Left Vertical Sidebar */}
      <aside className="w-full lg:w-60 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col shrink-0">
        
        {/* Header Looker Studio Title */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#0099DC]" />
            <span className="font-extrabold text-sm tracking-wider uppercase text-slate-700">logisitique</span>
          </div>
          <div className="flex gap-1">
            <button onClick={loadData} className="p-1 hover:bg-slate-200 rounded text-slate-500" title="Réinitialiser / Recharger">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button className="p-1 hover:bg-slate-200 rounded text-slate-500" title="Partager">
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Sub Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          <button
            onClick={() => setActiveTab('fiche_individuelle')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm ${
              activeTab === 'fiche_individuelle'
                ? 'bg-[#0099DC]/10 text-[#0099DC]'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>fiche individuelle</span>
          </button>
          
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm ${
              activeTab === 'overview'
                ? 'bg-[#0099DC]/10 text-[#0099DC]'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>vue d'ensemble</span>
          </button>

          <button
            onClick={() => setActiveTab('presences')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm ${
              activeTab === 'presences'
                ? 'bg-[#0099DC]/10 text-[#0099DC]'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <ClipboardList className="w-4 h-4 shrink-0" />
            <span>suivi des présences</span>
          </button>
          
          <div className="h-px bg-slate-150 my-3" />
          <div className="px-4 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Administration matériel</div>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm ${
              activeTab === 'inventory'
                ? 'bg-[#0099DC]/10 text-[#0099DC]'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Boxes className="w-4 h-4 shrink-0" />
            <span>Inventaire du Matériel</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm ${
              activeTab === 'requests'
                ? 'bg-[#0099DC]/10 text-[#0099DC]'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span>Demandes Réservation</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 p-6 overflow-y-auto bg-slate-50 flex flex-col gap-6">
        
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200 p-20 shadow-xs">
            <Loader2 className="w-8 h-8 animate-spin text-[#0099DC]" />
            <span className="text-sm font-bold text-slate-500">Chargement du backoffice logistique...</span>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="w-full space-y-6"
            >
              
              {/* VIEW 1: FICHE INDIVIDUELLE */}
              {activeTab === 'fiche_individuelle' && (
                <div className="space-y-6">
                  
                  {/* Header Selector bar */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white border border-slate-250 rounded-xl shadow-xs gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-lg border border-slate-200">
                        <Users className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">FICHE PERSONNELLE</h3>
                        <p className="text-slate-400 text-xs font-semibold">Suivi d'intégration et critères d'attribution T-shirt</p>
                      </div>
                    </div>

                    {/* Custom Search Select Combobox */}
                    <div className="relative w-full sm:w-80">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Rechercher un membre par nom ou numéro..."
                          value={memberSearchQuery}
                          onChange={e => handleSearchMembers(e.target.value)}
                          onFocus={() => setShowSearchDropdown(true)}
                          className="w-full pl-10 pr-9 py-2.5 text-xs font-bold border border-slate-300 text-slate-800 placeholder-slate-400 shadow-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] bg-white"
                        />
                        {memberSearchQuery && (
                          <button
                            onClick={() => {
                              setMemberSearchQuery('');
                              setSearchResults([]);
                              setShowSearchDropdown(false);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      
                      {showSearchDropdown && (memberSearchQuery.trim() !== '') && (
                        <div className="absolute right-0 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto divide-y divide-slate-100">
                          {isSearchingMembers ? (
                            <div className="p-4 text-center text-xs text-slate-400 font-semibold flex items-center justify-center gap-1.5">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0099DC]" />
                              <span>Recherche...</span>
                            </div>
                          ) : searchResults.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400 font-semibold">Aucun membre trouvé</div>
                          ) : (
                            searchResults.map(m => (
                              <button
                                key={m.id}
                                onClick={() => {
                                  handleSelectMember(m);
                                  setMemberSearchQuery(m.full_name);
                                  setShowSearchDropdown(false);
                                }}
                                className="w-full text-left p-3 hover:bg-[#0099DC]/5 transition-colors flex flex-col gap-0.5"
                              >
                                <span className="font-extrabold text-sm text-slate-850">{m.full_name}</span>
                                <span className="text-xs text-slate-500 font-bold">{m.phone} ({m.commune || 'Cocody'})</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedMember ? (
                    <div className="space-y-6">
                      
                      {/* Two Columns: Personal Info VS Participation */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Demographic Box */}
                        <div className="bg-white border border-slate-250 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                          <div className="space-y-6">
                            <div className="text-center pb-4 border-b border-slate-100">
                              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0099DC] bg-[#0099DC]/10 px-2.5 py-1 rounded">Membre</span>
                              <h4 className="text-2xl font-black text-slate-900 tracking-tight mt-2">{selectedMember.full_name}</h4>
                            </div>

                            {/* 4 Info Boxes Grid */}
                            <div className="grid grid-cols-2 gap-4">
                              
                              {/* 1. Phone WhatsApp */}
                              <a
                                href={`https://wa.me/${selectedMember.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-slate-50/50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl p-4 flex flex-col gap-1.5 transition duration-200"
                              >
                                <div className="flex items-center justify-between text-slate-400">
                                  <span className="text-[10px] font-black uppercase tracking-wider">Téléphone</span>
                                  <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                </div>
                                <span className="block font-black text-sm text-slate-850">{selectedMember.phone}</span>
                              </a>

                              {/* 2. Sexe */}
                              <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 flex flex-col gap-1.5">
                                <div className="flex items-center justify-between text-slate-400">
                                  <span className="text-[10px] font-black uppercase tracking-wider">Sexe</span>
                                  <Users className="w-4 h-4 text-[#0099DC] shrink-0" />
                                </div>
                                <span className="block font-black text-sm text-slate-850 capitalize">
                                  {selectedMember.sex === 'homme' ? 'Homme' : selectedMember.sex === 'femme' ? 'Femme' : 'Non précisé'}
                                </span>
                              </div>

                              {/* 3. Age Group */}
                              <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 flex flex-col gap-1.5">
                                <div className="flex items-center justify-between text-slate-400">
                                  <span className="text-[10px] font-black uppercase tracking-wider">Tranche d'âge</span>
                                  <Calendar className="w-4 h-4 text-[#0099DC] shrink-0" />
                                </div>
                                <span className="block font-black text-sm text-slate-850">{getAgeGroupLabel(selectedMember.birth_date)}</span>
                              </div>

                              {/* 4. Commission Role */}
                              <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 flex flex-col gap-1.5">
                                <div className="flex items-center justify-between text-slate-400">
                                  <span className="text-[10px] font-black uppercase tracking-wider">Commission</span>
                                  <Briefcase className="w-4 h-4 text-amber-600 shrink-0" />
                                </div>
                                <span className="block font-black text-sm text-slate-850 truncate">{selectedMember.commission || 'Non assignée'}</span>
                              </div>

                            </div>

                            {/* Logistics Switches Control Box */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                              <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Sliders className="w-3.5 h-3.5 text-[#0099DC]" />
                                <span>Contrôles logistiques d'intégration</span>
                              </h5>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                
                                {/* Commission Selection */}
                                <div className="bg-white p-2.5 rounded-lg border border-slate-150 flex flex-col gap-1.5 shadow-xs">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Assigner Commission</label>
                                  <select
                                    value={selectedMember.commission || ''}
                                    onChange={e => handleUpdateMemberField('commission', e.target.value)}
                                    disabled={isUpdatingMemberTshirt}
                                    className="w-full text-xs font-bold bg-white text-slate-700 outline-none border border-slate-200 p-1.5 rounded"
                                  >
                                    <option value="">Aucune</option>
                                    <option value="Trésorerie">Trésorerie</option>
                                    <option value="Secrétariat Général">Secrétariat Général</option>
                                    <option value="Communication">Communication</option>
                                    <option value="Finances">Finances & Cotisations</option>
                                    <option value="Logistique">Logistique</option>
                                    <option value="Activités & Programmes">Activités & Programmes</option>
                                    <option value="Ressources Humaines">Ressources Humaines</option>
                                  </select>
                                </div>

                                {/* Checklist checkboxes */}
                                <div className="space-y-2 flex flex-col justify-center">
                                  
                                  <label className="flex items-center gap-2.5 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={!!selectedMember.interview_passed}
                                      disabled={isUpdatingMemberTshirt}
                                      onChange={e => handleUpdateMemberField('interview_passed', e.target.checked)}
                                      className="w-4 h-4 text-[#0099DC] border-slate-350 rounded focus:ring-0"
                                    />
                                    <span className="text-xs font-bold text-slate-700">Entretien validé</span>
                                  </label>

                                  <label className="flex items-center gap-2.5 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={!!selectedMember.is_pco}
                                      disabled={isUpdatingMemberTshirt}
                                      onChange={e => handleUpdateMemberField('is_pco', e.target.checked)}
                                      className="w-4 h-4 text-[#0099DC] border-slate-350 rounded focus:ring-0"
                                    />
                                    <span className="text-xs font-bold text-slate-700">Rôle PCO d'activité</span>
                                  </label>

                                </div>

                              </div>
                            </div>
                          </div>

                          {/* Attribute T-shirt distribution button */}
                          <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-2 mt-4">
                            {selectedMember.status === 'aspirant' && (
                              <p className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-1 rounded border border-red-100">
                                ⚠️ Le statut du membre doit être Actif (U-Reporter) ou Mentor.
                              </p>
                            )}
                            
                            <button
                              disabled={selectedMember.tshirt_received || isUpdatingMemberTshirt}
                              onClick={() => handleUpdateMemberField('tshirt_received', true)}
                              className={`w-full py-3 rounded-xl font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 ${
                                selectedMember.tshirt_received
                                  ? 'bg-green-100 text-green-700 border border-green-200 cursor-not-allowed'
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                              }`}
                            >
                              <Shirt className="w-4.5 h-4.5" />
                              <span>
                                {selectedMember.tshirt_received
                                  ? 'T-shirt déjà distribué'
                                  : 'Valider et distribuer le T-shirt'}
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Activities Table Card */}
                        <div className="bg-white border border-slate-250 rounded-2xl p-6 shadow-xs flex flex-col justify-between min-h-[360px]">
                          <div className="space-y-4">
                            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Resumé participation activités</h4>
                              <span className="text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                                {totalActivities} activités
                              </span>
                            </div>
                            
                            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold">
                                    <th className="p-3 pl-4">Date_activite</th>
                                    <th className="p-3">Libelle_activite</th>
                                    <th className="p-3 pr-4 text-right">Présence</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                  {paginatedActivities.length > 0 ? (
                                    paginatedActivities.map((act: any) => (
                                      <tr key={act.id} className="hover:bg-slate-50/50">
                                        <td className="p-3 pl-4 whitespace-nowrap font-bold text-slate-500">
                                          {act.event_date ? new Date(act.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                        </td>
                                        <td className="p-3 font-extrabold text-slate-800 max-w-[180px] truncate" title={act.event_title}>
                                          {act.event_title}
                                        </td>
                                        <td className="p-3 pr-4 text-right whitespace-nowrap">
                                          {act.attended ? (
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-green-50 text-green-700 border border-green-200">Présent</span>
                                          ) : (
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-400 border border-slate-200">Inscrit</span>
                                          )}
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan={3} className="p-8 text-center text-slate-400 font-bold">Aucune participation enregistrée</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Pagination controls */}
                          {totalPages > 1 && (
                            <div className="flex items-center justify-end gap-2.5 pt-4 text-xs font-bold text-slate-500">
                              <span>
                                {Math.min(totalActivities, (activityPage - 1) * activitiesPerPage + 1)}-
                                {Math.min(totalActivities, activityPage * activitiesPerPage)} / {totalActivities}
                              </span>
                              <div className="flex gap-1">
                                <button
                                  disabled={activityPage === 1}
                                  onClick={() => setActivityPage(p => p - 1)}
                                  className="p-1 hover:bg-slate-100 border border-slate-200 rounded disabled:opacity-50"
                                >
                                  &lt;
                                </button>
                                <button
                                  disabled={activityPage === totalPages}
                                  onClick={() => setActivityPage(p => p + 1)}
                                  className="p-1 hover:bg-slate-100 border border-slate-200 rounded disabled:opacity-50"
                                >
                                  &gt;
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Bottom Layout: Metrics Box VS Notes Box */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Decision metrics: column-span 2 */}
                        <div className="bg-white border border-slate-250 rounded-2xl p-6 shadow-xs lg:col-span-2 space-y-4">
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider text-center border-b border-slate-100 pb-3">
                            Métrique décision T-shirt
                          </h4>

                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                            
                            {/* 1. Ancienneté */}
                            {(() => {
                              const months = getMembershipDurationMonths(selectedMember.created_at);
                              const eligible = months >= 6;
                              return (
                                <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-4 flex flex-col items-center justify-between text-center gap-3.5 min-h-[160px]">
                                  <Hourglass className={`w-8 h-8 ${eligible ? 'text-green-600' : 'text-slate-400'}`} />
                                  <div className="space-y-1">
                                    <span className="block text-[10px] font-black text-slate-700 leading-snug">
                                      Membre depuis {getMembershipMonthYear(selectedMember.created_at)}
                                    </span>
                                  </div>
                                  <span className={`inline-flex items-center gap-1 text-xs font-black uppercase ${
                                    eligible ? 'text-green-600' : 'text-red-500'
                                  }`}>
                                    <span>{eligible ? '✔' : '❌'}</span>
                                  </span>
                                </div>
                              );
                            })()}

                            {/* 2. Régularité */}
                            {(() => {
                              const eligible = hasTwoConsecutiveAttendances(selectedMemberProfile?.activities || []);
                              return (
                                <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-4 flex flex-col items-center justify-between text-center gap-3.5 min-h-[160px]">
                                  <Clock className={`w-8 h-8 ${eligible ? 'text-green-600' : 'text-slate-400'}`} />
                                  <div className="space-y-1">
                                    <span className="block text-[10px] font-black text-slate-700 leading-snug">
                                      2 activités consécutives
                                    </span>
                                  </div>
                                  <span className={`inline-flex items-center gap-1 text-xs font-black uppercase ${
                                    eligible ? 'text-green-600' : 'text-red-500'
                                  }`}>
                                    <span>{eligible ? '✔' : '❌'}</span>
                                  </span>
                                </div>
                              );
                            })()}

                            {/* 3. Responsabilité */}
                            {(() => {
                              const eligible = !!selectedMember.is_pco;
                              return (
                                <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-4 flex flex-col items-center justify-between text-center gap-3.5 min-h-[160px]">
                                  <Award className={`w-8 h-8 ${eligible ? 'text-green-600' : 'text-slate-400'}`} />
                                  <div className="space-y-1">
                                    <span className="block text-[10px] font-black text-slate-700 leading-snug">
                                      Vice PCO activité
                                    </span>
                                  </div>
                                  <span className={`inline-flex items-center gap-1 text-xs font-black uppercase ${
                                    eligible ? 'text-green-600' : 'text-red-500'
                                  }`}>
                                    <span>{eligible ? '✔' : '❌'}</span>
                                  </span>
                                </div>
                              );
                            })()}

                            {/* 4. Entretien */}
                            {(() => {
                              const eligible = !!selectedMember.interview_passed;
                              return (
                                <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-4 flex flex-col items-center justify-between text-center gap-3.5 min-h-[160px]">
                                  <MessageSquare className={`w-8 h-8 ${eligible ? 'text-green-600' : 'text-slate-400'}`} />
                                  <div className="space-y-1">
                                    <span className="block text-[10px] font-black text-slate-700 leading-snug">
                                      {eligible ? "Entretien validé" : "Pas d'entretien passé"}
                                    </span>
                                  </div>
                                  <span className={`inline-flex items-center gap-1 text-xs font-black uppercase ${
                                    eligible ? 'text-green-600' : 'text-red-500'
                                  }`}>
                                    <span>{eligible ? '✔' : '❌'}</span>
                                  </span>
                                </div>
                              );
                            })()}

                            {/* 5. Historique T-shirt */}
                            {(() => {
                              const eligible = !selectedMember.tshirt_received;
                              return (
                                <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-4 flex flex-col items-center justify-between text-center gap-3.5 min-h-[160px]">
                                  <Shirt className={`w-8 h-8 ${eligible ? 'text-green-600' : 'text-slate-400'}`} />
                                  <div className="space-y-1">
                                    <span className="block text-[10px] font-black text-slate-700 leading-snug">
                                      {eligible ? "Pas encore de t-shirt" : "T-shirt déjà reçu"}
                                    </span>
                                  </div>
                                  <span className={`inline-flex items-center gap-1 text-xs font-black uppercase ${
                                    eligible ? 'text-green-600' : 'text-red-500'
                                  }`}>
                                    <span>{eligible ? '✔' : '❌'}</span>
                                  </span>
                                </div>
                              );
                            })()}

                          </div>
                        </div>

                        {/* Notes card */}
                        <div className="bg-white border border-slate-250 rounded-2xl p-6 shadow-xs lg:col-span-1 flex flex-col justify-between">
                          <div className="space-y-3 flex-1 flex flex-col">
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                              Notes
                            </h4>
                            <textarea
                              value={notesText}
                              onChange={e => setNotesText(e.target.value)}
                              placeholder="Notes et commentaires d'intégration du membre..."
                              className="w-full flex-1 p-3 text-xs border border-slate-200 rounded-xl outline-none resize-none focus:ring-1 focus:ring-[#0099DC] bg-slate-50/20 font-medium min-h-[120px]"
                            />
                          </div>
                          
                          <button
                            onClick={handleSaveNotes}
                            disabled={isSavingNotes}
                            className="mt-4 w-full py-2.5 bg-[#0099DC] hover:bg-[#007bb5] text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
                          >
                            {isSavingNotes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            <span>Enregistrer les notes</span>
                          </button>
                        </div>

                      </div>

                    </div>
                  ) : (
                    <div className="bg-white border border-slate-250 rounded-2xl p-20 text-center text-slate-400 font-bold space-y-4 shadow-xs">
                      <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto text-[#0099DC]">
                        <Shirt className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-black text-slate-900">Aucune fiche sélectionnée</h3>
                        <p className="text-slate-400 text-xs font-semibold max-w-sm mx-auto">
                          Veuillez rechercher et sélectionner un membre dans la barre de recherche en haut à droite.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* VIEW 2: VUE D'ENSEMBLE */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-200 pb-3">VUE D'ENSEMBLE LOGISTIQUE</h3>
                  
                  {/* KPIs Summary widgets */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    
                    <div className="bg-white border border-slate-250 rounded-xl p-5 shadow-xs flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">U-Reporters Actifs</span>
                        <span className="block text-2xl font-black text-slate-800 mt-1">{globalStats.totalUReporters}</span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-[#0099DC]/10 flex items-center justify-center text-[#0099DC]">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="bg-white border border-slate-250 rounded-xl p-5 shadow-xs flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">T-shirts Distribués</span>
                        <span className="block text-2xl font-black text-slate-800 mt-1">{globalStats.tshirtsDistributed}</span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                        <Shirt className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="bg-white border border-slate-250 rounded-xl p-5 shadow-xs flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">En attente / Pendings</span>
                        <span className="block text-2xl font-black text-slate-800 mt-1">{globalStats.tshirtsPending}</span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
                        <Hourglass className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="bg-white border border-slate-250 rounded-xl p-5 shadow-xs flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Taux d'équipement</span>
                        <span className="block text-2xl font-black text-slate-800 mt-1">{globalStats.activePercent}%</span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                    </div>

                  </div>

                  {/* Stock Materials summary cards */}
                  <div className="bg-white border border-slate-250 rounded-xl p-6 shadow-xs space-y-4">
                    <h4 className="text-sm font-black text-slate-850 uppercase tracking-wider">Résumé de l'Inventaire Matériel</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {materials.slice(0, 6).map((m: any) => (
                        <div key={m.id} className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-slate-350 transition duration-200">
                          <div>
                            <span className="font-extrabold text-sm text-slate-800">{m.name}</span>
                            <div className="mt-2 flex items-baseline gap-2">
                              <span className="text-2xl font-black text-slate-900">{m.available_quantity}</span>
                              <span className="text-xs text-slate-450 font-bold">disponibles / {m.total_quantity}</span>
                            </div>
                          </div>
                          <div className="mt-3.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-450">
                            <span>État de marche</span>
                            <span>{m.condition === 'good' ? 'Excellent' : m.condition === 'damaged' ? 'Endommagé' : 'Perdu'}</span>
                          </div>
                        </div>
                      ))}
                      {materials.length === 0 && (
                        <div className="col-span-3 p-12 text-center text-xs font-bold text-slate-400 bg-slate-50 rounded-xl">
                          Aucun matériel enregistré.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW: SUIVI DES PRESENCES */}
              {activeTab === 'presences' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
                    {/* Activity Selector Card */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative">
                      <label className="block text-xs font-black uppercase text-slate-500 mb-2">Choisir une Activité</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={regEventQuery}
                          onFocus={() => setIsRegEventListOpen(true)}
                          onChange={(e) => {
                            setRegEventQuery(e.target.value);
                            setIsRegEventListOpen(true);
                          }}
                          placeholder="Rechercher une activité..."
                          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0099DC]"
                        />
                        {isRegEventListOpen && (
                          <div className="absolute z-30 mt-2 w-full max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg divide-y divide-slate-100">
                            {events
                              .filter(e => e.title?.toLowerCase().includes(regEventQuery.toLowerCase()))
                              .map(event => (
                                <button
                                  key={event.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedRegEventId(event.id);
                                    setRegEventQuery(event.title || '');
                                    setIsRegEventListOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 transition-colors"
                                >
                                  <div className="font-extrabold text-slate-800">{event.title}</div>
                                  <div className="text-[10px] text-slate-400 font-bold">{event.location || '-'} {event.date ? `- ${event.date}` : ''}</div>
                                </button>
                              ))}
                            {events.filter(e => e.title?.toLowerCase().includes(regEventQuery.toLowerCase())).length === 0 && (
                              <div className="px-4 py-3 text-xs text-slate-400 font-bold">Aucune activité trouvée.</div>
                            )}
                          </div>
                        )}
                      </div>
                      {selectedRegEventId && (
                        <p className="mt-2 text-xs text-slate-450 font-bold">
                          Activité active : {events.find(e => e.id === selectedRegEventId)?.location} {events.find(e => e.id === selectedRegEventId)?.date ? `- ${events.find(e => e.id === selectedRegEventId)?.date}` : ''}
                        </p>
                      )}
                    </div>

                    {/* Stats Summary Card */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-slate-500">Taux de Présence</span>
                        <span className="text-xl font-black text-[#0099DC]">{eventRegSummary ? Math.round(eventRegSummary.percentage_attended) : 0}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden mt-2">
                        <div 
                          className="h-full bg-green-500 transition-all duration-300" 
                          style={{ width: `${eventRegSummary ? Math.min(eventRegSummary.percentage_attended, 100) : 0}%` }} 
                        />
                      </div>
                      <p className="mt-3 text-xs text-slate-450 font-bold">
                        {eventRegSummary?.attended || 0} présents sur {eventRegSummary?.total_registered || 0} inscrits
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="relative w-full sm:w-80">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Filtrer les participants..." 
                        value={regsSearchQuery} 
                        onChange={e => setRegsSearchQuery(e.target.value)} 
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 text-xs font-bold text-slate-800 placeholder-slate-400 shadow-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC]" 
                      />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button 
                        onClick={() => selectedRegEventId && loadEventRegistrations(selectedRegEventId)} 
                        disabled={!selectedRegEventId}
                        className="flex items-center justify-center gap-1.5 bg-white border border-slate-250 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors w-full sm:w-auto text-xs font-bold disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRegsLoading ? 'animate-spin' : ''}`} />
                        <span>Actualiser</span>
                      </button>
                      <button 
                        onClick={handleExportRegsCSV} 
                        disabled={!selectedRegEventId || eventRegs.length === 0}
                        className="flex items-center justify-center gap-1.5 bg-white border border-slate-250 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors w-full sm:w-auto text-xs font-bold disabled:opacity-50"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Exporter CSV</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200">
                            <th className="px-6 py-4 pl-6 font-bold">Participant</th>
                            <th className="px-6 py-4 font-bold">Contact</th>
                            <th className="px-6 py-4 font-bold">Statut</th>
                            <th className="px-6 py-4 font-bold">Présence</th>
                            <th className="px-6 py-4 pr-6 text-right font-bold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {isRegsLoading ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-12">
                                <div className="flex items-center justify-center gap-2 text-slate-400">
                                  <Loader2 className="w-4 h-4 animate-spin text-[#0099DC]" />
                                  <span className="font-bold">Chargement des présences...</span>
                                </div>
                              </td>
                            </tr>
                          ) : eventRegs
                              .filter(user => `${user.full_name || ''} ${user.email || ''} ${user.phone || ''}`.toLowerCase().includes(regsSearchQuery.toLowerCase()))
                              .map(user => (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-6 py-4 pl-6 font-bold text-slate-900">{user.full_name}</td>
                                  <td className="px-6 py-4">
                                    <div className="font-semibold text-slate-800">{user.email || 'Pas d\'email'}</div>
                                    <div className="text-slate-400 font-bold mt-0.5">{user.phone}</div>
                                  </td>
                                  <td className="px-6 py-4 font-bold text-slate-450 uppercase">{user.member_status}</td>
                                  <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                      user.attended 
                                        ? 'bg-green-50 text-green-700 border-green-200' 
                                        : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                    }`}>
                                      {user.attended ? 'Présent' : 'Non marqué'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 pr-6 text-right space-x-2 whitespace-nowrap">
                                    <button 
                                      onClick={() => handleToggleAttendance(user.id, true)} 
                                      className="p-1 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded border border-transparent hover:border-green-200 transition" 
                                      title="Marquer présent"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => handleToggleAttendance(user.id, false)} 
                                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition" 
                                      title="Marquer absent"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          {!isRegsLoading && eventRegs.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-bold bg-white">
                                {selectedRegEventId ? "Aucune inscription enregistrée pour cette activité." : "Veuillez choisir une activité ci-dessus."}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 3: INVENTORY */}
              {activeTab === 'inventory' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="relative w-full sm:w-96">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Rechercher du matériel..."
                        value={materialSearch}
                        onChange={e => setMaterialSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-350 text-slate-900 placeholder-slate-400 shadow-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] bg-white font-medium text-sm"
                      />
                    </div>
                    <button
                      onClick={() => handleOpenMaterialModal()}
                      className="flex items-center space-x-2 bg-[#0099DC] text-white px-4 py-2.5 rounded-lg hover:bg-[#007bb5] transition-colors whitespace-nowrap text-sm font-bold shadow-md shadow-[#0099DC]/10"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ajouter du matériel</span>
                    </button>
                  </div>

                  <div className="bg-white rounded-xl shadow-xs border border-slate-250 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                          <th className="p-4 pl-6">Nom</th>
                          <th className="p-4">Quantité Totale</th>
                          <th className="p-4">Disponible</th>
                          <th className="p-4">État de marche</th>
                          <th className="p-4 pr-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                        {filteredMaterials.map(m => (
                          <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 pl-6 font-bold text-slate-900">{m.name}</td>
                            <td className="p-4 font-semibold">{m.total_quantity}</td>
                            <td className="p-4">
                              <span className={`font-black ${m.available_quantity === 0 ? 'text-red-500' : 'text-slate-900'}`}>
                                {m.available_quantity}
                              </span>
                            </td>
                            <td className="p-4">{getConditionBadge(m.condition)}</td>
                            <td className="p-4 pr-6 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => handleOpenMaterialModal(m)}
                                className="p-1.5 text-slate-400 hover:text-[#0099DC] hover:bg-[#0099DC]/10 rounded-lg transition"
                                title="Modifier"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMaterial(m.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredMaterials.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400 font-bold bg-white">
                              Aucun matériel trouvé dans l'inventaire.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW 4: REQUESTS */}
              {activeTab === 'requests' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#0099DC]" />
                      <span>Réservations de matériel</span>
                    </h3>
                    <button
                      onClick={() => setIsRequestModalOpen(true)}
                      className="flex items-center space-x-2 bg-[#0099DC] text-white px-4 py-2.5 rounded-lg hover:bg-[#007bb5] transition-colors whitespace-nowrap text-sm font-bold shadow-md shadow-[#0099DC]/10"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Nouvelle réservation</span>
                    </button>
                  </div>

                  <div className="bg-white rounded-xl shadow-xs border border-slate-250 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                          <th className="p-4 pl-6">Événement</th>
                          <th className="p-4">Matériel</th>
                          <th className="p-4">Quantité</th>
                          <th className="p-4">Statut</th>
                          <th className="p-4 pr-6 text-right">Décision / Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm text-slate-750">
                        {requests.map(r => (
                          <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 pl-6">
                              <div className="font-extrabold text-slate-900 max-w-xs truncate">{r.event?.title || 'Événement supprimé'}</div>
                            </td>
                            <td className="p-4 font-bold text-slate-800">{r.material?.name || 'Matériel supprimé'}</td>
                            <td className="p-4 font-black">{r.quantity}</td>
                            <td className="p-4">{getStatusBadge(r.status)}</td>
                            <td className="p-4 pr-6 text-right whitespace-nowrap">
                              <div className="inline-flex gap-1.5">
                                {r.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleUpdateStatus(r.id, 'approved')}
                                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      <span>Approuver</span>
                                    </button>
                                    <button
                                      onClick={() => handleUpdateStatus(r.id, 'rejected')}
                                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                      <span>Rejeter</span>
                                    </button>
                                  </>
                                )}
                                {r.status === 'approved' && (
                                  <button
                                    onClick={() => handleUpdateStatus(r.id, 'returned')}
                                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Retourné</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteRequest(r.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition ml-1"
                                  title="Supprimer la réservation"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {requests.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400 font-bold bg-white">
                              Aucune demande de réservation enregistrée.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* MATERIAL MODAL (ADD / EDIT) */}
      <AnimatePresence>
        {isMaterialModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingMaterial ? 'Modifier le matériel' : 'Ajouter un nouveau matériel'}
                </h3>
                <button
                  onClick={() => setIsMaterialModalOpen(false)}
                  className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveMaterial} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Nom du matériel</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: Gilets U-Report, Chaises, Sonorisation..."
                    value={materialForm.name}
                    onChange={e => setMaterialForm({ ...materialForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:bg-white text-slate-800 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase">Quantité totale</label>
                    <input
                      required
                      type="number"
                      min={0}
                      value={materialForm.total_quantity}
                      onChange={e => setMaterialForm({ ...materialForm, total_quantity: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:bg-white text-slate-800 transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase">État</label>
                    <select
                      value={materialForm.condition}
                      onChange={e => setMaterialForm({ ...materialForm, condition: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:bg-white text-slate-850 font-semibold transition"
                    >
                      <option value="good">Excellent état</option>
                      <option value="damaged">Endommagé</option>
                      <option value="lost">Perdu</option>
                    </select>
                  </div>
                </div>

                {editingMaterial && (
                  <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg flex gap-2.5 text-xs text-yellow-800 font-semibold leading-relaxed">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-yellow-650" />
                    <span>
                      En modifiant la quantité totale, la quantité disponible sera automatiquement synchronisée avec l'écart.
                    </span>
                  </div>
                )}

                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsMaterialModalOpen(false)}
                    className="px-5 py-2 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2 bg-[#0099DC] hover:bg-[#007bb5] text-white text-sm font-bold rounded-xl transition flex items-center justify-center shadow-md shadow-[#0099DC]/10"
                  >
                    {isSaving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                    <span>Enregistrer</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REQUEST MODAL */}
      <AnimatePresence>
        {isRequestModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900">Nouvelle demande de réservation</h3>
                <button
                  onClick={() => setIsRequestModalOpen(false)}
                  className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveRequest} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Événement associé</label>
                  <select
                    required
                    value={requestForm.event_id}
                    onChange={e => setRequestForm({ ...requestForm, event_id: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:bg-white transition text-sm text-slate-800 font-semibold"
                  >
                    <option value="">Sélectionner un événement</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>
                        {event.title} ({event.event_date})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Matériel à réserver</label>
                  <select
                    required
                    value={requestForm.material_id}
                    onChange={e => setRequestForm({ ...requestForm, material_id: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:bg-white transition text-sm text-slate-800 font-semibold"
                  >
                    <option value="">Sélectionner un matériel</option>
                    {materials.map(m => (
                      <option key={m.id} value={m.id} disabled={m.available_quantity <= 0}>
                        {m.name} (Dispo: {m.available_quantity})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Quantité demandée</label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={requestForm.quantity}
                    onChange={e => setRequestForm({ ...requestForm, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:bg-white transition text-sm text-slate-850 font-bold"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsRequestModalOpen(false)}
                    className="px-5 py-2 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2 bg-[#0099DC] hover:bg-[#007bb5] text-white text-sm font-bold rounded-xl transition flex items-center justify-center shadow-md shadow-[#0099DC]/10"
                  >
                    {isSaving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                    <span>Créer la demande</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
