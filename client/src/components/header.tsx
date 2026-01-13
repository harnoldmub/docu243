import { Menu, User, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import logoImage from "@assets/ChatGPT_Image_Jan_13,_2026,_08_02_49_AM_1768287813548.png";

interface HeaderProps {
  onMenuClick?: () => void;
  showMobileMenu?: boolean;
}

export function Header({ onMenuClick, showMobileMenu = true }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full bg-primary text-primary-foreground">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:h-20">
        <div className="flex items-center gap-3">
          {showMobileMenu && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-primary-foreground"
              onClick={onMenuClick}
              data-testid="button-mobile-menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <Link href="/" className="flex items-center" data-testid="link-home">
            <img 
              src={logoImage} 
              alt="DOCU243 - Plateforme Officielle de la RDC" 
              className="h-14 w-auto object-contain sm:h-16 md:h-[70px]"
            />
          </Link>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/">
            <Button variant="ghost" className="text-primary-foreground" data-testid="nav-accueil">
              Accueil
            </Button>
          </Link>
          <Link href="/services">
            <Button variant="ghost" className="text-primary-foreground" data-testid="nav-services">
              Services
            </Button>
          </Link>
          <Link href="/suivi">
            <Button variant="ghost" className="text-primary-foreground" data-testid="nav-suivi">
              Suivi Dossier
            </Button>
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-primary-foreground"
                data-testid="button-notifications"
              >
                <Bell className="h-5 w-5" />
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
                >
                  2
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start gap-1">
                <span className="font-medium">Dossier en cours de traitement</span>
                <span className="text-sm text-muted-foreground">
                  Votre demande de passeport est en cours...
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1">
                <span className="font-medium">Paiement confirmé</span>
                <span className="text-sm text-muted-foreground">
                  Le paiement de 50,000 CDF a été validé
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground"
                data-testid="button-user-menu"
              >
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem data-testid="menu-profile">
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem data-testid="menu-dossiers">
                Mes Dossiers
              </DropdownMenuItem>
              <DropdownMenuItem data-testid="menu-settings">
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem data-testid="menu-logout">
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
