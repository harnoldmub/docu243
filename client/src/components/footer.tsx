import { Shield, Phone, Mail, MapPin } from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-congo-darkBlue text-white">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">DOCU243</h3>
                <p className="text-sm text-white/70">Plateforme Nationale</p>
              </div>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              Infrastructure Publique Numérique de la République Démocratique du Congo.
              Services administratifs modernisés et accessibles à tous.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Services</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link href="/services" className="hover:text-white transition-colors" data-testid="footer-link-documents">
                  Documents Officiels
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-white transition-colors" data-testid="footer-link-actes">
                  Actes de Naissance
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-white transition-colors" data-testid="footer-link-passeport">
                  Passeport Biométrique
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-white transition-colors" data-testid="footer-link-certificats">
                  Certificats
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Aide</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link href="/suivi" className="hover:text-white transition-colors" data-testid="footer-link-suivi">
                  Suivi de Dossier
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors" data-testid="footer-link-faq">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors" data-testid="footer-link-guide">
                  Guide Utilisateur
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors" data-testid="footer-link-contact">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Contact</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+243 81 000 0243</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>support@docu243.cd</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>
                  Boulevard du 30 Juin<br />
                  Kinshasa, RDC
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-sm text-white/50">
            © 2024 DOCU243 - République Démocratique du Congo. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4 text-sm text-white/50">
            <a href="#" className="hover:text-white transition-colors" data-testid="footer-link-mentions">
              Mentions légales
            </a>
            <a href="#" className="hover:text-white transition-colors" data-testid="footer-link-confidentialite">
              Confidentialité
            </a>
            <a href="#" className="hover:text-white transition-colors" data-testid="footer-link-accessibilite">
              Accessibilité
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
