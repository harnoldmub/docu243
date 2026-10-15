import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ExternalLink, Plus, Save, Trash2 } from "lucide-react";
import type { Procedure, ProcedureField, ProcedureGuide, ProcedureRequiredDoc } from "@shared/schema";
import { RequireAuth } from "@/components/require-auth";
import { AdminHeader } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Notice } from "@/components/states";
import { Pill, type Tone } from "@/components/status-badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CATEGORY_ORDER, formatMoney, normalize } from "@/lib/procedures";
import { cn } from "@/lib/utils";

type Detail = Procedure & { fields: ProcedureField[]; requiredDocuments: ProcedureRequiredDoc[] };
type Source = NonNullable<ProcedureGuide["sources"]>[number];

export const EDITORIAL: Record<string, { label: string; tone: Tone }> = {
  draft: { label: "Brouillon", tone: "neutral" },
  to_verify: { label: "À vérifier", tone: "warning" },
  validated: { label: "Validé", tone: "info" },
  published: { label: "Publié", tone: "success" },
  archived: { label: "Archivé", tone: "neutral" },
};
const STALE_DAYS = 180;

/** Problems an editor should look at before (or after) publishing a procedure. */
export function editorialFlags(p: Pick<Procedure, "guide" | "feeStatus" | "currency" | "verifiedAt" | "editorialStatus" | "channel" | "externalUrl">, docsCount = 0) {
  const g = p.guide ?? {};
  const flags: string[] = [];
  if (!g.sources?.length) flags.push("Source absente");
  if (!g.checklist?.length && !docsCount) flags.push("Liste des pièces incomplète");
  if (g.missingInfo?.length) flags.push(`${g.missingInfo.length} point${g.missingInfo.length > 1 ? "s" : ""} à confirmer`);
  if (g.contradictory) flags.push("Information contradictoire");
  if (p.feeStatus !== "confirmed" || p.currency !== "USD") flags.push("Prix de base en USD non fixé : paiement impossible");
  if (!p.verifiedAt) flags.push("Validation interne absente");
  else if ((Date.now() - new Date(p.verifiedAt).getTime()) / 86_400_000 > STALE_DAYS) flags.push("Fiche ancienne à revoir");
  if (p.channel === "external" && !p.externalUrl) flags.push("Lien du portail officiel manquant");
  return flags;
}

type Form = {
  title: string;
  description: string;
  category: string;
  institution: string;
  estimatedDays: number;
  cost: number;
  serviceFee: number;
  currency: "" | "CDF" | "USD";
  feeStatus: "confirmed" | "variable" | "unconfirmed";
  status: "available" | "coming_soon";
  channel: "docu243" | "external" | "info";
  externalUrl: string;
  editorialStatus: string;
  verifiedAt: string;
  isActive: boolean;
  isPriority: boolean;
  sortOrder: number;
  territory: string;
  outputDocument: string;
  feeNote: string;
  processingNote: string;
  appointmentNote: string;
  conditions: string;
  missingInfo: string;
  contradictory: boolean;
  sources: Source[];
  advanced: string;
};

const ADVANCED_KEYS = ["keywords", "prerequisites", "steps", "questions", "checklist"] as const;

function toForm(p: Detail): Form {
  const g = p.guide ?? {};
  const advanced = Object.fromEntries(ADVANCED_KEYS.filter((k) => g[k] !== undefined).map((k) => [k, g[k]]));
  return {
    title: p.title,
    description: p.description,
    category: p.category,
    institution: p.institution,
    estimatedDays: p.estimatedDays,
    cost: p.cost,
    serviceFee: p.serviceFee,
    currency: (p.currency as Form["currency"]) ?? "",
    feeStatus: (p.feeStatus as Form["feeStatus"]) ?? "unconfirmed",
    status: p.status as Form["status"],
    channel: (p.channel as Form["channel"]) ?? "docu243",
    externalUrl: p.externalUrl ?? "",
    editorialStatus: p.editorialStatus,
    verifiedAt: p.verifiedAt ? new Date(p.verifiedAt).toISOString().slice(0, 10) : "",
    isActive: p.isActive,
    isPriority: p.isPriority,
    sortOrder: p.sortOrder,
    territory: g.territory ?? "",
    outputDocument: g.outputDocument ?? "",
    feeNote: g.feeNote ?? "",
    processingNote: g.processingNote ?? "",
    appointmentNote: g.appointmentNote ?? "",
    conditions: (g.conditions ?? []).join("\n"),
    missingInfo: (g.missingInfo ?? []).join("\n"),
    contradictory: !!g.contradictory,
    sources: g.sources ?? [],
    advanced: JSON.stringify(advanced, null, 2),
  };
}

