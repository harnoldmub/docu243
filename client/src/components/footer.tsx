import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  ArrowUpRight
} from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-white/5 pt-20 pb-10 overflow-hidden relative">
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-amber-500 to-emerald-500" />

      <div className="mx-auto max-w-7xl px-4 relative z-10">
        <div className="grid gap-12 lg:grid-cols-12 mb-16">

          {/* Brand Block */}
          <div className="lg:col-span-4 space-y-6">
            <Link href="/" className="inline-flex items-center">
              <div className="px-1 py-1">
                <img
                  src="/logo.png"
                  alt="DOCU243"
                  className="h-20 w-auto sm:h-[5.5rem] object-contain drop-shadow-[0_10px_24px_rgba(15,23,42,0.22)]"
                />
              </div>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              La plateforme nationale de modernisation de l’administration.
              Simplifiez vos démarches, accélérez vos droits, construisez l’avenir du numérique en RDC.
            </p>
            <div className="flex gap-4">
              <a href="#" className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all"><Facebook className="h-4 w-4" /></a>
              <a href="#" className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all"><Twitter className="h-4 w-4" /></a>
              <a href="#" className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all"><Linkedin className="h-4 w-4" /></a>
            </div>
          </div>

          {/* Links Grid */}
          <div className="lg:col-span-2 space-y-6">
            <h4 className="text-white font-black text-sm uppercase tracking-widest">Procédures</h4>
            <ul className="space-y-3">
              <li><Link href="/procedure/passeport-biometrique" className="text-slate-400 hover:text-primary text-sm font-bold flex items-center gap-1 group">Passeport <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all" /></Link></li>
              <li><Link href="/catalogue?category=Etat%20Civil" className="text-slate-400 hover:text-primary text-sm font-bold flex items-center gap-1 group">État Civil <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all" /></Link></li>
              <li><Link href="/procedure/registre-de-commerce" className="text-slate-400 hover:text-primary text-sm font-bold flex items-center gap-1 group">RCCM <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all" /></Link></li>
              <li><Link href="/catalogue" className="text-slate-400 hover:text-primary text-sm font-bold flex items-center gap-1 group">Voir tout <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all" /></Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <h4 className="text-white font-black text-sm uppercase tracking-widest">Support</h4>
            <ul className="space-y-3">
              <li><Link href="/dashboard" className="text-slate-400 hover:text-primary text-sm font-bold">Suivi de dossier</Link></li>
              <li><Link href="/catalogue" className="text-slate-400 hover:text-primary text-sm font-bold">Centre d'aide</Link></li>
              <li><a href="mailto:contact@docu243.cd" className="text-slate-400 hover:text-primary text-sm font-bold">Nous contacter</a></li>
              <li><Link href="/auth" className="text-slate-400 hover:text-primary text-sm font-bold transition-all hover:translate-x-1">Espace Agent</Link></li>
            </ul>
          </div>

          {/* Contact Block */}
          <div className="lg:col-span-4 space-y-6">
            <h4 className="text-white font-black text-sm uppercase tracking-widest">Contact Officiel</h4>
            <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Assistance 24/7</div>
                  <div className="text-white font-bold">+243 81 000 0000</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Email Service</div>
                  <div className="text-white font-bold">contact@docu243.cd</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
            <img src="/flag.png" alt="RDC" className="h-4 w-auto object-contain shadow-sm" />
            <span className="text-white font-black text-[10px] tracking-[0.3em]">MINISTÈRE DU NUMÉRIQUE</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            <a href="mailto:contact@docu243.cd?subject=Politique%20de%20confidentialite%20DOCU243" className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Politique de Confidentialité</a>
            <a href="mailto:contact@docu243.cd?subject=Mentions%20legales%20DOCU243" className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Mentions Légales</a>
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">© 2024 DOCU243. TOUS DROITS RÉSERVÉS.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
