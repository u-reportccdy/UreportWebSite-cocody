import React from 'react';
import { MenuIcon, BellIcon, SearchIcon } from 'lucide-react';
interface DashboardHeaderProps {
  onMenuClick: () => void;
  title: string;
}
export function DashboardHeader({ onMenuClick, title }: DashboardHeaderProps) {
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="mr-4 lg:hidden text-gray-500 hover:text-gray-700">
          
          <MenuIcon className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-[#1E293B] hidden sm:block">
          {title}
        </h1>
      </div>

      <div className="flex items-center space-x-4 sm:space-x-6">
        {/* Search */}
        <div className="relative hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Rechercher..."
            className="w-full bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500 shadow-sm rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-ureport-blue focus:bg-white transition-colors" />
          
        </div>

        {/* Date Display */}
        <div className="hidden lg:block text-sm text-[#64748B] font-medium capitalize">
          {today}
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-gray-500 transition-colors">
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          <BellIcon className="h-6 w-6" />
        </button>
      </div>
    </header>);

}