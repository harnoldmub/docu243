import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  FileText,
  Upload,
  Clock,
  CreditCard,
  Check,
  ArrowLeft,
  ArrowRight,
  Building2,
  Shield,
  AlertCircle,
} from "lucide-react";
import type { Service } from "@shared/schema";

const requestFormSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  postNom: z.string().min(2, "Le post-nom doit contenir au moins 2 caractères"),
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  nationalId: z.string().min(10, "Numéro de carte invalide"),
  phoneNumber: z.string().regex(/^243[0-9]{9}$/, "Format: 243XXXXXXXXX"),
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

export default function Request() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  const { data: service, isLoading } = useQuery<Service>({
    queryKey: ["/api/services", id],
  });

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      nom: "",
      postNom: "",
      prenom: "",
      nationalId: "",
      phoneNumber: "243",
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: RequestFormValues) => {
      return apiRequest("POST", "/api/requests", {
        ...data,
        serviceId: id,
      });
    },
    onSuccess: async (response) => {
      const result = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      toast({
        title: "Demande Créée",
        description: `Votre code de suivi: ${result.trackingCode}`,
      });
      setLocation(`/suivi?code=${result.trackingCode}`);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de la demande",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: RequestFormValues) => {
    createRequestMutation.mutate(data);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-CD").format(price) + " CDF";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-1/3 rounded bg-muted" />
            <div className="h-40 rounded-lg bg-muted" />
            <div className="h-60 rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md text-center">
          <CardContent className="p-8">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
            <h2 className="mt-4 text-xl font-semibold">Service Non Trouvé</h2>
            <p className="mt-2 text-muted-foreground">
              Le service demandé n'existe pas ou n'est plus disponible.
            </p>
            <Button className="mt-6" onClick={() => setLocation("/services")}>
              Retour aux Services
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      {/* Header */}
      <section className="bg-primary px-4 py-8 text-primary-foreground">
        <div className="mx-auto max-w-3xl">
          <Button
            variant="ghost"
            className="mb-4 gap-2 text-white/80 hover:text-white"
            onClick={() => setLocation("/services")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux Services
          </Button>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Demande: {service.name}
          </h1>
          <p className="mt-1 text-white/80">{service.authority}</p>
        </div>
      </section>

      <section className="px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Service Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Récapitulatif du Service</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Coût</p>
                    <p className="font-semibold" data-testid="text-service-price">
                      {formatPrice(service.price)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Délai</p>
                    <p className="font-semibold">{service.processingTimeDays} jours</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Autorité</p>
                    <p className="font-semibold text-sm">{service.authority}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Required Documents */}
          {service.requiredDocuments && service.requiredDocuments.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Documents Requis</CardTitle>
                <CardDescription>
                  Assurez-vous d'avoir ces documents avant de continuer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {service.requiredDocuments.map((doc, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-success" />
                      {doc}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Request Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations du Demandeur</CardTitle>
              <CardDescription>
                Remplissez vos informations personnelles telles qu'elles apparaissent 
                sur votre carte d'identité nationale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="nom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom</FormLabel>
                          <FormControl>
                            <Input placeholder="KABILA" {...field} data-testid="input-nom" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="postNom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Post-Nom</FormLabel>
                          <FormControl>
                            <Input placeholder="MWAMBA" {...field} data-testid="input-postnom" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="prenom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prénom</FormLabel>
                          <FormControl>
                            <Input placeholder="Jean" {...field} data-testid="input-prenom" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="nationalId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro Carte d'Identité Nationale</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Numéro figurant sur votre carte CENI"
                            {...field}
                            data-testid="input-national-id"
                          />
                        </FormControl>
                        <FormDescription>
                          Le numéro à 14 chiffres de votre carte d'électeur
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro de Téléphone</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="243XXXXXXXXX"
                            {...field}
                            data-testid="input-phone"
                          />
                        </FormControl>
                        <FormDescription>
                          Format international sans le +
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-4 text-sm">
                    <Shield className="h-5 w-5 text-primary shrink-0" />
                    <p className="text-muted-foreground">
                      Vos données personnelles sont protégées et traitées conformément 
                      à la loi sur la protection des données de la RDC.
                    </p>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/services")}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={createRequestMutation.isPending}
                      className="gap-2"
                      data-testid="button-submit-request"
                    >
                      {createRequestMutation.isPending ? (
                        "Création..."
                      ) : (
                        <>
                          Soumettre la Demande
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
