import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ShieldCheck,
    User,
    Mail,
    Lock,
    Phone,
    ArrowRight,
    Loader2,
    Eye,
    EyeOff
} from "lucide-react";

const loginSchema = z.object({
    email: z.string().email("Email invalide"),
    password: z.string().min(6, "Mot de passe trop court"),
});

const registerSchema = z.object({
    prenom: z.string().min(2, "Prénom requis"),
    nom: z.string().min(2, "Nom requis"),
    email: z.string().email("Email invalide"),
    phone: z.string().min(9, "Numéro de téléphone invalide"),
    password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères"),
});

export default function AuthPage() {
    const { user, login, register, isLoading } = useAuth();
    const [, setLocation] = useLocation();
    const [activeTab, setActiveTab] = useState<"login" | "register">("login");
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);

    // Redirect if already logged in
    React.useEffect(() => {
        if (user) {
            const isAgent = ["agent", "admin", "super_admin"].includes(user.role);
            setLocation(isAgent ? "/admin" : "/dashboard");
        }
    }, [user, setLocation]);

    const loginForm = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    const registerForm = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: { prenom: "", nom: "", email: "", phone: "", password: "" },
    });

    const onLogin = async (data: any) => {
        await login(data);
    };

    const onRegister = async (data: any) => {
        await register(data);
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4 bg-slate-50/50">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary text-white mb-4 shadow-lg shadow-primary/20">
                        <ShieldCheck className="h-8 w-8" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Bienvenue sur DOCU243</h1>
                    <p className="text-slate-500">Accédez à votre espace citoyen sécurisé</p>
                </div>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 p-1 bg-slate-200/50 rounded-xl h-12">
                        <TabsTrigger value="login" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            Connexion
                        </TabsTrigger>
                        <TabsTrigger value="register" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            Créer un compte
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="login" className="mt-6">
                        <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-xl">Identifiez-vous</CardTitle>
                                <CardDescription>Entrez vos accès pour gérer vos dossiers.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                            <Input
                                                id="email"
                                                type="email"
                                                className="pl-10 h-11"
                                                placeholder="exemple@email.cd"
                                                {...loginForm.register("email")}
                                            />
                                        </div>
                                        {loginForm.formState.errors.email && (
                                            <p className="text-[10px] text-rose-500 font-bold uppercase">{loginForm.formState.errors.email.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Mot de passe</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                            <Input
                                                id="password"
                                                type={showLoginPassword ? "text" : "password"}
                                                className="pl-10 pr-12 h-11"
                                                {...loginForm.register("password")}
                                            />
                                            <button
                                                type="button"
                                                className="absolute inset-y-0 right-3 flex items-center justify-center text-slate-400 transition-colors hover:text-slate-600"
                                                onClick={() => setShowLoginPassword((value) => !value)}
                                            >
                                                {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {loginForm.formState.errors.password && (
                                            <p className="text-[10px] text-rose-500 font-bold uppercase">{loginForm.formState.errors.password.message}</p>
                                        )}
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full h-11 font-bold gap-2 mt-2"
                                        disabled={loginForm.formState.isSubmitting}
                                    >
                                        {loginForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Se connecter"}
                                        {!loginForm.formState.isSubmitting && <ArrowRight className="h-4 w-4" />}
                                    </Button>
                                </form>
                            </CardContent>
                            <CardFooter className="bg-slate-50 border-t justify-center py-4">
                                <button
                                    onClick={() => setActiveTab("register")}
                                    className="text-sm font-medium text-primary hover:underline"
                                >
                                    Pas encore de compte ? Inscrivez-vous
                                </button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    <TabsContent value="register" className="mt-6">
                        <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-xl">Nouveau compte</CardTitle>
                                <CardDescription>Rejoignez la plateforme officielle DOCU243.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="prenom">Prénom</Label>
                                            <Input id="prenom" className="h-11" {...registerForm.register("prenom")} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="nom">Nom</Label>
                                            <Input id="nom" className="h-11" {...registerForm.register("nom")} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reg-email">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                            <Input id="reg-email" type="email" className="pl-10 h-11" {...registerForm.register("email")} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Téléphone</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                            <Input id="phone" className="pl-10 h-11" placeholder="082..." {...registerForm.register("phone")} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reg-password">Mot de passe</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                            <Input
                                                id="reg-password"
                                                type={showRegisterPassword ? "text" : "password"}
                                                className="pl-10 pr-12 h-11"
                                                {...registerForm.register("password")}
                                            />
                                            <button
                                                type="button"
                                                className="absolute inset-y-0 right-3 flex items-center justify-center text-slate-400 transition-colors hover:text-slate-600"
                                                onClick={() => setShowRegisterPassword((value) => !value)}
                                            >
                                                {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full h-11 font-bold gap-2 mt-4"
                                        disabled={registerForm.formState.isSubmitting}
                                    >
                                        {registerForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer mon compte"}
                                        {!registerForm.formState.isSubmitting && <ArrowRight className="h-4 w-4" />}
                                    </Button>
                                </form>
                            </CardContent>
                            <CardFooter className="bg-slate-50 border-t justify-center py-4">
                                <button
                                    onClick={() => setActiveTab("login")}
                                    className="text-sm font-medium text-primary hover:underline"
                                >
                                    Déjà inscrit ? Connectez-vous
                                </button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
