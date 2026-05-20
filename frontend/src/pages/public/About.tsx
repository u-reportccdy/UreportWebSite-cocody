import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Shield, Users, Megaphone } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { fetchTeamMembers } from '../../services/content.service';

export function About() {
  const [team, setTeam] = useState<any[]>([]);

  useEffect(() => {
    fetchTeamMembers().then(rows => setTeam(rows || [])).catch(err => console.error('Erreur chargement équipe:', err));
  }, []);

  const bureau = useMemo(() => team.filter(member => member.team_type === 'bureau' && member.active), [team]);
  const devs = useMemo(() => team.filter(member => member.team_type === 'developer' && member.active), [team]);

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="relative py-24 bg-ureport-light overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-ureport-blue/10 rounded-full blur-3xl"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-ureport-dark mb-6">À propos de <span className="text-ureport-blue">U-Report Cocody</span></h1>
            <p className="text-xl text-gray-600 leading-relaxed">Détachement officiel de U-Report Côte d'Ivoire, notre communauté rassemble des jeunes engagés pour le développement de Cocody.</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Card className="p-8 h-full bg-gradient-to-br from-white to-blue-50 border-blue-100">
              <Target className="w-12 h-12 text-ureport-blue mb-6" />
              <h2 className="text-2xl font-heading font-bold text-ureport-dark mb-4">Notre Mission</h2>
              <p className="text-gray-600 leading-relaxed">Donner aux jeunes les moyens de s'exprimer et de mener des actions concrètes dans leurs quartiers.</p>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            <Card className="p-8 h-full bg-gradient-to-br from-white to-orange-50 border-orange-100">
              <Shield className="w-12 h-12 text-ureport-gold mb-6" />
              <h2 className="text-2xl font-heading font-bold text-ureport-dark mb-4">Notre Vision</h2>
              <p className="text-gray-600 leading-relaxed">Une commune où chaque jeune devient un acteur de changement reconnu et valorisé.</p>
            </Card>
          </motion.div>
        </div>
      </div>

      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-ureport-dark mb-4">Comment ça marche ?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Le concept U-Report repose sur trois piliers fondamentaux.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center"><div className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-ureport-blue"><Megaphone className="w-10 h-10" /></div><h3 className="text-xl font-bold mb-3">1. S'exprimer</h3><p className="text-gray-600">Participez à nos sondages.</p></div>
            <div className="text-center"><div className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-ureport-gold"><Users className="w-10 h-10" /></div><h3 className="text-xl font-bold mb-3">2. Se réunir</h3><p className="text-gray-600">Rejoignez nos rencontres et ateliers.</p></div>
            <div className="text-center"><div className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-green-500"><Target className="w-10 h-10" /></div><h3 className="text-xl font-bold mb-3">3. Agir</h3><p className="text-gray-600">Passez à l'action sur le terrain.</p></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-14">
        <section>
          <h2 className="text-3xl font-heading font-bold text-ureport-dark mb-6">Notre Bureau</h2>
          {bureau.length === 0 && <p className="text-sm text-gray-500">Aucun membre du bureau publié.</p>}
          {bureau.length > 0 && bureau.length < 5 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {bureau.map(member => (
                <Card key={member.id} className="p-6 text-center">
                  <img src={member.photo_url || 'https://placehold.co/200x200'} alt={member.full_name} className="w-24 h-24 rounded-full object-cover mx-auto mb-3" />
                  <h3 className="font-bold text-lg text-[#1E293B]">{member.full_name}</h3>
                  <p className="text-sm text-[#0099DC] font-semibold">{member.role}</p>
                  {member.bio && <p className="text-sm text-gray-600 mt-2">{member.bio}</p>}
                </Card>
              ))}
            </div>
          )}
          {bureau.length >= 5 && (
            <div className="overflow-hidden">
              <motion.div
                animate={{ x: ['0%', '-50%'] }}
                transition={{ repeat: Infinity, ease: 'linear', duration: 28 }}
                className="flex gap-6 w-max py-2">
                {[...bureau, ...bureau].map((member, index) => (
                  <Card key={`${member.id}-${index}`} className="p-6 text-center w-[280px] shrink-0">
                    <img src={member.photo_url || 'https://placehold.co/200x200'} alt={member.full_name} className="w-24 h-24 rounded-full object-cover mx-auto mb-3" />
                    <h3 className="font-bold text-lg text-[#1E293B]">{member.full_name}</h3>
                    <p className="text-sm text-[#0099DC] font-semibold">{member.role}</p>
                  </Card>
                ))}
              </motion.div>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-3xl font-heading font-bold text-ureport-dark mb-6">Développement de l'application</h2>
          {devs.length === 0 && <p className="text-sm text-gray-500">Aucun développeur publié.</p>}
          {devs.length > 0 && devs.length < 5 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {devs.map(member => (
                <Card key={member.id} className="p-6 text-center">
                  <img src={member.photo_url || 'https://placehold.co/200x200'} alt={member.full_name} className="w-24 h-24 rounded-full object-cover mx-auto mb-3" />
                  <h3 className="font-bold text-lg text-[#1E293B]">{member.full_name}</h3>
                  <p className="text-sm text-[#0099DC] font-semibold">{member.role}</p>
                  {member.bio && <p className="text-sm text-gray-600 mt-2">{member.bio}</p>}
                </Card>
              ))}
            </div>
          )}
          {devs.length >= 5 && (
            <div className="overflow-hidden">
              <motion.div
                animate={{ x: ['0%', '-50%'] }}
                transition={{ repeat: Infinity, ease: 'linear', duration: 28 }}
                className="flex gap-6 w-max py-2">
                {[...devs, ...devs].map((member, index) => (
                  <Card key={`${member.id}-${index}`} className="p-6 text-center w-[280px] shrink-0">
                    <img src={member.photo_url || 'https://placehold.co/200x200'} alt={member.full_name} className="w-24 h-24 rounded-full object-cover mx-auto mb-3" />
                    <h3 className="font-bold text-lg text-[#1E293B]">{member.full_name}</h3>
                    <p className="text-sm text-[#0099DC] font-semibold">{member.role}</p>
                  </Card>
                ))}
              </motion.div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
