import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  CreditCard,
  Phone,
  Shield,
  CheckCircle,
  Loader2,
  ArrowRight,
  Smartphone,
  Wallet,
  Banknote,
} from "lucide-react";

const paymentProviders = [
  {
    id: "mpesa",
    name: "M-Pesa",
    icon: Smartphone,
    color: "bg-green-600 dark:bg-green-700",
  },
  {
    id: "airtel",
    name: "Airtel Money",
    icon: Wallet,
    color: "bg-red-600 dark:bg-red-700",
  },
  {
    id: "orange",
    name: "Orange Money",
    icon: Banknote,
    color: "bg-orange-500 dark:bg-orange-600",
  },
];

interface PaymentResponse {
  id: string;
  transactionId: string;
  status: string;
  amount: number;
}

export default function Payment() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const [provider, setProvider] = useState("mpesa");
  const [phoneNumber, setPhoneNumber] = useState("243");
  const [step, setStep] = useState<"select" | "confirm" | "processing" | "success">("select");
  const [paymentResult, setPaymentResult] = useState<PaymentResponse | null>(null);
  
  const params = new URLSearchParams(search);
  const requestId = params.get("request") || "demo-request";
  const amount = parseInt(params.get("amount") || "50000", 10);

  const initiatePaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/payments/initiate", {
        provider,
        phoneNumber,
        amount,
        documentRequestId: requestId,
      });
      return response.json() as Promise<PaymentResponse>;
    },
    onSuccess: (data) => {
      setPaymentResult(data);
      setStep("processing");
      setTimeout(() => {
        setStep("success");
        toast({
          title: "Paiement Confirmé",
          description: "Votre paiement a été traité avec succès",
        });
      }, 2000);
    },
    onError: () => {
      toast({
        title: "Erreur de Paiement",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const handleConfirmPayment = () => {
    if (!phoneNumber || phoneNumber.length < 12) {
      toast({
        title: "Numéro Invalide",
        description: "Veuillez entrer un numéro de téléphone valide",
        variant: "destructive",
      });
      return;
    }
    initiatePaymentMutation.mutate();
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-CD").format(amount);
  };

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      {/* Header */}
      <section className="bg-primary px-4 py-8 text-primary-foreground">
        <div className="mx-auto max-w-xl text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
            <CreditCard className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Paiement Mobile Money
          </h1>
          <p className="mt-2 text-white/80">
            Payez vos services administratifs de manière sécurisée
          </p>
        </div>
      </section>

      <section className="px-4 py-8">
        <div className="mx-auto max-w-xl space-y-6">
          {step === "select" && (
            <>
              {/* Amount Display */}
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">Montant à Payer</p>
                  <p className="mt-1 text-4xl font-bold" data-testid="text-amount">
                    {formatAmount(amount)} <span className="text-lg">CDF</span>
                  </p>
                </CardContent>
              </Card>

              {/* Provider Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Choisir le Mode de Paiement</CardTitle>
                  <CardDescription>
                    Sélectionnez votre opérateur Mobile Money
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={provider} onValueChange={setProvider} className="space-y-3">
                    {paymentProviders.map((p) => (
                      <label
                        key={p.id}
                        className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors ${
                          provider === p.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                        data-testid={`radio-provider-${p.id}`}
                      >
                        <RadioGroupItem value={p.id} id={p.id} />
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${p.color} text-white`}>
                          <p.icon className="h-5 w-5" />
                        </div>
                        <span className="font-medium">{p.name}</span>
                        {provider === p.id && (
                          <CheckCircle className="ml-auto h-5 w-5 text-primary" />
                        )}
                      </label>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Phone Number */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Numéro de Téléphone</CardTitle>
                  <CardDescription>
                    Le numéro associé à votre compte Mobile Money
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="243XXXXXXXXX"
                      className="h-12 pl-10"
                      data-testid="input-payment-phone"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Format: 243 suivi de 9 chiffres (ex: 243814567890)
                  </p>
                </CardContent>
              </Card>

              {/* Security Notice */}
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4 text-sm">
                <Shield className="h-5 w-5 text-primary shrink-0" />
                <p className="text-muted-foreground">
                  Transaction sécurisée. Vous recevrez une notification sur votre 
                  téléphone pour confirmer le paiement.
                </p>
              </div>

              <Button
                size="lg"
                className="w-full gap-2"
                onClick={() => setStep("confirm")}
                data-testid="button-continue-payment"
              >
                Continuer
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {step === "confirm" && (
            <Card>
              <CardHeader>
                <CardTitle>Confirmer le Paiement</CardTitle>
                <CardDescription>
                  Vérifiez les informations avant de procéder
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montant</span>
                    <span className="font-semibold">{formatAmount(amount)} CDF</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Opérateur</span>
                    <span className="font-semibold">
                      {paymentProviders.find((p) => p.id === provider)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Téléphone</span>
                    <span className="font-semibold">{phoneNumber}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep("select")}
                  >
                    Modifier
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleConfirmPayment}
                    disabled={initiatePaymentMutation.isPending}
                    data-testid="button-confirm-payment"
                  >
                    {initiatePaymentMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      "Confirmer & Payer"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === "processing" && (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <h2 className="mt-4 text-xl font-semibold">Traitement en Cours</h2>
                <p className="mt-2 text-muted-foreground">
                  Veuillez confirmer la transaction sur votre téléphone...
                </p>
                <p className="mt-4 text-sm text-muted-foreground">
                  Vous recevrez une notification de {paymentProviders.find((p) => p.id === provider)?.name}
                </p>
              </CardContent>
            </Card>
          )}

          {step === "success" && (
            <Card className="border-success/50 bg-success/5">
              <CardContent className="flex flex-col items-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success text-success-foreground">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <h2 className="mt-4 text-xl font-semibold text-success">
                  Paiement Réussi!
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Votre paiement de {formatAmount(amount)} CDF a été confirmé
                </p>
                <div className="mt-6 space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    Référence: <span className="font-mono font-medium" data-testid="text-transaction-id">
                      {paymentResult?.transactionId || "N/A"}
                    </span>
                  </p>
                </div>
                <Button
                  className="mt-6"
                  onClick={() => setLocation("/suivi")}
                  data-testid="button-view-status"
                >
                  Voir le Statut du Dossier
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
