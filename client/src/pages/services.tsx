import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceCard, ServiceCardSkeleton } from "@/components/service-card";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Service } from "@shared/schema";

const categories = [
  { value: "all", label: "Tous" },
  { value: "etat-civil", label: "État Civil" },
  { value: "identite", label: "Identité" },
  { value: "education", label: "Éducation" },
  { value: "justice", label: "Justice" },
  { value: "transport", label: "Transport" },
  { value: "commerce", label: "Commerce" },
];

export default function Services() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const filteredServices = services
    ?.filter((service) => {
      const matchesSearch =
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || service.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "price") return a.price - b.price;
      if (sortBy === "time") return a.processingTimeDays - b.processingTimeDays;
      return 0;
    });

  const handleSelectService = (service: Service) => {
    setLocation(`/demande/${service.id}`);
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Header Section */}
      <section className="bg-primary px-4 py-12 text-primary-foreground">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Catalogue des Services
          </h1>
          <p className="mt-2 text-white/80">
            Explorez et demandez vos documents administratifs en ligne
          </p>

          {/* Search Bar */}
          <div className="mt-6 flex gap-3">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50" />
              <Input
                placeholder="Rechercher un service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 border-white/20 bg-white/10 pl-10 text-white placeholder:text-white/50"
                data-testid="input-search-services"
              />
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary" size="lg" className="gap-2 md:hidden">
                  <SlidersHorizontal className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto">
                <SheetHeader>
                  <SheetTitle>Filtres</SheetTitle>
                  <SheetDescription>Affinez votre recherche</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Catégorie</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger data-testid="select-category-mobile">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Trier par</label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger data-testid="select-sort-mobile">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Nom</SelectItem>
                        <SelectItem value="price">Prix</SelectItem>
                        <SelectItem value="time">Délai</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </section>

      {/* Filters & Content */}
      <section className="px-4 py-8">
        <div className="mx-auto max-w-7xl">
          {/* Desktop Filters */}
          <div className="mb-6 hidden items-center justify-between gap-4 md:flex">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="h-auto flex-wrap">
                {categories.map((cat) => (
                  <TabsTrigger
                    key={cat.value}
                    value={cat.value}
                    data-testid={`tab-category-${cat.value}`}
                  >
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40" data-testid="select-sort">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nom</SelectItem>
                  <SelectItem value="price">Prix</SelectItem>
                  <SelectItem value="time">Délai</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground" data-testid="text-results-count">
              {isLoading
                ? "Chargement..."
                : `${filteredServices?.length || 0} service(s) trouvé(s)`}
            </p>
          </div>

          {/* Services Grid */}
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ServiceCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredServices && filteredServices.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onSelect={handleSelectService}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Aucun service trouvé</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Essayez de modifier vos critères de recherche
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                data-testid="button-reset-filters"
              >
                Réinitialiser les filtres
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
