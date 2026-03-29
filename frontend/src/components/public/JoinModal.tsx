import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, CheckCircle, Heart, User, MapPin, Mail, Phone } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface JoinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinModal({ isOpen, onClose }: JoinModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    firstname: '',
    email: '',
    phone: '',
    neighborhood: '',
    motivation: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulation d'envoi API
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
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
              <h3 className="text-2xl font-bold">Rejoindre U-Report Cocody</h3>
              <p className="text-white/80 text-sm font-medium">Deviens un acteur du changement !</p>
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
                <h4 className="text-3xl font-extrabold text-gray-900 mb-4">Demande enregistrée !</h4>
                <p className="text-gray-600 mb-10 text-lg leading-relaxed">
                  Merci pour ton intérêt ! Ta demande d'adhésion a été transmise au <span className="text-ureport-blue font-bold">Département chargé de l'Intégration</span>. 
                  <br /><br />
                  Le responsable du département examinera ton profil et te contactera par téléphone ou WhatsApp pour t'expliquer la suite de la procédure d'intégration.
                </p>
                <Button fullWidth size="lg" onClick={() => { setIsSuccess(false); onClose(); }}>C'est parti !</Button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <User className="absolute left-3 top-[38px] w-5 h-5 text-gray-400" />
                    <Input 
                      label="Nom" 
                      required 
                      className="pl-10"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="relative">
                    <Input 
                      label="Prénom" 
                      required 
                      value={formData.firstname}
                      onChange={e => setFormData({...formData, firstname: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-[38px] w-5 h-5 text-gray-400" />
                    <Input 
                      label="Email" 
                      type="email" 
                      required 
                      className="pl-10"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-[38px] w-5 h-5 text-gray-400" />
                    <Input 
                      label="Téléphone" 
                      type="tel" 
                      required 
                      placeholder="+225 01..."
                      className="pl-10"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
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
                  <label className="text-sm font-semibold text-gray-700">Pourquoi rejoindre U-Report ? (Motivation)</label>
                  <textarea 
                    required
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-ureport-blue focus:border-transparent transition-all"
                    placeholder="Dis-nous ce qui te motive à nous rejoindre..."
                    value={formData.motivation}
                    onChange={e => setFormData({...formData, motivation: e.target.value})}
                  />
                </div>

                <div className="pt-4 pb-2">
                  <Button type="submit" fullWidth size="lg" disabled={isSubmitting} className="h-14 text-lg font-bold">
                    {isSubmitting ? 'Envoi en cours...' : 'Envoyer ma demande d\'adhésion'}
                  </Button>
                </div>
                <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest leading-relaxed">
                  En t'inscrivant, tu acceptes de recevoir des informations liées aux activités de U-Report Cocody.
                </p>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
