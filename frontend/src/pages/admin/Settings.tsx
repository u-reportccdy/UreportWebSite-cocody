import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { SaveIcon, Loader2 } from 'lucide-react';
import { changeAdminCredentials, fetchSiteSettings, updateSiteSettings } from '../../services/content.service';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { readFileAsDataUrl } from '../../utils/imageResize';

export function Settings() {
  const confirm = useConfirm();
  const [formData, setFormData] = useState({
    hero_title: '',
    hero_subtitle: '',
    hero_description: '',
    hero_image_url: '',
    about_title: '',
    about_description: '',
    facebook_url: '',
    instagram_url: '',
    tiktok_url: '',
    whatsapp_group_link: '',
    whatsapp_manager_link: '',
    whatsapp_message_aspirant: '',
    whatsapp_message_advanced: '',
    footer_contact_title: '',
    footer_contact_address: '',
    footer_contact_phone: '',
    footer_contact_email: '',
    footer_newsletter_title: '',
    footer_newsletter_text: '',
    footer_newsletter_placeholder: '',
    footer_newsletter_button: '',
    newsletter_receiver_email: '',
    site_under_maintenance: false,
    maintenance_message: '',
  });
  const [imagePreview, setImagePreview] = useState('');
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [heroUrlDraft, setHeroUrlDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const adminRole = sessionStorage.getItem('admin_role') || '';
  const [securityForm, setSecurityForm] = useState({
    admin_email: '',
    admin_new_password: '',
    superadmin_email: '',
    superadmin_new_password: '',
    current_password: '',
  });
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);

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

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await fetchSiteSettings();
        if (data) {
          setFormData({
            hero_title: data.hero_title || '',
            hero_subtitle: data.hero_subtitle || '',
            hero_description: data.hero_description || '',
            hero_image_url: data.hero_image_url || '',
            about_title: data.about_title || '',
            about_description: data.about_description || '',
            facebook_url: data.facebook_url || '',
            instagram_url: data.instagram_url || '',
            tiktok_url: data.tiktok_url || '',
            whatsapp_group_link: data.whatsapp_group_link || '',
            whatsapp_manager_link: data.whatsapp_manager_link || '',
            whatsapp_message_aspirant: data.whatsapp_message_aspirant || "Bonjour, je suis {name} ({status_label}) et je viens de m'inscrire à l'activité \"{event_title}\". Merci de m'ajouter au groupe d'intégration.",
            whatsapp_message_advanced: data.whatsapp_message_advanced || "Bonjour, je suis {name} ({status_label}) et je viens de m'inscrire à l'activité \"{event_title}\". Je souhaite finaliser mon intégration.",
            footer_contact_title: data.footer_contact_title || 'Contact',
            footer_contact_address: data.footer_contact_address || "Mairie de Cocody,\nAbidjan, Côte d'Ivoire",
            footer_contact_phone: data.footer_contact_phone || '+225 00 00 00 00 00',
            footer_contact_email: data.footer_contact_email || 'contact@ureportcocody.ci',
            footer_newsletter_title: data.footer_newsletter_title || 'Newsletter',
            footer_newsletter_text: data.footer_newsletter_text || "Restez informé de nos prochaines activités et opportunités d'engagement.",
            footer_newsletter_placeholder: data.footer_newsletter_placeholder || 'Votre adresse email',
            footer_newsletter_button: data.footer_newsletter_button || "S'abonner",
            newsletter_receiver_email: data.newsletter_receiver_email || data.footer_contact_email || 'contact@ureportcocody.ci',
            site_under_maintenance: !!data.site_under_maintenance,
            maintenance_message: data.maintenance_message || 'Le site est temporairement en maintenance.',
          });
          const imgs = parseHeroImages(data.hero_image_url || '');
          setHeroImages(imgs);
          setImagePreview(imgs[0] || '');
        }
      } catch (err) {
        console.error('Erreur chargement paramètres:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    const currentEmail = (sessionStorage.getItem('admin_email') || '').trim();
    setSecurityForm(prev => ({
      ...prev,
      admin_email: prev.admin_email || currentEmail,
      superadmin_email: prev.superadmin_email || '',
    }));
  }, []);

  const handleImageUpload = async (file: File | null) => {
    if (!file) {
      setFormData(prev => ({ ...prev, hero_image_url: '' }));
      setImagePreview('');
      return;
    }

    try {
      const compressedData = await readFileAsDataUrl(file);
      setHeroImages(prev => {
        const next = [...prev, compressedData];
        setFormData(current => ({ ...current, hero_image_url: next.length > 1 ? JSON.stringify(next) : (next[0] || '') }));
        setImagePreview(next[0] || '');
        return next;
      });
    } catch (err) {
      console.error('Erreur compression image:', err);
      await confirm({
        title: 'Erreur image',
        message: 'Une erreur est survenue lors de la lecture de l\'image.',
        confirmText: 'Compris',
        cancelText: 'Fermer',
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updateSiteSettings(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Erreur enregistrement paramètres:', err);
      await confirm({
        title: 'Erreur enregistrement',
        message: 'Une erreur est survenue lors de l\'enregistrement.',
        confirmText: 'Compris',
        cancelText: 'Fermer',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSecurity = async () => {
    if (adminRole !== 'superadmin') {
      await confirm({
        title: 'Accès refusé',
        message: 'Seul le superadmin peut modifier les accès admin.',
        confirmText: 'Compris',
        cancelText: 'Fermer',
      });
      return;
    }

    setIsSavingSecurity(true);
    try {
      if (securityForm.admin_email || securityForm.admin_new_password) {
        await changeAdminCredentials({
          target_role: 'admin',
          target_email: (securityForm.admin_email || '').trim(),
          new_password: (securityForm.admin_new_password || '').trim() || undefined,
        });
      }
      if (securityForm.superadmin_email || securityForm.superadmin_new_password) {
        await changeAdminCredentials({
          target_role: 'superadmin',
          target_email: (securityForm.superadmin_email || '').trim(),
          new_password: (securityForm.superadmin_new_password || '').trim() || undefined,
        });
      }

      await confirm({
        title: 'Sécurité',
        message: 'Identifiants mis à jour avec succès.',
        confirmText: 'OK',
        cancelText: 'Fermer',
      });
      setSecurityForm(prev => ({
        ...prev,
        admin_new_password: '',
        superadmin_new_password: '',
        current_password: '',
      }));
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'Impossible de mettre à jour les identifiants.';
      await confirm({
        title: 'Erreur sécurité',
        message: detail,
        confirmText: 'Compris',
        cancelText: 'Fermer',
      });
    } finally {
      setIsSavingSecurity(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12 text-[#64748B]">Chargement des paramètres...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto space-y-6"
      translate="no"
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <h3 className="text-lg font-bold text-gray-900 mb-6 pb-3 border-b border-gray-100">
          Configuration de la Page d'Accueil
        </h3>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section Hero Banner */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#0099DC]">
              Bannière Principale (Hero Section)
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Badge / Surtitre</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: La voix de la jeunesse Ivoirienne"
                  value={formData.hero_subtitle}
                  onChange={e => setFormData({ ...formData, hero_subtitle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre principal (Titre de l'action)</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Engagez-vous pour Cocody"
                  value={formData.hero_title}
                  onChange={e => setFormData({ ...formData, hero_title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description principale</label>
              <textarea
                required
                rows={3}
                placeholder="Entrez le paragraphe d'introduction..."
                value={formData.hero_description}
                onChange={e => setFormData({ ...formData, hero_description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grande image de fond d'accueil</label>
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => document.getElementById('hero-image-input')?.click()}
                  className="w-full px-4 py-2 rounded-lg border border-dashed border-[#0099DC] text-[#0099DC] font-semibold hover:bg-blue-50"
                >
                  Ajouter image
                </button>
                <input
                  id="hero-image-input"
                  type="file"
                  accept="image/*"
                  onChange={async e => await handleImageUpload(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Ou URL de l'image"
                    value={heroUrlDraft}
                    onChange={e => setHeroUrlDraft(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const v = heroUrlDraft.trim();
                      if (!v) return;
                      setHeroImages(prev => {
                        const next = [...prev, v];
                        setFormData(current => ({ ...current, hero_image_url: next.length > 1 ? JSON.stringify(next) : (next[0] || '') }));
                        setImagePreview(next[0] || '');
                        return next;
                      });
                      setHeroUrlDraft('');
                    }}
                    className="px-4 py-2 rounded-lg bg-[#0099DC] text-white"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
              {heroImages.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {heroImages.map((img, idx) => (
                    <div key={`${img}-${idx}`} className="relative">
                      <img src={img} alt={`Hero ${idx + 1}`} className="w-full h-16 rounded-lg object-cover border border-gray-200" />
                      <button
                        type="button"
                        onClick={() => {
                          setHeroImages(prev => {
                            const next = prev.filter((_, i) => i !== idx);
                            setFormData(current => ({ ...current, hero_image_url: next.length > 1 ? JSON.stringify(next) : (next[0] || '') }));
                            setImagePreview(next[0] || '');
                            return next;
                          });
                        }}
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {imagePreview && (
                <div className="mt-3 relative h-48 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  <img src={imagePreview} alt="Aperçu de la bannière" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <hr className="border-gray-100 my-6" />

          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#0099DC]">
              Intégration WhatsApp
            </h4>
            <p className="text-xs text-gray-500">
              Variables disponibles dans les messages: <code>{'{name}'}</code>, <code>{'{status_label}'}</code>, <code>{'{event_title}'}</code>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lien groupe d'intégration (Aspirant)</label>
                <input
                  type="url"
                  placeholder="https://chat.whatsapp.com/..."
                  value={formData.whatsapp_group_link}
                  onChange={e => setFormData({ ...formData, whatsapp_group_link: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lien responsable intégration (Mentor/U-Reporter)</label>
                <input
                  type="url"
                  placeholder="https://wa.me/225..."
                  value={formData.whatsapp_manager_link}
                  onChange={e => setFormData({ ...formData, whatsapp_manager_link: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message WhatsApp Aspirant</label>
              <textarea
                rows={3}
                value={formData.whatsapp_message_aspirant}
                onChange={e => setFormData({ ...formData, whatsapp_message_aspirant: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message WhatsApp Mentor/U-Reporter</label>
              <textarea
                rows={3}
                value={formData.whatsapp_message_advanced}
                onChange={e => setFormData({ ...formData, whatsapp_message_advanced: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent resize-none"
              />
            </div>

          </div>

          <hr className="border-gray-100 my-6" />

          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#0099DC]">
              Footer Contact & Newsletter
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre Contact</label>
                <input
                  type="text"
                  value={formData.footer_contact_title}
                  onChange={e => setFormData({ ...formData, footer_contact_title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone Contact</label>
                <input
                  type="text"
                  value={formData.footer_contact_phone}
                  onChange={e => setFormData({ ...formData, footer_contact_phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse Contact</label>
                <textarea
                  rows={2}
                  value={formData.footer_contact_address}
                  onChange={e => setFormData({ ...formData, footer_contact_address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Contact</label>
                <input
                  type="email"
                  value={formData.footer_contact_email}
                  onChange={e => setFormData({ ...formData, footer_contact_email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre Newsletter</label>
                <input
                  type="text"
                  value={formData.footer_newsletter_title}
                  onChange={e => setFormData({ ...formData, footer_newsletter_title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Texte bouton Newsletter</label>
                <input
                  type="text"
                  value={formData.footer_newsletter_button}
                  onChange={e => setFormData({ ...formData, footer_newsletter_button: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email de réception Newsletter</label>
              <input
                type="email"
                value={formData.newsletter_receiver_email}
                onChange={e => setFormData({ ...formData, newsletter_receiver_email: e.target.value })}
                placeholder="Ex: newsletter@votredomaine.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Texte Newsletter</label>
                <textarea
                  rows={2}
                  value={formData.footer_newsletter_text}
                  onChange={e => setFormData({ ...formData, footer_newsletter_text: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder Newsletter</label>
                <input
                  type="text"
                  value={formData.footer_newsletter_placeholder}
                  onChange={e => setFormData({ ...formData, footer_newsletter_placeholder: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-100 my-6" />

          {sessionStorage.getItem('admin_role') === 'superadmin' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-red-600">
                Mode Maintenance (Superadmin)
              </h4>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.site_under_maintenance}
                  onChange={e => setFormData({ ...formData, site_under_maintenance: e.target.checked })}
                />
                Activer le mode maintenance
              </label>
              <textarea
                rows={2}
                value={formData.maintenance_message}
                onChange={e => setFormData({ ...formData, maintenance_message: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
            </div>
          )}

          <hr className="border-gray-100 my-6" />

          {adminRole === 'superadmin' && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#0099DC]">
              Sécurité des comptes admin
            </h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Admin</label>
                  <input
                    type="email"
                    value={securityForm.admin_email}
                    onChange={e => setSecurityForm({ ...securityForm, admin_email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe Admin</label>
                  <input
                    type="password"
                    value={securityForm.admin_new_password}
                    onChange={e => setSecurityForm({ ...securityForm, admin_new_password: e.target.value })}
                    placeholder="Minimum 10 caractères"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Superadmin</label>
                  <input
                    type="email"
                    value={securityForm.superadmin_email}
                    onChange={e => setSecurityForm({ ...securityForm, superadmin_email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe Superadmin</label>
                  <input
                    type="password"
                    value={securityForm.superadmin_new_password}
                    onChange={e => setSecurityForm({ ...securityForm, superadmin_new_password: e.target.value })}
                    placeholder="Minimum 10 caractères"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => void handleSaveSecurity()}
                  disabled={isSavingSecurity}
                  className="px-5 py-2 rounded-lg bg-[#0A7F3F] text-white font-semibold hover:bg-[#086A35] disabled:opacity-60"
                >
                  {isSavingSecurity ? 'Mise à jour...' : 'Mettre à jour les accès'}
                </button>
              </div>
            </div>
          </div>
          )}

          <hr className="border-gray-100 my-6" />

          {/* Section À propos / Impact */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#6CC24A]">
              Section À Propos (Impact)
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre de la section À Propos</label>
              <input
                required
                type="text"
                placeholder="Ex: Plus qu'une communauté, un mouvement."
                value={formData.about_title}
                onChange={e => setFormData({ ...formData, about_title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description À Propos</label>
              <textarea
                required
                rows={4}
                placeholder="Entrez le paragraphe à propos..."
                value={formData.about_description}
                onChange={e => setFormData({ ...formData, about_description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lien Facebook</label>
                <input
                  type="url"
                  placeholder="https://facebook.com/..."
                  value={formData.facebook_url}
                  onChange={e => setFormData({ ...formData, facebook_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lien Instagram</label>
                <input
                  type="url"
                  placeholder="https://instagram.com/..."
                  value={formData.instagram_url}
                  onChange={e => setFormData({ ...formData, instagram_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lien TikTok</label>
                <input
                  type="url"
                  placeholder="https://tiktok.com/@..."
                  value={formData.tiktok_url}
                  onChange={e => setFormData({ ...formData, tiktok_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Action footer */}
          <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
            <div>
              {saveSuccess && (
                <span className="text-sm font-bold text-green-600 animate-pulse">
                  œ“ Paramètres enregistrés avec succès !
                </span>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-2 bg-[#0099DC] text-white px-6 py-2.5 rounded-lg hover:bg-[#007bb5] transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <SaveIcon className="w-5 h-5" />
                  <span>Sauvegarder</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

