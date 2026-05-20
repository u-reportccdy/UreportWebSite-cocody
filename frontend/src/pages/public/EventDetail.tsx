import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, Users, Share2, ArrowLeft, CheckCircle } from 'lucide-react';
import { Link } from '../../components/public/Link';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { fetchEvent, isRegisteredForEvent, registerForEvent } from '../../services/event.service';
import { JoinModal } from '../../components/public/JoinModal';
import { cleanRichHtml } from '../../utils/richText';
import { WhatsAppRedirectModal } from '../../components/public/WhatsAppRedirectModal';
import { memberStatusLabel } from '../../utils/whatsapp';



export function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<any>(null);
  const [formData, setFormData] = useState({ member_status: 'aspirant', sex: 'non_precise' });
  const [session, setSession] = useState<any>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [error, setError] = useState('');
  const [whatsAppPayload, setWhatsAppPayload] = useState<{ url: string; title: string; message: string; buttonLabel: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('member_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSession(parsed);
        setFormData({ member_status: parsed?.status || 'aspirant', sex: parsed?.sex || 'non_precise' });
      } catch (_err) {}
    }
  }, []);

  useEffect(() => {
    const loadEvent = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const row = await fetchEvent(id);
        setEvent({
          ...row,
          date: row.date || row.event_date,
          time: row.time || [row.start_time, row.end_time].filter(Boolean).join(' - '),
          image: row.image || row.image_url,
          registered: row.registered || 0,
        });
      } catch (err) {
        console.error('Erreur chargement activite:', err);
        setError('Evenement introuvable');
      } finally {
        setIsLoading(false);
      }
    };

    loadEvent();
  }, [id]);

  useEffect(() => {
    const checkRegistration = async () => {
      if (!id || !session?.id) return;
      try {
        const exists = await isRegisteredForEvent(id, session?.id, session?.phone);
        setIsAlreadyRegistered(exists);
      } catch {
        setIsAlreadyRegistered(false);
      }
    };
    checkRegistration();
  }, [id, session?.id, session?.phone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !session?.id) return;
    setIsSubmitting(true);
    setError('');
    try {
      await registerForEvent(id, {
        member_id: session.id,
        member_status: formData.member_status,
        sex: formData.sex,
      });
      setIsSuccess(true);
      setEvent((current: any) => current ? { ...current, registered: (current.registered || 0) + 1 } : current);

      const targetUrl = event?.whatsapp_link;

      if (targetUrl) {
        const status = formData.member_status || session?.status || 'aspirant';
        setWhatsAppPayload({
          url: targetUrl,
          title: "Rejoindre le groupe WhatsApp de l'activité",
          message: `Inscription confirmée pour "${event?.title || "l'activité"}". Statut: ${memberStatusLabel(status)}.\nCliquez pour ouvrir le lien WhatsApp de l'activité.`,
          buttonLabel: "Ouvrir WhatsApp",
        });
      }
    } catch (err) {
      console.error('Erreur inscription activite:', err);
      setError("Impossible d'enregistrer l'inscription.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="min-h-[60vh] flex items-center justify-center text-gray-500">Chargement de l'activite...</div>;

  if (!event) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">{error || 'Evenement introuvable'}</h2>
        <Link href="/events"><Button>Retour aux evenements</Button></Link>
      </div>
    );
  }

  const isUpcoming = event.status === 'upcoming' || event.status === 'ongoing';
  const isFull = event.registered >= (event.capacity || 0);

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="h-[40vh] md:h-[50vh] relative bg-gray-200">
        {event.image && <img src={event.image} alt={event.title} className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
        <div className="absolute top-6 left-4 sm:left-6 lg:left-8 z-10">
          <Link href="/events" className="inline-flex items-center text-white bg-black/30 hover:bg-black/50 backdrop-blur-md px-4 py-2 rounded-full transition-colors text-sm font-semibold">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="p-8">
              <div className="flex gap-3 mb-4">
                <span className="bg-ureport-light text-ureport-blue px-3 py-1 rounded-full text-sm font-bold">{event.category}</span>
                {!isUpcoming && <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-bold">Termine</span>}
              </div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-ureport-dark mb-6">{event.title}</h1>
              <div className="prose prose-lg max-w-none text-gray-600">
                <div className="text-gray-800 leading-relaxed quill-content space-y-4" dangerouslySetInnerHTML={{ __html: cleanRichHtml(event.description || 'Aucune description disponible.') }} />
              </div>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="p-6">
              <h3 className="font-heading font-bold text-xl mb-6 border-b pb-4">Details de l'activite</h3>
              <div className="space-y-6">
                <div className="flex items-start"><div className="bg-ureport-light p-3 rounded-xl mr-4"><Calendar className="w-6 h-6 text-ureport-blue" /></div><div><p className="font-bold text-gray-900">Date</p><p className="text-gray-600">{event.date ? new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}</p></div></div>
                <div className="flex items-start"><div className="bg-ureport-light p-3 rounded-xl mr-4"><Clock className="w-6 h-6 text-ureport-blue" /></div><div><p className="font-bold text-gray-900">Heure</p><p className="text-gray-600">{event.time}</p></div></div>
                <div className="flex items-start"><div className="bg-orange-50 p-3 rounded-xl mr-4"><MapPin className="w-6 h-6 text-ureport-gold" /></div><div><p className="font-bold text-gray-900">Lieu</p><p className="text-gray-600">{event.location}</p></div></div>
                <div className="flex items-start"><div className="bg-green-50 p-3 rounded-xl mr-4"><Users className="w-6 h-6 text-green-500" /></div><div className="w-full"><p className="font-bold text-gray-900">Places disponibles</p><div className="flex justify-between text-sm text-gray-600 mb-1 mt-1"><span>{event.registered} inscrits</span><span>{event.capacity} total</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${isFull ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${(event.registered / (event.capacity || 1)) * 100}%` }}></div></div></div></div>
              </div>
              <div className="mt-8 pt-6 border-t flex justify-center"><button className="flex items-center text-gray-500 hover:text-ureport-blue transition-colors font-semibold"><Share2 className="w-5 h-5 mr-2" /> Partager l'activite</button></div>
            </Card>

            {isUpcoming && (
              <Card className="p-6 border-t-4 border-t-ureport-blue">
                {isSuccess || isAlreadyRegistered ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-green-500" /></div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{isAlreadyRegistered ? 'Déjà inscrit' : 'Inscription confirmee !'}</h3>
                    <p className="text-gray-600 mb-6">{isAlreadyRegistered ? "Vous êtes déjà inscrit à cette activité." : 'Votre inscription est enregistree.'}</p>
                    {event?.whatsapp_link ? (
                      <Button fullWidth onClick={() => window.open(event.whatsapp_link, '_blank', 'noopener,noreferrer')}>
                        Integrer le groupe WhatsApp
                      </Button>
                    ) : (
                      <Button variant="outline" fullWidth onClick={() => setIsSuccess(false)}>Nouvelle inscription</Button>
                    )}
                  </motion.div>
                ) : isFull ? (
                  <div className="text-center py-6"><h3 className="text-xl font-bold text-gray-900 mb-2">Complet</h3><p className="text-gray-600">Il n'y a plus de places disponibles pour cette activite.</p></div>
                ) : !session ? (
                  <div className="text-center py-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Connexion requise</h3>
                    <p className="text-gray-600 mb-4">Vous devez créer un compte ou vous connecter avant de vous inscrire à cette activité.</p>
                    <Button fullWidth onClick={() => setIsJoinModalOpen(true)}>S'inscrire / Se connecter</Button>
                  </div>
                ) : (
                  <>
                    <h3 className="font-heading font-bold text-2xl mb-2">S'inscrire</h3>
                    <p className="text-gray-500 text-sm mb-6">Confirmez votre statut et votre sexe pour valider votre présence.</p>
                    {error && <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <select value={formData.member_status} onChange={e => setFormData({ ...formData, member_status: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ureport-blue">
                        <option value="aspirant">Aspirant</option>
                        <option value="ureporter">U-Reporter</option>
                        <option value="mentor">Mentor</option>
                      </select>
                      <select value={formData.sex} onChange={e => setFormData({ ...formData, sex: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ureport-blue">
                        <option value="non_precise">Préfère ne pas préciser</option>
                        <option value="homme">Homme</option>
                        <option value="femme">Femme</option>
                      </select>
                      <Button type="submit" fullWidth size="lg" loading={isSubmitting}>Confirmer ma présence</Button>
                    </form>
                  </>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>

      <JoinModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onSuccess={(member) => {
          setSession(member);
          setFormData({ member_status: member?.status || 'aspirant', sex: member?.sex || 'non_precise' });
          setIsJoinModalOpen(false);
        }}
      />
      <WhatsAppRedirectModal
        isOpen={!!whatsAppPayload}
        onClose={() => setWhatsAppPayload(null)}
        title={whatsAppPayload?.title || ''}
        message={whatsAppPayload?.message || ''}
        buttonLabel={whatsAppPayload?.buttonLabel || 'Ouvrir WhatsApp'}
        whatsappUrl={whatsAppPayload?.url || ''}
      />
    </div>
  );
}

