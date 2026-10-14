import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin", label: "Dossiers", admin: false },
  { href: "/admin/procedures", label: "Démarches", admin: false },
  { href: "/admin/users", label: "Utilisateurs", admin: true },
  { href: "/admin/logs", label: "Journal", admin: false },
];

/** Header and section tabs shared by every back-office page. */
export function AdminHeader({ title, intro, actions }: { title: string; intro?: string; actions?: ReactNode }) {
  const [location] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  return (
    <section className="on-blue bg-brand-deep text-white">
      <div className="md-container pt-8">
        <p className="text-sm font-semibold text-brand-yellow">Back-office MesDémarches</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="display-2">{title}</h1>
            {intro && <p className="mt-2 max-w-2xl text-white/80">{intro}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
        <nav aria-label="Sections du back-office" className="-mb-px mt-8 overflow-x-auto">
          <ul className="flex gap-1">
            {TABS.filter((t) => !t.admin || isAdmin).map((t) => {
              const active = t.href === "/admin" ? location === "/admin" : location.startsWith(t.href);
              return (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-12 items-center whitespace-nowrap rounded-t-xl px-5 font-semibold transition-colors",
                      active ? "bg-brand-mist text-brand-ink" : "text-white/80 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    {t.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </section>
  );
}
