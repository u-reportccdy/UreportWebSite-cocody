import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ImpactChart } from '../../components/admin/ImpactChart';
import { fetchMembers } from '../../services/member.service';
import { fetchEvents } from '../../services/event.service';
import { fetchPartners } from '../../services/content.service';
import { Loader2 } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid } from
'recharts';
const COLORS = ['#0099DC', '#6CC24A', '#FFC107', '#8B5CF6'];

export function Stats() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    const loadData = async () => {
      try {
        const [membersData, eventsData, partnersData] = await Promise.all([
          fetchMembers(),
          fetchEvents(),
          fetchPartners()
        ]);
        setMembers(membersData || []);
        setEvents(eventsData || []);
        setPartners(partnersData || []);
      } catch (err) {
        console.error('Erreur chargement données stats:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filterBySelectedYear = (items: any[], dateResolver: (item: any) => any) => {
    if (selectedYear === 'all') return items;
    const year = Number(selectedYear);
    return items.filter(item => {
      const rawDate = dateResolver(item);
      const d = new Date(rawDate);
      return !Number.isNaN(d.getTime()) && d.getFullYear() === year;
    });
  };

  const membersFiltered = useMemo(
    () => filterBySelectedYear(members, m => m.created_at),
    [members, selectedYear]
  );
  const eventsFiltered = useMemo(
    () => filterBySelectedYear(events, e => e.created_at || e.date || e.event_date),
    [events, selectedYear]
  );
  const partnersFiltered = useMemo(
    () => filterBySelectedYear(partners, p => p.created_at),
    [partners, selectedYear]
  );

  const impactData = useMemo(() => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const now = new Date();
    const points: any[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = d.getMonth();
      const year = d.getFullYear();
      if (selectedYear !== 'all' && year !== Number(selectedYear)) continue;

      const countInMonth = (rows: any[], dateResolver: (item: any) => any) =>
        rows.filter(row => {
          const rd = new Date(dateResolver(row));
          return !Number.isNaN(rd.getTime()) && rd.getFullYear() === year && rd.getMonth() === month;
        }).length;

      points.push({
        name: months[month],
        participants: countInMonth(membersFiltered, m => m.created_at),
        événements: countInMonth(eventsFiltered, e => e.created_at || e.date || e.event_date),
        partenaires: countInMonth(partnersFiltered, p => p.created_at),
      });
    }

    return points;
  }, [membersFiltered, eventsFiltered, partnersFiltered, selectedYear]);

  const growthData = useMemo(() => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const data = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const targetYear = d.getFullYear();
      const targetMonth = d.getMonth();
      
      if (selectedYear !== 'all' && targetYear !== Number(selectedYear)) {
        continue;
      }

      const cumulativeUsers = membersFiltered.filter(m => {
        const md = new Date(m.created_at);
        if (md.getFullYear() < targetYear) return true;
        if (md.getFullYear() === targetYear && md.getMonth() <= targetMonth) return true;
        return false;
      }).length;
      
      data.push({
        month: months[targetMonth],
        users: cumulativeUsers
      });
    }
    return data;
  }, [membersFiltered, selectedYear]);

  const categoryData = useMemo(() => {
    if (eventsFiltered.length === 0) return [];

    let sensibilisation = 0;
    let formation = 0;
    let communaute = 0;
    let sante = 0;
    
    eventsFiltered.forEach(e => {
      const text = ((e.title || '') + ' ' + (e.description || '')).toLowerCase();
      if (text.includes('sensibilisation') || text.includes('campagne')) sensibilisation++;
      else if (text.includes('formation') || text.includes('atelier')) formation++;
      else if (text.includes('santé') || text.includes('don') || text.includes('sang')) sante++;
      else communaute++;
    });

    return [
      { name: 'Sensibilisation', value: sensibilisation },
      { name: 'Formation', value: formation },
      { name: 'Communauté', value: communaute },
      { name: 'Santé', value: sante }
    ].filter(item => item.value > 0);
  }, [eventsFiltered]);

  const selectedYearLabel = useMemo(() => {
    if (selectedYear === 'all') return 'Tous les temps';
    return `Année ${selectedYear}`;
  }, [selectedYear]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#0099DC]" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6">
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#1E293B]">
          Statistiques Détaillées
        </h2>
        <select 
          className="text-sm border-gray-200 rounded-md text-[#64748B] focus:ring-[#0099DC] focus:border-[#0099DC] px-3 py-2 bg-white border"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          <option value={new Date().getFullYear().toString()}>Année {new Date().getFullYear()}</option>
          <option value={(new Date().getFullYear() - 1).toString()}>Année {new Date().getFullYear() - 1}</option>
          <option value="all">Tous les temps</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Impact Chart (Reused from dashboard) */}
        <div className="lg:col-span-2 h-[400px]">
          <ImpactChart data={impactData} />
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-[350px] flex flex-col">
          <h3 className="text-lg font-bold text-[#1E293B] mb-4">
            Répartition des Événements
          </h3>
          <div className="flex-1">
            {categoryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-[#64748B]">
                Aucune donnée pour {selectedYearLabel}
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value">
                  
                  {categoryData.map((entry, index) =>
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]} />

                  )}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }} />
                
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* User Growth */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-[350px] flex flex-col">
          <h3 className="text-lg font-bold text-[#1E293B] mb-4">
            Croissance des U-Reporters
          </h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={growthData}
                margin={{
                  top: 5,
                  right: 20,
                  left: 0,
                  bottom: 5
                }}>
                
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0" />
                
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: '#64748B',
                    fontSize: 12
                  }}
                  dy={10} />
                
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: '#64748B',
                    fontSize: 12
                  }} />
                
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }} />
                
                <Line
                  type="monotone"
                  dataKey="users"
                  name="Utilisateurs"
                  stroke="#0099DC"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: '#0099DC',
                    strokeWidth: 2,
                    stroke: '#fff'
                  }}
                  activeDot={{
                    r: 6
                  }} />
                
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>);

}
