import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, ClockIcon, CheckCircle2Icon } from 'lucide-react';
import { Link } from 'react-router-dom';

const inscriptions = [
{
  id: 1,
  name: 'Kouassi Jean',
  email: 'jean.kouassi@email.ci',
  event: 'Formation en leadership jeune',
  date: "Aujourd'hui, 10:23"
},
{
  id: 2,
  name: 'Touré Aminata',
  email: 'atoure99@email.ci',
  event: 'Campagne de propreté Cocody',
  date: "Aujourd'hui, 09:15"
},
{
  id: 3,
  name: 'Bamba Seydou',
  email: 'seydou.b@email.ci',
  event: 'Journée de sensibilisation',
  date: 'Hier, 16:45'
},
{
  id: 4,
  name: 'Koffi Marie',
  email: 'marie.koffi@email.ci',
  event: 'Formation en leadership jeune',
  date: 'Hier, 14:20'
},
{
  id: 5,
  name: 'Diarrassouba Ibrahim',
  email: 'ib.diarra@email.ci',
  event: 'Campagne de propreté Cocody',
  date: 'Hier, 11:05'
},
{
  id: 6,
  name: 'Yao Michel',
  email: 'm.yao@email.ci',
  event: 'Journée de sensibilisation',
  date: '12 Oct, 08:30'
}];

export function RecentInscriptions() {
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
        delay: 0.6
      }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-[#1E293B]">
          Dernières Inscriptions
        </h2>
        <Link to="/admin/inscriptions" className="text-xs font-bold text-[#0099DC] hover:text-white hover:bg-[#0099DC] transition-all px-3 py-1 rounded-full border border-[#0099DC]/20">
          Voir tout
        </Link>
      </div>

      <div className="space-y-4">
        {inscriptions.map((user) =>
        <div
          key={user.id}
          className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
          
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#0099DC] bg-opacity-10 flex items-center justify-center text-[#0099DC] font-bold text-sm">
                {user.name.charAt(0)}
                {user.name.split(' ')[1]?.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1E293B]">
                  {user.name}
                </p>
                <p className="text-xs text-[#64748B] truncate max-w-[150px] sm:max-w-[200px]">
                  {user.event}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end space-x-1 text-green-600 mb-1">
                <CheckCircle2Icon className="w-3 h-3" />
                <span className="text-xs font-medium">Confirmée</span>
              </div>
              <p className="text-xs text-gray-400">{user.date}</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>);

}