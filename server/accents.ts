// Restores the French accents missing from the original catalogue seed.
// Only whole words from this list are replaced, so text that already carries
// accents (or was rewritten by an administrator) is left untouched.
const WORDS: Record<string, string> = {
  Activite: "Activité", Annee: "Année", Biometrique: "Biométrique", Categorie: "Catégorie",
  Celibat: "Célibat", Celibataire: "Célibataire", Controle: "Contrôle", Creation: "Création",
  Deces: "Décès", Declaration: "Déclaration", Delivrance: "Délivrance", Delivre: "Délivré",
  Delivree: "Délivrée", Denomination: "Dénomination", Diplome: "Diplôme", Duree: "Durée",
  Education: "Éducation", Electeur: "Électeur", Electorale: "Électorale", Electrique: "Électrique",
  Etabli: "Établi", Etablissement: "Établissement", Etat: "État", Etrangeres: "Étrangères",
  Feminin: "Féminin", Filiere: "Filière", Fiscalite: "Fiscalité", Formalite: "Formalité",
  Frere: "Frère", Generale: "Générale", Hotel: "Hôtel", Identite: "Identité", Impots: "Impôts",
  Independante: "Indépendante", Interieur: "Intérieur", Legalisation: "Légalisation",
  Liberale: "Libérale", Medecin: "Médecin", Medecine: "Médecine",
  Ministere: "Ministère", Moeurs: "Mœurs", Nationalite: "Nationalité", Numero: "Numéro",
  Paternite: "Paternité", Piece: "Pièce", Pieces: "Pièces", Premiere: "Première",
  Recu: "Reçu", Reference: "Référence", Regime: "Régime", Regularisation: "Régularisation",
  Renovation: "Rénovation", Representant: "Représentant", Residence: "Résidence",
  Securite: "Sécurité", Societe: "Société", Soeur: "Sœur", Temoins: "Témoins",
  Vehicule: "Véhicule",
  activite: "activité", agreee: "agréée", apres: "après", associe: "associé", associes: "associés",
  aupres: "auprès", authenticite: "authenticité", autorise: "autorisé", autorite: "autorité",
  bancaires: "bancaires", beneficier: "bénéficier", biometrique: "biométrique",
  cadastrale: "cadastrale", celebration: "célébration", celibataire: "célibataire",
  chassis: "châssis", competent: "compétent", complete: "complète", comptable: "comptable",
  concernee: "concernée", congolais: "congolais", deces: "décès", declaration: "déclaration",
  declarer: "déclarer", definitif: "définitif", defunt: "défunt", delivrance: "délivrance",
  decision: "décision", delivre: "délivré", delivree: "délivrée", demarches: "démarches", deposant: "déposant",
  diplomatiques: "diplomatiques", diplome: "diplôme", ecole: "école", electeur: "électeur",
  eleve: "élève", emission: "émission", employes: "employés", epouse: "épouse", epoux: "époux",
  equivalence: "équivalence", equivalent: "équivalent", etat: "état", etudes: "études",
  etudiant: "étudiant", exigee: "exigée", fonciere: "foncière", formalisees: "formalisées",
  formalites: "formalités", gerant: "gérant", hebergement: "hébergement", heritage: "héritage",
  heritier: "héritier", heritiers: "héritiers", hopital: "hôpital", identite: "identité",
  immobiliere: "immobilière", importe: "importé", independant: "indépendant",
  integrale: "intégrale", interesse: "intéressé", legal: "légal", legale: "légale",
  legalisation: "légalisation", legaliser: "légaliser", lequel: "lequel", medical: "médical",
  mere: "mère", ministere: "ministère", ministerielle: "ministérielle", nationalite: "nationalité",
  numero: "numéro", operation: "opération", parentale: "parentale", pere: "père",
  piece: "pièce", prealable: "préalable", precedente: "précédente", precise: "précise",
  premiere: "première", prevu: "prévu", prive: "privé", proprietaire: "propriétaire",
  propriete: "propriété", reconnait: "reconnaît", recent: "récent", recente: "récente",
  recentes: "récentes", recu: "reçu", reference: "référence", reglementee: "réglementée",
  regularisation: "régularisation", regulariser: "régulariser", releve: "relevé",
  requerant: "requérant", residence: "résidence", resiliation: "résiliation", retire: "retiré",
  retraite: "retraite", reussite: "réussite", salarie: "salarié", securisation: "sécurisation",
  siege: "siège", signe: "signé", signee: "signée", signes: "signés", societe: "société",
  societes: "sociétés", sollicitee: "sollicitée", souhaitee: "souhaitée", supletif: "supplétif",
  telephone: "téléphone", temoins: "témoins", universite: "université", vehicule: "véhicule",
  verification: "vérification"
};

const pattern = new RegExp(`(?<![\\p{L}])(${Object.keys(WORDS).join("|")})(?![\\p{L}])`, "gu");

export function accentize(text: string): string {
  return text.replace(pattern, (word) => WORDS[word] ?? word);
}
