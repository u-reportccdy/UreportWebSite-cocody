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
    <footer className="relative overflow-hidden bg-[#1e2a3f] text-white pt-20 pb-8">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-ureport-blue via-cyan-400 to-ureport-gold" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.10),transparent_28%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_0.8fr_1fr] mb-12">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur-sm">
            <div className="flex items-center gap-2 bg-white/95 p-3 rounded-2xl w-fit shadow-sm" translate="no">
              <div className="flex flex-col items-start select-none">
                <div className="flex items-baseline">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-ureport-blue from-50% to-black to-50% font-black text-3xl tracking-tighter leading-none">U</span>
                  <span className="text-black font-bold text-2xl ml-0.5 tracking-tight leading-none">Report</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-ureport-blue mt-0.5 leading-none self-end mr-0.5">Cocody</span>
              </div>
            </div>
            <p className="mt-6 max-w-md text-[15px] leading-8 text-slate-300">
              La voix des jeunes de Cocody. Engagez-vous pour créer un impact
              positif dans notre communauté à travers des actions concrètes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={footerSettings.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook U-Report Cocody" className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white transition-all hover:-translate-y-0.5 hover:border-ureport-blue hover:bg-ureport-blue">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.88 3.78-3.88 1.1 0 2.25.2 2.25.2v2.48H15.2c-1.25 0-1.64.78-1.64 1.57V12h2.8l-.45 2.89h-2.35v6.99A10 10 0 0 0 22 12Z" /></svg>
              </a>
              <a href={footerSettings.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram U-Report Cocody" className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white transition-all hover:-translate-y-0.5 hover:border-ureport-blue hover:bg-ureport-blue">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5a3.95 3.95 0 0 0 3.95 3.95h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95h-8.5Zm9.2 1.35a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z" /></svg>
              </a>
              <a href={footerSettings.tiktok_url} target="_blank" rel="noopener noreferrer" aria-label="TikTok U-Report Cocody" className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white transition-all hover:-translate-y-0.5 hover:border-ureport-blue hover:bg-ureport-blue">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M14.5 3v10.55a4.45 4.45 0 1 1-3.2-4.28v2.14a2.36 2.36 0 1 0 1.1 2V3h2.1Zm2.05 0c.58 1.66 1.96 2.85 3.45 3.22v2.18a7.1 7.1 0 0 1-3.45-1.48V3Z" /></svg>
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
            <h3 className="font-heading font-bold text-xl mb-6 text-white">Liens Rapides</h3>
            <ul className="space-y-3">
              <li><Link href="/" className="group flex items-center justify-between rounded-2xl px-4 py-3 text-slate-300 transition-all hover:bg-white/10 hover:text-white"><span>Accueil</span><span className="opacity-0 transition-opacity group-hover:opacity-100">→</span></Link></li>
              <li><Link href="/events" className="group flex items-center justify-between rounded-2xl px-4 py-3 text-slate-300 transition-all hover:bg-white/10 hover:text-white"><span>Événements</span><span className="opacity-0 transition-opacity group-hover:opacity-100">→</span></Link></li>
              <li><Link href="/articles" className="group flex items-center justify-between rounded-2xl px-4 py-3 text-slate-300 transition-all hover:bg-white/10 hover:text-white"><span>Actualités</span><span className="opacity-0 transition-opacity group-hover:opacity-100">→</span></Link></li>
              <li><Link href="/gallery" className="group flex items-center justify-between rounded-2xl px-4 py-3 text-slate-300 transition-all hover:bg-white/10 hover:text-white"><span>Galerie</span><span className="opacity-0 transition-opacity group-hover:opacity-100">→</span></Link></li>
              <li><Link href="/about" className="group flex items-center justify-between rounded-2xl px-4 py-3 text-slate-300 transition-all hover:bg-white/10 hover:text-white"><span>À Propos</span><span className="opacity-0 transition-opacity group-hover:opacity-100">→</span></Link></li>
            </ul>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
            <h3 className="font-heading font-bold text-xl mb-6 text-white">{footerSettings.footer_contact_title}</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-slate-300">
                <MapPin className="h-5 w-5 text-ureport-blue shrink-0 mt-1" />
                <span className="whitespace-pre-line leading-7">{footerSettings.footer_contact_address}</span>
              </li>
              <li className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-slate-300">
                <Phone className="h-5 w-5 text-ureport-blue shrink-0" />
                <span>{footerSettings.footer_contact_phone}</span>
              </li>
              <li className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-slate-300">
                <Mail className="h-5 w-5 text-ureport-blue shrink-0" />
                <span>{footerSettings.footer_contact_email}</span>
              </li>
            </ul>
          </div>

          {/* Newsletter masquée temporairement */}
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-center text-sm text-slate-400 md:text-left">© {new Date().getFullYear()} U-Report Cocody. Tous droits réservés. Une initiative soutenue par l&apos;UNICEF.</p>
          <div className="flex justify-center gap-5 text-sm text-slate-400 md:justify-end">
            <a href="#" className="hover:text-white transition-colors">Mentions légales</a>
            <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
