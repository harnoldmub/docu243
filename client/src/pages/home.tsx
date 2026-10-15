import { Link } from "wouter";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  FileSearch,
  FileUp,
  FolderOpen,
  MapPin,
  MonitorSmartphone,
  RefreshCw,
  Search,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useProcedures } from "@/hooks/use-procedures";
import { useReveal } from "@/hooks/use-reveal";
import { Button } from "@/components/ui/button";
import { Picture } from "@/components/picture";
import { SearchCombobox } from "@/components/search-combobox";
import { ProcedureCard, ProcedureCardSkeleton } from "@/components/procedure-card";
import { ErrorState, EmptyState } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { FaqAccordion } from "@/components/faq";
import { GOALS } from "@/lib/goals";
import { authHref } from "@/lib/auth-links";
import { cn } from "@/lib/utils";

export default function Home() {
  useReveal();
  const { user } = useAuth();
  const trackHref = user ? "/dashboard" : authHref("login", "/dashboard");

  return (
    <>
      <Hero trackHref={trackHref} />
      <CommonProcedures />
      <Goals />
      <HowItWorks />
      <HumanSection />
      <CitizenSpacePreview />
      <FaqSection />
      <FinalCta />
    </>
  );
}

/* ------------------------------------------------------------------ */

function Hero({ trackHref }: { trackHref: string }) {
  return (
    <section className="relative overflow-x-clip bg-white" aria-labelledby="hero-title">
      {/* Big blue field on the right, bleeding to the viewport edge on desktop. */}
      <div className="absolute inset-y-0 right-0 hidden w-[44%] bg-brand-deep lg:block" aria-hidden="true" />
      <div className="md-container relative grid items-center gap-8 pb-12 pt-0 lg:min-h-[calc(100svh-82px)] lg:grid-cols-[1.08fr_0.92fr] lg:gap-6 lg:py-16">
        <div className="order-2 pt-4 lg:order-1 lg:pr-10 lg:pt-0">
          <p className="hero-rise kicker inline-flex items-center gap-2.5 text-brand-ink" style={{ animationDelay: "60ms" }}>
            <span className="h-3 w-3 rounded-[3px] bg-brand-red" aria-hidden="true" />
            Vos démarches administratives en RDC
          </p>
          <h1 id="hero-title" className="hero-rise display-hero mt-5 text-brand-ink" style={{ animationDelay: "120ms" }}>
            Vos démarches.
            <br />
            <span className="relative inline-block">
              Votre avenir.
              <span className="absolute -bottom-1 left-0 h-[0.14em] w-[62%] rounded-full bg-brand-yellow" aria-hidden="true" />
            </span>
          </h1>
          <p className="hero-rise lead mt-7 max-w-[34rem] text-brand-ink-2" style={{ animationDelay: "200ms" }}>
            Choisissez votre démarche, envoyez vos documents depuis votre téléphone et réglez en ligne. Nous faisons la démarche à votre place, vous suivez chaque étape.
          </p>
          <div className="hero-rise mt-8 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "260ms" }}>
            <Button asChild size="xl">
              <a href="#recherche-demarche">
                Trouver ma démarche <ArrowRight aria-hidden="true" />
              </a>
            </Button>
            <Button asChild size="xl" variant="outline">
              <Link href={trackHref}>Suivre mon dossier</Link>
            </Button>
          </div>
          <div id="recherche-demarche" className="hero-rise relative z-20 mt-10 scroll-mt-28 rounded-2xl bg-brand-mist p-4 sm:p-6" style={{ animationDelay: "320ms" }}>
            <SearchCombobox id="hero-search" />
          </div>
        </div>

        <div className="hero-slide relative order-1 -mx-4 sm:mx-0 lg:order-2" style={{ animationDelay: "80ms" }}>
          <div className="relative bg-brand-deep px-4 pb-0 pt-6 sm:rounded-[28px] sm:px-8 sm:pt-8 lg:rounded-none lg:bg-transparent lg:p-0">
            {/* Yellow block and red tab behind the photo */}
            <div className="absolute right-2 top-2 h-[38%] w-[46%] rounded-[24px] bg-brand-yellow sm:right-4 sm:top-4 lg:-right-6 lg:-top-6" aria-hidden="true" />
            <div className="absolute left-0 top-[16%] hidden h-20 w-3 rounded-r-md bg-brand-red sm:block lg:-left-5 lg:rounded-md" aria-hidden="true" />
            <div className="relative mx-auto max-w-[520px] overflow-hidden rounded-t-[24px] sm:rounded-[24px]">
              <Picture
                name="maman-documents"
                priority
                sizes="(min-width: 1024px) 520px, (min-width: 640px) 80vw, 100vw"
                className="aspect-[4/5] max-h-[48svh] w-full sm:max-h-none"
                imgClassName="object-[50%_12%]"
              />
            </div>
            <TrackingExample />
          </div>
        </div>
      </div>
    </section>
  );
}