function lines(text: string) {
  return text.split("\n").map((l) => l.trim()).filter(Boolean);
}

function toPayload(f: Form) {
  const advanced = f.advanced.trim() ? JSON.parse(f.advanced) : {};
  const guide: ProcedureGuide = {
    ...advanced,
    territory: f.territory || undefined,
    outputDocument: f.outputDocument || undefined,
    feeNote: f.feeNote || undefined,
    processingNote: f.processingNote || undefined,
    appointmentNote: f.appointmentNote || undefined,
    conditions: lines(f.conditions),
    missingInfo: lines(f.missingInfo),
    contradictory: f.contradictory || undefined,
    sources: f.sources.filter((s) => s.url && s.label),
  };
  return {
    title: f.title,
    description: f.description,
    category: f.category,
    institution: f.institution,
    estimatedDays: f.estimatedDays,
    cost: f.cost,
    serviceFee: f.serviceFee,
    currency: f.currency || null,
    feeStatus: f.feeStatus,
    status: f.status,
    channel: f.channel,
    externalUrl: f.externalUrl || null,
    editorialStatus: f.editorialStatus,
    verifiedAt: f.verifiedAt || null,
    isActive: f.isActive,
    isPriority: f.isPriority,
    sortOrder: f.sortOrder,
    guide,
  };
}

export default function ProcedureManagementPage() {
  return (
    <RequireAuth staff>
      <ProcedureManagement />
    </RequireAuth>
  );
}

