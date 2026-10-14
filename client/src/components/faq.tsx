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
          Pour un dossier en ligne, chaque pièce s'envoie en PDF, JPG, PNG ou WEBP, dans la limite de taille indiquée sous la pièce
          (5 Mo en général).
        </p>
      </>
    ),
  },
  {
    id: "etranger",
    q: "Puis-je faire ma démarche depuis l'étranger ?",
    a: (
      <p>
        Vous pouvez consulter les fiches, créer votre compte et préparer votre dossier où que vous soyez. Le retrait des documents
        se fait en personne, à l'endroit indiqué par l'administration. Certaines démarches, comme le passeport, se déposent auprès
        de l'ambassade ou du consulat de RDC de votre pays de résidence : contactez-le pour connaître ses exigences.
      </p>
    ),
  },
  {
    id: "paiement",
    q: "À quel moment dois-je payer ?",
    a: (
      <p>
        MesDémarches n'encaisse aucun paiement. Les frais sont réglés auprès de l'administration compétente, selon ses modalités.
        Quand un montant officiel est publié, la fiche l'indique avec sa devise (USD ou CDF) ; sinon elle précise qu'il est à
        confirmer. Si l'administration demande un paiement pour votre dossier, son statut devient « Paiement requis ».
      </p>
    ),
  },
  {
    id: "suivi",
    q: "Comment suivre mon dossier ?",
    a: (
      <p>
        Connectez-vous et ouvrez <Link href="/dashboard" className="font-semibold text-brand-royal underline underline-offset-4">Mes dossiers</Link>. Chaque dossier
        affiche son statut, la date de la dernière mise à jour, la prochaine action attendue et l'historique complet. Vous recevez
        une notification à chaque changement.
      </p>
    ),
  },
  {
    id: "refus",
    q: "Que faire si une pièce est refusée ?",
    a: (
      <p>
        L'agent indique le motif sous la pièce concernée et votre dossier passe au statut « Correction demandée ». Remplacez
        uniquement la pièce refusée, puis transmettez de nouveau le dossier : les autres informations sont conservées.
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
        sur une décision administrative, chaque fiche indique l'administration compétente.
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
