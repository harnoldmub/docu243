import type { ProcedureGuide } from "@shared/schema";

// Editorial content for the catalogue. Every list below comes from the source
// cited in `guide.sources`; anything that could not be confirmed is listed in
// `guide.missingInfo` instead of being filled in.
// Sources consulted on 2026-10-14.

const CONSULTED = "2026-10-14";

const SP = (id: number, label: string, administration: string) => ({
  label,
  url: `https://servicepublic.gouv.cd/service/${id}`,
  administration,
  consultedAt: CONSULTED,
});

const KINSHASA_FEES =
  "Les frais sont fixés par chaque commune et publiés en USD ou en CDF. Renseignez-vous auprès de votre commune avant de vous déplacer.";

export type ProcedureContent = {
  title?: string;
  description?: string;
  category?: string;
  institution?: string;
  cost?: number;
  currency?: "CDF" | "USD" | null;
  feeStatus?: "confirmed" | "variable" | "unconfirmed";
  status?: "available" | "coming_soon";
  channel?: "docu243" | "external" | "info";
  externalUrl?: string | null;
  editorialStatus?: "draft" | "to_verify" | "validated" | "published" | "archived";
  isPriority?: boolean;
  sortOrder?: number;
  estimatedDays?: number;
  icon?: string;
  guide: ProcedureGuide;
};

// Categories used across the catalogue (display names).
export const CATEGORIES = {
  identity: "Identité et voyage",
  civil: "État civil et famille",
  justice: "Justice et documents communaux",
  business: "Entreprise et fiscalité",
  work: "Travail et protection sociale",
  education: "Éducation",
  transport: "Transport",
  land: "Foncier et construction",
};

