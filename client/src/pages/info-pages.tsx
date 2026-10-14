import { Link } from "wouter";
import { ArrowRight, Ban, ExternalLink, Fingerprint, Landmark, Wallet } from "lucide-react";
import { FaqAccordion } from "@/components/faq";
import { HowItWorksSteps } from "@/pages/home";
import { APPLICATION_STATUS, StatusBadge } from "@/components/status-badge";
import { AvailabilityBadge } from "@/components/procedure-card";
import { Notice } from "@/components/states";
import { useReveal } from "@/hooks/use-reveal";
import { useProcedures } from "@/hooks/use-procedures";
import { GOALS } from "@/lib/goals";
import { Picture } from "@/components/picture";
import { cn } from "@/lib/utils";

export function PageHeader({ title, intro, tone = "deep", children }: { title: string; intro?: string; tone?: "deep" | "yellow" | "mist"; children?: React.ReactNode }) {
  const tones = {
    deep: "on-blue bg-brand-deep text-white",
    yellow: "bg-brand-yellow text-brand-ink",
    mist: "bg-brand-mist text-brand-ink",
  };
  return (
    <section className={tones[tone]}>
      <div className="md-container py-12 lg:py-16">
        <h1 className="display-1 max-w-3xl">{title}</h1>
        {intro && <p className={cn("lead mt-4 max-w-2xl", tone === "deep" ? "text-white/80" : "text-brand-ink/75")}>{intro}</p>}
        {children}
      </div>
      {tone === "deep" && <div className="tricolor" style={{ ["--tricolor-h" as string]: "8px" }} aria-hidden="true" />}
    </section>
  );
}

