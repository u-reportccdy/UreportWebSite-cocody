import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, Heart, CheckCircle, User, Mail, Phone, MapPin, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { createMember, fetchMembers } from '../../services/member.service';
import { fetchSiteSettings } from '../../services/content.service';
import { WhatsAppRedirectModal } from './WhatsAppRedirectModal';
import { buildWhatsAppLink, fillTemplate, memberStatusLabel } from '../../utils/whatsapp';

interface JoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onSuccess?: (member: any) => void;
}

export function JoinModal({ isOpen, onClose, initialMode = 'login', onSuccess }: JoinModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [whatsAppPayload, setWhatsAppPayload] = useState<{ url: string; title: string; message: string; buttonLabel: string } | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    firstname: '',
    fullName: '', // Used for connection mode
    email: '',
    phone: '',
    sex: 'non_precise' as 'homme' | 'femme' | 'non_precise',
    birthDate: '',
    neighborhood: '',
    motivation: '',
    profile: 'aspirant' as 'aspirant' | 'ureporter' | 'mentor'
  });

  // Sync mode state when modal opens or initialMode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
      setIsSuccess(false);
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    fetchSiteSettings().then(setSiteSettings).catch(() => null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const allMembers = await fetchMembers();
      const normalizedPhone = formData.phone.replace(/\D/g, '');

      if (mode === 'login') {
        // --- LOGIN FLOW ---
        // Look up member by phone number
        const existingMember = allMembers.find((m: any) => {
          if (!m.phone) return false;
          const cleanDb = m.phone.replace(/\D/g, '');
          return cleanDb === normalizedPhone || 
                 (cleanDb.length >= 8 && normalizedPhone.endsWith(cleanDb)) ||
                 (normalizedPhone.length >= 8 && cleanDb.endsWith(normalizedPhone));
        });

        if (existingMember) {
          // Found! Save session and complete
          localStorage.setItem('member_session', JSON.stringify(existingMember));
          setIsSuccess(true);
          if (onSuccess) {
            onSuccess(existingMember);
          }
        } else {
          // Not found! Ask them to join
          setError("Ce numéro de téléphone n'est pas enregistré. Cliquez ci-dessous sur 'Rejoignez-nous ici !' pour vous inscrire !");
        }
      } else {
        // --- REGISTER FLOW ---
        // Check if the phone number already exists
        const duplicatePhone = allMembers.find((m: any) => {
          if (!m.phone) return false;
          const cleanDb = m.phone.replace(/\D/g, '');
          return cleanDb === normalizedPhone || 
                 (cleanDb.length >= 8 && normalizedPhone.endsWith(cleanDb)) ||
                 (normalizedPhone.length >= 8 && cleanDb.endsWith(normalizedPhone));
        });

        if (duplicatePhone) {
          setError(`Ce numéro de téléphone (${formData.phone}) est déjà enregistré chez un membre (${duplicatePhone.full_name}). Veuillez vous connecter ou utiliser un autre numéro.`);
          setIsSubmitting(false);
          return;
        }

        // Register new member in database
        const created = await createMember({
          full_name: `${formData.firstname} ${formData.name}`.trim(),
          email: formData.email,
          phone: formData.phone,
          sex: formData.sex,
          birth_date: formData.birthDate || null,
          commune: formData.neighborhood || 'Cocody',
          status: formData.profile,
          integration_note: formData.motivation || 'Connexion directe',
        });

        localStorage.setItem('member_session', JSON.stringify(created));
        setIsSuccess(true);

        const isAspirant = created?.status === 'aspirant';
        const template = isAspirant
          ? (siteSettings?.whatsapp_message_aspirant || "Bonjour, je suis {name} ({status_label}) et je viens de m'inscrire sur la plateforme U-Report Cocody.")
          : (siteSettings?.whatsapp_message_advanced || "Bonjour, je suis {name} ({status_label}) et je viens de m'inscrire sur la plateforme U-Report Cocody.");
        const targetUrl = isAspirant ? siteSettings?.whatsapp_group_link : siteSettings?.whatsapp_manager_link;
        if (targetUrl) {
          const message = fillTemplate(template, {
            name: created?.full_name || `${formData.firstname} ${formData.name}`.trim(),
            status_label: memberStatusLabel(created?.status || formData.profile),
            event_title: 'la plateforme U-Report Cocody',
          });
          setWhatsAppPayload({
            url: buildWhatsAppLink(targetUrl, message),
            title: isAspirant ? "Finaliser votre intégration WhatsApp" : 'Contacter le responsable intégration',
            message,
            buttonLabel: isAspirant ? "Rejoindre le groupe WhatsApp" : 'Ouvrir WhatsApp',
          });
        }
        if (onSuccess) {
          onSuccess(created);
        }
      }
    } catch (err) {
      console.error('Erreur authentification:', err);
      setError("Une erreur technique est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 30 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.9, y: 30 }} 
          className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden relative"
        >
          {/* Header avec dégradé U-Report */}
          <div className="relative h-32 bg-gradient-to-r from-ureport-blue to-[#007bb5] flex items-center justify-center text-white">
            <div className="text-center">
              <Heart className="w-8 h-8 mx-auto mb-2 animate-pulse" />
              <h3 className="text-2xl font-bold">
                {mode === 'login' ? 'Connexion U-Report' : 'Rejoindre la Communauté'}
              </h3>
              <p className="text-white/80 text-sm font-medium">
                {mode === 'login' ? 'Accédez rapidement à votre espace membre' : 'Devenez acteur du changement à Cocody !'}
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 p-2 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {isSuccess ? (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
                  <CheckCircle className="w-14 h-14 text-green-500" />
                </div>
                <h4 className="text-3xl font-extrabold text-gray-900 mb-4">
                  {mode === 'login' ? "Ravi de vous revoir !" : "Inscription réussie !"}
                </h4>
                <p className="text-gray-600 mb-10 text-lg leading-relaxed">
                  {mode === 'login' ? (
                    <>
                      Connexion réussie ! Vous êtes de nouveau connecté à votre profil U-Reporter. Vous pouvez désormais vous inscrire aux événements en un clic.
                    </>
                  ) : (
                    <>
                      Bienvenue au sein de U-Report Cocody ! Votre profil a été enregistré avec succès et transmis au responsable des adhésions.
                    </>
                  )}
                </p>
                <Button fullWidth size="lg" onClick={() => { setIsSuccess(false); onClose(); }}>Accéder à la plateforme</Button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {mode === 'login' ? (
                  // --- CONNEXION (Nom & Numero uniquement) ---
                  <div className="space-y-4">
                    <div className="relative">
                      <User className="absolute left-3 top-[38px] w-5 h-5 text-gray-400" />
                      <Input 
                        label="Nom Complet" 
                        required 
                        placeholder="Ex: Konan Koffi"
                        className="pl-10"
                        value={formData.fullName}
                        onChange={e => setFormData({...formData, fullName: e.target.value, name: e.target.value})}
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-[38px] w-5 h-5 text-gray-400" />
                      <Input 
                        label="Numéro de Téléphone" 
                        type="tel" 
                        required 
                        placeholder="Ex: +225 0707..."
                        className="pl-10"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value.replace(/[^\d+()\s-]/g, '')})}
                      />
                    </div>
                  </div>
                ) : (
                  // --- INSCRIPTION (Formulaire complet) ---
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative">
                        <User className="absolute left-3 top-[38px] w-5 h-5 text-gray-400" />
                        <Input 
                          label="Nom de famille" 
                          required 
                          placeholder="Ex: Konan"
                          className="pl-10"
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                      <div className="relative">
                        <Input 
                          label="Prénom" 
                          required 
                          placeholder="Ex: Koffi"
                          value={formData.firstname}
                          onChange={e => setFormData({...formData, firstname: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Sexe</label>
                      <select
                        required
                        value={formData.sex}
                        onChange={e => setFormData({...formData, sex: e.target.value as any})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-ureport-blue focus:border-transparent transition-all bg-white"
                      >
                        <option value="non_precise">Préfère ne pas préciser</option>
                        <option value="homme">Homme</option>
                        <option value="femme">Femme</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative">
                        <Mail className="absolute left-3 top-[38px] w-5 h-5 text-gray-400" />
                        <Input 
                          label="Adresse Email" 
                          type="email" 
                          required 
                          placeholder="Ex: nom@domaine.com"
                          className="pl-10"
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-3 top-[38px] w-5 h-5 text-gray-400" />
                        <Input 
                          label="Numéro de Téléphone" 
                          type="tel" 
                          required 
                          placeholder="Ex: +225 07..."
                          className="pl-10"
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value.replace(/[^\d+()\s-]/g, '')})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Date de naissance</label>
                        <input
                          type="date"
                          required
                          value={formData.birthDate}
                          onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-ureport-blue focus:border-transparent transition-all bg-white"
                        />
                      </div>
                    </div>

                    <div className="relative">
                      <MapPin className="absolute left-3 top-[38px] w-5 h-5 text-gray-400" />
                      <Input 
                        label="Quartier (Cocody)" 
                        required 
                        placeholder="Ex: Angré, Riviera 2, Deux Plateaux..."
                        className="pl-10"
                        value={formData.neighborhood}
                        onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Profil souhaité</label>
                      <select
                        value={formData.profile}
                        onChange={e => setFormData({...formData, profile: e.target.value as any})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-ureport-blue focus:border-transparent transition-all bg-white"
                      >
                        <option value="aspirant">Aspirant (Découvrir et s'informer)</option>
                        <option value="ureporter">U-Reporter (Acteur actif sur le terrain)</option>
                        <option value="mentor">Mentor (Encadrant / Guide)</option>
                      </select>

                      {formData.profile === 'ureporter' && (
                        <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-700 flex items-start gap-2 animate-fadeIn text-left">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span><strong>Engagement U-Reporter :</strong> Pour ce profil, vous devez déjà faire partie de la communauté ou vous engager à participer activement à toutes nos actions terrain et à nos réunions.</span>
                        </div>
                      )}
                      {formData.profile === 'mentor' && (
                        <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3 text-xs text-amber-800 flex items-start gap-2 animate-fadeIn text-left">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span><strong>Rôle de Mentor :</strong> Ce profil nécessite que vous fassiez déjà partie de la communauté et fera l'objet d'une validation spécifique par le bureau de U-Report Cocody.</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Motivation</label>
                      <textarea 
                        required
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-ureport-blue focus:border-transparent transition-all text-sm resize-none"
                        placeholder="Qu'est-ce qui vous motive à rejoindre U-Report ?"
                        value={formData.motivation}
                        onChange={e => setFormData({...formData, motivation: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4 pb-2">
                  <Button 
                    type="submit" 
                    fullWidth 
                    size="lg" 
                    loading={isSubmitting} 
                    className="h-14 text-lg font-bold"
                  >
                    {mode === 'login' ? 'Se connecter' : 'Valider mon inscription'}
                  </Button>
                </div>

                <div className="text-center pt-2">
                  {mode === 'login' ? (
                    <p className="text-sm text-gray-600">
                      Nouveau dans la communauté ?{' '}
                      <button 
                        type="button" 
                        onClick={() => { setMode('register'); setError(''); }} 
                        className="text-ureport-blue font-bold hover:underline"
                      >
                        Rejoignez-nous ici !
                      </button>
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Déjà membre ?{' '}
                      <button 
                        type="button" 
                        onClick={() => { setMode('login'); setError(''); }} 
                        className="text-ureport-blue font-bold hover:underline"
                      >
                        Connectez-vous ici !
                      </button>
                    </p>
                  )}
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
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

