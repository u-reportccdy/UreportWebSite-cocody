import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  User, 
  Calendar, 
  MapPin, 
  CheckCircle, 
  Loader2, 
  ArrowLeft, 
  AlertCircle,
  MessageCircle,
  Users
} from 'lucide-react';
import { fetchEvent, quickCheckIn } from '../../services/event.service';
import { loadMemberSession } from '../../utils/memberSession';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

const ABIDJAN_COMMUNES = [
  'Cocody',
  'Abobo',
  'Adjamé',
  'Attécoubé',
  'Bingerville',
  'Plateau',
  'Treichville',
  'Marcory',
  'Koumassi',
  'Port-Bouët',
  'Yopougon',
  'Songon',
  'Anyama'
];

export function EventCheckIn() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState<any>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [error, setError] = useState('');
  
  // Steps state: 'phone' | 'confirm' | 'register' | 'success'
  const [step, setStep] = useState<'phone' | 'confirm' | 'register' | 'success'>('phone');
  
  // Check-in Form states
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [sex, setSex] = useState<'homme' | 'femme' | 'non_precise'>('non_precise');
  const [birthDate, setBirthDate] = useState('');
  const [commune, setCommune] = useState('Cocody');
  
  // Member loaded from DB
  const [existingMember, setExistingMember] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  useEffect(() => {
    const loadEventData = async () => {
      if (!id) return;
      setIsLoadingEvent(true);
      try {
        const data = await fetchEvent(id);
        setEvent(data);
      } catch (err) {
        console.error('Erreur chargement événement pour check-in:', err);
        setError('Activité introuvable ou archivée.');
      } finally {
        setIsLoadingEvent(false);
      }
    };
    loadEventData();
  }, [id]);

  useEffect(() => {
    const session = loadMemberSession();
    if (session && session.phone) {
      setPhone(session.phone);
      setExistingMember(session);
      setStep('confirm');
    }
  }, []);

  // Normalize phone number to only digits
  const cleanPhone = (num: string) => num.replace(/[^0-9]/g, '');

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = cleanPhone(phone);
    if (cleanNum.length < 8) {
      setError('Veuillez entrer un numéro de téléphone valide.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      if (!id) return;
      const res = await quickCheckIn(id, { phone: cleanNum });
      
      if (res.status === 'not_member') {
        // Member does not exist, go to register form
        setStep('register');
      } else if (res.status === 'success') {
        // Member exists, show confirmation step
        setExistingMember(res.member);
        setAlreadyRegistered(res.already_registered);
        setStep('confirm');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la vérification.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPresence = async () => {
    if (!id || !phone) return;
    setIsSubmitting(true);
    setError('');
    
    try {
      const cleanNum = cleanPhone(phone);
      await quickCheckIn(id, { phone: cleanNum, full_name: existingMember?.full_name });
      setStep('success');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Erreur lors de la validation de présence.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterAndCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !phone || !fullName) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const cleanNum = cleanPhone(phone);
      await quickCheckIn(id, {
        phone: cleanNum,
        full_name: fullName,
        sex,
        birth_date: birthDate || undefined,
        commune
      });
      setStep('success');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Erreur lors de l’inscription et de la validation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingEvent) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#0099DC] mx-auto" />
          <p className="text-slate-500 font-bold text-sm">Chargement du check-in...</p>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-900">Une erreur est survenue</h3>
          <p className="text-slate-500 text-sm font-semibold">{error}</p>
          <Button onClick={() => navigate('/')} fullWidth>
            Retour à l'accueil
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 flex flex-col justify-center items-center">
      <div className="max-w-md w-full space-y-6">
        
        {/* Logo/Banner */}
        <div className="text-center">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0099DC] bg-[#0099DC]/10 px-3 py-1.5 rounded-full border border-[#0099DC]/20">
            U-Report Cocody Check-in
          </span>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 mt-4">
            Validation de Présence
          </h2>
        </div>

        {/* Activity Details Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
              Activité en cours
            </span>
            <span className="text-[10px] font-bold text-[#0099DC]">
              {event?.category}
            </span>
          </div>
          
          <h3 className="font-extrabold text-slate-900 text-base leading-snug">
            {event?.title}
          </h3>

          <div className="flex flex-col gap-2 pt-2 text-xs font-bold text-slate-500 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                {event?.event_date ? new Date(event.event_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Date non définie'}
              </span>
            </div>
            {event?.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action card with transition */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600 flex items-start gap-2 animate-pulse">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            
            {/* STEP 1: ENTER PHONE */}
            {step === 'phone' && (
              <motion.form 
                key="step-phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handlePhoneSubmit}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                    Saisir votre numéro de téléphone
                  </h4>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                    Entrez le numéro associé à votre compte U-Report. S'il s'agit de votre première activité, vous pourrez vous enregistrer à l'étape suivante.
                  </p>
                  
                  <div className="relative mt-2">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      required
                      type="tel"
                      placeholder="Ex: 0707070707"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 text-sm font-bold border border-slate-250 text-slate-800 placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099DC] bg-slate-50/50"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  fullWidth 
                  size="lg" 
                  loading={isSubmitting}
                  className="bg-[#0099DC] hover:bg-[#007bb5] text-white"
                >
                  Vérifier mon numéro
                </Button>
              </motion.form>
            )}

            {/* STEP 2a: CONFIRM PRESENCE (EXISTING MEMBER) */}
            {step === 'confirm' && (
              <motion.div
                key="step-confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="text-center py-2 space-y-1.5">
                  <div className="w-12 h-12 bg-[#0099DC]/10 rounded-full flex items-center justify-center mx-auto text-[#0099DC]">
                    <User className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-black text-slate-900">
                    Ravi de vous revoir !
                  </h4>
                  <p className="text-sm font-extrabold text-[#0099DC]">
                    {existingMember?.full_name}
                  </p>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-xs mx-auto">
                    {alreadyRegistered 
                      ? "Vous êtes déjà inscrit(e) à cette activité. Validez votre présence sur place ci-dessous."
                      : "Confirmez votre présence pour participer à l'activité de ce jour."}
                  </p>
                </div>

                <div className="space-y-2">
                  <Button 
                    onClick={handleConfirmPresence}
                    fullWidth 
                    size="lg" 
                    loading={isSubmitting}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Valider ma présence
                  </Button>
                  
                  <button
                    onClick={() => {
                      setStep('phone');
                      setExistingMember(null);
                      setError('');
                    }}
                    className="w-full text-center py-2 text-xs font-bold text-slate-450 hover:text-slate-700 flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Ce n'est pas moi (Changer de numéro)</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2b: REGISTER & CHECK-IN (NEW MEMBER) */}
            {step === 'register' && (
              <motion.form 
                key="step-register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleRegisterAndCheckIn}
                className="space-y-4"
              >
                <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl flex gap-2.5 text-xs text-amber-800 font-semibold leading-relaxed">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="block font-bold">Numéro non enregistré</span>
                    Ce numéro de téléphone n'est pas lié à un compte U-Report. Remplissez ces champs rapides pour vous enregistrer et valider votre présence.
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nom Complet</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required
                      type="text"
                      placeholder="Ex: Koffi Kouassi Ange"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs font-bold border border-slate-250 text-slate-800 placeholder-slate-450 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099DC] bg-slate-50/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Sexe</label>
                    <select
                      value={sex}
                      onChange={e => setSex(e.target.value as any)}
                      className="w-full px-3 py-2.5 text-xs font-bold border border-slate-250 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099DC] bg-slate-50/50"
                    >
                      <option value="non_precise">Non précisé</option>
                      <option value="homme">Homme</option>
                      <option value="femme">Femme</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Date de naissance</label>
                    <input
                      required
                      type="date"
                      value={birthDate}
                      onChange={e => setBirthDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold border border-slate-250 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099DC] bg-slate-50/50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Commune de résidence</label>
                  <select
                    value={commune}
                    onChange={e => setCommune(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs font-bold border border-slate-250 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099DC] bg-slate-50/50"
                  >
                    {ABIDJAN_COMMUNES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 space-y-2">
                  <Button 
                    type="submit" 
                    fullWidth 
                    size="lg" 
                    loading={isSubmitting}
                    className="bg-[#0099DC] hover:bg-[#007bb5] text-white"
                  >
                    S'inscrire et Valider ma présence
                  </Button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone');
                      setError('');
                    }}
                    className="w-full text-center py-1.5 text-xs font-bold text-slate-450 hover:text-slate-700 flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Retour au numéro</span>
                  </button>
                </div>
              </motion.form>
            )}

            {/* STEP 3: SUCCESS */}
            {step === 'success' && (
              <motion.div
                key="step-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-6 space-y-6"
              >
                <div className="space-y-3">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-500 border border-green-100">
                    <CheckCircle className="w-10 h-10 animate-bounce" />
                  </div>
                  <h4 className="text-xl font-black text-slate-900">
                    Présence validée !
                  </h4>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-xs mx-auto">
                    Votre participation a été enregistrée avec succès pour l'activité <strong>{event?.title}</strong>.
                  </p>
                </div>

                {event?.whatsapp_link && (
                  <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-left space-y-3">
                    <div className="flex items-center gap-2 text-emerald-700 font-black text-xs">
                      <MessageCircle className="w-4 h-4 shrink-0" />
                      <span>GROUPE WHATSAPP DE L'ACTIVITÉ</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                      Rejoignez le groupe WhatsApp temporaire de cette activité pour recevoir les informations d'organisation et les consignes des responsables.
                    </p>
                    <a
                      href={event.whatsapp_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4 shrink-0 text-white" />
                      <span>Rejoindre le groupe WhatsApp</span>
                    </a>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100">
                  <Button 
                    onClick={() => navigate('/')} 
                    fullWidth 
                    variant="outline"
                  >
                    Retour au site
                  </Button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div>

      </div>
    </div>
  );
}
