import { Link } from "wouter";
import { Logo } from "@/components/header";

const columns = [
  {
    title: "Démarches",
    links: [
      { href: "/catalogue", label: "Toutes les démarches" },
      { href: "/catalogue?categorie=Identit%C3%A9+et+voyage", label: "Identité et voyage" },
      { href: "/catalogue?categorie=%C3%89tat+civil+et+famille", label: "État civil et famille" },
      { href: "/catalogue?categorie=Entreprise+et+fiscalit%C3%A9", label: "Entreprise et fiscalité" },
      { href: "/parcours", label: "Que souhaitez-vous faire ?" },
    ],
  },
  {
    title: "Vous accompagner",
    links: [
      { href: "/comment-ca-marche", label: "Comment ça marche" },
      { href: "/aide", label: "Aide et questions fréquentes" },
      { href: "/aide#contact", label: "Contacter l'assistance" },
    ],
  },
  {
    title: "Mon espace",
    links: [
      { href: "/dashboard", label: "Mes dossiers" },
      { href: "/mes-documents", label: "Mes documents" },
      { href: "/auth?mode=register", label: "Créer mon compte" },
    ],
  },
  {
    title: "Informations",
    links: [
      { href: "/mentions-legales", label: "Mentions légales" },
      { href: "/confidentialite", label: "Confidentialité" },
      { href: "/conditions", label: "Conditions d'utilisation" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="on-blue bg-brand-night text-white print:hidden">
      <div className="tricolor" aria-hidden="true" />
      <div className="md-container grid gap-12 py-14 lg:grid-cols-[1.1fr_2fr] lg:py-20">
        <div className="max-w-sm space-y-5">
          <Link href="/" aria-label="MesDémarches, accueil" className="inline-block rounded-lg">
            <Logo variant="white" className="h-10 sm:h-11" />
          </Link>
          <p className="font-display text-2xl font-bold leading-tight">Vos démarches, simplement.</p>
          <p className="text-[0.9375rem] leading-relaxed text-white/75">
            MesDémarches effectue vos démarches administratives en RDC à votre place : vous envoyez vos documents et réglez en
            ligne, notre équipe s'occupe du reste et vous tient informé à chaque étape.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="mb-4 font-sans text-sm font-bold text-brand-yellow">{col.title}</h2>
              <ul className="space-y-1">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="inline-flex min-h-10 items-center text-[0.9375rem] text-white/85 underline-offset-4 transition-colors hover:text-white hover:underline"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="md-container flex flex-col gap-2 py-6 text-sm text-white/65 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} MesDémarches</p>
          <p>Les couleurs du site s'inspirent de celles de la RDC.</p>
        </div>
      </div>
    </footer>
  );
}
