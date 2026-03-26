import React from "react";
import { Link } from "wouter";
import {
    ArrowRight,
    Clock,
    Coins,
    Building2,
    Briefcase,
    User,
    Heart,
    Home,
    FileText,
    ShieldCheck,
    BadgeCheck,
    TimerReset
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProcedureCardProps {
    id: string;
    title: string;
    slug: string;
    description: string;
    category: string;
    institution: string;
    estimatedDays: number;
    cost: number;
    status?: "available" | "coming_soon";
    icon?: string;
    className?: string;
}

const iconMap: Record<string, any> = {
    FileText: FileText,
    User: User,
    Heart: Heart,
    Home: Home,
    Briefcase: Briefcase,
    Shield: ShieldCheck,
    Building: Building2,
    BadgeCheck: BadgeCheck,
};

export function ProcedureCard({
    title,
    slug,
    description,
    category,
    institution,
    estimatedDays,
    cost,
    status = "available",
    icon = "FileText",
    className,
}: ProcedureCardProps) {
    const Icon = iconMap[icon] || FileText;
    const isComingSoon = status === "coming_soon";

    return (
        <Card className={cn("group overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border border-slate-100", isComingSoon && "border-amber-200/80", className)}>
            <CardHeader className="p-0">
                <div className={cn("h-2 bg-primary/80 transition-all group-hover:bg-primary", isComingSoon && "bg-amber-400 group-hover:bg-amber-500")} />
                <div className="p-6 pb-0">
                    <div className="flex items-start justify-between mb-4">
                        <div className={cn("h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-white", isComingSoon && "bg-amber-100 text-amber-700 group-hover:bg-amber-500")}>
                            <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex items-center gap-2">
                            {isComingSoon && (
                                <Badge variant="secondary" className="bg-amber-100 text-amber-700 font-semibold uppercase tracking-wider text-[10px]">
                                    A venir
                                </Badge>
                            )}
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                                {category}
                            </Badge>
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">
                        {title}
                    </h3>
                    <p className="text-slate-500 text-sm mt-3 line-clamp-2 leading-relaxed">
                        {description}
                    </p>
                </div>
            </CardHeader>

            <CardContent className="p-6 pt-5">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Délai estimé</span>
                        <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-sm">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                            {estimatedDays} jours
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Frais de dossier</span>
                        <div className="flex items-center gap-1.5 justify-end text-slate-900 font-bold text-sm">
                            <Coins className="h-3.5 w-3.5 text-amber-500" />
                            {cost.toLocaleString("fr-FR")} CDF
                        </div>
                    </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-50 flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <Building2 className="h-3.5 w-3.5 text-slate-300" />
                    {institution}
                </div>
            </CardContent>

            <CardFooter className="p-0">
                <Link href={`/procedure/${slug}`} className="w-full">
                    <button className={cn("w-full flex items-center justify-center gap-2 py-4 bg-slate-50 border-t border-slate-100 group-hover:bg-primary group-hover:text-white transition-all font-bold text-sm", isComingSoon && "bg-amber-50 text-amber-800 border-amber-100 group-hover:bg-amber-500")}>
                        {isComingSoon ? "Bientot disponible" : "Demarrer la demarche"}
                        {isComingSoon ? (
                            <TimerReset className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        ) : (
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        )}
                    </button>
                </Link>
            </CardFooter>
        </Card>
    );
}
