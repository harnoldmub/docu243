import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileDown,
  FileText,
  FileUp,
  Globe,
  HelpCircle,
  Info,
  KeyRound,
  Landmark,
  MapPin,
  MonitorSmartphone,
  ScrollText,
  Wallet,
} from "lucide-react";
import type { ChecklistKind, ProcedureField, ProcedureGuide, ProcedureRequiredDoc } from "@shared/schema";
import { apiRequest, ApiError } from "@/lib/queryClient";
import { useAuth, isStaffRole } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { AvailabilityBadge } from "@/components/procedure-card";
import { ErrorState, Notice } from "@/components/states";
import { availability, feeLabel, formatDate, formatMoney, priceOf, type ProcedureWithGuide } from "@/lib/procedures";
import { authHref } from "@/lib/auth-links";
import { cn } from "@/lib/utils";
import { countries, countryName } from "@/lib/countries";

type Detail = ProcedureWithGuide & { fields: ProcedureField[]; requiredDocuments: ProcedureRequiredDoc[] };
type Checklist = NonNullable<ProcedureGuide["checklist"]>;

const KIND: Record<ChecklistKind, { title: string; icon: typeof FileText; hint: string }> = {
  prerequisite: { title: "À obtenir avant de commencer", icon: KeyRound, hint: "Prérequis" },
  upload: { title: "Documents à préparer", icon: FileUp, hint: "À fournir (copie ou scan)" },
  download: { title: "Formulaires à remplir", icon: FileDown, hint: "Formulaire" },
  original: { title: "Originaux à présenter en personne", icon: Landmark, hint: "Original" },
  generated: { title: "Documents remis pendant la démarche", icon: ScrollText, hint: "Remis pendant la démarche" },
  payment: { title: "Justificatifs de paiement", icon: Wallet, hint: "Paiement" },
};
const KIND_ORDER: ChecklistKind[] = ["prerequisite", "upload", "download", "original", "payment", "generated"];

