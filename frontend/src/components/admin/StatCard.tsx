import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUpIcon, TrendingDownIcon, BoxIcon } from 'lucide-react';
export interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  color: string;
  delay?: number;
}
export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  delay = 0
}: StatCardProps) {
  const isPositive = change >= 0;
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
        delay
      }}
      whileHover={{
        y: -4,
        transition: {
          duration: 0.2
        }
      }}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
      
      <div
        className="absolute top-0 right-0 w-24 h-24 opacity-5 rounded-bl-full"
        style={{
          backgroundColor: color
        }} />
      

      <div className="flex justify-between items-start mb-4">
        <div
          className="p-3 rounded-lg"
          style={{
            backgroundColor: `${color}15`,
            color
          }}>
          
          <Icon className="w-6 h-6" />
        </div>
        <div
          className={`flex items-center space-x-1 text-sm font-medium px-2 py-1 rounded-full ${isPositive ? 'text-[#6CC24A] bg-[#6CC24A] bg-opacity-10' : 'text-red-500 bg-red-500 bg-opacity-10'}`}>
          
          {isPositive ?
          <TrendingUpIcon className="w-4 h-4" /> :

          <TrendingDownIcon className="w-4 h-4" />
          }
          <span>{Math.abs(change)}%</span>
        </div>
      </div>

      <div>
        <h3 className="text-[#64748B] text-sm font-medium mb-1">{title}</h3>
        <p className="text-3xl font-bold text-[#1E293B]">{value}</p>
      </div>
    </motion.div>);

}