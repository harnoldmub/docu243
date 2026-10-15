import * as Accordion from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "wouter";

export const FAQ_ITEMS: Array<{ id: string; q: string; a: ReactNode }> = [
  {
    id: "documents",
    q: "Quels documents dois-je préparer ?",
    a: (
      <>
        <p>
          Chaque fiche de démarche liste les pièces à réunir. Répondez aux quelques questions proposées (première demande ou
          renouvellement, adulte ou mineur…) : la liste s'adapte et distingue les pièces obligatoires, les pièces demandées
          seulement dans certains cas et les originaux à présenter en personne.
        </p>
        <p className="mt-3">
          Chaque pièce s'envoie en PDF, JPG, PNG ou WEBP, dans la limite de taille indiquée sous la pièce (5 Mo en général). Une
          photo nette prise avec votre téléphone suffit.
        </p>
      </>
    ),
  },
  {
    id: "etranger",
    q: "Puis-je faire ma démarche depuis l'étranger ?",
    a: (
      <p>
        Oui pour la plupart : vous envoyez vos documents et réglez en ligne, notre équipe effectue la démarche en RDC. Quand votre
        présence est indispensable, comme pour l'enrôlement biométrique du passeport, la fiche le précise : à l'étranger, cette
        étape se fait auprès de l'ambassade ou du consulat de RDC de votre pays de résidence.
      </p>
    ),
  },
  {
    id: "paiement",
    q: "À quel moment dois-je payer ?",
    a: (
      <p>
        Au moment de transmettre votre dossier, une fois les pièces envoyées. Vous payez en une fois, par carte et en dollars, le
        prix affiché sur la fiche : les frais officiels de l'administration plus nos frais de service (100 USD pour le passeport,
        20 ou 50 USD pour les autres démarches). Vous recevez aussitôt la confirmation et un reçu, et nous réglons l'administration
        pour vous.
      </p>
    ),
  },
  {
    id: "suivi",
    q: "Comment suivre mon dossier ?",
    a: (
      <p>
        Connectez-vous et ouvrez <Link href="/dashboard" className="font-semibold text-brand-royal underline underline-offset-4">Mes dossiers</Link>. Chaque dossier
        affiche son statut, la date de la dernière mise à jour, la prochaine étape et l'historique complet. Notre équipe met le
        statut à jour à chaque avancée, et vous recevez une notification.
      </p>
    ),
  },
  {
    id: "refus",
    q: "Que faire si une pièce est refusée ?",
    a: (
      <p>
        Notre équipe indique le motif sous la pièce concernée et votre dossier passe au statut « Correction demandée ». Remplacez
        uniquement cette pièce, puis transmettez de nouveau le dossier : les autres informations sont conservées et vous ne payez
        pas une seconde fois.
      </p>
    ),
  },
  {
    id: "assistance",
    q: "Comment contacter l'assistance ?",
    a: (
      <p>
        Les coordonnées de l'assistance MesDémarches sont en cours de validation et seront publiées sur la page{" "}
        <Link href="/aide#contact" className="font-semibold text-brand-royal underline underline-offset-4">Aide</Link>. Pour une question
        sur votre dossier, indiquez toujours sa référence (par exemple DOCU_1A2B3C).
      </p>
    ),
  },
];

export function FaqAccordion({ items = FAQ_ITEMS, headingLevel = 3 }: { items?: typeof FAQ_ITEMS; headingLevel?: 2 | 3 }) {
  const Heading = `h${headingLevel}` as "h2" | "h3";
  return (
    <Accordion.Root type="multiple" className="divide-y divide-brand-line border-y border-brand-line">
      {items.map((item) => (
        <Accordion.Item key={item.id} value={item.id} id={`faq-${item.id}`}>
          <Accordion.Header asChild>
            <Heading className="m-0">
            <Accordion.Trigger className="group flex min-h-[64px] w-full items-center justify-between gap-6 py-4 text-left font-display text-lg font-bold text-brand-ink sm:text-xl">
              {item.q}
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-mist text-brand-royal transition-[transform,background-color] duration-200 group-hover:bg-brand-sky group-data-[state=open]:rotate-45 group-data-[state=open]:bg-brand-yellow group-data-[state=open]:text-brand-ink">
                <Plus className="h-5 w-5" aria-hidden="true" />
              </span>
            </Accordion.Trigger>
            </Heading>
          </Accordion.Header>
          <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <div className="max-w-3xl pb-6 text-[1.0625rem] leading-relaxed text-brand-ink-2">{item.a}</div>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
