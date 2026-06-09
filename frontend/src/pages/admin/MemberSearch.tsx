import { useEffect, useMemo, useState } from 'react';
import { SearchIcon, UserIcon, Loader2, Trophy, Trash2, Plus, Star } from 'lucide-react';
import {
  fetchMemberActivities,
  fetchMembers,
  updateMember,
  fetchMemberAwards,
  addMemberAward,
  deleteMemberAward,
  type MemberAward,
} from '../../services/member.service';

const memberStatusLabel: Record<string, string> = {
  aspirant: 'Aspirant',
  ureporter: 'U-Reporter',
  mentor: 'Mentor',
};

const memberStatusColors: Record<string, string> = {
  aspirant: 'bg-gray-100 text-gray-600 border-gray-200',
  ureporter: 'bg-blue-100 text-blue-700 border-blue-200',
  mentor: 'bg-purple-100 text-purple-700 border-purple-200',
};

const AWARD_TYPES = [
  { value: 'ugirl', label: 'U-Girl de l\'année', icon: '👑' },
  { value: 'best_ureporter', label: 'Meilleur U-Reporter', icon: '🏆' },
  { value: 'award', label: 'Award général', icon: '🎖️' },
  { value: 'custom', label: 'Prix personnalisé', icon: '⭐' },
] as const;

const getAwardIcon = (type: string) => {
  return AWARD_TYPES.find(t => t.value === type)?.icon || '⭐';
};

const MAX_RESULTS = 20;
const currentYear = new Date().getFullYear();

