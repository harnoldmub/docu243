import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Procedure } from "@shared/schema";
import { ProcedureCard } from "@/components/procedure-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Search,
    Filter,
    LayoutGrid,
    List,
    Building2,
    Tag,
    Loader2,
    X,
    Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export default function Catalogue() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedInstitution, setSelectedInstitution] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const category = params.get("category");
        const search = params.get("q");

        if (category) setSelectedCategory(category);
        if (search) setSearchTerm(search);
    }, []);

    const { data: procedures, isLoading } = useQuery<Procedure[]>({
        queryKey: ["/api/procedures"],
    });

    const categories = Array.from(new Set(procedures?.map(p => p.category) || []));
    const institutions = Array.from(new Set(procedures?.map(p => p.institution) || []));

    const filteredProcedures = procedures?.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !selectedCategory || p.category === selectedCategory;
        const matchesInstitution = !selectedInstitution || p.institution === selectedInstitution;
        return matchesSearch && matchesCategory && matchesInstitution;
    });

    return (
        <div className="min-h-screen bg-slate-50/30">
            {/* Header Section */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                    <div className="max-w-2xl space-y-4">
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
                            Catalogue des Procédures
                        </h1>
                        <p className="text-slate-500 text-lg">
                            Trouvez et démarrez vos démarches administratives en quelques clics.
                            Simple, rapide et 100% officiel.
                        </p>
                    </div>

                    <div className="mt-8 flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                className="pl-10 h-12 bg-slate-100/50 border-slate-200 rounded-xl focus:bg-white transition-all shadow-sm"
                                placeholder="Rechercher une démarche (ex: Passeport, Acte de naissance...)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-12 border-slate-200 rounded-xl gap-2 font-bold px-6">
                                        <Tag className="h-4 w-4" />
                                        Catégorie
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>Toutes les catégories</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {categories.map(cat => (
                                        <DropdownMenuCheckboxItem
                                            key={cat}
                                            checked={selectedCategory === cat}
                                            onCheckedChange={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                                        >
                                            {cat}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-12 border-slate-200 rounded-xl gap-2 font-bold px-6">
                                        <Building2 className="h-4 w-4" />
                                        Institution
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>Toutes les institutions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {institutions.map(inst => (
                                        <DropdownMenuCheckboxItem
                                            key={inst}
                                            checked={selectedInstitution === inst}
                                            onCheckedChange={() => setSelectedInstitution(selectedInstitution === inst ? null : inst)}
                                        >
                                            {inst}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {(searchTerm || selectedCategory || selectedInstitution) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {searchTerm && (
                                <Badge variant="secondary" className="gap-1 px-3 py-1">
                                    Recherche : {searchTerm}
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm("")} />
                                </Badge>
                            )}
                            {selectedCategory && (
                                <Badge variant="secondary" className="gap-1 px-3 py-1 bg-primary/10 text-primary">
                                    Catégorie : {selectedCategory}
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategory(null)} />
                                </Badge>
                            )}
                            {selectedInstitution && (
                                <Badge variant="secondary" className="gap-1 px-3 py-1 bg-amber-100 text-amber-700">
                                    Institution : {selectedInstitution}
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedInstitution(null)} />
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Grid Section */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-slate-500 font-medium">Chargement des procédures...</p>
                    </div>
                ) : filteredProcedures?.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <Search className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Aucun résultat trouvé</h3>
                        <p className="text-slate-500 mt-2">Essayez d'ajuster vos filtres ou votre recherche.</p>
                        <Button
                            variant="ghost"
                            className="mt-4 font-bold text-primary"
                            onClick={() => { setSearchTerm(""); setSelectedCategory(null); setSelectedInstitution(null); }}
                        >
                            Réinitialiser tout
                        </Button>
                    </div>
                ) : (() => {
                    const isFiltered = !!searchTerm || !!selectedCategory || !!selectedInstitution;
                    const priorityProcs = filteredProcedures?.filter(p => p.isPriority) ?? [];
                    const otherProcs = filteredProcedures?.filter(p => !p.isPriority) ?? [];

                    const ProcGrid = ({ procs }: { procs: Procedure[] }) => (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {procs.map((proc) => (
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
                    );

                    if (isFiltered) {
                        return <ProcGrid procs={filteredProcedures ?? []} />;
                    }

                    return (
                        <div className="space-y-14">
                            {priorityProcs.length > 0 && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Star className="h-4 w-4 text-primary fill-primary/30" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black text-slate-900">Démarches prioritaires</h2>
                                            <p className="text-xs text-slate-500 font-medium">Les procédures les plus demandées par les citoyens</p>
                                        </div>
                                    </div>
                                    <ProcGrid procs={priorityProcs} />
                                </div>
                            )}
                            {otherProcs.length > 0 && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                            <Building2 className="h-4 w-4 text-slate-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black text-slate-900">Autres démarches</h2>
                                            <p className="text-xs text-slate-500 font-medium">Toutes les procédures administratives disponibles</p>
                                        </div>
                                    </div>
                                    <ProcGrid procs={otherProcs} />
                                </div>
                            )}
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}

// Shorthand for Badge since it was missing in imports
function Badge({ children, className, variant, ...props }: any) {
    return (
        <div
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-slate-100 text-slate-900",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
