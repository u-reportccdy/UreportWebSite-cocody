import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ArrowRight, Calendar, Users, Heart, Star, Loader2 } from 'lucide-react';
import { Link } from '../../components/public/Link';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { fetchStats } from '../../services/stats.service';
import { fetchEvents } from '../../services/event.service';
import { fetchArticles } from '../../services/article.service';
import { fetchPartners, fetchTestimonials, fetchSiteSettings } from '../../services/content.service';
import { RegistrationModal } from '../../components/public/RegistrationModal';
import { JoinModal } from '../../components/public/JoinModal';
import { stripRichText } from '../../utils/richText';
import { loadMemberSession, subscribeMemberSessionChange } from '../../utils/memberSession';



const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

export function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasMemberSession, setHasMemberSession] = useState<boolean>(() => !!loadMemberSession());
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [stats, setStats] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [siteSettings, setSiteSettings] = useState<any>({
    hero_title: 'Engagez-vous pour Cocody',
    hero_subtitle: 'La voix de la jeunesse Ivoirienne',
    hero_description: 'Rejoignez la plus grande communauté de jeunes engagés. Participez à nos actions, donnez votre avis et contribuez au développement de notre commune.',
    hero_image_url: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
    about_title: "Plus qu'une communauté, un mouvement.",
    about_description: "U-Report est une plateforme sociale développée par l'UNICEF pour engager les jeunes et les communautés. À Cocody, nous utilisons cet outil pour identifier les problèmes locaux, proposer des solutions et agir concrètement sur le terrain."
  });

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [statsData, eventsData, articlesData, partnersData, testimonialsData, settingsData] = await Promise.all([
          fetchStats(),
          fetchEvents(),
          fetchArticles(),
          fetchPartners(),
          fetchTestimonials(),
          fetchSiteSettings().catch(err => {
            console.error('Erreur chargement settings, fallback par defaut:', err);
            return null;
          })
        ]);

        setStats([
          { id: 'members', label: 'U-Reporters Actifs', value: `${statsData.ureporters_active || 0}+` },
          { id: 'events', label: 'Actions organisées', value: `${statsData.events_organized || 0}+` },
          { id: 'partners', label: 'Partenaires locaux', value: `${statsData.partners_local || 0}+` },
        ]);
        
        setEvents(eventsData.map((event: any) => ({
          ...event,
          date: event.date || event.event_date,
          image: event.image || event.image_url,
          spots: event.spots || event.capacity,
        })));

        setArticles(articlesData.map((article: any) => ({
          ...article,
          image: article.image || article.image_url,
          date: article.date || article.published_at || article.created_at,
        })));

        setPartners(partnersData.map((partner: any) => ({
          ...partner,
          logo: partner.logo || partner.logo_url,
        })));

        setTestimonials(testimonialsData.filter((t: any) => t.status === 'published'));

        if (settingsData) {
          setSiteSettings({
            hero_title: settingsData.hero_title || 'Engagez-vous pour Cocody',
            hero_subtitle: settingsData.hero_subtitle || 'La voix de la jeunesse Ivoirienne',
            hero_description: settingsData.hero_description || 'Rejoignez la plus grande communauté de jeunes engagés. Participez à nos actions, donnez votre avis et contribuez au développement de notre commune.',
            hero_image_url: settingsData.hero_image_url || 'https://images.unsplash.com/photo-1529390079861-591de354faf5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
            about_title: settingsData.about_title || "Plus qu'une communauté, un mouvement.",
            about_description: settingsData.about_description || "U-Report est une plateforme sociale développée par l'UNICEF pour engager les jeunes et les communautés. À Cocody, nous utilisons cet outil pour identifier les problèmes locaux, proposer des solutions et agir concrètement sur le terrain."
          });
        }
      } catch (err) {
        console.error('Erreur chargement accueil:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadHomeData();
  }, []);

  useEffect(() => {
    const onSessionChange = () => {
      setHasMemberSession(!!loadMemberSession());
    };
    onSessionChange();
    return subscribeMemberSessionChange(onSessionChange);
  }, []);

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const timer = setTimeout(() => {
      setActiveTestimonialIndex(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearTimeout(timer);
  }, [activeTestimonialIndex, testimonials.length]);

  const parseHeroImages = (raw: string | null | undefined): string[] => {
    if (!raw) return [];
    const v = String(raw).trim();
    if (!v) return [];
    if (v.startsWith('[')) {
      try {
        const arr = JSON.parse(v);
        if (Array.isArray(arr)) return arr.filter(item => typeof item === 'string' && item.trim());
      } catch {
        return [v];
      }
    }
    return [v];
  };

  const heroImages = parseHeroImages(siteSettings.hero_image_url);

  useEffect(() => {
    setActiveHeroIndex(0);
  }, [siteSettings.hero_image_url]);

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveHeroIndex(prev => (prev + 1) % heroImages.length);
    }, 9500);
    return () => window.clearInterval(timer);
  }, [heroImages.length]);

  const upcomingEvents = events.filter((e) => e.status === 'upcoming').slice(0, 3);
  const upcomingEventsMobile = upcomingEvents.slice(0, 1);
  const recentArticles = articles.slice(0, 3);
  const recentArticlesMobile = recentArticles.slice(0, 1);

  const formatHeroTitle = (title: string) => {
    if (!title) return null;
    const words = title.split(' ');
    if (words.length <= 1) return title;
    const lastWord = words.pop();
    return (
      <>
        {words.join(' ')} <span className="text-ureport-blue">{lastWord}</span>
      </>
    );
  };

  const formatAboutTitle = (title: string) => {
    if (!title) return null;
    const words = title.split(', ');
    if (words.length <= 1) return title;
    const secondPart = words.pop();
    return (
      <>
        {words.join(', ')}, <br />
        <span className="text-ureport-gold">{secondPart}</span>
      </>
    );
  };

  const formatPartnerWebsite = (url: string) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#0099DC] animate-spin mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">Chargement d'U-Report Cocody...</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-20 pb-32">
        <div className="absolute inset-0 z-0">
          <AnimatePresence initial={false}>
            <motion.img
              key={heroImages[activeHeroIndex] || heroImages[0] || siteSettings.hero_image_url}
              src={heroImages[activeHeroIndex] || heroImages[0] || siteSettings.hero_image_url}
              alt="Jeunes de Cocody"
              initial={{ opacity: 0, scale: 1.04, x: 12 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 1.01, x: -8 }}
              transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 w-full h-full object-cover will-change-transform" 
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-r from-ureport-dark/90 via-ureport-dark/70 to-transparent" />
          {heroImages.length > 1 && (
            <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2">
              {heroImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setActiveHeroIndex(index)}
                  className={`h-2.5 rounded-full transition-all ${index === activeHeroIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/45 hover:bg-white/70'}`}
                  aria-label={`Afficher l'image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="max-w-3xl"
          >
            <span className="inline-block py-1 px-3 rounded-full bg-ureport-gold/20 text-ureport-gold font-semibold text-sm mb-6 border border-ureport-gold/30 backdrop-blur-sm">
              {siteSettings.hero_subtitle}
            </span>
            <h1 className="text-5xl md:text-7xl font-heading font-extrabold text-white mb-6 leading-tight">
              {formatHeroTitle(siteSettings.hero_title)}
            </h1>
            <p className="text-xl text-gray-200 mb-10 leading-relaxed max-w-2xl">
              {siteSettings.hero_description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {!hasMemberSession && (
                <Button size="lg" className="w-full sm:w-auto text-lg px-8" onClick={() => setIsJoinModalOpen(true)}>
                  Nous rejoindre maintenant
                </Button>
              )}
              <Link href="/events">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 bg-white/10 text-white border-white/30 hover:bg-white/20">
                  Découvrir les actions
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Floating Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="absolute -bottom-16 left-0 right-0 z-20 px-4"
        >
          <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl p-6 sm:p-8 grid grid-cols-3 gap-4 sm:gap-8 border border-gray-100">
            {stats.map((stat) => (
              <div key={stat.id} className="text-center">
                <div className="text-3xl md:text-4xl font-heading font-bold text-ureport-blue mb-2">
                  {stat.value}
                </div>
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
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
            <Link href="/events" className="hidden md:flex items-center text-ureport-blue font-semibold hover:text-[#158bb8] transition-colors">
              Voir tout <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 gap-8 md:hidden"
          >
            {upcomingEventsMobile.map((event) => (
              <motion.div key={event.id} variants={itemVariants}>
                <Card hover className="h-full flex flex-col">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" 
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-ureport-blue">
                      {event.category}
                    </div>
                  </div>
                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex items-center text-sm text-gray-500 mb-3 gap-4">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-ureport-gold" />
                          {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1 text-ureport-blue" />
                          {event.registered || 0}/{event.spots}
                        </span>
                      </div>
                      <h3 className="text-xl font-heading font-bold text-ureport-dark mb-3 line-clamp-2">
                        {event.title}
                      </h3>
                      <p className="text-gray-600 mb-6 line-clamp-2 text-sm">
                        {stripRichText(event.description || '')}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-auto">
                      <Link href={`/events/${event.id}`} className="flex-1">
                        <Button fullWidth variant="ghost" className="text-gray-500 hover:text-ureport-blue hover:bg-transparent px-0 font-medium">
                          Détails
                        </Button>
                      </Link>
                      <Button fullWidth variant="outline" className="group flex-[2]" onClick={() => setSelectedEvent(event)}>
                        S'inscrire
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            className="hidden md:grid md:grid-cols-3 gap-8"
          >
            {upcomingEvents.map((event) => (
              <motion.div key={event.id} variants={itemVariants}>
                <Card hover className="h-full flex flex-col">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" 
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-ureport-blue">
                      {event.category}
                    </div>
                  </div>
                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex items-center text-sm text-gray-500 mb-3 gap-4">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-ureport-gold" />
                          {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1 text-ureport-blue" />
                          {event.registered || 0}/{event.spots}
                        </span>
                      </div>
                      <h3 className="text-xl font-heading font-bold text-ureport-dark mb-3 line-clamp-2">
                        {event.title}
                      </h3>
                      <p className="text-gray-600 mb-6 line-clamp-2 text-sm">
                        {stripRichText(event.description || '')}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-auto">
                      <Link href={`/events/${event.id}`} className="flex-1">
                        <Button fullWidth variant="ghost" className="text-gray-500 hover:text-ureport-blue hover:bg-transparent px-0 font-medium">
                          Détails
                        </Button>
                      </Link>
                      <Button fullWidth variant="outline" className="group flex-[2]" onClick={() => setSelectedEvent(event)}>
                        S'inscrire
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
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
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6 leading-tight">
                {formatAboutTitle(siteSettings.about_title)}
              </h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                {siteSettings.about_description}
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

            {/* Dynamic Testimonials Section */}
            {testimonials.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative flex justify-center"
              >
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 aspect-[3/4] w-full max-w-sm bg-gray-900 group">
                  <AnimatePresence>
                    <motion.div
                      key={activeTestimonialIndex}
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -40 }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                      className="absolute inset-0"
                    >
                      <img
                        src={testimonials[activeTestimonialIndex]?.avatar || testimonials[activeTestimonialIndex]?.avatar_url || "https://images.unsplash.com/photo-1529390079861-591de354faf5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"}
                        alt={testimonials[activeTestimonialIndex]?.full_name || "Communauté U-Report"}
                        className="w-full h-full object-cover object-top opacity-70" 
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-ureport-dark via-ureport-dark/30 to-transparent flex items-end p-6">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 w-full text-white pointer-events-none transition-transform duration-300 group-hover:scale-[1.02]">
                          <div className="flex items-center gap-4 mb-3">
                            <img 
                              src={testimonials[activeTestimonialIndex]?.avatar || testimonials[activeTestimonialIndex]?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonials[activeTestimonialIndex]?.full_name || 'U')}&background=0099DC&color=fff`} 
                              alt={testimonials[activeTestimonialIndex]?.full_name} 
                              className="w-12 h-12 rounded-full object-cover border-2 border-white/25"
                            />
                            <div className="text-left">
                              <h5 className="font-bold text-white text-base leading-tight">{testimonials[activeTestimonialIndex]?.full_name}</h5>
                              <p className="text-white/70 text-xs">{testimonials[activeTestimonialIndex]?.role}</p>
                            </div>
                          </div>
                          <p className="text-white text-sm font-medium italic leading-relaxed text-left">
                            "{testimonials[activeTestimonialIndex]?.content}"
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Invisible Navigation Zones */}
                  {testimonials.length > 1 && (
                    <>
                      <div 
                        className="absolute top-0 left-0 w-1/2 h-full z-10 cursor-pointer"
                        onClick={() => setActiveTestimonialIndex(prev => (prev - 1 + testimonials.length) % testimonials.length)}
                        title="Témoignage précédent"
                      />
                      <div 
                        className="absolute top-0 right-0 w-1/2 h-full z-10 cursor-pointer"
                        onClick={() => setActiveTestimonialIndex(prev => (prev + 1) % testimonials.length)}
                        title="Témoignage suivant"
                      />
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Latest Articles Section */}
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
            viewport={{ once: true }}
            className="grid grid-cols-1 gap-8 md:hidden"
          >
            {recentArticlesMobile.map((article) => (
              <motion.div key={article.id} variants={itemVariants}>
                <Link href={`/articles/${article.id}`} className="group block h-full">
                  <Card hover className="h-full flex flex-col border-none shadow-md bg-gray-50 group-hover:bg-white transition-colors">
                    <div className="h-48 overflow-hidden rounded-t-2xl">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                    </div>
                    <div className="p-6 flex-grow flex flex-col justify-between">
                      <div>
                        <div className="text-sm text-ureport-blue font-bold mb-3">
                          {article.category}
                        </div>
                        <h3 className="text-xl font-heading font-bold text-ureport-dark mb-3 group-hover:text-ureport-blue transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-gray-600 mb-4 line-clamp-3 text-sm">
                          {stripRichText(article.excerpt || article.content)}
                        </p>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 pt-4 border-t border-gray-200 mt-auto">
                        <span>{new Date(article.date).toLocaleDateString('fr-FR')}</span>
                        <span className="mx-2">•</span>
                        <span>Par {article.author || 'U-Report'}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="hidden md:grid md:grid-cols-3 gap-8"
          >
            {recentArticles.map((article) => (
              <motion.div key={article.id} variants={itemVariants}>
                <Link href={`/articles/${article.id}`} className="group block h-full">
                  <Card hover className="h-full flex flex-col border-none shadow-md bg-gray-50 group-hover:bg-white transition-colors">
                    <div className="h-48 overflow-hidden rounded-t-2xl">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                    </div>
                    <div className="p-6 flex-grow flex flex-col justify-between">
                      <div>
                        <div className="text-sm text-ureport-blue font-bold mb-3">
                          {article.category}
                        </div>
                        <h3 className="text-xl font-heading font-bold text-ureport-dark mb-3 group-hover:text-ureport-blue transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-gray-600 mb-4 line-clamp-3 text-sm">
                          {stripRichText(article.excerpt || article.content)}
                        </p>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 pt-4 border-t border-gray-200 mt-auto">
                        <span>{new Date(article.date).toLocaleDateString('fr-FR')}</span>
                        <span className="mx-2">•</span>
                        <span>Par {article.author || 'U-Report'}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-12 text-center">
            <Link href="/articles">
              <Button variant="secondary">Lire tous les articles</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      {partners.length > 0 && (
        <section className="py-16 bg-ureport-light/50 border-y border-ureport-blue/10 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
            <p className="text-center text-sm font-bold text-gray-500 uppercase tracking-widest">
              Ils nous font confiance
            </p>
          </div>

          <div className="relative w-full overflow-hidden">
            {partners.length < 3 ? (
              <div className="flex flex-wrap items-center justify-center gap-12 md:gap-20 px-8 opacity-60 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-500">
                {partners.map((partner) => {
                  const href = formatPartnerWebsite(partner.website);

                  const content = (
                    <div className="w-32 h-12 md:h-16 flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform duration-300">
                      <img
                        src={partner.logo}
                        alt={partner.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  );

                  return href ? (
                    <a
                      key={partner.id}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Visiter le site de ${partner.name}`}
                    >
                      {content}
                    </a>
                  ) : (
                    <div key={partner.id}>{content}</div>
                  );
                })}
              </div>
            ) : (
              <div className="partners-marquee flex items-center w-max gap-12 md:gap-20 py-2 opacity-60 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-500">
                {[...partners, ...partners].map((partner, index) => {
                  const href = formatPartnerWebsite(partner.website);

                  const content = (
                    <div className="w-32 h-16 flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform duration-300">
                      <img
                        src={partner.logo}
                        alt={partner.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  );

                  return href ? (
                    <a
                      key={`${partner.id}-${index}`}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Visiter le site de ${partner.name}`}
                      className="shrink-0"
                    >
                      {content}
                    </a>
                  ) : (
                    <div key={`${partner.id}-${index}`} className="shrink-0">
                      {content}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      <RegistrationModal 
        isOpen={!!selectedEvent} 
        onClose={() => setSelectedEvent(null)} 
        eventId={selectedEvent?.id?.toString() || ''}
        eventTitle={selectedEvent?.title || ''} 
      />

      <JoinModal 
        isOpen={isJoinModalOpen} initialMode="register" 
        onClose={() => setIsJoinModalOpen(false)} 
        onSuccess={() => {
          setHasMemberSession(true);
        }}
      />
    </div>
  );
}


