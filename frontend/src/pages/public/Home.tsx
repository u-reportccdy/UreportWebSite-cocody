import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ArrowRight, Calendar, Users, Heart, Star } from 'lucide-react';
import { Link } from '../../components/public/Link';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import {
  stats,
  events,
  articles,
  partners,
  testimonials } from
'../../data/mockData';
import { RegistrationModal } from '../../components/public/RegistrationModal';
import { JoinModal } from '../../components/public/JoinModal';
const containerVariants: Variants = {
  hidden: {
    opacity: 0
  },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};
const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24
    }
  }
};
export function Home() {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const upcomingEvents = events.
  filter((e) => e.status === 'upcoming').
  slice(0, 3);
  const recentArticles = articles.slice(0, 3);
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-20 pb-32">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1529390079861-591de354faf5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
            alt="Jeunes de Cocody"
            className="w-full h-full object-cover" />
          
          <div className="absolute inset-0 bg-gradient-to-r from-ureport-dark/90 via-ureport-dark/70 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <motion.div
            initial={{
              opacity: 0,
              y: 30
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              duration: 0.8,
              ease: 'easeOut'
            }}
            className="max-w-3xl">
            
            <span className="inline-block py-1 px-3 rounded-full bg-ureport-gold/20 text-ureport-gold font-semibold text-sm mb-6 border border-ureport-gold/30 backdrop-blur-sm">
              La voix de la jeunesse Ivoirienne
            </span>
            <h1 className="text-5xl md:text-7xl font-heading font-extrabold text-white mb-6 leading-tight">
              Engagez-vous pour <br />
              <span className="text-ureport-blue">Cocody</span>
            </h1>
            <p className="text-xl text-gray-200 mb-10 leading-relaxed max-w-2xl">
              Rejoignez la plus grande communauté de jeunes engagés. Participez
              à nos actions, donnez votre avis et contribuez au développement de
              notre commune.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8" onClick={() => setIsJoinModalOpen(true)}>
                Nous rejoindre maintenant
              </Button>
              <Link href="/events">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-lg px-8 bg-white/10 text-white border-white/30 hover:bg-white/20">
                  
                  Découvrir les actions
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Floating Stats Card */}
        <motion.div
          initial={{
            opacity: 0,
            y: 50
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: 0.4,
            duration: 0.8
          }}
          className="absolute -bottom-16 left-0 right-0 z-20 px-4">
          
          <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl p-8 grid grid-cols-2 md:grid-cols-4 gap-8 border border-gray-100">
            {stats.map((stat) =>
            <div key={stat.id} className="text-center">
                <div className="text-3xl md:text-4xl font-heading font-bold text-ureport-blue mb-2">
                  {stat.value}
                </div>
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* Spacer for floating card */}
      <div className="h-32"></div>

      {/* Upcoming Events Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="text-ureport-gold font-bold tracking-wider uppercase text-sm mb-2 block">
                Agir ensemble
              </span>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-ureport-dark">
                Événements à venir
              </h2>
            </div>
            <Link
              href="/events"
              className="hidden md:flex items-center text-ureport-blue font-semibold hover:text-[#158bb8] transition-colors">
              
              Voir tout <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{
              once: true,
              margin: '-100px'
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {upcomingEvents.map((event) =>
            <motion.div key={event.id} variants={itemVariants}>
                <Card hover className="h-full flex flex-col">
                  <div className="relative h-48 overflow-hidden">
                    <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                  
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-ureport-blue">
                      {event.category}
                    </div>
                  </div>
                  <div className="p-6 flex-grow flex flex-col">
                    <div className="flex items-center text-sm text-gray-500 mb-3 gap-4">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 text-ureport-gold" />{' '}
                        {new Date(event.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short'
                      })}
                      </span>
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1 text-ureport-blue" />{' '}
                        {event.registered}/{event.spots}
                      </span>
                    </div>
                    <h3 className="text-xl font-heading font-bold text-ureport-dark mb-3 line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="text-gray-600 mb-6 line-clamp-2 text-sm flex-grow">
                      {event.description}
                    </p>
                    <div className="flex gap-2 mt-auto">
                      <Link href={`/events/${event.id}`} className="flex-1">
                        <Button fullWidth variant="ghost" className="text-gray-500 hover:text-ureport-blue hover:bg-transparent px-0 font-medium">
                          Détails
                        </Button>
                      </Link>
                      <Button fullWidth variant="outline" className="group flex-[2]" onClick={() => setSelectedEvent(event)}>
                        S'inscrire{' '}
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </motion.div>

          <div className="mt-8 text-center md:hidden">
            <Link href="/events">
              <Button variant="ghost">
                Voir tous les événements <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Impact/About Section */}
      <section className="py-20 bg-ureport-dark text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-ureport-blue rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-ureport-gold rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{
                opacity: 0,
                x: -50
              }}
              whileInView={{
                opacity: 1,
                x: 0
              }}
              viewport={{
                once: true
              }}
              transition={{
                duration: 0.8
              }}>
              
              <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6 leading-tight">
                Plus qu'une communauté, <br />
                <span className="text-ureport-gold">un mouvement.</span>
              </h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                U-Report est une plateforme sociale développée par l'UNICEF pour
                engager les jeunes et les communautés. À Cocody, nous utilisons
                cet outil pour identifier les problèmes locaux, proposer des
                solutions et agir concrètement sur le terrain.
              </p>
              <ul className="space-y-4 mb-10">
                <li className="flex items-start">
                  <div className="bg-ureport-blue/20 p-2 rounded-lg mr-4 mt-1">
                    <Heart className="w-5 h-5 text-ureport-blue" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Engagement Volontaire</h4>
                    <p className="text-gray-400 text-sm">
                      Des actions menées par et pour la communauté.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-ureport-gold/20 p-2 rounded-lg mr-4 mt-1">
                    <Users className="w-5 h-5 text-ureport-gold" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Inclusion Totale</h4>
                    <p className="text-gray-400 text-sm">
                      Chaque voix compte, peu importe le quartier d'origine.
                    </p>
                  </div>
                </li>
              </ul>
              <Link href="/about">
                <Button variant="primary" size="lg">
                  Découvrir notre histoire
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{
                opacity: 0,
                scale: 0.9
              }}
              whileInView={{
                opacity: 1,
                scale: 1
              }}
              viewport={{
                once: true
              }}
              transition={{
                duration: 0.8
              }}
              className="relative">
              
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10">
                <img
                  src="/images/photo.jpg"
                  alt="Communauté U-Report"
                  className="w-full h-auto" />
                
                <div className="absolute inset-0 bg-gradient-to-t from-ureport-dark/80 to-transparent flex items-end p-8">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 w-full">
                    <div className="flex items-center gap-4 mb-2">
                      <Star className="w-6 h-6 text-ureport-gold fill-ureport-gold" />
                      <Star className="w-6 h-6 text-ureport-gold fill-ureport-gold" />
                      <Star className="w-6 h-6 text-ureport-gold fill-ureport-gold" />
                      <Star className="w-6 h-6 text-ureport-gold fill-ureport-gold" />
                      <Star className="w-6 h-6 text-ureport-gold fill-ureport-gold" />
                    </div>
                    <p className="text-white font-medium italic">
                      "Une expérience qui a changé ma vision de l'engagement
                      citoyen."
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Latest Articles */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-ureport-blue font-bold tracking-wider uppercase text-sm mb-2 block">
              Actualités
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-ureport-dark mb-4">
              Dernières nouvelles
            </h2>
            <p className="text-gray-600">
              Restez informé des dernières actions, témoignages et opportunités
              au sein de notre communauté.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{
              once: true
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {recentArticles.map((article) =>
            <motion.div key={article.id} variants={itemVariants}>
                <Link
                href={`/articles/${article.id}`}
                className="group block h-full">
                
                  <Card
                  hover
                  className="h-full flex flex-col border-none shadow-md bg-gray-50 group-hover:bg-white transition-colors">
                  
                    <div className="h-48 overflow-hidden rounded-t-2xl">
                      <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    
                    </div>
                    <div className="p-6 flex-grow flex flex-col">
                      <div className="text-sm text-ureport-blue font-bold mb-3">
                        {article.category}
                      </div>
                      <h3 className="text-xl font-heading font-bold text-ureport-dark mb-3 group-hover:text-ureport-blue transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-3 text-sm flex-grow">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 pt-4 border-t border-gray-200">
                        <span>{article.date}</span>
                        <span className="mx-2">•</span>
                        <span>Par {article.author}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            )}
          </motion.div>

          <div className="mt-12 text-center">
            <Link href="/articles">
              <Button variant="secondary">Lire tous les articles</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-16 bg-ureport-light/50 border-y border-ureport-blue/10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <p className="text-center text-sm font-bold text-gray-500 uppercase tracking-widest">
            Ils nous font confiance
          </p>
        </div>
        
        <div className="relative w-full overflow-hidden flex">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              repeat: Infinity,
              ease: "linear",
              duration: 20
            }}
            className="flex items-center gap-16 md:gap-32 px-8 w-max opacity-60 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-500"
          >
            {[...partners, ...partners].map((partner, index) => (
              <img
                key={`${partner.id}-${index}`}
                src={partner.logo}
                alt={partner.name}
                className="h-12 md:h-16 w-32 object-contain shrink-0"
              />
            ))}
          </motion.div>
        </div>
      </section>

      <RegistrationModal 
        isOpen={!!selectedEvent} 
        onClose={() => setSelectedEvent(null)} 
        eventTitle={selectedEvent?.title || ''} 
      />

      <JoinModal 
        isOpen={isJoinModalOpen} 
        onClose={() => setIsJoinModalOpen(false)} 
      />
    </div>);

}