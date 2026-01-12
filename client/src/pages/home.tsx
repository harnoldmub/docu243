import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  FileText, 
  CreditCard, 
  Shield, 
  Clock, 
  CheckCircle,
  ChevronRight,
  Users,
  Building2,
  Heart,
  GraduationCap,
  ArrowRight,
  Car,
  Home as HomeIcon,
  Briefcase
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Service } from "@shared/schema";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Users,
  Heart,
  GraduationCap,
  Car,
  Home: HomeIcon,
  Briefcase,
  Building2,
};

const stats = [
  { value: "2M+", label: "Citoyens inscrits" },
  { value: "500K+", label: "Documents délivrés" },
  { value: "26", label: "Provinces couvertes" },
  { value: "99.9%", label: "Disponibilité" },
];

export default function Home() {
  const [trackingCode, setTrackingCode] = useState("");
  const [, setLocation] = useLocation();

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const popularServices = services.slice(0, 4);

  const handleTrackingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingCode.trim()) {
      setLocation(`/suivi?code=${encodeURIComponent(trackingCode.trim())}`);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary px-4 py-16 text-primary-foreground md:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-congo-darkBlue/80 to-primary/90" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur">
                <Shield className="h-4 w-4" />
                <span>Plateforme Officielle de la RDC</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                Vos documents administratifs, simplifiés
              </h1>
              <p className="text-lg text-white/80 md:text-xl">
                DOCU243 est la plateforme nationale qui modernise l'accès aux services 
                administratifs en République Démocratique du Congo. Demandez, payez et 
                suivez vos documents en ligne.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/services">
                  <Button size="lg" variant="secondary" className="gap-2" data-testid="button-hero-services">
                    Voir les Services
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/suivi">
                  <Button size="lg" variant="outline" className="gap-2 border-white/30 bg-white/10 backdrop-blur" data-testid="button-hero-track">
                    Suivre mon Dossier
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Tracking Form */}
            <div className="flex items-center justify-center">
              <Card className="w-full max-w-md border-0 bg-white/10 backdrop-blur">
                <CardHeader className="pb-4">
                  <h2 className="text-xl font-semibold text-white">Suivi Rapide</h2>
                  <p className="text-sm text-white/70">
                    Entrez votre code de suivi pour connaître l'état de votre dossier
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleTrackingSubmit} className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50" />
                      <Input
                        placeholder="Ex: DOC-2024-XXXXX"
                        value={trackingCode}
                        onChange={(e) => setTrackingCode(e.target.value)}
                        className="h-12 border-white/20 bg-white/10 pl-10 text-white placeholder:text-white/50"
                        data-testid="input-tracking-code"
                      />
                    </div>
                    <Button type="submit" className="w-full" size="lg" data-testid="button-track-submit">
                      Rechercher
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b bg-card px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-primary md:text-4xl" data-testid={`stat-${stat.label}`}>
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Services */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Services les Plus Demandés</h2>
            <p className="mt-2 text-muted-foreground">
              Accédez rapidement aux documents administratifs essentiels
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {popularServices.map((service) => {
              const Icon = iconMap[service.icon] || FileText;
              return (
                <Link key={service.id} href={`/demande?serviceId=${service.id}`}>
                  <Card 
                    className="group cursor-pointer overflow-visible transition-all hover-elevate"
                    data-testid={`card-popular-${service.id}`}
                  >
                    <CardContent className="flex flex-col items-center p-6 text-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="h-7 w-7" />
                      </div>
                      <h3 className="font-semibold">{service.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{service.description}</p>
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{service.processingTimeDays} jours</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
          <div className="mt-8 text-center">
            <Link href="/services">
              <Button variant="outline" size="lg" className="gap-2" data-testid="button-view-all-services">
                Voir Tous les Services
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/50 px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Comment Ça Marche</h2>
            <p className="mt-2 text-muted-foreground">
              Un processus simple et transparent en 4 étapes
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-4">
            {[
              {
                step: 1,
                icon: FileText,
                title: "Choisir un Service",
                description: "Parcourez notre catalogue de services administratifs",
              },
              {
                step: 2,
                icon: CreditCard,
                title: "Payer en Ligne",
                description: "Payez facilement via Mobile Money (M-Pesa, Airtel, Orange)",
              },
              {
                step: 3,
                icon: Clock,
                title: "Suivre le Dossier",
                description: "Suivez l'avancement de votre demande en temps réel",
              },
              {
                step: 4,
                icon: CheckCircle,
                title: "Recevoir le Document",
                description: "Retirez ou recevez votre document officiel",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="relative text-center">
                  <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Icon className="h-8 w-8" />
                  </div>
                  <div className="absolute -right-4 top-8 hidden text-4xl font-bold text-muted md:block">
                    {item.step < 4 ? "→" : ""}
                  </div>
                  <h3 className="mb-2 font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="border-0 bg-primary/5">
              <CardContent className="flex items-start gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Sécurisé</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Vos données sont protégées selon les standards internationaux (TLS 1.3, AES-256)
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-success/5">
              <CardContent className="flex items-start gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Officiel</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Plateforme officielle du gouvernement de la RDC
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-warning/5">
              <CardContent className="flex items-start gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Accessible</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Disponible dans les 26 provinces via web, mobile et USSD
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
