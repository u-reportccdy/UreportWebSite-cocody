import React from 'react';
import { motion } from 'framer-motion';
import {
  CalendarPlusIcon,
  PenSquareIcon,
  HandshakeIcon,
  UsersIcon } from
'lucide-react';
import { useNavigate } from 'react-router-dom';

const actions = [
{
  label: 'Créer un événement',
  icon: CalendarPlusIcon,
  color: '#0099DC',
  path: '/admin/events'
},
{
  label: 'Rédiger un article',
  icon: PenSquareIcon,
  color: '#6CC24A',
  path: '/admin/articles'
},
{
  label: 'Ajouter un partenaire',
  icon: HandshakeIcon,
  color: '#FFC107',
  path: '/admin/partners'
},
{
  label: 'Voir les inscriptions',
  icon: UsersIcon,
  color: '#8B5CF6',
  path: '/admin/inscriptions'
}];

export function QuickActions() {
  const navigate = useNavigate();
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
        delay: 0.2
      }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
      
      <h2 className="text-lg font-bold text-[#1E293B] mb-4">Actions Rapides</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
              <motion.button
              key={index}
              onClick={() => navigate(action.path)}
              whileHover={{
                scale: 1.02
              }}
              whileTap={{
                scale: 0.98
              }}
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all bg-gray-50 hover:bg-white group">
              
              <div
                className="p-3 rounded-full mb-3 transition-colors"
                style={{
                  backgroundColor: `${action.color}15`,
                  color: action.color
                }}>
                
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-[#1E293B] text-center group-hover:text-[#0099DC] transition-colors">
                {action.label}
              </span>
            </motion.button>);

        })}
      </div>
    </motion.div>);

}
