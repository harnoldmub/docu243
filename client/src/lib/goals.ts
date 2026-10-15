import type { PhotoName } from "@/components/picture";

export type GoalStep = { label: string; description?: string; slug?: string; url?: string };

export type Goal = {
  id: string;
  title: string;
  summary: string;
  photo?: PhotoName;
  /** True only when the order of the steps is confirmed by a source. */
  ordered: boolean;
  orderNote?: string;
  steps: GoalStep[];
  note?: string;
};

export const GOALS: Goal[] = [
  {
    id: "voyager",
    title: "Voyager",
    summary: "Préparer mon passeport biométrique.",
    photo: "voyageur",
    ordered: true,
    orderNote: "Ordre indiqué par le catalogue officiel des services publics.",
    steps: [
      { label: "Pas encore de NIF ? Nous l'obtenons pour vous", description: "Le numéro d'impôt est demandé avant l'inscription.", slug: "numero-identification-fiscale" },
      { label: "Envoyez vos pièces et réglez en ligne", description: "Document d'identification, photographie, ancien passeport en cas de renouvellement.", slug: "passeport-biometrique" },
      { label: "Nous vous inscrivons et réglons les frais officiels", description: "Sur le portail passeport, avec la référence de paiement et le QR code." },
      { label: "Présentez-vous aux rendez-vous en personne", description: "Vérification du dossier puis enrôlement biométrique, et retrait au centre d'enrôlement : nous vous indiquons quand." },
    ],
  },
  {
    id: "entreprise",
    title: "Créer mon entreprise",
    summary: "Société ou entreprise individuelle, puis CNSS.",
    photo: "entrepreneur",
    ordered: true,
    orderNote: "Ordre indiqué par l'ANAPI et la CNSS.",
    steps: [
      { label: "Choisissez votre forme d'entreprise", description: "Société (personne morale) ou entreprise individuelle.", slug: "creation-d-entreprise" },
      { label: "Nous déposons votre dossier au Guichet unique", description: "Le GUCE délivre notamment le RCCM et les numéros d'identification.", slug: "creation-entreprise-individuelle" },
      { label: "Nous affilions votre entreprise à la CNSS", description: "Formulaire unique au Guichet unique lors de la création.", slug: "affiliation-employeur-cnss" },
      { label: "Nous immatriculons chaque travailleur", description: "Dans les quinze jours ouvrables qui suivent l'embauche.", slug: "immatriculation-cnss" },
    ],
  },
  {
    id: "naissance",
    title: "Déclarer une naissance",
    summary: "Enregistrer la naissance, puis obtenir l'acte.",
    photo: "parent-enfant",
    ordered: true,
    orderNote: "La déclaration permet ensuite la délivrance de l'acte de naissance.",
    steps: [
      { label: "Déclarez la naissance à l'état civil", description: "Dans les 90 jours, à la commune de résidence des parents.", slug: "declaration-de-naissance" },
      { label: "Demandez l'acte de naissance", slug: "acte-de-naissance" },
    ],
  },
  {
    id: "mariage",
    title: "Préparer mon mariage civil",
    summary: "Les documents à réunir avant la commune.",
    ordered: false,
    steps: [
      { label: "Actes de naissance des futurs époux", slug: "acte-de-naissance" },
      { label: "Attestation de célibat ou capacité matrimoniale", slug: "attestation-de-celibat" },
      { label: "Pièces d'identité des futurs époux" },
    ],
    note: "La démarche de célébration du mariage est en cours de vérification. Renseignez-vous auprès de votre commune.",
  },
  {
    id: "dossier-professionnel",
    title: "Constituer un dossier professionnel",
    summary: "Les documents souvent demandés par un employeur.",
    ordered: false,
    steps: [
      { label: "Extrait de casier judiciaire", slug: "casier-judiciaire" },
      { label: "Certificat de bonne vie et mœurs", slug: "bonne-vie-et-moeurs" },
      { label: "Attestation de résidence", slug: "certificat-de-residence" },
      { label: "Attestation de diplôme", slug: "attestation-de-diplome" },
    ],
    note: "La liste exacte dépend de l'employeur ou du concours : vérifiez son annonce.",
  },
  {
    id: "diplome",
    title: "Faire reconnaître un diplôme",
    summary: "Attestation, authentification, équivalence.",
    photo: "diplome",
    ordered: false,
    steps: [
      { label: "Attestation de diplôme", slug: "attestation-de-diplome" },
      { label: "Légalisation du document", slug: "legalisation-de-document" },
    ],
    note: "La fiche « Équivalence de diplôme » est en préparation.",
  },
  {
    id: "construire",
    title: "Construire",
    summary: "Droits sur la parcelle et permis de construire.",
    photo: "construction",
    ordered: false,
    steps: [
      { label: "Certificat d'enregistrement", slug: "certificat-enregistrement-immobilier" },
      { label: "Permis de construire", slug: "permis-de-construire" },
    ],
    note: "Ces deux fiches sont en cours de vérification.",
  },
  {
    id: "etranger",
    title: "Depuis l'étranger",
    summary: "Ce qui passe par l'ambassade ou le consulat.",
    ordered: false,
    steps: [
      { label: "Passeport : dépôt auprès de l'ambassade", description: "Délai indiqué : 28 jours francs.", slug: "passeport-biometrique" },
      { label: "Attestations délivrées à l'étranger", description: "Naissance, célibat, résidence : le catalogue officiel les rattache aux représentations diplomatiques." },
    ],
    note: "Les pièces demandées varient d'un poste consulaire à l'autre. Contactez celui de votre pays de résidence.",
  },
];
