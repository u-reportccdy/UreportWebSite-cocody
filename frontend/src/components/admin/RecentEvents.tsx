import React from 'react';
import { motion } from 'framer-motion';
import { MapPinIcon, UsersIcon, ClockIcon, CalendarIcon, MoreHorizontalIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const events = [
{
  id: 1,
  title: 'Journée de sensibilisation au VIH/SIDA',
  date: '15 Oct 2024',
  location: 'Université FHB, Cocody',
  status: 'À venir',
  registered: 145,
  capacity: 200
},
{
  id: 2,
  title: 'Formation en leadership jeune',
  date: '22 Oct 2024',
  location: 'Mairie de Cocody',
  status: 'Ouvert',
  registered: 42,
  capacity: 50
},
{
  id: 3,
  title: 'Campagne de propreté Cocody',
  date: '05 Nov 2024',
  location: 'Blockhauss',
  status: 'Ouvert',
  registered: 89,
  capacity: 100
},
{
  id: 4,
  title: "Atelier d'éducation civique",
  date: '10 Sep 2024',
  location: 'Lycée Classique',
  status: 'Fermé',
  registered: 120,
  capacity: 120
},
{
  id: 5,
  title: 'Forum des jeunes engagés',
  date: '28 Aoû 2024',
  location: 'Palais de la Culture',
  status: 'Fermé',
  registered: 350,
  capacity: 350
}];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Ouvert':
      return 'bg-green-100 text-green-700';
    case 'À venir':
      return 'bg-blue-100 text-blue-700';
    case 'Fermé':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};
export function RecentEvents() {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      transition={{
        duration: 0.4,
        delay: 0.3
      }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
      
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-lg font-bold text-[#1E293B]">
          Événements Récents & À Venir
        </h2>
        <Link to="/admin/events" className="text-xs font-bold text-[#0099DC] hover:text-white hover:bg-[#0099DC] transition-all px-3 py-1 rounded-full border border-[#0099DC]/20">
          Voir tout
        </Link>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-[#64748B] text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-medium">Titre</th>
              <th className="px-6 py-4 font-medium">Date & Lieu</th>
              <th className="px-6 py-4 font-medium">Statut</th>
              <th className="px-6 py-4 font-medium">Inscrits</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {events.map((event) =>
            <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-[#1E293B]">
                    {event.title}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center text-xs text-[#64748B]">
                      <CalendarIcon className="w-3 h-3 mr-1" />
                      {event.date}
                    </div>
                    <div className="flex items-center text-xs text-[#64748B]">
                      <MapPinIcon className="w-3 h-3 mr-1" />
                      {event.location}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                  
                    {event.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2 mr-2 max-w-[60px]">
                      <div
                      className="bg-[#0099DC] h-2 rounded-full"
                      style={{
                        width: `${event.registered / event.capacity * 100}%`
                      }}>
                    </div>
                    </div>
                    <span className="text-xs font-medium text-[#64748B]">
                      {event.registered}/{event.capacity}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-gray-400 hover:text-[#0099DC] transition-colors">
                    <MoreHorizontalIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>);

}