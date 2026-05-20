import React, { useEffect, useState } from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import { fetchSiteSettings } from '../../services/content.service';
import { Link } from './Link';

export function Footer() {
  const [footerSettings, setFooterSettings] = useState({
    facebook_url: 'https://www.facebook.com/share/1DoAeSBX6n/?mibextid=wwXIfr',
    instagram_url: 'https://www.instagram.com/communaute_ureportcocody?igsh=cDk4Nm0wcDdyZThs',
    tiktok_url: 'https://www.tiktok.com/@ureportcocody?_r=1&_t=ZS-96SxX2CetXu',
    footer_contact_title: 'Contact',
    footer_contact_address: "Mairie de Cocody,\nAbidjan, Côte d'Ivoire",
    footer_contact_phone: '+225 00 00 00 00 00',
    footer_contact_email: 'contact@ureportcocody.ci',
    footer_newsletter_title: 'Newsletter',
    footer_newsletter_text: "Restez informé de nos prochaines activités et opportunités d'engagement.",
    footer_newsletter_placeholder: 'Votre adresse email',
    footer_newsletter_button: "S'abonner",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchSiteSettings();
        setFooterSettings((prev) => ({
          facebook_url: data?.facebook_url || prev.facebook_url,
          instagram_url: data?.instagram_url || prev.instagram_url,
          tiktok_url: data?.tiktok_url || prev.tiktok_url,
          footer_contact_title: data?.footer_contact_title || prev.footer_contact_title,
          footer_contact_address: data?.footer_contact_address || prev.footer_contact_address,
          footer_contact_phone: data?.footer_contact_phone || prev.footer_contact_phone,
          footer_contact_email: data?.footer_contact_email || prev.footer_contact_email,
          footer_newsletter_title: data?.footer_newsletter_title || prev.footer_newsletter_title,
          footer_newsletter_text: data?.footer_newsletter_text || prev.footer_newsletter_text,
          footer_newsletter_placeholder: data?.footer_newsletter_placeholder || prev.footer_newsletter_placeholder,
          footer_newsletter_button: data?.footer_newsletter_button || prev.footer_newsletter_button,
        }));
      } catch (err) {
        console.error('Erreur chargement liens sociaux:', err);
      }
    };

    load();
  }, []);

  return (
    <footer className="bg-ureport-dark text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 bg-white/95 p-3 rounded-2xl w-fit shadow-sm" translate="no">
              <div className="flex flex-col items-start select-none">
                <div className="flex items-baseline">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-ureport-blue from-50% to-black to-50% font-black text-3xl tracking-tighter leading-none">U</span>
                  <span className="text-black font-bold text-2xl ml-0.5 tracking-tight leading-none">Report</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-ureport-blue mt-0.5 leading-none self-end mr-0.5">Cocody</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              La voix des jeunes de Cocody. Engagez-vous pour créer un impact
              positif dans notre communauté à travers des actions concrètes.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href={footerSettings.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook U-Report Cocody" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-ureport-blue transition-colors">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.88 3.78-3.88 1.1 0 2.25.2 2.25.2v2.48H15.2c-1.25 0-1.64.78-1.64 1.57V12h2.8l-.45 2.89h-2.35v6.99A10 10 0 0 0 22 12Z" /></svg>
              </a>
              <a href={footerSettings.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram U-Report Cocody" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-ureport-blue transition-colors">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5a3.95 3.95 0 0 0 3.95 3.95h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95h-8.5Zm9.2 1.35a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z" /></svg>
              </a>
              <a href={footerSettings.tiktok_url} target="_blank" rel="noopener noreferrer" aria-label="TikTok U-Report Cocody" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-ureport-blue transition-colors">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M14.5 3v10.55a4.45 4.45 0 1 1-3.2-4.28v2.14a2.36 2.36 0 1 0 1.1 2V3h2.1Zm2.05 0c.58 1.66 1.96 2.85 3.45 3.22v2.18a7.1 7.1 0 0 1-3.45-1.48V3Z" /></svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-heading font-bold text-lg mb-6 text-white">Liens Rapides</h3>
            <ul className="space-y-3">
              <li><Link href="/" className="text-gray-400 hover:text-ureport-gold transition-colors">Accueil</Link></li>
              <li><Link href="/events" className="text-gray-400 hover:text-ureport-gold transition-colors">Événements</Link></li>
              <li><Link href="/articles" className="text-gray-400 hover:text-ureport-gold transition-colors">Actualités</Link></li>
              <li><Link href="/gallery" className="text-gray-400 hover:text-ureport-gold transition-colors">Galerie</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-ureport-gold transition-colors">À Propos</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-bold text-lg mb-6 text-white">{footerSettings.footer_contact_title}</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-gray-400"><MapPin className="h-5 w-5 text-ureport-blue shrink-0 mt-0.5" /><span className="whitespace-pre-line">{footerSettings.footer_contact_address}</span></li>
              <li className="flex items-center gap-3 text-gray-400"><Phone className="h-5 w-5 text-ureport-blue shrink-0" /><span>{footerSettings.footer_contact_phone}</span></li>
              <li className="flex items-center gap-3 text-gray-400"><Mail className="h-5 w-5 text-ureport-blue shrink-0" /><span>{footerSettings.footer_contact_email}</span></li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-bold text-lg mb-6 text-white">{footerSettings.footer_newsletter_title}</h3>
            <p className="text-gray-400 text-sm mb-4">{footerSettings.footer_newsletter_text}</p>
            <form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder={footerSettings.footer_newsletter_placeholder} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/40 text-white placeholder-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-ureport-blue focus:border-transparent" />
              <button type="submit" className="w-full px-4 py-3 rounded-xl bg-ureport-blue text-white font-semibold hover:bg-[#158bb8] transition-colors">{footerSettings.footer_newsletter_button}</button>
            </form>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm text-center md:text-left">© {new Date().getFullYear()} U-Report Cocody. Tous droits réservés. Une initiative soutenue par l'UNICEF.</p>
          <div className="flex gap-4 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Mentions légales</a>
            <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
