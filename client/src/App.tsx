import { Switch, Route, Redirect, useLocation } from "wouter";
import { lazy, Suspense, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Catalogue from "@/pages/catalogue";

// Pages other than the home page and the catalogue are loaded on demand to keep the first load light.
const AuthPage = lazy(() => import("@/pages/auth-page"));
const ProcedureDetail = lazy(() => import("@/pages/procedure-detail"));
const HowItWorksPage = lazy(() => import("@/pages/info-pages").then((m) => ({ default: m.HowItWorksPage })));
const HelpPage = lazy(() => import("@/pages/info-pages").then((m) => ({ default: m.HelpPage })));
const GoalsPage = lazy(() => import("@/pages/info-pages").then((m) => ({ default: m.GoalsPage })));
const LegalNoticePage = lazy(() => import("@/pages/legal").then((m) => ({ default: m.LegalNoticePage })));
const PrivacyPage = lazy(() => import("@/pages/legal").then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import("@/pages/legal").then((m) => ({ default: m.TermsPage })));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const ApplicationDetail = lazy(() => import("@/pages/application-detail"));
const MyDocuments = lazy(() => import("@/pages/my-documents"));
const Notifications = lazy(() => import("@/pages/notifications"));
const Profile = lazy(() => import("@/pages/profile"));
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard"));
const ProcedureManagement = lazy(() => import("@/pages/admin/procedure-management"));
const UserManagement = lazy(() => import("@/pages/admin/user-management"));
const ActivityLogs = lazy(() => import("@/pages/admin/activity-logs"));

const TITLES: Array<[RegExp, string]> = [
  [/^\/$/, "MesDémarches — Vos démarches, simplement"],
  [/^\/catalogue/, "Toutes les démarches — MesDémarches"],
  [/^\/auth/, "Connexion — MesDémarches"],
  [/^\/dashboard/, "Mes dossiers — MesDémarches"],
  [/^\/mes-documents/, "Mes documents — MesDémarches"],
  [/^\/notifications/, "Notifications — MesDémarches"],
  [/^\/profil/, "Mon profil — MesDémarches"],
  [/^\/aide/, "Aide — MesDémarches"],
  [/^\/comment-ca-marche/, "Comment ça marche — MesDémarches"],
  [/^\/parcours/, "Que souhaitez-vous faire ? — MesDémarches"],
  [/^\/admin/, "Back-office — MesDémarches"],
];

function RouteEffects() {
  const [location] = useLocation();

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      // Wait for the page to render before scrolling to the anchor.
      requestAnimationFrame(() => document.getElementById(decodeURIComponent(hash))?.scrollIntoView());
    } else {
      window.scrollTo(0, 0);
    }
    const match = TITLES.find(([re]) => re.test(location));
    if (match) document.title = match[1];
  }, [location]);

  return null;
}

function PageFallback() {
  return (
    <div className="md-container py-16" aria-busy="true" aria-label="Chargement">
      <div className="skeleton h-10 w-72" />
      <div className="skeleton mt-6 h-5 w-full max-w-xl" />
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="skeleton h-40" />
        <div className="skeleton h-40" />
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/catalogue" component={Catalogue} />
        <Route path="/procedure/:slug" component={ProcedureDetail} />
        <Route path="/parcours" component={GoalsPage} />
        <Route path="/comment-ca-marche" component={HowItWorksPage} />
        <Route path="/aide" component={HelpPage} />
        <Route path="/mentions-legales" component={LegalNoticePage} />
        <Route path="/confidentialite" component={PrivacyPage} />
        <Route path="/conditions" component={TermsPage} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/application/:id" component={ApplicationDetail} />
        <Route path="/mes-documents" component={MyDocuments} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/profil" component={Profile} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/procedures" component={ProcedureManagement} />
        <Route path="/admin/users" component={UserManagement} />
        <Route path="/admin/logs" component={ActivityLogs} />

        {/* Legacy addresses */}
        <Route path="/services">
          <Redirect to="/catalogue" replace />
        </Route>
        <Route path="/demarches">
          <Redirect to="/catalogue" replace />
        </Route>
        <Route path="/suivi">
          <Redirect to="/dashboard" replace />
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
          <RouteEffects />
          <div className="flex min-h-screen flex-col">
            <Header />
            <main id="contenu" className="flex-1" tabIndex={-1}>
              <Router />
            </main>
            <Footer />
          </div>
          <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
