import React, { useState, useEffect } from 'react';
import {
  CalendarIcon,
  UsersIcon,
  FileTextIcon,
  HandshakeIcon,
  FileText,
  Calendar,
  Users,
  ImageIcon,
  Boxes,
  ClipboardList,
  Download,
  BarChart2,
  Mail,
  Search
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
import { fetchMaterials, fetchLogisticsRequests } from '../../services/logistics.service';
import { fetchContributions } from '../../services/contribution.service';
import { fetchNewsletterSubscribers } from '../../services/content.service';

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [logisticsRequests, setLogisticsRequests] = useState<any[]>([]);
  const [contributions, setContributions] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);

  const role = sessionStorage.getItem('admin_role') || '';
  const isSuperadminOrPresident = role === 'superadmin' || role === 'president' || role === 'admin';
  const canViewCommunication = isSuperadminOrPresident || role === 'communication';
  const canViewProgramme = isSuperadminOrPresident || role === 'programme' || role === 'activites';
  const canViewSecretariat = isSuperadminOrPresident || role === 'secretariat';
  const canViewLogistique = isSuperadminOrPresident || role === 'logistique';
  const canViewFinances = isSuperadminOrPresident || role === 'finances';

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const promises: Promise<void>[] = [];
        
        if (canViewSecretariat) {
          promises.push(fetchMembers().then(d => setMembers(d || [])).catch(console.error));
          promises.push(fetchNewsletterSubscribers().then(d => setSubscribers(d || [])).catch(console.error));
        }
        if (canViewProgramme) {
          promises.push(fetchEvents().then(d => setEvents(d || [])).catch(console.error));
        }
        if (canViewCommunication) {
          promises.push(fetchArticles().then(d => setArticles(d || [])).catch(console.error));
          promises.push(fetchPartners().then(d => setPartners(d || [])).catch(console.error));
        }
        if (canViewLogistique) {
          promises.push(fetchMaterials().then(d => setMaterials(d || [])).catch(console.error));
          promises.push(fetchLogisticsRequests().then(d => setLogisticsRequests(d || [])).catch(console.error));
        }
        if (canViewFinances) {
          promises.push(fetchContributions().then(d => setContributions(d || [])).catch(console.error));
        }

        await Promise.all(promises);
      } catch (err) {
        console.error('Erreur chargement données dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [canViewSecretariat, canViewProgramme, canViewCommunication, canViewLogistique, canViewFinances]);

  // Handle department-specific CSV download
  const handleExportData = () => {
    let headers: string[] = [];
    let rowsToExport: any[] = [];
    let fileName = '';

    const escapeCsv = (value: any) => `"${String(value ?? '').replace(/"/g, '""')}"`;

    if (role === 'logistique') {
      headers = ['Nom matériel', 'Quantité totale', 'Quantité disponible', 'Description', 'Date création'];
      rowsToExport = materials.map(m => [
        escapeCsv(m.name),
        escapeCsv(m.total_quantity),
        escapeCsv(m.available_quantity),
        escapeCsv(m.description),
        escapeCsv(m.created_at)
      ]);
      fileName = 'inventaire_logistique.csv';
    } else if (role === 'finances') {
      headers = ['ID Cotisation', 'Membre', 'Téléphone', 'Montant', 'Statut', 'Référence', 'Date'];
      rowsToExport = contributions.map(c => [
        escapeCsv(c.id),
        escapeCsv(c.member_name || c.full_name || ''),
        escapeCsv(c.phone || ''),
        escapeCsv(c.amount),
        escapeCsv(c.status),
        escapeCsv(c.provider_reference || ''),
        escapeCsv(c.created_at)
      ]);
      fileName = 'cotisations_finances.csv';
    } else if (role === 'programme' || role === 'activites') {
      headers = ['Titre', 'Date', 'Lieu', 'Inscrits', 'Description', 'Statut'];
      rowsToExport = events.map(e => [
        escapeCsv(e.title),
        escapeCsv(e.event_date || e.date),
        escapeCsv(e.location),
        escapeCsv(e.registered || 0),
        escapeCsv(e.description),
        escapeCsv(e.status)
      ]);
      fileName = 'evenements_programme.csv';
    } else if (role === 'communication') {
      headers = ['Titre', 'Auteur', 'Date publication', 'Catégorie', 'Statut'];
      rowsToExport = articles.map(a => [
        escapeCsv(a.title),
        escapeCsv(a.author || ''),
        escapeCsv(a.date || a.published_at || a.created_at),
        escapeCsv(a.category || ''),
        escapeCsv(a.status || 'publié')
      ]);
      fileName = 'articles_communication.csv';
    } else if (role === 'secretariat') {
      headers = ['Nom complet', 'Email', 'Téléphone', 'Statut', 'Genre', 'Commune', 'Date inscription'];
      rowsToExport = members.map(m => [
        escapeCsv(m.full_name),
        escapeCsv(m.email),
        escapeCsv(m.phone),
        escapeCsv(m.status),
        escapeCsv(m.sex),
        escapeCsv(m.commune),
        escapeCsv(m.created_at)
      ]);
      fileName = 'membres_secretariat.csv';
    } else {
      // superadmin / president / admin
      headers = ['Département', 'Metric', 'Valeur', 'Date export'];
      const nowStr = new Date().toLocaleDateString('fr-FR');
      rowsToExport = [
        [escapeCsv('Programme'), escapeCsv('Nombre Evénements'), escapeCsv(events.length), escapeCsv(nowStr)],
        [escapeCsv('Secrétariat'), escapeCsv('Nombre Membres'), escapeCsv(members.length), escapeCsv(nowStr)],
        [escapeCsv('Communication'), escapeCsv('Nombre Articles'), escapeCsv(articles.length), escapeCsv(nowStr)],
        [escapeCsv('Communication'), escapeCsv('Nombre Partenaires'), escapeCsv(partners.length), escapeCsv(nowStr)]
      ];
      fileName = 'export_general_admin.csv';
    }

    if (rowsToExport.length === 0) {
      alert("Aucune donnée à exporter.");
      return;
    }

    const csvContent = rowsToExport.map(row => row.join(';')).join('\r\n');
    const fullContent = '\uFEFF' + 'sep=;\r\n' + headers.join(';') + '\r\n' + csvContent;
    const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
  
  if (canViewCommunication && articles.length > 0) {
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

  if (canViewProgramme && events.length > 0) {
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

  if (canViewSecretariat && members.length > 0) {
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

  if (canViewLogistique && logisticsRequests.length > 0) {
    const latest = logisticsRequests[0];
    activitiesList.push({
      id: 'req-' + latest.id,
      type: 'logistics',
      title: 'Demande logistique',
      description: `Par ${latest.department_code || 'Département'} pour "${latest.event_title || 'Événement'}"`,
      time: new Date(latest.created_at).toLocaleDateString('fr-FR'),
      icon: Boxes,
      color: '#E28743',
      timestamp: new Date(latest.created_at).getTime()
    });
  }

  if (canViewFinances && contributions.length > 0) {
    const latest = contributions[0];
    activitiesList.push({
      id: 'con-' + latest.id,
      type: 'contribution',
      title: 'Cotisation reçue',
      description: `${latest.member_name || latest.full_name || 'Un membre'} - ${latest.amount} FCFA`,
      time: new Date(latest.created_at).toLocaleDateString('fr-FR'),
      icon: BarChart2,
      color: '#10B981',
      timestamp: new Date(latest.created_at).getTime()
    });
  }

  activitiesList.sort((a, b) => b.timestamp - a.timestamp);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0099DC]"></div>
      </div>
    );
  }

  const getCardsToRender = () => {
    if (isSuperadminOrPresident) {
      const paidSum = contributions.filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.amount || 0), 0);
      return [
        { title: 'Événements', value: events.length.toString(), icon: CalendarIcon, color: '#0099DC' },
        { title: 'U-Reports', value: members.length.toLocaleString('fr-FR'), icon: UsersIcon, color: '#6CC24A' },
        { title: 'Articles', value: articles.length.toString(), icon: FileTextIcon, color: '#8B5CF6' },
        { title: 'Cotisations', value: `${paidSum.toLocaleString('fr-FR')} FCFA`, icon: BarChart2, color: '#FFC107' }
      ];
    }

    switch (role) {
      case 'programme':
      case 'activites':
        const totalReg = events.reduce((sum, e) => sum + (e.registered || 0), 0);
        return [
          { title: 'Événements d\'Activités', value: events.length.toString(), icon: CalendarIcon, color: '#0099DC' },
          { title: 'Participants enregistrés', value: totalReg.toLocaleString('fr-FR'), icon: UsersIcon, color: '#8B5CF6' }
        ];
      case 'logistique':
        const totalQty = materials.reduce((sum, m) => sum + (m.available_quantity || 0), 0);
        return [
          { title: 'Matériaux en stock', value: materials.length.toString(), icon: Boxes, color: '#E28743' },
          { title: 'Quantité dispo', value: totalQty.toString(), icon: ClipboardList, color: '#0099DC' },
          { title: 'Demandes de réservations', value: logisticsRequests.length.toString(), icon: FileTextIcon, color: '#FFC107' }
        ];
      case 'finances':
        const paidSum = contributions.filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.amount || 0), 0);
        return [
          { title: 'Cotisations collectées', value: `${paidSum.toLocaleString('fr-FR')} FCFA`, icon: BarChart2, color: '#6CC24A' },
          { title: 'Transactions', value: contributions.length.toString(), icon: UsersIcon, color: '#8B5CF6' }
        ];
      case 'secretariat':
        return [
          { title: 'Membres U-Report', value: members.length.toLocaleString('fr-FR'), icon: UsersIcon, color: '#6CC24A' },
          { title: 'Abonnés Newsletter', value: subscribers.length.toString(), icon: Mail, color: '#8B5CF6' }
        ];
      case 'communication':
        return [
          { title: 'Articles publiés', value: articles.length.toString(), icon: FileTextIcon, color: '#8B5CF6' },
          { title: 'Partenaires', value: partners.length.toString(), icon: HandshakeIcon, color: '#FFC107' }
        ];
      default:
        return [];
    }
  };

  const cardsToRender = getCardsToRender();
  const gridColClass = cardsToRender.length === 1 
    ? 'grid-cols-1' 
    : cardsToRender.length === 2 
    ? 'grid-cols-1 sm:grid-cols-2' 
    : cardsToRender.length === 3 
    ? 'grid-cols-1 sm:grid-cols-3' 
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div className="space-y-6 pb-8">
      {/* Header Banner with Download Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-[#1E293B]">Dashboard Départemental</h1>
          <p className="text-sm text-gray-500 font-medium">Vue d'ensemble et rapports pour le rôle {role === 'superadmin' ? 'Super-Administrateur' : role}.</p>
        </div>
        <button 
          onClick={handleExportData} 
          className="flex items-center justify-center gap-2 bg-[#0099DC] hover:bg-[#007bb5] text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-[#0099DC]/10"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>Exporter les données (CSV)</span>
        </button>
      </div>

      {/* Row 1: Dynamic Stats Cards */}
      {cardsToRender.length > 0 && (
        <div className={`grid ${gridColClass} gap-4 sm:gap-6`}>
          {cardsToRender.map((card, idx) => (
            <StatCard
              key={idx}
              title={card.title}
              value={card.value}
              change={0}
              icon={card.icon}
              color={card.color}
              delay={idx * 0.1} 
            />
          ))}
        </div>
      )}

      {/* Row 2: Chart & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isSuperadminOrPresident && (
          <div className="lg:col-span-2">
            <ImpactChart data={chartData} />
          </div>
        )}
        <div className={isSuperadminOrPresident ? "lg:col-span-1" : "lg:col-span-3"}>
          <QuickActions />
        </div>
      </div>

      {/* Row 3: Events & Activity Feed */}
      {(canViewProgramme || activitiesList.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {canViewProgramme && events.length > 0 ? (
            <div className={activitiesList.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}>
              <RecentEvents events={events.slice(0, 5)} />
            </div>
          ) : (
            role === 'logistique' && materials.length > 0 && (
              <div className={activitiesList.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-bold text-[#1E293B] mb-4">Aperçu Matériel Récent</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 text-xs uppercase text-gray-400 font-semibold">
                          <th className="py-2">Matériel</th>
                          <th className="py-2">Total</th>
                          <th className="py-2">Disponible</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materials.slice(0, 5).map(m => (
                          <tr key={m.id} className="border-b border-gray-50 text-sm">
                            <td className="py-3 font-semibold text-[#1E293B]">{m.name}</td>
                            <td className="py-3 text-gray-500">{m.total_quantity}</td>
                            <td className="py-3 font-bold text-[#6CC24A]">{m.available_quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          )}
          {activitiesList.length > 0 && (
            <div className={(canViewProgramme && events.length > 0) || (role === 'logistique' && materials.length > 0) ? "lg:col-span-1" : "lg:col-span-3"}>
              <ActivityFeed activities={activitiesList} />
            </div>
          )}
        </div>
      )}

      {/* Row 4: Articles & Inscriptions */}
      {(canViewCommunication || canViewSecretariat) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {canViewCommunication && articles.length > 0 && (
            <div className={!canViewSecretariat || members.length === 0 ? "lg:col-span-2" : ""}>
              <RecentArticles articles={articles.slice(0, 4)} />
            </div>
          )}
          {canViewSecretariat && members.length > 0 && (
            <div className={!canViewCommunication || articles.length === 0 ? "lg:col-span-2" : ""}>
              <RecentInscriptions members={members.slice(0, 6)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
