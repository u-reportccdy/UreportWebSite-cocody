import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  Plus,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  Play,
  Trash2,
  Edit2,
  Loader2,
  Tag,
  AlertCircle
} from 'lucide-react';
import { fetchTasks, createTask, updateTask, deleteTask } from '../../services/tasks.service';
import { fetchEvents } from '../../services/event.service';
import { useConfirm } from '../../components/ui/ConfirmDialog';

const DEPARTMENTS = [
  { code: 'communication', name: 'Communication', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { code: 'programme', name: 'Programme & Activités', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { code: 'logistique', name: 'Logistique', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { code: 'finances', name: 'Finances & Cotisations', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { code: 'secretariat', name: 'Secrétariat Général', color: 'bg-rose-100 text-rose-800 border-rose-200' }
];

export function Tasks() {
  const confirm = useConfirm();
  const userRole = sessionStorage.getItem('admin_role') || '';
  const isGlobalAdmin = ['superadmin', 'admin', 'president'].includes(userRole);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  // Filters
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Modals / Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    department_code: 'communication',
    event_id: '',
    due_date: '',
    status: 'todo',
    assigned_email: '' // We collect email as assignee
  });

  // Default filter to current user's department if they are a department head
  useEffect(() => {
    if (!isGlobalAdmin && userRole) {
      // If userRole is programme/activities
      const mappedRole = userRole === 'activites' ? 'programme' : userRole;
      setSelectedDept(mappedRole);
      setFormData(prev => ({ ...prev, department_code: mappedRole }));
    }
  }, [userRole, isGlobalAdmin]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tasksData, eventsData] = await Promise.all([
        fetchTasks(),
        fetchEvents()
      ]);
      setTasks(tasksData || []);
      setEvents(eventsData || []);
    } catch (error) {
      console.error('Erreur lors du chargement des tâches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData().catch(err => console.error(err));
  }, []);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchDept = selectedDept ? t.department_code === selectedDept : true;
      const matchStatus = selectedStatus ? t.status === selectedStatus : true;
      return matchDept && matchStatus;
    });
  }, [tasks, selectedDept, selectedStatus]);

  // Columns for Kanban board
  const columns = [
    { id: 'todo', title: 'À faire', color: 'border-t-4 border-t-gray-400 bg-gray-50/70', icon: <Clock className="w-4 h-4 text-gray-500" /> },
    { id: 'in_progress', title: 'En cours', color: 'border-t-4 border-t-sky-500 bg-sky-50/20', icon: <Play className="w-4 h-4 text-sky-500" /> },
    { id: 'done', title: 'Terminé', color: 'border-t-4 border-t-green-500 bg-green-50/20', icon: <CheckCircle2 className="w-4 h-4 text-green-500" /> }
  ];

  const handleOpenModal = (task?: any) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title || '',
        department_code: task.department_code || 'communication',
        event_id: task.event_id || '',
        due_date: task.due_date || '',
        status: task.status || 'todo',
        assigned_email: task.assigned_user?.email || ''
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        department_code: selectedDept || 'communication',
        event_id: '',
        due_date: '',
        status: 'todo',
        assigned_email: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: any = {
        title: formData.title,
        department_code: formData.department_code,
        event_id: formData.event_id || null,
        due_date: formData.due_date || null,
        status: formData.status
      };

      if (editingTask) {
        await updateTask(editingTask.id, payload);
      } else {
        await createTask(payload);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickStatusMove = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
    try {
      await updateTask(taskId, { status: newStatus });
      // Update in local state for snappy UI
      setTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Supprimer cette tâche ?',
      message: 'Cette action est irréversible.',
      confirmText: 'Supprimer',
      danger: true
    });
    if (!ok) return;

    try {
      await deleteTask(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const getDeptTag = (code: string) => {
    const dept = DEPARTMENTS.find(d => d.code === code);
    if (!dept) return null;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${dept.color}`}>
        {dept.name}
      </span>
    );
  };

  // Check if task is overdue
  const isOverdue = (dueDateStr: string, status: string) => {
    if (!dueDateStr || status === 'done') return false;
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
      translate="no"
    >
      {/* Top Filter and Actions */}
      <div className="flex flex-col lg:flex-row justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Filtrer Département:</span>
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              disabled={!isGlobalAdmin}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#0099DC]"
            >
              <option value="">Tous les départements</option>
              {DEPARTMENTS.map(d => (
                <option key={d.code} value={d.code}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Statut:</span>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#0099DC]"
            >
              <option value="">Tous les statuts</option>
              <option value="todo">À faire</option>
              <option value="in_progress">En cours</option>
              <option value="done">Terminé</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center space-x-2 bg-[#0099DC] text-white px-4 py-2.5 rounded-lg hover:bg-[#007bb5] transition-colors text-sm font-bold shadow-md shadow-[#0099DC]/10 self-start lg:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Créer une tâche</span>
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0099DC]" />
          <span className="text-sm font-bold text-gray-500">Chargement du tableau des tâches...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.id);
            return (
              <div
                key={col.id}
                className={`rounded-2xl shadow-xs border border-gray-200/60 p-4 flex flex-col h-[70vh] ${col.color}`}
              >
                {/* Column Header */}
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200 shrink-0">
                  <div className="flex items-center gap-2">
                    {col.icon}
                    <h3 className="font-extrabold text-gray-800 text-sm uppercase tracking-wide">{col.title}</h3>
                  </div>
                  <span className="bg-gray-200/80 text-gray-700 text-xs font-black px-2.5 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1.5 custom-scrollbar">
                  {colTasks.map(task => {
                    const overdue = isOverdue(task.due_date, task.status);
                    return (
                      <motion.div
                        key={task.id}
                        layoutId={task.id}
                        initial={{ scale: 0.98, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative group"
                      >
                        {/* Tags and Delete */}
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <div className="flex flex-wrap gap-1">
                            {getDeptTag(task.department_code)}
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                            <button
                              onClick={() => handleOpenModal(task)}
                              className="p-1 text-gray-400 hover:text-[#0099DC] hover:bg-gray-100 rounded-md transition"
                              title="Modifier"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(task.id)}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Title */}
                        <h4 className="font-bold text-gray-900 text-sm mb-3 leading-snug">{task.title}</h4>

                        {/* Associated Event */}
                        {task.event && (
                          <div className="flex items-center text-xs text-gray-500 mb-2 gap-1.5 bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                            <Tag className="w-3 h-3 text-[#0099DC] shrink-0" />
                            <span className="truncate font-medium">{task.event.title}</span>
                          </div>
                        )}

                        {/* Footer info (Due date & assignee) */}
                        <div className="flex justify-between items-center pt-2.5 border-t border-gray-100 text-[11px] text-gray-500">
                          {task.due_date ? (
                            <div className={`flex items-center gap-1 font-semibold ${overdue ? 'text-red-600 font-extrabold' : ''}`}>
                              {overdue ? <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" /> : <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                              <span>Échéance: {task.due_date}</span>
                            </div>
                          ) : (
                            <div className="text-gray-400">Pas d'échéance</div>
                          )}

                          {task.assigned_user ? (
                            <div className="flex items-center gap-1 font-medium bg-gray-100 px-2 py-0.5 rounded-full max-w-[100px] truncate" title={task.assigned_user.email}>
                              <User className="w-2.5 h-2.5 shrink-0 text-gray-500" />
                              <span>{task.assigned_user.email.split('@')[0]}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">Non assigné</span>
                          )}
                        </div>

                        {/* Drag/Quick Shift Buttons */}
                        <div className="mt-3 pt-2.5 border-t border-gray-100/60 flex justify-end gap-1.5">
                          {task.status !== 'todo' && (
                            <button
                              onClick={() => handleQuickStatusMove(task.id, 'todo')}
                              className="px-2 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200 text-[10px] font-bold rounded transition"
                            >
                              À faire
                            </button>
                          )}
                          {task.status !== 'in_progress' && (
                            <button
                              onClick={() => handleQuickStatusMove(task.id, 'in_progress')}
                              className="px-2 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 text-[10px] font-bold rounded transition border border-sky-200"
                            >
                              Démarrer
                            </button>
                          )}
                          {task.status !== 'done' && (
                            <button
                              onClick={() => handleQuickStatusMove(task.id, 'done')}
                              className="px-2 py-1 bg-green-50 text-green-700 hover:bg-green-100 text-[10px] font-bold rounded transition border border-green-200"
                            >
                              Terminer
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                  {colTasks.length === 0 && (
                    <div className="py-12 text-center text-xs text-gray-400 bg-white/40 border border-dashed border-gray-300/60 rounded-xl">
                      Aucune tâche
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TASK MODAL (ADD / EDIT) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingTask ? 'Modifier la tâche' : 'Créer une nouvelle tâche'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                >
                  <span className="text-sm font-bold text-gray-500 hover:text-gray-900 px-2.5 py-1 hover:bg-gray-100 rounded-md">Fermer</span>
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Titre de la tâche</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: Rédiger le communiqué de presse..."
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Département Assigné</label>
                  <select
                    disabled={!isGlobalAdmin}
                    value={formData.department_code}
                    onChange={e => setFormData({ ...formData, department_code: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:bg-white transition text-sm text-gray-900 font-medium"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d.code} value={d.code}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Événement Associé (Optionnel)</label>
                  <select
                    value={formData.event_id}
                    onChange={e => setFormData({ ...formData, event_id: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:bg-white transition text-sm text-gray-900"
                  >
                    <option value="">Aucun événement</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>
                        {event.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase">Date d'échéance</label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:bg-white transition text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase">Statut</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:bg-white transition text-sm text-gray-900 font-medium"
                    >
                      <option value="todo">À faire</option>
                      <option value="in_progress">En cours</option>
                      <option value="done">Terminé</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
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
    </motion.div>
  );
}
