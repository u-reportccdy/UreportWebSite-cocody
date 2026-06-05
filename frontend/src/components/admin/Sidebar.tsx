import React from 'react';
import {
  LayoutDashboardIcon,
  FileTextIcon,
  CalendarIcon,
  UsersIcon,
  ImageIcon,
  MessageSquareIcon,
  HandshakeIcon,
  MailIcon,
  BarChartIcon,
  XIcon,
  LogOutIcon } from
'lucide-react';
interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  activeItem: string;
  setActiveItem: (item: string) => void;
}
const navItems = [
{
  id: 'dashboard',
  label: 'Tableau de bord',
  icon: LayoutDashboardIcon
},
{
  id: 'articles',
  label: 'Articles',
  icon: FileTextIcon
},
{
  id: 'events',
  label: 'Événements',
  icon: CalendarIcon
},
{
  id: 'inscriptions',
  label: 'Inscriptions',
  icon: UsersIcon
},
{
  id: 'gallery',
  label: 'Galerie',
  icon: ImageIcon
},
{
  id: 'testimonials',
  label: 'Témoignages',
  icon: MessageSquareIcon
},
{
  id: 'partners',
  label: 'Partenaires',
  icon: HandshakeIcon
},
{
  id: 'newsletter',
  label: 'Newsletter',
  icon: MailIcon
},
{
  id: 'stats',
  label: 'Statistiques',
  icon: BarChartIcon
}];

export function Sidebar({
  isOpen,
  setIsOpen,
  activeItem,
  setActiveItem
}: SidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen &&
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={() => setIsOpen(false)} />

      }

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#0099DC] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">U</span>
            </div>
            <span className="font-bold text-xl text-[#1E293B]">
              Report <span className="text-[#0099DC]">Cocody</span>
            </span>
          </div>
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setIsOpen(false)}>
            
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveItem(item.id);
                  if (window.innerWidth < 1024) setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-[#0099DC] text-white' : 'text-[#64748B] hover:bg-gray-50 hover:text-[#1E293B]'}`}>
                
                <Icon
                  className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                
                <span className="font-medium text-sm">{item.label}</span>
              </button>);

          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src="https://ui-avatars.com/api/?name=Admin+Cocody&background=0099DC&color=fff"
                alt="Admin"
                className="w-9 h-9 rounded-full" />
              
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold text-[#1E293B]">Admin</span>
                <span className="text-xs text-[#64748B]">Administrateur</span>
              </div>
            </div>
            <button className="text-gray-400 hover:text-red-500 transition-colors">
              <LogOutIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>
    </>);

}