function ProcedureManagement() {
  const { user } = useAuth();
  const canEdit = user?.role === "admin" || user?.role === "super_admin";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const { data: procedures = [], isLoading } = useQuery<Procedure[]>({ queryKey: ["/api/admin/procedures"] });
  const selected = procedures.find((p) => p.id === selectedId);
  const { data: detail } = useQuery<Detail>({ queryKey: [`/api/procedures/${selected?.slug}`], enabled: !!selected?.slug, staleTime: 0 });

  useEffect(() => {
    if (!selectedId && procedures.length) setSelectedId(procedures[0].id);
  }, [procedures, selectedId]);

  const filtered = useMemo(
    () =>
      procedures
        .filter((p) => !statusFilter || p.editorialStatus === statusFilter)
        .filter((p) => !search || normalize(`${p.title} ${p.institution} ${p.category} ${p.slug}`).includes(normalize(search))),
    [procedures, search, statusFilter],
  );

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/procedures"] });
    queryClient.invalidateQueries({ queryKey: ["/api/procedures"] });
    if (selected) queryClient.invalidateQueries({ queryKey: [`/api/procedures/${selected.slug}`] });
  };

  return (
    <div className="bg-brand-mist pb-20">
      <AdminHeader
        title="Démarches"
        intro="Contenu des fiches, disponibilité, frais, sources et circuit de validation."
        actions={
          canEdit && (
            <Button variant="yellow" onClick={() => setCreateOpen(true)}>
              <Plus aria-hidden="true" /> Nouvelle démarche
            </Button>
          )
        }
      />
      <div className="md-container grid gap-8 pt-8 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-3">
          <label htmlFor="proc-search" className="sr-only">Filtrer les démarches</label>
          <input id="proc-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filtrer…" className="field-input" />
          <label htmlFor="proc-status" className="sr-only">Statut éditorial</label>
          <select id="proc-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="field-input">
            <option value="">Tous les statuts éditoriaux</option>
            {Object.entries(EDITORIAL).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <p className="text-sm text-brand-ink-2">{filtered.length} démarche{filtered.length > 1 ? "s" : ""}</p>
          <ul className="max-h-[70vh] space-y-1.5 overflow-y-auto pr-1">
            {isLoading
              ? [0, 1, 2, 3].map((i) => <li key={i} className="skeleton h-16" />)
              : filtered.map((p) => {
                  const flags = editorialFlags(p);
                  return (
                    <li key={p.id}>
                      <button
                        onClick={() => setSelectedId(p.id)}
                        aria-current={selectedId === p.id ? "true" : undefined}
                        className={cn(
                          "w-full rounded-xl border bg-white p-3 text-left transition-colors",
                          selectedId === p.id ? "border-brand-royal ring-2 ring-brand-royal/20" : "border-transparent hover:border-brand-line",
                        )}
                      >
                        <span className="block font-semibold text-brand-ink">{p.title}</span>
                        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <Pill tone={EDITORIAL[p.editorialStatus]?.tone ?? "neutral"}>{EDITORIAL[p.editorialStatus]?.label ?? p.editorialStatus}</Pill>
                          {flags.length > 0 && <span className="text-xs font-semibold text-[var(--st-warning)]">{flags.length} signalement{flags.length > 1 ? "s" : ""}</span>}
                        </span>
                      </button>
                    </li>
                  );
                })}
          </ul>
        </aside>

        <div className="min-w-0">
          {detail && selected?.id === detail.id ? (
            <Editor key={detail.id + detail.updatedAt} detail={detail} canEdit={canEdit} onSaved={refresh} />
          ) : (
            <div className="skeleton h-96" />
          )}
        </div>
      </div>

      <CreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => {
          refresh();
          setSelectedId(id);
          toast({ title: "Démarche créée", description: "Elle est enregistrée en brouillon et n'est pas visible publiquement." });
        }}
      />
    </div>
  );
}

function Section({ title, children, intro }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
      <h2 className="font-display text-lg font-bold text-brand-ink">{title}</h2>
      {intro && <p className="mt-1 text-sm text-brand-ink-2">{intro}</p>}
      <div className="mt-5 grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function F({ label, hint, children, wide }: { label: string; hint?: string; children: React.ReactElement; wide?: boolean }) {
  return (
    <label className={cn("block", wide && "md:col-span-2")}>
      <span className="mb-1.5 block font-semibold text-brand-ink">{label}</span>
      {hint && <span className="mb-2 block text-sm text-brand-ink-2">{hint}</span>}
      {children}
    </label>
  );
}

