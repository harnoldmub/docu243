import { Link, useLocation } from "wouter";
import { Home, FileText, Search, User, CreditCard } from "lucide-react";

const navItems = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/services", label: "Services", icon: FileText },
  { href: "/suivi", label: "Suivi", icon: Search },
  { href: "/paiement", label: "Payer", icon: CreditCard },
  { href: "/compte", label: "Compte", icon: User },
];

export function MobileNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card md:hidden" data-testid="mobile-nav">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = location === item.href || 
            (item.href !== "/" && location.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5px]" : ""}`} />
              <span className={isActive ? "font-medium" : ""}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
