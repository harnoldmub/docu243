// Generates docs/matrice-demarches.md from the catalogue content.
// Usage: npx tsx scripts/export-matrix.ts
import { writeFileSync, mkdirSync } from "node:fs";
import { existingContent, newProcedures, BASE_PRICES, SERVICE_FEES, DEFAULT_SERVICE_FEE, type ProcedureContent } from "../server/catalog-content";
import { catalog as seed } from "../server/seed";

const KIND: Record<string, string> = {
  upload: "à fournir",
  original: "original",
  download: "formulaire",
  prerequisite: "prérequis",
  generated: "remis pendant la démarche",
  payment: "paiement",
};

const cell = (v: string | undefined) => (v && v.trim() ? v.replace(/\|/g, "/").replace(/\n/g, " ") : "—");

function mode(c: ProcedureContent) {
  if (c.editorialStatus === "draft") return "Brouillon (non publié)";
  return "Effectuée par MesDémarches pour le client";
}

function fee(slug: string) {
  const service = SERVICE_FEES[slug] ?? DEFAULT_SERVICE_FEE;
  const base = BASE_PRICES[slug];
  if (!base) return `Prix de base à fixer + ${service} USD de service (paiement impossible)`;
  return `${base.amount} USD + ${service} USD de service = ${base.amount + service} USD${base.note ? ` (${base.note})` : ""}`;
}

type Row = { slug: string; title: string; institution: string; content: ProcedureContent; seedStatus?: string; seedDocs?: string[] };

const rows: Row[] = [
  ...Object.entries(existingContent).map(([slug, content]) => {
    const s = seed.find((x) => x.slug === slug);
    return {
      slug,
      title: content.title ?? s?.title ?? slug,
      institution: content.institution ?? s?.institution ?? "",
      content,
      seedStatus: s?.status,
      seedDocs: s?.documents?.map((d) => d.name),
    };
  }),
  ...newProcedures.map((p) => ({ slug: p.slug, title: p.title, institution: p.institution, content: p as ProcedureContent })),
];

const header =
  "| Démarche | Profil / variantes | Territoire | Institution | Prérequis | Pièces | Étapes physiques | Prix (base + service) | Délai | Source | Date de vérification | Informations manquantes | Mode de disponibilité |";
const sep = "|" + " --- |".repeat(13);

const lines = rows.map(({ slug, title, institution, content: c, seedDocs }) => {
  const g = c.guide;
  const profiles = (g.questions ?? []).map((q) => `${q.label} : ${q.options.map((o) => o.label).join(" / ")}`).join(" ; ");
  const pieces = g.checklist?.length
    ? g.checklist.map((i) => `${i.label} (${KIND[i.kind]}${i.requirement === "conditional" ? ", selon situation" : ""})`).join(" ; ")
    : seedDocs?.length
      ? `Formulaire MesDémarches existant, non vérifié : ${seedDocs.join(" ; ")}`
      : "";
  const physical = (g.steps ?? []).filter((s) => s.where === "physical").map((s) => s.label).join(" ; ") || g.appointmentNote;
  const sources = (g.sources ?? []).map((s) => `[${s.label}](${s.url})`).join("<br>");
  const dates = Array.from(new Set((g.sources ?? []).map((s) => s.consultedAt))).join(", ");
  return `| ${[
    title,
    profiles,
    g.territory,
    institution,
    (g.prerequisites ?? []).map((p) => p.label).join(" ; "),
    pieces,
    physical,
    fee(slug),
    g.processingNote,
    sources,
    dates ? `Consultée le ${dates} ; validation interne : en attente` : "Aucune source consultée",
    (g.missingInfo ?? []).join(" ; "),
    mode(c),
  ]
    .map((v) => cell(v))
    .join(" | ")} |`;
});

const published = rows.filter((r) => r.content.editorialStatus !== "draft").length;
const md = `# Matrice des démarches MesDémarches

Générée par \`npx tsx scripts/export-matrix.ts\` à partir de \`server/catalog-content.ts\`.
Sources consultées le 14 octobre 2026. Aucune fiche n'a encore de date de validation interne : elles s'affichent comme « en cours de validation ».

- ${rows.length} démarches au total, dont ${published} publiées et ${rows.length - published} brouillons masqués du catalogue.
- Prix payé par le client = prix de base officiel (USD) + frais de service MesDémarches (100 USD passeport, 50 USD démarches complexes, 20 USD les autres). Sans prix de base, le paiement est bloqué jusqu'à sa saisie dans le back-office.
- « Formulaire MesDémarches existant, non vérifié » : pièces du formulaire en ligne d'origine, conservées pour ne pas casser les dossiers existants, mais non confirmées par une source.

${header}
${sep}
${lines.join("\n")}
`;

mkdirSync("docs", { recursive: true });
writeFileSync("docs/matrice-demarches.md", md);
console.log(`docs/matrice-demarches.md : ${rows.length} démarches`);
