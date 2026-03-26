import React from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Procedure, ProcedureField, ProcedureRequiredDoc } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
    ArrowLeft,
    Clock,
    Coins,
    Building2,
    CheckCircle2,
    FileCheck,
    AlertCircle,
    Loader2,
    ArrowRight,
    ShieldCheck,
    Info,
    TimerReset
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ProcedureDetailResponse = Procedure & {
    fields: ProcedureField[];
    requiredDocuments: ProcedureRequiredDoc[];
};

export default function ProcedureDetail() {
    const [, params] = useRoute("/procedure/:slug");
    const [, setLocation] = useLocation();
    const { user } = useAuth();
    const { toast } = useToast();

    const { data: procedure, isLoading: loadingProc } = useQuery<ProcedureDetailResponse>({
        queryKey: [`/api/procedures/${params?.slug}`],
    });

    const isComingSoon = procedure?.status === "coming_soon";
    const fields = procedure?.fields ?? [];
    const requiredDocs = procedure?.requiredDocuments ?? [];

    const startMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/applications", { procedureId: procedure?.id });
            return await res.json();
        },
        onSuccess: (data) => {
            toast({ title: "Démarche initiée", description: "Vous pouvez maintenant remplir votre dossier." });
            setLocation(`/application/${data.id}`);
        },
        onError: (error: Error) => {
            if (error.message.includes("401")) {
                toast({ title: "Session expirée", description: "Veuillez vous reconnecter.", variant: "destructive" });
                setLocation("/auth");
            } else {
                toast({ title: "Erreur", description: error.message, variant: "destructive" });
            }
        },
    });

    if (loadingProc) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!procedure) return <div>Procédure introuvable</div>;

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Hero Header */}
            <div className="bg-primary text-white py-12 md:py-16">
                <div className="max-w-5xl mx-auto px-4">
                    <Link href="/catalogue">
                        <button className="flex items-center gap-2 text-primary-foreground/80 hover:text-white transition-colors mb-8 font-bold text-sm">
                            <ArrowLeft className="h-4 w-4" />
                            Retour au catalogue
                        </button>
                    </Link>

                    <div className="space-y-4">
                        <Badge className="bg-white/20 text-white hover:bg-white/30 border-none uppercase tracking-widest text-[10px] py-1">
                            {procedure.category}
                        </Badge>
                        {isComingSoon && (
                            <Badge className="bg-amber-400/20 text-amber-100 hover:bg-amber-400/30 border-none uppercase tracking-widest text-[10px] py-1 ml-2">
                                A venir
                            </Badge>
                        )}
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                            {procedure.title}
                        </h1>
                        <p className="text-primary-foreground/80 text-lg max-w-2xl leading-relaxed">
                            {procedure.description}
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 -mt-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Info Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <Card className="border-none shadow-sm">
                                <CardContent className="p-5 flex flex-col gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Délai moyen</span>
                                    <div className="flex items-center gap-2 text-slate-900 font-bold">
                                        <Clock className="h-4 w-4 text-primary" />
                                        {procedure.estimatedDays} jours ouvrés
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-none shadow-sm">
                                <CardContent className="p-5 flex flex-col gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Coût total</span>
                                    <div className="flex items-center gap-2 text-slate-900 font-bold">
                                        <Coins className="h-4 w-4 text-amber-500" />
                                        {procedure.cost.toLocaleString("fr-FR")} CDF
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-none shadow-sm col-span-2 md:col-span-1">
                                <CardContent className="p-5 flex flex-col gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Institution</span>
                                    <div className="flex items-start gap-2 text-slate-900 font-bold min-w-0">
                                        <Building2 className="h-4 w-4 text-slate-400 shrink-0 mt-1" />
                                        <span className="break-words leading-snug">{procedure.institution}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Requirements Section */}
                        <div className="space-y-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                            <div className="flex items-center gap-3 border-b pb-4">
                                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                    <FileCheck className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Pièces à fournir</h2>
                                    <p className="text-sm text-slate-500">Préparez ces documents avant de commencer.</p>
                                </div>
                            </div>

                            {loadingProc ? (
                                <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-200" /></div>
                            ) : (
                                <ul className="space-y-4">
                                    {requiredDocs.map((doc) => (
                                        <li key={doc.id} className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                                            <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                                <CheckCircle2 className="h-4 w-4" />
                                            </div>
                                            <div className="space-y-1">
                                                <span className="font-bold text-slate-900 block">{doc.name}</span>
                                                {doc.description && <p className="text-sm text-slate-600 leading-relaxed">{doc.description}</p>}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Steps/Fields info */}
                        <div className="space-y-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                            <div className="flex items-center gap-3 border-b pb-4">
                                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <Info className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Informations demandées</h2>
                                    <p className="text-sm text-slate-500">Vous devrez renseigner les éléments suivants.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {fields.map((field) => (
                                    <div key={field.id} className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-slate-200">
                                        <div className="h-2 w-2 rounded-full bg-indigo-400" />
                                        <span className="text-sm font-medium text-slate-700">{field.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sticky Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-28 space-y-6">
                            <Card className="border-none shadow-xl shadow-primary/10 overflow-hidden bg-white">
                                <div className="h-2 bg-primary" />
                                <CardContent className="p-8 space-y-6 text-center">
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black text-slate-900">Prêt à commencer ?</h3>
                                        <p className="text-sm text-slate-500">
                                            L'initiation de votre dossier est gratuite. Les frais ne seront exigés qu'à l'étape finale.
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <Button
                                            className="w-full h-14 text-lg font-bold gap-3 rounded-2xl shadow-lg shadow-primary/20"
                                            size="lg"
                                            onClick={() => user ? startMutation.mutate() : setLocation("/auth")}
                                            disabled={startMutation.isPending || isComingSoon}
                                        >
                                            {startMutation.isPending ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : isComingSoon ? (
                                                "Service bientot disponible"
                                            ) : (
                                                "Initier ma demande"
                                            )}
                                            {!startMutation.isPending && (isComingSoon ? <TimerReset className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />)}
                                        </Button>
                                        <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                                            <ShieldCheck className="h-3.5 w-3.5" /> Sécurisé par le Gouvernement
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className={`p-6 rounded-2xl border space-y-3 ${isComingSoon ? "bg-amber-50 border-amber-100" : "bg-blue-50 border-blue-100"}`}>
                                <div className={`flex items-center gap-2 font-bold text-sm ${isComingSoon ? "text-amber-700" : "text-blue-700"}`}>
                                    <AlertCircle className="h-4 w-4" />
                                    {isComingSoon ? "Disponibilite" : "Note importante"}
                                </div>
                                <p className={`text-xs leading-relaxed font-medium ${isComingSoon ? "text-amber-700" : "text-blue-600"}`}>
                                    {isComingSoon
                                        ? "Cette demarche fait partie des services prioritaires planifies. Elle reste visible pour information mais l'ouverture en ligne arrivera dans une prochaine phase."
                                        : "Assurez-vous d'avoir numerise vos documents originaux en haute qualite (format PDF de preference) pour eviter tout rejet de la part des agents."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
