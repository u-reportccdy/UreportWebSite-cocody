import React from 'react';
import { motion } from 'framer-motion';
import { ClockIcon, FileText, Calendar, Users, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ActivityFeedProps {
  activities?: any[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const list = activities || [];

  const role = sessionStorage.getItem('admin_role');
  const getReportsLink = () => {
    if (role === 'secretariat') return '/admin/reports';
    if (role === 'finances' || role === 'superadmin' || role === 'president' || role === 'admin') return '/admin/stats';
    if (role === 'communication') return '/admin/articles';
    if (role === 'programme' || role === 'activites') return '/admin/events';
    if (role === 'logistique') return '/admin/logistics';
    return '/admin';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col"
    >
      <h2 className="text-lg font-bold text-[#1E293B] mb-6">
        Activité Récente
      </h2>
      <div className="space-y-6 flex-1">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500 font-medium space-y-2">
            <ClockIcon className="w-10 h-10 text-gray-300 animate-spin" style={{ animationDuration: '3s' }} />
            <p className="text-sm font-semibold text-gray-700">Aucune activité enregistrée</p>
            <p className="text-xs text-gray-400">Toutes les créations d'articles, événements, ou inscriptions apparaîtront ici.</p>
          </div>
        ) : (
          list.map((activity, index) => {
            const Icon = activity.icon || Eye;
            return (
              <div key={activity.id} className="flex relative">
                {index !== list.length - 1 && (
                  <div className="absolute top-10 left-5 bottom-[-24px] w-0.5 bg-gray-100" />
                )}
                <div
                  className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-4"
                  style={{
                    backgroundColor: `${activity.color}15`,
                    color: activity.color
                  }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1E293B]">
                    {activity.title}
                  </p>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {activity.description}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">{activity.time}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
      <Link to={getReportsLink()} className="w-full mt-6 py-2.5 text-sm font-semibold text-[#0099DC] hover:text-[#007bb5] transition-colors block text-center border border-[#0099DC]/10 rounded-xl hover:bg-blue-50">
        Voir tous les rapports
      </Link>
    </motion.div>
  );
}