export function MemberSearch() {
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [awards, setAwards] = useState<MemberAward[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyMode, setHistoryMode] = useState<'participated' | 'registrations'>('registrations');

  // Awards form state
  const [showAwardForm, setShowAwardForm] = useState(false);
  const [awardForm, setAwardForm] = useState({
    award_name: '',
    award_type: 'award' as MemberAward['award_type'],
    awarded_year: currentYear,
    description: '',
  });
  const [isAddingAward, setIsAddingAward] = useState(false);
  const [awardError, setAwardError] = useState('');
  const [deletingAwardId, setDeletingAwardId] = useState<string | null>(null);

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    sex: 'non_precise',
    birth_date: '',
    commune: '',
    status: 'aspirant',
    commission: '',
  });

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const rows = await fetchMembers(query.trim());
        setMembers(rows || []);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [query]);

  const list = useMemo(() => members.slice(0, MAX_RESULTS), [members]);
  const hasMoreResults = members.length > MAX_RESULTS;

  const openProfile = async (member: any) => {
    setSelected(member);
    setIsEditing(false);
    setSaveError('');
    setShowAwardForm(false);
    setAwardError('');
    setForm({
      full_name: member.full_name || '',
      phone: member.phone || '',
      email: member.email || '',
      sex: member.sex || 'non_precise',
      birth_date: member.birth_date || '',
      commune: member.commune || '',
      status: member.status || 'aspirant',
      commission: member.commission || '',
    });
    const [data, awardsData] = await Promise.all([
      fetchMemberActivities(member.id),
      fetchMemberAwards(member.id),
    ]);
    setProfile(data);
    setAwards(awardsData || []);
  };

  const handleSave = async () => {
    if (!selected) return;
    setIsSaving(true);
    setSaveError('');
    try {
      const updated = await updateMember(selected.id, {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        sex: form.sex as 'homme' | 'femme' | 'non_precise',
        birth_date: form.birth_date || null,
        commune: form.commune.trim(),
        status: form.status as 'aspirant' | 'ureporter' | 'mentor',
        commission: form.commission.trim(),
      });
      setSelected(updated);
      setMembers(prev => prev.map(m => (m.id === updated.id ? updated : m)));
      const data = await fetchMemberActivities(updated.id);
      setProfile(data);
      setIsEditing(false);
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || 'Echec de la sauvegarde.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAward = async () => {
    if (!selected || !awardForm.award_name.trim()) {
      setAwardError('Le nom du prix est requis.');
      return;
    }
    setIsAddingAward(true);
    setAwardError('');
    try {
      const created = await addMemberAward(selected.id, {
        award_name: awardForm.award_name.trim(),
        award_type: awardForm.award_type,
        awarded_year: awardForm.awarded_year,
        description: awardForm.description.trim(),
      });
      setAwards(prev => [created, ...prev]);
      setAwardForm({ award_name: '', award_type: 'award', awarded_year: currentYear, description: '' });
      setShowAwardForm(false);
    } catch (err: any) {
      setAwardError(err?.response?.data?.message || 'Erreur lors de l\'ajout du prix.');
    } finally {
      setIsAddingAward(false);
    }
  };

  const handleDeleteAward = async (awardId: string) => {
    if (!selected) return;
    setDeletingAwardId(awardId);
    try {
      await deleteMemberAward(selected.id, awardId);
      setAwards(prev => prev.filter(a => a.id !== awardId));
    } catch (err: any) {
      setAwardError(err?.response?.data?.message || 'Erreur lors de la suppression.');
    } finally {
      setDeletingAwardId(null);
    }
  };

  const openHistoryModal = (mode: 'participated' | 'registrations') => {
    setHistoryMode(mode);
    setIsHistoryModalOpen(true);
  };

  const activities = profile?.activities || [];
  const participatedActivities = activities.filter((a: any) => a.attended);

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <label className="block text-xs font-black uppercase text-gray-500 mb-2">Rechercher un membre</label>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Nom, téléphone, email, statut (ureporter, mentor...)"
            className="w-full rounded-lg border border-gray-200 pl-10 pr-4 py-3 text-sm font-medium text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0099DC]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Results list */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 text-sm font-bold text-[#1E293B]">Résultats</div>
          <div className="max-h-[65vh] overflow-y-auto">
            {!isLoading && hasMoreResults && (
              <div className="px-5 py-3 text-xs font-semibold text-amber-700 bg-amber-50 border-b border-amber-100">
                {members.length} membres trouvés. Affichage limité à {MAX_RESULTS}. Veuillez affiner la recherche.
              </div>
            )}
            {list.map(member => (
              <button
                key={member.id}
                onClick={() => openProfile(member)}
                className={`w-full text-left px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${selected?.id === member.id ? 'bg-[#0099DC]/5 border-l-2 border-l-[#0099DC]' : ''}`}
              >
                <div className="font-semibold text-[#1E293B]">{member.full_name}</div>
                <div className="text-xs text-[#64748B] mt-1">{member.phone} - {member.email || 'Sans email'}</div>
                <div className="mt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${memberStatusColors[member.status] || 'bg-gray-100 text-gray-600'}`}>
                    {memberStatusLabel[member.status] || member.status}
                  </span>
                </div>
              </button>
            ))}
            {!isLoading && list.length === 0 && <div className="px-5 py-8 text-sm text-[#64748B]">Aucun membre trouvé.</div>}
            {isLoading && (
              <div className="px-5 py-8">
                <div className="flex items-center justify-center gap-2 text-[#64748B]">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">Chargement des membres...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Member detail + awards panel */}
        <div className="space-y-4">
          {/* Profile card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 text-sm font-bold text-[#1E293B]">Détails du membre</div>
            {!selected && <div className="px-5 py-10 text-sm text-[#64748B]">Sélectionnez un membre pour voir son profil.</div>}
            {selected && (
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0099DC]/10 flex items-center justify-center"><UserIcon className="w-5 h-5 text-[#0099DC]" /></div>
                  <div>
                    <div className="font-bold text-[#1E293B]">{selected.full_name}</div>
                    <div className="flex gap-1.5 mt-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${memberStatusColors[profile?.summary?.status || selected.status] || 'bg-gray-100 text-gray-600'}`}>
                        {memberStatusLabel[profile?.summary?.status || selected.status] || '-'}
                      </span>
                      {selected.commission && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                          {selected.commission}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-auto">
                    {!isEditing ? (
                      <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-200 hover:bg-gray-50">
                        Modifier
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => { setIsEditing(false); setSaveError(''); }} className="px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-200 hover:bg-gray-50">
                          Annuler
                        </button>
                        <button onClick={handleSave} disabled={isSaving} className="px-3 py-1.5 text-xs font-semibold rounded-md bg-[#0099DC] text-white disabled:opacity-60">
                          {isSaving ? 'Sauvegarde...' : 'Enregistrer'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-lg border border-gray-200 p-3 bg-gray-50/60">
                    <input value={form.full_name} onChange={e => setForm(prev => ({ ...prev, full_name: e.target.value }))} placeholder="Nom complet" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    <input value={form.phone} onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="Téléphone" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    <input value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} placeholder="Email" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    <input type="date" value={form.birth_date} onChange={e => setForm(prev => ({ ...prev, birth_date: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    <input value={form.commune} onChange={e => setForm(prev => ({ ...prev, commune: e.target.value }))} placeholder="Commune" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    <select value={form.sex} onChange={e => setForm(prev => ({ ...prev, sex: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                      <option value="non_precise">Sexe non précisé</option>
                      <option value="homme">Homme</option>
                      <option value="femme">Femme</option>
                    </select>
                    {/* Commission */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Commission / Département</label>
                      <select value={form.commission} onChange={e => setForm(prev => ({ ...prev, commission: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900">
                        <option value="">Aucune commission</option>
                        <option value="Trésorerie">Trésorerie</option>
                        <option value="Secrétariat Général">Secrétariat Général</option>
                        <option value="Communication">Communication</option>
                        <option value="Finances">Finances & Cotisations</option>
                        <option value="Logistique">Logistique</option>
                        <option value="Activités & Programmes">Activités & Programmes</option>
                        <option value="Ressources Humaines">Ressources Humaines</option>
                      </select>
                    </div>
                    {/* Status — admin only, with explanatory label */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Statut (admin uniquement)</label>
                      <select value={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))} className="w-full rounded-lg border border-[#0099DC]/40 px-3 py-2 text-sm bg-blue-50/40 font-semibold">
                        <option value="aspirant">Aspirant</option>
                        <option value="ureporter">U-Reporter (Membre Actif)</option>
                        <option value="mentor">Mentor (Nomination)</option>
                      </select>
                    </div>
                  </div>
                )}

                {saveError && <div className="text-xs text-red-600 font-semibold">{saveError}</div>}

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-200 p-3"><p className="text-xs text-gray-500">Date de naissance</p><p className="font-bold text-[#1E293B]">{profile?.summary?.birth_date || '-'}</p></div>
                  <div className="rounded-lg border border-gray-200 p-3"><p className="text-xs text-gray-500">Age</p><p className="font-bold text-[#1E293B]">{profile?.summary?.age ?? '-'}</p></div>
                  <button type="button" onClick={() => openHistoryModal('participated')} className="rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50 transition-colors">
                    <p className="text-xs text-gray-500">Activités participées</p>
                    <p className="font-bold text-[#1E293B]">{profile?.summary?.activities_participated || 0}</p>
                  </button>
                  <button type="button" onClick={() => openHistoryModal('registrations')} className="rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50 transition-colors">
                    <p className="text-xs text-gray-500">Inscriptions totales</p>
                    <p className="font-bold text-[#1E293B]">{profile?.summary?.registrations_total || 0}</p>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Awards section — shown when a member is selected */}
          {selected && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-bold text-[#1E293B]">Prix & Distinctions</span>
                  {awards.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">{awards.length}</span>
                  )}
                </div>
                <button
                  onClick={() => { setShowAwardForm(v => !v); setAwardError(''); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Ajouter un prix
                </button>
              </div>

              {/* Award form */}
              {showAwardForm && (
                <div className="px-5 py-4 border-b border-gray-100 bg-amber-50/40 space-y-3">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Nouveau Prix</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      value={awardForm.award_name}
                      onChange={e => setAwardForm(p => ({ ...p, award_name: e.target.value }))}
                      placeholder="Nom du prix *"
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2"
                    />
                    <select
                      value={awardForm.award_type}
                      onChange={e => setAwardForm(p => ({ ...p, award_type: e.target.value as MemberAward['award_type'] }))}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      {AWARD_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={2015}
                      max={currentYear + 1}
                      value={awardForm.awarded_year}
                      onChange={e => setAwardForm(p => ({ ...p, awarded_year: parseInt(e.target.value) || currentYear }))}
                      placeholder="Année"
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                    <textarea
                      value={awardForm.description}
                      onChange={e => setAwardForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="Description (optionnel)"
                      rows={2}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2 resize-none"
                    />
                  </div>
                  {awardError && <div className="text-xs text-red-600 font-semibold">{awardError}</div>}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleAddAward}
                      disabled={isAddingAward}
                      className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60 transition-colors"
                    >
                      {isAddingAward ? 'Ajout...' : 'Enregistrer le prix'}
                    </button>
                    <button
                      onClick={() => { setShowAwardForm(false); setAwardError(''); }}
                      className="px-4 py-2 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {/* Awards list */}
              <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                {awards.length === 0 && (
                  <div className="px-5 py-6 text-sm text-[#64748B] text-center">
                    <Star className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    Aucun prix attribué pour l'instant.
                  </div>
                )}
                {awards.map(award => (
                  <div key={award.id} className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50/60 group">
                    <span className="text-xl shrink-0 leading-none mt-0.5">{getAwardIcon(award.award_type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-[#1E293B] truncate">{award.award_name}</div>
                      <div className="text-xs text-gray-500">Année {award.awarded_year}</div>
                      {award.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{award.description}</p>}
                    </div>
                    <button
                      onClick={() => handleDeleteAward(award.id)}
                      disabled={deletingAwardId === award.id}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-40"
                      title="Supprimer ce prix"
                    >
                      {deletingAwardId === award.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#1E293B]">
                {historyMode === 'participated' ? 'Historique des activités participées' : "Historique des inscriptions"}
              </h3>
              <button onClick={() => setIsHistoryModalOpen(false)} className="px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-200 hover:bg-gray-50">
                Fermer
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4">
              {(historyMode === 'participated' ? participatedActivities : activities).length === 0 ? (
                <div className="text-sm text-[#64748B]">Aucune donnée disponible.</div>
              ) : (
                (historyMode === 'participated' ? participatedActivities : activities).map((a: any) => (
                  <div key={a.id} className="px-3 py-3 border-b border-gray-100">
                    <div className="text-sm font-semibold text-[#1E293B]">{a.event_title || 'Activité'}</div>
                    <div className="text-xs text-[#64748B] mt-1">{a.event_date || '-'} - {a.event_location || '-'}</div>
                    <div className="text-xs font-bold mt-1">{a.attended ? 'Présent' : 'Inscrit (absence/non marqué)'}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
