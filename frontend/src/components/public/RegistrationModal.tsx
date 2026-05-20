import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { fetchEvent, isRegisteredForEvent, registerForEvent } from '../../services/event.service';
import { JoinModal } from './JoinModal';
import { WhatsAppRedirectModal } from './WhatsAppRedirectModal';
import { memberStatusLabel } from '../../utils/whatsapp';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
}

export function RegistrationModal({ isOpen, onClose, eventId, eventTitle }: RegistrationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    firstname: '',
    email: '',
    phone: '',
    member_status: 'aspirant',
    sex: 'non_precise',
  });
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [whatsAppPayload, setWhatsAppPayload] = useState<{ url: string; title: string; message: string; buttonLabel: string } | null>(null);

  React.useEffect(() => {
    const saved = localStorage.getItem('member_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSession(parsed);
        setFormData(prev => ({
          ...prev,
          name: parsed?.full_name?.split(' ').slice(1).join(' ') || '',
          firstname: parsed?.full_name?.split(' ')[0] || '',
          email: parsed?.email || '',
          phone: parsed?.phone || '',
          member_status: parsed?.status || 'aspirant',
          sex: parsed?.sex || 'non_precise',
        }));
      } catch (_err) {}
    }
  }, [isOpen]);

  React.useEffect(() => {
    const checkRegistration = async () => {
      if (!isOpen || !session?.id) return;
      try {
        const exists = await isRegisteredForEvent(eventId, session?.id, session?.phone);
        setIsAlreadyRegistered(exists);
        if (exists) {
          const eventData = await fetchEvent(eventId);
          if (eventData?.whatsapp_link) {
            const status = formData.member_status || session?.status || 'aspirant';
            setWhatsAppPayload({
              url: eventData.whatsapp_link,
              title: "Rejoindre le groupe WhatsApp de l'activité",
              message: `Vous êtes déjà inscrit à "${eventTitle || "l'activité"}". Statut: ${memberStatusLabel(status)}.`,
              buttonLabel: 'Ouvrir WhatsApp',
            });
          }
        }
      } catch {
        setIsAlreadyRegistered(false);
      }
    };
    checkRegistration();
  }, [isOpen, eventId, session?.id, session?.phone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await registerForEvent(eventId, {
        member_id: session?.id,
        full_name: `${formData.firstname} ${formData.name}`.trim(),
        email: formData.email,
        phone: formData.phone,
        member_status: formData.member_status,
        sex: formData.sex,
      });
      setIsSubmitting(false);
      setIsSuccess(true);

      const eventData = await fetchEvent(eventId);
      const targetUrl = eventData?.whatsapp_link;

      if (targetUrl) {
        const status = formData.member_status || session?.status || 'aspirant';
        setWhatsAppPayload({
          url: targetUrl,
          title: "Rejoindre le groupe WhatsApp de l'activité",
          message: `Inscription confirmée pour "${eventTitle || "l'activité"}". Statut: ${memberStatusLabel(status)}.\nCliquez pour ouvrir le lien WhatsApp de l'activité.`,
          buttonLabel: 'Ouvrir WhatsApp',
        });
      }
    } catch (err: any) {
      console.error('Erreur inscription activite:', err);
      setIsSubmitting(false);
      const statusCode = err?.response?.status;
      if (statusCode === 409) {
        setError('');
        setIsAlreadyRegistered(true);
        try {
          const eventData = await fetchEvent(eventId);
          if (eventData?.whatsapp_link) {
            const status = formData.member_status || session?.status || 'aspirant';
            setWhatsAppPayload({
              url: eventData.whatsapp_link,
              title: "Rejoindre le groupe WhatsApp de l'activité",
              message: `Vous êtes déjà inscrit à "${eventTitle || "l'activité"}". Statut: ${memberStatusLabel(status)}.`,
              buttonLabel: 'Ouvrir WhatsApp',
            });
          }
        } catch {
          // noop
        }
      } else if (statusCode === 404) {
        setError("Cette activité n'est plus disponible.");
      } else {
        setError("Impossible de confirmer l'inscription pour le moment.");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[88vh] overflow-hidden relative">
          <div className="flex justify-between items-start p-6 border-b border-gray-100 bg-gray-50/50">
            <div className="pr-8">
              <h3 className="text-2xl font-heading font-bold text-gray-900">S'inscrire</h3>
              <p className="text-[#0099DC] font-medium text-sm mt-1">{eventTitle}</p>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors bg-white shadow-sm border border-gray-100"><XIcon className="w-5 h-5" /></button>
          </div>

          <div className="p-5 sm:p-6 max-h-[calc(88vh-96px)] overflow-y-auto scroll-smooth custom-scrollbar overscroll-contain">
            {isSuccess || isAlreadyRegistered ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-2">{isAlreadyRegistered ? 'Déjà inscrit' : 'Inscription confirmee !'}</h4>
                <p className="text-gray-600 mb-8 max-w-sm mx-auto">
                  {isAlreadyRegistered ? "Vous êtes déjà inscrit à cette activité." : 'Merci pour votre engagement. Votre inscription est enregistree pour cette activite.'}
                </p>
                {whatsAppPayload?.url ? (
                  <Button fullWidth onClick={() => window.open(whatsAppPayload.url, '_blank', 'noopener,noreferrer')}>
                    Integrer le groupe WhatsApp
                  </Button>
                ) : (
                  <Button fullWidth onClick={() => { setIsSuccess(false); onClose(); }}>Fermer</Button>
                )}
              </motion.div>
            ) : !session ? (
              <div className="text-center py-6 space-y-4">
                <h4 className="text-xl font-bold text-gray-900">Connexion requise</h4>
                <p className="text-gray-600">Vous devez créer un compte ou vous connecter avant de vous inscrire à une activité.</p>
                <Button fullWidth onClick={() => setIsJoinModalOpen(true)}>S'inscrire / Se connecter</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Nom" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  <Input label="Prenom" required value={formData.firstname} onChange={e => setFormData({ ...formData, firstname: e.target.value })} />
                </div>
                <Input label="Email" type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                <Input label="Telephone" type="tel" required placeholder="+225 0000000000" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/[^\d+()\s-]/g, '') })} />
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Statut</label>
                  <select
                    value={formData.member_status}
                    onChange={e => setFormData({ ...formData, member_status: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ureport-blue"
                  >
                    <option value="aspirant">Aspirant</option>
                    <option value="ureporter">U-Reporter</option>
                    <option value="mentor">Mentor</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Sexe</label>
                  <select
                    value={formData.sex}
                    onChange={e => setFormData({ ...formData, sex: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ureport-blue"
                  >
                    <option value="non_precise">Préfère ne pas préciser</option>
                    <option value="homme">Homme</option>
                    <option value="femme">Femme</option>
                  </select>
                </div>
                <div className="pt-2">
                  <Button type="submit" fullWidth size="lg" disabled={isSubmitting}>
                    {isSubmitting ? 'Inscription en cours...' : 'Confirmer ma presence'}
                  </Button>
                </div>
                <p className="text-xs text-center text-gray-400 mt-4">Vos donnees resteront confidentielles et serviront uniquement pour l'organisation de cette activite.</p>
              </form>
            )}
          </div>
        </motion.div>
      </div>
      <JoinModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onSuccess={(member) => {
          setSession(member);
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
    </AnimatePresence>
  );
}

