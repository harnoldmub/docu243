import { Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, Printer } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { Logo } from "@/components/header";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/states";
import { formatMoney } from "@/lib/procedures";
import type { PaymentRow } from "@/pages/application-detail";

type Dossier = { id: string; reference: string; procedure?: { title: string; institution: string }; user?: { prenom: string; nom: string } };

export default function ReceiptPage() {
  return (
    <RequireAuth>
      <Receipt />
    </RequireAuth>
  );
}

function Receipt() {
  const [, params] = useRoute("/application/:id/recu");
  const id = params?.id ?? "";
  const dossier = useQuery<Dossier>({ queryKey: [`/api/applications/${id}`] });
  const pays = useQuery<PaymentRow[]>({ queryKey: [`/api/applications/${id}/payments`], staleTime: 0 });
  const paid = pays.data?.find((p) => p.status === "succeeded");

  if (dossier.isLoading || pays.isLoading) return <div className="md-container py-16"><div className="skeleton h-96" /></div>;
  if (!dossier.data || !paid) {
    return (
      <div className="md-container py-16">
        <ErrorState title="Aucun reçu disponible" message="Ce dossier n'a pas encore de paiement confirmé." />
      </div>
    );
  }
  const d = dossier.data;
  const currency = paid.currency ?? "USD";

  return (
    <div className="bg-brand-mist py-10 print:bg-white print:py-0">
      <div className="md-container max-w-3xl">
        <div className="mb-6 flex flex-wrap justify-between gap-3 print:hidden">
          <Link href={`/application/${d.id}`} className="inline-flex min-h-11 items-center gap-2 font-semibold text-brand-ink-2 hover:text-brand-ink">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Retour au dossier
          </Link>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer aria-hidden="true" /> Imprimer ou enregistrer en PDF
          </Button>
        </div>
        <article className="overflow-hidden rounded-2xl bg-white shadow-card print:shadow-none">
          <div className="tricolor" aria-hidden="true" />
          <div className="p-6 sm:p-10">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <Logo className="h-10" />
              <div className="text-right">
                <h1 className="font-display text-2xl font-bold">Reçu de paiement</h1>
                <p className="text-brand-ink-2">N° {paid.receiptNumber}</p>
              </div>
            </div>
            <dl className="mt-10 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-brand-ink-2">Date du paiement</dt>
                <dd className="font-semibold">{paid.paidAt && format(new Date(paid.paidAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}</dd>
              </div>
              <div>
                <dt className="text-sm text-brand-ink-2">Dossier</dt>
                <dd className="font-semibold">{d.reference}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm text-brand-ink-2">Démarche</dt>
                <dd className="font-semibold">{d.procedure?.title}</dd>
              </div>
            </dl>
            <table className="mt-8 w-full text-left">
              <caption className="sr-only">Détail du montant</caption>
              <tbody className="divide-y divide-brand-line border-y border-brand-line">
                <tr>
                  <th scope="row" className="py-3 font-normal">Frais officiels ({d.procedure?.institution})</th>
                  <td className="py-3 text-right font-semibold">{formatMoney(paid.officialAmount ?? 0, currency)}</td>
                </tr>
                <tr>
                  <th scope="row" className="py-3 font-normal">Frais de service MesDémarches</th>
                  <td className="py-3 text-right font-semibold">{formatMoney(paid.serviceFee ?? 0, currency)}</td>
                </tr>
                <tr>
                  <th scope="row" className="py-3 text-lg font-bold">Total payé</th>
                  <td className="py-3 text-right text-lg font-bold">{formatMoney(paid.amount / 100, currency)}</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-6 text-sm text-brand-ink-2">
              Paiement par carte via Stripe{paid.transactionRef ? `, référence ${paid.transactionRef}` : ""}. Ce reçu est émis par MesDémarches pour le
              service rendu. Il ne remplace pas les reçus et documents délivrés par l'administration.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
