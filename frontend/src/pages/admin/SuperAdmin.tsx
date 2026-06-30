import { useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck,
  Wrench,
  Users,
  Activity,
  UserCheck,
  Power,
  Save,
  Plus,
  RefreshCcw,
  Sparkles,
  ShieldAlert,
  Key,
  List,
  Eye,
  EyeOff,
} from 'lucide-react';
import { fetchSiteSettings, updateSiteSettings } from '../../services/content.service';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import {
  createAdminAccount,
  deleteAdminAccount,
  fetchAdmins,
  fetchSuperadminDashboard,
  fetchSuperadminLogs,
  resetSecurityCodes,
  updateAdminAccount,
} from '../../services/superadmin.service';

type AdminRowEdit = { email: string; role: string; new_password: string };

const css = `
  .sa-root { display:flex; flex-direction:column; gap:1.25rem; max-width:72rem; margin:0 auto; font-family:inherit; }
  .sa-hero { background: linear-gradient(135deg,#0b1220 0%,#0f2540 50%,#0b1220 100%); border-radius:16px; padding:1.5rem; color:#fff; position:relative; overflow:hidden; border:0.5px solid rgba(0,153,220,0.3); }
  .sa-hero::before { content:''; position:absolute; width:220px; height:220px; border-radius:50%; background:rgba(0,153,220,0.12); top:-80px; right:-60px; }
  .sa-hero::after { content:''; position:absolute; width:100px; height:100px; border-radius:50%; background:rgba(52,211,153,0.1); bottom:-30px; right:120px; }
  .sa-hero-inner { position:relative; display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap; }
  .sa-badge { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.1); border:0.5px solid rgba(255,255,255,0.2); border-radius:100px; padding:4px 12px; font-size:11px; font-weight:500; color:rgba(255,255,255,0.85); margin-bottom:10px; }
  .sa-hero h1 { font-size:22px; font-weight:600; letter-spacing:-0.3px; }
  .sa-hero p { font-size:13px; color:rgba(185,210,230,0.9); margin-top:4px; }
  .sa-status-pill { display:inline-flex; align-items:center; gap:6px; padding:6px 14px; border-radius:100px; font-size:12px; font-weight:500; }
  .sa-status-pill.active { background:rgba(52,211,153,0.15); color:#6ee7b7; border:0.5px solid rgba(52,211,153,0.3); }
  .sa-status-pill.maintenance { background:rgba(239,68,68,0.15); color:#fca5a5; border:0.5px solid rgba(239,68,68,0.3); }
  .sa-dot { width:6px; height:6px; border-radius:50%; background:currentColor; }
  .sa-cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(110px,1fr)); gap:10px; }
  .sa-metric { background:#fff; border:0.5px solid #e2e8f0; border-radius:12px; padding:1rem; display:flex; flex-direction:column; gap:8px; transition:border-color .15s,box-shadow .15s; }
  .sa-metric:hover { border-color:#cbd5e1; box-shadow:0 2px 8px rgba(0,0,0,0.06); }
  .sa-metric-top { display:flex; align-items:center; justify-content:space-between; }
  .sa-metric-label { font-size:10px; text-transform:uppercase; letter-spacing:.07em; color:#94a3b8; }
  .sa-metric-icon { width:28px; height:28px; border-radius:8px; background:#e0f2fe; display:flex; align-items:center; justify-content:center; color:#0369a1; }
  .sa-metric-value { font-size:26px; font-weight:600; color:#0f172a; letter-spacing:-0.5px; }
  .sa-section { background:#fff; border:0.5px solid #e2e8f0; border-radius:16px; padding:1.25rem; display:flex; flex-direction:column; gap:1rem; }
  .sa-section-header { display:flex; align-items:center; gap:8px; }
  .sa-section-title { font-size:15px; font-weight:600; color:#0f172a; }
  .sa-section-icon { color:#94a3b8; }
  .sa-input { background:#f8fafc; border:0.5px solid #cbd5e1; border-radius:8px; padding:9px 12px; font-size:13px; color:#0f172a; width:100%; outline:none; transition:border-color .15s,box-shadow .15s; font-family:inherit; }
  .sa-input:focus { border-color:#0099DC; box-shadow:0 0 0 3px rgba(0,153,220,0.12); }
  .sa-input::placeholder { color:#94a3b8; }
  .sa-btn { display:inline-flex; align-items:center; justify-content:center; gap:6px; padding:9px 16px; border-radius:8px; font-size:13px; font-weight:500; cursor:pointer; border:none; font-family:inherit; transition:opacity .15s, transform .1s, background .15s; }
  .sa-btn:active { transform:scale(0.98); }
  .sa-btn:disabled { opacity:.6; cursor:not-allowed; }
  .sa-btn-primary { background:#0099DC; color:#fff; }
  .sa-btn-primary:hover:not(:disabled) { background:#007bb5; }
  .sa-btn-danger { background:#dc2626; color:#fff; }
  .sa-btn-danger:hover:not(:disabled) { background:#b91c1c; }
  .sa-btn-success { background:#16a34a; color:#fff; }
  .sa-btn-success:hover:not(:disabled) { background:#15803d; }
  .sa-btn-dark { background:#1e293b; color:#fff; }
  .sa-btn-dark:hover:not(:disabled) { background:#0f172a; }
  .sa-btn-ghost { background:transparent; color:#334155; border:0.5px solid #cbd5e1; }
  .sa-btn-ghost:hover:not(:disabled) { background:#f1f5f9; }
  .sa-btn-icon { width:32px; height:32px; padding:0; font-size:14px; }
  .sa-table-wrap { overflow-x:auto; border:0.5px solid #e2e8f0; border-radius:12px; }
  .sa-table { width:100%; border-collapse:collapse; font-size:13px; }
  .sa-table thead tr { border-bottom:0.5px solid #e2e8f0; }
  .sa-table th { text-align:left; padding:8px 12px; font-size:10px; text-transform:uppercase; letter-spacing:.06em; color:#94a3b8; font-weight:500; }
  .sa-table tbody tr { border-bottom:0.5px solid #f1f5f9; transition:background .1s; }
  .sa-table tbody tr:last-child { border-bottom:none; }
  .sa-table tbody tr:hover { background:#f8fafc; }
  .sa-table td { padding:10px 12px; vertical-align:middle; }
  .sa-badge-active { display:inline-flex; align-items:center; padding:3px 10px; border-radius:100px; font-size:11px; font-weight:500; background:#dcfce7; color:#15803d; }
  .sa-badge-inactive { display:inline-flex; align-items:center; padding:3px 10px; border-radius:100px; font-size:11px; font-weight:500; background:#fee2e2; color:#b91c1c; }
  .sa-log-list { max-height:240px; overflow-y:auto; display:flex; flex-direction:column; }
  .sa-log-list { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
  .sa-log-list::-webkit-scrollbar { width: 8px; }
  .sa-log-list::-webkit-scrollbar-track { background: transparent; }
  .sa-log-list::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 999px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }
  .sa-log-list::-webkit-scrollbar-thumb:hover { background: #94a3b8; background-clip: padding-box; }
  .sa-log-item { display:flex; gap:10px; padding:8px 0; border-bottom:0.5px solid #f1f5f9; align-items:baseline; font-size:13px; }
  .sa-log-item:last-child { border-bottom:none; }
  .sa-log-dot { width:5px; height:5px; border-radius:50%; background:#0099DC; margin-top:5px; flex-shrink:0; }
  .sa-log-action { font-weight:600; color:#0f172a; }
  .sa-log-meta { color:#94a3b8; font-size:12px; margin-left:4px; }
  .sa-field-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .sa-row3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; }
  .sa-row4 { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:10px; }
  .sa-td-actions { display:flex; gap:6px; justify-content:flex-end; }
  .sa-password-wrap { position:relative; width:100%; }
  .sa-password-wrap .sa-input { padding-right:38px; }
  .sa-eye-btn { position:absolute; right:8px; top:50%; transform:translateY(-50%); border:none; background:transparent; color:#64748b; cursor:pointer; display:flex; }
  .sa-eye-btn:hover { color:#0f172a; }
  @media (max-width:640px) { .sa-field-grid, .sa-row3, .sa-row4 { grid-template-columns:1fr; } }
`;

