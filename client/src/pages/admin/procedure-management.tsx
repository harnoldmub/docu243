import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FilePlus,
  Settings2,
  Trash2,
  Plus,
  Save,
  ArrowLeft,
  FileText,
  ListFilter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Procedure } from "@shared/schema";

type ProcedureDetailResponse = Procedure & {
  fields: Array<{
    id: string;
    label: string;
    type: string;
    required: boolean;
    options: string[] | null;
    order: number;
  }>;
  requiredDocuments: Array<{
    id: string;
    name: string;
    description: string;
    acceptedFormats: string[];
    maxSizeMb: number;
    required: boolean;
    order: number;
  }>;
};

type ProcedureForm = {
  title: string;
  description: string;
  category: string;
  institution: string;
  estimatedDays: number;
  cost: number;
  status: "available" | "coming_soon";
  isActive: boolean;
  icon: string;
};

const emptyProcedureForm: ProcedureForm = {
  title: "",
  description: "",
  category: "",
  institution: "",
  estimatedDays: 7,
  cost: 0,
  status: "coming_soon",
  isActive: true,
  icon: "FileText",
};

export default function ProcedureManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProcId, setSelectedProcId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [procedureForm, setProcedureForm] = useState<ProcedureForm>(emptyProcedureForm);
  const [createProcedureForm, setCreateProcedureForm] = useState<ProcedureForm>(emptyProcedureForm);
  const [createOpen, setCreateOpen] = useState(false);
  const [fieldOpen, setFieldOpen] = useState(false);
  const [docOpen, setDocOpen] = useState(false);
  const [newField, setNewField] = useState({ label: "", type: "text", required: true });
  const [newDoc, setNewDoc] = useState({
    name: "",
    description: "",
    acceptedFormats: "pdf,jpg,png",
    maxSizeMb: 5,
    required: true,
  });

  const { data: procedures, isLoading: loadingProcs } = useQuery<Procedure[]>({
    queryKey: ["/api/admin/procedures"],
  });

  const selectedProcedure = useMemo(
    () => procedures?.find((proc) => proc.id === selectedProcId),
    [procedures, selectedProcId],
  );

  const { data: procDetails, isLoading: loadingDetails } = useQuery<ProcedureDetailResponse>({
    queryKey: [`/api/procedures/${selectedProcedure?.slug}`],
    enabled: !!selectedProcedure?.slug,
  });

  useEffect(() => {
    if (!selectedProcId && procedures?.length) {
      setSelectedProcId(procedures[0].id);
    }
  }, [procedures, selectedProcId]);

  useEffect(() => {
    if (procDetails) {
      setProcedureForm({
        title: procDetails.title,
        description: procDetails.description,
        category: procDetails.category,
        institution: procDetails.institution,
        estimatedDays: procDetails.estimatedDays,
        cost: procDetails.cost,
        status: procDetails.status as "available" | "coming_soon",
        isActive: !!procDetails.isActive,
        icon: procDetails.icon || "FileText",
      });
    }
  }, [procDetails]);

  const filteredProcedures = useMemo(
    () =>
      (procedures ?? []).filter((proc) =>
        [proc.title, proc.institution, proc.category, proc.slug]
          .join(" ")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      ),
    [procedures, searchTerm],
  );

  const refetchAdminData = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/procedures"] });
    if (selectedProcedure?.slug) {
      queryClient.invalidateQueries({ queryKey: [`/api/procedures/${selectedProcedure.slug}`] });
    }
  };

  const createProcedureMutation = useMutation({
    mutationFn: async (payload: ProcedureForm) => {
      const res = await apiRequest("POST", "/api/admin/procedures", payload);
      return res.json();
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/procedures"] });
      toast({ title: "Procédure créée", description: "La nouvelle procédure est disponible dans l'admin." });
      setCreateOpen(false);
      setSelectedProcId(created.id);
      setCreateProcedureForm(emptyProcedureForm);
    },
    onError: (error: Error) => {
      toast({ title: "Création impossible", description: error.message, variant: "destructive" });
    },
  });

  const updateProcedureMutation = useMutation({
    mutationFn: async (payload: ProcedureForm) => {
      const res = await apiRequest("PATCH", `/api/admin/procedures/${selectedProcId}`, payload);
      return res.json();
    },
    onSuccess: () => {
      refetchAdminData();
      toast({ title: "Procédure mise à jour", description: "Les informations ont bien été enregistrées." });
    },
    onError: (error: Error) => {
      toast({ title: "Mise à jour impossible", description: error.message, variant: "destructive" });
    },
  });

  const addFieldMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/procedures/${selectedProcId}/fields`, newField);
      return res.json();
    },
    onSuccess: () => {
      refetchAdminData();
      setFieldOpen(false);
      setNewField({ label: "", type: "text", required: true });
      toast({ title: "Champ ajouté", description: "Le nouveau champ est disponible immédiatement." });
    },
  });

  const deleteFieldMutation = useMutation({
    mutationFn: async (fieldId: string) => {
      const res = await apiRequest("DELETE", `/api/admin/procedure-fields/${fieldId}`);
      return res.json();
    },
    onSuccess: () => {
      refetchAdminData();
      toast({ title: "Champ supprimé", description: "Le champ a été retiré de la procédure." });
    },
  });

  const addDocumentMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...newDoc,
        acceptedFormats: newDoc.acceptedFormats.split(",").map((item) => item.trim()).filter(Boolean),
      };
      const res = await apiRequest("POST", `/api/admin/procedures/${selectedProcId}/documents`, payload);
      return res.json();
    },
    onSuccess: () => {
      refetchAdminData();
      setDocOpen(false);
      setNewDoc({
        name: "",
        description: "",
        acceptedFormats: "pdf,jpg,png",
        maxSizeMb: 5,
        required: true,
      });
      toast({ title: "Document ajouté", description: "La liste des pièces a été mise à jour." });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (docId: string) => {
      const res = await apiRequest("DELETE", `/api/admin/procedure-documents/${docId}`);
      return res.json();
    },
    onSuccess: () => {
      refetchAdminData();
      toast({ title: "Document supprimé", description: "La pièce a été retirée de la procédure." });
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 flex items-center gap-2">
                <Settings2 className="h-4 w-4" /> Administration
              </div>
              <h1 className="text-2xl font-black text-slate-900">Configuration des Procédures</h1>
            </div>
          </div>
          <Button
            className="rounded-2xl h-12 px-6 font-bold gap-2 shadow-lg shadow-primary/20"
            onClick={() => {
              setCreateProcedureForm(emptyProcedureForm);
              setCreateOpen(true);
            }}
          >
            <Plus className="h-5 w-5" /> Nouvelle Procédure
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <div className="relative mb-6">
              <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Filtrer les procédures..."
                className="pl-10 h-10 border-none bg-white rounded-xl shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              {loadingProcs ? (
                <div className="text-sm text-slate-400 font-bold px-3">Chargement...</div>
              ) : filteredProcedures.length === 0 ? (
                <div className="text-sm text-slate-400 font-bold px-3">Aucun résultat</div>
              ) : (
                filteredProcedures.map((proc) => (
                  <button
                    key={proc.id}
                    onClick={() => setSelectedProcId(proc.id)}
                    className={`w-full text-left p-4 rounded-2xl transition-all border-2 ${
                      selectedProcId === proc.id
                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                        : "bg-white border-transparent text-slate-600 hover:border-slate-200"
                    }`}
                  >
                    <div className="font-bold text-sm mb-1">{proc.title}</div>
                    <div className={`text-[10px] font-black uppercase tracking-tighter ${selectedProcId === proc.id ? "text-white/60" : "text-slate-400"}`}>
                      {proc.institution}
                    </div>
                    <div className="mt-2">
                      <Badge variant="secondary" className={selectedProcId === proc.id ? "bg-white/10 text-white" : ""}>
                        {proc.status === "coming_soon" ? "À venir" : "En ligne"}
                      </Badge>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-3">
            {selectedProcId ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
                  <CardHeader className="px-8 pt-8">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" /> Détails Généraux
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-8 pb-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase text-slate-400">Titre de la démarche</Label>
                        <Input value={procedureForm.title} onChange={(e) => setProcedureForm({ ...procedureForm, title: e.target.value })} className="h-12 rounded-xl bg-slate-50 border-none" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase text-slate-400">Institution</Label>
                        <Input value={procedureForm.institution} onChange={(e) => setProcedureForm({ ...procedureForm, institution: e.target.value })} className="h-12 rounded-xl bg-slate-50 border-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase text-slate-400">Catégorie</Label>
                        <Input value={procedureForm.category} onChange={(e) => setProcedureForm({ ...procedureForm, category: e.target.value })} className="h-12 rounded-xl bg-slate-50 border-none" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase text-slate-400">Icône</Label>
                        <Input value={procedureForm.icon} onChange={(e) => setProcedureForm({ ...procedureForm, icon: e.target.value })} className="h-12 rounded-xl bg-slate-50 border-none" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase text-slate-400">Description</Label>
                      <Textarea value={procedureForm.description} onChange={(e) => setProcedureForm({ ...procedureForm, description: e.target.value })} className="rounded-xl bg-slate-50 border-none min-h-[100px]" />
                    </div>
                    <div className="grid grid-cols-4 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase text-slate-400">Coût (CDF)</Label>
                        <Input type="number" value={procedureForm.cost} onChange={(e) => setProcedureForm({ ...procedureForm, cost: Number(e.target.value) })} className="h-12 rounded-xl bg-slate-50 border-none" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase text-slate-400">Délai (jours)</Label>
                        <Input type="number" value={procedureForm.estimatedDays} onChange={(e) => setProcedureForm({ ...procedureForm, estimatedDays: Number(e.target.value) })} className="h-12 rounded-xl bg-slate-50 border-none" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase text-slate-400">Statut</Label>
                        <select
                          className="w-full h-12 rounded-xl bg-slate-50 border-none px-3 text-sm"
                          value={procedureForm.status}
                          onChange={(e) => setProcedureForm({ ...procedureForm, status: e.target.value as "available" | "coming_soon" })}
                        >
                          <option value="available">En ligne</option>
                          <option value="coming_soon">À venir</option>
                        </select>
                      </div>
                      <div className="flex flex-col justify-center gap-2">
                        <Label className="text-xs font-black uppercase text-slate-400">Statut actif</Label>
                        <div className="flex items-center gap-3">
                          <Switch checked={procedureForm.isActive} onCheckedChange={(checked) => setProcedureForm({ ...procedureForm, isActive: checked })} />
                          <span className="text-sm font-bold text-slate-600">Visible</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
                  <CardHeader className="px-8 pt-8 flex flex-row items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <ListFilter className="h-5 w-5 text-primary" /> Champs demandés
                    </CardTitle>
                    <Button variant="outline" size="sm" className="rounded-xl font-bold border-slate-200" onClick={() => setFieldOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" /> Ajouter un champ
                    </Button>
                  </CardHeader>
                  <CardContent className="px-8 pb-8">
                    <div className="space-y-4">
                      {(procDetails?.fields ?? []).map((field, idx) => (
                        <div key={field.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-4">
                            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-slate-400 font-bold text-xs">{idx + 1}</div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{field.label}</div>
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                Type: {field.type} • {field.required ? "Obligatoire" : "Optionnel"}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl hover:bg-rose-50 text-rose-500"
                            onClick={() => deleteFieldMutation.mutate(field.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
                  <CardHeader className="px-8 pt-8 flex flex-row items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <FilePlus className="h-5 w-5 text-primary" /> Pièces à Fournir
                    </CardTitle>
                    <Button variant="outline" size="sm" className="rounded-xl font-bold border-slate-200" onClick={() => setDocOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" /> Ajouter un document
                    </Button>
                  </CardHeader>
                  <CardContent className="px-8 pb-8">
                    <div className="space-y-4">
                      {(procDetails?.requiredDocuments ?? []).map((doc, idx) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-4">
                            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-slate-400 font-bold text-xs">{idx + 1}</div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{doc.name}</div>
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                Formats: {doc.acceptedFormats.join(", ")} • Max {doc.maxSizeMb} MB
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl hover:bg-rose-50 text-rose-500"
                            onClick={() => deleteDocumentMutation.mutate(doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end pt-4">
                  <Button
                    className="rounded-2xl h-14 px-10 font-black text-lg gap-2 shadow-xl shadow-primary/20"
                    onClick={() => updateProcedureMutation.mutate(procedureForm)}
                    disabled={updateProcedureMutation.isPending}
                  >
                    <Save className="h-6 w-6" /> {updateProcedureMutation.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-[60vh] flex flex-col items-center justify-center bg-white rounded-[40px] border-2 border-dashed border-slate-100 text-center p-12">
                <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                  <Settings2 className="h-12 w-12" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Sélectionnez une procédure</h3>
                <p className="text-slate-500 max-w-sm">
                  Choisissez une procédure dans la liste de gauche pour configurer ses champs, ses documents et ses paramètres.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle>Nouvelle procédure</DialogTitle>
            <DialogDescription>Créez une nouvelle démarche visible dans le catalogue et dans l’admin.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input value={createProcedureForm.title} onChange={(e) => setCreateProcedureForm({ ...createProcedureForm, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Institution</Label>
              <Input value={createProcedureForm.institution} onChange={(e) => setCreateProcedureForm({ ...createProcedureForm, institution: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Input value={createProcedureForm.category} onChange={(e) => setCreateProcedureForm({ ...createProcedureForm, category: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Icône</Label>
              <Input value={createProcedureForm.icon} onChange={(e) => setCreateProcedureForm({ ...createProcedureForm, icon: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Coût</Label>
              <Input type="number" value={createProcedureForm.cost} onChange={(e) => setCreateProcedureForm({ ...createProcedureForm, cost: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Délai</Label>
              <Input type="number" value={createProcedureForm.estimatedDays} onChange={(e) => setCreateProcedureForm({ ...createProcedureForm, estimatedDays: Number(e.target.value) })} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Description</Label>
              <Textarea value={createProcedureForm.description} onChange={(e) => setCreateProcedureForm({ ...createProcedureForm, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button
              onClick={() => createProcedureMutation.mutate(createProcedureForm)}
              disabled={createProcedureMutation.isPending || !createProcedureForm.title || !createProcedureForm.category || !createProcedureForm.institution}
            >
              {createProcedureMutation.isPending ? "Création..." : "Créer la procédure"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={fieldOpen} onOpenChange={setFieldOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle>Ajouter un champ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Libellé</Label>
              <Input value={newField.label} onChange={(e) => setNewField({ ...newField, label: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <select
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm"
                value={newField.type}
                onChange={(e) => setNewField({ ...newField, type: e.target.value })}
              >
                <option value="text">Texte</option>
                <option value="number">Nombre</option>
                <option value="date">Date</option>
                <option value="textarea">Texte long</option>
                <option value="select">Liste</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFieldOpen(false)}>Annuler</Button>
            <Button onClick={() => addFieldMutation.mutate()} disabled={!newField.label || addFieldMutation.isPending}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={docOpen} onOpenChange={setDocOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle>Ajouter un document requis</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={newDoc.name} onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={newDoc.description} onChange={(e) => setNewDoc({ ...newDoc, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Formats (séparés par des virgules)</Label>
              <Input value={newDoc.acceptedFormats} onChange={(e) => setNewDoc({ ...newDoc, acceptedFormats: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Taille max (MB)</Label>
              <Input type="number" value={newDoc.maxSizeMb} onChange={(e) => setNewDoc({ ...newDoc, maxSizeMb: Number(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocOpen(false)}>Annuler</Button>
            <Button onClick={() => addDocumentMutation.mutate()} disabled={!newDoc.name || addDocumentMutation.isPending}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