export function HowItWorksPage() {
  useReveal();
  const modes = [
    { procedure: { status: "available", channel: "docu243" }, text: "Vous constituez votre dossier dans MesDémarches : informations, pièces, envoi et suivi." },
    { procedure: { status: "coming_soon", channel: "external" }, text: "Le dépôt se fait sur le site de l'administration. La fiche vous aide à préparer les pièces et vous y conduit." },
    { procedure: { status: "coming_soon", channel: "info" }, text: "La démarche se fait au guichet de l'administration. La fiche vous dit quoi apporter et où aller." },
    { procedure: { status: "coming_soon", channel: "docu243" }, text: "La démarche n'est pas encore ouverte en ligne. Les informations sont indicatives." },
  ] as const;

  return (
    <>
      <PageHeader title="Comment ça marche" intro="De la recherche au retrait du document : ce que fait MesDémarches, et ce qui reste du ressort de l'administration." />
      <section className="bg-white py-16 lg:py-24">
        <div className="md-container">
          <HowItWorksSteps />
        </div>
      </section>

      <section className="bg-brand-mist py-16 lg:py-24" aria-labelledby="modes-title">
        <div className="md-container">
          <h2 id="modes-title" className="display-2 max-w-2xl" data-reveal>
            Quatre façons de faire une démarche
          </h2>
          <ul className="mt-10 grid gap-4 md:grid-cols-2">
            {modes.map((m) => (
              <li key={m.text} className="rounded-2xl bg-white p-6" data-reveal>
                <AvailabilityBadge procedure={m.procedure} />
                <p className="mt-3 text-brand-ink">{m.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-24" aria-labelledby="statuts-title">
        <div className="md-container grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div data-reveal>
            <h2 id="statuts-title" className="display-2">Les statuts de votre dossier</h2>
            <p className="mt-4 text-brand-ink-2">Chaque statut est écrit en toutes lettres et vous dit ce que vous avez à faire.</p>
          </div>
          <dl className="divide-y divide-brand-line border-y border-brand-line">
            {Object.entries(APPLICATION_STATUS).map(([key, s]) => (
              <div key={key} className="grid gap-2 py-4 sm:grid-cols-[200px_1fr] sm:items-start">
                <dt>
                  <StatusBadge status={key} />
                </dt>
                <dd className="text-brand-ink">{s.next}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="on-blue bg-brand-royal py-16 text-white lg:py-24" aria-labelledby="limites-title">
        <div className="md-container">
          <h2 id="limites-title" className="display-2 max-w-2xl" data-reveal>
            Ce que MesDémarches ne fait pas
          </h2>
          <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Wallet, text: "Encaisser des paiements. Les frais se règlent auprès de l'administration." },
              { icon: Fingerprint, text: "Collecter des données biométriques. L'enrôlement se fait dans les centres officiels." },
              { icon: Landmark, text: "Décider à la place de l'administration. Les décisions et documents viennent d'elle." },
              { icon: Ban, text: "Créer de faux reçus, QR codes ou numéros administratifs." },
            ].map((x) => (
              <li key={x.text} className="flex flex-col gap-3" data-reveal>
                <x.icon className="h-7 w-7 text-brand-yellow" aria-hidden="true" />
                <p className="text-white/90">{x.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

export function HelpPage() {
  return (
    <>
      <PageHeader title="Aide" intro="Les réponses aux questions les plus fréquentes sur les démarches, votre compte et vos dossiers." />
      <section className="bg-white py-16 lg:py-20">
        <div className="md-container grid gap-12 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <h2 className="display-2 mb-6">Questions fréquentes</h2>
            <FaqAccordion />
          </div>
          <aside className="space-y-6">
            <section id="compte" className="scroll-mt-28 rounded-2xl bg-brand-mist p-6">
              <h2 className="title-3">Votre compte</h2>
              <p className="mt-3 text-brand-ink-2">
                La réinitialisation du mot de passe en ligne n'est pas encore disponible. Si vous ne parvenez plus à vous connecter,
                contactez l'assistance dès que ses coordonnées seront publiées ci-dessous.
              </p>
              <p className="mt-3 text-brand-ink-2">
                Vous pouvez consulter les informations de votre compte dans <Link href="/profil" className="font-semibold text-brand-royal underline underline-offset-4">Mon profil</Link>.
              </p>
            </section>
            <section id="contact" className="scroll-mt-28 rounded-2xl border-2 border-brand-yellow p-6">
              <h2 className="title-3">Contacter l'assistance</h2>
              <p className="mt-3 text-brand-ink-2">
                Les coordonnées de l'assistance MesDémarches (adresse e-mail, téléphone, horaires) sont en cours de validation et seront
                publiées ici.
              </p>
              <p className="mt-3 text-brand-ink-2">
                Pour une question sur une décision ou un document officiel, adressez-vous à l'administration indiquée sur la fiche de la
                démarche.
              </p>
            </section>
            <section className="rounded-2xl bg-brand-mist p-6">
              <h2 className="title-3">Envoyer vos pièces</h2>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-brand-ink-2">
                <li>Formats : PDF, JPG, PNG ou WEBP.</li>
                <li>Taille : selon la limite indiquée sous chaque pièce, 10 Mo au maximum.</li>
                <li>Photographiez le document à plat, en entier, sans reflet.</li>
              </ul>
            </section>
          </aside>
        </div>
      </section>
    </>
  );
}

export function GoalsPage() {
  const { data: procedures = [] } = useProcedures();
  const published = new Set(procedures.map((p) => p.slug));

  return (
    <>
      <PageHeader
        tone="yellow"
        title="Que souhaitez-vous faire ?"
        intro="Partez de votre projet. Nous regroupons les démarches utiles et indiquons leur ordre quand une source le confirme."
      >
        <nav aria-label="Projets" className="mt-8">
          <ul className="flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <li key={g.id}>
                <a href={`#${g.id}`} className="inline-flex min-h-11 items-center rounded-full bg-white/80 px-4 font-semibold transition-colors hover:bg-white">
                  {g.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHeader>

      <div className="bg-white">
        {GOALS.map((g, gi) => {
          const List = g.ordered ? "ol" : "ul";
          return (
            <section key={g.id} id={g.id} className={cn("scroll-mt-24 py-14 lg:py-20", gi % 2 === 1 && "bg-brand-mist")} aria-labelledby={`${g.id}-title`}>
              <div className="md-container grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
                <div>
                  <h2 id={`${g.id}-title`} className="display-2">{g.title}</h2>
                  <p className="mt-3 text-lg text-brand-ink-2">{g.summary}</p>
                  {g.photo && (
                    <Picture name={g.photo} sizes="(min-width: 1024px) 420px, 100vw" className="mt-8 hidden aspect-[4/3] overflow-hidden rounded-[20px] lg:block" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-ink-2">{g.ordered ? g.orderNote ?? "Dans cet ordre" : "Sans ordre imposé"}</p>
                  <List className="mt-4 space-y-3">
                    {g.steps.map((s, i) => {
                      const linkable = s.slug && published.has(s.slug);
                      const inner = (
                        <>
                          {g.ordered ? (
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-royal font-display font-bold text-white">{i + 1}</span>
                          ) : (
                            <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-red" aria-hidden="true" />
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block font-semibold text-brand-ink">{s.label}</span>
                            {s.description && <span className="mt-0.5 block text-[0.9375rem] text-brand-ink-2">{s.description}</span>}
                          </span>
                          {(linkable || s.url) && (
                            <span className="shrink-0 self-center text-brand-royal" aria-hidden="true">
                              {s.url ? <ExternalLink className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
                            </span>
                          )}
                        </>
                      );
                      const cls = "flex items-start gap-4 rounded-2xl border border-brand-line bg-white p-4";
                      return (
                        <li key={s.label}>
                          {linkable ? (
                            <Link href={`/procedure/${s.slug}`} className={cn(cls, "transition-colors hover:border-brand-royal")}>
                              {inner}
                            </Link>
                          ) : s.url ? (
                            <a href={s.url} target="_blank" rel="noopener noreferrer" className={cn(cls, "transition-colors hover:border-brand-royal")}>
                              {inner}
                              <span className="sr-only">(site officiel, nouvel onglet)</span>
                            </a>
                          ) : (
                            <div className={cls}>{inner}</div>
                          )}
                        </li>
                      );
                    })}
                  </List>
                  {g.note && (
                    <Notice tone="neutral" className="mt-5">
                      {g.note}
                    </Notice>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
