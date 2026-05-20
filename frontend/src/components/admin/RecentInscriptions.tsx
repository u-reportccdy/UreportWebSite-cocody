import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2Icon, Users, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RecentInscriptionsProps {
  members?: any[];
}

export function RecentInscriptions({ members }: RecentInscriptionsProps) {
  const list = members || [];
  const statusLabel: Record<string, string> = {
    aspirant: 'Aspirant',
    ureporter: 'U-Reporter',
    mentor: 'Mentor',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-[#1E293B]">
          Derniers Membres Inscrits
        </h2>
        <Link to="/admin/inscriptions" className="text-xs font-bold text-[#0099DC] hover:text-white hover:bg-[#0099DC] transition-all px-3 py-1 rounded-full border border-[#0099DC]/20">
          Voir tout
        </Link>
      </div>

      <div className="space-y-4 flex-1">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500 font-medium space-y-2">
            <Users className="w-10 h-10 text-gray-300" />
            <p className="text-sm font-semibold text-gray-700">Aucun membre inscrit pour le moment</p>
            <p className="text-xs text-gray-400">Les inscriptions en ligne apparaîtront ici dès qu'un citoyen s'engagera.</p>
          </div>
        ) : (
          list.map((user) => {
            const initials = user.full_name
              ? user.full_name.split(' ').map((n: string) => n.charAt(0)).join('').toUpperCase().slice(0, 2)
              : 'UR';

            const createdDate = new Date(user.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-[#0099DC] bg-opacity-10 flex items-center justify-center text-[#0099DC] font-bold text-sm">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1E293B]">
                      {user.full_name}
                    </p>
                    <p className="text-xs text-[#64748B] capitalize">
                      Profil : {statusLabel[String(user.status || '').toLowerCase()] || user.status || 'Aspirant'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end space-x-1 text-green-600 mb-1">
                    <CheckCircle2Icon className="w-3 h-3" />
                    <span className="text-xs font-semibold">Inscrit</span>
                  </div>
                  <p className="text-[10px] text-gray-400">{createdDate}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
