import { eq } from "drizzle-orm";
import { db } from "./db";
import { storage } from "./storage";
import {
  procedures,
  procedureFields,
  procedureRequiredDocuments,
} from "@shared/schema";
import bcrypt from "bcrypt";

type SeedProcedure = {
  title: string;
  slug: string;
  description: string;
  category: string;
  institution: string;
  estimatedDays: number;
  cost: number;
  status: "available" | "coming_soon";
  icon: string;
  fields?: Array<{
    label: string;
    type: string;
    required?: boolean;
    options?: string[];
    order: number;
  }>;
  documents?: Array<{
    name: string;
    description: string;
    required?: boolean;
    acceptedFormats: string[];
    maxSizeMb?: number;
    order: number;
  }>;
};

const catalog: SeedProcedure[] = [
  {
    title: "Acte de Naissance",
    slug: "acte-de-naissance",
    description: "Copie integrale ou extrait officiel de l'acte de naissance pour les usages scolaires, administratifs et consulaires.",
    category: "Etat Civil",
    institution: "Commune / Etat Civil",
    estimatedDays: 7,
    cost: 15000,
    status: "available",
    icon: "User",
    fields: [
      { label: "Nom complet de l'interesse", type: "text", order: 1 },
      { label: "Date de naissance", type: "date", order: 2 },
      { label: "Lieu de naissance", type: "text", order: 3 },
      { label: "Nom du pere", type: "text", order: 4 },
      { label: "Nom de la mere", type: "text", order: 5 },
      { label: "Centre d'etat civil ou commune d'origine", type: "text", order: 6 },
    ],
    documents: [
      { name: "Ancien extrait ou reference de l'acte", description: "Numero d'acte, date ou copie precedente si disponible", acceptedFormats: ["pdf", "jpg", "png"], order: 1 },
      { name: "Piece d'identite du demandeur", description: "Carte, passeport ou attestation tenant lieu d'identite", acceptedFormats: ["pdf", "jpg", "png"], order: 2 },
      { name: "Procuration ou preuve de filiation", description: "Si la demande est faite pour un tiers ou un mineur", acceptedFormats: ["pdf", "jpg", "png"], order: 3 },
    ],
  },
  {
    title: "Certificat de Residence",
    slug: "certificat-de-residence",
    description: "Attestation officielle de residence delivree par la commune ou le quartier de rattachement.",
    category: "Etat Civil",
    institution: "Commune",
    estimatedDays: 3,
    cost: 10000,
    status: "available",
    icon: "Home",
    fields: [
      { label: "Adresse complete", type: "textarea", order: 1 },
      { label: "Quartier / Avenue", type: "text", order: 2 },
      { label: "Commune", type: "text", order: 3 },
      { label: "Duree de residence", type: "text", order: 4 },
      { label: "Profession", type: "text", order: 5 },
    ],
    documents: [
      { name: "Attestation du chef de quartier", description: "Ou attestation du chef de rue / cellule", acceptedFormats: ["pdf", "jpg", "png"], order: 1 },
      { name: "Piece d'identite", description: "Identification du demandeur", acceptedFormats: ["pdf", "jpg", "png"], order: 2 },
      { name: "Justificatif de domicile", description: "Facture, contrat de bail ou declaration d'hebergement si disponible", acceptedFormats: ["pdf", "jpg", "png"], order: 3 },
    ],
  },
  {
    title: "Casier Judiciaire",
    slug: "casier-judiciaire",
    description: "Extrait du casier judiciaire pour emploi, visa, concours ou dossier administratif.",
    category: "Justice",
    institution: "Ministere de la Justice",
    estimatedDays: 7,
    cost: 20000,
    status: "available",
    icon: "Shield",
    fields: [
      { label: "Nom complet", type: "text", order: 1 },
      { label: "Date de naissance", type: "date", order: 2 },
      { label: "Lieu de naissance", type: "text", order: 3 },
      { label: "Commune de residence", type: "text", order: 4 },
      { label: "Objet de la demande", type: "text", order: 5 },
    ],
    documents: [
      { name: "Piece d'identite", description: "Document d'identification valide", acceptedFormats: ["pdf", "jpg", "png"], order: 1 },
      { name: "Photo passeport", description: "Photo recente sur fond clair", acceptedFormats: ["jpg", "png"], order: 2 },
      { name: "Preuve de paiement", description: "Recu ou bordereau de frais si requis", acceptedFormats: ["pdf", "jpg", "png"], order: 3 },
    ],
  },
  {
    title: "Acte de Mariage",
    slug: "acte-de-mariage",
    description: "Obtention d'un certificat ou duplicata de mariage civil enregistre a l'etat civil.",
    category: "Etat Civil",
    institution: "Commune / Etat Civil",
    estimatedDays: 5,
    cost: 25000,
    status: "available",
    icon: "Heart",
    fields: [
      { label: "Nom de l'epoux", type: "text", order: 1 },
      { label: "Nom de l'epouse", type: "text", order: 2 },
      { label: "Date du mariage", type: "date", order: 3 },
      { label: "Lieu de celebration", type: "text", order: 4 },
      { label: "Numero ou reference de l'acte", type: "text", order: 5 },
    ],
    documents: [
      { name: "Reference du registre", description: "Numero d'acte ou commune de celebration", acceptedFormats: ["pdf", "jpg", "png"], order: 1 },
      { name: "Piece d'identite d'un conjoint", description: "Ou du demandeur autorise", acceptedFormats: ["pdf", "jpg", "png"], order: 2 },
      { name: "Procuration", description: "Si la demande est faite par un representant", acceptedFormats: ["pdf", "jpg", "png"], order: 3 },
    ],
  },
  {
    title: "Attestation de Diplome",
    slug: "attestation-de-diplome",
    description: "Demande d'authentification ou d'attestation de diplome pour etudes, emploi ou equivalence.",
    category: "Education",
    institution: "Ministere de l'ESU / EPST",
    estimatedDays: 10,
    cost: 35000,
    status: "available",
    icon: "Building",
    fields: [
      { label: "Etablissement de provenance", type: "text", order: 1 },
      { label: "Option / Filiere", type: "text", order: 2 },
      { label: "Annee d'obtention", type: "number", order: 3 },
      { label: "Numero matricule ou code eleve / etudiant", type: "text", order: 4 },
      { label: "Objet de l'attestation", type: "text", order: 5 },
    ],
    documents: [
      { name: "Copie du diplome", description: "Diplome ou releve de notes", acceptedFormats: ["pdf", "jpg", "png"], order: 1 },
      { name: "Piece d'identite", description: "Identification du titulaire", acceptedFormats: ["pdf", "jpg", "png"], order: 2 },
      { name: "Attestation de reussite ou releve", description: "Si le diplome definitif n'est pas encore retire", acceptedFormats: ["pdf", "jpg", "png"], order: 3 },
    ],
  },
  {
    title: "Legalisation de Document",
    slug: "legalisation-de-document",
    description: "Legalisation simple de document administratif pour usage local ou international.",
    category: "Justice",
    institution: "Ministere des Affaires Etrangeres",
    estimatedDays: 4,
    cost: 12000,
    status: "available",
    icon: "FileText",
    fields: [
      {
        label: "Nature du document",
        type: "select",
        options: [
          "Acte de naissance",
          "Acte de mariage",
          "Diplome ou attestation",
          "Casier judiciaire",
          "Certificat de residence",
          "Jugement ou decision",
          "Autre document administratif",
        ],
        order: 1,
      },
      {
        label: "Pays ou organisme destinataire",
        type: "select",
        options: [
          "Usage en RDC",
          "Ambassade",
          "Consulat",
          "Universite etrangere",
          "Employeur etranger",
          "Administration etrangere",
          "Organisation internationale",
        ],
        order: 2,
      },
      { label: "Nombre d'exemplaires", type: "number", order: 3 },
    ],
    documents: [
      { name: "Document a legaliser", description: "Version lisible et complete", acceptedFormats: ["pdf", "jpg", "png"], order: 1 },
      { name: "Piece d'identite", description: "Identification du deposant", acceptedFormats: ["pdf", "jpg", "png"], order: 2 },
      { name: "Preuve de paiement", description: "Recu des frais de legalisation si applicable", acceptedFormats: ["pdf", "jpg", "png"], order: 3 },
    ],
  },
  {
    title: "Certificat de Nationalite",
    slug: "certificat-de-nationalite",
    description: "Attestation officielle de la nationalite congolaise, indispensable pour les dossiers d'identite, de voyage et d'acces aux services publics.",
    category: "Identite",
    institution: "Ministere de l'Interieur",
    estimatedDays: 10,
    cost: 30000,
    status: "available",
    icon: "Flag",
    fields: [
      { label: "Nom complet", type: "text", order: 1 },
      { label: "Date de naissance", type: "date", order: 2 },
      { label: "Lieu de naissance", type: "text", order: 3 },
      { label: "Nom du pere", type: "text", order: 4 },
      { label: "Nom de la mere", type: "text", order: 5 },
      { label: "Commune de residence", type: "text", order: 6 },
      { label: "Objet de la demande", type: "select", options: ["Passeport", "Emploi public", "Visa", "Autre dossier administratif"], order: 7 },
    ],
    documents: [
      { name: "Acte de naissance", description: "Extrait ou copie integrale de l'acte de naissance", acceptedFormats: ["pdf", "jpg", "png"], order: 1 },
      { name: "Piece d'identite", description: "Carte d'identite, carte d'electeur ou passeport", acceptedFormats: ["pdf", "jpg", "png"], order: 2 },
      { name: "Attestation de filiation", description: "Si les parents sont congolais par descendance", required: false, acceptedFormats: ["pdf", "jpg", "png"], order: 3 },
      { name: "Photo passeport", description: "Photo recente sur fond blanc", acceptedFormats: ["jpg", "png"], order: 4 },
    ],
  },
  {
    title: "Acte de Deces",
    slug: "acte-de-deces",
    description: "Delivrance d'un extrait ou certificat de deces pour les demarches de succession, pension ou resiliation administrative.",
    category: "Etat Civil",
    institution: "Commune / Etat Civil",
    estimatedDays: 5,
    cost: 10000,
    status: "available",
    icon: "FileText",
    fields: [
      { label: "Nom complet du defunt", type: "text", order: 1 },
      { label: "Date du deces", type: "date", order: 2 },
      { label: "Lieu du deces", type: "text", order: 3 },
      { label: "Commune d'enregistrement", type: "text", order: 4 },
      { label: "Lien du demandeur avec le defunt", type: "select", options: ["Conjoint(e)", "Enfant", "Parent", "Frere / Soeur", "Representant legal"], order: 5 },
    ],
    documents: [
      { name: "Certificat medical de deces", description: "Delivre par le medecin ou l'hopital", acceptedFormats: ["pdf", "jpg", "png"], order: 1 },
      { name: "Piece d'identite du demandeur", description: "Identification de la personne qui fait la demande", acceptedFormats: ["pdf", "jpg", "png"], order: 2 },
      { name: "Acte de naissance du defunt", description: "Pour verification de l'etat civil", required: false, acceptedFormats: ["pdf", "jpg", "png"], order: 3 },
    ],
  },
  {
    title: "Attestation de Celibat",
    slug: "attestation-de-celibat",
    description: "Attestation prouvant qu'une personne est celibataire, exigee avant la celebration d'un mariage civil ou pour certaines demarches diplomatiques.",
    category: "Etat Civil",
    institution: "Commune / Etat Civil",
    estimatedDays: 4,
    cost: 15000,
    status: "available",
    icon: "User",
    fields: [
      { label: "Nom complet", type: "text", order: 1 },
      { label: "Date de naissance", type: "date", order: 2 },
      { label: "Lieu de naissance", type: "text", order: 3 },
      { label: "Commune de residence", type: "text", order: 4 },
      { label: "Objet de l'attestation", type: "select", options: ["Mariage civil", "Visa", "Emploi", "Autre"], order: 5 },
    ],
    documents: [
      { name: "Piece d'identite", description: "Carte d'identite, carte d'electeur ou passeport", acceptedFormats: ["pdf", "jpg", "png"], order: 1 },
      { name: "Acte de naissance", description: "Extrait de naissance recente", acceptedFormats: ["pdf", "jpg", "png"], order: 2 },
      { name: "Certificat de residence", description: "Attestation delivree par la commune", required: false, acceptedFormats: ["pdf", "jpg", "png"], order: 3 },
    ],
  },
  {
    title: "Bonne Vie et Moeurs",
    slug: "bonne-vie-et-moeurs",
    description: "Attestation de bonne conduite delivree par l'autorite locale ou la commune, requise pour tout emploi public ou prive, inscription dans une institution ou dossier de visa.",
    category: "Etat Civil",
    institution: "Commune",
    estimatedDays: 3,
    cost: 8000,
    status: "available",
    icon: "ShieldCheck",
    fields: [
      { label: "Nom complet", type: "text", order: 1 },
      { label: "Date de naissance", type: "date", order: 2 },
      { label: "Adresse de residence", type: "textarea", order: 3 },
      { label: "Profession", type: "text", order: 4 },
      { label: "Objet de la demande", type: "select", options: ["Emploi public", "Emploi prive", "Visa", "Concours", "Inscription scolaire", "Autre"], order: 5 },
    ],
    documents: [
      { name: "Piece d'identite", description: "Carte nationale, carte d'electeur ou passeport", acceptedFormats: ["pdf", "jpg", "png"], order: 1 },
      { name: "Certificat de residence", description: "Preuve du domicile dans la commune", acceptedFormats: ["pdf", "jpg", "png"], order: 2 },
      { name: "Photo passeport", description: "Photo recente", acceptedFormats: ["jpg", "png"], order: 3 },
    ],
  },
  {
    title: "Reconnaissance de Paternite",
    slug: "reconnaissance-de-paternite",
    description: "Acte officiel par lequel un pere reconnait la filiation d'un enfant ne hors mariage, pour regulariser l'etat civil et les droits de l'enfant.",
    category: "Etat Civil",
    institution: "Commune / Etat Civil",
    estimatedDays: 5,
    cost: 20000,
    status: "available",
    icon: "Users",
    fields: [
      { label: "Nom complet du pere", type: "text", order: 1 },
      { label: "Date de naissance du pere", type: "date", order: 2 },
      { label: "Nom complet de la mere", type: "text", order: 3 },
      { label: "Nom complet de l'enfant", type: "text", order: 4 },
      { label: "Date de naissance de l'enfant", type: "date", order: 5 },
      { label: "Lieu de naissance de l'enfant", type: "text", order: 6 },
    ],
    documents: [
      { name: "Piece d'identite du pere", description: "Document d'identification valide", acceptedFormats: ["pdf", "jpg", "png"], order: 1 },
      { name: "Acte de naissance de l'enfant", description: "Extrait d'acte de naissance ou jugement supletif", acceptedFormats: ["pdf", "jpg", "png"], order: 2 },
      { name: "Piece d'identite de la mere", description: "Identification de la mere ou tutrice legale", acceptedFormats: ["pdf", "jpg", "png"], order: 3 },
      { name: "Temoins (attestation)", description: "Lettre ou comparution des temoins", required: false, acceptedFormats: ["pdf", "jpg", "png"], order: 4 },
    ],
  },
  {
    title: "Numero d'Identification Fiscale (NIF)",
    slug: "numero-identification-fiscale",
    description: "Immatriculation aupres de la Direction Generale des Impots (DGI) pour l'obtention du NIF, obligatoire pour toute activite professionnelle, commerciale ou contractuelle.",
    category: "Fiscalite",
    institution: "Direction Generale des Impots (DGI)",
    estimatedDays: 7,
    cost: 25000,
    status: "available",
    icon: "CreditCard",
    fields: [
      { label: "Type de demandeur", type: "select", options: ["Personne physique", "Entreprise / Societe", "ONG / Association", "Etablissement public"], order: 1 },
      { label: "Nom ou raison sociale", type: "text", order: 2 },
      { label: "Adresse complete", type: "textarea", order: 3 },
      { label: "Secteur d'activite", type: "text", order: 4 },
      { label: "Numero de telephone", type: "text", order: 5 },
      { label: "Adresse email", type: "text", required: false, order: 6 },
    ],
    documents: [
      { name: "Piece d'identite ou statuts", description: "Carte d'identite pour personne physique ou statuts pour societe", acceptedFormats: ["pdf", "jpg", "png"], order: 1 },
      { name: "Contrat de bail ou justificatif de siege", description: "Adresse professionnelle du contribuable", acceptedFormats: ["pdf", "jpg", "png"], order: 2 },
      { name: "Numero RCCM", description: "Numero du registre de commerce si applicable", required: false, acceptedFormats: ["pdf", "jpg", "png"], order: 3 },
    ],
  },
  {
    title: "Immatriculation a la CNSS",
    slug: "immatriculation-cnss",
    description: "Inscription d'un travailleur ou d'un employeur a la Caisse Nationale de Securite Sociale pour beneficier de la couverture sociale (retraite, accident, maladie).",
    category: "Travail",
    institution: "Caisse Nationale de Securite Sociale (CNSS)",
    estimatedDays: 10,
    cost: 15000,
    status: "available",
    icon: "Shield",
    fields: [
      { label: "Type d'immatriculation", type: "select", options: ["Travailleur salarie", "Employeur", "Travailleur independant"], order: 1 },
      { label: "Nom complet du travailleur ou raison sociale", type: "text", order: 2 },
      { label: "Date de naissance ou date de creation", type: "date", order: 3 },
      { label: "Adresse de l'employeur ou du siege", type: "textarea", order: 4 },
      { label: "Secteur d'activite", type: "text", order: 5 },
      { label: "Nombre d'employes (pour employeur)", type: "number", required: false, order: 6 },
    ],
    documents: [
      { name: "Piece d'identite ou statuts", description: "CNI pour personne physique, statuts pour employeur", acceptedFormats: ["pdf", "jpg", "png"], order: 1 },
      { name: "Contrat de travail", description: "Copie du contrat de travail ou lettre d'engagement", required: false, acceptedFormats: ["pdf", "jpg", "png"], order: 2 },
      { name: "NIF de l'employeur", description: "Numero fiscal de l'employeur si applicable", required: false, acceptedFormats: ["pdf", "jpg", "png"], order: 3 },
    ],
  },
  {
    title: "Carte d'Electeur",
    slug: "carte-d-electeur",
    description: "Enrolement biometrique et delivrance de la carte d'electeur, document d'identite civique officiel largement accepte comme piece d'identite en RDC.",
    category: "Identite",
    institution: "Commission Electorale Nationale Independante (CENI)",
    estimatedDays: 21,
    cost: 0,
    status: "available",
    icon: "Vote",
    fields: [
      { label: "Nom complet", type: "text", order: 1 },
      { label: "Date de naissance", type: "date", order: 2 },
      { label: "Lieu de naissance", type: "text", order: 3 },
      { label: "Sexe", type: "select", options: ["Masculin", "Feminin"], order: 4 },
      { label: "Province", type: "text", order: 5 },
      { label: "Territoire / Commune", type: "text", order: 6 },
      { label: "Quartier / Village", type: "text", order: 7 },
    ],
    documents: [
      { name: "Acte de naissance ou jugement supletif", description: "Preuve de l'etat civil du demandeur", acceptedFormats: ["pdf", "jpg", "png"], order: 1 },
      { name: "Certificat de nationalite", description: "Preuve de nationalite congolaise", required: false, acceptedFormats: ["pdf", "jpg", "png"], order: 2 },
      { name: "Photo d'identite recente", description: "Photo sur fond clair, sans lunettes de soleil", acceptedFormats: ["jpg", "png"], order: 3 },
    ],
  },
  {
    title: "Declaration de Succession",
    slug: "declaration-de-succession",
    description: "Formalite obligatoire apres un deces pour declarer les biens du defunt, obtenir le certificat d'heritier et regulariser la transmission du patrimoine familial.",
    category: "Justice",
    institution: "Ministere de la Justice / Notariat",
    estimatedDays: 20,
    cost: 80000,
    status: "available",
    icon: "FileText",
    fields: [
      { label: "Nom complet du defunt", type: "text", order: 1 },
      { label: "Date du deces", type: "date", order: 2 },
      { label: "Lieu du deces", type: "text", order: 3 },
      { label: "Regime matrimonial", type: "select", options: ["Celibataire", "Marie(e) - monogamie", "Marie(e) - polygamie", "Veuf / Veuve", "Divorce(e)"], order: 4 },
      { label: "Nombre d'heritiers", type: "number", order: 5 },
      { label: "Nature des biens a declarer", type: "select", options: ["Immobilier uniquement", "Mobilier uniquement", "Immobilier et mobilier", "Comptes bancaires"], order: 6 },
    ],
    documents: [
      { name: "Acte de deces", description: "Extrait de l'acte de deces du defunt", acceptedFormats: ["pdf", "jpg", "png"], order: 1 },
      { name: "Acte de mariage", description: "Si applicable, pour identifier le conjoint survivant", required: false, acceptedFormats: ["pdf", "jpg", "png"], order: 2 },
      { name: "Actes de naissance des heritiers", description: "Pour chaque heritier direct", acceptedFormats: ["pdf", "jpg", "png"], order: 3 },
      { name: "Titres de propriete", description: "Titres fonciers ou autres preuves de biens", required: false, acceptedFormats: ["pdf", "jpg", "png"], order: 4 },
      { name: "Pieces d'identite des heritiers", description: "Identification de chaque heritier", acceptedFormats: ["pdf", "jpg", "png"], order: 5 },
    ],
  },
  {
    title: "Autorisation d'Exercer une Profession Liberale",
    slug: "autorisation-exercer-profession-liberale",
    description: "Obtention d'un agrément ou autorisation ministerielle pour exercer une profession réglementée : medecin, avocat, pharmacien, architecte, expert-comptable, etc.",
    category: "Travail",
    institution: "Ministere de tutelle / Ordre professionnel",
    estimatedDays: 30,
    cost: 120000,
    status: "available",
    icon: "Briefcase",
    fields: [
      { label: "Profession concernee", type: "select", options: ["Medecin / Medecine", "Avocat / Barreau", "Pharmacien", "Architecte", "Expert-comptable", "Notaire", "Autre profession reglementee"], order: 1 },
      { label: "Nom complet du demandeur", type: "text", order: 2 },
      { label: "Etablissement de formation", type: "text", order: 3 },
      { label: "Annee d'obtention du diplome", type: "number", order: 4 },
      { label: "Lieu d'exercice prevu", type: "text", order: 5 },
    ],
    documents: [
      { name: "Diplome ou titre professionnel", description: "Diplome d'Etat, licence, master ou titre equivalent", acceptedFormats: ["pdf", "jpg", "png"], order: 1 },
      { name: "Attestation d'authenticite du diplome", description: "Delivree par le ministere competent ou l'universite", acceptedFormats: ["pdf", "jpg", "png"], order: 2 },
      { name: "Casier judiciaire", description: "Extrait de casier judiciaire vierge ou favorable", acceptedFormats: ["pdf", "jpg", "png"], order: 3 },
      { name: "Attestation de bonne vie et moeurs", description: "Delivree par la commune de residence", acceptedFormats: ["pdf", "jpg", "png"], order: 4 },
      { name: "Piece d'identite", description: "Identification valide du demandeur", acceptedFormats: ["pdf", "jpg", "png"], order: 5 },
      { name: "Certificat medical", description: "Aptitude physique et mentale a l'exercice", acceptedFormats: ["pdf", "jpg", "png"], order: 6 },
    ],
  },
  {
    title: "Passeport Biometrique",
    slug: "passeport-biometrique",
    description: "Demande ou renouvellement du passeport biometrique congolais.",
    category: "Identite",
    institution: "DGM",
    estimatedDays: 14,
    cost: 185000,
    status: "coming_soon",
    icon: "FileText",
    fields: [
      { label: "Type de demande", type: "select", options: ["Premiere demande", "Renouvellement", "Remplacement"], order: 1 },
      { label: "Nom complet", type: "text", order: 2 },
      { label: "Date de naissance", type: "date", order: 3 },
      { label: "Lieu de naissance", type: "text", order: 4 },
      { label: "Sexe", type: "select", options: ["Masculin", "Feminin"], order: 5 },
      { label: "Etat civil", type: "select", options: ["Celibataire", "Marie(e)", "Veuf(ve)", "Divorce(e)"], order: 6 },
      { label: "Profession", type: "text", order: 7 },
      { label: "Adresse complete", type: "textarea", order: 8 },
      { label: "Numero de telephone", type: "text", order: 9 },
      { label: "Nom du pere", type: "text", order: 10 },
      { label: "Nom de la mere", type: "text", order: 11 },
      { label: "Ancien numero de passeport", type: "text", required: false, order: 12 },
    ],
    documents: [
      { name: "Attestation de nationalite", description: "Document prouvant la nationalite congolaise", acceptedFormats: ["pdf", "jpg", "png"], order: 1 },
      { name: "Acte de naissance", description: "Copie lisible ou extrait recent", acceptedFormats: ["pdf", "jpg", "png"], order: 2 },
      { name: "Carte d'identite ou carte d'electeur", description: "Identification du demandeur", acceptedFormats: ["pdf", "jpg", "png"], order: 3 },
      { name: "Quatre photos passeport", description: "Photos recentes sur fond clair, format administratif", acceptedFormats: ["jpg", "png"], order: 4 },
      { name: "Preuve de paiement des frais", description: "Bordereau ou recu officiel de paiement", acceptedFormats: ["pdf", "jpg", "png"], order: 5 },
      { name: "Ancien passeport", description: "Obligatoire en cas de renouvellement", required: false, acceptedFormats: ["pdf", "jpg", "png"], order: 6 },
      { name: "Autorisation parentale", description: "Pour les mineurs avec piece du parent ou tuteur", required: false, acceptedFormats: ["pdf", "jpg", "png"], order: 7 },
    ],
  },
  {
    title: "Carte Nationale d'Identite",
    slug: "carte-nationale-identite",
    description: "Enrolement et delivrance de la carte nationale d'identite pour les citoyens congolais.",
    category: "Identite",
    institution: "ONIP",
    estimatedDays: 30,
    cost: 25000,
    status: "coming_soon",
    icon: "User",
    fields: [
      { label: "Nom complet", type: "text", order: 1 },
      { label: "Date de naissance", type: "date", order: 2 },
      { label: "Lieu de naissance", type: "text", order: 3 },
      { label: "Adresse de residence", type: "textarea", order: 4 },
      { label: "Profession", type: "text", order: 5 },
      { label: "Taille", type: "text", order: 6 },
      { label: "Nom du pere", type: "text", order: 7 },
      { label: "Nom de la mere", type: "text", order: 8 },
    ],
    documents: [
      { name: "Acte de naissance", description: "Document de base pour l'etat civil", acceptedFormats: ["pdf", "jpg", "png"], order: 1 },
      { name: "Attestation de nationalite", description: "Preuve de nationalite congolaise", acceptedFormats: ["pdf", "jpg", "png"], order: 2 },
      { name: "Attestation de residence", description: "Document delivre par l'autorite locale", acceptedFormats: ["pdf", "jpg", "png"], order: 3 },
      { name: "Photo d'identite", description: "Photo recente conforme", acceptedFormats: ["jpg", "png"], order: 4 },
      { name: "Preuve de paiement", description: "Recu ou reference de paiement", acceptedFormats: ["pdf", "jpg", "png"], order: 5 },
    ],
  },
  {
    title: "Permis de Conduire",
    slug: "permis-de-conduire",
    description: "Demande ou renouvellement du permis de conduire national.",
    category: "Transport",
    institution: "Ministere des Transports",
    estimatedDays: 21,
    cost: 75000,
    status: "coming_soon",
    icon: "Building",
    fields: [
      { label: "Type de demande", type: "select", options: ["Nouveau permis", "Renouvellement", "Duplicata"], order: 1 },
      { label: "Categorie sollicitee", type: "select", options: ["A", "B", "C", "D", "E"], order: 2 },
      { label: "Nom complet", type: "text", order: 3 },
      { label: "Date de naissance", type: "date", order: 4 },
      { label: "Adresse complete", type: "textarea", order: 5 },
      { label: "Numero de telephone", type: "text", order: 6 },
    ],
    documents: [
      { name: "Piece d'identite", description: "Carte d'identite, carte d'electeur ou passeport", acceptedFormats: ["pdf", "jpg", "png"], order: 1 },
      { name: "Certificat medical d'aptitude", description: "Etabli par une structure agreee", acceptedFormats: ["pdf", "jpg", "png"], order: 2 },
      { name: "Attestation d'auto-ecole", description: "Preuve de formation si premiere demande", required: false, acceptedFormats: ["pdf", "jpg", "png"], order: 3 },
      { name: "Ancien permis", description: "En cas de renouvellement ou duplicata", required: false, acceptedFormats: ["pdf", "jpg", "png"], order: 4 },
      { name: "Preuve de paiement", description: "Recu ou bordereau de frais", acceptedFormats: ["pdf", "jpg", "png"], order: 5 },
    ],
  },
  {
    title: "Registre de Commerce",
    slug: "registre-de-commerce",
    description: "Inscription au RCCM pour la creation ou la regularisation d'une activite commerciale.",
    category: "Commerce",
    institution: "GUCE",
    estimatedDays: 14,
    cost: 150000,
    status: "coming_soon",
    icon: "Briefcase",
    fields: [
      { label: "Denomination commerciale", type: "text", order: 1 },
      { label: "Forme juridique", type: "select", options: ["Etablissement", "SARL", "SARLU", "SA"], order: 2 },
      { label: "Activite principale", type: "text", order: 3 },
      { label: "Adresse du siege", type: "textarea", order: 4 },
      { label: "Nom du gerant ou promoteur", type: "text", order: 5 },
    ],
    documents: [
      { name: "Statuts signes", description: "Pour les societes ou structures formalisees", required: false, acceptedFormats: ["pdf"], order: 1 },
      { name: "Piece d'identite du promoteur", description: "Identification du gerant ou associe principal", acceptedFormats: ["pdf", "jpg", "png"], order: 2 },
      { name: "Contrat de bail ou attestation de siege", description: "Preuve de l'adresse du siege social", acceptedFormats: ["pdf", "jpg", "png"], order: 3 },
      { name: "Declaration d'ouverture", description: "Formulaire ou demande signee", acceptedFormats: ["pdf", "jpg", "png"], order: 4 },
      { name: "Preuve de paiement", description: "Paiement des frais GUCE / RCCM", acceptedFormats: ["pdf", "jpg", "png"], order: 5 },
    ],
  },
  {
    title: "Creation d'Entreprise",
    slug: "creation-d-entreprise",
    description: "Constitution d'une entreprise avec formalites GUCE, fisc et identification de l'activite.",
    category: "Commerce",
    institution: "GUCE",
    estimatedDays: 18,
    cost: 200000,
    status: "coming_soon",
    icon: "Briefcase",
    fields: [
      { label: "Nom du projet d'entreprise", type: "text", order: 1 },
      { label: "Forme juridique souhaitee", type: "select", options: ["Etablissement", "SARL", "SARLU", "SA"], order: 2 },
      { label: "Objet social", type: "textarea", order: 3 },
      { label: "Capital social", type: "number", order: 4 },
      { label: "Adresse du siege social", type: "textarea", order: 5 },
      { label: "Nombre d'associes", type: "number", order: 6 },
    ],
    documents: [
      { name: "Projet de statuts", description: "Brouillon ou statuts signes selon la forme choisie", acceptedFormats: ["pdf"], order: 1 },
      { name: "Pieces d'identite des associes", description: "Pour tous les associes ou le promoteur", acceptedFormats: ["pdf", "jpg", "png"], order: 2 },
      { name: "Attestation de siege", description: "Bail, titre ou attestation de domiciliation", acceptedFormats: ["pdf", "jpg", "png"], order: 3 },
      { name: "Declaration de souscription", description: "Si capital social applicable", required: false, acceptedFormats: ["pdf"], order: 4 },
      { name: "Preuve de paiement", description: "Frais de constitution et d'immatriculation", acceptedFormats: ["pdf", "jpg", "png"], order: 5 },
    ],
  },
  {
    title: "Immatriculation de Vehicule",
    slug: "immatriculation-de-vehicule",
    description: "Premiere immatriculation ou mutation d'un vehicule avec emission des documents de circulation.",
    category: "Transport",
    institution: "Ministere des Transports",
    estimatedDays: 20,
    cost: 120000,
    status: "coming_soon",
    icon: "Building",
    fields: [
      { label: "Type d'operation", type: "select", options: ["Premiere immatriculation", "Mutation", "Duplicata"], order: 1 },
      { label: "Marque du vehicule", type: "text", order: 2 },
      { label: "Numero de chassis", type: "text", order: 3 },
      { label: "Energie", type: "select", options: ["Essence", "Diesel", "Electrique", "Hybride"], order: 4 },
      { label: "Nom du proprietaire", type: "text", order: 5 },
      { label: "Adresse du proprietaire", type: "textarea", order: 6 },
    ],
    documents: [
      { name: "Facture ou acte de vente", description: "Preuve d'acquisition du vehicule", acceptedFormats: ["pdf", "jpg", "png"], order: 1 },
      { name: "Declaration en douane", description: "Pour vehicule importe", required: false, acceptedFormats: ["pdf", "jpg", "png"], order: 2 },
      { name: "Carte d'identite du proprietaire", description: "Ou equivalent valide", acceptedFormats: ["pdf", "jpg", "png"], order: 3 },
      { name: "Controle technique", description: "Si requis selon le type de vehicule", required: false, acceptedFormats: ["pdf", "jpg", "png"], order: 4 },
      { name: "Preuve de paiement", description: "Taxes et frais d'immatriculation", acceptedFormats: ["pdf", "jpg", "png"], order: 5 },
    ],
  },
  {
    title: "Permis de Construire",
    slug: "permis-de-construire",
    description: "Autorisation prealable pour travaux de construction ou d'extension immobiliere.",
    category: "Urbanisme",
    institution: "Hotel de Ville / Urbanisme",
    estimatedDays: 30,
    cost: 250000,
    status: "coming_soon",
    icon: "Building",
    fields: [
      { label: "Nature du projet", type: "select", options: ["Construction neuve", "Extension", "Renovation lourde"], order: 1 },
      { label: "Adresse du terrain", type: "textarea", order: 2 },
      { label: "Reference cadastrale ou parcelle", type: "text", order: 3 },
      { label: "Nom du proprietaire", type: "text", order: 4 },
      { label: "Usage prevu", type: "select", options: ["Habitation", "Commerce", "Mixte", "Equipement"], order: 5 },
    ],
    documents: [
      { name: "Titre de propriete ou contrat", description: "Preuve de droit sur le terrain", acceptedFormats: ["pdf", "jpg", "png"], order: 1 },
      { name: "Plan architectural", description: "Plan signe par un technicien ou architecte", acceptedFormats: ["pdf", "jpg", "png"], order: 2 },
      { name: "Plan de situation", description: "Localisation du terrain ou de la parcelle", acceptedFormats: ["pdf", "jpg", "png"], order: 3 },
      { name: "Avis technique", description: "Si demande par la commune ou l'urbanisme", required: false, acceptedFormats: ["pdf", "jpg", "png"], order: 4 },
      { name: "Preuve de paiement", description: "Frais de dossier ou taxe d'urbanisme", acceptedFormats: ["pdf", "jpg", "png"], order: 5 },
    ],
  },
  {
    title: "Certificat d'Enregistrement Immobilier",
    slug: "certificat-enregistrement-immobilier",
    description: "Formalite fonciere pour enregistrement et securisation juridique d'une propriete.",
    category: "Foncier",
    institution: "Conservation des Titres Immobiliers",
    estimatedDays: 45,
    cost: 300000,
    status: "coming_soon",
    icon: "Home",
    fields: [
      { label: "Nature de la demande", type: "select", options: ["Premier enregistrement", "Mutation", "Regularisation"], order: 1 },
      { label: "Localisation du bien", type: "textarea", order: 2 },
      { label: "Superficie", type: "text", order: 3 },
      { label: "Nom du proprietaire", type: "text", order: 4 },
      { label: "Mode d'acquisition", type: "select", options: ["Achat", "Heritage", "Donation", "Attribution"], order: 5 },
    ],
    documents: [
      { name: "Titre ou contrat d'acquisition", description: "Acte de vente, donation, heritage ou concession", acceptedFormats: ["pdf", "jpg", "png"], order: 1 },
      { name: "Plan cadastral ou croquis", description: "Identification precise de la parcelle", acceptedFormats: ["pdf", "jpg", "png"], order: 2 },
      { name: "Piece d'identite du proprietaire", description: "Identification du requerant", acceptedFormats: ["pdf", "jpg", "png"], order: 3 },
      { name: "Quitus fiscal ou taxe fonciere", description: "Si exige par l'administration", required: false, acceptedFormats: ["pdf", "jpg", "png"], order: 4 },
      { name: "Preuve de paiement", description: "Frais d'enregistrement et de conservation", acceptedFormats: ["pdf", "jpg", "png"], order: 5 },
    ],
  },
];

