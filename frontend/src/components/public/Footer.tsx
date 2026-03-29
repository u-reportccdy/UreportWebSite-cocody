import React from 'react';
import {
  Megaphone,
  Share2,
  Mail,
  MapPin,
  Phone } from
'lucide-react';
import { Link } from './Link';
export function Footer() {
  return (
    <footer className="bg-ureport-dark text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 bg-white/95 p-3 rounded-2xl w-fit shadow-sm" translate="no">
                <div className="flex flex-col items-start select-none">
                  <div className="flex items-baseline">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-ureport-blue from-50% to-black to-50% font-black text-3xl tracking-tighter leading-none">
                      U
                    </span>
                    <span className="text-black font-bold text-2xl ml-0.5 tracking-tight leading-none">
                      Report
                    </span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-ureport-blue mt-0.5 leading-none self-end mr-0.5">
                    Cocody
                  </span>
                </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              La voix des jeunes de Cocody. Engagez-vous pour créer un impact
              positif dans notre communauté à travers des actions concrètes.
            </p>
            <div className="flex space-x-4 pt-2">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-ureport-blue transition-colors">
                <Share2 className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-ureport-blue transition-colors">
                <Share2 className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-ureport-blue transition-colors">
                <Share2 className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-6 text-white">
              Liens Rapides
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/"
                  className="text-gray-400 hover:text-ureport-gold transition-colors">
                  
                  Accueil
                </Link>
              </li>
              <li>
                <Link
                  href="/events"
                  className="text-gray-400 hover:text-ureport-gold transition-colors">
                  
                  Événements
                </Link>
              </li>
              <li>
                <Link
                  href="/articles"
                  className="text-gray-400 hover:text-ureport-gold transition-colors">
                  
                  Actualités
                </Link>
              </li>
              <li>
                <Link
                  href="/gallery"
                  className="text-gray-400 hover:text-ureport-gold transition-colors">
                  
                  Galerie
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-gray-400 hover:text-ureport-gold transition-colors">
                  
                  À Propos
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-6 text-white">
              Contact
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-gray-400">
                <MapPin className="h-5 w-5 text-ureport-blue shrink-0 mt-0.5" />
                <span>
                  Mairie de Cocody,
                  <br />
                  Abidjan, Côte d'Ivoire
                </span>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <Phone className="h-5 w-5 text-ureport-blue shrink-0" />
                <span>+225 00 00 00 00 00</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <Mail className="h-5 w-5 text-ureport-blue shrink-0" />
                <span>contact@ureportcocody.ci</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-6 text-white">
              Newsletter
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Restez informé de nos prochaines activités et opportunités
              d'engagement.
            </p>
            <form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Votre adresse email"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/40 text-white placeholder-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-ureport-blue focus:border-transparent" />
              
              <button
                type="submit"
                className="w-full px-4 py-3 rounded-xl bg-ureport-blue text-white font-semibold hover:bg-[#158bb8] transition-colors">
                
                S'abonner
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm text-center md:text-left">
            © {new Date().getFullYear()} U-Report Cocody. Tous droits réservés.
            Une initiative soutenue par l'UNICEF.
          </p>
          <div className="flex gap-4 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">
              Mentions légales
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Confidentialité
            </a>
          </div>
        </div>
      </div>
    </footer>);

}