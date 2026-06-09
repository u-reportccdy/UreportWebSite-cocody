import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { SearchIcon, DownloadIcon, CheckCircle2Icon, XCircleIcon, RefreshCwIcon, Loader2 } from 'lucide-react';
import { fetchAttendanceSummary, fetchEventRegistrations, fetchEvents, markEventAttendance } from '../../services/event.service';

export function Inscriptions() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [eventQuery, setEventQuery] = useState('');
  const [isEventListOpen, setIsEventListOpen] = useState(false);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedEvent = events.find(event => event.id === selectedEventId);

  useEffect(() => {
    if (selectedEvent) {
      setEventQuery(selectedEvent.title || '');
    }
  }, [selectedEventId, selectedEvent]);

  const loadEvents = async () => {
    setIsLoading(true);
    setError('');
    try {
      const rows = await fetchEvents();
      setEvents(rows);
      if (!selectedEventId && rows.length > 0) {
        setSelectedEventId(rows[0].id);
      }
    } catch (err) {
      console.error('Erreur chargement activites:', err);
      setError("Impossible de charger les activites.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadRegistrations = async (eventId: string) => {
    if (!eventId) return;
    setIsLoading(true);
    setError('');
    try {
      const [registrationRows, attendanceSummary] = await Promise.all([
        fetchEventRegistrations(eventId),
        fetchAttendanceSummary(eventId),
      ]);
      setRegistrations(registrationRows);
      setSummary(attendanceSummary);
    } catch (err) {
      console.error('Erreur chargement presences:', err);
      setError("Impossible de charger les inscriptions de cette activite.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    loadRegistrations(selectedEventId);
  }, [selectedEventId]);

  const filteredRegistrations = useMemo(() => {
    return registrations.filter(user => {
      const haystack = `${user.full_name || ''} ${user.email || ''} ${user.phone || ''}`.toLowerCase();
      return haystack.includes(searchQuery.toLowerCase());
    });
  }, [registrations, searchQuery]);

  const filteredEvents = useMemo(() => {
    const q = eventQuery.trim().toLowerCase();
    if (!q) return events;
    return events.filter(event => {
      const title = String(event.title || '').toLowerCase();
      const location = String(event.location || '').toLowerCase();
      const date = String(event.event_date || '').toLowerCase();
      return title.includes(q) || location.includes(q) || date.includes(q);
    });
  }, [events, eventQuery]);

  const handleAttendance = async (registrationId: string, attended: boolean) => {
    await markEventAttendance(selectedEventId, registrationId, attended);
    await loadRegistrations(selectedEventId);
  };

  const handleExportCSV = () => {
    const escapeCsv = (value: any) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rowsToExport = filteredRegistrations;
    if (rowsToExport.length === 0) {
      setError("Aucune donnée à exporter pour cette activité.");
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

    const fullContent = '\uFEFF' + 'sep=;\r\n' + headers.join(';') + '\r\n' + csvContent;
    const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `presences_ureport_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const attendanceRate = summary?.percentage_attended ?? 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <label className="block text-xs font-black uppercase text-gray-500 mb-2">Activite</label>
          <div className="relative">
            <input
              type="text"
              value={eventQuery}
              onFocus={() => setIsEventListOpen(true)}
              onChange={(e) => {
                setEventQuery(e.target.value);
                setIsEventListOpen(true);
              }}
              placeholder="Rechercher une activité..."
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0099DC]"
            />
            {isEventListOpen && (
              <div className="absolute z-30 mt-2 w-full max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {filteredEvents.map(event => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => {
                      setSelectedEventId(event.id);
                      setEventQuery(event.title || '');
                      setIsEventListOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50"
                  >
                    <div className="font-semibold text-[#1E293B]">{event.title}</div>
                    <div className="text-xs text-[#64748B]">{event.location || '-'} {event.event_date ? `- ${event.event_date}` : ''}</div>
                  </button>
                ))}
                {filteredEvents.length === 0 && (
                  <div className="px-4 py-3 text-sm text-[#64748B]">Aucune activité trouvée.</div>
                )}
              </div>
            )}
          </div>
          {selectedEvent && (
            <p className="mt-3 text-sm text-[#64748B]">
              {selectedEvent.location} {selectedEvent.event_date ? `- ${selectedEvent.event_date}` : ''}
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase text-gray-500">Presence</span>
            <span className="text-2xl font-black text-[#0099DC]">{Math.round(attendanceRate)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full bg-[#6CC24A]" style={{ width: `${Math.min(attendanceRate, 100)}%` }} />
          </div>
          <p className="mt-3 text-sm text-[#64748B]">
            {summary?.attended || 0} presents sur {summary?.total_registered || 0} inscrits
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-80">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Rechercher un participant..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 text-gray-900 placeholder-gray-500 shadow-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC]" />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => loadRegistrations(selectedEventId)} className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-[#1E293B] px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto">
            <RefreshCwIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
          <button onClick={handleExportCSV} className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-[#1E293B] px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto">
            <DownloadIcon className="w-5 h-5" />
            <span>Exporter CSV</span>
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[#64748B] text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Participant</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Statut</th>
                <th className="px-6 py-4 font-medium">Presence</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12">
                    <div className="flex items-center justify-center gap-2 text-[#64748B]">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm font-medium">Chargement des inscriptions...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRegistrations.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-[#1E293B]">{user.full_name}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-[#1E293B]">{user.email}</div>
                    <div className="text-xs text-[#64748B]">{user.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#64748B]">{user.member_status}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${user.attended ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {user.attended ? 'Present' : 'Non marque'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleAttendance(user.id, true)} className="p-1.5 text-gray-400 hover:text-[#6CC24A] transition-colors rounded-md hover:bg-green-50" title="Marquer present">
                      <CheckCircle2Icon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleAttendance(user.id, false)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-md hover:bg-red-50" title="Marquer absent">
                      <XCircleIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && filteredRegistrations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-[#64748B]">Aucune inscription pour cette activite.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