export async function seedCatalog() {
  let availableCount = 0;
  let comingSoonCount = 0;

  for (const item of catalog) {
    const [procedure] = await db
      .insert(procedures)
      .values({
        title: item.title,
        slug: item.slug,
        description: item.description,
        category: item.category,
        institution: item.institution,
        estimatedDays: item.estimatedDays,
        cost: item.cost,
        status: item.status,
        isActive: true,
        icon: item.icon,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: procedures.slug,
        set: {
          title: item.title,
          description: item.description,
          category: item.category,
          institution: item.institution,
          estimatedDays: item.estimatedDays,
          cost: item.cost,
          status: item.status,
          isActive: true,
          icon: item.icon,
          updatedAt: new Date(),
        },
      })
      .returning();

    await db.delete(procedureFields).where(eq(procedureFields.procedureId, procedure.id));
    await db.delete(procedureRequiredDocuments).where(eq(procedureRequiredDocuments.procedureId, procedure.id));

    if (item.fields?.length) {
      await db.insert(procedureFields).values(
        item.fields.map((field) => ({
          procedureId: procedure.id,
          label: field.label,
          type: field.type,
          required: field.required ?? true,
          options: field.options ?? null,
          order: field.order,
        })),
      );
    }

    if (item.documents?.length) {
      await db.insert(procedureRequiredDocuments).values(
        item.documents.map((doc) => ({
          procedureId: procedure.id,
          name: doc.name,
          description: doc.description,
          required: doc.required ?? true,
          acceptedFormats: doc.acceptedFormats,
          maxSizeMb: doc.maxSizeMb ?? 5,
          order: doc.order,
        })),
      );
    }

    if (item.status === "available") {
      availableCount += 1;
    } else {
      comingSoonCount += 1;
    }
  }

  const admin = await storage.getUserByEmail("admin@docu243.cd");
  if (!admin) {
    const hashed = await bcrypt.hash("admin123", 10);
    await storage.createUser({
      prenom: "Admin",
      nom: "System",
      email: "admin@docu243.cd",
      phone: "000000000",
      password: hashed,
      role: "admin",
    });
  }

  return {
    total: catalog.length,
    available: availableCount,
    comingSoon: comingSoonCount,
  };
}
