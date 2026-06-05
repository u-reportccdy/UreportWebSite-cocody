import React from 'react';
import { motion } from 'framer-motion';
import { MapPinIcon, CalendarIcon, MoreHorizontalIcon, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RecentEventsProps {
  events?: any[];
}

export function RecentEvents({ events }: RecentEventsProps) {
  const list = events || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col"
    >
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-lg font-bold text-[#1E293B]">
          Événements Récents & À Venir
        </h2>
        <Link to="/admin/events" className="text-xs font-bold text-[#0099DC] hover:text-white hover:bg-[#0099DC] transition-all px-3 py-1 rounded-full border border-[#0099DC]/20">
          Voir tout
        </Link>
      </div>

      <div className="overflow-x-auto flex-1">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500 font-medium space-y-3">
            <Calendar className="w-12 h-12 text-gray-300 animate-pulse" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-700">Aucun événement trouvé</p>
              <p className="text-xs text-gray-400">Enregistrez un événement dans l'onglet "Événements" pour commencer !</p>
            </div>
            <Link to="/admin/events" className="text-xs bg-[#0099DC] hover:bg-[#007bb5] text-white px-4 py-2 rounded-xl transition font-semibold shadow-md shadow-[#0099DC]/10">
              Créer un événement
            </Link>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[#64748B] text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Titre</th>
                <th className="px-6 py-4 font-medium">Date & Lieu</th>
                <th className="px-6 py-4 font-medium">Statut</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.map((event) => {
                const dateStr = new Date(event.date || event.event_date).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });

                return (
                  <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-[#1E293B] line-clamp-1">
                        {event.title}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center text-xs text-[#64748B]">
                          <CalendarIcon className="w-3 h-3 mr-1" />
                          {dateStr}
                        </div>
                        <div className="flex items-center text-xs text-[#64748B] line-clamp-1">
                          <MapPinIcon className="w-3 h-3 mr-1 animate-bounce" />
                          {event.location || 'Non spécifié'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        Actif
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to="/admin/events" className="text-xs font-bold text-[#0099DC] hover:underline">
                        Gérer
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}
