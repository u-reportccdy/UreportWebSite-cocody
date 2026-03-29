import React from 'react';
import { motion } from 'framer-motion';
import { ClockIcon, CheckCircleIcon, PlusCircleIcon, MessageCircleIcon, FileTextIcon, CalendarIcon, UserPlusIcon, ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
const activities = [
{
  id: 1,
  type: 'article',
  title: 'Nouvel article publié',
  description: '"L\'impact de la jeunesse à Cocody" par Admin',
  time: 'il y a 2 heures',
  icon: FileTextIcon,
  color: '#0099DC'
},
{
  id: 2,
  type: 'event',
  title: 'Événement créé',
  description: 'Campagne de propreté Cocody',
  time: 'il y a 5 heures',
  icon: CalendarIcon,
  color: '#6CC24A'
},
{
  id: 3,
  type: 'user',
  title: 'Nouvelle inscription',
  description: 'Kouassi Jean s\'est inscrit à "Formation en leadership"',
  time: 'hier',
  icon: UserPlusIcon,
  color: '#FFC107'
},
{
  id: 4,
  type: 'gallery',
  title: 'Album mis à jour',
  description: '15 nouvelles photos ajoutées à "Sensibilisation VIH"',
  time: 'hier',
  icon: ImageIcon,
  color: '#8B5CF6'
}];

export function ActivityFeed() {
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
        delay: 0.4
      }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
      
      <h2 className="text-lg font-bold text-[#1E293B] mb-6">
        Activité Récente
      </h2>
      <div className="space-y-6">
        {activities.map((activity, index) => {
          const Icon = activity.icon;
          return (
            <div key={activity.id} className="flex relative">
              {index !== activities.length - 1 &&
              <div className="absolute top-10 left-5 bottom-[-24px] w-0.5 bg-gray-100" />
              }
              <div
                className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-4"
                style={{
                  backgroundColor: `${activity.color}15`,
                  color: activity.color
                }}>
                
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1E293B]">
                  {activity.title}
                </p>
                <p className="text-sm text-[#64748B] mt-0.5">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
              </div>
            </div>);

        })}
      </div>
      <Link to="/admin/stats" className="w-full mt-6 py-2 text-sm font-medium text-[#0099DC] hover:text-[#007bb5] transition-colors block text-center border border-[#0099DC]/10 rounded-lg hover:bg-blue-50">
        Voir tout l'historique
      </Link>
    </motion.div>);

}