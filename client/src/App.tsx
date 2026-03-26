import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth-page";
import Catalogue from "@/pages/catalogue";
import ProcedureDetail from "@/pages/procedure-detail";
import Dashboard from "@/pages/dashboard";
import ApplicationDetail from "@/pages/application-detail";
import AdminDashboard from "@/pages/admin-dashboard";
import ProcedureManagement from "@/pages/admin/procedure-management";
import UserManagement from "@/pages/admin/user-management";
import ActivityLogs from "@/pages/admin/activity-logs";

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/catalogue" component={Catalogue} />
      <Route path="/procedure/:slug" component={ProcedureDetail} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/application/:id" component={ApplicationDetail} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/procedures" component={ProcedureManagement} />
      <Route path="/admin/users" component={UserManagement} />
      <Route path="/admin/logs" component={ActivityLogs} />

      {/* Legacy redirects */}
      <Route path="/services">
        {() => { window.location.href = "/catalogue"; return null; }}
      </Route>
      <Route path="/suivi">
        {() => { window.location.href = "/dashboard"; return null; }}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider defaultTheme="light" storageKey="docu243-theme">
          <TooltipProvider>
            <ScrollToTop />
            <div className="flex min-h-screen flex-col font-sans selection:bg-primary/10">
              <Header />
              <main className="flex-1">
                <Router />
              </main>
              <Footer />
            </div>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
