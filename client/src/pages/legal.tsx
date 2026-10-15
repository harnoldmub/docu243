import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/pages/info-pages";
import { Notice } from "@/components/states";

function LegalLayout({ title, missing, children }: { title: string; missing: string[]; children: React.ReactNode }) {
  return (
    <>
      <PageHeader title={title} tone="mist" />
      <div className="md-container py-12 lg:py-16">
        <div className="max-w-3xl">
          {missing.length > 0 && (
            <Notice tone="warning" icon={<AlertTriangle />} title="Page en cours de validation" className="mb-10">
              <p>Les informations suivantes doivent être fournies et validées avant publication définitive :</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {missing.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </Notice>
          )}
          <div className="space-y-10 text-[1.0625rem] leading-relaxed text-brand-ink [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

export function LegalNoticePage() {
  return (
    <LegalLayout
      title="Mentions légales"
      missing={[
        "Nom et statut juridique de l'éditeur du service",
        "Adresse du siège et numéro d'immatriculation",
        "Responsable de la publication",
        "Hébergeur du site (nom, adresse)",
        "Adresse de contact",
        "Statut du service vis-à-vis des administrations (partenariat, agrément ou service indépendant)",
      ]}
    >
      <section>
        <h2>Le service</h2>
        <p>
          MesDémarches (mesdemarches.cd) est un service privé qui effectue des démarches administratives en République démocratique
          du Congo pour le compte de ses clients, contre rémunération.
        </p>
      </section>
      <section>
        <h2>Informations sur les démarches</h2>
        <p>
          Les fiches indiquent l'administration compétente et la source officielle consultée, avec sa date de consultation. Les
          informations non confirmées sont signalées comme telles. En cas de différence, les indications de l'administration
          compétente prévalent.
        </p>
      </section>
      <section>
        <h2>Identité visuelle</h2>
        <p>Les couleurs du site s'inspirent de celles de la RDC. Elles ne constituent pas un emblème officiel.</p>
      </section>
    </LegalLayout>
  );
}

export function PrivacyPage() {
  return (
    <LegalLayout
      title="Confidentialité"
      missing={[
        "Responsable du traitement et coordonnées",
        "Durée de conservation des comptes, des dossiers et des pièces jointes",
        "Procédure d'exercice des droits (accès, rectification, suppression)",
        "Cadre légal applicable à la protection des données",
      ]}
    >
      <section>
        <h2>Données collectées</h2>
        <ul>
          <li>Votre compte : prénom, nom, adresse e-mail, numéro de téléphone et mot de passe (conservé sous forme chiffrée).</li>
          <li>Vos dossiers : les informations saisies dans les formulaires et les pièces que vous envoyez.</li>
          <li>L'historique de vos dossiers : création, envoi, changements de statut et décisions sur les pièces.</li>
        </ul>
        <ul>
          <li>Vos paiements : montant, date, numéro de reçu et référence Stripe. Les données de votre carte sont traitées par Stripe et ne sont jamais stockées par MesDémarches.</li>
        </ul>
        <p>MesDémarches ne collecte aucune donnée biométrique.</p>
      </section>
      <section>
        <h2>Utilisation</h2>
        <p>
          Ces données servent uniquement à effectuer les démarches que vous nous confiez auprès des administrations compétentes, à
          suivre vos dossiers et à vous informer de leur avancement. Elles sont transmises à l'administration concernée dans la seule
          mesure nécessaire à la démarche.
        </p>
      </section>
      <section>
        <h2>Accès à vos pièces</h2>
        <p>
          Vos pièces sont stockées sur le serveur du service et ne sont accessibles qu'après connexion : à vous, pour vos propres
          dossiers, et aux agents et administrateurs de MesDémarches chargés de les traiter.
        </p>
      </section>
      <section>
        <h2>Cookies et stockage local</h2>
        <ul>
          <li>Un cookie de session, nécessaire pour rester connecté. Il expire après 7 jours.</li>
          <li>
            Les cases cochées dans les listes de pièces sont enregistrées dans votre navigateur, sur votre appareil uniquement.
          </li>
        </ul>
        <p>Aucun cookie publicitaire ou de mesure d'audience n'est utilisé.</p>
      </section>
      <section>
        <h2>Questions</h2>
        <p>
          Voir la page <Link href="/aide#contact" className="font-semibold text-brand-royal underline underline-offset-4">Aide</Link>.
        </p>
      </section>
    </LegalLayout>
  );
}

export function TermsPage() {
  return (
    <LegalLayout
      title="Conditions d'utilisation"
      missing={[
        "Éditeur du service et droit applicable",
        "Politique de remboursement (annulation, refus de l'administration, démarche impossible)",
        "Délais d'exécution sur lesquels MesDémarches s'engage",
        "Conditions de suspension ou de suppression d'un compte",
      ]}
    >
      <section>
        <h2>Objet</h2>
        <p>
          Ces conditions encadrent l'utilisation de MesDémarches par toute personne qui consulte le site ou crée un compte, et les
          démarches que nos clients nous confient.
        </p>
      </section>
      <section>
        <h2>Le service</h2>
        <ul>
          <li>En transmettant un dossier, vous autorisez MesDémarches à effectuer la démarche en votre nom auprès de l'administration compétente.</li>
          <li>Le prix affiché comprend les frais officiels de la démarche et les frais de service MesDémarches. Il est payé en ligne, en dollars, avant la prise en charge du dossier.</li>
          <li>Les étapes qui exigent votre présence (par exemple l'enrôlement biométrique) restent à votre charge ; nous vous indiquons quand et où vous présenter.</li>
        </ul>
      </section>
      <section>
        <h2>Votre compte</h2>
        <ul>
          <li>Vous fournissez des informations exactes et gardez votre mot de passe confidentiel.</li>
          <li>Vous êtes responsable des informations et des pièces envoyées depuis votre compte.</li>
        </ul>
      </section>
      <section>
        <h2>Vos dossiers</h2>
        <ul>
          <li>Un dossier transmis ne peut plus être modifié, sauf si vous le retirez avant sa prise en charge ou si notre équipe demande une correction. Une correction n'entraîne pas de nouveau paiement.</li>
          <li>La décision sur votre demande appartient à l'administration compétente.</li>
          <li>Toute fausse déclaration ou pièce falsifiée peut entraîner le refus de votre demande.</li>
        </ul>
      </section>
      <section>
        <h2>Informations publiées</h2>
        <p>
          Les fiches de démarches sont établies à partir des sources officielles citées. Elles peuvent évoluer : vérifiez les points
          signalés « à confirmer » auprès de l'administration avant de vous déplacer.
        </p>
      </section>
    </LegalLayout>
  );
}