// ---------------------------------------------------------------------------
// Existing procedures (matched by slug). Only the listed properties change.
// `title`, `description`, `institution` and `category` replace the legacy
// values only when those still equal the original seed text.
// ---------------------------------------------------------------------------
export const existingContent: Record<string, ProcedureContent> = {
  "acte-de-naissance": {
    title: "Acte de naissance",
    description:
      "Demander un extrait ou une copie d'un acte de naissance déjà enregistré à l'état civil de la commune.",
    category: CATEGORIES.civil,
    institution: "Commune, service de l'état civil",
    currency: "CDF",
    feeStatus: "variable",
    isPriority: true,
    sortOrder: 1,
    guide: {
      keywords: ["naissance", "extrait", "copie intégrale", "état civil", "acte"],
      territory: "Kinshasa (frais publiés pour 15 communes)",
      outputDocument: "Extrait ou copie de l'acte de naissance, délivré par l'officier de l'état civil.",
      conditions: [
        "La naissance doit déjà avoir été déclarée et enregistrée à l'état civil.",
        "Si elle n'a jamais été déclarée, commencez par la déclaration de naissance.",
      ],
      prerequisites: [
        { label: "Naissance enregistrée à l'état civil", question: "La naissance n'a jamais été déclarée ?", procedureSlug: "declaration-de-naissance" },
      ],
      questions: [
        {
          id: "requester",
          label: "Qui fait la demande ?",
          options: [
            { value: "self", label: "La personne concernée ou un parent" },
            { value: "proxy", label: "Une autre personne, pour le compte de quelqu'un" },
          ],
        },
      ],
      checklist: [
        { id: "id", label: "Pièce d'identité du demandeur", kind: "upload", requirement: "required" },
        {
          id: "ref",
          label: "Références de l'acte de naissance",
          description: "Numéro d'acte, date, ou toute information qui permet de retrouver l'acte.",
          kind: "upload",
          requirement: "required",
        },
        {
          id: "proxy",
          label: "Procuration",
          description: "Nécessaire si une autre personne dépose la demande.",
          kind: "upload",
          requirement: "conditional",
          when: { requester: ["proxy"] },
        },
      ],
      steps: [
        { label: "Préparez votre dossier", description: "Rassemblez les références de l'acte et votre pièce d'identité.", where: "online" },
        { label: "Transmettez votre demande", description: "Déposez votre dossier dans MesDémarches.", where: "online" },
        { label: "Retirez le document à la commune", description: "Le document est délivré par l'officier de l'état civil.", where: "physical" },
      ],
      feeNote: KINSHASA_FEES,
      processingNote: "Immédiat à 1 jour ouvrable à la commune, selon le catalogue officiel.",
      sources: [
        SP(7660, "Extrait d'acte de naissance délivré à la Commune", "Commune, service de l'état civil"),
        SP(7638, "Acte de naissance délivré à la commune", "Commune, service de l'état civil"),
      ],
      missingInfo: [
        "Délai de traitement du dossier transmis via MesDémarches (en plus du délai communal).",
        "Communes desservies en dehors de Kinshasa.",
      ],
    },
  },

  "certificat-de-residence": {
    title: "Attestation de résidence",
    description: "Faire attester officiellement votre adresse par la commune où vous habitez.",
    category: CATEGORIES.justice,
    institution: "Commune, service de la population",
    currency: "CDF",
    feeStatus: "variable",
    isPriority: true,
    sortOrder: 2,
    guide: {
      keywords: ["résidence", "domicile", "adresse", "certificat de résidence", "attestation"],
      territory: "Kinshasa (frais publiés pour 14 communes)",
      outputDocument: "Attestation de résidence délivrée par la commune.",
      conditions: ["Vous habitez dans la commune à laquelle vous faites la demande."],
      checklist: [
        {
          id: "id",
          label: "Pièce d'identité en cours de validité",
          description: "Carte d'électeur ou d'identité, passeport, permis de conduire, ou permis de séjour pour les étrangers.",
          kind: "upload",
          requirement: "required",
        },
        {
          id: "proof",
          label: "Preuve de résidence",
          description: "Par exemple une facture récente REGIDESO (eau) ou SNEL (électricité).",
          kind: "upload",
          requirement: "required",
        },
        {
          id: "lease",
          label: "Livret de logeur ou contrat de bail valide",
          kind: "upload",
          requirement: "required",
        },
        {
          id: "chief",
          label: "Attestation du chef de quartier ou d'avenue",
          description: "Demandée par certaines communes.",
          kind: "original",
          requirement: "conditional",
        },
        { id: "pay", label: "Preuve de paiement des frais administratifs", kind: "payment", requirement: "required" },
      ],
      steps: [
        { label: "Préparez vos justificatifs", where: "online" },
        { label: "Transmettez votre demande", description: "Déposez votre dossier dans MesDémarches.", where: "online" },
        { label: "Fiche communale à remplir sur place", description: "Le catalogue officiel indique qu'une fiche d'identification s'achète et se remplit à la commune.", where: "physical" },
      ],
      feeNote: KINSHASA_FEES,
      processingNote: "De 24 heures à quelques jours selon la commune, d'après le catalogue officiel.",
      appointmentNote: "Un passage à la commune est prévu pour remplir la fiche d'identification.",
      sources: [SP(7705, "Attestation de résidence délivrée à la Commune", "Commune, service de la population")],
      missingInfo: ["Liste complète à confirmer commune par commune (attestation du chef de quartier)."],
    },
  },

  "bonne-vie-et-moeurs": {
    title: "Certificat de bonne vie et mœurs",
    description: "Obtenir le certificat qui atteste votre bonne conduite, souvent demandé pour un emploi ou une inscription.",
    category: CATEGORIES.justice,
    institution: "Commune, service de la population",
    currency: "CDF",
    feeStatus: "variable",
    isPriority: true,
    sortOrder: 3,
    guide: {
      keywords: ["bonne vie", "moeurs", "mœurs", "bvm", "bonne conduite", "moralité"],
      territory: "Kinshasa (frais publiés pour 13 communes)",
      outputDocument: "Certificat de bonne vie et mœurs, validé et signé par la commune.",
      checklist: [
        { id: "form", label: "Formulaire de demande", kind: "download", requirement: "required", description: "Fourni par la commune." },
        { id: "id", label: "Pièce d'identité du demandeur", kind: "upload", requirement: "required" },
        {
          id: "home",
          label: "Attestation de résidence ou justificatif de domicile",
          description: "Si la commune le demande.",
          kind: "upload",
          requirement: "conditional",
        },
        { id: "chief", label: "Déclaration de témoignage du chef d'avenue", kind: "original", requirement: "required" },
        {
          id: "record",
          label: "Extrait du casier judiciaire",
          description: "Si applicable.",
          kind: "upload",
          requirement: "conditional",
        },
      ],
      steps: [
        { label: "Préparez votre dossier", where: "online" },
        { label: "Transmettez votre demande", description: "Déposez votre dossier dans MesDémarches.", where: "online" },
        { label: "Vérification par la commune", where: "physical" },
        { label: "Paiement et retrait à la commune", where: "physical" },
      ],
      feeNote: KINSHASA_FEES,
      processingNote: "72 heures selon le catalogue officiel.",
      sources: [SP(7713, "Certificat de bonne vie et mœurs délivrée à la Commune", "Commune, service de la population")],
      missingInfo: ["Cas où l'extrait du casier judiciaire est exigé."],
    },
  },

  "casier-judiciaire": {
    title: "Extrait de casier judiciaire",
    description: "Demander l'extrait de votre casier judiciaire, souvent exigé pour un emploi, un visa ou un concours.",
    category: CATEGORIES.justice,
    institution: "Ministère de la Justice",
    currency: "CDF",
    feeStatus: "unconfirmed",
    isPriority: true,
    sortOrder: 4,
    guide: {
      keywords: ["casier", "judiciaire", "extrait", "antécédents"],
      territory: "À confirmer",
      checklist: [
        { id: "id", label: "Pièce d'identité", kind: "upload", requirement: "required" },
        { id: "nat", label: "Attestation de nationalité", kind: "upload", requirement: "required" },
        { id: "bvm", label: "Certificat de bonne vie et mœurs", kind: "prerequisite", requirement: "required" },
      ],
      prerequisites: [{ label: "Certificat de bonne vie et mœurs", question: "Pas encore de certificat de bonne vie et mœurs ?", procedureSlug: "bonne-vie-et-moeurs" }],
      missingInfo: [
        "Fiche officielle non trouvée : la liste ci-dessus est une base de travail à confirmer auprès du service compétent.",
        "Service compétent et lieu de dépôt.",
        "Frais et délai.",
      ],
    },
  },

  "acte-de-mariage": {
    title: "Acte de mariage",
    description: "Demander une copie certifiée d'un acte de mariage inscrit au registre de l'état civil.",
    category: CATEGORIES.civil,
    institution: "Commune, service de l'état civil",
    currency: "CDF",
    feeStatus: "variable",
    sortOrder: 10,
    guide: {
      keywords: ["mariage", "acte de mariage", "copie", "époux", "union"],
      territory: "Kinshasa (frais publiés pour 14 communes)",
      outputDocument: "Copie certifiée de l'acte de mariage.",
      checklist: [
        { id: "ids", label: "Pièces d'identité des époux", kind: "upload", requirement: "required" },
        { id: "births", label: "Actes de naissance des époux", kind: "upload", requirement: "required" },
        {
          id: "single",
          label: "Certificat de célibat ou document justifiant la capacité matrimoniale",
          kind: "upload",
          requirement: "required",
        },
        { id: "pay", label: "Preuve de paiement des frais administratifs", kind: "payment", requirement: "required" },
      ],
      feeNote: KINSHASA_FEES,
      processingNote: "Variable selon la commune.",
      contradictory: true,
      sources: [SP(7645, "Acte de mariage délivré à la commune", "Commune, service de l'état civil")],
      missingInfo: [
        "La fiche officielle décrit une copie d'acte mais liste les pièces de la célébration du mariage : liste à confirmer.",
      ],
    },
  },

  "attestation-de-diplome": {
    title: "Attestation de diplôme",
    description: "Demander une attestation de réussite ou l'authentification d'un diplôme auprès de l'autorité qui l'a délivré.",
    category: CATEGORIES.education,
    institution: "Ministère de l'ESU / EPST",
    currency: "CDF",
    feeStatus: "unconfirmed",
    sortOrder: 20,
    guide: {
      keywords: ["diplôme", "diplome", "attestation", "authentification", "études", "université"],
      missingInfo: [
        "Fiche officielle non trouvée : pièces, frais et délai à confirmer auprès de l'ESU ou de l'EPST selon le diplôme.",
      ],
    },
  },

  "legalisation-de-document": {
    title: "Légalisation de document",
    description: "Faire légaliser un document officiel pour l'utiliser auprès d'une autre administration ou à l'étranger.",
    category: CATEGORIES.justice,
    institution: "Ministère des Affaires étrangères",
    currency: "CDF",
    feeStatus: "unconfirmed",
    sortOrder: 21,
    guide: {
      keywords: ["légalisation", "legaliser", "authentifier", "apostille", "certifier"],
      checklist: [
        { id: "orig", label: "Document original à légaliser", kind: "original", requirement: "required" },
        { id: "req", label: "Demande", kind: "upload", requirement: "required" },
        { id: "id", label: "Pièce d'identité", kind: "upload", requirement: "required" },
        { id: "pay", label: "Justificatif de paiement", kind: "payment", requirement: "required" },
      ],
      missingInfo: [
        "Le circuit dépend de la nature du document (état civil, diplôme, document judiciaire) : à confirmer.",
        "Frais et délai.",
      ],
    },
  },

  "certificat-de-nationalite": {
    title: "Certificat de nationalité congolaise",
    description: "Obtenir le document officiel du ministère de la Justice qui atteste votre nationalité congolaise.",
    category: CATEGORIES.identity,
    institution: "Ministère de la Justice et Garde des Sceaux",
    cost: 40,
    currency: "USD",
    feeStatus: "confirmed",
    isPriority: true,
    sortOrder: 5,
    guide: {
      keywords: ["nationalité", "nationalite", "certificat", "congolais"],
      territory: "National",
      outputDocument: "Certificat de nationalité congolaise.",
      steps: [
        { label: "Dépôt de la demande auprès des services du ministère de la Justice", where: "physical" },
        { label: "Vérification administrative de votre filiation", where: "physical" },
        { label: "Contrôle de l'ANR et de la DGM", where: "physical" },
        { label: "Décision du ministre de la Justice", where: "physical" },
        { label: "Retrait du certificat", where: "physical" },
      ],
      sources: [SP(463, "Certificat de nationalité congolaise", "Justice et Garde des Sceaux")],
      missingInfo: [
        "Pièces à fournir : non renseignées dans la fiche officielle.",
        "Délai de traitement : non précisé.",
        "La fiche MesDémarches indiquait le ministère de l'Intérieur ; la source officielle indique le ministère de la Justice.",
      ],
    },
  },

  "acte-de-deces": {
    title: "Acte de décès",
    description: "Faire établir l'acte de décès d'un proche à l'état civil de la commune.",
    category: CATEGORIES.civil,
    institution: "Commune, service de l'état civil",
    currency: "CDF",
    feeStatus: "variable",
    sortOrder: 11,
    guide: {
      keywords: ["décès", "deces", "acte de décès", "défunt", "mort"],
      territory: "Kinshasa (frais publiés pour 13 communes)",
      outputDocument: "Acte de décès, preuve légale du décès.",
      questions: [
        {
          id: "late",
          label: "Le décès est-il déclaré hors délai ?",
          options: [
            { value: "no", label: "Non, dans les délais" },
            { value: "yes", label: "Oui, déclaration tardive" },
          ],
        },
      ],
      checklist: [
        { id: "cert", label: "Certificat ou attestation de décès de l'établissement de santé", kind: "upload", requirement: "required" },
        {
          id: "deceased",
          label: "Pièce d'identité de la personne décédée",
          kind: "upload",
          requirement: "required",
          alternatives: ["Tout autre document d'identification disponible"],
        },
        { id: "declarant", label: "Pièce d'identité du déclarant", kind: "upload", requirement: "required" },
        {
          id: "judgment",
          label: "Jugement supplétif",
          description: "Uniquement en cas de déclaration tardive.",
          kind: "upload",
          requirement: "conditional",
          when: { late: ["yes"] },
        },
      ],
      feeNote: KINSHASA_FEES,
      processingNote: "Immédiat à 1 jour ouvrable selon le catalogue officiel.",
      sources: [SP(7646, "Acte de décès délivré à la Commune", "Commune, service de l'état civil")],
      missingInfo: ["Délai légal de déclaration au-delà duquel le jugement supplétif est exigé."],
    },
  },

  "attestation-de-celibat": {
    title: "Attestation de célibat",
    description: "Prouver que vous n'êtes pas engagé dans un mariage, par exemple avant un mariage civil.",
    category: CATEGORIES.civil,
    institution: "Commune, service de l'état civil",
    currency: "CDF",
    feeStatus: "variable",
    isPriority: true,
    sortOrder: 6,
    guide: {
      keywords: ["célibat", "celibat", "non-mariage", "capacité matrimoniale", "mariage"],
      territory: "Kinshasa (frais publiés pour 16 communes)",
      outputDocument: "Attestation (ou certificat) de célibat.",
      conditions: ["Vous ne devez pas être marié au moment de la délivrance."],
      questions: [
        {
          id: "situation",
          label: "Quelle est votre situation ?",
          options: [
            { value: "never", label: "Jamais marié" },
            { value: "divorced", label: "Divorcé" },
            { value: "widowed", label: "Veuf ou veuve" },
          ],
        },
        {
          id: "origin",
          label: "Votre nationalité",
          options: [
            { value: "cd", label: "Congolaise" },
            { value: "foreign", label: "Étrangère" },
          ],
        },
      ],
      checklist: [
        {
          id: "birth",
          label: "Extrait ou acte de naissance récent",
          description: "Généralement de moins de 3 à 6 mois.",
          kind: "upload",
          requirement: "required",
        },
        { id: "id", label: "Pièce d'identité valide ou permis de séjour", kind: "upload", requirement: "required" },
        { id: "home", label: "Preuve de résidence", description: "Si la commune l'exige.", kind: "upload", requirement: "conditional" },
        {
          id: "honour",
          label: "Déclaration sur l'honneur de célibat",
          description: "Si le service la prévoit.",
          kind: "upload",
          requirement: "conditional",
        },
        {
          id: "divorce",
          label: "Jugement ou certificat de divorce définitif",
          kind: "upload",
          requirement: "conditional",
          when: { situation: ["divorced"] },
        },
        {
          id: "death",
          label: "Acte ou certificat de décès du conjoint",
          kind: "upload",
          requirement: "conditional",
          when: { situation: ["widowed"] },
        },
        {
          id: "foreign",
          label: "Acte original du pays d'origine, légalisé ou apostillé, traduit par un traducteur juré",
          kind: "original",
          requirement: "conditional",
          when: { origin: ["foreign"] },
        },
        { id: "pay", label: "Preuve de paiement des frais", kind: "payment", requirement: "required" },
      ],
      feeNote: KINSHASA_FEES,
      processingNote: "Immédiat à 1 jour ouvrable selon la commune.",
      sources: [SP(7698, "Attestation de célibat délivrée à la Commune", "Commune, service de l'état civil")],
    },
  },

  "reconnaissance-de-paternite": {
    title: "Reconnaissance de paternité",
    description: "Faire reconnaître officiellement le lien de filiation entre un père et son enfant.",
    category: CATEGORIES.civil,
    institution: "Commune, service de l'état civil",
    currency: "CDF",
    feeStatus: "unconfirmed",
    sortOrder: 12,
    guide: {
      keywords: ["paternité", "paternite", "reconnaissance", "filiation", "père", "enfant"],
      missingInfo: ["Fiche officielle (commune) non consultée : pièces, frais et délai à confirmer."],
    },
  },

  "numero-identification-fiscale": {
    title: "Obtenir mon numéro d'impôt (NIF)",
    description:
      "Le numéro d'identification fiscale est indispensable pour toute activité économique et demandé pour certaines démarches, comme le passeport.",
    category: CATEGORIES.business,
    institution: "Direction générale des impôts (DGI)",
    currency: null,
    feeStatus: "unconfirmed",
    channel: "external",
    externalUrl: "https://e-nif.dgirdc.cd/",
    isPriority: true,
    sortOrder: 0,
    guide: {
      keywords: ["nif", "numéro impôt", "numéro d'impôt", "numero impot", "identification fiscale", "e-nif", "dgi", "impôts", "impots"],
      territory: "National",
      outputDocument: "Numéro d'identification fiscale (NIF), attribué par la DGI.",
      questions: [
        {
          id: "profile",
          label: "Pour qui demandez-vous un NIF ?",
          options: [
            { value: "person", label: "Pour moi, particulier" },
            { value: "sole", label: "Pour mon activité d'entrepreneur individuel" },
            { value: "company", label: "Pour une société" },
            { value: "employer", label: "Pour les employés de mon entreprise" },
          ],
        },
      ],
      checklist: [
        { id: "req", label: "Demande", kind: "upload", requirement: "required" },
        {
          id: "form",
          label: "Formulaire d'identification rempli, daté et signé",
          kind: "download",
          requirement: "required",
        },
        {
          id: "annex",
          label: "Annexes précisées par la DGI",
          description: "La liste des annexes dépend de votre profil et n'est pas encore confirmée.",
          kind: "upload",
          requirement: "conditional",
        },
        {
          id: "employees",
          label: "Fiches des employés concernés",
          description: "Les employeurs joignent les fiches des employés sur le service I-NIF employé de la DGI.",
          kind: "upload",
          requirement: "conditional",
          when: { profile: ["employer"] },
        },
      ],
      steps: [
        { label: "Créez votre accès e-NIF avec votre adresse e-mail", where: "external" },
        { label: "Soumettez vos informations et suivez l'avancement", where: "external" },
        { label: "Recevez votre NIF", where: "external" },
      ],
      processingNote: "Non publié par la DGI.",
      sources: [
        { label: "DGI : présentation du NIF et de l'e-NIF", url: "https://dgi.gouv.cd/", administration: "Direction générale des impôts", consultedAt: CONSULTED },
        { label: "Portail e-NIF", url: "https://e-nif.dgirdc.cd/", administration: "Direction générale des impôts", consultedAt: CONSULTED },
        { label: "I-NIF employé (employeurs)", url: "https://app.dgirdc.cd/nif-employe/", administration: "Direction générale des impôts", consultedAt: CONSULTED },
      ],
      missingInfo: [
        "Liste des annexes par profil (particulier, entrepreneur individuel, société).",
        "Gratuité ou frais éventuels.",
        "Délai d'attribution.",
      ],
    },
  },

  "immatriculation-cnss": {
    title: "Immatriculation d'un travailleur à la CNSS",
    description: "L'employeur fait immatriculer chaque travailleur à la Caisse nationale de sécurité sociale après son embauche.",
    category: CATEGORIES.work,
    institution: "Caisse nationale de sécurité sociale (CNSS)",
    currency: "CDF",
    feeStatus: "unconfirmed",
    sortOrder: 30,
    guide: {
      keywords: ["cnss", "sécurité sociale", "immatriculation", "travailleur", "employé", "mod imt"],
      territory: "National",
      outputDocument: "Immatriculation du travailleur et carte de sécurité sociale.",
      conditions: [
        "La demande est faite par l'employeur, dans les quinze jours ouvrables qui suivent l'embauche.",
      ],
      questions: [
        {
          id: "worker",
          label: "Le travailleur est-il de nationalité étrangère ?",
          options: [
            { value: "cd", label: "Non" },
            { value: "foreign", label: "Oui" },
          ],
        },
      ],
      checklist: [
        {
          id: "imt",
          label: "Formulaire Mod. IMT",
          description: "Formulaire Mod. IMTA pour un travailleur assimilé.",
          kind: "download",
          requirement: "required",
        },
        {
          id: "stay",
          label: "Preuve de régularité de séjour",
          kind: "upload",
          requirement: "conditional",
          when: { worker: ["foreign"] },
        },
        {
          id: "permit",
          label: "Preuve de l'autorisation de travailler",
          kind: "upload",
          requirement: "conditional",
          when: { worker: ["foreign"] },
        },
      ],
      processingNote: "La CNSS immatricule le travailleur dans les dix jours suivant la réception de la demande.",
      sources: [
        { label: "CNSS : procédure d'immatriculation", url: "https://cnss.cd/?page_id=1747", administration: "CNSS", consultedAt: CONSULTED },
        { label: "CNSS : formulaires pour travailleur", url: "https://cnss.cd/?page_id=1797", administration: "CNSS", consultedAt: CONSULTED },
      ],
    },
  },

  "carte-d-electeur": {
    title: "Carte d'électeur",
    category: CATEGORIES.identity,
    institution: "Commission électorale nationale indépendante (CENI)",
    currency: "CDF",
    feeStatus: "unconfirmed",
    sortOrder: 40,
    guide: {
      keywords: ["électeur", "electeur", "ceni", "vote", "enrôlement"],
      missingInfo: [
        "La carte d'électeur est délivrée lors des opérations d'enrôlement de la CENI : rôle exact de MesDémarches à confirmer.",
        "Pièces, période d'ouverture et lieux d'enrôlement.",
      ],
    },
  },

  "declaration-de-succession": {
    title: "Déclaration de succession",
    category: CATEGORIES.justice,
    institution: "Ministère de la Justice / Notariat",
    currency: "CDF",
    feeStatus: "unconfirmed",
    sortOrder: 41,
    guide: {
      keywords: ["succession", "héritage", "heritage", "héritiers", "décès"],
      missingInfo: ["Fiches officielles (attestation de succession à la commune, notariat) à consulter : pièces, frais et délai."],
    },
  },

  "autorisation-exercer-profession-liberale": {
    title: "Autorisation d'exercer une profession libérale",
    category: CATEGORIES.work,
    institution: "Ministère de tutelle / Ordre professionnel",
    currency: "CDF",
    feeStatus: "unconfirmed",
    sortOrder: 42,
    guide: {
      keywords: ["profession libérale", "ordre", "avocat", "médecin", "autorisation"],
      missingInfo: ["Les exigences dépendent de chaque profession et de son ordre : à confirmer métier par métier."],
    },
  },

  "passeport-biometrique": {
    title: "Passeport biométrique",
    description:
      "Préparer votre demande de passeport biométrique ordinaire : NIF, inscription en ligne, paiement, vérification et enrôlement.",
    category: CATEGORIES.identity,
    institution: "Ministère des Affaires étrangères",
    cost: 75,
    currency: "USD",
    feeStatus: "confirmed",
    channel: "external",
    externalUrl: "https://www.passeport.gouv.cd/",
    isPriority: true,
    sortOrder: 7,
    guide: {
      keywords: ["passeport", "voyage", "voyager", "biométrique", "renouvellement", "dgm"],
      territory: "RDC et représentations diplomatiques",
      outputDocument: "Passeport biométrique ordinaire, retiré au centre d'enrôlement.",
      prerequisites: [
        { label: "Numéro d'impôt (NIF)", question: "Vous n'avez pas encore de NIF ?", description: "Il est demandé avant l'inscription en ligne.", procedureSlug: "numero-identification-fiscale" },
      ],
      steps: [
        { label: "Obtenez votre NIF", description: "Sur la plateforme e-NIF de la DGI.", where: "external" },
        { label: "Inscrivez-vous sur le portail passeport", description: "Vous recevez une référence de paiement et un QR code.", where: "external" },
        { label: "Payez les frais", where: "external" },
        { label: "Faites vérifier votre dossier", description: "Vérification par l'ANR, avec vos documents personnels.", where: "physical" },
        { label: "Enrôlement biométrique", description: "Au centre d'enrôlement, avec l'autorisation, le QR code et vos documents.", where: "physical" },
        { label: "Retirez votre passeport", description: "Au centre d'enrôlement, à la date indiquée.", where: "physical" },
      ],
      questions: [
        {
          id: "type",
          label: "Votre situation",
          options: [
            { value: "first", label: "Première demande" },
            { value: "renewal", label: "Renouvellement" },
            { value: "lost", label: "Perte ou vol" },
          ],
        },
        {
          id: "age",
          label: "Le passeport est pour",
          options: [
            { value: "adult", label: "Un adulte" },
            { value: "minor", label: "Un mineur" },
          ],
        },
        {
          id: "place",
          label: "Lieu de dépôt",
          options: [
            { value: "rdc", label: "En RDC" },
            { value: "abroad", label: "À l'étranger" },
          ],
        },
      ],
      checklist: [
        { id: "nif", label: "Numéro d'impôt (NIF)", kind: "prerequisite", requirement: "required" },
        { id: "id", label: "Document d'identification", kind: "original", requirement: "required" },
        {
          id: "nat",
          label: "Preuve de nationalité congolaise",
          description: "Lorsqu'elle est requise.",
          kind: "original",
          requirement: "conditional",
        },
        { id: "photo", label: "Photographie", kind: "original", requirement: "required" },
        { id: "pay", label: "Justificatif de paiement des frais", kind: "generated", requirement: "required" },
        {
          id: "old",
          label: "Ancien passeport",
          kind: "original",
          requirement: "conditional",
          when: { type: ["renewal"] },
        },
        {
          id: "minor",
          label: "Pièces du représentant légal",
          description: "Exigences non précisées par la source officielle : renseignez-vous avant votre rendez-vous.",
          kind: "original",
          requirement: "conditional",
          when: { age: ["minor"] },
        },
        {
          id: "lost",
          label: "Justificatif de perte ou de vol",
          description: "Exigences non précisées par la source officielle : renseignez-vous avant votre rendez-vous.",
          kind: "original",
          requirement: "conditional",
          when: { type: ["lost"] },
        },
        {
          id: "abroad",
          label: "Pièces demandées par le poste consulaire",
          description: "Contactez l'ambassade ou le consulat de RDC de votre pays de résidence.",
          kind: "original",
          requirement: "conditional",
          when: { place: ["abroad"] },
        },
      ],
      processingNote: "7 jours francs à Kinshasa, 14 en province, 28 à l'étranger, selon le catalogue officiel.",
      appointmentNote: "La vérification et l'enrôlement biométrique se font en personne. MesDémarches ne collecte aucune donnée biométrique.",
      sources: [
        SP(7, "Passeport biométrique ordinaire", "Affaires étrangères et Coopération internationale"),
        { label: "Portail passeport", url: "https://www.passeport.gouv.cd/", administration: "Affaires étrangères", consultedAt: CONSULTED },
      ],
      missingInfo: [
        "Pièces du représentant légal pour un mineur.",
        "Démarche en cas de perte ou de vol.",
        "Liste de pièces propre à chaque poste consulaire.",
        "Le portail passeport n'a pas pu être consulté directement (accès refusé lors de la vérification).",
      ],
    },
  },

  "registre-de-commerce": {
    title: "Inscription au RCCM",
    description: "Inscrire votre entreprise au Registre du commerce et du crédit mobilier.",
    category: CATEGORIES.business,
    institution: "GUCE ou greffe du tribunal de commerce",
    currency: null,
    feeStatus: "unconfirmed",
    channel: "info",
    sortOrder: 31,
    guide: {
      keywords: ["rccm", "registre", "commerce", "immatriculation entreprise", "guce"],
      territory: "National",
      outputDocument: "Numéro RCCM et extrait du registre.",
      questions: [
        {
          id: "form",
          label: "Vous inscrivez",
          options: [
            { value: "person", label: "Une personne physique" },
            { value: "company", label: "Une société" },
          ],
        },
      ],
      checklist: [
        { id: "form", label: "Formulaire de demande d'inscription au RCCM", kind: "download", requirement: "required" },
        {
          id: "id",
          label: "Copie de la pièce d'identité",
          description: "Carte d'identité, passeport ou carte d'électeur.",
          kind: "upload",
          requirement: "conditional",
          when: { form: ["person"] },
        },
        {
          id: "statutes",
          label: "Statuts signés et enregistrés",
          kind: "upload",
          requirement: "conditional",
          when: { form: ["company"] },
        },
        { id: "idnat", label: "Numéro d'identification nationale (IDNAT)", description: "Le cas échéant.", kind: "prerequisite", requirement: "conditional" },
        { id: "nif", label: "Numéro d'impôt (NIF)", kind: "prerequisite", requirement: "required" },
        { id: "address", label: "Justificatif de l'adresse ou du siège", kind: "upload", requirement: "required" },
        {
          id: "honour",
          label: "Déclaration sur l'honneur de non-condamnation",
          description: "Si requise.",
          kind: "upload",
          requirement: "conditional",
        },
        { id: "pay", label: "Preuve de paiement des frais d'immatriculation", kind: "payment", requirement: "required" },
      ],
      prerequisites: [{ label: "Numéro d'impôt (NIF)", question: "Vous n'avez pas encore de NIF ?", procedureSlug: "numero-identification-fiscale" }],
      steps: [
        { label: "Préparez le dossier selon votre forme juridique", where: "online" },
        { label: "Déposez-le au GUCE ou au greffe du tribunal de commerce", where: "physical" },
        { label: "Payez les frais d'immatriculation", where: "physical" },
        { label: "Contrôle de conformité et inscription", where: "physical" },
        { label: "Recevez votre numéro RCCM et l'extrait", where: "physical" },
      ],
      sources: [
        SP(734, "Inscription au RCCM", "Cours, tribunaux et parquets"),
        { label: "ANAPI : procédures", url: "https://anapi.cd/procedures", administration: "ANAPI", consultedAt: CONSULTED },
      ],
      missingInfo: ["Montant des frais d'immatriculation.", "Délai."],
    },
  },

  "creation-d-entreprise": {
    title: "Créer une société",
    description: "Constituer une société (personne morale) au Guichet unique de création d'entreprise.",
    category: CATEGORIES.business,
    institution: "Guichet unique de création d'entreprise (GUCE)",
    cost: 70,
    currency: "USD",
    feeStatus: "variable",
    channel: "external",
    externalUrl: "https://guichetunique.cd/",
    isPriority: true,
    sortOrder: 8,
    estimatedDays: 3,
    guide: {
      keywords: ["société", "societe", "entreprise", "création", "sarl", "sa", "guce", "anapi", "statuts"],
      territory: "National (selon la présence du GUCE)",
      outputDocument: "Statuts et actes notariés, RCCM, numéros d'identification (dont fiscal et sécurité sociale), certificat d'enregistrement.",
      questions: [
        {
          id: "statutes",
          label: "Vos statuts sont",
          options: [
            { value: "notarial", label: "Notariés" },
            { value: "private", label: "Sous seing privé" },
          ],
        },
      ],
      checklist: [
        { id: "letter", label: "Lettre de demande au directeur général du GUCE", kind: "upload", requirement: "required" },
        { id: "statutes", label: "Statuts en 4 exemplaires et version électronique", kind: "upload", requirement: "required" },
        { id: "sign", label: "Spécimen de signature du gérant", kind: "upload", requirement: "required" },
        { id: "decl", label: "Déclaration de souscription et de versement", kind: "upload", requirement: "required" },
        { id: "capital", label: "Preuve de libération du capital", kind: "upload", requirement: "required" },
        { id: "pay", label: "Preuve de paiement des frais", kind: "payment", requirement: "required" },
      ],
      feeNote: "110 USD avec des statuts notariés, 70 USD avec des statuts sous seing privé, selon l'ANAPI.",
      processingNote: "3 jours selon l'ANAPI.",
      sources: [
        { label: "ANAPI : procédures de création", url: "https://anapi.cd/procedures", administration: "ANAPI", consultedAt: CONSULTED },
        { label: "Guichet unique de création d'entreprise", url: "https://guichetunique.cd/", administration: "GUCE", consultedAt: CONSULTED },
      ],
      missingInfo: ["Variantes en province lorsque le GUCE n'est pas présent (tribunaux de commerce)."],
    },
  },

  "immatriculation-de-vehicule": {
    title: "Immatriculation de véhicule",
    category: CATEGORIES.transport,
    institution: "Ministère des Transports",
    currency: "CDF",
    feeStatus: "unconfirmed",
    sortOrder: 50,
    guide: {
      keywords: ["véhicule", "vehicule", "immatriculation", "plaque", "voiture", "carte rose"],
      missingInfo: ["Fiche officielle non consultée : pièces, frais et délai à confirmer."],
    },
  },

  "permis-de-conduire": {
    title: "Permis de conduire",
    category: CATEGORIES.transport,
    institution: "Ministère des Transports",
    currency: "CDF",
    feeStatus: "unconfirmed",
    sortOrder: 51,
    guide: {
      keywords: ["permis", "conduire", "conduite", "voiture", "auto-école"],
      missingInfo: ["Fiche officielle non consultée : pièces, frais et délai à confirmer."],
    },
  },

  "carte-nationale-identite": {
    title: "Carte nationale d'identité",
    category: CATEGORIES.identity,
    institution: "ONIP",
    currency: "CDF",
    feeStatus: "unconfirmed",
    sortOrder: 52,
    guide: {
      keywords: ["carte d'identité", "cni", "identité", "onip"],
      missingInfo: ["Calendrier et modalités de délivrance à confirmer auprès de l'ONIP."],
    },
  },

  "permis-de-construire": {
    title: "Permis de construire",
    description: "Obtenir l'autorisation préalable pour construire ou agrandir un bâtiment.",
    category: CATEGORIES.land,
    institution: "Hôtel de ville / Urbanisme",
    currency: "CDF",
    feeStatus: "unconfirmed",
    sortOrder: 53,
    guide: {
      keywords: ["construire", "construction", "permis", "bâtir", "urbanisme", "plans"],
      checklist: [
        { id: "req", label: "Demande", kind: "upload", requirement: "required" },
        { id: "rights", label: "Preuve de vos droits sur la parcelle", kind: "upload", requirement: "required" },
        { id: "id", label: "Pièce d'identité", kind: "upload", requirement: "required" },
        { id: "plans", label: "Plans architecturaux et techniques", kind: "upload", requirement: "required" },
        {
          id: "studies",
          label: "Études complémentaires",
          description: "Selon la nature du projet.",
          kind: "upload",
          requirement: "conditional",
        },
      ],
      missingInfo: [
        "Fiche officielle non consultée : liste de départ à confirmer auprès du service de l'urbanisme compétent.",
        "Frais et délai, qui dépendent de la ville ou de la province.",
      ],
    },
  },

  "certificat-enregistrement-immobilier": {
    title: "Certificat d'enregistrement",
    category: CATEGORIES.land,
    institution: "Conservation des titres immobiliers",
    currency: "CDF",
    feeStatus: "unconfirmed",
    sortOrder: 54,
    guide: {
      keywords: ["certificat d'enregistrement", "titre foncier", "parcelle", "propriété", "terrain"],
      missingInfo: ["Fiche officielle non consultée : pièces, frais et délai à confirmer."],
    },
  },
};

