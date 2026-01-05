import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  LogOut, 
  FileText, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  UserPlus,
  Phone
} from "lucide-react";

interface AdminUser {
  id: string;
  username: string;
  role: string;
  fullName: string | null;
}

interface EnrichedRequest {
  id: string;
  trackingCode: string;
  citizenId: string;
  serviceId: string;
  status: string;
  paymentStatus: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  citizen: {
    nom: string;
    postNom: string;
    prenom: string;
    nationalId: string;
    phoneNumber: string;
  } | null;
  service: {
    name: string;
    authority: string;
  } | null;
}

const statusLabels: Record<string, string> = {
  pending: "En attente",
  payment: "Paiement requis",
  processing: "En traitement",
  signature: "Signature",
  ready: "Prêt",
  delivered: "Livré",
  rejected: "Rejeté",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  payment: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  signature: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  ready: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  delivered: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<EnrichedRequest | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "", fullName: "", role: "staff" });

  const { data: user, isLoading: userLoading, error: userError } = useQuery<AdminUser>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const { data: requests, isLoading: requestsLoading, refetch } = useQuery<EnrichedRequest[]>({
    queryKey: ["/api/admin/requests"],
    enabled: !!user,
  });

  useEffect(() => {
    if (userError) {
      navigate("/admin/login");
    }
  }, [userError, navigate]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      navigate("/admin/login");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/requests/${id}/status`, { status, notes });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Statut mis à jour",
        description: "La demande a été mise à jour avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/requests"] });
      setSelectedRequest(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Utilisateur créé",
        description: "Le nouvel utilisateur a été créé avec succès",
      });
      setShowCreateUser(false);
      setNewUser({ username: "", password: "", fullName: "", role: "staff" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'utilisateur",
        variant: "destructive",
      });
    },
  });

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const filteredRequests = requests?.filter((req) => {
    const matchesSearch =
      req.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.citizen?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.citizen?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.citizen?.nationalId?.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: requests?.length || 0,
    pending: requests?.filter((r) => r.status === "pending" || r.status === "payment").length || 0,
    processing: requests?.filter((r) => r.status === "processing" || r.status === "signature").length || 0,
    completed: requests?.filter((r) => r.status === "ready" || r.status === "delivered").length || 0,
  };

  const handleUpdateStatus = () => {
    if (selectedRequest && newStatus) {
      updateStatusMutation.mutate({
        id: selectedRequest.id,
        status: newStatus,
        notes,
      });
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h1 className="font-bold text-lg">DOCU243 Admin</h1>
              <p className="text-xs text-muted-foreground">
                {user.fullName || user.username} ({user.role})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-create-user">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Nouvel utilisateur
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un utilisateur</DialogTitle>
                  <DialogDescription>
                    Ajoutez un nouveau membre à l'équipe administrative
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nom d'utilisateur</Label>
                    <Input
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      placeholder="utilisateur"
                      data-testid="input-new-username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mot de passe</Label>
                    <Input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="Mot de passe sécurisé"
                      data-testid="input-new-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nom complet</Label>
                    <Input
                      value={newUser.fullName}
                      onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                      placeholder="Jean Kabila"
                      data-testid="input-new-fullname"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rôle</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                    >
                      <SelectTrigger data-testid="select-new-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Personnel</SelectItem>
                        <SelectItem value="admin">Administrateur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Annuler</Button>
                  </DialogClose>
                  <Button
                    onClick={() => createUserMutation.mutate(newUser)}
                    disabled={createUserMutation.isPending}
                    data-testid="button-submit-new-user"
                  >
                    {createUserMutation.isPending ? "Création..." : "Créer"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              data-testid="button-admin-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total demandes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">En attente</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.processing}</p>
                  <p className="text-sm text-muted-foreground">En cours</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                  <p className="text-sm text-muted-foreground">Terminées</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Gestion des demandes</CardTitle>
                <CardDescription>
                  Visualisez et gérez toutes les demandes de documents
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-[200px]"
                    data-testid="input-search-requests"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]" data-testid="select-filter-status">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="payment">Paiement</SelectItem>
                    <SelectItem value="processing">Traitement</SelectItem>
                    <SelectItem value="signature">Signature</SelectItem>
                    <SelectItem value="ready">Prêt</SelectItem>
                    <SelectItem value="delivered">Livré</SelectItem>
                    <SelectItem value="rejected">Rejeté</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => refetch()} data-testid="button-refresh">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {requestsLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredRequests?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucune demande trouvée</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Code</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Citoyen</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Service</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Statut</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Date</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests?.map((request) => (
                      <tr key={request.id} className="border-b hover-elevate" data-testid={`row-request-${request.id}`}>
                        <td className="py-3 px-2">
                          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            {request.trackingCode}
                          </code>
                        </td>
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-medium">
                              {request.citizen?.prenom} {request.citizen?.nom}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {request.citizen?.phoneNumber}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <p className="font-medium">{request.service?.name}</p>
                          <p className="text-xs text-muted-foreground">{request.service?.authority}</p>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant="secondary" className={statusColors[request.status]}>
                            {statusLabels[request.status]}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-sm text-muted-foreground">
                          {new Date(request.createdAt).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setNewStatus(request.status);
                                  setNotes(request.notes || "");
                                }}
                                data-testid={`button-view-${request.id}`}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Gérer
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle>Détails de la demande</DialogTitle>
                                <DialogDescription>
                                  Code: {selectedRequest?.trackingCode}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedRequest && (
                                <div className="space-y-4 py-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-muted-foreground">Citoyen</Label>
                                      <p className="font-medium">
                                        {selectedRequest.citizen?.prenom} {selectedRequest.citizen?.postNom} {selectedRequest.citizen?.nom}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">ID National</Label>
                                      <p className="font-mono">{selectedRequest.citizen?.nationalId}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Service</Label>
                                      <p className="font-medium">{selectedRequest.service?.name}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Paiement</Label>
                                      <Badge variant={selectedRequest.paymentStatus === "paid" ? "default" : "secondary"}>
                                        {selectedRequest.paymentStatus === "paid" ? "Payé" : "Non payé"}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Mettre à jour le statut</Label>
                                    <Select value={newStatus} onValueChange={setNewStatus}>
                                      <SelectTrigger data-testid="select-update-status">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">En attente</SelectItem>
                                        <SelectItem value="payment">Paiement requis</SelectItem>
                                        <SelectItem value="processing">En traitement</SelectItem>
                                        <SelectItem value="signature">Signature</SelectItem>
                                        <SelectItem value="ready">Prêt</SelectItem>
                                        <SelectItem value="delivered">Livré</SelectItem>
                                        <SelectItem value="rejected">Rejeté</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Notes internes</Label>
                                    <Textarea
                                      value={notes}
                                      onChange={(e) => setNotes(e.target.value)}
                                      placeholder="Ajoutez des notes sur cette demande..."
                                      data-testid="textarea-notes"
                                    />
                                  </div>
                                </div>
                              )}
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">Fermer</Button>
                                </DialogClose>
                                <Button
                                  onClick={handleUpdateStatus}
                                  disabled={updateStatusMutation.isPending}
                                  data-testid="button-update-status"
                                >
                                  {updateStatusMutation.isPending ? "Mise à jour..." : "Mettre à jour"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
