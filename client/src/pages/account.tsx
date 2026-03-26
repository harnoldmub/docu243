import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge, PaymentStatusBadge } from "@/components/status-badge";
import {
  User,
  Phone,
  Mail,
  Shield,
  FileText,
  ChevronRight,
  Settings,
  Bell,
  LogOut,
  CheckCircle,
  AlertCircle,
  Search,
  Loader2,
} from "lucide-react";
import { Link } from "wouter";

type LegacyCitizen = {
  prenom: string;
  nom: string;
  postNom: string;
  nationalId: string;
  phoneNumber: string;
  trustLevel: number;
  confidenceIndex: number;
};

type LegacyService = {
  name: string;
};

type LegacyDocumentRequest = {
  id: string;
  trackingCode: string;
  status: string;
  paymentStatus: string;
  service?: LegacyService;
};

interface CitizenRequestsResponse {
  citizen: LegacyCitizen;
  requests: LegacyDocumentRequest[];
}

export default function Account() {
  const [activeTab, setActiveTab] = useState("profile");
  const [nationalId, setNationalId] = useState("");
  const [searchId, setSearchId] = useState("");

  const { data, isLoading, error } = useQuery<CitizenRequestsResponse>({
    queryKey: ["/api/citizens", searchId, "requests"],
    enabled: !!searchId,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (nationalId.trim()) {
      setSearchId(nationalId.trim());
    }
  };

  const getTrustLevelLabel = (level: number) => {
    switch (level) {
      case 1:
        return { label: "Basique", color: "bg-warning text-warning-foreground" };
      case 2:
        return { label: "Vérifié", color: "bg-primary text-primary-foreground" };
      case 3:
        return { label: "Certifié", color: "bg-success text-success-foreground" };
      default:
        return { label: "Non vérifié", color: "bg-muted text-muted-foreground" };
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      {/* Header */}
      <section className="bg-primary px-4 py-8 text-primary-foreground">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
            <User className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Mon Compte
          </h1>
          <p className="mt-2 text-white/80">
            Accédez à votre profil et historique de demandes
          </p>
        </div>
      </section>

      {/* Search Section */}
      <section className="px-4 py-8">
        <div className="mx-auto max-w-4xl">
          {!data && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Connexion par Carte Nationale</CardTitle>
                <CardDescription>
                  Entrez votre numéro de carte nationale d'identité pour accéder à votre profil
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Ex: CD-2025-XXXXXXXXX"
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      className="pl-10"
                      data-testid="input-national-id"
                    />
                  </div>
                  <Button type="submit" disabled={isLoading} data-testid="button-search-profile">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Rechercher"}
                  </Button>
                </form>

                {error && searchId && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>Aucun compte trouvé pour ce numéro</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {isLoading && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </CardContent>
            </Card>
          )}

          {data && (
            <>
              {/* User Header */}
              <Card className="mb-6">
                <CardContent className="flex items-center gap-4 p-6">
                  <Avatar className="h-16 w-16 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-xl text-primary">
                      {data.citizen.prenom.charAt(0)}{data.citizen.nom.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold" data-testid="text-user-fullname">
                      {data.citizen.prenom} {data.citizen.nom}
                    </h2>
                    <p className="text-muted-foreground">{data.citizen.postNom}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge className={getTrustLevelLabel(data.citizen.trustLevel).color}>
                        <Shield className="mr-1 h-3 w-3" />
                        Niveau {data.citizen.trustLevel}: {getTrustLevelLabel(data.citizen.trustLevel).label}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchId("");
                      setNationalId("");
                    }}
                  >
                    Déconnexion
                  </Button>
                </CardContent>
              </Card>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="profile" data-testid="tab-profile">
                    <User className="mr-2 h-4 w-4" />
                    Profil
                  </TabsTrigger>
                  <TabsTrigger value="requests" data-testid="tab-requests">
                    <FileText className="mr-2 h-4 w-4" />
                    Mes Dossiers
                  </TabsTrigger>
                  <TabsTrigger value="settings" data-testid="tab-settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Paramètres
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-6 space-y-6">
                  {/* Identity Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informations Personnelles</CardTitle>
                      <CardDescription>
                        Données issues de votre carte d'identité nationale
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-sm text-muted-foreground">Nom</label>
                          <p className="font-medium" data-testid="text-user-nom">{data.citizen.nom}</p>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Post-Nom</label>
                          <p className="font-medium">{data.citizen.postNom}</p>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Prénom</label>
                          <p className="font-medium">{data.citizen.prenom}</p>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">N° Carte Nationale</label>
                          <p className="font-mono font-medium">{data.citizen.nationalId}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contact Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Contact</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <label className="text-sm text-muted-foreground">Téléphone</label>
                          <p className="font-medium">{data.citizen.phoneNumber}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Trust Level */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Niveau de Confiance</CardTitle>
                      <CardDescription>
                        Votre niveau de vérification d'identité
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Indice de Confiance</span>
                          <span className="font-semibold">{data.citizen.confidenceIndex}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${data.citizen.confidenceIndex}%` }}
                          />
                        </div>
                        <div className="grid gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-success" />
                            <span>Numéro de téléphone vérifié</span>
                          </div>
                          {data.citizen.trustLevel >= 2 && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-success" />
                              <span>Carte d'identité vérifiée</span>
                            </div>
                          )}
                          {data.citizen.trustLevel < 3 && (
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-warning" />
                              <span className="text-muted-foreground">
                                Vérification biométrique non effectuée
                              </span>
                            </div>
                          )}
                        </div>
                        <Button variant="outline" className="w-full mt-4">
                          Améliorer mon niveau
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="requests" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Mes Dossiers</CardTitle>
                      <CardDescription>
                        Historique de vos demandes de documents ({data.requests.length} dossier{data.requests.length !== 1 ? "s" : ""})
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {data.requests.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                          <FileText className="mx-auto h-12 w-12 opacity-50" />
                          <p className="mt-4">Aucune demande en cours</p>
                          <Link href="/services">
                            <Button className="mt-4">Découvrir nos services</Button>
                          </Link>
                        </div>
                      ) : (
                        data.requests.map((request) => (
                          <Link
                            key={request.id}
                            href={`/suivi?code=${request.trackingCode}`}
                          >
                            <div
                              className="flex items-center justify-between rounded-lg border p-4 transition-colors hover-elevate cursor-pointer"
                              data-testid={`request-card-${request.id}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                  <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="font-medium">{request.service?.name || "Service"}</p>
                                  <p className="text-sm text-muted-foreground font-mono">
                                    {request.trackingCode}
                                  </p>
                                  <div className="mt-2 flex items-center gap-2">
                                    <StatusBadge status={request.status as any} size="sm" />
                                    <PaymentStatusBadge status={request.paymentStatus} />
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                          </Link>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="settings" className="mt-6 space-y-4">
                  <Card>
                    <CardContent className="p-0">
                      <button className="flex w-full items-center justify-between p-4 text-left transition-colors hover-elevate">
                        <div className="flex items-center gap-3">
                          <Bell className="h-5 w-5 text-muted-foreground" />
                          <span>Notifications</span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </button>
                      <div className="border-t" />
                      <button className="flex w-full items-center justify-between p-4 text-left transition-colors hover-elevate">
                        <div className="flex items-center gap-3">
                          <Shield className="h-5 w-5 text-muted-foreground" />
                          <span>Sécurité</span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </button>
                      <div className="border-t" />
                      <button
                        className="flex w-full items-center justify-between p-4 text-left text-destructive transition-colors hover-elevate"
                        onClick={() => {
                          setSearchId("");
                          setNationalId("");
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <LogOut className="h-5 w-5" />
                          <span>Déconnexion</span>
                        </div>
                      </button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
