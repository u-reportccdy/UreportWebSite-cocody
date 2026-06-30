import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Calendar,
  CreditCard,
  Settings,
  CheckCircle2,
  Clock,
  Printer,
  AlertCircle,
  Save,
  Activity,
  Award,
  Phone,
  Mail,
  MapPin,
  Heart,
  Camera,
  FileText,
  Download,
  Trash2,
  Plus,
  Eye,
  X,
  GraduationCap,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  fetchMemberActivities,
  fetchMemberContributions,
  updateMember,
  fetchMemberAwards,
  addMemberAward,
  deleteMemberAward,
  type MemberAward,
} from '../../services/member.service';
import { loadMemberSession, saveMemberSession } from '../../utils/memberSession';
import { Navigate } from 'react-router-dom';
import { PATHS } from '../../routes/paths';
import api from '../../services/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const getStatusLabel = (status: string) => {
  switch (status) {
    case 'mentor': return 'Mentor';
    case 'ureporter': return 'U-Reporter Actif';
    default: return 'Aspirant';
  }
};

const getStatusColors = (status: string) => {
  switch (status) {
    case 'mentor': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'ureporter': return 'bg-blue-100 text-blue-700 border-blue-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

const getAwardIcon = (type: string) => {
  switch (type) {
    case 'ugirl': return '👑';
    case 'best_ureporter': return '🏆';
    case 'award': return '🎖️';
    default: return '⭐';
  }
};

const escapeHtml = (value: unknown): string => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function MemberProfile() {
  const session = loadMemberSession();
  if (!session) return <Navigate to={PATHS.PUBLIC.HOME} replace />;

  const [activeTab, setActiveTab] = useState<'profile' | 'activities' | 'contributions' | 'certificat'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [memberData, setMemberData] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [contributions, setContributions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [awards, setAwards] = useState<MemberAward[]>([]);

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    sex: 'non_precise' as 'homme' | 'femme' | 'non_precise',
    birth_date: '',
    commune: '',
    motivation: '',
  });

  // Awards & Certificates management
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [awardForm, setAwardForm] = useState({
    award_name: '',
    award_type: 'certificate' as 'certificate' | 'award' | 'ugirl' | 'best_ureporter' | 'custom',
    awarded_year: new Date().getFullYear(),
    description: '',
    issuer: '',
    document_url: '',
  });
  const [isSubmittingAward, setIsSubmittingAward] = useState(false);
  const [awardError, setAwardError] = useState('');
  
  // Document Viewer Modal
  const [viewingDoc, setViewingDoc] = useState<MemberAward | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const actRes = await fetchMemberActivities(session.id);
      setMemberData(actRes.member);
      setSummary(actRes.summary);
      setActivities(actRes.activities || []);
      if (actRes.member.avatar_url) setAvatarPreview(actRes.member.avatar_url);

      setFormData({
        full_name: actRes.member.full_name || '',
        phone: actRes.member.phone || '',
        email: actRes.member.email || '',
        sex: actRes.member.sex || 'non_precise',
        birth_date: actRes.member.birth_date || '',
        commune: actRes.member.commune || '',
        motivation: actRes.member.integration_note || '',
      });

      const contRes = await fetchMemberContributions(session.id);
      setContributions(contRes || []);

      const awardsRes = await fetchMemberAwards(session.id);
      setAwards(awardsRes || []);
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les données du membre. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // -------------------------------------------------------------------------
  // Avatar upload
  // -------------------------------------------------------------------------
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('La photo ne doit pas dépasser 2 Mo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setAvatarPreview(dataUrl);
      setIsSavingAvatar(true);
      try {
        await api.patch(`/members/${session.id}`, { avatar_url: dataUrl });
        setSuccessMsg('Photo de profil mise à jour !');
        setMemberData((prev: any) => prev ? { ...prev, avatar_url: dataUrl } : prev);
      } catch {
        setError('Impossible de sauvegarder la photo.');
        setAvatarPreview(memberData?.avatar_url || null);
      } finally {
        setIsSavingAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // -------------------------------------------------------------------------
  // Profile update
  // -------------------------------------------------------------------------
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const updated = await updateMember(session.id, {
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        sex: formData.sex,
        birth_date: formData.birth_date || null,
        commune: formData.commune.trim(),
        status: (memberData?.status || 'aspirant') as 'aspirant' | 'ureporter' | 'mentor',
      });
      saveMemberSession({
        id: session.id,
        full_name: updated.full_name,
      } as any);
      setSuccessMsg('Votre profil a été mis à jour avec succès !');
      loadData();
    } catch (err) {
      console.error(err);
      setError((err as any)?.response?.data?.detail || 'Une erreur est survenue lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------------------------
  // Awards & Certificates handlers
  // -------------------------------------------------------------------------
  const handleAwardFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setAwardError('Le document ne doit pas dépasser 2 Mo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setAwardForm(prev => ({ ...prev, document_url: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddAward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!awardForm.award_name.trim()) {
      setAwardError('Le nom du prix ou de la formation est requis.');
      return;
    }
    setIsSubmittingAward(true);
    setAwardError('');
    try {
      await addMemberAward(session.id, {
        award_name: awardForm.award_name.trim(),
        award_type: awardForm.award_type,
        awarded_year: Number(awardForm.awarded_year),
        description: awardForm.description.trim(),
        issuer: awardForm.award_type === 'certificate' ? awardForm.issuer.trim() : undefined,
        document_url: awardForm.document_url || undefined,
      });
      setAwardForm({
        award_name: '',
        award_type: 'certificate',
        awarded_year: new Date().getFullYear(),
        description: '',
        issuer: '',
        document_url: '',
      });
      setIsAddModalOpen(false);
      loadData();
      setSuccessMsg('Ajouté avec succès !');
    } catch (err: any) {
      console.error(err);
      setAwardError(err?.response?.data?.detail || 'Une erreur est survenue lors de l\'ajout.');
    } finally {
      setIsSubmittingAward(false);
    }
  };

  const handleDeleteAward = async (awardId: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet élément ?')) return;
    try {
      await deleteMemberAward(session.id, awardId);
      loadData();
      setSuccessMsg('L\'élément a été supprimé avec succès.');
    } catch (err) {
      console.error(err);
      setError('Impossible de supprimer l\'élément.');
    }
  };

  // -------------------------------------------------------------------------
  // Print receipt
  // -------------------------------------------------------------------------
  const printReceipt = (contribution: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const formattedDate = contribution.paid_at
      ? new Date(contribution.paid_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : new Date(contribution.created_at).toLocaleDateString('fr-FR');
    printWindow.document.write(`
      <html><head><title>Reçu de Cotisation - U-Report Cocody</title>
      <style>
        body{font-family:'Helvetica Neue',Arial,sans-serif;color:#333;padding:40px;line-height:1.6;background:#fff}
        .receipt-container{max-width:650px;margin:0 auto;border:1px solid #e2e8f0;border-radius:16px;padding:30px;box-shadow:0 4px 6px -1px rgba(0,0,0,.05)}
        .header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #0099DC;padding-bottom:15px;margin-bottom:25px}
        .logo{font-size:24px;font-weight:900;color:#0099DC;text-transform:uppercase;letter-spacing:-1px}
        .logo span{color:#000}
        .receipt-title{font-size:20px;font-weight:800;color:#1e293b;text-align:right}
        .meta-info{display:flex;justify-content:space-between;margin-bottom:25px;font-size:13px;color:#64748b;background:#f8fafc;padding:10px 15px;border-radius:8px}
        .section-title{font-size:14px;font-weight:bold;color:#0099DC;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-bottom:12px;text-transform:uppercase;letter-spacing:.5px}
        .details-grid{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:25px}
        .detail-item label{display:block;font-size:11px;color:#64748b;text-transform:uppercase;margin-bottom:2px}
        .detail-item .value{font-size:15px;font-weight:600;color:#1e293b}
        .amount-box{background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:20px;text-align:center;margin-bottom:25px}
        .amount-value{font-size:30px;font-weight:900;color:#0099DC}
        .status-badge{display:inline-block;background:#bbf7d0;color:#15803d;font-size:11px;font-weight:800;padding:4px 12px;border-radius:9999px;text-transform:uppercase;margin-top:8px}
        .footer{margin-top:30px;border-top:1px solid #e2e8f0;padding-top:15px;text-align:center;font-size:11px;color:#94a3b8}
        @media print{body{padding:0}.receipt-container{border:none;box-shadow:none;padding:0}}
      </style></head><body>
      <div class="receipt-container">
        <div class="header">
          <div class="logo">U-<span>Report</span><br><small style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#0099DC;display:block;margin-top:1px;">Cocody</small></div>
          <div class="receipt-title">REÇU DE COTISATION</div>
        </div>
        <div class="meta-info"><div><strong>N° Trans. :</strong> ${escapeHtml(contribution.id.substring(0, 8).toUpperCase())}</div><div><strong>Date :</strong> ${escapeHtml(formattedDate)}</div></div>
        <div class="section-title">Contributeur</div>
        <div class="details-grid">
          <div class="detail-item"><label>Nom complet</label><div class="value">${escapeHtml(memberData?.full_name || formData.full_name)}</div></div>
          <div class="detail-item"><label>Téléphone</label><div class="value">${escapeHtml(memberData?.phone || formData.phone)}</div></div>
          <div class="detail-item"><label>Email</label><div class="value">${escapeHtml(memberData?.email || 'Non renseignée')}</div></div>
          <div class="detail-item"><label>Statut</label><div class="value" style="text-transform:capitalize;">${escapeHtml(memberData?.status || 'aspirant')}</div></div>
        </div>
        <div class="section-title">Règlement</div>
        <div class="amount-box">
          <div style="font-size:13px;color:#0369a1;font-weight:600;margin-bottom:4px;">Montant Payé</div>
          <div class="amount-value">${contribution.amount.toLocaleString('fr-FR')} XOF</div>
          <span class="status-badge">Confirmé</span>
        </div>
        <div class="footer">U-Report Cocody - Plateforme Communautaire d'Engagement Citoyen.<br>Abidjan, Côte d'Ivoire - Mairie de Cocody.<br>Reçu généré de manière sécurisée en ligne.</div>
      </div>
      <script>window.onload=function(){window.print();setTimeout(function(){window.close();},500);}</script>
      </body></html>
    `);
    printWindow.document.close();
  };



  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  const currentStatus = memberData?.status || session.status || 'aspirant';

  return (
    <div className="bg-gradient-to-b from-[#0099DC]/5 via-white to-gray-50 min-h-[90vh] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── Profile Header Card ── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-[#0099DC] to-[#007cb0] relative">
            {/* Avatar zone */}
            <div className="absolute -bottom-12 left-8">
              <div className="relative w-24 h-24">
                <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-md overflow-hidden">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#0099DC]/10 rounded-xl flex items-center justify-center text-[#0099DC]">
                      <User className="w-12 h-12" />
                    </div>
                  )}
                </div>
                {/* Camera button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSavingAvatar}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#0099DC] text-white rounded-full shadow-md flex items-center justify-center hover:bg-[#007cb0] transition-colors disabled:opacity-60"
                  title="Changer la photo"
                >
                  {isSavingAvatar ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
            </div>
            {/* Status badge */}
            <div className="absolute bottom-4 right-8 bg-white/20 backdrop-blur-md rounded-full px-4 py-1.5 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-white/20">
              <Award className="w-4 h-4" />
              <span>{getStatusLabel(currentStatus)}</span>
            </div>
          </div>
          <div className="pt-16 pb-8 px-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">{memberData?.full_name || session.full_name}</h1>
              <p className="text-gray-500 font-semibold text-sm flex items-center gap-1 mt-1">
                <Phone className="w-4 h-4 text-gray-400" /> {memberData?.phone || session.phone}
                {memberData?.email && (<><span className="text-gray-300">•</span><Mail className="w-4 h-4 text-gray-400" /> {memberData.email}</>)}
              </p>
            </div>
            {summary && (
              <div className="flex gap-4 sm:gap-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="text-center px-4 border-r border-gray-200">
                  <span className="block text-2xl font-black text-[#0099DC]">{summary.registrations_total}</span>
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Inscriptions</span>
                </div>
                <div className="text-center px-4 border-r border-gray-200">
                  <span className="block text-2xl font-black text-emerald-600">{summary.activities_participated}</span>
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Présences</span>
                </div>
                <div className="text-center px-4">
                  <span className="block text-2xl font-black text-purple-600">
                    {summary.registrations_total ? Math.round((summary.activities_participated / summary.registrations_total) * 100) : 0}%
                  </span>
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Assiduité</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="flex flex-wrap bg-white p-1.5 rounded-2xl border border-gray-100 shadow-md gap-1">
          {([
            { key: 'profile', icon: Settings, label: 'Mon Profil' },
            { key: 'activities', icon: Activity, label: `Activités (${activities.length})` },
            { key: 'contributions', icon: CreditCard, label: `Cotisations (${contributions.length})` },
            { key: 'certificat', icon: FileText, label: 'Prix & Certificats' },
          ] as const).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 min-w-max flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === key ? 'bg-[#0099DC] text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-16 text-center">
            <div className="w-12 h-12 border-4 border-[#0099DC] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 font-semibold">Chargement de votre espace membre...</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* ── 1. MON PROFIL ── */}
            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#0099DC]" />
                  <span>Modifier mes informations personnelles</span>
                </h2>
                <div className="mb-6 flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-500">Statut actuel :</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColors(currentStatus)}`}>
                    <Award className="w-3.5 h-3.5" />
                    {getStatusLabel(currentStatus)}
                  </span>
                  <span className="text-xs text-gray-400">(Géré par l'administration)</span>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  {error && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2.5 text-sm font-semibold text-red-600">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /><span>{error}</span>
                    </div>
                  )}
                  {successMsg && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-2.5 text-sm font-semibold text-emerald-600">
                      <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /><span>{successMsg}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Nom Complet" required value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} />
                    <Input label="Numéro de Téléphone (Non modifiable)" required disabled value={formData.phone} inputClassName="bg-gray-50 cursor-not-allowed text-gray-500 border-gray-200" />
                    <Input label="Adresse Email" type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-gray-700">Sexe</label>
                      <select required value={formData.sex} onChange={e => setFormData({ ...formData, sex: e.target.value as any })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent bg-white transition-all">
                        <option value="non_precise">Préfère ne pas préciser</option>
                        <option value="homme">Homme</option>
                        <option value="femme">Femme</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-gray-700">Date de naissance</label>
                      <input type="date" required value={formData.birth_date} onChange={e => setFormData({ ...formData, birth_date: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent bg-white transition-all" />
                    </div>
                    <Input label="Quartier / Commune (Cocody)" required value={formData.commune} onChange={e => setFormData({ ...formData, commune: e.target.value })} />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700">Votre Motivation</label>
                    <textarea disabled rows={3} value={formData.motivation} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed text-sm resize-none" />
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button type="submit" loading={saving} className="px-8 py-3 rounded-xl font-bold flex items-center gap-2">
                      <Save className="w-4 h-4" /><span>Enregistrer les modifications</span>
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Awards card (visible in profile tab) */}
            {activeTab === 'profile' && awards.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  <span>Mes Prix & Distinctions</span>
                  <span className="ml-auto text-xs font-bold px-2.5 py-1 bg-pink-50 text-pink-600 rounded-full border border-pink-100">{awards.length}</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {awards.map(award => (
                    <div key={award.id} className="flex items-start gap-4 p-4 rounded-2xl border border-gray-100 bg-gradient-to-br from-amber-50/60 to-white hover:border-amber-200 transition-all">
                      <div className="text-3xl shrink-0 leading-none">{getAwardIcon(award.award_type)}</div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 truncate">{award.award_name}</div>
                        <div className="text-xs text-gray-500 font-semibold mt-0.5">Année {award.awarded_year}</div>
                        {award.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{award.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── 2. MES ACTIVITÉS ── */}
            {activeTab === 'activities' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#0099DC]" />
                    <span>Historique de mes inscriptions</span>
                  </h2>
                  {activities.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 font-semibold">Vous ne vous êtes inscrit à aucune activité pour le moment.</div>
                  ) : (
                    <div className="space-y-4">
                      {activities.map(act => (
                        <div key={act.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-gray-100 hover:border-[#0099DC]/25 bg-white transition-all shadow-sm gap-4">
                          <div className="space-y-1">
                            <h3 className="text-base font-bold text-gray-900">{act.event_title}</h3>
                            <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-gray-400" />{act.event_date ? new Date(act.event_date).toLocaleDateString('fr-FR') : 'N/A'}</span>
                              <span className="text-gray-300">•</span>
                              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-400" />{act.event_location || 'Lieu non défini'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {act.attended ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-bold text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" />Présent</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-xs font-bold text-gray-500"><Clock className="w-3.5 h-3.5" />Absent / En attente</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── 3. MES COTISATIONS ── */}
            {activeTab === 'contributions' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#0099DC]" />
                    <span>Historique de mes cotisations</span>
                  </h2>
                  {contributions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 font-semibold space-y-4">
                      <p>Vous n'avez effectué aucune cotisation pour le moment.</p>
                      <p className="text-sm text-gray-400">Votre engagement est précieux ! Vous pouvez soutenir les activités de la communauté à tout moment.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-100 text-xs text-gray-500 font-bold uppercase tracking-wider">
                            <th className="py-4 px-4">Référence</th>
                            <th className="py-4 px-4">Date</th>
                            <th className="py-4 px-4">Montant</th>
                            <th className="py-4 px-4">Statut</th>
                            <th className="py-4 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contributions.map(c => (
                            <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <td className="py-4 px-4 text-sm font-bold text-gray-800">#{c.id.substring(0, 8).toUpperCase()}</td>
                              <td className="py-4 px-4 text-xs font-semibold text-gray-500">{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                              <td className="py-4 px-4 text-sm font-extrabold text-[#0099DC]">{c.amount.toLocaleString()} XOF</td>
                              <td className="py-4 px-4">
                                {c.status === 'paid' ? <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-bold text-emerald-600">Payé</span>
                                  : c.status === 'pending' ? <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-50 border border-amber-100 text-xs font-bold text-amber-600">En attente</span>
                                  : <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-50 border border-red-100 text-xs font-bold text-red-600">Échoué</span>}
                              </td>
                              <td className="py-4 px-4 text-right">
                                {c.status === 'paid' && (
                                  <button onClick={() => printReceipt(c)} className="p-2 hover:bg-[#0099DC]/10 text-[#0099DC] rounded-xl transition-all inline-flex items-center gap-1 text-xs font-bold" title="Imprimer le reçu">
                                    <Printer className="w-4 h-4" /><span>Reçu</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── 4. PRIX & CERTIFICATS ── */}
            {activeTab === 'certificat' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                
                {/* Header card */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Mes Prix & Certificats de formation</h2>
                    <p className="text-gray-500 text-sm font-semibold mt-1">
                      Ajoutez et gérez vos diplômes de formation, attestations de réussite et distinctions reçues.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setAwardError('');
                      setIsAddModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-[#0099DC] text-white rounded-xl font-bold text-sm shadow-md hover:bg-[#007cb0] transition-all whitespace-nowrap self-start md:self-center"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter un prix / certificat</span>
                  </button>
                </div>

                {/* Grid / list of awards & certificates */}
                {awards.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-16 text-center space-y-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-400">
                      <GraduationCap className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-gray-900">Aucun prix ou certificat</h3>
                      <p className="text-gray-500 text-sm max-w-md mx-auto">
                        Vous n'avez pas encore ajouté de distinction ou de certificat de formation. Cliquez sur le bouton ci-dessus pour ajouter votre premier élément !
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {awards.map(award => {
                      const isCert = award.award_type === 'certificate';
                      return (
                        <div key={award.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all flex flex-col justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-xl font-bold ${
                              isCert ? 'bg-blue-50 text-[#0099DC]' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {isCert ? <GraduationCap className="w-6 h-6" /> : getAwardIcon(award.award_type)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1 ${
                                isCert ? 'bg-blue-50 text-[#0099DC]' : 'bg-amber-50 text-amber-700'
                              }`}>
                                {isCert ? 'Certificat de formation' : 'Prix / Distinction'}
                              </span>
                              <h3 className="text-base font-bold text-gray-900 leading-snug break-words">{award.award_name}</h3>
                              {award.issuer && (
                                <p className="text-xs text-gray-500 font-semibold mt-1">
                                  Délivré par : <span className="text-gray-700">{award.issuer}</span>
                                </p>
                              )}
                              <p className="text-xs text-gray-400 font-bold mt-1">Année {award.awarded_year}</p>
                              {award.description && (
                                <p className="text-xs text-gray-500 mt-2 leading-relaxed whitespace-pre-wrap">{award.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="border-t border-gray-50 pt-4 flex items-center justify-between">
                            {award.document_url ? (
                              <button
                                onClick={() => setViewingDoc(award)}
                                className="flex items-center gap-1.5 text-xs font-bold text-[#0099DC] hover:text-[#007cb0] transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                                <span>Voir le justificatif</span>
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium italic">Aucun document joint</span>
                            )}
                            <button
                              onClick={() => handleDeleteAward(award.id)}
                              className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Supprimer</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

          </div>
        )}
      </div>

      {/* ── Add Award/Certificate Modal ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100"
          >
            <div className="px-6 py-5 bg-gradient-to-r from-[#0099DC] to-[#007cb0] text-white flex justify-between items-center">
              <h3 className="text-lg font-black">Ajouter un prix ou certificat</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-white/80 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddAward} className="p-6 space-y-5">
              {awardError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600 flex items-start gap-2">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <span>{awardError}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Type d'élément</label>
                <select
                  value={awardForm.award_type}
                  onChange={e => setAwardForm({ ...awardForm, award_type: e.target.value as any })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0099DC] focus:outline-none bg-white font-medium"
                >
                  <option value="certificate">Certificat de formation effectuée</option>
                  <option value="award">Prix / Distinction reçue</option>
                  <option value="ugirl">U-Girl Award</option>
                  <option value="best_ureporter">Meilleur U-Reporter</option>
                  <option value="custom">Autre prix / distinction</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  {awardForm.award_type === 'certificate' ? 'Nom de la formation' : 'Nom du prix / Distinction'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={awardForm.award_type === 'certificate' ? 'Ex: Formation en Secourisme de Base' : 'Ex: U-Reporter le plus actif'}
                  value={awardForm.award_name}
                  onChange={e => setAwardForm({ ...awardForm, award_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0099DC] focus:outline-none"
                />
              </div>

              {awardForm.award_type === 'certificate' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Structure émettrice / Organisateur</label>
                  <input
                    type="text"
                    placeholder="Ex: Croix-Rouge Ivoirienne, UNICEF"
                    value={awardForm.issuer}
                    onChange={e => setAwardForm({ ...awardForm, issuer: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0099DC] focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Année</label>
                  <input
                    type="number"
                    required
                    min={1990}
                    max={new Date().getFullYear() + 2}
                    value={awardForm.awarded_year}
                    onChange={e => setAwardForm({ ...awardForm, awarded_year: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0099DC] focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Justificatif (Image, max 2Mo)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAwardFileChange}
                    className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#0099DC]/10 file:text-[#0099DC] hover:file:bg-[#0099DC]/25"
                  />
                </div>
              </div>

              {awardForm.document_url && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Justificatif chargé avec succès
                  </span>
                  <button
                    type="button"
                    onClick={() => setAwardForm(prev => ({ ...prev, document_url: '' }))}
                    className="text-xs font-bold text-red-500 hover:text-red-700"
                  >
                    Supprimer
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Description / Détails</label>
                <textarea
                  rows={3}
                  placeholder="Description optionnelle ou détails supplémentaires..."
                  value={awardForm.description}
                  onChange={e => setAwardForm({ ...awardForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0099DC] focus:outline-none text-sm resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAward}
                  className="px-6 py-2.5 bg-[#0099DC] text-white rounded-xl text-sm font-bold shadow-md hover:bg-[#007cb0] transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingAward ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Ajouter</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ── Document Viewer Modal ── */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-100"
          >
            <div className="px-6 py-5 bg-gradient-to-r from-gray-900 to-gray-800 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Justificatif de {viewingDoc.award_type === 'certificate' ? 'formation' : 'prix'}
                </span>
                <h3 className="text-base font-black truncate max-w-sm sm:max-w-md">{viewingDoc.award_name}</h3>
              </div>
              <button onClick={() => setViewingDoc(null)} className="text-white/80 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center justify-center bg-gray-50/50 min-h-[300px]">
              {viewingDoc.document_url && (
                <img
                  src={viewingDoc.document_url}
                  alt={viewingDoc.award_name}
                  className="max-h-[70vh] max-w-full rounded-2xl shadow-md object-contain border border-gray-200"
                />
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs text-gray-500 font-semibold">Délivré en {viewingDoc.awarded_year}</span>
              {viewingDoc.document_url && (
                <a
                  href={viewingDoc.document_url}
                  download={`justificatif-${viewingDoc.award_name.replace(/\s+/g, '_')}.png`}
                  className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger</span>
                </a>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
