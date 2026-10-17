import { Baby, Briefcase, Car, FileText, GraduationCap, HardHat, Home, Plane, Scale, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  "Identité et voyage": Plane,
  "État civil et famille": Baby,
  "Justice et documents communaux": Scale,
  "Entreprise et fiscalité": Briefcase,
  "Travail et protection sociale": HardHat,
  "Éducation": GraduationCap,
  "Transport": Car,
  "Foncier et construction": Home,
};

export function categoryIcon(category: string): LucideIcon {
  return ICONS[category] ?? FileText;
}