function TrackingExample() {
  return (
    <figure className="absolute -bottom-6 left-4 hidden w-[min(300px,78%)] sm:block rounded-2xl bg-white p-4 shadow-float sm:left-0 lg:-left-16 lg:bottom-10" aria-label="Exemple de suivi de dossier">
      <figcaption className="text-xs font-semibold text-brand-ink-2">Exemple de suivi</figcaption>
      <p className="mt-1 font-display text-[1.0625rem] font-bold text-brand-ink">Attestation de résidence</p>
      <ol className="mt-3 flex items-center gap-1.5" aria-label="Étape 2 sur 3">
        <li className="h-1.5 flex-1 rounded-full bg-brand-royal" />
        <li className="h-1.5 flex-1 rounded-full bg-brand-royal" />
        <li className="h-1.5 flex-1 rounded-full bg-brand-line" />
      </ol>
      <div className="mt-3 flex items-center justify-between gap-2">
        <StatusBadge status="under_review" />
        <span className="text-xs text-brand-ink-2">Étape 2 sur 3</span>
      </div>
    </figure>
  );
}

/* ------------------------------------------------------------------ */

function SectionHeading({ title, intro, className, id }: { title: React.ReactNode; intro?: React.ReactNode; className?: string; id?: string }) {
  return (
    <div className={cn("max-w-2xl", className)} data-reveal>
      <h2 id={id} className="display-1">
        {title}
      </h2>
      {intro && <p className="lead mt-4 text-brand-ink-2">{intro}</p>}
    </div>
  );
}

