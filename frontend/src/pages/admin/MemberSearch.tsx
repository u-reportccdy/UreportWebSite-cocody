import { useEffect, useMemo, useState } from 'react';
import { SearchIcon, UserIcon, Loader2 } from 'lucide-react';
import { fetchMemberActivities, fetchMembers, updateMember } from '../../services/member.service';

const memberStatusLabel: Record<string, string> = {
  aspirant: 'Aspirant',
  ureporter: 'U-Reporter',
  mentor: 'Mentor',
};
const MAX_RESULTS = 20;

export function MemberSearch() {
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyMode, setHistoryMode] = useState<'participated' | 'registrations'>('registrations');
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    sex: 'non_precise',
    birth_date: '',
    commune: '',
    status: 'aspirant',
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
    setForm({
      full_name: member.full_name || '',
      phone: member.phone || '',
      email: member.email || '',
      sex: member.sex || 'non_precise',
      birth_date: member.birth_date || '',
      commune: member.commune || '',
      status: member.status || 'aspirant',
    });
    const data = await fetchMemberActivities(member.id);
    setProfile(data);
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

  const openHistoryModal = (mode: 'participated' | 'registrations') => {
    setHistoryMode(mode);
    setIsHistoryModalOpen(true);
  };

  const activities = profile?.activities || [];
  const participatedActivities = activities.filter((a: any) => a.attended);

  return (
    <div className="space-y-6">
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
                className="w-full text-left px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="font-semibold text-[#1E293B]">{member.full_name}</div>
                <div className="text-xs text-[#64748B] mt-1">{member.phone} - {member.email || 'Sans email'}</div>
                <div className="text-xs font-bold text-[#0099DC] mt-1">{memberStatusLabel[member.status] || member.status}</div>
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

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 text-sm font-bold text-[#1E293B]">Détails du membre</div>
          {!selected && <div className="px-5 py-10 text-sm text-[#64748B]">Sélectionnez un membre pour voir son profil.</div>}
          {selected && (
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0099DC]/10 flex items-center justify-center"><UserIcon className="w-5 h-5 text-[#0099DC]" /></div>
                <div>
                  <div className="font-bold text-[#1E293B]">{selected.full_name}</div>
                  <div className="text-sm text-[#64748B]">{memberStatusLabel[profile?.summary?.status] || profile?.summary?.status || '-'}</div>
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
                  <select value={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm md:col-span-2">
                    <option value="aspirant">Aspirant</option>
                    <option value="ureporter">U-Reporter</option>
                    <option value="mentor">Mentor</option>
                  </select>
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
      </div>

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