function Editor({ detail, canEdit, onSaved }: { detail: Detail; canEdit: boolean; onSaved: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState<Form>(() => toForm(detail));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const flags = editorialFlags({ ...detail }, detail.requiredDocuments.length);

  const save = useMutation({
    mutationFn: async () => {
      let payload;
      try {
        payload = toPayload(form);
      } catch {
        throw new Error("Le contenu avancé n'est pas un JSON valide.");
      }
      return (await apiRequest("PATCH", `/api/admin/procedures/${detail.id}`, payload)).json();
    },
    onSuccess: () => {
      onSaved();
      toast({ title: "Démarche enregistrée" });
    },
    onError: (e) => toast({ title: "Enregistrement impossible", description: e.message, variant: "destructive" }),
  });

  const publishWarning =
    form.editorialStatus === "published" && detail.editorialStatus !== "published" && (!form.sources.length || !form.verifiedAt)
      ? "Vous publiez une fiche sans source ou sans date de validation interne : elle sera signalée comme « en cours de validation »."
      : null;

  const disabled = !canEdit;

  return (
    <fieldset disabled={disabled} className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="display-2 text-[1.75rem]">{detail.title}</h2>
          <p className="text-sm text-brand-ink-2">/{detail.slug}</p>
        </div>
        <Link href={`/procedure/${detail.slug}`} className="link-arrow">
          Voir la fiche <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {!canEdit && <Notice tone="neutral">Lecture seule : seuls les administrateurs peuvent modifier les démarches.</Notice>}
      {flags.length > 0 && (
        <Notice tone="warning" icon={<AlertTriangle />} title="Signalements">
          <ul className="mt-1 list-disc pl-5">
            {flags.map((f) => <li key={f}>{f}</li>)}
          </ul>
        </Notice>
      )}

      <Section title="Circuit de validation" intro="Brouillon, À vérifier, Validé, Publié, Archivé. Seules les fiches publiées et actives apparaissent dans le catalogue.">
        <F label="Statut éditorial">
          <select className="field-input" value={form.editorialStatus} onChange={(e) => set("editorialStatus", e.target.value)}>
            {Object.entries(EDITORIAL).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </F>
        <F label="Date de validation interne" hint="À renseigner après vérification auprès de l'administration.">
          <input type="date" className="field-input" value={form.verifiedAt} onChange={(e) => set("verifiedAt", e.target.value)} />
        </F>
        {publishWarning && <div className="md:col-span-2"><Notice tone="warning" icon={<AlertTriangle />}>{publishWarning}</Notice></div>}
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="h-5 w-5 accent-[var(--md-royal)]" />
          <span className="font-semibold">Active</span>
        </label>
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" checked={form.isPriority} onChange={(e) => set("isPriority", e.target.checked)} className="h-5 w-5 accent-[var(--md-royal)]" />
          <span className="font-semibold">Mise en avant sur l'accueil</span>
        </label>
        <F label="Ordre d'affichage">
          <input type="number" className="field-input" value={form.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} />
        </F>
      </Section>

      <Section title="Identité de la démarche">
        <F label="Titre"><input className="field-input" value={form.title} onChange={(e) => set("title", e.target.value)} /></F>
        <F label="Institution"><input className="field-input" value={form.institution} onChange={(e) => set("institution", e.target.value)} /></F>
        <F label="Catégorie">
          <input className="field-input" list="categories" value={form.category} onChange={(e) => set("category", e.target.value)} />
        </F>
        <F label="Territoire"><input className="field-input" value={form.territory} onChange={(e) => set("territory", e.target.value)} /></F>
        <F label="Description" wide><textarea rows={3} className="field-input py-3" value={form.description} onChange={(e) => set("description", e.target.value)} /></F>
        <F label="Document obtenu" wide><input className="field-input" value={form.outputDocument} onChange={(e) => set("outputDocument", e.target.value)} /></F>
        <datalist id="categories">{CATEGORY_ORDER.map((c) => <option key={c} value={c} />)}</datalist>
      </Section>

      <Section title="Disponibilité">
        <F label="Mode de dépôt">
          <select className="field-input" value={form.channel} onChange={(e) => set("channel", e.target.value as Form["channel"])}>
            <option value="docu243">Dossier dans MesDémarches</option>
            <option value="external">Portail officiel externe</option>
            <option value="info">Information et préparation uniquement</option>
          </select>
        </F>
        <F label="Dossier en ligne" hint="« Ouvert » n'a d'effet que pour un dépôt dans MesDémarches.">
          <select className="field-input" value={form.status} onChange={(e) => set("status", e.target.value as Form["status"])}>
            <option value="available">Ouvert</option>
            <option value="coming_soon">À venir</option>
          </select>
        </F>
        <F label="Lien du portail officiel" wide>
          <input type="url" className="field-input" value={form.externalUrl} onChange={(e) => set("externalUrl", e.target.value)} placeholder="https://" />
        </F>
      </Section>

      <Section
        title="Prix et délais"
        intro="Prix payé par le client = prix de base officiel + frais de service. Le paiement n'est possible que si le prix de base est en USD et « Confirmé »."
      >
        <F label="Prix de base officiel">
          <input type="number" min={0} className="field-input" value={form.cost} onChange={(e) => set("cost", Number(e.target.value))} />
        </F>
        <F label="Devise">
          <select className="field-input" value={form.currency} onChange={(e) => set("currency", e.target.value as Form["currency"])}>
            <option value="">Inconnue</option>
            <option value="CDF">CDF</option>
            <option value="USD">USD</option>
          </select>
        </F>
        <F label="Statut du tarif" hint={form.currency ? `Aperçu : ${formatMoney(form.cost, form.currency)}` : undefined}>
          <select className="field-input" value={form.feeStatus} onChange={(e) => set("feeStatus", e.target.value as Form["feeStatus"])}>
            <option value="confirmed">Confirmé (payable)</option>
            <option value="unconfirmed">À fixer (non payable)</option>
          </select>
        </F>
        <F label="Frais de service MesDémarches (USD)" hint="100 pour le passeport, 50 ou 20 pour les autres démarches.">
          <input type="number" min={0} className="field-input" value={form.serviceFee} onChange={(e) => set("serviceFee", Number(e.target.value))} />
        </F>
        <F label="Délai interne (jours)" hint="Affiché seulement si la fiche a une date de validation.">
          <input type="number" min={0} className="field-input" value={form.estimatedDays} onChange={(e) => set("estimatedDays", Number(e.target.value))} />
        </F>
        <F label="Précision sur les frais" wide><input className="field-input" value={form.feeNote} onChange={(e) => set("feeNote", e.target.value)} /></F>
        <F label="Délai de traitement administratif (texte affiché)" wide><input className="field-input" value={form.processingNote} onChange={(e) => set("processingNote", e.target.value)} /></F>
        <F label="Présence en personne" wide><input className="field-input" value={form.appointmentNote} onChange={(e) => set("appointmentNote", e.target.value)} /></F>
      </Section>

      <Section title="Sources">
        <div className="space-y-3 md:col-span-2">
          {form.sources.map((s, i) => (
            <div key={i} className="grid gap-2 rounded-xl border border-brand-line p-3 md:grid-cols-[1fr_1fr_auto]">
              <input aria-label="Intitulé de la source" className="field-input" placeholder="Intitulé" value={s.label} onChange={(e) => set("sources", form.sources.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <input aria-label="Adresse de la source" type="url" className="field-input" placeholder="https://" value={s.url} onChange={(e) => set("sources", form.sources.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
              <Button type="button" variant="ghost" size="icon" aria-label="Retirer cette source" onClick={() => set("sources", form.sources.filter((_, j) => j !== i))}>
                <Trash2 aria-hidden="true" />
              </Button>
              <input aria-label="Administration" className="field-input" placeholder="Administration" value={s.administration} onChange={(e) => set("sources", form.sources.map((x, j) => (j === i ? { ...x, administration: e.target.value } : x)))} />
              <input aria-label="Date de consultation" type="date" className="field-input" value={s.consultedAt} onChange={(e) => set("sources", form.sources.map((x, j) => (j === i ? { ...x, consultedAt: e.target.value } : x)))} />
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => set("sources", [...form.sources, { label: "", url: "", administration: "", consultedAt: new Date().toISOString().slice(0, 10) }])}>
            <Plus aria-hidden="true" /> Ajouter une source
          </Button>
        </div>
      </Section>

      <Section title="Contenu de la fiche">
        <F label="Conditions (une par ligne)" wide><textarea rows={3} className="field-input py-3" value={form.conditions} onChange={(e) => set("conditions", e.target.value)} /></F>
        <F label="Points à confirmer (un par ligne)" wide><textarea rows={3} className="field-input py-3" value={form.missingInfo} onChange={(e) => set("missingInfo", e.target.value)} /></F>
        <label className="flex min-h-11 items-center gap-3 md:col-span-2">
          <input type="checkbox" checked={form.contradictory} onChange={(e) => set("contradictory", e.target.checked)} className="h-5 w-5 accent-[var(--md-royal)]" />
          <span className="font-semibold">Les sources se contredisent</span>
        </label>
        <F
          label="Contenu avancé (JSON)"
          hint="Mots-clés, prérequis, étapes, questions et liste de pièces conditionnelle. Une pièce n'est obligatoire que si « requirement » vaut « required »."
          wide
        >
          <textarea
            rows={14}
            spellCheck={false}
            className="field-input py-3 font-mono text-sm"
            value={form.advanced}
            onChange={(e) => {
              set("advanced", e.target.value);
              try {
                JSON.parse(e.target.value || "{}");
                setJsonError(null);
              } catch {
                setJsonError("JSON invalide");
              }
            }}
            aria-invalid={jsonError ? true : undefined}
          />
        </F>
        {jsonError && <p role="alert" className="text-sm font-semibold text-[var(--st-danger)] md:col-span-2">{jsonError}</p>}
      </Section>

      <FieldsAndDocs detail={detail} canEdit={canEdit} onChanged={onSaved} />

      {canEdit && (
        <div className="sticky bottom-4 z-10 flex justify-end">
          <Button size="lg" className="shadow-float" loading={save.isPending} disabled={!!jsonError} onClick={() => save.mutate()}>
            {!save.isPending && <Save aria-hidden="true" />} Enregistrer
          </Button>
        </div>
      )}
    </fieldset>
  );
}

function FieldsAndDocs({ detail, canEdit, onChanged }: { detail: Detail; canEdit: boolean; onChanged: () => void }) {
  const [field, setField] = useState({ label: "", type: "text", required: true });
  const [doc, setDoc] = useState({ name: "", description: "", acceptedFormats: "pdf,jpg,png", maxSizeMb: 5, required: true });
  const addField = useMutation({
    mutationFn: async () => apiRequest("POST", `/api/admin/procedures/${detail.id}/fields`, field),
    onSuccess: () => {
      setField({ label: "", type: "text", required: true });
      onChanged();
    },
  });
  const delField = useMutation({ mutationFn: async (id: string) => apiRequest("DELETE", `/api/admin/procedure-fields/${id}`), onSuccess: onChanged });
  const addDoc = useMutation({
    mutationFn: async () =>
      apiRequest("POST", `/api/admin/procedures/${detail.id}/documents`, {
        ...doc,
        acceptedFormats: doc.acceptedFormats.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
      }),
    onSuccess: () => {
      setDoc({ name: "", description: "", acceptedFormats: "pdf,jpg,png", maxSizeMb: 5, required: true });
      onChanged();
    },
  });
  const delDoc = useMutation({ mutationFn: async (id: string) => apiRequest("DELETE", `/api/admin/procedure-documents/${id}`), onSuccess: onChanged });

  return (
    <section className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
      <h2 className="font-display text-lg font-bold text-brand-ink">Formulaire du dossier en ligne</h2>
      <p className="mt-1 text-sm text-brand-ink-2">
        Ces champs et pièces sont demandés dans MesDémarches. Les dossiers déjà transmis conservent la version en vigueur lors de leur envoi.
      </p>
      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="font-sans font-bold">Informations demandées</h3>
          <ul className="mt-2 divide-y divide-brand-line rounded-xl border border-brand-line">
            {detail.fields.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-2 px-3 py-2">
                <span>{f.label} <span className="text-sm text-brand-ink-2">({f.type}{f.required ? ", obligatoire" : ""})</span></span>
                {canEdit && (
                  <Button variant="ghost" size="icon" aria-label={`Supprimer le champ ${f.label}`} onClick={() => delField.mutate(f.id)}>
                    <Trash2 aria-hidden="true" />
                  </Button>
                )}
              </li>
            ))}
            {!detail.fields.length && <li className="px-3 py-2 text-sm text-brand-ink-2">Aucun champ.</li>}
          </ul>
          {canEdit && (
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <input aria-label="Libellé du nouveau champ" className="field-input" placeholder="Libellé" value={field.label} onChange={(e) => setField({ ...field, label: e.target.value })} />
              <select aria-label="Type du champ" className="field-input" value={field.type} onChange={(e) => setField({ ...field, type: e.target.value })}>
                <option value="text">Texte</option>
                <option value="number">Nombre</option>
                <option value="date">Date</option>
                <option value="textarea">Texte long</option>
              </select>
              <Button variant="outline" disabled={!field.label} loading={addField.isPending} onClick={() => addField.mutate()}>Ajouter</Button>
            </div>
          )}
        </div>
        <div>
          <h3 className="font-sans font-bold">Pièces à envoyer</h3>
          <ul className="mt-2 divide-y divide-brand-line rounded-xl border border-brand-line">
            {detail.requiredDocuments.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2 px-3 py-2">
                <span>
                  {d.name}{" "}
                  <span className="text-sm text-brand-ink-2">({d.acceptedFormats.join(", ")}, {d.maxSizeMb} Mo{d.required ? ", obligatoire" : ""})</span>
                </span>
                {canEdit && (
                  <Button variant="ghost" size="icon" aria-label={`Supprimer la pièce ${d.name}`} onClick={() => delDoc.mutate(d.id)}>
                    <Trash2 aria-hidden="true" />
                  </Button>
                )}
              </li>
            ))}
            {!detail.requiredDocuments.length && <li className="px-3 py-2 text-sm text-brand-ink-2">Aucune pièce.</li>}
          </ul>
          {canEdit && (
            <div className="mt-3 grid gap-2">
              <input aria-label="Nom de la pièce" className="field-input" placeholder="Nom de la pièce" value={doc.name} onChange={(e) => setDoc({ ...doc, name: e.target.value })} />
              <input aria-label="Description de la pièce" className="field-input" placeholder="Description" value={doc.description} onChange={(e) => setDoc({ ...doc, description: e.target.value })} />
              <div className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
                <input aria-label="Formats acceptés" className="field-input" value={doc.acceptedFormats} onChange={(e) => setDoc({ ...doc, acceptedFormats: e.target.value })} />
                <input aria-label="Taille maximale en Mo" type="number" min={1} max={10} className="field-input" value={doc.maxSizeMb} onChange={(e) => setDoc({ ...doc, maxSizeMb: Number(e.target.value) })} />
                <Button variant="outline" disabled={!doc.name} loading={addDoc.isPending} onClick={() => addDoc.mutate()}>Ajouter</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CreateDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: (id: string) => void }) {
  const [f, setF] = useState({ title: "", description: "", category: "", institution: "" });
  const [error, setError] = useState<string | null>(null);
  const create = useMutation({
    mutationFn: async () =>
      (await apiRequest("POST", "/api/admin/procedures", { ...f, estimatedDays: 0, cost: 0, status: "coming_soon", channel: "info", editorialStatus: "draft" })).json(),
    onSuccess: (p) => {
      onOpenChange(false);
      setF({ title: "", description: "", category: "", institution: "" });
      onCreated(p.id);
    },
    onError: (e) => setError(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Nouvelle démarche</DialogTitle>
          <DialogDescription>Elle est créée en brouillon : complétez sa fiche et ses sources avant de la publier.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {(["title", "institution", "category", "description"] as const).map((k) => (
            <label key={k} className="block">
              <span className="mb-1.5 block font-semibold">{{ title: "Titre", institution: "Institution", category: "Catégorie", description: "Description" }[k]}</span>
              <input className="field-input" list={k === "category" ? "categories-new" : undefined} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
            </label>
          ))}
          <datalist id="categories-new">{CATEGORY_ORDER.map((c) => <option key={c} value={c} />)}</datalist>
          {error && <p role="alert" className="text-sm font-semibold text-[var(--st-danger)]">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button loading={create.isPending} disabled={f.title.length < 3 || f.description.length < 3 || f.category.length < 2 || f.institution.length < 2} onClick={() => create.mutate()}>
            Créer en brouillon
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
