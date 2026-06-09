import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer 
} from 'recharts';

interface ImpactChartProps {
  data?: any[];
}

export function ImpactChart({ data }: ImpactChartProps) {
  const chartData = data && data.length > 0 ? data : [
    { name: 'Jan', événements: 0, participants: 0, partenaires: 0 },
    { name: 'Fév', événements: 0, participants: 0, partenaires: 0 },
    { name: 'Mar', événements: 0, participants: 0, partenaires: 0 },
    { name: 'Avr', événements: 0, participants: 0, partenaires: 0 },
    { name: 'Mai', événements: 0, participants: 0, partenaires: 0 },
    { name: 'Juin', événements: 0, participants: 0, partenaires: 0 }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-[#1E293B]">
          Statistiques d'Impact (6 derniers mois)
        </h2>
        <span className="text-xs font-semibold px-2.5 py-1 bg-gray-50 text-[#64748B] border border-gray-100 rounded-md">
          Données Temps Réel
        </span>
      </div>

      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 12 }}
              dy={10} 
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 12 }} 
            />
            <Tooltip
              cursor={{ fill: '#F8FAFC' }}
              contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }} 
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar
              dataKey="participants"
              name="Membres"
              fill="#6CC24A"
              radius={[4, 4, 0, 0]} 
            />
            <Bar
              dataKey="événements"
              name="Événements"
              fill="#0099DC"
              radius={[4, 4, 0, 0]} 
            />
            <Bar
              dataKey="partenaires"
              name="Partenaires"
              fill="#FFC107"
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
