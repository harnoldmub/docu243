import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Services from "@/pages/services";
import Tracking from "@/pages/tracking";
import Request from "@/pages/request";
import Payment from "@/pages/payment";
import Account from "@/pages/account";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/services" component={Services} />
      <Route path="/suivi" component={Tracking} />
      <Route path="/tracking" component={Tracking} />
      <Route path="/demande/:id" component={Request} />
      <Route path="/request/:id" component={Request} />
      <Route path="/paiement" component={Payment} />
      <Route path="/payment" component={Payment} />
      <Route path="/compte" component={Account} />
      <Route path="/account" component={Account} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="docu243-theme">
        <TooltipProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
              <Router />
            </main>
            <Footer />
            <MobileNav />
          </div>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
