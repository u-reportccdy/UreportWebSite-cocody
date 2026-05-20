import React, { useState, useEffect } from 'react';
import {
  CalendarIcon,
  UsersIcon,
  FileTextIcon,
  HandshakeIcon,
  FileText,
  Calendar,
  Users,
  ImageIcon
} from 'lucide-react';
import { StatCard } from '../../components/admin/StatCard';
import { ImpactChart } from '../../components/admin/ImpactChart';
import { QuickActions } from '../../components/admin/QuickActions';
import { RecentEvents } from '../../components/admin/RecentEvents';
import { ActivityFeed } from '../../components/admin/ActivityFeed';
import { RecentArticles } from '../../components/admin/RecentArticles';
import { RecentInscriptions } from '../../components/admin/RecentInscriptions';

import { fetchEvents } from '../../services/event.service';
import { fetchMembers } from '../../services/member.service';
import { fetchArticles } from '../../services/article.service';
import { fetchPartners } from '../../services/content.service';

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [membersData, eventsData, articlesData, partnersData] = await Promise.all([
          fetchMembers(),
          fetchEvents(),
          fetchArticles(),
          fetchPartners()
        ]);

        setMembers(membersData || []);
        setEvents(eventsData || []);
        setArticles(articlesData || []);
        setPartners(partnersData || []);
      } catch (err) {
        console.error('Erreur chargement données dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Compute dynamic monthly statistics for the last 6 months
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const currentMonthIdx = new Date().getMonth();
  const last6Months: string[] = [];
  
  for (let i = 5; i >= 0; i--) {
    let idx = currentMonthIdx - i;
    if (idx < 0) idx += 12;
    last6Months.push(months[idx]);
  }

  const chartData = last6Months.map(monthName => {
    const evtsInMonth = events.filter(e => {
      const d = new Date(e.created_at || e.date || e.event_date);
      return months[d.getMonth()] === monthName;
    }).length;

    const membersInMonth = members.filter(m => {
      const d = new Date(m.created_at);
      return months[d.getMonth()] === monthName;
    }).length;

    const partnersInMonth = partners.filter(p => {
      const d = new Date(p.created_at);
      return months[d.getMonth()] === monthName;
    }).length;

    return {
      name: monthName,
      événements: evtsInMonth,
      participants: membersInMonth,
      partenaires: partnersInMonth
    };
  });

  // Dynamically build activity feed
  const activitiesList: any[] = [];
  
  if (articles.length > 0) {
    const latest = articles[0];
    activitiesList.push({
      id: 'art-' + latest.id,
      type: 'article',
      title: 'Nouvel article publié',
      description: `"${latest.title}"`,
      time: new Date(latest.date || latest.published_at || latest.created_at).toLocaleDateString('fr-FR'),
      icon: FileText,
      color: '#8B5CF6',
      timestamp: new Date(latest.date || latest.published_at || latest.created_at).getTime()
    });
  }

  if (events.length > 0) {
    const latest = events[0];
    activitiesList.push({
      id: 'evt-' + latest.id,
      type: 'event',
      title: 'Événement créé',
      description: `"${latest.title}"`,
      time: new Date(latest.date || latest.event_date).toLocaleDateString('fr-FR'),
      icon: Calendar,
      color: '#0099DC',
      timestamp: new Date(latest.date || latest.event_date).getTime()
    });
  }

  if (members.length > 0) {
    const latest = members[0];
    activitiesList.push({
      id: 'mem-' + latest.id,
      type: 'user',
      title: 'Nouvelle inscription',
      description: `${latest.full_name} a rejoint U-Report Cocody`,
      time: new Date(latest.created_at).toLocaleDateString('fr-FR'),
      icon: Users,
      color: '#6CC24A',
      timestamp: new Date(latest.created_at).getTime()
    });
  }

  activitiesList.sort((a, b) => b.timestamp - a.timestamp);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ureport-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Row 1: Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Événements"
          value={events.length.toString()}
          change={events.length > 0 ? 100 : 0}
          icon={CalendarIcon}
          color="#0099DC"
          delay={0} 
        />
        
        <StatCard
          title="Participants"
          value={members.length.toLocaleString('fr-FR')}
          change={members.length > 0 ? 100 : 0}
          icon={UsersIcon}
          color="#6CC24A"
          delay={0.1} 
        />
        
        <StatCard
          title="Articles"
          value={articles.length.toString()}
          change={articles.length > 0 ? 100 : 0}
          icon={FileTextIcon}
          color="#8B5CF6"
          delay={0.2} 
        />
        
        <StatCard
          title="Partenaires"
          value={partners.length.toString()}
          change={partners.length > 0 ? 100 : 0}
          icon={HandshakeIcon}
          color="#FFC107"
          delay={0.3} 
        />
      </div>

      {/* Row 2: Chart & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ImpactChart data={chartData} />
        </div>
        <div className="lg:col-span-1">
          <QuickActions />
        </div>
      </div>

      {/* Row 3: Events & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentEvents events={events.slice(0, 5)} />
        </div>
        <div className="lg:col-span-1">
          <ActivityFeed activities={activitiesList} />
        </div>
      </div>

      {/* Row 4: Articles & Inscriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <RecentArticles articles={articles.slice(0, 4)} />
        </div>
        <div>
          <RecentInscriptions members={members.slice(0, 6)} />
        </div>
      </div>
    </div>
  );
}
