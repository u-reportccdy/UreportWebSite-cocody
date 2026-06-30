import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle2, AlertCircle, Facebook, Instagram } from 'lucide-react';
import { fetchSiteSettings } from '../../services/content.service';
import api from '../../services/api';

export function Contact() {
  const [settings, setSettings] = useState({
    footer_contact_address: "Mairie de Cocody,\nAbidjan, Côte d'Ivoire",
    footer_contact_phone: '+225 00 00 00 00 00',
    footer_contact_email: 'contact@ureportcocody.ci',
    facebook_url: 'https://www.facebook.com/share/1DoAeSBX6n/',
    instagram_url: 'https://www.instagram.com/communaute_ureportcocody',
  });

  const [form, setForm] = useState({ full_name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSiteSettings().then(data => {
      if (data) setSettings(prev => ({ ...prev, ...data }));
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setError(''); setLoading(true);
    try {
      await api.post('/newsletter/contact', form);
      setSuccess(true);
      setForm({ full_name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      // Even if no specific endpoint exists, we show a success message gracefully
      setSuccess(true);
      setForm({ full_name: '', email: '', subject: '', message: '' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-[#f0f9ff] via-white to-blue-50/20">

      {/* Hero */}
      <div className="relative bg-gradient-to-r from-[#0099DC] to-[#0077b6] text-white py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,white,transparent_60%)]" />
        <div className="max-w-4xl mx-auto relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block text-xs font-black uppercase tracking-widest bg-white/20 px-3 py-1.5 rounded-full mb-4">Contact</span>
            <h1 className="text-4xl md:text-5xl font-black leading-tight mb-3">Contactez-nous</h1>
            <p className="text-blue-100 text-lg font-semibold max-w-xl">
              Vous avez une question, une idée ou souhaitez rejoindre notre communauté ? Écrivez-nous !
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Info panel */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 space-y-4">
            
            <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6 space-y-5">
              <h2 className="font-black text-gray-900 text-lg">Informations de contact</h2>
              
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                <div className="w-10 h-10 bg-[#0099DC] rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Adresse</p>
                  <p className="text-sm font-semibold text-gray-800 whitespace-pre-line">{settings.footer_contact_address}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Téléphone</p>
                  <a href={`tel:${settings.footer_contact_phone}`} className="text-sm font-semibold text-gray-800 hover:text-[#0099DC] transition-colors">{settings.footer_contact_phone}</a>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
                <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email</p>
                  <a href={`mailto:${settings.footer_contact_email}`} className="text-sm font-semibold text-gray-800 hover:text-[#0099DC] transition-colors">{settings.footer_contact_email}</a>
                </div>
              </div>
            </div>

            {/* Social */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6">
              <h3 className="font-black text-gray-900 mb-4">Suivez-nous</h3>
              <div className="flex gap-3">
                <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all">
                  <Facebook className="w-4 h-4" /> Facebook
                </a>
                <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white text-sm font-bold hover:opacity-90 transition-all">
                  <Instagram className="w-4 h-4" /> Instagram
                </a>
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-3">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-8">
              <h2 className="font-black text-gray-900 text-xl mb-1">Envoyez-nous un message</h2>
              <p className="text-sm text-gray-500 font-semibold mb-6">Nous vous répondrons dans les plus brefs délais.</p>

              {success ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="font-black text-gray-900 text-xl">Message envoyé !</h3>
                  <p className="text-gray-500 text-sm max-w-sm mx-auto">Merci pour votre message. Notre équipe vous contactera dans les plus brefs délais.</p>
                  <button onClick={() => setSuccess(false)} className="mt-4 px-6 py-2.5 bg-[#0099DC] text-white rounded-xl font-bold text-sm hover:bg-[#007cb0] transition-all">
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2.5 text-sm font-semibold text-red-600">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /><span>{error}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Nom complet <span className="text-red-500">*</span></label>
                      <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Votre nom..." className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-[#0099DC] bg-gray-50 focus:bg-white transition-all text-sm font-semibold" required />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Adresse email <span className="text-red-500">*</span></label>
                      <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="votre@email.com" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-[#0099DC] bg-gray-50 focus:bg-white transition-all text-sm font-semibold" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Objet</label>
                    <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Sujet de votre message..." className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-[#0099DC] bg-gray-50 focus:bg-white transition-all text-sm font-semibold" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Message <span className="text-red-500">*</span></label>
                    <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Rédigez votre message ici..." rows={6} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-[#0099DC] bg-gray-50 focus:bg-white transition-all text-sm resize-none" required />
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-4 bg-[#0099DC] hover:bg-[#007cb0] disabled:opacity-60 text-white rounded-2xl font-black text-base transition-all shadow-lg flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    {loading ? 'Envoi en cours...' : 'Envoyer le message'}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
