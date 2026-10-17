import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { FileSearch, Home, LayoutGrid, UserRound, type LucideIcon } from "lucide-react";
import { useAuth, isStaffRole } from "@/hooks/use-auth";
import { authHref } from "@/lib/auth-links";
import { cn } from "@/lib/utils";

const TEXT_INPUT = /^(INPUT|TEXTAREA|SELECT)$/;
const NON_TEXT_TYPES = new Set(["checkbox", "radio", "button", "submit", "reset", "file", "range", "color"]);

/** True while a text field has focus, i.e. while the on-screen keyboard is likely open. */
function useTyping() {
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    const isField = (el: EventTarget | null) =>
      el instanceof HTMLElement && TEXT_INPUT.test(el.tagName) && !NON_TEXT_TYPES.has((el as HTMLInputElement).type);
    const onIn = (e: FocusEvent) => setTyping(isField(e.target));
    const onOut = () => setTyping(false);
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => {
      document.removeEventListener("focusin", onIn);
      document.removeEventListener("focusout", onOut);
    };
  }, []);
  return typing;
}

/** Fixed navigation for phones and tablets. Hidden while typing so it never covers the active field. */
export function BottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  const typing = useTyping();
  const spaceHref = user ? (isStaffRole(user.role) ? "/admin" : "/dashboard") : authHref("login", "/dashboard");

  const items: Array<{ href: string; label: string; icon: LucideIcon; active: boolean }> = [
    { href: "/", label: "Accueil", icon: Home, active: location === "/" },
    {
      href: "/catalogue",
      label: "Démarches",
      icon: LayoutGrid,
      active: location.startsWith("/catalogue") || location.startsWith("/procedure") || location.startsWith("/parcours"),
    },
    { href: "/suivi", label: "Suivi", icon: FileSearch, active: location.startsWith("/suivi") },
    {
      href: spaceHref,
      label: "Mon espace",
      icon: UserRound,
      active: ["/dashboard", "/application", "/mes-documents", "/profil", "/notifications", "/admin"].some((p) => location.startsWith(p)),
    },
  ];

  return (
    <nav
      aria-label="Navigation rapide"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-brand-line bg-white transition-transform duration-200 print:hidden lg:hidden",
        typing && "translate-y-full",
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid h-16 max-w-xl grid-cols-4">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "relative flex h-full flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors",
                item.active ? "text-brand-royal" : "text-brand-ink-2 active:text-brand-ink",
              )}
            >
              {item.active && <span className="absolute inset-x-5 top-0 h-[3px] rounded-b-full bg-brand-royal" aria-hidden="true" />}
              <item.icon className={cn("h-6 w-6", item.active && "stroke-[2.4]")} aria-hidden="true" />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
