import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, User, Mail, Phone, MapPin, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { createMember, loginMember, requestMemberLoginOtp } from '../../services/member.service';
import { fetchSiteSettings } from '../../services/content.service';
import { WhatsAppRedirectModal } from './WhatsAppRedirectModal';
import { buildWhatsAppLink, fillTemplate, memberStatusLabel } from '../../utils/whatsapp';
import { saveMemberSession } from '../../utils/memberSession';
import { PATHS } from '../../routes/paths';


interface JoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onSuccess?: (member: any) => void;
}

export function JoinModal({ isOpen, onClose, initialMode = 'login', onSuccess }: JoinModalProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [whatsAppPayload, setWhatsAppPayload] = useState<{ url: string; title: string; message: string; buttonLabel: string } | null>(null);
  
  // OTP Verification States
  const [otpRequired, setOtpRequired] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  
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
  });

  // Cooldown timer for resending OTP
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Sync mode state when modal opens or initialMode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
      setOtpRequired(false);
      setMaskedEmail('');
      setOtpCode('');
      setResendCooldown(0);
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    fetchSiteSettings().then(setSiteSettings).catch(() => null);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
      setError('');
      setOtpRequired(false);
      setMaskedEmail('');
      setOtpCode('');
      setResendCooldown(0);
    }
  }, [isOpen]);

  const handleSwitchToRegister = () => {
    const full = (formData.fullName || '').trim();
    if (full) {
      const parts = full.split(/\s+/);
      if (parts.length > 1) {
        // Nom de famille (last name) is the first part, Prénom (first name) is the rest
        const name = parts[0];
        const firstname = parts.slice(1).join(' ');
        setFormData(prev => ({
          ...prev,
          name: name,
          firstname: firstname
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          name: full,
          firstname: ''
        }));
      }
    }
    setMode('register');
    setError('');
    setOtpRequired(false);
    setMaskedEmail('');
    setOtpCode('');
  };

  const handleSwitchToLogin = () => {
    const full = `${formData.name} ${formData.firstname}`.trim();
    setFormData(prev => ({
      ...prev,
      fullName: full || prev.fullName
    }));
    setMode('login');
    setError('');
    setOtpRequired(false);
    setMaskedEmail('');
    setOtpCode('');
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    setOtpCode('');

    try {
      const res = await requestMemberLoginOtp({
        full_name: formData.fullName.trim(),
        phone: formData.phone.trim(),
      });
      if (res.otp_required) {
        setMaskedEmail(res.masked_email || '');
        setResendCooldown(60);
        if (res.warning) {
          setError(res.warning);
        }
      }
    } catch (err) {
      console.error('Erreur renvoi OTP:', err);
      setError((err as any)?.response?.data?.detail || "Impossible de renvoyer le code. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (mode === 'login') {
        if (!otpRequired) {
          // Étape 1 : Demander l'OTP
          const res = await requestMemberLoginOtp({
            full_name: formData.fullName.trim(),
            phone: formData.phone.trim(),
          });
          
          if (res.otp_required) {
            setOtpRequired(true);
            setMaskedEmail(res.masked_email || '');
            if (res.warning) {
              setError(res.warning); // Optionnel : afficher s'il y a un avertissement
            }
            setIsSubmitting(false);
            return; // On arrête là, on affiche le formulaire OTP
          }
        }
        
        // Étape 2 (ou direct si pas d'email/secours) : Valider la connexion
        const auth = await loginMember({
          full_name: formData.fullName.trim(),
          phone: formData.phone.trim(),
          otp_code: otpRequired ? otpCode.trim() : undefined
        });
        
        saveMemberSession(auth.member);
        if (onSuccess) {
          onSuccess(auth.member);
        }
        onClose();
        
        // Redirect to profile page if email, sex or birth date is missing/default
        const member = auth.member;
        const hasMissingFields = !member.email || member.sex === 'non_precise' || !member.birth_date;
        if (hasMissingFields) {
          navigate(PATHS.PUBLIC.MEMBER_PROFILE + '?complete=true');
        }
      } else {
        const motivation = (formData.motivation || '').trim();
        if (motivation.length < 100) {
          setError(`Votre motivation doit contenir au moins 100 caractères (actuellement ${motivation.length} caractères).`);
          setIsSubmitting(false);
          return;
        }

        const created = await createMember({
          full_name: `${formData.firstname} ${formData.name}`.trim(),
          email: formData.email,
          phone: formData.phone,
          sex: formData.sex,
          birth_date: formData.birthDate || null,
          commune: formData.neighborhood || 'Cocody',
          integration_note: formData.motivation || 'Connexion directe',
        });

        saveMemberSession(created.member);
        const member = created.member;
        const isAspirant = member?.status === 'aspirant';
        const template = isAspirant
          ? (siteSettings?.whatsapp_message_aspirant || "Bonjour, je suis {name} ({status_label}) et je viens de m'inscrire sur la plateforme U-Report Cocody.")
          : (siteSettings?.whatsapp_message_advanced || "Bonjour, je suis {name} ({status_label}) et je viens de m'inscrire sur la plateforme U-Report Cocody.");
        const targetUrl = isAspirant ? siteSettings?.whatsapp_group_link : siteSettings?.whatsapp_manager_link;
        if (targetUrl) {
          const message = fillTemplate(template, {
            name: member?.full_name || `${formData.firstname} ${formData.name}`.trim(),
            status_label: memberStatusLabel(member?.status || 'aspirant'),
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
          onSuccess(member);
        }
        onClose();
      }
    } catch (err) {
      console.error('Erreur authentification:', err);
      setError((err as any)?.response?.data?.detail || "Une erreur technique est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen && !whatsAppPayload) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="join-modal-content" className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.9, y: 30 }} 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-x-hidden overflow-y-hidden relative"
          >
            <div className="relative h-28 sm:h-32 bg-gradient-to-r from-ureport-blue to-[#007bb5] flex items-center justify-center text-white">
              <div className="text-center">
                <h3 className="text-xl sm:text-2xl font-bold">
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
            
            <div className="p-5 sm:p-8 max-h-[76vh] sm:max-h-[70vh] overflow-y-auto overflow-x-hidden custom-scrollbar">
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
                    {otpRequired ? (
                      <div className="space-y-4 animate-fade-in">
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-800">
                          Un code de validation à 6 chiffres a été envoyé par email à l'adresse <strong>{maskedEmail}</strong>. Veuillez le saisir ci-dessous.
                        </div>
                        <div className="relative">
                          <Input 
                            label="Code de validation (OTP)" 
                            required 
                            placeholder="Ex: 123456"
                            value={otpCode}
                            onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            inputClassName="text-center font-mono text-2xl tracking-[0.5em] h-14"
                          />
                        </div>
                        <div className="text-center flex flex-col items-center gap-3">
                          <button
                            type="button"
                            disabled={resendCooldown > 0 || isSubmitting}
                            onClick={handleResendOtp}
                            className={`text-sm font-bold transition-all ${
                              resendCooldown > 0 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-ureport-blue hover:underline'
                            }`}
                          >
                            {resendCooldown > 0 
                              ? `Renvoyer le code (dans ${resendCooldown}s)` 
                              : "Je n'ai pas reçu de code ? Renvoyer"}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => {
                              setOtpRequired(false);
                              setOtpCode('');
                              setError('');
                            }}
                            className="text-xs text-gray-500 hover:text-ureport-blue font-bold underline"
                          >
                            Modifier mes informations de connexion
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <User className="absolute left-3 top-[38px] w-5 h-5 text-gray-400" />
                          <Input 
                            label="Nom Complet" 
                            required 
                            placeholder="Ex: Konan Koffi"
                            inputClassName="pl-10"
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
                            inputClassName="pl-10"
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value.replace(/[^\d+()\s-]/g, '')})}
                          />
                        </div>
                      </>
                    )}
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
                          inputClassName="pl-10"
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
                          inputClassName="pl-10"
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
                          inputClassName="pl-10"
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value.replace(/[^\d+()\s-]/g, '')})}
                        />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="min-w-0">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Date de naissance</label>
                        <input
                          type="date"
                          required
                          value={formData.birthDate}
                          onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                          className="block w-full max-w-full min-w-0 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-ureport-blue focus:border-transparent transition-all bg-white"
                        />
                      </div>
                    </div>

                    <div className="relative">
                      <MapPin className="absolute left-3 top-[38px] w-5 h-5 text-gray-400" />
                      <Input 
                        label="Quartier (Cocody)" 
                        required 
                        placeholder="Ex: Angré, Riviera 2, Deux Plateaux..."
                        inputClassName="pl-10"
                        value={formData.neighborhood}
                        onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                      />
                    </div>


                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-semibold text-gray-700">Motivation</label>
                        <span className={`text-xs font-semibold ${formData.motivation.trim().length >= 100 ? 'text-green-600' : 'text-gray-400'}`}>
                          {formData.motivation.trim().length} / 100 caractères min.
                        </span>
                      </div>
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
                    {mode === 'login' 
                      ? (otpRequired ? 'Valider le code de connexion' : 'Se connecter') 
                      : "Valider mon inscription"}
                  </Button>
                </div>

                <div className="text-center pt-2">
                  {mode === 'login' ? (
                    <p className="text-sm text-gray-600">
                      Nouveau dans la communauté ?{' '}
                      <button
                        type="button"
                        onClick={handleSwitchToRegister}
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
                        onClick={handleSwitchToLogin}
                        className="text-ureport-blue font-bold hover:underline"
                      >
                        Connectez-vous ici !
                      </button>
                    </p>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
      <WhatsAppRedirectModal
        key="join-modal-whatsapp"
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

