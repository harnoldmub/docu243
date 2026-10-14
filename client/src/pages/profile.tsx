import { Link, useLocation } from "wouter";
import { LogOut } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/states";

const ROLE_LABEL: Record<string, string> = { citizen: "Citoyen", agent: "Agent", admin: "Administrateur", super_admin: "Super administrateur" };

export default function ProfilePage() {
  return (
    <RequireAuth>
      <Profile />
    </RequireAuth>
  );
}

function Profile() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  if (!user) return null;
  const rows = [
    { label: "Prénom", value: user.prenom },
    { label: "Nom", value: user.nom },
    { label: "Adresse e-mail", value: user.email },
    { label: "Type de compte", value: ROLE_LABEL[user.role] ?? user.role },
  ];
  return (
    <div className="bg-brand-mist pb-20">
      <section className="border-b border-brand-line bg-white">
        <div className="md-container py-10">
          <h1 className="display-1 text-brand-ink">Mon profil</h1>
        </div>
      </section>
      <div className="md-container max-w-3xl space-y-6 pt-8">
        <dl className="divide-y divide-brand-line rounded-2xl border border-brand-line bg-white">
          {rows.map((r) => (
            <div key={r.label} className="grid gap-1 px-5 py-4 sm:grid-cols-[200px_1fr]">
              <dt className="text-brand-ink-2">{r.label}</dt>
              <dd className="font-semibold text-brand-ink">{r.value}</dd>
            </div>
          ))}
        </dl>
        <Notice tone="neutral">
          La modification de ces informations et du mot de passe n'est pas encore disponible en ligne. Voir{" "}
          <Link href="/aide#compte" className="font-semibold text-brand-royal underline underline-offset-4">l'aide sur votre compte</Link>.
        </Notice>
        <Button
          variant="outline"
          onClick={async () => {
            await logout();
            setLocation("/");
          }}
        >
          <LogOut aria-hidden="true" /> Se déconnecter
        </Button>
      </div>
    </div>
  );
}