export function SuperAdmin() {
  const confirmDialog = useConfirm();
  const currentSuperadminEmail = (sessionStorage.getItem('admin_email') || '').trim().toLowerCase();
  const [dashboard, setDashboard] = useState<any>(null);
  const [admins, setAdmins] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [maintenanceMessage, setMaintenanceMessage] = useState('Le site est actuellement en maintenance. Veuillez revenir plus tard.');
  const [maintenanceImageUrl, setMaintenanceImageUrl] = useState('/images/logo-512.png');
  const [isMaintenanceOn, setIsMaintenanceOn] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '', role: 'communication' });
  const [codes, setCodes] = useState({ admin_password: '', superadmin_password: '' });
  const [rowEdit, setRowEdit] = useState<Record<string, AdminRowEdit>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNewAdminPassword, setShowNewAdminPassword] = useState(false);
  const [showGlobalAdminPassword, setShowGlobalAdminPassword] = useState(false);
  const [showGlobalSuperadminPassword, setShowGlobalSuperadminPassword] = useState(false);
  const [showRowPassword, setShowRowPassword] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    try {
      const [d, a, l, s] = await Promise.all([
        fetchSuperadminDashboard(),
        fetchAdmins(),
        fetchSuperadminLogs(),
        fetchSiteSettings(),
      ]);
      setDashboard(d);
      setAdmins(a || []);
      setLogs(l || []);
      setIsMaintenanceOn(!!s?.site_under_maintenance);
      setMaintenanceMessage(s?.maintenance_message || maintenanceMessage);
      setMaintenanceImageUrl(s?.maintenance_image_url || '/images/logo-512.png');
      const next: Record<string, AdminRowEdit> = {};
      (a || []).forEach((adm: any) => {
        next[adm.id] = { email: adm.email || '', role: adm.role || 'communication', new_password: '' };
      });
      setRowEdit(next);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if ((newAdmin.email || '').trim().toLowerCase() === currentSuperadminEmail) {
      setNewAdmin((prev) => ({ ...prev, email: '', password: '' }));
    }
  }, [newAdmin.email, currentSuperadminEmail]);

  const cards = useMemo(() => [
    { title: 'Utilisateurs', value: dashboard?.total_users ?? 0, icon: Users },
    { title: 'Admins', value: dashboard?.total_admins ?? 0, icon: UserCheck },
    { title: 'Activités', value: dashboard?.total_activities ?? 0, icon: Activity },
    { title: 'Inscriptions', value: dashboard?.total_registrations ?? 0, icon: ShieldCheck },
    { title: 'Actions récentes', value: (dashboard?.last_actions || []).length, icon: Wrench },
  ], [dashboard]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: 14 }}>Chargement du centre Super Admin...</div>;
  }

  return (
    <>
      <style>{css}</style>
      <div className="sa-root" translate="no">
        <div className="sa-hero">
          <div className="sa-hero-inner">
            <div>
              <div className="sa-badge">
                <Sparkles size={11} />
                Contrôle centralisé
              </div>
              <h1>Centre Super Admin</h1>
              <p>Sécurité, maintenance, gestion des admins et audit</p>
            </div>
            <span className={`sa-status-pill ${isMaintenanceOn ? 'maintenance' : 'active'}`}>
              <span className="sa-dot" />
              {isMaintenanceOn ? 'Maintenance activée' : 'Site actif'}
            </span>
          </div>
        </div>

        <div className="sa-cards">
          {cards.map((card) => (
            <div key={card.title} className="sa-metric">
              <div className="sa-metric-top">
                <span className="sa-metric-label">{card.title}</span>
                <span className="sa-metric-icon"><card.icon size={14} /></span>
              </div>
              <div className="sa-metric-value">{card.value}</div>
            </div>
          ))}
        </div>

        <div className="sa-section">
          <div className="sa-section-header">
            <ShieldAlert size={16} className="sa-section-icon" color="#f59e0b" />
            <span className="sa-section-title">Mode maintenance</span>
          </div>
          <p style={{ marginTop: -4, fontSize: 12, color: '#64748b' }}>
            État actuel: <strong>{isMaintenanceOn ? 'Maintenance activée' : 'Site actif'}</strong>. Le message ci-dessous s'affiche uniquement quand la maintenance est activée.
          </p>
          <div className="sa-field-grid">
            <input className="sa-input" type="text" value={maintenanceImageUrl} onChange={(e) => setMaintenanceImageUrl(e.target.value)} placeholder="URL image maintenance" />
            <input className="sa-input" type="text" value={maintenanceMessage} onChange={(e) => setMaintenanceMessage(e.target.value)} placeholder="Message de maintenance" />
          </div>
          <div>
            <button
              className={`sa-btn ${isMaintenanceOn ? 'sa-btn-danger' : 'sa-btn-success'}`}
              disabled={saving}
              onClick={async () => {
                if (!(await confirmDialog({ title: 'Confirmer', message: 'Confirmer le changement de mode maintenance ?' }))) return;
                setSaving(true);
                try {
                  await updateSiteSettings({
                    site_under_maintenance: !isMaintenanceOn,
                    maintenance_message: maintenanceMessage,
                    maintenance_image_url: maintenanceImageUrl,
                  });
                  await load();
                  await confirmDialog({
                    title: 'Mise à jour effectuée',
                    message: !isMaintenanceOn
                      ? 'Le mode maintenance est maintenant activé.'
                      : 'Le mode maintenance est maintenant désactivé.',
                    confirmText: 'OK',
                    cancelText: 'Fermer',
                  });
                } catch (err: any) {
                  const detail = err?.response?.data?.detail || 'Impossible de modifier le mode maintenance.';
                  if (err?.response?.status === 401 || err?.response?.status === 403) {
                    sessionStorage.removeItem('admin_role');
                    sessionStorage.removeItem('admin_email');
                  }
                  await confirmDialog({
                    title: 'Erreur',
                    message: detail,
                    confirmText: 'Compris',
                    cancelText: 'Fermer',
                    danger: true,
                  });
                } finally {
                  setSaving(false);
                }
              }}
            >
              <Power size={14} />
              {isMaintenanceOn ? 'Désactiver la maintenance' : 'Activer la maintenance'}
            </button>
          </div>
        </div>

        <div className="sa-section">
          <div className="sa-section-header">
            <Users size={16} className="sa-section-icon" />
            <span className="sa-section-title">Gestion des admins</span>
          </div>
          <div className="sa-row4">
            <input
              className="sa-input"
              type="email"
              name="new_admin_email"
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
              placeholder="Email admin"
              value={newAdmin.email}
              onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
            />
            <select
              className="sa-input"
              value={newAdmin.role}
              onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
            >
              <option value="communication">Communication</option>
              <option value="programme">Programme & Activités</option>
              <option value="logistique">Logistique</option>
              <option value="secretariat">Secrétariat Général</option>
              <option value="finances">Finances</option>
              <option value="president">Président</option>
              <option value="superadmin">Super Admin</option>
            </select>
            <div className="sa-password-wrap">
              <input
                className="sa-input"
                type={showNewAdminPassword ? 'text' : 'password'}
                name="new_admin_password"
                autoComplete="new-password"
                data-lpignore="true"
                data-1p-ignore="true"
                placeholder="Mot de passe (>=10 caractères)"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
              />
              <button type="button" className="sa-eye-btn" onClick={() => setShowNewAdminPassword(v => !v)}>
                {showNewAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button
              className="sa-btn sa-btn-primary"
              onClick={async () => {
                if (!(await confirmDialog({ title: 'Créer un admin', message: 'Voulez-vous créer cet admin ?' }))) return;
                try {
                  const email = (newAdmin.email || '').trim().toLowerCase();
                  if (!email || !newAdmin.password) {
                    await confirmDialog({ title: 'Champs requis', message: "Renseignez l'email et le mot de passe.", danger: true, confirmText: 'Compris', cancelText: 'Fermer' });
                    return;
                  }
                  if (email === currentSuperadminEmail) {
                    await confirmDialog({ title: 'Email invalide', message: "Impossible d'utiliser l'email du superadmin pour un admin.", danger: true, confirmText: 'Compris', cancelText: 'Fermer' });
                    return;
                  }
                  await createAdminAccount(newAdmin);
                  setNewAdmin({ email: '', password: '', role: 'communication' });
                  await load();
                  await confirmDialog({ title: 'Succès', message: 'Admin ajouté avec succès.', confirmText: 'OK', cancelText: 'Fermer' });
                } catch (err: any) {
                  const detail = err?.response?.data?.detail || "Impossible d'ajouter cet admin.";
                  await confirmDialog({ title: 'Erreur', message: detail, danger: true, confirmText: 'Compris', cancelText: 'Fermer' });
                }
              }}
            >
              <Plus size={14} />
              Ajouter admin
            </button>
          </div>

          <div className="sa-table-wrap">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Nouveau code</th>
                  <th>Statut</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id}>
                    <td>
                      <input
                        className="sa-input"
                        type="email"
                        value={rowEdit[admin.id]?.email || ''}
                        onChange={(e) => setRowEdit((prev) => ({ ...prev, [admin.id]: { ...prev[admin.id], email: e.target.value } }))}
                        style={{ maxWidth: 220 }}
                      />
                    </td>
                    <td>
                      <select
                        className="sa-input"
                        value={rowEdit[admin.id]?.role || admin.role || 'communication'}
                        onChange={(e) => setRowEdit((prev) => ({ ...prev, [admin.id]: { ...prev[admin.id], role: e.target.value } }))}
                      >
                        <option value="communication">Communication</option>
                        <option value="programme">Programme & Activités</option>
                        <option value="logistique">Logistique</option>
                        <option value="secretariat">Secrétariat Général</option>
                        <option value="finances">Finances</option>
                        <option value="president">Président</option>
                        <option value="superadmin">Super Admin</option>
                      </select>
                    </td>
                    <td>
                      <div className="sa-password-wrap" style={{ maxWidth: 220 }}>
                        <input
                          className="sa-input"
                          type={showRowPassword[admin.id] ? 'text' : 'password'}
                          value={rowEdit[admin.id]?.new_password || ''}
                          onChange={(e) => setRowEdit((prev) => ({ ...prev, [admin.id]: { ...prev[admin.id], new_password: e.target.value } }))}
                          placeholder="Inchangé si vide"
                        />
                        <button type="button" className="sa-eye-btn" onClick={() => setShowRowPassword(prev => ({ ...prev, [admin.id]: !prev[admin.id] }))}>
                          {showRowPassword[admin.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </td>
                    <td><span className={admin.active ? 'sa-badge-active' : 'sa-badge-inactive'}>{admin.active ? 'Actif' : 'Désactivé'}</span></td>
                    <td>
                      <div className="sa-td-actions">
                        <button
                          className="sa-btn sa-btn-ghost sa-btn-icon"
                          title="Enregistrer"
                          onClick={async () => {
                            if (!(await confirmDialog({ title: 'Modifier admin', message: 'Confirmer la modification de cet admin ?' }))) return;
                            try {
                              const edit = rowEdit[admin.id];
                              await updateAdminAccount(admin.id, { 
                                email: edit?.email, 
                                new_password: edit?.new_password || undefined,
                                role: edit?.role || admin.role 
                              });
                              await load();
                              await confirmDialog({ title: 'Succès', message: 'Admin modifié avec succès.', confirmText: 'OK', cancelText: 'Fermer' });
                            } catch (err: any) {
                              const detail = err?.response?.data?.detail || "Impossible de modifier cet admin.";
                              await confirmDialog({ title: 'Erreur', message: detail, danger: true, confirmText: 'Compris', cancelText: 'Fermer' });
                            }
                          }}
                        >
                          <Save size={14} />
                        </button>
                        <button
                          className={`sa-btn sa-btn-icon ${admin.active ? 'sa-btn-danger' : 'sa-btn-success'}`}
                          style={{ fontSize: 12, width: 'auto', padding: '0 10px' }}
                          onClick={async () => {
                            if (!(await confirmDialog({ title: 'Action sensible', message: 'Confirmer cette action ?', danger: true }))) return;
                            try {
                              await updateAdminAccount(admin.id, { active: !admin.active });
                              await load();
                              await confirmDialog({ title: 'Succès', message: admin.active ? 'Admin désactivé.' : 'Admin activé.', confirmText: 'OK', cancelText: 'Fermer' });
                            } catch (err: any) {
                              const detail = err?.response?.data?.detail || "Impossible d'appliquer cette action.";
                              await confirmDialog({ title: 'Erreur', message: detail, danger: true, confirmText: 'Compris', cancelText: 'Fermer' });
                            }
                          }}
                        >
                          {admin.active ? 'Désactiver' : 'Activer'}
                        </button>
                        {(admin.email || '').trim().toLowerCase() !== currentSuperadminEmail && (
                          <button
                            className="sa-btn sa-btn-icon sa-btn-danger"
                            style={{ fontSize: 12, width: 'auto', padding: '0 10px' }}
                            onClick={async () => {
                              if (!(await confirmDialog({
                                title: 'Suppression définitive',
                                message: `Voulez-vous vraiment supprimer définitivement l'administrateur ${admin.email} ? Cette action est irréversible.`,
                                danger: true
                              }))) return;
                              try {
                                await deleteAdminAccount(admin.id);
                                await load();
                                await confirmDialog({ title: 'Succès', message: 'Administrateur supprimé avec succès.', confirmText: 'OK', cancelText: 'Fermer' });
                              } catch (err: any) {
                                const detail = err?.response?.data?.detail || "Impossible de supprimer cet admin.";
                                await confirmDialog({ title: 'Erreur', message: detail, danger: true, confirmText: 'Compris', cancelText: 'Fermer' });
                              }
                            }}
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="sa-section">
          <div className="sa-section-header">
            <Key size={16} className="sa-section-icon" />
            <span className="sa-section-title">Codes globaux</span>
          </div>
          <div className="sa-row3">
            <div className="sa-password-wrap">
              <input className="sa-input" type={showGlobalAdminPassword ? 'text' : 'password'} placeholder="Nouveau code Admin" value={codes.admin_password} onChange={(e) => setCodes({ ...codes, admin_password: e.target.value })} />
              <button type="button" className="sa-eye-btn" onClick={() => setShowGlobalAdminPassword(v => !v)}>
                {showGlobalAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="sa-password-wrap">
              <input className="sa-input" type={showGlobalSuperadminPassword ? 'text' : 'password'} placeholder="Nouveau code Super Admin" value={codes.superadmin_password} onChange={(e) => setCodes({ ...codes, superadmin_password: e.target.value })} />
              <button type="button" className="sa-eye-btn" onClick={() => setShowGlobalSuperadminPassword(v => !v)}>
                {showGlobalSuperadminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button
              className="sa-btn sa-btn-dark"
              onClick={async () => {
                if (!(await confirmDialog({ title: 'Réinitialiser les codes', message: 'Confirmer la réinitialisation des codes ?', danger: true }))) return;
                try {
                  await resetSecurityCodes(codes);
                  setCodes({ admin_password: '', superadmin_password: '' });
                  await load();
                  await confirmDialog({ title: 'Succès', message: 'Codes réinitialisés.', confirmText: 'OK', cancelText: 'Fermer' });
                } catch (err: any) {
                  const detail = err?.response?.data?.detail || "Impossible de réinitialiser les codes.";
                  await confirmDialog({ title: 'Erreur', message: detail, danger: true, confirmText: 'Compris', cancelText: 'Fermer' });
                }
              }}
            >
              <RefreshCcw size={14} />
              Réinitialiser
            </button>
          </div>
        </div>

        <div className="sa-section">
          <div className="sa-section-header">
            <List size={16} className="sa-section-icon" />
            <span className="sa-section-title">Journal des actions</span>
          </div>
          <div className="sa-log-list">
            {logs.slice(0, 20).map((log, idx) => (
              <div key={idx} className="sa-log-item">
                <span className="sa-log-dot" />
                <div>
                  <span className="sa-log-action">{log.action}</span>
                  <span className="sa-log-meta">- {log.actor_email} {' -> '} {log.target}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
