import React from 'react';
import { motion } from 'framer-motion';
import {
  CalendarPlusIcon,
  PenSquareIcon,
  HandshakeIcon,
  UsersIcon,
  Boxes,
  ClipboardList,
  Search,
  Mail,
  BarChart2,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const getActionsForRole = (role: string | null) => {
  if (!role) return [];
  
  if (role === 'superadmin' || role === 'admin' || role === 'president') {
    return [
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
        label: 'Voir les inscriptions',
        icon: UsersIcon,
        color: '#8B5CF6',
        path: '/admin/inscriptions'
      },
      {
        label: 'Rapports BE',
        icon: FileText,
        color: '#EF4444',
        path: '/admin/reports'
      }
    ];
  }

  switch (role) {
    case 'communication':
      return [
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
          label: 'Mes Tâches',
          icon: ClipboardList,
          color: '#0099DC',
          path: '/admin/tasks'
        }
      ];
    case 'activites':
    case 'programme':
      return [
        {
          label: 'Créer un événement',
          icon: CalendarPlusIcon,
          color: '#0099DC',
          path: '/admin/events'
        },
        {
          label: 'Voir les inscriptions',
          icon: UsersIcon,
          color: '#8B5CF6',
          path: '/admin/inscriptions'
        },
        {
          label: 'Mes Tâches',
          icon: ClipboardList,
          color: '#6CC24A',
          path: '/admin/tasks'
        }
      ];
    case 'logistique':
      return [
        {
          label: 'Gérer la logistique',
          icon: Boxes,
          color: '#E28743',
          path: '/admin/logistics'
        },
        {
          label: 'Mes Tâches',
          icon: ClipboardList,
          color: '#0099DC',
          path: '/admin/tasks'
        }
      ];
    case 'finances':
      return [
        {
          label: 'Statistiques & Cotisations',
          icon: BarChart2,
          color: '#8B5CF6',
          path: '/admin/stats'
        },
        {
          label: 'Rapports BE',
          icon: FileText,
          color: '#EF4444',
          path: '/admin/reports'
        },
        {
          label: 'Mes Tâches',
          icon: ClipboardList,
          color: '#6CC24A',
          path: '/admin/tasks'
        }
      ];
    case 'secretariat':
      return [
        {
          label: 'Chercher un membre',
          icon: Search,
          color: '#0099DC',
          path: '/admin/member-search'
        },
        {
          label: 'Newsletter',
          icon: Mail,
          color: '#6CC24A',
          path: '/admin/newsletter'
        },
        {
          label: 'Rapports BE',
          icon: FileText,
          color: '#EF4444',
          path: '/admin/reports'
        },
        {
          label: 'Mes Tâches',
          icon: ClipboardList,
          color: '#8B5CF6',
          path: '/admin/tasks'
        }
      ];
    default:
      return [];
  }
};

export function QuickActions() {
  const navigate = useNavigate();
  const role = sessionStorage.getItem('admin_role');
  const roleActions = getActionsForRole(role);

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
        {roleActions.map((action, index) => {
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
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

