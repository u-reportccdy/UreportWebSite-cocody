import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Search, Filter } from 'lucide-react';
import { Link } from '../../components/public/Link';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { events } from '../../data/mockData';
import { RegistrationModal } from '../../components/public/RegistrationModal';
export function Events() {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const filteredEvents = events.filter((event) => {
    const matchesFilter = filter === 'all' || event.status === filter;
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });
  return (
    <div className="min-h-screen bg-gray-50 pb-20" translate="no">
      {/* Header */}
      <div className="bg-ureport-dark text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-ureport-blue rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-ureport-gold rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
            Événements & Actions
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Découvrez nos prochaines activités et rejoignez-nous sur le terrain
            pour faire la différence à Cocody.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        {/* Filters and Search */}
        <Card className="p-4 md:p-6 mb-12 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setFilter('upcoming')}
              className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-semibold transition-all ${filter === 'upcoming' ? 'bg-white text-ureport-blue shadow-sm' : 'text-gray-600 hover:text-ureport-dark'}`}>

              À venir
            </button>
            <button
              onClick={() => setFilter('past')}
              className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-semibold transition-all ${filter === 'past' ? 'bg-white text-ureport-blue shadow-sm' : 'text-gray-600 hover:text-ureport-dark'}`}>

              Passés
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-semibold transition-all ${filter === 'all' ? 'bg-white text-ureport-blue shadow-sm' : 'text-gray-600 hover:text-ureport-dark'}`}>

              Tous
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher un événement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-ureport-blue focus:border-transparent" />

          </div>
        </Card>

        {/* Events Grid */}
        {filteredEvents.length > 0 ?
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

            {filteredEvents.map((event) =>
              <motion.div
                key={event.id}
                layout
                initial={{
                  opacity: 0,
                  scale: 0.9
                }}
                animate={{
                  opacity: 1,
                  scale: 1
                }}
                exit={{
                  opacity: 0,
                  scale: 0.9
                }}
                transition={{
                  duration: 0.3
                }}>

                <Card hover className="h-full flex flex-col">
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />

                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-ureport-blue">
                      {event.category}
                    </div>
                    {event.status === 'past' &&
                      <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center backdrop-blur-[2px]">
                        <span className="bg-gray-900/80 text-white px-4 py-2 rounded-full font-bold tracking-widest uppercase text-sm">
                          Terminé
                        </span>
                      </div>
                    }
                  </div>
                  <div className="p-6 flex-grow flex flex-col">
                    <h3 className="text-xl font-heading font-bold text-ureport-dark mb-4 line-clamp-2">
                      {event.title}
                    </h3>

                    <div className="space-y-3 mb-6 text-sm text-gray-600 flex-grow">
                      <div className="flex items-start">
                        <Calendar className="w-5 h-5 mr-3 text-ureport-blue shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-900">
                            {new Date(event.date).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                          <p>{event.time}</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <MapPin className="w-5 h-5 mr-3 text-ureport-gold shrink-0" />
                        <p>{event.location}</p>
                      </div>
                      <div className="flex items-center">
                        <Users className="w-5 h-5 mr-3 text-green-500 shrink-0" />
                        <p>
                          {event.registered} / {event.capacity} inscrits
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-auto">
                      <Link href={`/events/${event.id}`} className={event.status === 'past' ? "flex-1" : "flex-1"}>
                        <Button fullWidth variant={event.status === 'past' ? 'outline' : 'ghost'} className={event.status === 'past' ? "" : "text-gray-500 hover:text-ureport-blue hover:bg-transparent px-0 font-medium"}>
                          {event.status === 'past' ? 'Voir le résumé' : 'Détails'}
                        </Button>
                      </Link>
                      {event.status !== 'past' && (
                        <Button fullWidth variant="primary" className="flex-[2]" onClick={() => setSelectedEvent(event)}>
                          S'inscrire
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </motion.div> :

          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Aucun événement trouvé
            </h3>
            <p className="text-gray-500">
              Essayez de modifier vos filtres ou votre recherche.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => {
                setFilter('all');
                setSearchQuery('');
              }}>

              Réinitialiser les filtres
            </Button>
          </div>
        }
      </div>

      <RegistrationModal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        eventTitle={selectedEvent?.title || ''}
      />
    </div>);

}