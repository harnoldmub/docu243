import React, { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
    Application,
    Procedure,
    ProcedureField,
    ProcedureRequiredDoc,
    ApplicationFieldValue,
    ApplicationDocument,
    ActivityLog
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Stepper } from "@/components/stepper";
import { DocUploader } from "@/components/doc-uploader";
import { Timeline } from "@/components/timeline";
import { DocumentStatusBadge, StatusBadge } from "@/components/status-badge";
import {
    ArrowLeft,
    ArrowRight,
    Save,
    Send,
    CreditCard,
    ShieldCheck,
    CheckCircle2,
    Loader2,
    AlertCircle,
    Clock,
    FileText,
    Building2,
    Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";

export default function ApplicationDetail() {
    const [, params] = useRoute("/application/:id");
    const [, setLocation] = useLocation();
    const { user } = useAuth();
    const { toast } = useToast();
    const isAgentReviewer = ["agent", "admin", "super_admin"].includes(user?.role ?? "");

    const { data: dossier, isLoading: loadingDossier } = useQuery<any>({
        queryKey: [`/api/applications/${params?.id}`],
    });

    const [activeStep, setActiveStep] = useState(0);

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("PATCH", `/api/applications/${params?.id}`, data);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/applications/${params?.id}`] });
            toast({ title: "Succès", description: "Vos modifications ont été enregistrées." });
        },
    });

    const uploadMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("POST", `/api/applications/${params?.id}/documents`, data);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/applications/${params?.id}`] });
            toast({ title: "Document ajouté", description: "Votre document a été téléchargé avec succès." });
        },
    });

    const adminStatusMutation = useMutation({
        mutationFn: async (status: string) => {
            const res = await apiRequest("PATCH", `/api/admin/applications/${params?.id}/status`, { status });
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/applications/${params?.id}`] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
            toast({ title: "Traitement enregistré", description: "Le statut du dossier a bien été mis à jour." });
        },
    });

    const validateDocumentMutation = useMutation({
        mutationFn: async ({ docId, status, feedback }: { docId: string; status: string; feedback?: string }) => {
            const res = await apiRequest("PATCH", `/api/admin/documents/${docId}/validate`, { status, feedback });
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/applications/${params?.id}`] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
            toast({ title: "Document mis à jour", description: "La décision de contrôle a bien été enregistrée." });
        },
    });

    if (loadingDossier) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );

    if (!dossier) return <div>Dossier introuvable</div>;

    const isDraft = dossier.status === "draft" || dossier.status === "pending_user_action";
    const procedureFields = dossier.procedure?.fields ?? [];
    const requiredDocs = dossier.procedure?.requiredDocuments ?? [];
    const fieldValueMap = new Map<string, string>(
        (dossier.fieldValues ?? []).map((fieldValue: any) => [fieldValue.fieldId, String(fieldValue.value ?? "")]),
    );
    const steps = [
        { title: "Informations", description: "Détails personnels" },
        { title: "Documents", description: "Pièces justificatives" },
        { title: "Paiement", description: "Frais administratifs" },
        { title: "Soumission", description: "Validation finale" },
    ];

    const handleFieldChange = (fieldId: string, value: string) => {
        const currentValues = dossier.fieldValues || [];
        const existingIndex = currentValues.findIndex((v: any) => v.fieldId === fieldId);

        let newValues;
        if (existingIndex >= 0) {
            newValues = [...currentValues];
            newValues[existingIndex] = { ...newValues[existingIndex], value };
        } else {
            newValues = [...currentValues, { fieldId, value }];
        }

        updateMutation.mutate({ fieldValues: newValues });
    };

    const submitDossier = () => {
        updateMutation.mutate({ status: "submitted" }, {
            onSuccess: () => {
                toast({ title: "Dossier soumis !", description: "Votre demande est maintenant en cours de traitement." });
                setActiveStep(3);
            }
        });
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Dynamic Header */}
            <div className="bg-white border-b py-6 sticky top-0 z-40 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={isAgentReviewer ? "/admin" : "/dashboard"}>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-black text-slate-900">{dossier.procedure?.title}</h1>
                                <StatusBadge status={dossier.status} size="sm" />
                            </div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">
                                Dossier #{dossier.id.slice(0, 8)} • {dossier.procedure?.institution}
                            </p>
                            {isAgentReviewer && dossier.user && (
                                <p className="mt-1 text-sm font-semibold text-slate-500">
                                    Citoyen: {dossier.user.prenom} {dossier.user.nom}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="hidden md:block w-96">
                        <Stepper steps={steps} currentStep={!isAgentReviewer && isDraft ? activeStep : 3} />
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 pt-8 md:pt-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Workspace */}
                    <div className="lg:col-span-2 space-y-8">
                        {!isAgentReviewer && isDraft ? (
                            <>
                                {activeStep === 0 && (
                                    <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                                        <CardHeader className="p-8 pb-4">
                                            <CardTitle className="text-2xl">Informations requises</CardTitle>
                                            <CardDescription>Veuillez remplir les informations nécessaires pour votre demande.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-8 pt-4 space-y-6">
                                            {procedureFields.map((field: any) => (
                                                <div key={field.id} className="space-y-2">
                                                    <Label className="text-sm font-bold text-slate-700">{field.label}</Label>
                                                    {field.type === "select" && Array.isArray(field.options) ? (
                                                        <Select
                                                            defaultValue={dossier.fieldValues?.find((v: any) => v.fieldId === field.id)?.value}
                                                            onValueChange={(value) => handleFieldChange(field.id, value)}
                                                        >
                                                            <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:ring-primary/20">
                                                                <SelectValue placeholder={`Choisissez ${field.label.toLowerCase()}...`} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {field.options.map((option: string) => (
                                                                    <SelectItem key={option} value={option}>
                                                                        {option}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : field.type === "textarea" ? (
                                                        <Textarea
                                                            className="min-h-28 rounded-xl bg-slate-50 border-slate-100 focus:bg-white"
                                                            placeholder={`Entrez votre ${field.label.toLowerCase()}...`}
                                                            defaultValue={dossier.fieldValues?.find((v: any) => v.fieldId === field.id)?.value}
                                                            onBlur={(e) => handleFieldChange(field.id, e.target.value)}
                                                        />
                                                    ) : (
                                                        <Input
                                                            type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                                                            className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white"
                                                            placeholder={field.type === "date" ? undefined : `Entrez votre ${field.label.toLowerCase()}...`}
                                                            defaultValue={dossier.fieldValues?.find((v: any) => v.fieldId === field.id)?.value}
                                                            onBlur={(e) => handleFieldChange(field.id, e.target.value)}
                                                        />
                                                    )}
                                                    {field.description && <p className="text-[11px] text-slate-400 font-medium italic">{field.description}</p>}
                                                </div>
                                            ))}
                                            <div className="pt-4 flex justify-end">
                                                <Button
                                                    className="rounded-2xl h-14 px-8 font-bold gap-2"
                                                    onClick={() => setActiveStep(1)}
                                                >
                                                    Continuer
                                                    <ArrowRight className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {activeStep === 1 && (
                                    <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                                        <CardHeader className="p-8 pb-4">
                                            <CardTitle className="text-2xl">Pièces justificatives</CardTitle>
                                            <CardDescription>Téléchargez les documents requis pour valider votre identité et vos droits.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-8 pt-4 space-y-8">
                                            {requiredDocs.map((reqDoc: any) => {
                                                const existingDoc = dossier.documents?.find((d: any) => d.requiredDocId === reqDoc.id);
                                                return (
                                                    <DocUploader
                                                        key={reqDoc.id}
                                                        label={reqDoc.name}
                                                        description={reqDoc.description}
                                                        status={existingDoc?.status}
                                                        rejectionReason={existingDoc?.rejectionReason}
                                                        fileUrl={existingDoc?.fileUrl}
                                                        fileName={existingDoc?.originalName}
                                                        onUpload={async (file) => {
                                                            // Step 1: Upload the binary file to get a permanent URL
                                                            const formData = new FormData();
                                                            formData.append("file", file);
                                                            const uploadRes = await fetch(`/api/applications/${params?.id}/upload`, {
                                                                method: "POST",
                                                                body: formData,
                                                                credentials: "include",
                                                            });
                                                            if (!uploadRes.ok) {
                                                                const err = await uploadRes.json().catch(() => ({ error: "Erreur d'envoi" }));
                                                                throw new Error(err.error || "Erreur lors de l'upload");
                                                            }
                                                            const { fileUrl, originalName } = await uploadRes.json();
                                                            // Step 2: Register the document link in the application
                                                            await uploadMutation.mutateAsync({
                                                                requiredDocId: reqDoc.id,
                                                                fileUrl,
                                                                originalName: originalName || file.name,
                                                                mimeType: file.type,
                                                                size: file.size
                                                            });
                                                        }}
                                                    />
                                                );
                                            })}
                                            <div className="pt-4 flex justify-between">
                                                <Button variant="ghost" className="font-bold" onClick={() => setActiveStep(0)}>Retour</Button>
                                                <Button
                                                    className="rounded-2xl h-14 px-8 font-bold gap-2"
                                                    onClick={() => setActiveStep(2)}
                                                >
                                                    Passer au paiement
                                                    <CreditCard className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {activeStep === 2 && (
                                    <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                                        <CardHeader className="p-8 pb-4">
                                            <CardTitle className="text-2xl">Frais administratifs</CardTitle>
                                            <CardDescription>Réglez les frais officiels via nos partenaires de paiement sécurisés.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-8 pt-4 space-y-8">
                                            <div className="p-8 bg-slate-50 rounded-3xl border text-center space-y-4">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant à payer</span>
                                                <div className="text-5xl font-black text-slate-900">
                                                    {dossier.procedure?.cost.toLocaleString("fr-FR")} <span className="text-xl text-primary font-bold">CDF</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <button className="border-2 border-slate-100 p-6 rounded-2xl flex flex-col items-center gap-3 hover:border-primary hover:bg-primary/5 transition-all text-center group">
                                                    <div className="h-12 w-24 bg-rose-100 rounded-lg flex items-center justify-center text-rose-600 font-black text-xs italic">Airtel Money</div>
                                                    <span className="text-xs font-bold text-slate-600">Payer avec Airtel</span>
                                                </button>
                                                <button className="border-2 border-slate-100 p-6 rounded-2xl flex flex-col items-center gap-3 hover:border-primary hover:bg-primary/5 transition-all text-center group">
                                                    <div className="h-12 w-24 bg-primary rounded-lg flex items-center justify-center text-white font-black text-xs italic">M-Pesa</div>
                                                    <span className="text-xs font-bold text-slate-600">Payer avec Vodacom</span>
                                                </button>
                                            </div>

                                            <div className="pt-4 flex justify-between">
                                                <Button variant="ghost" className="font-bold" onClick={() => setActiveStep(1)}>Retour</Button>
                                                <Button
                                                    className="rounded-2xl h-14 px-8 font-bold gap-2 bg-emerald-600 hover:bg-emerald-700"
                                                    onClick={() => setActiveStep(3)}
                                                >
                                                    Simuler le succès du paiement
                                                    <CheckCircle2 className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {activeStep === 3 && (
                                    <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                                        <CardHeader className="p-8 pb-4">
                                            <CardTitle className="text-2xl">Soumission du dossier</CardTitle>
                                            <CardDescription>Veuillez vérifier vos informations une dernière fois.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-8 pt-4 space-y-8">
                                            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex gap-4">
                                                <ShieldCheck className="h-6 w-6 text-blue-600 shrink-0" />
                                                <div className="space-y-2">
                                                    <p className="text-sm font-bold text-blue-900 leading-relaxed">
                                                        Je certifie sur l'honneur que tous les renseignements fournis et tous les documents téléchargés sont authentiques.
                                                    </p>
                                                    <p className="text-xs text-blue-700 font-medium">
                                                        Toute fausse déclaration peut entraîner le rejet définitif de votre demande et des poursuites judiciaires.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="pt-4 flex flex-col gap-4">
                                                <Button
                                                    className="rounded-2xl h-16 text-lg font-black gap-2 shadow-xl shadow-primary/20"
                                                    size="lg"
                                                    onClick={submitDossier}
                                                    disabled={updateMutation.isPending}
                                                >
                                                    {updateMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Send className="h-5 w-5" /> Soumettre mon dossier</>}
                                                </Button>
                                                <Button variant="ghost" className="font-bold h-12" onClick={() => setActiveStep(2)}>Retour au paiement</Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </>
                        ) : (
                            <div className="space-y-8">
                                {isAgentReviewer && (
                                    <>
                                        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                                            <CardHeader className="p-8 pb-4">
                                                <CardTitle className="text-2xl">Contrôle du dossier</CardTitle>
                                                <CardDescription>Vérifiez les informations fournies, les pièces jointes et appliquez une décision administrative cohérente.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-8 pt-4">
                                                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                                    <Button
                                                        className="rounded-2xl font-bold"
                                                        variant={dossier.status === "under_review" ? "default" : "outline"}
                                                        onClick={() => adminStatusMutation.mutate("under_review")}
                                                        disabled={adminStatusMutation.isPending}
                                                    >
                                                        Prendre en charge
                                                    </Button>
                                                    <Button
                                                        className="rounded-2xl font-bold"
                                                        variant="outline"
                                                        onClick={() => adminStatusMutation.mutate("pending_user_action")}
                                                        disabled={adminStatusMutation.isPending}
                                                    >
                                                        Demander correction
                                                    </Button>
                                                    <Button
                                                        className="rounded-2xl font-bold"
                                                        variant="outline"
                                                        onClick={() => adminStatusMutation.mutate("approved")}
                                                        disabled={adminStatusMutation.isPending}
                                                    >
                                                        Approuver
                                                    </Button>
                                                    <Button
                                                        className="rounded-2xl font-bold"
                                                        variant="outline"
                                                        onClick={() => adminStatusMutation.mutate("ready")}
                                                        disabled={adminStatusMutation.isPending}
                                                    >
                                                        Marquer prêt
                                                    </Button>
                                                    <Button
                                                        className="rounded-2xl font-bold"
                                                        variant="outline"
                                                        onClick={() => adminStatusMutation.mutate("delivered")}
                                                        disabled={adminStatusMutation.isPending}
                                                    >
                                                        Marquer délivré
                                                    </Button>
                                                    <Button
                                                        className="rounded-2xl font-bold border-rose-200 text-rose-600 hover:bg-rose-50"
                                                        variant="outline"
                                                        onClick={() => adminStatusMutation.mutate("rejected")}
                                                        disabled={adminStatusMutation.isPending}
                                                    >
                                                        Rejeter
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                                            <CardHeader className="p-8 pb-4">
                                                <CardTitle className="text-2xl">Informations déclarées</CardTitle>
                                                <CardDescription>Contenu transmis par le citoyen pour cette procédure.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-8 pt-4">
                                                {procedureFields.length === 0 ? (
                                                    <p className="text-sm text-slate-500">Aucun champ n'est configuré pour cette procédure.</p>
                                                ) : (
                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        {procedureFields.map((field: any) => (
                                                            <div key={field.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                                                <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">{field.label}</div>
                                                                <div className="mt-2 text-sm font-semibold text-slate-800">
                                                                    {fieldValueMap.get(field.id) || "Non renseigné"}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </>
                                )}

                                {/* Status Block */}
                                <Card className={cn(
                                    "border-none shadow-sm rounded-3xl overflow-hidden text-center p-12 space-y-6",
                                    dossier.status === "under_review" ? "bg-indigo-50" :
                                        dossier.status === "approved" ? "bg-emerald-50" :
                                            dossier.status === "ready" || dossier.status === "delivered" ? "bg-emerald-600 text-white" : "bg-white"
                                )}>
                                    <div className={cn(
                                        "h-20 w-20 rounded-full flex items-center justify-center mx-auto shadow-lg",
                                        dossier.status === "ready" || dossier.status === "delivered" ? "bg-white text-emerald-600" : "bg-white text-primary"
                                    )}>
                                        {dossier.status === "under_review" ? <Clock className="h-10 w-10" /> :
                                            dossier.status === "ready" || dossier.status === "delivered" ? <CheckCircle2 className="h-10 w-10 animate-pulse" /> : <Lock className="h-10 w-10" />}
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-black">
                                            {dossier.status === "submitted" ? "Dossier en attente" :
                                                dossier.status === "under_review" ? "Examen en cours" :
                                                    dossier.status === "approved" ? "Dossier approuvé" :
                                                        dossier.status === "ready" ? "Document prêt !" :
                                                            dossier.status === "delivered" ? "Document délivré" :
                                                                dossier.status === "rejected" ? "Dossier rejeté" : "Action requise"}
                                        </h2>
                                        <p className={cn("max-w-md mx-auto text-sm font-medium leading-relaxed", dossier.status === "ready" || dossier.status === "delivered" ? "text-white/80" : "text-slate-500")}>
                                            {dossier.status === "submitted" ? "Votre dossier a été bien reçu. Un agent administratif va bientôt l'analyser." :
                                                dossier.status === "under_review" ? "Nos services vérifient actuellement la conformité de vos pièces justificatives." :
                                                    dossier.status === "approved" ? "Le dossier est validé sur le fond et attend la mise à disposition finale du document." :
                                                        dossier.status === "ready" ? "Félicitations ! Votre document officiel est prêt. Vous pouvez le retirer au bureau muni de votre pièce d'identité." :
                                                            dossier.status === "delivered" ? "Le dossier a été clôturé après délivrance du document." :
                                                                dossier.status === "rejected" ? "Le dossier a été rejeté après instruction administrative." :
                                                                    "Veuillez vérifier les instructions transmises par l'agent ci-dessous."}
                                        </p>
                                    </div>
                                </Card>

                                {/* Tracking Documents Summary */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Documents et État</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        {requiredDocs.map((reqDoc: any) => {
                                            const doc = dossier.documents?.find((d: any) => d.requiredDocId === reqDoc.id);
                                            return (
                                                <div key={reqDoc.id} className="bg-white p-4 rounded-2xl border border-slate-100">
                                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                                                <FileText className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-slate-700">{reqDoc.name}</div>
                                                                <div className="text-xs text-slate-500">{reqDoc.description}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            {doc ? (
                                                                <>
                                                                    <DocumentStatusBadge status={doc.status} />
                                                                    <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary hover:underline">
                                                                        Ouvrir le document
                                                                    </a>
                                                                    {isAgentReviewer && (
                                                                        <>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                className="rounded-xl"
                                                                                onClick={() => validateDocumentMutation.mutate({ docId: doc.id, status: "approved" })}
                                                                                disabled={validateDocumentMutation.isPending}
                                                                            >
                                                                                Valider
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50"
                                                                                onClick={() => validateDocumentMutation.mutate({ docId: doc.id, status: "replacement_requested", feedback: "Merci de fournir une version plus nette ou complete." })}
                                                                                disabled={validateDocumentMutation.isPending}
                                                                            >
                                                                                Demander un remplacement
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50"
                                                                                onClick={() => validateDocumentMutation.mutate({ docId: doc.id, status: "rejected", feedback: "Piece rejetee apres verification." })}
                                                                                disabled={validateDocumentMutation.isPending}
                                                                            >
                                                                                Rejeter
                                                                            </Button>
                                                                        </>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <span className="text-xs font-bold text-slate-400">Aucun document transmis</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar: Timeline & Info */}
                    <div className="lg:col-span-1 space-y-8">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            Historique
                        </h2>

                        <Timeline
                            events={dossier.activityLogs || []}
                            citizenId={dossier.userId}
                            currentUserId={user?.id}
                        />

                        <div className="p-6 bg-white rounded-3xl border border-slate-100 space-y-4 text-center">
                            <Building2 className="h-10 w-10 mx-auto text-slate-300" />
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Institution Responsable</span>
                                <p className="text-sm font-bold text-slate-700"> {dossier.procedure?.institution}</p>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium">
                                Pour toute question technique liée à cette démarche, veuillez contacter le support gouvernemental.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
