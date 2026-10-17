import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertTriangle, ArrowLeft, ArrowRight, Building2, Check, CircleAlert, FileText, Info, Pencil, RotateCcw, Send, Wallet } from "lucide-react";
import type { ActivityLog, Application, ApplicationDocument, ApplicationFieldValue, Procedure, ProcedureField, ProcedureRequiredDoc } from "@shared/schema";
import { apiRequest, ApiError, queryClient } from "@/lib/queryClient";
import { useAuth, isStaffRole } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { RequireAuth } from "@/components/require-auth";
import { Stepper } from "@/components/stepper";
import { DocUploader } from "@/components/doc-uploader";
import { Timeline } from "@/components/timeline";
import { DocumentStatusBadge, StatusBadge, statusInfo } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { ErrorState, Notice } from "@/components/states";
import { formatMoney, priceOf } from "@/lib/procedures";
import { relative } from "@/pages/dashboard";
import { cn } from "@/lib/utils";
import { PhoneInput } from "@/components/phone-input";
import { countries, countryName } from "@/lib/countries";

type Dossier = Application & {
  procedure?: Procedure & { fields: ProcedureField[]; requiredDocuments: ProcedureRequiredDoc[]; guide: Procedure["guide"] };
  fieldValues: ApplicationFieldValue[];
  documents: ApplicationDocument[];
  activityLogs: ActivityLog[];
  user?: { prenom: string; nom: string; email: string; phone: string };
};

const STEPS = [{ title: "Informations" }, { title: "Pièces" }, { title: "Vérification et paiement" }];

export type PaymentRow = {
  id: string;
  amount: number;
  currency: string | null;
  officialAmount: number | null;
  serviceFee: number | null;
  status: string;
  receiptNumber: string | null;
  transactionRef: string | null;
  paidAt: string | null;
  createdAt: string | null;
};
const EDITABLE = ["draft", "pending_user_action"];

export default function ApplicationDetailPage() {
  return (
    <RequireAuth>
      <ApplicationDetail />
    </RequireAuth>
  );
}

