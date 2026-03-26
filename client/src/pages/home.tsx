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
  Briefcase,
  Smartphone,
  ShieldCheck,
  Globe,
  Zap
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Procedure } from "@shared/schema";
import { ProcedureCard } from "@/components/procedure-card";
import { cn } from "@/lib/utils";

const stats = [
  { value: "5M+", label: "Citoyens Enregistrés" },
  { value: "1.2M", label: "Dossiers Traités" },
  { value: "26", label: "Provinces" },
  { value: "100%", label: "Officiel" },
];

export default function Home() {
  const [trackingCode, setTrackingCode] = useState("");
  const [, setLocation] = useLocation();

  const { data: procedures = [] } = useQuery<Procedure[]>({
    queryKey: ["/api/procedures"],
  });

  const popularProcedures = [...procedures]
    .sort((a, b) => {
      if (a.status === b.status) return a.estimatedDays - b.estimatedDays;
      return a.status === "available" ? -1 : 1;
    })
    .slice(0, 3);

  const handleTrackingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingCode.trim()) {
      // For now redirect to catalogue or dashboard since tracking code is simplified
      setLocation(`/catalogue?q=${encodeURIComponent(trackingCode.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 pt-20 pb-32 md:pt-32 md:pb-48">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-4 text-center lg:text-left">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-7 space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 border border-primary/30 px-4 py-1.5 text-xs font-bold text-primary tracking-widest uppercase backdrop-blur animate-fade-in">
                <ShieldCheck className="h-4 w-4" />
                <span>Plateforme Nationale Officielle</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-[1.1]">
                L'Administration <span className="text-primary">Réinventée</span> pour vous.
              </h1>

              <p className="text-xl text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                DOCU243 est votre guichet unique pour toutes vos démarches administratives en RDC.
                Sûr, rapide et accessible partout.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link href="/catalogue">
                  <Button size="lg" className="h-16 px-10 rounded-2xl text-lg font-bold gap-3 shadow-xl shadow-primary/20 w-full sm:w-auto">
                    Explorer le Catalogue
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button size="lg" variant="outline" className="h-16 px-10 rounded-2xl text-lg font-bold border-white/10 text-white hover:bg-white/5 w-full sm:w-auto">
                    Créer mon Espace
                  </Button>
                </Link>
              </div>

              <div className="pt-8 flex items-center justify-center lg:justify-start gap-8 opacity-50 grayscale transition-all hover:grayscale-0">
                <img src="/flag.png" alt="RDC" className="h-6 w-auto object-contain" />
                <span className="text-white font-bold text-sm tracking-widest">MINISTÈRE DU NUMÉRIQUE</span>
              </div>
            </div>

            <div className="lg:col-span-5 hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 rounded-[40px] rotate-6 blur-2xl" />
                <Card className="relative border-none bg-white/5 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 shadow-2xl">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/80">Aperçu du service</div>
                        <div className="mt-1 text-lg font-bold text-white">Suivi d'un dossier</div>
                      </div>
                      <div className="flex gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-red-400" />
                        <div className="h-2 w-2 rounded-full bg-amber-400" />
                        <div className="h-2 w-2 rounded-full bg-emerald-400" />
                      </div>
                    </div>
                    <div className="rounded-3xl border border-primary/20 bg-primary/10 p-5 space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Référence</div>
                          <div className="mt-1 text-base font-bold text-white">DOCU_8F42AC</div>
                        </div>
                        <div className="rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-300">
                          En cours
                        </div>
                      </div>
                      <div className="text-sm text-slate-300 leading-relaxed">
                        Votre demande avance étape par étape, avec notification dès qu’une action est attendue.
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="rounded-2xl border border-primary/15 bg-white/5 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Étape</div>
                        <div className="mt-2 text-sm font-bold text-white">Documents reçus</div>
                        <div className="mt-1 text-xs text-slate-400">Pièces vérifiées en ligne</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Accès</div>
                        <div className="mt-2 text-sm font-bold text-white">Mobile et web</div>
                        <div className="mt-1 text-xs text-slate-400">Sans installation</div>
                      </div>
                    </div>
                    <Link href="/dashboard">
                      <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90">
                        Consulter mes dossiers
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Banner */}
      <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-10">
        <Card className="border-none shadow-2xl rounded-[32px] overflow-hidden bg-white">
          <div className="grid md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {stats.map((stat) => (
              <div key={stat.label} className="p-8 text-center space-y-1">
                <div className="text-3xl font-black text-slate-900">{stat.value}</div>
                <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Services Section */}
      <section className="py-24 md:py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
            <div className="space-y-4 max-w-xl">
              <h2 className="text-4xl font-black tracking-tight text-slate-900">Services Prioritaires</h2>
              <p className="text-lg text-slate-500 font-medium">
                Démarrez vos démarches les plus courantes directement en ligne sans file d'attente.
              </p>
            </div>
            <Link href="/catalogue">
              <Button variant="ghost" className="text-primary font-black gap-2 hover:bg-primary/5 px-6 h-12 rounded-xl">
                Tout le catalogue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {popularProcedures.map((proc) => (
              <ProcedureCard
                key={proc.id}
                id={proc.id}
                title={proc.title}
                slug={proc.slug}
                description={proc.description}
                category={proc.category}
                institution={proc.institution}
                estimatedDays={proc.estimatedDays}
                cost={proc.cost}
                status={proc.status as "available" | "coming_soon"}
                icon={proc.icon || "FileText"}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features - Institutional Grid */}
      <section className="bg-slate-50 py-24 md:py-32 px-4 overflow-hidden relative">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <h2 className="text-4xl font-black text-slate-900">Pourquoi utiliser DOCU243 ?</h2>
            <p className="text-slate-500 font-medium italic underline underline-offset-8 decoration-primary/30">
              La plateforme gouvernementale qui simplifie votre vie de citoyen.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: ShieldCheck,
                title: "Sécurité d'État",
                desc: "Vos informations sont chiffrées et stockées dans les centres de données nationaux sécurisés.",
                color: "bg-blue-600"
              },
              {
                icon: Zap,
                title: "Rapidité Digitale",
                desc: "Réduisez les délais de traitement jusqu'à 70% grâce à la numérisation complète des flux.",
                color: "bg-amber-500"
              },
              {
                icon: Globe,
                title: "Partout en RDC",
                desc: "Accédez aux services depuis votre province ou l'étranger, 24h/24 et 7j/7.",
                color: "bg-emerald-500"
              }
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <Card key={i} className="border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-3xl p-4 bg-white">
                  <CardContent className="pt-8 space-y-6">
                    <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center text-white shadow-lg", feature.color)}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-slate-900">{feature.title}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Lightweight Web Experience */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto bg-primary rounded-[40px] overflow-hidden relative">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 skew-x-12 translate-x-1/2" />
          <div className="grid md:grid-cols-2 items-center p-12 md:p-20 relative z-10 gap-12">
            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
                Un site web rapide, simple et accessible sur mobile.
              </h2>
              <p className="text-xl text-primary-foreground/70 leading-relaxed">
                Consultez vos démarches, déposez vos pièces et suivez vos dossiers depuis votre téléphone sans installer d'application.
                DOCU243 est pensé pour consommer peu de ressources et rester utilisable même sur des connexions modestes.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/auth">
                  <Button className="h-14 px-8 bg-white text-primary hover:bg-white/90 font-black rounded-xl">
                    Créer mon compte citoyen
                  </Button>
                </Link>
                <Link href="/catalogue">
                  <Button variant="outline" className="h-14 px-8 border-white/20 text-white hover:bg-white/10 font-black rounded-xl gap-2">
                    <Globe className="h-5 w-5" />
                    Ouvrir le site mobile
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex justify-center md:justify-end">
              <div className="relative w-full max-w-[22rem] rounded-[40px] border border-white/15 bg-slate-900/90 p-6 shadow-2xl">
                <div className="text-white text-center p-6 space-y-4">
                  <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-left">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Mode léger</div>
                      <div className="text-sm font-bold text-white">Accès mobile et web</div>
                    </div>
                    <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center">
                      <Globe className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="grid gap-3 pt-4 text-left">
                    <div className="rounded-2xl bg-white/5 p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Catalogue</div>
                      <div className="mt-2 text-sm font-bold">Démarches disponibles immédiatement</div>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Suivi</div>
                      <div className="mt-2 text-sm font-bold">Vos dossiers accessibles sur téléphone</div>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Performance</div>
                      <div className="mt-2 text-sm font-bold">Une expérience sobre, claire et rapide</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
