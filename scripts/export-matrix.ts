// Generates docs/matrice-demarches.md from the catalogue content.
// Usage: npx tsx scripts/export-matrix.ts
import { writeFileSync, mkdirSync } from "node:fs";
import { existingContent, newProcedures, type ProcedureContent } from "../server/catalog-content";
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

function mode(c: ProcedureContent, seedStatus?: string) {
  const status = c.status ?? seedStatus ?? "coming_soon";
  const channel = c.channel ?? "docu243";
  if (c.editorialStatus === "draft") return "Brouillon (non publié)";
  if (channel === "external") return "Dépôt sur portail officiel";
  if (channel === "info") return "Information et préparation";
  return status === "available" ? "Dossier en ligne MesDémarches" : "À venir";
}

function fee(c: ProcedureContent) {
  if (c.feeStatus === "confirmed" && c.currency) return c.cost === 0 ? "Gratuit" : `${c.cost} ${c.currency}`;
  if (c.feeStatus === "variable") return c.guide.feeNote ? `Variable : ${c.guide.feeNote}` : "Variable";
  return "À confirmer";
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
  "| Démarche | Profil / variantes | Territoire | Institution | Prérequis | Pièces | Étapes physiques | Frais / devise | Délai | Source | Date de vérification | Informations manquantes | Mode de disponibilité |";
const sep = "|" + " --- |".repeat(13);

const lines = rows.map(({ title, institution, content: c, seedStatus, seedDocs }) => {
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
    fee(c),
    g.processingNote,
    sources,
    dates ? `Consultée le ${dates} ; validation interne : en attente` : "Aucune source consultée",
    (g.missingInfo ?? []).join(" ; "),
    mode(c, seedStatus),
  ]
    .map((v) => cell(v))
    .join(" | ")} |`;
});

const published = rows.filter((r) => r.content.editorialStatus !== "draft").length;
const md = `# Matrice des démarches MesDémarches

Générée par \`npx tsx scripts/export-matrix.ts\` à partir de \`server/catalog-content.ts\`.
Sources consultées le 14 octobre 2026. Aucune fiche n'a encore de date de validation interne : elles s'affichent comme « en cours de validation ».

- ${rows.length} démarches au total, dont ${published} publiées et ${rows.length - published} brouillons masqués du catalogue.
- « À confirmer » signifie qu'aucune source officielle n'a été trouvée : le montant enregistré n'est pas affiché.
- « Formulaire MesDémarches existant, non vérifié » : pièces du formulaire en ligne d'origine, conservées pour ne pas casser les dossiers existants, mais non confirmées par une source.

${header}
${sep}
${lines.join("\n")}
`;

mkdirSync("docs", { recursive: true });
writeFileSync("docs/matrice-demarches.md", md);
console.log(`docs/matrice-demarches.md : ${rows.length} démarches`);
