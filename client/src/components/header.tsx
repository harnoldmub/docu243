import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronDown, CircleHelp, FolderOpen, LogOut, Menu, ShieldCheck, User as UserIcon, X, Files } from "lucide-react";
import { useAuth, isStaffRole } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { NotificationsMenu } from "@/components/notifications-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authHref } from "@/lib/auth-links";
import { cn } from "@/lib/utils";

export function Logo({ variant = "color", className }: { variant?: "color" | "white"; className?: string }) {
  const base = variant === "white" ? "/logo-white" : "/logo";
  return (
    <picture>
      <source srcSet={`${base}.webp`} type="image/webp" />
      <img src={`${base}.png`} width={720} height={202} alt="MesDémarches" className={cn("h-9 w-auto sm:h-10", className)} />
    </picture>
  );
}

export function Header() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isStaff = isStaffRole(user?.role);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location]);

  const dossiersHref = user ? (isStaff ? "/admin" : "/dashboard") : authHref("login", "/dashboard");
  const nav = [
    { href: "/catalogue", label: "Toutes les démarches", match: (l: string) => l.startsWith("/catalogue") || l.startsWith("/procedure") },
    { href: "/comment-ca-marche", label: "Comment ça marche", match: (l: string) => l === "/comment-ca-marche" },
    { href: "/aide", label: "Aide", match: (l: string) => l === "/aide" },
    {
      href: dossiersHref,
      label: isStaff ? "Back-office" : "Mes dossiers",
      match: (l: string) => l.startsWith("/dashboard") || l.startsWith("/application") || l.startsWith("/admin"),
    },
  ];

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <header className={cn("sticky top-0 z-40 bg-white print:hidden transition-shadow duration-200", scrolled && "shadow-[0_1px_0_var(--md-line),0_6px_20px_-12px_rgb(16_27_53/0.25)]")}>
      <div className="tricolor" aria-hidden="true" />
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-brand-yellow focus:px-4 focus:py-2 focus:font-semibold focus:text-brand-ink"
      >
        Aller au contenu
      </a>
      <div className="md-container flex h-[60px] items-center justify-between gap-3 lg:h-[76px]">
        <Link href="/" aria-label="MesDémarches, accueil" className="shrink-0 rounded-lg">
          <Logo className="h-7 min-[390px]:h-8 sm:h-10" />
        </Link>

        <nav aria-label="Navigation principale" className="hidden xl:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => {
              const active = item.match(location);
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative inline-flex min-h-11 items-center whitespace-nowrap rounded-lg px-3.5 text-[0.9375rem] font-semibold text-brand-ink transition-colors duration-150 hover:bg-brand-mist",
                      active && "text-brand-royal after:absolute after:inset-x-3.5 after:bottom-1 after:h-[3px] after:rounded-full after:bg-brand-yellow",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/aide"
            aria-label="Aide"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-brand-ink transition-colors hover:bg-brand-mist lg:hidden"
          >
            <CircleHelp className="h-5 w-5" aria-hidden="true" />
          </Link>
          {user ? (
            <>
              <NotificationsMenu />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden min-h-11 items-center gap-2 rounded-xl px-2 text-left transition-colors hover:bg-brand-mist sm:inline-flex">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-royal text-sm font-bold text-white" aria-hidden="true">
                      {(user.prenom?.[0] ?? "").toUpperCase()}
                    </span>
                    <span className="max-w-[9rem] truncate text-[0.9375rem] font-semibold text-brand-ink">{user.prenom}</span>
                    <ChevronDown className="h-4 w-4 text-brand-ink-2" aria-hidden="true" />
                    <span className="sr-only">Ouvrir le menu du compte</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 rounded-xl p-1.5">
                  <DropdownMenuLabel className="px-2.5 py-2">
                    <span className="block font-semibold text-brand-ink">
                      {user.prenom} {user.nom}
                    </span>
                    <span className="block truncate text-sm font-normal text-brand-ink-2">{user.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isStaff ? (
                    <DropdownMenuItem asChild className="min-h-11 cursor-pointer rounded-lg">
                      <Link href="/admin">
                        <ShieldCheck className="mr-2 h-4 w-4" /> Back-office
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <>
                      <DropdownMenuItem asChild className="min-h-11 cursor-pointer rounded-lg">
                        <Link href="/dashboard">
                          <FolderOpen className="mr-2 h-4 w-4" /> Mes dossiers
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="min-h-11 cursor-pointer rounded-lg">
                        <Link href="/mes-documents">
                          <Files className="mr-2 h-4 w-4" /> Mes documents
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem asChild className="min-h-11 cursor-pointer rounded-lg">
                    <Link href="/profil">
                      <UserIcon className="mr-2 h-4 w-4" /> Mon profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleLogout} className="min-h-11 cursor-pointer rounded-lg">
                    <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link
                href={authHref("login")}
                className="hidden min-h-11 items-center rounded-xl px-3 text-[0.9375rem] font-semibold text-brand-ink transition-colors hover:bg-brand-mist lg:inline-flex"
              >
                Connexion
              </Link>
              <Button asChild className="hidden md:inline-flex">
                <Link href={authHref("register")}>Créer mon compte</Link>
              </Button>
            </>
          )}

          <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <Dialog.Trigger asChild>
              <button
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-brand-ink transition-colors hover:bg-brand-mist xl:hidden"
                aria-label="Ouvrir le menu"
              >
                <Menu className="h-6 w-6" aria-hidden="true" />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-brand-ink/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
              <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-float duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right">
                <div className="tricolor" aria-hidden="true" />
                <div className="flex h-[68px] items-center justify-between px-4">
                  <Dialog.Title className="sr-only">Menu</Dialog.Title>
                  <Logo className="h-8" />
                  <Dialog.Close className="inline-flex h-11 w-11 items-center justify-center rounded-xl hover:bg-brand-mist" aria-label="Fermer le menu">
                    <X className="h-6 w-6" aria-hidden="true" />
                  </Dialog.Close>
                </div>
                <nav aria-label="Navigation mobile" className="flex-1 overflow-y-auto px-4 pb-6">
                  <ul className="divide-y divide-brand-line border-y border-brand-line">
                    {nav.map((item) => (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          aria-current={item.match(location) ? "page" : undefined}
                          className="flex min-h-[56px] items-center font-display text-xl font-bold text-brand-ink aria-[current=page]:text-brand-royal"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                    {user && !isStaff && (
                      <li>
                        <Link href="/mes-documents" className="flex min-h-[56px] items-center font-display text-xl font-bold text-brand-ink">
                          Mes documents
                        </Link>
                      </li>
                    )}
                    {user && (
                      <li>
                        <Link href="/profil" className="flex min-h-[56px] items-center font-display text-xl font-bold text-brand-ink">
                          Mon profil
                        </Link>
                      </li>
                    )}
                  </ul>
                </nav>
                <div className="space-y-3 border-t border-brand-line p-4">
                  {user ? (
                    <Button variant="outline" size="lg" className="w-full" onClick={handleLogout}>
                      <LogOut aria-hidden="true" /> Se déconnecter
                    </Button>
                  ) : (
                    <>
                      <Button asChild size="lg" className="w-full">
                        <Link href={authHref("register")}>Créer mon compte</Link>
                      </Button>
                      <Button asChild variant="outline" size="lg" className="w-full">
                        <Link href={authHref("login")}>Connexion</Link>
                      </Button>
                    </>
                  )}
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}