export default function ProcedureDetail() {
  const [, params] = useRoute("/procedure/:slug");
  const slug = params?.slug ?? "";
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [passportCountry, setPassportCountry] = useState("");
  const [passportCity, setPassportCity] = useState("");

  const { data: procedure, isLoading, isError, error, refetch } = useQuery<Detail>({ queryKey: [`/api/procedures/${slug}`] });
  const { data: myApps = [] } = useQuery<Array<{ id: string; procedureId: string; status: string }>>({
    queryKey: ["/api/applications/me"],
    enabled: !!user && !isStaffRole(user.role),
  });

  const draft = procedure && myApps.find((a) => a.procedureId === procedure.id && ["draft", "pending_user_action"].includes(a.status));
  const returningAfterLogin = new URLSearchParams(window.location.search).get("start") === "1";

  const start = useMutation({
    mutationFn: async () => (await apiRequest("POST", "/api/applications", { procedureId: procedure?.id })).json(),
    onSuccess: (data) => setLocation(`/application/${data.id}`),
  });

  useEffect(() => {
    if (procedure) document.title = `${procedure.title} — MesDémarches`;
  }, [procedure]);

  if (isLoading) return <DetailSkeleton />;
  if (isError || !procedure) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="md-container py-16">
        {notFound ? (
          <div className="max-w-xl">
            <h1 className="display-2">Cette démarche est introuvable</h1>
            <p className="mt-4 text-brand-ink-2">Elle a peut-être changé d'adresse ou n'est pas encore publiée.</p>
            <Button asChild className="mt-6">
              <Link href="/catalogue">Voir toutes les démarches</Link>
            </Button>
          </div>
        ) : (
          <ErrorState message="La fiche n'a pas pu être chargée." onRetry={() => refetch()} />
        )}
      </div>
    );
  }

  const guide = procedure.guide ?? {};
  const a = availability(procedure);
  const fee = feeLabel(procedure);
  const loginHref = authHref("login", `/procedure/${procedure.slug}?start=1`);
  const externalLabel = procedure.institution.includes("DGI")
    ? "Continuer sur le site de la DGI"
    : `Continuer sur ${procedure.externalUrl ? new URL(procedure.externalUrl).hostname.replace(/^www\./, "") : "le portail officiel"}`;

  const cta =
    a.key === "online" ? (
      draft ? (
        <Button asChild size="lg" className="w-full">
          <Link href={`/application/${draft.id}`}>
            Reprendre mon dossier <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      ) : user ? (
        <Button size="lg" className="w-full" loading={start.isPending} onClick={() => start.mutate()}>
          Commencer ma demande {!start.isPending && <ArrowRight aria-hidden="true" />}
        </Button>
      ) : (
        <Button asChild size="lg" className="w-full">
          <Link href={loginHref}>
            Commencer ma demande <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      )
    ) : a.key === "external" && procedure.externalUrl ? (
      procedure.slug === "passeport-biometrique" && (!passportCountry || !passportCity.trim()) ? (
        <Button size="lg" className="w-full" onClick={() => document.getElementById(!passportCountry ? "passport-country" : "passport-city")?.focus()}>
          Choisir mon lieu d'abord <MapPin aria-hidden="true" />
        </Button>
      ) : (
        <Button asChild size="lg" className="w-full">
          <a href={procedure.externalUrl} target="_blank" rel="noopener noreferrer">
            {externalLabel} <ExternalLink aria-hidden="true" />
            <span className="sr-only">(nouvel onglet)</span>
          </a>
        </Button>
      )
    ) : null;

  const ctaHelp =
    a.key === "online"
      ? user
        ? "Remplissez votre dossier, envoyez vos documents et réglez en ligne : nous faisons le reste."
        : "Connectez-vous ou créez un compte : vous reviendrez ici ensuite."
      : a.key === "external"
        ? "Le dépôt se fait sur le site de l'administration. MesDémarches ne transmet pas votre dossier."
        : a.key === "info"
          ? "Cette démarche se fait auprès de l'administration. Utilisez cette fiche pour vous préparer."
          : "Cette démarche n'est pas encore ouverte en ligne. Les informations sont données à titre indicatif.";

  const price = priceOf(procedure);
  const summaryRows = [
    ...(price
      ? [
          { icon: Landmark, label: "Frais officiels", value: price.official > 0 ? formatMoney(price.official, "USD") : "Aucun", note: guide.feeNote },
          { icon: BadgeCheck, label: "Frais de service MesDémarches", value: formatMoney(price.service, "USD") },
          { icon: Wallet, label: "Total à régler", value: formatMoney(price.total, "USD"), note: "Paiement sécurisé par carte au moment de transmettre votre dossier." },
        ]
      : [
          { icon: Wallet, label: "Prix", value: "Tarif à venir", note: `Frais officiels en cours de fixation, plus ${formatMoney(procedure.serviceFee, "USD")} de frais de service.` },
        ]),
    { icon: Clock3, label: "Délai de traitement", value: guide.processingNote ?? "Non communiqué par l'administration" },
    { icon: Building2, label: "Institution", value: procedure.institution },
    ...(guide.territory ? [{ icon: MapPin, label: "Territoire", value: guide.territory }] : []),
  ];

  return (
    <div className="bg-white pb-28 lg:pb-0">
      {/* Header */}
      <section className="border-b border-brand-line bg-brand-mist">
        <div className="md-container pb-10 pt-6 lg:pb-14">
          <nav aria-label="Fil d'Ariane">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-brand-ink-2">
              <li>
                <Link href="/" className="underline-offset-4 hover:underline">Accueil</Link>
              </li>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
              <li>
                <Link href="/catalogue" className="underline-offset-4 hover:underline">Toutes les démarches</Link>
              </li>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
              <li>
                <Link href={`/catalogue?categorie=${encodeURIComponent(procedure.category)}`} className="underline-offset-4 hover:underline">
                  {procedure.category}
                </Link>
              </li>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
              <li aria-current="page" className="font-semibold text-brand-ink">{procedure.title}</li>
            </ol>
          </nav>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <AvailabilityBadge procedure={procedure} />
            {procedure.verifiedAt && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--st-success-bg)] px-2.5 py-1 text-[0.8125rem] font-semibold text-[var(--st-success)]">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> Vérifiée le {formatDate(procedure.verifiedAt)}
              </span>
            )}
          </div>
          <h1 className="display-1 mt-4 max-w-4xl text-brand-ink">{procedure.title}</h1>
          <p className="lead mt-4 max-w-3xl text-brand-ink-2">{procedure.description}</p>

          {/* Mobile summary */}
          <dl className="mt-8 grid grid-cols-2 gap-3 lg:hidden">
            <div className="rounded-xl bg-white p-3">
              <dt className="text-sm text-brand-ink-2">Prix total</dt>
              <dd className="font-semibold text-brand-ink">{fee.label}</dd>
            </div>
            <div className="rounded-xl bg-white p-3">
              <dt className="text-sm text-brand-ink-2">{a.key === "online" ? "Institution" : "Disponibilité"}</dt>
              <dd className="font-semibold text-brand-ink">{a.key === "online" ? procedure.institution : a.label}</dd>
            </div>
          </dl>
        </div>
      </section>

      <div className="md-container grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14 lg:py-14">
        <div className="min-w-0 space-y-12">
          {returningAfterLogin && user && a.key === "online" && !draft && (
            <Notice tone="success" icon={<Check />} title="Vous êtes connecté">
              Vous pouvez maintenant commencer votre demande.
            </Notice>
          )}
          {!procedure.verifiedAt && (
            <Notice tone="neutral" icon={<Info />} title="Fiche en cours de validation">
              {guide.sources?.length
                ? `Ces informations proviennent ${guide.sources.length > 1 ? "des sources officielles citées" : "de la source officielle citée"} en bas de page. Elles n'ont pas encore été validées par l'équipe MesDémarches.`
                : "Ces informations n'ont pas encore été confirmées par une source officielle. Vérifiez-les auprès de l'administration avant de vous déplacer."}
            </Notice>
          )}
          {guide.contradictory && (
            <Notice tone="warning" icon={<AlertTriangle />} title="Information à confirmer">
              Les sources consultées se contredisent sur certains points de cette démarche. Renseignez-vous auprès de l'administration.
            </Notice>
          )}

          {procedure.slug === "passeport-biometrique" && <PassportConsularOrientation country={passportCountry} city={passportCity} onCountryChange={setPassportCountry} onCityChange={setPassportCity} />}

          {guide.conditions && guide.conditions.length > 0 && (
            <Block title="À savoir avant de commencer">
              <ul className="space-y-3">
                {guide.conditions.map((c) => (
                  <li key={c} className="flex gap-3">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-royal" aria-hidden="true" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {guide.prerequisites && guide.prerequisites.length > 0 && (
            <div className="space-y-3">
              {guide.prerequisites.map((p) => (
                <div key={p.label} className="flex flex-col gap-3 rounded-2xl bg-brand-yellow p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-brand-ink/75">Prérequis : {p.label}</p>
                    <p className="font-display text-lg font-bold text-brand-ink">{p.question ?? "À obtenir avant de commencer"}</p>
                    {p.description && <p className="mt-1 text-[0.9375rem] text-brand-ink/80">{p.description}</p>}
                  </div>
                  {p.procedureSlug && (
                    <Link href={`/procedure/${p.procedureSlug}`} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-brand-ink px-4 font-semibold text-white hover:bg-brand-deep">
                      Voir la démarche <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}

          <Checklist procedure={procedure} />

          {a.key === "online" && procedure.requiredDocuments.length > 0 && (
            <Block
              title="Pièces à envoyer dans votre dossier"
              intro="Ce sont les pièces demandées par le formulaire MesDémarches pour cette démarche."
            >
              <ul className="divide-y divide-brand-line rounded-2xl border border-brand-line">
                {procedure.requiredDocuments.map((d) => (
                  <li key={d.id} className="flex gap-4 p-4">
                    <FileText className="mt-0.5 h-5 w-5 shrink-0 text-brand-royal" aria-hidden="true" />
                    <div>
                      <p className="font-semibold text-brand-ink">
                        {d.name}
                        <span className="ml-2 text-sm font-normal text-brand-ink-2">{d.required ? "Obligatoire" : "Facultative"}</span>
                      </p>
                      {d.description && <p className="text-[0.9375rem] text-brand-ink-2">{d.description}</p>}
                      <p className="mt-1 text-sm text-brand-ink-2">
                        Formats : {d.acceptedFormats.map((f) => f.toUpperCase()).join(", ")}. Taille maximale : {d.maxSizeMb} Mo.
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {a.key === "online" && procedure.fields.length > 0 && (
            <Block title="Informations demandées dans le formulaire">
              <ul className="grid gap-2 sm:grid-cols-2">
                {procedure.fields.map((f) => (
                  <li key={f.id} className="flex items-center gap-2 rounded-xl bg-brand-mist px-3 py-2.5 text-[0.9375rem]">
                    <Check className="h-4 w-4 shrink-0 text-brand-royal" aria-hidden="true" /> {f.label}
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {guide.steps && guide.steps.length > 0 && (
            <Block
              title="Les étapes"
              intro="Notre équipe effectue ces démarches auprès de l'administration à votre place. Les étapes marquées « En personne » demandent votre présence : nous vous indiquons quand et où vous présenter."
            >
              <ol className="relative space-y-6 border-l-2 border-brand-line pl-8">
                {guide.steps.map((s, i) => {
                  const where = s.where === "physical" ? { icon: MapPin, label: "En personne" } : s.where === "external" ? { icon: Globe, label: "Sur le portail officiel" } : { icon: MonitorSmartphone, label: "En ligne" };
                  return (
                    <li key={s.label} className="relative">
                      <span className="absolute -left-[49px] flex h-8 w-8 items-center justify-center rounded-full bg-brand-royal font-display text-sm font-bold text-white">
                        {i + 1}
                      </span>
                      <p className="font-semibold text-brand-ink">{s.label}</p>
                      {s.description && <p className="mt-1 text-[0.9375rem] text-brand-ink-2">{s.description}</p>}
                      <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink-2">
                        <where.icon className="h-4 w-4" aria-hidden="true" /> {where.label}
                      </p>
                    </li>
                  );
                })}
              </ol>
              {guide.appointmentNote && (
                <Notice tone="info" icon={<MapPin />} title="Présence en personne" className="mt-6">
                  {guide.appointmentNote}
                </Notice>
              )}
            </Block>
          )}

          {guide.outputDocument && (
            <Block title="Ce que vous obtenez">
              <p>{guide.outputDocument}</p>
            </Block>
          )}

          <Sources procedure={procedure} />

          <div className="flex flex-col gap-4 rounded-2xl border border-brand-line p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <HelpCircle className="mt-0.5 h-6 w-6 shrink-0 text-brand-royal" aria-hidden="true" />
              <div>
                <p className="font-semibold text-brand-ink">Une question sur cette démarche ?</p>
                <p className="text-[0.9375rem] text-brand-ink-2">Consultez l'aide ou adressez-vous à : {procedure.institution}.</p>
              </div>
            </div>
            <Link href="/aide" className="link-arrow shrink-0">
              Aide <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Summary */}
        <aside className="lg:block" aria-label="Résumé de la démarche">
          <div className="sticky top-28 overflow-hidden rounded-2xl border border-brand-line bg-white shadow-card">
            <div className="tricolor" aria-hidden="true" />
            <div className="p-6">
              <p className="font-display text-xl font-bold text-brand-ink">En résumé</p>
              <dl className="mt-5 space-y-4">
                {summaryRows.map((r) => (
                  <div key={r.label} className="flex gap-3">
                    <r.icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-royal" aria-hidden="true" />
                    <div className="min-w-0">
                      <dt className="text-sm text-brand-ink-2">{r.label}</dt>
                      <dd className="font-semibold text-brand-ink">{r.value}</dd>
                      {"note" in r && r.note && <dd className="mt-0.5 text-sm text-brand-ink-2">{r.note}</dd>}
                    </div>
                  </div>
                ))}
              </dl>
              {a.key !== "online" && (
                <div className="mt-6 border-t border-brand-line pt-6">
                  <p className="mb-1 text-sm text-brand-ink-2">Disponibilité</p>
                  <p className="font-semibold text-brand-ink">{a.label}</p>
                  <p className="mt-1 text-sm text-brand-ink-2">{a.description}</p>
                </div>
              )}
              {cta && <div className="mt-6 hidden lg:block">{cta}</div>}
              {start.isError && (
                <p role="alert" className="mt-3 text-sm font-semibold text-[var(--st-danger)]">
                  {(start.error as Error).message}
                </p>
              )}
              <p className="mt-3 hidden text-sm text-brand-ink-2 lg:block">{ctaHelp}</p>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile sticky action */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-line bg-white/95 p-3 lg:hidden" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        {cta ?? (
          <p className="flex min-h-11 items-center justify-center text-center text-sm font-semibold text-brand-ink-2">{ctaHelp}</p>
        )}
        {cta && <p className="mt-1.5 text-center text-xs text-brand-ink-2">{ctaHelp}</p>}
      </div>
    </div>
  );
}

function PassportConsularOrientation({ country, city, onCountryChange, onCityChange }: { country: string; city: string; onCountryChange: (value: string) => void; onCityChange: (value: string) => void }) {
  const hasLocation = !!country && !!city.trim();

  return (
    <section className="rounded-2xl border border-brand-line bg-brand-mist p-5 sm:p-7" aria-labelledby="consular-orientation-title">
      <div className="flex items-start gap-3">
        <MapPin className="mt-1 h-6 w-6 shrink-0 text-brand-royal" aria-hidden="true" />
        <div>
          <h2 id="consular-orientation-title" className="font-display text-xl font-bold text-brand-ink">Où faire votre capture biométrique ?</h2>
          <p className="mt-2 text-brand-ink-2">Choisissez le pays et la ville où vous vous trouvez. La capture du visage, des empreintes et de la signature se fait en personne, après l'inscription sur le portail officiel.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="passport-country" className="mb-1.5 block font-semibold text-brand-ink">Pays où vous vous trouvez</label>
          <select id="passport-country" className="field-input" value={country} onChange={(event) => onCountryChange(event.target.value)}>
            <option value="">Choisir un pays…</option>
            {countries.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="passport-city" className="mb-1.5 block font-semibold text-brand-ink">Votre ville</label>
          <input id="passport-city" className="field-input" value={city} onChange={(event) => onCityChange(event.target.value)} autoComplete="address-level2" maxLength={100} />
        </div>
      </div>
      {hasLocation && (
        <div className="mt-5 rounded-xl border border-brand-line bg-white p-5" role="status">
          {country === "FR" ? (
            <>
              <p className="font-bold text-brand-ink">Ambassade de la RDC en France · Paris</p>
              <p className="mt-1 text-brand-ink-2">32 cours Albert 1er, 75008 Paris. L'ambassade indique que la capture du passeport s'effectue sur rendez-vous à Paris.</p>
              <a href="https://ambardcparis.com/demande-de-passeport/" target="_blank" rel="noopener noreferrer" className="link-arrow mt-3 inline-flex min-h-11 items-center gap-2">Consulter la procédure et prendre rendez-vous <ExternalLink className="h-4 w-4" aria-hidden="true" /><span className="sr-only">(nouvel onglet)</span></a>
              {city.trim().toLocaleLowerCase("fr") !== "paris" && <p className="mt-2 text-sm text-brand-ink-2">Depuis {city.trim()}, vérifiez auprès de l'ambassade si un autre lieu de capture est habilité avant de vous déplacer.</p>}
            </>
          ) : country === "CD" ? (
            <>
              <p className="font-bold text-brand-ink">En République démocratique du Congo</p>
              <p className="mt-1 text-brand-ink-2">La capture se fait en personne dans un centre d'enrôlement habilité. Le portail officiel vous indique les étapes après l'inscription.</p>
            </>
          ) : (
            <>
              <p className="font-bold text-brand-ink">Poste consulaire compétent à confirmer · {countryName(country)}</p>
              <p className="mt-1 text-brand-ink-2">Depuis {city.trim()}, consultez le portail officiel et confirmez avec l'ambassade ou le consulat de la RDC compétent pour votre lieu de résidence où se fait la capture. Nous ne disposons pas d'une liste vérifiée des centres pour ce pays.</p>
            </>
          )}
          <p className="mt-3 text-sm text-brand-ink-2">La ville indiquée ici sert uniquement à cette orientation ; elle n'est pas enregistrée.</p>
        </div>
      )}
    </section>
  );
}

function Block({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="display-2 text-[1.75rem] text-brand-ink sm:text-[2rem]">{title}</h2>
      {intro && <p className="mt-2 text-brand-ink-2">{intro}</p>}
      <div className="mt-5 text-brand-ink">{children}</div>
    </section>
  );
}

function Checklist({ procedure }: { procedure: Detail }) {
  const guide = procedure.guide ?? {};
  const questions = guide.questions ?? [];
  const items: Checklist = guide.checklist ?? [];
  const storageKey = `md-checklist-${procedure.slug}`;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? "{}");
    } catch {
      return {};
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(done));
    } catch {
      /* storage unavailable */
    }
  }, [done, storageKey]);

  const visible = useMemo(
    () =>
      items.filter((it) => {
        if (!it.when) return true;
        // Shown when every condition is answered with a matching value.
        return Object.entries(it.when).every(([q, values]) => answers[q] && values.includes(answers[q]));
      }),
    [items, answers],
  );
  const hiddenCount = items.length - visible.length;

  if (!items.length) {
    if (!guide.missingInfo?.length) return null;
    return (
      <Block title="Pièces à fournir">
        <Notice tone="neutral" icon={<Info />}>
          La liste des pièces n'est pas encore confirmée pour cette démarche. Renseignez-vous auprès de : {procedure.institution}.
        </Notice>
      </Block>
    );
  }

  const groups = KIND_ORDER.map((k) => ({ kind: k, items: visible.filter((i) => i.kind === k) })).filter((g) => g.items.length);
  const doneCount = visible.filter((i) => done[i.id]).length;

  return (
    <Block title="Votre liste de pièces" intro={questions.length ? "Répondez à ces questions : la liste s'adapte à votre situation." : undefined}>
      {questions.length > 0 && (
        <div className="space-y-5 rounded-2xl bg-brand-mist p-5">
          {questions.map((q) => (
            <fieldset key={q.id}>
              <legend className="mb-2.5 font-semibold text-brand-ink">{q.label}</legend>
              <div className="flex flex-wrap gap-2">
                {q.options.map((o) => {
                  const checked = answers[q.id] === o.value;
                  return (
                    <label
                      key={o.value}
                      className={cn(
                        "inline-flex min-h-11 cursor-pointer items-center rounded-xl border bg-white px-4 text-[0.9375rem] font-semibold transition-colors duration-150 has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-[var(--focus)]",
                        checked ? "border-brand-royal bg-brand-royal text-white" : "border-brand-line text-brand-ink hover:border-brand-ink",
                      )}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        name={`${procedure.slug}-${q.id}`}
                        value={o.value}
                        checked={checked}
                        onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.value }))}
                      />
                      {o.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2" aria-live="polite">
        <p className="text-[0.9375rem] text-brand-ink-2">
          Pièces prêtes : {doneCount} sur {visible.length}
          {hiddenCount > 0 && `. ${hiddenCount} autre${hiddenCount > 1 ? "s" : ""} selon vos réponses.`}
        </p>
        {doneCount > 0 && (
          <button type="button" onClick={() => setDone({})} className="text-sm font-semibold text-brand-royal underline-offset-4 hover:underline">
            Tout décocher
          </button>
        )}
      </div>

      <div className="mt-4 space-y-8">
        {groups.map((g) => {
          const K = KIND[g.kind];
          return (
            <div key={g.kind}>
              <h3 className="flex items-center gap-2 font-sans text-base font-bold text-brand-ink">
                <K.icon className="h-5 w-5 text-brand-royal" aria-hidden="true" /> {K.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {g.items.map((it) => (
                  <li key={it.id}>
                    <label className="flex cursor-pointer gap-3 rounded-xl border border-brand-line p-4 transition-colors duration-150 hover:border-brand-ink-2 has-[:checked]:border-[var(--st-success)] has-[:checked]:bg-[var(--st-success-bg)]">
                      <input
                        type="checkbox"
                        checked={!!done[it.id]}
                        onChange={(e) => setDone((d) => ({ ...d, [it.id]: e.target.checked }))}
                        className="mt-1 h-5 w-5 shrink-0 rounded accent-[var(--st-success)]"
                      />
                      <span className="min-w-0">
                        <span className="block font-semibold text-brand-ink">{it.label}</span>
                        <span className="mt-1 flex flex-wrap gap-2 text-sm">
                          {it.requirement === "required" ? (
                            <span className="font-semibold text-brand-deep">Obligatoire</span>
                          ) : (
                            <span className="font-semibold text-[var(--st-warning)]">Selon votre situation</span>
                          )}
                        </span>
                        {it.description && <span className="mt-1 block text-[0.9375rem] text-brand-ink-2">{it.description}</span>}
                        {it.alternatives && it.alternatives.length > 0 && (
                          <span className="mt-1 block text-[0.9375rem] text-brand-ink-2">À défaut : {it.alternatives.join(", ")}.</span>
                        )}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-sm text-brand-ink-2">Les cases cochées restent enregistrées sur cet appareil uniquement.</p>
    </Block>
  );
}

function Sources({ procedure }: { procedure: Detail }) {
  const guide = procedure.guide ?? {};
  const sources = guide.sources ?? [];
  const missing = guide.missingInfo ?? [];
  if (!sources.length && !missing.length) return null;
  return (
    <section className="rounded-2xl bg-brand-mist p-6">
      <h2 className="font-display text-xl font-bold text-brand-ink">Sources et vérification</h2>
      {sources.length > 0 && (
        <ul className="mt-4 space-y-3">
          {sources.map((s) => (
            <li key={s.url} className="text-[0.9375rem]">
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-royal underline underline-offset-4">
                {s.label}
                <span className="sr-only"> (nouvel onglet)</span>
              </a>
              <span className="block text-brand-ink-2">
                {s.administration}, consulté le {formatDate(s.consultedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {missing.length > 0 && (
        <div className="mt-5">
          <p className="font-semibold text-brand-ink">Points encore à confirmer</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[0.9375rem] text-brand-ink-2">
            {missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-5 text-sm text-brand-ink-2">
        {procedure.verifiedAt ? `Validation interne : ${formatDate(procedure.verifiedAt)}.` : "Validation interne : en attente."}
      </p>
    </section>
  );
}

function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Chargement de la démarche">
      <div className="bg-brand-mist">
        <div className="md-container py-12">
          <div className="skeleton h-4 w-64" />
          <div className="skeleton mt-8 h-12 w-2/3" />
          <div className="skeleton mt-4 h-5 w-1/2" />
        </div>
      </div>
      <div className="md-container grid gap-10 py-12 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="skeleton h-8 w-60" />
          <div className="skeleton h-24" />
          <div className="skeleton h-24" />
        </div>
        <div className="skeleton h-80" />
      </div>
    </div>
  );
}
