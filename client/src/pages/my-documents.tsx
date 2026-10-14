import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Eye, FileImage, FileText, Files } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { DocumentStatusBadge, StatusBadge } from "@/components/status-badge";
import { EmptyState, ErrorState, Notice } from "@/components/states";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/procedures";

type Row = {
  id: string;
  documentName: string;
  originalName: string;
  mimeType: string;
  size: number;
  status: string;
  rejectionReason: string | null;
  fileUrl: string;
  createdAt: string | null;
  updatedAt: string | null;
  procedureTitle?: string;
  application: { id: string; reference: string; status: string };
};

export function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  return `${(bytes / 1024 / 1024).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`;
}

export default function MyDocumentsPage() {
  return (
    <RequireAuth>
      <MyDocuments />
    </RequireAuth>
  );
}

function MyDocuments() {
  const { data = [], isLoading, isError, refetch } = useQuery<Row[]>({ queryKey: ["/api/documents/me"], staleTime: 30_000 });

  return (
    <div className="bg-brand-mist pb-20">
      <section className="border-b border-brand-line bg-white">
        <div className="md-container py-10">
          <h1 className="display-1 text-brand-ink">Mes documents</h1>
          <p className="lead mt-3 max-w-2xl text-brand-ink-2">Toutes les pièces que vous avez envoyées, dossier par dossier.</p>
        </div>
      </section>
      <div className="md-container pt-8">
        <Notice tone="neutral" className="mb-6">
          Pour remplacer une pièce, ouvrez le dossier concerné : c'est possible tant qu'il est en brouillon ou qu'une correction est
          demandée. La réutilisation d'un document dans un autre dossier n'est pas encore disponible.
        </Notice>
        {isLoading ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-20" />)}</div>
        ) : isError ? (
          <ErrorState message="Vos documents n'ont pas pu être chargés." onRetry={() => refetch()} />
        ) : data.length === 0 ? (
          <EmptyState icon={<Files className="h-6 w-6" />} title="Aucun document pour le moment" action={<Button asChild><Link href="/dashboard">Voir mes dossiers</Link></Button>}>
            Les pièces que vous envoyez dans vos dossiers apparaîtront ici.
          </EmptyState>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-brand-line bg-white">
            <table className="w-full text-left text-[0.9375rem]">
              <caption className="sr-only">Pièces envoyées</caption>
              <thead className="hidden bg-brand-mist text-sm text-brand-ink-2 md:table-header-group">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Pièce</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Dossier</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Envoyée le</th>
                  <th scope="col" className="px-5 py-3 font-semibold">État</th>
                  <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-line">
                {data.map((d) => {
                  const Icon = d.mimeType.startsWith("image/") ? FileImage : FileText;
                  return (
                    <tr key={d.id} className="grid gap-2 p-5 md:table-row md:p-0">
                      <td className="md:px-5 md:py-4">
                        <div className="flex items-start gap-3">
                          <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-royal" aria-hidden="true" />
                          <div className="min-w-0">
                            <p className="font-semibold text-brand-ink">{d.documentName}</p>
                            <p className="truncate text-sm text-brand-ink-2">{d.originalName} · {formatSize(d.size)}</p>
                            {d.rejectionReason && <p className="mt-1 text-sm font-semibold text-[var(--st-danger)]">Motif : {d.rejectionReason}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="md:px-5 md:py-4">
                        <Link href={`/application/${d.application.id}`} className="font-semibold text-brand-royal underline-offset-4 hover:underline">
                          {d.procedureTitle}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-brand-ink-2">
                          {d.application.reference} <StatusBadge status={d.application.status} />
                        </div>
                      </td>
                      <td className="text-brand-ink-2 md:px-5 md:py-4">{formatDate(d.updatedAt ?? d.createdAt, { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td className="md:px-5 md:py-4">
                        <DocumentStatusBadge status={d.status} />
                      </td>
                      <td className="md:px-5 md:py-4 md:text-right">
                        <Button asChild variant="outline" size="sm">
                          <a href={d.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Eye aria-hidden="true" /> Ouvrir <span className="sr-only">{d.documentName} (nouvel onglet)</span>
                          </a>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