function CommonProcedures() {
  const { data, isLoading, isError, refetch, isRefetching } = useProcedures();
  const common = (data ?? []).filter((p) => p.isPriority).sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 6);

  return (
    <section className="bg-brand-mist py-20 lg:py-28" aria-labelledby="common-title">
      <div className="md-container">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            id="common-title"
            title="Démarches courantes"
            intro="Prix total affiché : frais officiels et frais de service MesDémarches. Nous nous chargeons du reste."
          />
          <Link href="/catalogue" className="link-arrow shrink-0" data-reveal>
            Voir toutes les démarches <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-12">
          {isLoading || isRefetching ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Chargement des démarches">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProcedureCardSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <ErrorState message="Les démarches n'ont pas pu être chargées." onRetry={() => refetch()} />
          ) : common.length === 0 ? (
            <EmptyState
              icon={<FileSearch className="h-6 w-6" />}
              title="Aucune démarche mise en avant pour le moment"
              action={
                <Button asChild>
                  <Link href="/catalogue">Parcourir le catalogue</Link>
                </Button>
              }
            />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {common.map((p) => (
                <li key={p.id} data-reveal>
                  <ProcedureCard procedure={p} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Goals() {
  const featured = GOALS.filter((g) => g.photo);
  const others = GOALS.filter((g) => !g.photo);
  return (
    <section className="bg-brand-yellow py-20 lg:py-28" aria-labelledby="goals-title">
      <div className="md-container">
        <SectionHeading
          id="goals-title"
          title="Que souhaitez-vous faire ?"
          intro={<span className="text-brand-ink/80">Partez de votre projet : nous regroupons les démarches utiles et leur ordre quand il est confirmé.</span>}
        />
        <ul className="mt-12 grid gap-4 md:grid-cols-6">
          {featured.map((g, i) => (
            <li key={g.id} data-reveal className={i < 2 ? "md:col-span-3" : "md:col-span-2"}>
              <Link
                href={`/parcours#${g.id}`}
                className="group relative block h-full overflow-hidden rounded-[22px] bg-brand-ink text-white"
              >
                <Picture
                  name={g.photo!}
                  sizes={i < 2 ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 33vw, 100vw"}
                  className={i < 2 ? "aspect-[4/3] md:aspect-[16/10]" : "aspect-[4/3]"}
                  imgClassName="object-[50%_30%] transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-brand-ink/90 via-brand-ink/60 to-transparent p-5 pt-16">
                  <span>
                    <span className="block font-display text-2xl font-bold">{g.title}</span>
                    <span className="mt-1 block text-[0.9375rem] text-white/85">{g.summary}</span>
                  </span>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-brand-ink transition-transform duration-200 group-hover:translate-x-1">
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((g) => (
            <li key={g.id} data-reveal>
              <Link
                href={`/parcours#${g.id}`}
                className="group flex h-full min-h-[88px] items-center justify-between gap-3 rounded-2xl bg-white/70 px-5 py-4 font-semibold text-brand-ink transition-colors duration-200 hover:bg-white"
              >
                <span>
                  <span className="block font-display text-[1.0625rem] font-bold leading-tight">{g.title}</span>
                  <span className="mt-0.5 block text-sm font-normal text-brand-ink/75">{g.summary}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export const HOW_STEPS = [
  {
    title: "Choisissez votre démarche",
    text: "Cherchez par nom ou par projet. La fiche indique les pièces à fournir, le délai et le prix total : frais officiels et frais de service.",
    icon: Search,
  },
  {
    title: "Envoyez vos documents et réglez",
    text: "Photographiez vos pièces avec votre téléphone, vérifiez votre dossier puis payez en ligne par carte. Vous recevez aussitôt la confirmation et votre reçu.",
    icon: FileUp,
  },
  {
    title: "Nous faisons la démarche",
    text: "Notre équipe dépose votre dossier auprès de l'administration et met à jour son statut. Si votre présence est indispensable, par exemple pour un enrôlement biométrique, nous vous le disons.",
    icon: Bell,
  },
];

export function HowItWorksSteps() {
  return (
    <ol className="grid gap-8 md:grid-cols-3 md:gap-6">
      {HOW_STEPS.map((s, i) => (
        <li key={s.title} className="relative" data-reveal>
          <div className="flex items-center gap-4">
            <span className="font-display text-[3.5rem] font-extrabold leading-none text-brand-royal" aria-hidden="true">
              {i + 1}
            </span>
            <span className="h-px flex-1 bg-brand-line" aria-hidden="true" />
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-sky text-brand-royal">
              <s.icon className="h-6 w-6" aria-hidden="true" />
            </span>
          </div>
          <h3 className="title-3 mt-5 text-brand-ink">
            <span className="sr-only">Étape {i + 1} : </span>
            {s.title}
          </h3>
          <p className="mt-2 text-brand-ink-2">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}

function HowItWorks() {
  return (
    <section className="bg-white py-20 lg:py-28" aria-labelledby="how-title" id="comment-ca-marche">
      <div className="md-container">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <SectionHeading id="how-title" title={<>Trois étapes, <br className="hidden sm:block" />nous faisons le reste.</>} />
          <div className="relative overflow-hidden rounded-[22px]" data-reveal>
            <Picture name="guichet" sizes="(min-width: 1024px) 640px, 100vw" className="aspect-[16/9]" />
            <p className="absolute bottom-3 left-3 right-3 flex items-start gap-2 rounded-xl bg-white/95 p-3 text-sm text-brand-ink sm:right-auto sm:max-w-sm">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" aria-hidden="true" />
              Certaines démarches demandent un passage au guichet, un enrôlement ou un retrait en personne.
            </p>
          </div>
        </div>
        <div className="mt-14">
          <HowItWorksSteps />
        </div>
        <Link href="/comment-ca-marche" className="link-arrow mt-10" data-reveal>
          Comprendre les statuts de votre dossier <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function HumanSection() {
  const features = [
    { icon: FileSearch, text: "Une liste de pièces adaptée à votre situation, avant de commencer." },
    { icon: MonitorSmartphone, text: "Votre dossier constitué en ligne et payé par carte, sans file d'attente." },
    { icon: Bell, text: "Notre équipe s'occupe de l'administration et vous prévient à chaque étape." },
    { icon: RefreshCw, text: "Une pièce à corriger ? Remplacez-la sans refaire tout le dossier ni payer de nouveau." },
  ];
  return (
    <section className="overflow-hidden bg-brand-mist py-20 lg:py-28" aria-labelledby="human-title">
      <div className="md-container grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="relative" data-reveal>
          <div className="absolute -left-4 -top-4 h-2/3 w-2/3 rounded-[28px] bg-brand-royal sm:-left-8 sm:-top-8" aria-hidden="true" />
          <Picture name="citoyenne-telephone" sizes="(min-width: 1024px) 600px, 100vw" className="relative aspect-[3/2] overflow-hidden rounded-[24px]" />
        </div>
        <div>
          <SectionHeading
            id="human-title"
            title={
              <>
                Moins de déplacements.
                <br />
                Plus de temps pour vous.
              </>
            }
          />
          <ul className="mt-8 space-y-4">
            {features.map((f) => (
              <li key={f.text} className="flex items-start gap-4" data-reveal>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-royal shadow-card">
                  <f.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="pt-2 text-brand-ink">{f.text}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 border-l-4 border-brand-yellow pl-4 text-[0.9375rem] text-brand-ink-2" data-reveal>
            Certaines étapes demandent votre présence, comme l'enrôlement biométrique du passeport. La fiche de chaque démarche
            vous le précise avant de commencer.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

const DEMO = [
  { title: "Attestation de résidence", ref: "DOCU_8F21C4", status: "pending_user_action", updated: "Mis à jour hier", next: "Remplacer la preuve de résidence", pieces: "Payé, 1 pièce à remplacer" },
  { title: "Certificat de bonne vie et mœurs", ref: "DOCU_3A90E1", status: "under_review", updated: "Mis à jour il y a 3 jours", next: "Aucune action de votre part", pieces: "Payé" },
  { title: "Acte de naissance", ref: "DOCU_77B0D2", status: "ready", updated: "Mis à jour aujourd'hui", next: "Récupérer votre document", pieces: "Payé" },
];

function CitizenSpacePreview() {
  return (
    <section className="on-blue relative overflow-hidden bg-brand-royal py-20 text-white lg:py-28" aria-labelledby="space-title">
      <div className="md-container grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div data-reveal>
          <h2 id="space-title" className="display-1">
            Votre espace, <br className="hidden sm:block" />
            vos dossiers.
          </h2>
          <p className="lead mt-5 text-white/85">
            Un seul endroit pour voir où notre équipe en est de chaque dossier, ce qu'il manque et la prochaine étape.
          </p>
          <ul className="mt-8 space-y-3 text-white/90">
            {["Statut écrit en toutes lettres", "Paiement et reçu", "Pièces à compléter ou à remplacer", "Historique détaillé de chaque dossier"].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-yellow" aria-hidden="true" /> {t}
              </li>
            ))}
          </ul>
        </div>

        <figure className="rounded-[24px] bg-white p-4 text-brand-ink shadow-float sm:p-6" data-reveal aria-label="Démonstration de l'espace citoyen avec des données fictives">
          <figcaption className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 font-display text-lg font-bold">
              <FolderOpen className="h-5 w-5 text-brand-royal" aria-hidden="true" /> Mes dossiers
            </span>
            <span className="rounded-full bg-brand-yellow px-3 py-1 text-xs font-bold text-brand-ink">Démonstration, données fictives</span>
          </figcaption>
          <ul className="divide-y divide-brand-line rounded-2xl border border-brand-line">
            {DEMO.map((d) => (
              <li key={d.ref} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{d.title}</p>
                    <StatusBadge status={d.status} />
                  </div>
                  <p className="mt-1 text-sm text-brand-ink-2">
                    {d.ref} · {d.updated} · {d.pieces}
                  </p>
                  <p className="mt-2 text-sm">
                    <span className="text-brand-ink-2">Prochaine action : </span>
                    <span className="font-semibold">{d.next}</span>
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-royal" aria-hidden="true">
                  Voir le détail <ArrowRight className="h-4 w-4" />
                </span>
              </li>
            ))}
          </ul>
        </figure>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function FaqSection() {
  return (
    <section className="bg-white py-20 lg:py-28" aria-labelledby="faq-title">
      <div className="md-container grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <SectionHeading id="faq-title" title="Questions fréquentes" />
          <Link href="/aide" className="link-arrow mt-6" data-reveal>
            Toute l'aide <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div data-reveal>
          <FaqAccordion />
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="bg-white pb-20 lg:pb-28" aria-labelledby="cta-title">
      <div className="md-container">
        <div className="on-blue relative grid overflow-hidden rounded-[28px] bg-brand-royal text-white lg:grid-cols-[1.2fr_0.8fr]" data-reveal>
          <div className="relative z-10 p-8 sm:p-12 lg:p-16">
            <h2 id="cta-title" className="display-1 max-w-xl">
              Votre prochaine démarche commence ici.
            </h2>
            <Button asChild size="xl" variant="yellow" className="mt-8">
              <Link href="/catalogue">
                Explorer les démarches <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <div className="relative min-h-[220px] lg:min-h-0">
            <div className="absolute left-0 top-0 z-10 hidden h-full w-3 bg-brand-yellow lg:block" aria-hidden="true" />
            <Picture name="banniere-finale" sizes="(min-width: 1024px) 560px, 100vw" className="absolute inset-0" imgClassName="object-[82%_30%]" />
          </div>
        </div>
      </div>
    </section>
  );
}
