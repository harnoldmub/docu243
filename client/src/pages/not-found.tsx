import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="md-container flex min-h-[60vh] flex-col justify-center py-16">
      <p className="font-display text-7xl font-extrabold text-brand-royal">404</p>
      <h1 className="display-2 mt-4 max-w-xl text-brand-ink">Cette page n'existe pas</h1>
      <p className="mt-3 max-w-xl text-brand-ink-2">L'adresse est peut-être incomplète, ou la page a été déplacée.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/catalogue">Voir toutes les démarches</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Retour à l'accueil</Link>
        </Button>
      </div>
    </section>
  );
}
