import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Share2,
  ArrowLeft,
  CheckCircle } from
'lucide-react';
import { Link } from '../../components/public/Link';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { events } from '../../data/mockData';
export function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const event = events.find((e) => String(e.id) === id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  if (!event) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Événement introuvable</h2>
        <Link href="/events">
          <Button>Retour aux événements</Button>
        </Link>
      </div>);

  }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };
  const isUpcoming = event.status === 'upcoming';
  const isFull = event.registered >= (event.capacity || 0);
  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Hero Image */}
      <div className="h-[40vh] md:h-[50vh] relative">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover" />
        
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
        <div className="absolute top-6 left-4 sm:left-6 lg:left-8 z-10">
          <Link
            href="/events"
            className="inline-flex items-center text-white bg-black/30 hover:bg-black/50 backdrop-blur-md px-4 py-2 rounded-full transition-colors text-sm font-semibold">
            
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="p-8">
              <div className="flex gap-3 mb-4">
                <span className="bg-ureport-light text-ureport-blue px-3 py-1 rounded-full text-sm font-bold">
                  {event.category}
                </span>
                {!isUpcoming &&
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-bold">
                    Terminé
                  </span>
                }
              </div>

              <h1 className="text-3xl md:text-4xl font-heading font-bold text-ureport-dark mb-6">
                {event.title}
              </h1>

              <div className="prose prose-lg max-w-none text-gray-600">
                <div 
                  className="text-gray-800 leading-relaxed quill-content space-y-4"
                  dangerouslySetInnerHTML={{ __html: event.description || 'Aucune description disponible pour cet événement.' }}
                />
              </div>
            </Card>

            {/* If past event, show gallery preview */}
            {!isUpcoming &&
            <Card className="p-8">
                <h3 className="text-2xl font-heading font-bold mb-6">
                  Photos de l'événement
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) =>
                <div
                  key={i}
                  className="aspect-square rounded-xl overflow-hidden bg-gray-200">
                  
                      <img
                    src={`${event.image}?auto=format&fit=crop&w=400&q=80&sig=${i}`}
                    alt="Gallery"
                    className="w-full h-full object-cover" />
                  
                    </div>
                )}
                </div>
                <div className="mt-6 text-center">
                  <Link href="/gallery">
                    <Button variant="outline">Voir toute la galerie</Button>
                  </Link>
                </div>
              </Card>
            }
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <Card className="p-6">
              <h3 className="font-heading font-bold text-xl mb-6 border-b pb-4">
                Détails de l'événement
              </h3>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-ureport-light p-3 rounded-xl mr-4">
                    <Calendar className="w-6 h-6 text-ureport-blue" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Date</p>
                    <p className="text-gray-600">
                      {new Date(event.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-ureport-light p-3 rounded-xl mr-4">
                    <Clock className="w-6 h-6 text-ureport-blue" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Heure</p>
                    <p className="text-gray-600">{event.time}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-orange-50 p-3 rounded-xl mr-4">
                    <MapPin className="w-6 h-6 text-ureport-gold" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Lieu</p>
                    <p className="text-gray-600">{event.location}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-green-50 p-3 rounded-xl mr-4">
                    <Users className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="w-full">
                    <p className="font-bold text-gray-900">
                      Places disponibles
                    </p>
                    <div className="flex justify-between text-sm text-gray-600 mb-1 mt-1">
                      <span>{event.registered} inscrits</span>
                      <span>{event.capacity} total</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${isFull ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{
                          width: `${(event.registered / (event.capacity || 1)) * 100}%`
                        }}>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t flex justify-center">
                <button className="flex items-center text-gray-500 hover:text-ureport-blue transition-colors font-semibold">
                  <Share2 className="w-5 h-5 mr-2" /> Partager l'événement
                </button>
              </div>
            </Card>

            {/* Registration Form */}
            {isUpcoming &&
            <Card className="p-6 border-t-4 border-t-ureport-blue">
                {isSuccess ?
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.9
                }}
                animate={{
                  opacity: 1,
                  scale: 1
                }}
                className="text-center py-8">
                
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Inscription confirmée !
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Merci pour votre engagement. Vous recevrez un email avec
                      les détails.
                    </p>
                    <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setIsSuccess(false)}>
                  
                      Nouvelle inscription
                    </Button>
                  </motion.div> :
              isFull ?
              <div className="text-center py-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Complet
                    </h3>
                    <p className="text-gray-600">
                      Désolé, il n'y a plus de places disponibles pour cet
                      événement.
                    </p>
                  </div> :

              <>
                    <h3 className="font-heading font-bold text-2xl mb-2">
                      S'inscrire
                    </h3>
                    <p className="text-gray-500 text-sm mb-6">
                      Remplissez le formulaire ci-dessous pour confirmer votre
                      présence.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Nom" required />
                        <Input label="Prénom" required />
                      </div>
                      <Input label="Email" type="email" required />
                      <Input label="Téléphone" type="tel" required />
                      <div className="pt-2">
                        <Button
                      type="submit"
                      fullWidth
                      size="lg"
                      disabled={isSubmitting}>
                      
                          {isSubmitting ?
                      'Inscription en cours...' :
                      'Confirmer ma présence'}
                        </Button>
                      </div>
                      <p className="text-xs text-center text-gray-500 mt-4">
                        En vous inscrivant, vous acceptez de recevoir des
                        communications concernant cet événement.
                      </p>
                    </form>
                  </>
              }
              </Card>
            }
          </div>
        </div>
      </div>
    </div>);

}