// ---------------------------------------------------------------------------
// New procedures. Published ones rely on an official source; the others stay
// in draft (hidden from the public catalogue) until their content is verified.
// ---------------------------------------------------------------------------
export type NewProcedure = ProcedureContent & {
  slug: string;
  title: string;
  description: string;
  category: string;
  institution: string;
  icon: string;
};

const draft = (
  slug: string,
  title: string,
  category: string,
  institution: string,
  missing: string[],
  keywords: string[] = [],
): NewProcedure => ({
  slug,
  title,
  description: "Fiche en préparation.",
  category,
  institution,
  icon: "FileText",
  status: "coming_soon",
  channel: "info",
  editorialStatus: "draft",
  currency: null,
  feeStatus: "unconfirmed",
  sortOrder: 90,
  guide: { keywords, missingInfo: missing },
});

const TO_CHECK = ["Existence et intitulé exact", "Administration compétente", "Pièces et conditions", "Canal de dépôt", "Frais et délai"];

export const newProcedures: NewProcedure[] = [
  {
    slug: "declaration-de-naissance",
    title: "Déclarer une naissance",
    description: "Faire enregistrer la naissance d'un enfant à l'état civil de la commune pour obtenir son acte de naissance.",
    category: CATEGORIES.civil,
    institution: "Commune, service de la population",
    icon: "Baby",
    status: "coming_soon",
    channel: "info",
    editorialStatus: "published",
    currency: null,
    feeStatus: "unconfirmed",
    isPriority: true,
    sortOrder: 9,
    guide: {
      keywords: ["naissance", "déclarer", "bébé", "enfant", "état civil", "déclaration tardive", "jugement supplétif"],
      territory: "Commune de résidence des parents",
      outputDocument: "Enregistrement dans les registres de l'état civil, qui permet la délivrance de l'acte de naissance.",
      conditions: [
        "Dans les 90 jours suivant la naissance : déclaration à l'état civil de la commune de résidence des parents.",
        "Au-delà de 90 jours, un jugement supplétif est nécessaire (tribunal pour enfants pour un mineur, tribunal de paix pour un adulte).",
      ],
      questions: [
        {
          id: "delay",
          label: "La naissance a eu lieu",
          options: [
            { value: "in", label: "Il y a moins de 90 jours" },
            { value: "late", label: "Il y a plus de 90 jours" },
          ],
        },
        {
          id: "married",
          label: "Les parents sont-ils mariés ?",
          options: [
            { value: "yes", label: "Oui" },
            { value: "no", label: "Non" },
          ],
        },
      ],
      checklist: [
        {
          id: "birth",
          label: "Certificat d'accouchement ou certificat médical de naissance",
          description: "Délivré par l'établissement de santé.",
          kind: "original",
          requirement: "required",
        },
        {
          id: "declarant",
          label: "Pièce d'identité du déclarant",
          description: "Père, mère, tuteur ou toute autre personne habilitée.",
          kind: "original",
          requirement: "required",
        },
        {
          id: "marriage",
          label: "Acte de mariage des parents ou document justifiant la filiation",
          description: "Si requis.",
          kind: "original",
          requirement: "conditional",
          when: { married: ["yes"] },
        },
        {
          id: "judgment",
          label: "Jugement supplétif d'acte de naissance",
          kind: "original",
          requirement: "conditional",
          when: { delay: ["late"] },
        },
      ],
      steps: [
        { label: "Obtenez l'attestation de naissance auprès de la structure où l'enfant est né", where: "physical" },
        { label: "Présentez-vous au bureau de l'état civil", where: "physical" },
        { label: "Fournissez les informations requises", where: "physical" },
        { label: "Enregistrement dans les registres de l'état civil", where: "physical" },
      ],
      processingNote: "L'enregistrement est effectué dès réception d'un dossier complet et conforme.",
      appointmentNote: "La déclaration se fait en personne au bureau de l'état civil.",
      sources: [
        SP(5129, "Déclaration et enregistrement de naissance délivrée à la commune", "Commune, service de la population"),
        SP(7638, "Acte de naissance délivré à la commune", "Commune, service de l'état civil"),
      ],
      missingInfo: ["Frais éventuels de la déclaration (l'acte est indiqué gratuit dans le délai légal)."],
    },
  },
  {
    slug: "creation-entreprise-individuelle",
    title: "Créer une entreprise individuelle",
    description: "Enregistrer votre activité en nom propre (personne physique) au Guichet unique de création d'entreprise.",
    category: CATEGORIES.business,
    institution: "Guichet unique de création d'entreprise (GUCE)",
    icon: "Briefcase",
    status: "coming_soon",
    channel: "external",
    externalUrl: "https://guichetunique.cd/",
    editorialStatus: "published",
    cost: 40,
    currency: "USD",
    feeStatus: "confirmed",
    estimatedDays: 3,
    sortOrder: 32,
    guide: {
      keywords: ["entreprise individuelle", "établissement", "commerce", "activité", "entrepreneur", "guce", "anapi"],
      territory: "National (selon la présence du GUCE)",
      questions: [
        {
          id: "origin",
          label: "Votre nationalité",
          options: [
            { value: "cd", label: "Congolaise" },
            { value: "foreign", label: "Étrangère" },
          ],
        },
        {
          id: "married",
          label: "Êtes-vous marié ?",
          options: [
            { value: "no", label: "Non" },
            { value: "yes", label: "Oui" },
          ],
        },
        {
          id: "manager",
          label: "Gérez-vous l'activité vous-même ?",
          options: [
            { value: "yes", label: "Oui" },
            { value: "no", label: "Non, un gérant me représente" },
          ],
        },
      ],
      checklist: [
        { id: "letter", label: "Lettre de demande", kind: "upload", requirement: "required" },
        { id: "place", label: "Titre de propriété ou contrat de bail", kind: "upload", requirement: "required" },
        { id: "id", label: "Pièce d'identité", kind: "upload", requirement: "required" },
        {
          id: "record",
          label: "Extrait de casier judiciaire",
          description: "Valable 75 jours.",
          kind: "upload",
          requirement: "required",
        },
        {
          id: "visa",
          label: "Visa ou titre de séjour",
          kind: "upload",
          requirement: "conditional",
          when: { origin: ["foreign"] },
        },
        {
          id: "marriage",
          label: "Contrat de mariage",
          description: "Le cas échéant.",
          kind: "upload",
          requirement: "conditional",
          when: { married: ["yes"] },
        },
        {
          id: "proxy",
          label: "Procuration",
          description: "Si le gérant est absent.",
          kind: "upload",
          requirement: "conditional",
          when: { manager: ["no"] },
        },
      ],
      prerequisites: [{ label: "Extrait de casier judiciaire", question: "Pas encore d'extrait de casier judiciaire ?", procedureSlug: "casier-judiciaire" }],
      processingNote: "3 jours selon l'ANAPI (délai général des procédures du GUCE).",
      sources: [{ label: "ANAPI : procédures de création", url: "https://anapi.cd/procedures", administration: "ANAPI", consultedAt: CONSULTED }],
    },
  },
  {
    slug: "affiliation-employeur-cnss",
    title: "Affilier mon entreprise à la CNSS",
    description: "Déclarer votre entreprise comme employeur auprès de la Caisse nationale de sécurité sociale.",
    category: CATEGORIES.work,
    institution: "Caisse nationale de sécurité sociale (CNSS)",
    icon: "Briefcase",
    status: "coming_soon",
    channel: "info",
    editorialStatus: "published",
    currency: null,
    feeStatus: "unconfirmed",
    sortOrder: 33,
    guide: {
      keywords: ["cnss", "employeur", "affiliation", "sécurité sociale", "mod ae"],
      territory: "National",
      outputDocument: "Certificat avec numéro d'affiliation.",
      questions: [
        {
          id: "context",
          label: "Votre situation",
          options: [
            { value: "creation", label: "Je crée mon entreprise au GUCE" },
            { value: "other", label: "Mon entreprise existe déjà" },
          ],
        },
      ],
      checklist: [
        {
          id: "unique",
          label: "Formulaire unique d'affiliation",
          description: "Déposé au Guichet unique lors de la création de l'entreprise.",
          kind: "download",
          requirement: "conditional",
          when: { context: ["creation"] },
        },
        {
          id: "modae",
          label: "Formulaire Mod. AE",
          description: "À déposer au bureau CNSS compétent dans les huit jours suivant l'ouverture, la reprise ou la première embauche.",
          kind: "download",
          requirement: "conditional",
          when: { context: ["other"] },
        },
      ],
      conditions: ["Une seule demande couvre l'ensemble de vos sites d'exploitation."],
      processingNote: "La CNSS délivre le certificat d'affiliation dans les trois jours suivant la demande.",
      sources: [
        { label: "CNSS : procédure d'affiliation", url: "https://cnss.cd/?page_id=1692", administration: "CNSS", consultedAt: CONSULTED },
        { label: "CNSS : formulaires pour l'employeur", url: "https://cnss.cd/?page_id=2198", administration: "CNSS", consultedAt: CONSULTED },
      ],
      missingInfo: ["Pièces justificatives jointes au formulaire (non listées par la CNSS)."],
    },
  },
  {
    slug: "authentification-document-fiscal",
    title: "Vérifier un document fiscal",
    description: "Contrôler l'authenticité d'un document émis par la DGI à partir de son QR code ou de son numéro.",
    category: CATEGORIES.business,
    institution: "Direction générale des impôts (DGI)",
    icon: "FileCheck",
    status: "coming_soon",
    channel: "external",
    externalUrl: "https://dgi.gouv.cd/verifier-un-document-authentification-qr-n/",
    editorialStatus: "published",
    currency: null,
    feeStatus: "unconfirmed",
    sortOrder: 34,
    guide: {
      keywords: ["authentification", "vérifier", "document fiscal", "qr code", "dgi"],
      territory: "National",
      steps: [{ label: "Saisissez le numéro ou scannez le QR code sur le site de la DGI", where: "external" }],
      sources: [
        {
          label: "DGI : vérifier un document",
          url: "https://dgi.gouv.cd/verifier-un-document-authentification-qr-n/",
          administration: "Direction générale des impôts",
          consultedAt: CONSULTED,
        },
      ],
    },
  },

  // Drafts: hidden until verified.
  draft("carte-consulaire", "Carte consulaire", CATEGORIES.identity, "Représentation diplomatique", TO_CHECK, ["consulaire", "étranger", "ambassade"]),
  draft("tenant-lieu-de-passeport", "Tenant-lieu de passeport", CATEGORIES.identity, "Représentation diplomatique", ["Fiche officielle repérée (servicepublic.gouv.cd/service/5431) à lire et valider.", ...TO_CHECK.slice(2)], ["voyage", "consulat"]),
  draft("attestation-de-perte", "Attestation de perte", CATEGORIES.identity, "À confirmer", TO_CHECK, ["perte", "vol", "déclaration de perte"]),
  draft("jugement-suppletif", "Jugement supplétif d'acte de naissance", CATEGORIES.civil, "Tribunal pour enfants / Tribunal de paix", ["Procédure judiciaire décrite dans la fiche 7638 : pièces, frais et délai à confirmer."], ["déclaration tardive", "supplétif"]),
  draft("celebration-de-mariage", "Célébrer un mariage civil", CATEGORIES.civil, "Commune, service de l'état civil", ["Démarches liées repérées (publication, consentement, capacité matrimoniale) à consolider.", ...TO_CHECK.slice(2)], ["mariage", "célébration", "publication"]),
  draft("transcription-acte-etranger", "Transcription d'un acte étranger", CATEGORIES.civil, "À confirmer", TO_CHECK, ["transcription", "acte étranger"]),
  draft("capacite-matrimoniale", "Certificat de capacité matrimoniale", CATEGORIES.civil, "Commune, service de l'état civil", ["Fiche officielle repérée (servicepublic.gouv.cd/service/5314) à lire et valider."], ["mariage", "capacité"]),
  draft("composition-de-famille", "Composition de famille", CATEGORIES.civil, "À confirmer", TO_CHECK, ["famille", "composition"]),
  draft("tutelle-autorite-parentale", "Tutelle et autorité parentale", CATEGORIES.civil, "À confirmer", TO_CHECK, ["tutelle", "tuteur", "autorité parentale"]),
  draft("copie-certifiee-conforme", "Copie certifiée conforme", CATEGORIES.justice, "À confirmer", TO_CHECK, ["copie", "certifiée", "conforme"]),
  draft("modification-entreprise", "Modifier les informations de mon entreprise", CATEGORIES.business, "GUCE / Tribunal de commerce", TO_CHECK, ["modification", "entreprise", "rccm"]),
  draft("attestation-fiscale", "Attestation fiscale ou quitus fiscal", CATEGORIES.business, "Direction générale des impôts (DGI)", TO_CHECK, ["quitus", "attestation fiscale", "dgi"]),
  draft("declarer-payer-impots", "Déclarer et payer mes impôts", CATEGORIES.business, "Direction générale des impôts (DGI)", ["Orientation vers la télédéclaration DGI : URL et périmètre à confirmer."], ["impôts", "déclaration", "paiement"]),
  draft("formalites-inpp-onem", "Formalités INPP et ONEM", CATEGORIES.work, "INPP / ONEM", TO_CHECK, ["inpp", "onem", "employeur"]),
  draft("equivalence-diplome", "Équivalence de diplôme", CATEGORIES.education, "À confirmer", TO_CHECK, ["équivalence", "diplôme étranger"]),
  draft("duplicata-diplome", "Duplicata de diplôme", CATEGORIES.education, "Autorité émettrice du diplôme", TO_CHECK, ["duplicata", "diplôme perdu"]),
  draft("mutation-vehicule", "Mutation de véhicule", CATEGORIES.transport, "À confirmer", TO_CHECK, ["mutation", "vente véhicule"]),
  draft("carte-rose", "Carte rose", CATEGORIES.transport, "À confirmer", TO_CHECK, ["carte rose", "véhicule"]),
  draft("mutation-de-propriete", "Mutation de propriété", CATEGORIES.land, "Conservation des titres immobiliers", TO_CHECK, ["mutation", "vente", "parcelle"]),
];

export const LEGACY_CATEGORY_MAP: Record<string, string> = {
  "Etat Civil": CATEGORIES.civil,
  "État Civil": CATEGORIES.civil,
  Identite: CATEGORIES.identity,
  "Identité": CATEGORIES.identity,
  Justice: CATEGORIES.justice,
  Education: CATEGORIES.education,
  "Éducation": CATEGORIES.education,
  Fiscalite: CATEGORIES.business,
  "Fiscalité": CATEGORIES.business,
  Commerce: CATEGORIES.business,
  Travail: CATEGORIES.work,
  Transport: CATEGORIES.transport,
  Urbanisme: CATEGORIES.land,
  Foncier: CATEGORIES.land,
};