function ApplicationDetail() {
  const [, params] = useRoute("/application/:id");
  const id = params?.id ?? "";
  const { user } = useAuth();
  const isAgent = isStaffRole(user?.role);
  const key = [`/api/applications/${id}`];
  const { data: dossier, isLoading, isError, error, refetch } = useQuery<Dossier>({ queryKey: key, staleTime: 0 });

  const payState = usePaymentReturn(id, key);

  useEffect(() => {
    if (dossier?.procedure) document.title = `${dossier.procedure.title} (${dossier.reference}) — MesDémarches`;
  }, [dossier]);

  if (isLoading) {
    return (
      <div className="md-container py-12" aria-busy="true">
        <div className="skeleton h-10 w-80" />
        <div className="skeleton mt-8 h-64" />
      </div>
    );
  }
  if (isError || !dossier) {
    const status = error instanceof ApiError ? error.status : 0;
    return (
      <div className="md-container py-16">
        {status === 404 || status === 403 ? (
          <div className="max-w-xl">
            <h1 className="display-2">Ce dossier est introuvable</h1>
            <p className="mt-3 text-brand-ink-2">Il n'existe pas ou n'est pas rattaché à votre compte.</p>
            <Button asChild className="mt-6">
              <Link href="/dashboard">Mes dossiers</Link>
            </Button>
          </div>
        ) : (
          <ErrorState message="Le dossier n'a pas pu être chargé." onRetry={() => refetch()} />
        )}
      </div>
    );
  }

  const editable = !isAgent && EDITABLE.includes(dossier.status);

  return (
    <div className="bg-brand-mist pb-20">
      <section className="border-b border-brand-line bg-white">
        <div className="md-container py-6 lg:py-8">
          <Link href={isAgent ? "/admin" : "/dashboard"} className="inline-flex min-h-11 items-center gap-2 font-semibold text-brand-ink-2 hover:text-brand-ink">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {isAgent ? "Back-office" : "Mes dossiers"}
          </Link>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="display-2 text-brand-ink">{dossier.procedure?.title}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.9375rem] text-brand-ink-2">
                <span>
                  Référence <span className="font-semibold text-brand-ink">{dossier.reference}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" aria-hidden="true" /> {dossier.procedure?.institution}
                </span>
                <span>Mis à jour {relative(dossier.updatedAt as unknown as string)}</span>
              </p>
              {isAgent && dossier.user && (
                <p className="mt-1 text-[0.9375rem] text-brand-ink-2">
                  Demandeur : <span className="font-semibold text-brand-ink">{dossier.user.prenom} {dossier.user.nom}</span> ({dossier.user.email})
                </p>
              )}
            </div>
            <StatusBadge status={dossier.status} className="text-sm" />
          </div>
        </div>
      </section>

      <div className="md-container grid gap-8 pt-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {payState === "checking" && (
            <Notice tone="info" icon={<Wallet />} title="Confirmation du paiement en cours">
              Nous vérifions votre paiement auprès de Stripe. Cette page se met à jour automatiquement.
            </Notice>
          )}
          {payState === "pending" && (
            <Notice tone="warning" icon={<Wallet />} title="Paiement pas encore confirmé">
              Stripe n'a pas encore confirmé votre paiement. Revenez sur cette page dans quelques minutes ; vous recevrez une notification dès la confirmation.
            </Notice>
          )}
          {payState === "cancelled" && (
            <Notice tone="neutral" icon={<Wallet />} title="Paiement annulé">
              Aucun montant n'a été débité. Votre dossier reste en brouillon : vous pouvez payer quand vous le souhaitez.
            </Notice>
          )}
          {editable ? <Wizard dossier={dossier} queryKey={key} /> : <TrackingView dossier={dossier} isAgent={isAgent} queryKey={key} />}
        </div>
        <aside className="space-y-6">
          <section className="rounded-2xl bg-white p-5 shadow-card" aria-labelledby="history-title">
            <h2 id="history-title" className="mb-5 font-display text-lg font-bold text-brand-ink">Historique</h2>
            <Timeline events={dossier.activityLogs as never} citizenId={dossier.userId} currentUserId={user?.id} />
          </section>
          {dossier.procedure && (
            <Link href={`/procedure/${dossier.procedure.slug}`} className="link-arrow px-1">
              Revoir la fiche de la démarche <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Wizard({ dossier, queryKey }: { dossier: Dossier; queryKey: string[] }) {
  const { toast } = useToast();
  const fields = dossier.procedure?.fields ?? [];
  const docs = dossier.procedure?.requiredDocuments ?? [];
  const initial = useMemo(() => Object.fromEntries(dossier.fieldValues.map((v) => [v.fieldId, v.value])), [dossier.fieldValues]);
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [residenceCountry, setResidenceCountry] = useState(dossier.residenceCountry ?? "");
  const [residenceCity, setResidenceCity] = useState(dossier.residenceCity ?? "");
  const [locationTouched, setLocationTouched] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  // When an agent asked for a document to be replaced, open directly on the documents step.
  const [step, setStep] = useState(() =>
    dossier.status === "pending_user_action" && dossier.documents.some((d) => ["rejected", "replacement_requested"].includes(d.status)) ? 1 : 0,
  );
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [certified, setCertified] = useState(false);
  const [mandate, setMandate] = useState(false);
  const [submitError, setSubmitError] = useState<{ message: string; missingFields?: string[]; missingDocs?: string[] } | null>(null);
  const { data: paymentRows = [] } = useQuery<PaymentRow[]>({ queryKey: [`/api/applications/${dossier.id}/payments`], staleTime: 0 });
  const { data: payConfig } = useQuery<{ enabled: boolean }>({ queryKey: ["/api/payments/config"] });
  // Dossiers already transmitted once (before online payment existed) can be sent again without paying.
  const hasPayment = paymentRows.some((p) => p.status === "succeeded");
  const paid = hasPayment || !!dossier.submittedAt;
  const price = dossier.procedure ? priceOf(dossier.procedure) : null;

  const checkout = useMutation({
    mutationFn: async () => (await apiRequest("POST", `/api/applications/${dossier.id}/checkout`)).json() as Promise<{ url: string }>,
    onSuccess: ({ url }) => {
      window.location.assign(url);
    },
    onError: (e) => {
      const data = e instanceof ApiError ? e.data : {};
      setSubmitError({ message: e.message, missingFields: data.missingFields as string[] | undefined, missingDocs: data.missingDocs as string[] | undefined });
    },
  });

  const save = useMutation({
    mutationFn: async (fieldValues: Array<{ fieldId: string; value: string }>) => apiRequest("PATCH", `/api/applications/${dossier.id}`, { fieldValues }),
    onSuccess: () => {
      setSavedAt(new Date());
      queryClient.invalidateQueries({ queryKey });
    },
  });
  const saveLocation = useMutation({
    mutationFn: async (location: { residenceCountry: string; residenceCity: string }) => apiRequest("PATCH", `/api/applications/${dossier.id}`, location),
    onSuccess: () => {
      setSavedAt(new Date());
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const submit = useMutation({
    mutationFn: async () => apiRequest("PATCH", `/api/applications/${dossier.id}`, { status: "submitted" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["/api/applications/me"] });
      toast({ title: "Dossier transmis", description: `Votre dossier ${dossier.reference} a bien été envoyé.` });
      window.scrollTo({ top: 0 });
    },
    onError: (e) => {
      const data = e instanceof ApiError ? e.data : {};
      setSubmitError({
        message: e.message,
        missingFields: data.missingFields as string[] | undefined,
        missingDocs: data.missingDocs as string[] | undefined,
      });
    },
  });

  const missingFields = fields.filter((f) => f.required && !values[f.id]?.trim());
  const docFor = (reqId: string) => dossier.documents.find((d) => d.requiredDocId === reqId);
  const missingDocs = docs.filter((d) => {
    const doc = docFor(d.id);
    return d.required && (!doc || ["rejected", "replacement_requested"].includes(doc.status));
  });

  const persist = (fieldId: string) => {
    if ((values[fieldId] ?? "") !== (initial[fieldId] ?? "")) save.mutate([{ fieldId, value: values[fieldId] ?? "" }]);
  };

  const goToDocs = () => {
    setTouched(Object.fromEntries(fields.map((f) => [f.id, true])));
    setLocationTouched(true);
    if (!residenceCountry || !residenceCity.trim()) {
      document.getElementById(!residenceCountry ? "residence-country" : "residence-city")?.focus();
      return;
    }
    if (missingFields.length) {
      document.getElementById(`field-${missingFields[0].id}`)?.focus();
      return;
    }
    saveLocation.mutate({ residenceCountry, residenceCity: residenceCity.trim() }, {
      onSuccess: () => {
        setStep(1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
    });
  };

  const upload = async (reqDoc: ProcedureRequiredDoc, file: File) => {
    const fd = new FormData();
    fd.append("requiredDocId", reqDoc.id);
    fd.append("file", file);
    let res: Response;
    try {
      res = await fetch(`/api/applications/${dossier.id}/upload`, { method: "POST", body: fd, credentials: "include" });
    } catch {
      throw new Error("Connexion impossible. Vérifiez votre accès à Internet puis réessayez.");
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "L'envoi du fichier a échoué.");
    }
    const { fileUrl, originalName } = await res.json();
    await apiRequest("POST", `/api/applications/${dossier.id}/documents`, {
      requiredDocId: reqDoc.id,
      fileUrl,
      originalName: originalName || file.name,
      mimeType: file.type,
      size: file.size,
    });
    await queryClient.invalidateQueries({ queryKey });
  };


  return (
    <>
      {dossier.status === "pending_user_action" && (
        <Notice tone="warning" icon={<AlertTriangle />} title="Correction demandée">
          {dossier.statusNote ? (
            <>
              <span className="font-semibold">Message de notre équipe : </span>
              {dossier.statusNote}
            </>
          ) : (
            "Notre équipe demande des corrections. Vérifiez vos informations et les pièces signalées, puis transmettez de nouveau le dossier."
          )}
        </Notice>
      )}

      <div className="rounded-2xl bg-white p-5 shadow-card sm:p-8">
        <Stepper steps={STEPS} currentStep={step} onStepClick={setStep} />
        <p className="mt-3 min-h-5 text-sm text-brand-ink-2" role="status" aria-live="polite">
          {save.isPending || saveLocation.isPending ? "Enregistrement…" : save.isError || saveLocation.isError ? "" : savedAt ? `Brouillon enregistré à ${format(savedAt, "HH:mm", { locale: fr })}` : "Votre brouillon est enregistré automatiquement."}
        </p>
        {save.isError && (
          <p role="alert" className="mt-1 text-sm font-semibold text-[var(--st-danger)]">
            Cette information n'a pas été enregistrée : {(save.error as Error).message}
          </p>
        )}
        {saveLocation.isError && <p role="alert" className="mt-1 text-sm font-semibold text-[var(--st-danger)]">Le lieu n'a pas été enregistré : {saveLocation.error.message}</p>}

        {step === 0 && (
          <section className="mt-6" aria-labelledby="step-info">
            <h2 id="step-info" className="title-3 text-brand-ink">Vos informations</h2>
            <p className="mt-1 text-brand-ink-2">Les champs marqués « obligatoire » doivent être remplis pour transmettre le dossier.</p>
            <div className="mt-6 grid gap-5 rounded-xl bg-brand-mist p-4 md:grid-cols-2">
              <div>
                <label htmlFor="residence-country" className="mb-1.5 block font-semibold text-brand-ink">Pays où vous vous trouvez <span className="ml-2 text-sm font-normal text-brand-ink-2">Obligatoire</span></label>
                <select id="residence-country" className="field-input" value={residenceCountry} aria-invalid={locationTouched && !residenceCountry || undefined} onChange={(e) => {
                  const value = e.target.value;
                  setResidenceCountry(value);
                  saveLocation.mutate({ residenceCountry: value, residenceCity });
                }}>
                  <option value="">Choisir un pays…</option>
                  {countries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
                </select>
                {locationTouched && !residenceCountry && <p role="alert" className="mt-1 text-sm font-semibold text-[var(--st-danger)]">Choisissez votre pays.</p>}
              </div>
              <div>
                <label htmlFor="residence-city" className="mb-1.5 block font-semibold text-brand-ink">Ville où vous vous trouvez <span className="ml-2 text-sm font-normal text-brand-ink-2">Obligatoire</span></label>
                <input id="residence-city" className="field-input" autoComplete="address-level2" maxLength={100} value={residenceCity} aria-invalid={locationTouched && !residenceCity.trim() || undefined} onChange={(e) => setResidenceCity(e.target.value)} onBlur={() => saveLocation.mutate({ residenceCountry, residenceCity: residenceCity.trim() })} />
                {locationTouched && !residenceCity.trim() && <p role="alert" className="mt-1 text-sm font-semibold text-[var(--st-danger)]">Indiquez votre ville.</p>}
              </div>
            </div>
            {fields.length > 0 && (
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {fields.map((f) => {
                  const invalid = touched[f.id] && f.required && !values[f.id]?.trim();
                  const common = {
                    id: `field-${f.id}`,
                    "aria-invalid": invalid || undefined,
                    "aria-describedby": invalid ? `field-${f.id}-error` : undefined,
                    value: values[f.id] ?? "",
                    onBlur: () => {
                      setTouched((t) => ({ ...t, [f.id]: true }));
                      persist(f.id);
                    },
                  };
                  return (
                    <div key={f.id} className={cn(f.type === "textarea" && "md:col-span-2")}>
                      <label htmlFor={`field-${f.id}`} className="mb-1.5 block font-semibold text-brand-ink">
                        {f.label}
                        <span className="ml-2 text-sm font-normal text-brand-ink-2">{f.required ? "Obligatoire" : "Facultatif"}</span>
                      </label>
                      {/t[eé]l[eé]phone/i.test(f.label) ? (
                        <PhoneInput id={`field-${f.id}`} value={values[f.id] ?? ""} onChange={(value) => setValues((current) => ({ ...current, [f.id]: value }))} onBlur={() => { setTouched((current) => ({ ...current, [f.id]: true })); persist(f.id); }} error={!!invalid} />
                      ) : f.type === "select" && Array.isArray(f.options) ? (
                        <select
                          {...common}
                          className="field-input"
                          onBlur={() => setTouched((t) => ({ ...t, [f.id]: true }))}
                          onChange={(e) => {
                            const value = e.target.value;
                            setValues((v) => ({ ...v, [f.id]: value }));
                            save.mutate([{ fieldId: f.id, value }]);
                          }}
                        >
                          <option value="">Choisir…</option>
                          {(f.options as string[]).map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      ) : f.type === "textarea" ? (
                        <textarea {...common} rows={4} className="field-input py-3" onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))} />
                      ) : (
                        <input
                          {...common}
                          type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                          inputMode={f.type === "number" ? "numeric" : undefined}
                          className="field-input"
                          onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))}
                        />
                      )}
                      {invalid && (
                        <p id={`field-${f.id}-error`} className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-[var(--st-danger)]">
                          <CircleAlert className="h-4 w-4" aria-hidden="true" /> Ce champ est obligatoire.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-8 flex justify-end">
              <Button size="lg" onClick={goToDocs}>
                Continuer <ArrowRight aria-hidden="true" />
              </Button>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="mt-6" aria-labelledby="step-docs">
            <h2 id="step-docs" className="title-3 text-brand-ink">Vos pièces</h2>
            <p className="mt-1 text-brand-ink-2">Photographiez chaque document à plat, en entier et sans reflet. Vous pourrez le remplacer avant l'envoi.</p>
            {docs.length === 0 ? (
              <p className="mt-6 text-brand-ink-2">Aucune pièce n'est demandée pour cette démarche.</p>
            ) : (
              <div className="mt-6 space-y-4">
                {docs.map((d) => {
                  const doc = docFor(d.id);
                  return (
                    <DocUploader
                      key={d.id}
                      label={d.name}
                      description={d.description}
                      required={d.required}
                      acceptedFormats={d.acceptedFormats}
                      maxSizeMb={d.maxSizeMb}
                      status={doc?.status}
                      rejectionReason={doc?.rejectionReason}
                      fileUrl={doc?.fileUrl}
                      fileName={doc?.originalName}
                      mimeType={doc?.mimeType}
                      onUpload={(file) => upload(d, file)}
                    />
                  );
                })}
              </div>
            )}
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Button variant="ghost" size="lg" onClick={() => setStep(0)}>
                <ArrowLeft aria-hidden="true" /> Retour
              </Button>
              <Button size="lg" onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                Vérifier mon dossier <ArrowRight aria-hidden="true" />
              </Button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="mt-6" aria-labelledby="step-review">
            <h2 id="step-review" className="title-3 text-brand-ink">Vérifiez avant d'envoyer</h2>
            <p className="mt-1 text-brand-ink-2">Une fois transmis, le dossier ne peut plus être modifié, sauf si vous le retirez avant sa prise en charge.</p>

            {(missingFields.length > 0 || missingDocs.length > 0 || !residenceCountry || !residenceCity.trim()) && (
              <Notice tone="warning" icon={<AlertTriangle />} title="Il manque encore des éléments" className="mt-6">
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {missingFields.map((f) => <li key={f.id}>{f.label}</li>)}
                  {!residenceCountry && <li>Pays où vous vous trouvez</li>}
                  {!residenceCity.trim() && <li>Ville où vous vous trouvez</li>}
                  {missingDocs.map((d) => <li key={d.id}>{d.name}</li>)}
                </ul>
              </Notice>
            )}

            <div className="mt-6 space-y-6">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-sans text-base font-bold text-brand-ink">Informations</h3>
                  <Button variant="tertiary" size="sm" onClick={() => setStep(0)}>
                    <Pencil aria-hidden="true" /> Modifier
                  </Button>
                </div>
                <dl className="mt-2 divide-y divide-brand-line rounded-xl border border-brand-line">
                  <div className="grid gap-1 px-4 py-3 sm:grid-cols-[220px_1fr]"><dt className="text-brand-ink-2">Pays</dt><dd className="font-semibold text-brand-ink">{countryName(residenceCountry)}</dd></div>
                  <div className="grid gap-1 px-4 py-3 sm:grid-cols-[220px_1fr]"><dt className="text-brand-ink-2">Ville</dt><dd className="font-semibold text-brand-ink">{residenceCity || "Non renseignée"}</dd></div>
                  {fields.map((f) => (
                    <div key={f.id} className="grid gap-1 px-4 py-3 sm:grid-cols-[220px_1fr]">
                      <dt className="text-brand-ink-2">{f.label}</dt>
                      <dd className={cn("font-semibold", values[f.id]?.trim() ? "text-brand-ink" : "text-[var(--st-warning)]")}>{values[f.id]?.trim() || "Non renseigné"}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-sans text-base font-bold text-brand-ink">Pièces</h3>
                  <Button variant="tertiary" size="sm" onClick={() => setStep(1)}>
                    <Pencil aria-hidden="true" /> Modifier
                  </Button>
                </div>
                <ul className="mt-2 divide-y divide-brand-line rounded-xl border border-brand-line">
                  {docs.map((d) => {
                    const doc = docFor(d.id);
                    return (
                      <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-brand-royal" aria-hidden="true" /> {d.name}
                        </span>
                        {doc ? <DocumentStatusBadge status={doc.status} /> : <span className="text-sm font-semibold text-[var(--st-warning)]">{d.required ? "Manquante" : "Non fournie"}</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <section aria-labelledby="price-title" className="rounded-xl border border-brand-line p-4">
                <h3 id="price-title" className="font-sans text-base font-bold text-brand-ink">Prix de la démarche</h3>
                {price ? (
                  <dl className="mt-2 space-y-1.5 text-[0.9375rem]">
                    <div className="flex justify-between gap-4">
                      <dt className="text-brand-ink-2">Frais officiels</dt>
                      <dd className="font-semibold">{formatMoney(price.official, "USD")}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-brand-ink-2">Frais de service MesDémarches</dt>
                      <dd className="font-semibold">{formatMoney(price.service, "USD")}</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-brand-line pt-2 text-base">
                      <dt className="font-bold">Total</dt>
                      <dd className="font-bold">{formatMoney(price.total, "USD")}</dd>
                    </div>
                    {dossier.procedure?.guide?.feeNote && <p className="pt-1 text-sm text-brand-ink-2">{dossier.procedure.guide.feeNote}</p>}
                  </dl>
                ) : (
                  <p className="mt-2 text-[0.9375rem] text-brand-ink-2">
                    Le tarif de cette démarche est en cours de fixation. Vous pourrez régler et transmettre votre dossier dès qu'il sera publié.
                  </p>
                )}
                {hasPayment && <p className="mt-3 flex items-center gap-2 font-semibold text-[var(--st-success)]"><Check className="h-4 w-4" aria-hidden="true" /> Déjà réglé</p>}
              </section>
              <label className="flex cursor-pointer gap-3 rounded-xl bg-brand-mist p-4">
                <input type="checkbox" checked={mandate} onChange={(e) => setMandate(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[var(--md-royal)]" />
                <span className="text-brand-ink">
                  J'autorise MesDémarches à effectuer cette démarche en mon nom auprès de l'administration compétente, avec les informations et les pièces transmises.
                </span>
              </label>
              <label className="flex cursor-pointer gap-3 rounded-xl bg-brand-mist p-4">
                <input type="checkbox" checked={certified} onChange={(e) => setCertified(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[var(--md-royal)]" />
                <span className="text-brand-ink">Je certifie que les informations et les pièces transmises sont exactes et authentiques.</span>
              </label>
            </div>

            {submitError && (
              <div role="alert" className="mt-6 rounded-xl border border-[var(--st-danger)]/25 bg-[var(--st-danger-bg)] p-4 text-brand-ink">
                <p className="font-semibold">Le dossier n'a pas été transmis : {submitError.message}</p>
                {(submitError.missingFields?.length || submitError.missingDocs?.length) && (
                  <ul className="mt-2 list-disc pl-5">
                    {[...(submitError.missingFields ?? []), ...(submitError.missingDocs ?? [])].map((m) => <li key={m}>{m}</li>)}
                  </ul>
                )}
              </div>
            )}

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Button variant="ghost" size="lg" onClick={() => setStep(1)}>
                <ArrowLeft aria-hidden="true" /> Retour
              </Button>
              {paid ? (
                <Button
                  size="lg"
                  loading={submit.isPending}
                  disabled={!certified || !mandate || !residenceCountry || !residenceCity.trim() || missingFields.length > 0 || missingDocs.length > 0}
                  onClick={() => {
                    setSubmitError(null);
                    submit.mutate();
                  }}
                >
                  {!submit.isPending && <Send aria-hidden="true" />} Transmettre mon dossier
                </Button>
              ) : (
                <Button
                  size="lg"
                  loading={checkout.isPending}
                  disabled={!price || payConfig?.enabled === false || !certified || !mandate || !residenceCountry || !residenceCity.trim() || missingFields.length > 0 || missingDocs.length > 0}
                  onClick={() => {
                    setSubmitError(null);
                    checkout.mutate();
                  }}
                >
                  {!checkout.isPending && <Wallet aria-hidden="true" />} {price ? `Payer ${formatMoney(price.total, "USD")} et transmettre` : "Paiement indisponible"}
                </Button>
              )}
            </div>
            {payConfig?.enabled === false && !paid && (
              <p className="mt-3 text-right text-sm text-brand-ink-2">Le paiement en ligne n'est pas encore activé.</p>
            )}
            {(!certified || !mandate) && missingFields.length === 0 && missingDocs.length === 0 && (
              <p className="mt-3 text-right text-sm text-brand-ink-2">Cochez les deux déclarations pour continuer.</p>
            )}
            {!paid && price && payConfig?.enabled && <p className="mt-2 text-right text-sm text-brand-ink-2">Vous serez redirigé vers Stripe pour un paiement sécurisé par carte.</p>}
          </section>
        )}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

function TrackingView({ dossier, isAgent, queryKey }: { dossier: Dossier; isAgent: boolean; queryKey: string[] }) {
  const { toast } = useToast();
  const info = statusInfo(dossier.status);
  const fields = dossier.procedure?.fields ?? [];
  const docs = dossier.procedure?.requiredDocuments ?? [];
  const valueOf = (fieldId: string) => dossier.fieldValues.find((v) => v.fieldId === fieldId)?.value;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
    queryClient.invalidateQueries({ queryKey: ["/api/applications/me"] });
  };
  const retract = useMutation({
    mutationFn: () => apiRequest("POST", `/api/applications/${dossier.id}/retract`),
    onSuccess: () => {
      invalidate();
      toast({ title: "Dossier retiré", description: "Vous pouvez le modifier puis le transmettre de nouveau." });
    },
    onError: (e) => toast({ title: "Le dossier n'a pas été retiré", description: e.message, variant: "destructive" }),
  });

  return (
    <>
      <section className="on-blue overflow-hidden rounded-2xl bg-brand-royal text-white" aria-labelledby="status-title">
        <div className="p-6 sm:p-8">
          <p className="text-sm font-semibold text-white/75">Statut du dossier</p>
          <h2 id="status-title" className="display-2 mt-1">{info.label}</h2>
          <p className="mt-3 max-w-2xl text-lg text-white/90">{info.next}</p>
          {dossier.statusNote && (
            <p className="mt-4 rounded-xl bg-white/10 p-4">
              <span className="font-semibold text-brand-yellow">Message de notre équipe : </span>
              {dossier.statusNote}
            </p>
          )}
          <p className="mt-4 text-sm text-white/75">
            Dernière mise à jour {relative(dossier.updatedAt as unknown as string)}
            {dossier.submittedAt && ` · transmis le ${format(new Date(dossier.submittedAt), "d MMMM yyyy", { locale: fr })}`}
          </p>
          {!isAgent && dossier.status === "submitted" && (
            <div className="mt-6">
              <Button variant="on-blue" loading={retract.isPending} onClick={() => retract.mutate()} data-testid="button-retract-dossier">
                {!retract.isPending && <RotateCcw aria-hidden="true" />} Retirer et modifier mon dossier
              </Button>
              <p className="mt-2 text-sm text-white/75">Possible tant que notre équipe n'a pas commencé la démarche. Votre paiement reste acquis pour ce dossier.</p>
            </div>
          )}
        </div>
        <div className="tricolor" aria-hidden="true" />
      </section>

      <PaymentSummary dossierId={dossier.id} />

      {isAgent && <AgentControls dossier={dossier} onDone={invalidate} />}

      {(fields.length > 0 || dossier.residenceCountry || dossier.residenceCity) && (
        <section className="rounded-2xl bg-white p-5 shadow-card sm:p-6" aria-labelledby="info-title">
          <h2 id="info-title" className="font-display text-lg font-bold text-brand-ink">Informations transmises</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-brand-mist p-3"><dt className="text-sm text-brand-ink-2">Pays</dt><dd className="font-semibold text-brand-ink">{countryName(dossier.residenceCountry)}</dd></div>
            <div className="rounded-xl bg-brand-mist p-3"><dt className="text-sm text-brand-ink-2">Ville</dt><dd className="font-semibold text-brand-ink">{dossier.residenceCity || "Non renseignée"}</dd></div>
            {fields.map((f) => (
              <div key={f.id} className="rounded-xl bg-brand-mist p-3">
                <dt className="text-sm text-brand-ink-2">{f.label}</dt>
                <dd className="font-semibold text-brand-ink">{valueOf(f.id) || "Non renseigné"}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="rounded-2xl bg-white p-5 shadow-card sm:p-6" aria-labelledby="docs-title">
        <h2 id="docs-title" className="font-display text-lg font-bold text-brand-ink">Pièces du dossier</h2>
        <ul className="mt-4 space-y-3">
          {docs.map((d) => {
            const doc = dossier.documents.find((x) => x.requiredDocId === d.id);
            return (
              <li key={d.id} className="rounded-xl border border-brand-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-brand-ink">{d.name}</p>
                    {doc ? (
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand-royal underline-offset-4 hover:underline">
                        Ouvrir « {doc.originalName} »<span className="sr-only"> (nouvel onglet)</span>
                      </a>
                    ) : (
                      <p className="text-sm text-brand-ink-2">Aucun fichier transmis</p>
                    )}
                  </div>
                  {doc && <DocumentStatusBadge status={doc.status} />}
                </div>
                {doc?.rejectionReason && (
                  <p className="mt-2 text-[0.9375rem] text-brand-ink">
                    <span className="font-semibold">Motif : </span>
                    {doc.rejectionReason}
                  </p>
                )}
                {isAgent && doc && <DocumentReview docId={doc.id} onDone={invalidate} />}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}

const AGENT_ACTIONS: Array<{ status: string; label: string; needsNote?: boolean }> = [
  { status: "under_review", label: "Prendre en charge" },
  { status: "received", label: "Déposé à l'administration" },
  { status: "pending_user_action", label: "Demander une correction", needsNote: true },
  { status: "pending_payment", label: "Demander un paiement", needsNote: true },
  { status: "approved", label: "Approuver" },
  { status: "ready", label: "Marquer prêt à retirer" },
  { status: "delivered", label: "Marquer délivré" },
  { status: "rejected", label: "Refuser", needsNote: true },
];

function AgentControls({ dossier, onDone }: { dossier: Dossier; onDone: () => void }) {
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: async (status: string) => apiRequest("PATCH", `/api/admin/applications/${dossier.id}/status`, { status, note }),
    onSuccess: (_d, status) => {
      setNote("");
      setPending(null);
      onDone();
      toast({ title: "Statut enregistré", description: `Le dossier est maintenant « ${statusInfo(status).label} ».` });
    },
    onError: (e) => setError(e.message),
  });

  return (
    <section className="rounded-2xl border-2 border-brand-yellow bg-white p-5 sm:p-6" aria-labelledby="agent-title">
      <h2 id="agent-title" className="font-display text-lg font-bold text-brand-ink">Traitement du dossier</h2>
      <label htmlFor="agent-note" className="mt-4 block font-semibold text-brand-ink">
        Message au demandeur
      </label>
      <p id="agent-note-hint" className="text-sm text-brand-ink-2">Obligatoire pour une correction, un paiement ou un refus. Il est envoyé en notification.</p>
      <textarea id="agent-note" aria-describedby="agent-note-hint" rows={3} value={note} onChange={(e) => setNote(e.target.value)} className="field-input mt-2 py-3" />
      <div className="mt-4 flex flex-wrap gap-2">
        {AGENT_ACTIONS.map((a) => (
          <Button
            key={a.status}
            variant={a.status === "rejected" ? "outline" : dossier.status === a.status ? "default" : "outline"}
            size="sm"
            className={cn(a.status === "rejected" && "border-[var(--st-danger)]/40 text-[var(--st-danger)] hover:bg-[var(--st-danger-bg)]")}
            loading={mutation.isPending && pending === a.status}
            disabled={mutation.isPending || (a.needsNote && !note.trim()) || dossier.status === a.status}
            onClick={() => {
              setError(null);
              setPending(a.status);
              mutation.mutate(a.status);
            }}
          >
            {a.label}
          </Button>
        ))}
      </div>
      {error && <p role="alert" className="mt-3 text-sm font-semibold text-[var(--st-danger)]">{error}</p>}
      <p className="mt-3 flex items-center gap-1.5 text-sm text-brand-ink-2">
        <Info className="h-4 w-4" aria-hidden="true" /> Le client a réglé les frais officiels et de service en ligne. Pour un complément, précisez le montant et la marche à suivre.
      </p>
    </section>
  );
}

function DocumentReview({ docId, onDone }: { docId: string; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: async (status: string) => apiRequest("PATCH", `/api/admin/documents/${docId}/validate`, { status, feedback: reason || undefined }),
    onSuccess: () => {
      setReason("");
      onDone();
    },
    onError: (e) => setError(e.message),
  });
  return (
    <div className="mt-3 space-y-2 border-t border-brand-line pt-3">
      <label className="block text-sm font-semibold text-brand-ink" htmlFor={`reason-${docId}`}>
        Motif (pour un remplacement ou un refus)
      </label>
      <input id={`reason-${docId}`} value={reason} onChange={(e) => setReason(e.target.value)} className="field-input" />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate("approved")}>
          <Check aria-hidden="true" /> Valider
        </Button>
        <Button size="sm" variant="outline" disabled={mutation.isPending || !reason.trim()} onClick={() => mutation.mutate("replacement_requested")}>
          Demander un remplacement
        </Button>
        <Button size="sm" variant="outline" className="text-[var(--st-danger)]" disabled={mutation.isPending || !reason.trim()} onClick={() => mutation.mutate("rejected")}>
          Refuser
        </Button>
      </div>
      {error && <p role="alert" className="text-sm font-semibold text-[var(--st-danger)]">{error}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** Confirms a Stripe payment when the client comes back from Checkout. */
function usePaymentReturn(applicationId: string, queryKey: string[]) {
  const params = new URLSearchParams(window.location.search);
  const flag = params.get("paiement");
  const sessionId = params.get("session_id");
  const [state, setState] = useState<"idle" | "checking" | "pending" | "cancelled" | "done">(
    flag === "retour" && sessionId ? "checking" : flag === "annule" ? "cancelled" : "idle",
  );

  useEffect(() => {
    if (flag !== "retour" || !sessionId) return;
    let attempts = 0;
    let timer: number | undefined;
    const check = async () => {
      attempts += 1;
      try {
        const res = await apiRequest("POST", "/api/payments/verify", { sessionId });
        const { status } = await res.json();
        if (status === "succeeded") {
          setState("done");
          queryClient.invalidateQueries({ queryKey });
          queryClient.invalidateQueries({ queryKey: [`/api/applications/${applicationId}/payments`] });
          queryClient.invalidateQueries({ queryKey: ["/api/applications/me"] });
          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
          window.history.replaceState(window.history.state, "", `/application/${applicationId}`);
          return;
        }
      } catch {
        /* retried below */
      }
      if (attempts < 6) timer = window.setTimeout(check, 2500);
      else setState("pending");
    };
    check();
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flag, sessionId, applicationId]);

  return state;
}

function PaymentSummary({ dossierId }: { dossierId: string }) {
  const { data = [] } = useQuery<PaymentRow[]>({ queryKey: [`/api/applications/${dossierId}/payments`], staleTime: 0 });
  const paid = data.find((p) => p.status === "succeeded");
  if (!paid) return null;
  return (
    <section className="rounded-2xl bg-white p-5 shadow-card sm:p-6" aria-labelledby="pay-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="pay-title" className="font-display text-lg font-bold text-brand-ink">Paiement</h2>
          <p className="mt-1 text-[0.9375rem] text-brand-ink-2">
            Reçu {paid.receiptNumber} · {paid.paidAt && format(new Date(paid.paidAt), "d MMMM yyyy", { locale: fr })}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/application/${dossierId}/recu`}>
            <FileText aria-hidden="true" /> Voir le reçu
          </Link>
        </Button>
      </div>
      <p className="mt-3 font-semibold text-brand-ink">{formatMoney(paid.amount / 100, paid.currency ?? "USD")} réglés</p>
    </section>
  );
}
