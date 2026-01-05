import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  CreditCard, 
  Clock, 
  ChevronRight,
  Users,
  Building2,
  Car,
  GraduationCap,
  Heart,
  Scale,
  Home,
  Briefcase
} from "lucide-react";
import type { Service } from "@shared/schema";

interface ServiceCardProps {
  service: Service;
  onSelect: (service: Service) => void;
}

const iconMap: Record<string, typeof FileText> = {
  passport: FileText,
  birth: Users,
  marriage: Heart,
  death: FileText,
  driver: Car,
  education: GraduationCap,
  business: Briefcase,
  property: Home,
  legal: Scale,
  default: Building2,
};

export function ServiceCard({ service, onSelect }: ServiceCardProps) {
  const Icon = iconMap[service.icon] || iconMap.default;
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-CD", {
      style: "decimal",
      minimumFractionDigits: 0,
    }).format(price) + " CDF";
  };

  return (
    <Card 
      className="group overflow-visible transition-all hover-elevate"
      data-testid={`card-service-${service.id}`}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <Badge variant="secondary" className="shrink-0">
          {service.category}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        <h3 className="font-semibold leading-tight text-lg" data-testid={`text-service-name-${service.id}`}>
          {service.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {service.description}
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CreditCard className="h-4 w-4" />
            <span className="font-medium text-foreground">{formatPrice(service.price)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{service.processingTimeDays} jours</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button 
          className="w-full group-hover:bg-primary/90"
          onClick={() => onSelect(service)}
          data-testid={`button-select-service-${service.id}`}
        >
          Demander
          <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export function ServiceCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
        <div className="h-12 w-12 animate-pulse rounded-lg bg-muted" />
        <div className="h-5 w-20 animate-pulse rounded-md bg-muted" />
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
        <div className="space-y-1">
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex gap-4 pt-2">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
      </CardFooter>
    </Card>
  );
}
