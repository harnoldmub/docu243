import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge, PaymentStatusBadge } from "@/components/status-badge";
import { WorkflowProgress } from "@/components/workflow-progress";
import { 
  Search, 
  FileText, 
  Calendar, 
  Building2, 
  Phone,
  AlertCircle,
  CheckCircle,
  Clock,
  Copy,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type LegacyService = {
  name: string;
  authority: string;
  price?: number;
  processingTimeDays?: number;
};

interface TrackingResult {
  id: string;
  trackingCode: string;
  status: string;
  rejectionReason?: string | null;
  createdAt?: string | Date | null;
  paymentStatus: string;
  paymentReference?: string | null;
  service?: LegacyService;
}

export default function Tracking() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialCode = params.get("code") || "";
  
  const [trackingCode, setTrackingCode] = useState(initialCode);
  const [submittedCode, setSubmittedCode] = useState(initialCode);
  const [copied, setCopied] = useState(false);

  const { data: result, isLoading, error, refetch } = useQuery<TrackingResult>({
    queryKey: ["/api/tracking", submittedCode],
    enabled: !!submittedCode,
  });

  useEffect(() => {
    if (initialCode && !submittedCode) {
      setSubmittedCode(initialCode);
    }
  }, [initialCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingCode.trim()) {
      setSubmittedCode(trackingCode.trim());
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(result?.trackingCode || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "—";
    return format(new Date(date), "dd MMMM yyyy à HH:mm", { locale: fr });
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Header Section */}
      <section className="bg-primary px-4 py-12 text-primary-foreground">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Suivi de Dossier
          </h1>
          <p className="mt-2 text-white/80">
            Entrez votre code de suivi pour connaître l'état de votre demande
          </p>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="mt-8">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50" />
                <Input
                  placeholder="Ex: DOCU_A1B2C3"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                  className="h-14 border-white/20 bg-white/10 pl-12 text-lg text-white placeholder:text-white/50"
                  data-testid="input-tracking-code"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                variant="secondary"
                className="h-14 px-8"
                disabled={isLoading}
                data-testid="button-track"
              >
                {isLoading ? "Recherche..." : "Rechercher"}
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Results Section */}
      <section className="px-4 py-8">
        <div className="mx-auto max-w-3xl">
          {!submittedCode && !result && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Suivez Votre Dossier</h2>
              <p className="mt-2 max-w-md text-muted-foreground">
                Votre code de suivi vous a été fourni lors de la soumission de votre demande. 
                Il commence généralement par "DOCU_".
              </p>
            </div>
          )}

          {isLoading && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 w-1/3 rounded bg-muted" />
                    <div className="h-4 w-1/2 rounded bg-muted" />
                    <div className="h-20 w-full rounded bg-muted" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {error && submittedCode && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="flex items-start gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-destructive">Dossier Non Trouvé</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Aucun dossier ne correspond au code "{submittedCode}". 
                    Veuillez vérifier votre code de suivi et réessayer.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      setTrackingCode("");
                      setSubmittedCode("");
                    }}
                    data-testid="button-new-search"
                  >
                    Nouvelle Recherche
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {result && (
            <div className="space-y-6">
              {/* Status Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                  <div>
                    <CardTitle className="text-lg">Dossier</CardTitle>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="text-sm font-mono text-muted-foreground" data-testid="text-tracking-code">
                        {result.trackingCode}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={handleCopyCode}
                        data-testid="button-copy-code"
                      >
                        {copied ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <StatusBadge status={result.status as any} />
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Workflow Progress */}
                  <div className="pt-4">
                    <WorkflowProgress 
                      currentStep={result.status as any}
                      isRejected={result.status === "rejected"}
                    />
                  </div>

                  {/* Rejection Reason */}
                  {result.status === "rejected" && result.rejectionReason && (
                    <div className="rounded-lg bg-destructive/5 p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                        <div>
                          <h4 className="font-medium text-destructive">Motif du Rejet</h4>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {result.rejectionReason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Détails de la Demande</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Service</p>
                        <p className="font-medium" data-testid="text-service-name">
                          {result.service?.name || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Autorité</p>
                        <p className="font-medium">
                          {result.service?.authority || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Date de Demande</p>
                        <p className="font-medium" data-testid="text-created-date">
                          {formatDate(result.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Délai Estimé</p>
                        <p className="font-medium">
                          {result.service?.processingTimeDays || "—"} jours
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <CardTitle className="text-lg">Paiement</CardTitle>
                  <PaymentStatusBadge status={result.paymentStatus} />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Montant</p>
                      <p className="text-xl font-bold" data-testid="text-payment-amount">
                        {result.service?.price?.toLocaleString("fr-CD") || "—"} CDF
                      </p>
                    </div>
                    {result.paymentStatus === "unpaid" && (
                      <Link href={`/paiement?request=${result.id}&amount=${result.service?.price || 0}`}>
                        <Button data-testid="button-pay-now">
                          Payer Maintenant
                        </Button>
                      </Link>
                    )}
                    {result.paymentReference && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Référence</p>
                        <p className="font-mono text-sm">{result.paymentReference}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Help Card */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="flex items-start gap-4 p-6">
                  <Phone className="h-6 w-6 text-primary shrink-0" />
                  <div>
                    <h3 className="font-semibold">Besoin d'Aide ?</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Contactez notre support au <strong>+243 81 000 0243</strong> ou 
                      envoyez un email à <strong>support@docu243.cd</strong>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
