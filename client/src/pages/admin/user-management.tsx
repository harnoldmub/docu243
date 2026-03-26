import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Search,
  MoreVertical,
  Mail,
  Building2,
  Calendar,
  ArrowLeft,
  UserCog,
  Ban,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { User } from "@shared/schema";

type CreateAgentForm = {
  prenom: string;
  nom: string;
  email: string;
  phone: string;
  password: string;
  institution: string;
  role: "agent" | "admin";
};

const emptyForm: CreateAgentForm = {
  prenom: "",
  nom: "",
  email: "",
  phone: "",
  password: "",
  institution: "",
  role: "agent",
};

export default function UserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateAgentForm>(emptyForm);
  const managedRoles = ["agent", "admin", "super_admin"];

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const createAgentMutation = useMutation({
    mutationFn: async (payload: CreateAgentForm) => {
      const res = await apiRequest("POST", "/api/admin/users", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Agent créé", description: "Le compte agent a été ajouté avec succès." });
      setCreateOpen(false);
      setForm(emptyForm);
    },
    onError: (error: Error) => {
      toast({ title: "Création impossible", description: error.message, variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({
      id,
      role,
      status,
      institution,
    }: {
      id: string;
      role: string;
      status: string;
      institution?: string | null;
    }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}`, {
        role,
        status,
        institution,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Utilisateur mis à jour", description: "Les changements ont été enregistrés." });
    },
    onError: (error: Error) => {
      toast({ title: "Mise à jour impossible", description: error.message, variant: "destructive" });
    },
  });

  const filteredUsers = useMemo(
    () =>
      (users ?? [])
        .filter((user) => managedRoles.includes(user.role))
        .filter((user) =>
          [user.prenom, user.nom, user.email, user.institution ?? "", user.role]
            .join(" ")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
        ),
    [users, searchTerm],
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
      case "super_admin":
        return (
          <Badge className="bg-slate-900 text-white gap-1 font-black">
            <ShieldCheck className="h-3 w-3" /> ADMIN
          </Badge>
        );
      case "agent":
        return (
          <Badge className="bg-primary text-white gap-1 font-black">
            <Shield className="h-3 w-3" /> AGENT
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-slate-500 gap-1 font-black">
            <Users className="h-3 w-3" /> CITOYEN
          </Badge>
        );
    }
  };

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
                <ShieldAlert className="h-4 w-4" /> Administration
              </div>
              <h1 className="text-2xl font-black text-slate-900">Gestion des Utilisateurs</h1>
            </div>
          </div>
          <Button
            className="rounded-2xl h-12 px-6 font-bold gap-2 shadow-lg shadow-primary/20"
            onClick={() => setCreateOpen(true)}
          >
            <UserPlus className="h-5 w-5" /> Ajouter un Agent
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-10">
        <Card className="rounded-[40px] shadow-xl shadow-slate-200/50 border-none overflow-hidden bg-white">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Rechercher un agent ou un admin..."
                className="pl-12 h-14 border-none bg-white rounded-2xl shadow-sm focus-visible:ring-primary/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 text-slate-400 font-bold text-sm whitespace-nowrap">
              <Shield className="h-5 w-5" />
              {filteredUsers.length} membre{filteredUsers.length > 1 ? "s" : ""} du backoffice
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-slate-400 border-b border-slate-50">
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest">Utilisateur</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest">Rôle</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest">Institution</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest">Créé le</th>
                  <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={5} className="px-8 py-8">
                          <div className="h-10 bg-slate-50 rounded-xl w-full" />
                        </td>
                      </tr>
                    ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold">
                      Aucun agent ou administrateur ne correspond à votre recherche.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-black">
                            {user.prenom?.[0]}
                            {user.nom?.[0]}
                          </div>
                          <div>
                            <div className="font-black text-slate-900">
                              {user.prenom} {user.nom}
                            </div>
                            <div className="text-sm text-slate-500 font-bold flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">{getRoleBadge(user.role)}</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                          <Building2 className="h-4 w-4 text-slate-300" />
                          {user.institution || "Non renseignée"}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-tight">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(user.createdAt ?? new Date()), "dd MMM yyyy", { locale: fr })}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100">
                              <MoreVertical className="h-5 w-5 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="p-2 rounded-2xl border-slate-100 shadow-xl w-52">
                            <DropdownMenuItem
                              className="rounded-xl font-bold py-3 cursor-pointer"
                              onClick={() => window.open(`mailto:${user.email}`, "_self")}
                            >
                              <UserCog className="mr-2 h-4 w-4" /> Contacter
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="rounded-xl font-bold py-3 text-primary cursor-pointer"
                              onClick={() =>
                                updateUserMutation.mutate({
                                  id: String(user.id),
                                  role: "agent",
                                  status: user.status || "active",
                                  institution: user.institution,
                                })
                              }
                            >
                              Passer Agent
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-xl font-bold py-3 text-slate-900 cursor-pointer"
                              onClick={() =>
                                updateUserMutation.mutate({
                                  id: String(user.id),
                                  role: "admin",
                                  status: user.status || "active",
                                  institution: user.institution,
                                })
                              }
                            >
                              Passer Admin
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="rounded-xl font-bold py-3 text-rose-500 cursor-pointer"
                              onClick={() =>
                                updateUserMutation.mutate({
                                  id: String(user.id),
                                  role: user.role,
                                  status: user.status === "inactive" ? "active" : "inactive",
                                  institution: user.institution,
                                })
                              }
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              {user.status === "inactive" ? "Réactiver le compte" : "Désactiver le compte"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-xl rounded-3xl">
          <DialogHeader>
            <DialogTitle>Ajouter un agent</DialogTitle>
            <DialogDescription>
              Créez un compte agent ou administrateur pour accéder à l’espace de gestion.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label>Prénom</Label>
              <Input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Mot de passe</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Institution</Label>
              <Input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <select
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as "agent" | "admin" })}
              >
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button
              onClick={() => createAgentMutation.mutate(form)}
              disabled={createAgentMutation.isPending || !form.prenom || !form.nom || !form.email || !form.phone || !form.password}
            >
              {createAgentMutation.isPending ? "Création..." : "Créer le compte"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
