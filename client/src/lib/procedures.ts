import type { Procedure, ProcedureGuide } from "@shared/schema";

export type ProcedureWithGuide = Procedure & { guide: ProcedureGuide | null };

// ---------- Search ----------

const SYNONYMS: Record<string, string[]> = {
  nif: ["impot", "dgi"],
  impot: ["nif", "dgi"],
  passeport: ["voyage", "voyager", "passport"],
  voyage: ["passeport"],
  naissance: ["bebe", "enfant", "ne"],
  entreprise: ["societe", "commerce", "rccm", "guce"],
  societe: ["entreprise"],
  residence: ["domicile", "adresse"],
  domicile: ["residence"],
  casier: ["judiciaire", "antecedents"],
  bvm: ["bonne", "moeurs"],
  identite: ["cni", "carte"],
};

/** Lowercase, strip accents and ligatures, collapse spaces. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Very simple French stemming: drops a final plural s/x. */
function stem(word: string) {
  return word.length > 3 ? word.replace(/[sx]$/, "") : word;
}

function haystack(p: ProcedureWithGuide) {
  return normalize(
    [p.title, p.description, p.category, p.institution, ...(p.guide?.keywords ?? [])].join(" "),
  );
}

/** Scores a procedure against a query; 0 means no match. */
export function matchScore(p: ProcedureWithGuide, query: string): number {
  const q = normalize(query);
  if (!q) return 1;
  const text = haystack(p);
  const title = normalize(p.title);
  const words = q.split(" ").map(stem).filter((w) => w.length > 1 || /\d/.test(w));
  if (!words.length) return 1;
  let score = 0;
  for (const w of words) {
    const variants = [w, ...(SYNONYMS[w] ?? [])];
    const hit = variants.find((v) => text.includes(v));
    if (!hit) return 0;
    score += title.includes(hit) ? 3 : 1;
  }
  if (title.startsWith(q)) score += 4;
  return score;
}

export function searchProcedures(list: ProcedureWithGuide[], query: string) {
  if (!normalize(query)) return list;
  return list
    .map((p) => ({ p, s: matchScore(p, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.p);
}

// ---------- Fees ----------

const formatters: Record<string, Intl.NumberFormat> = {};
export function formatMoney(amount: number, currency: string) {
  const key = currency;
  formatters[key] ??= new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    maximumFractionDigits: currency === "USD" ? 2 : 0,
    minimumFractionDigits: 0,
  });
  return formatters[key].format(amount);
}

/** Official base price + MesDémarches service fee, in USD. Null when the base price is not set. */
export function priceOf(p: Pick<Procedure, "cost" | "currency" | "feeStatus" | "serviceFee">) {
  if (p.feeStatus !== "confirmed" || p.currency !== "USD") return null;
  return { official: p.cost, service: p.serviceFee, total: p.cost + p.serviceFee };
}

export function feeLabel(p: Pick<Procedure, "cost" | "currency" | "feeStatus" | "serviceFee">): { label: string; hint?: string } {
  const price = priceOf(p);
  if (price) {
    return {
      label: formatMoney(price.total, "USD"),
      hint: price.official > 0 ? `dont ${formatMoney(price.official, "USD")} de frais officiels` : "frais de service inclus",
    };
  }
  return { label: "Tarif à venir", hint: `Frais de service : ${formatMoney(p.serviceFee ?? 20, "USD")}` };
}

// ---------- Delay ----------

export function delayLabel(p: Pick<Procedure, "verifiedAt" | "estimatedDays"> & { guide: ProcedureGuide | null }) {
  if (p.verifiedAt && p.estimatedDays > 0) {
    return `${p.estimatedDays} jour${p.estimatedDays > 1 ? "s" : ""}`;
  }
  return p.guide?.processingNote ? shortDelay(p.guide.processingNote) : "À confirmer";
}

function shortDelay(note: string) {
  const m = note.match(/^([^,.;]+?)(?: selon| d'après| à la commune|,|\.|$)/i);
  const first = (m?.[1] ?? note).trim();
  return first.length > 40 ? "Voir la fiche" : first;
}

// ---------- Availability ----------

export type AvailabilityKey = "online" | "external" | "info" | "soon";

export function availability(p: Pick<Procedure, "status" | "channel">): {
  key: AvailabilityKey;
  label: string;
  description: string;
} {
  if (p.status === "available") {
    return {
      key: "online",
      label: "",
      description: "Envoyez vos documents et réglez en ligne : notre équipe effectue la démarche pour vous.",
    };
  }
  return {
    key: "soon",
    label: "À venir",
    description: "Cette démarche n'est pas encore proposée. Les informations sont données à titre indicatif.",
  };
}

export const AVAILABILITY_FILTERS: Array<{ value: AvailabilityKey; label: string }> = [
  { value: "soon", label: "À venir" },
];

export const CATEGORY_ORDER = [
  "Identité et voyage",
  "État civil et famille",
  "Justice et documents communaux",
  "Entreprise et fiscalité",
  "Travail et protection sociale",
  "Éducation",
  "Transport",
  "Foncier et construction",
];

export function sortCategories(categories: string[]) {
  return [...categories].sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b, "fr");
  });
}

export function isVerified(p: Pick<Procedure, "verifiedAt">) {
  return !!p.verifiedAt;
}

export function formatDate(value: string | Date | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("fr-FR", opts).format(d);
}
