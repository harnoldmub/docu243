import type { ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth, isStaffRole } from "@/hooks/use-auth";
import { authHref, currentPath } from "@/lib/auth-links";

export function RequireAuth({ children, staff = false }: { children: ReactNode; staff?: boolean }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="md-container py-16" aria-busy="true" aria-label="Chargement">
        <div className="skeleton h-10 w-64" />
        <div className="skeleton mt-8 h-32" />
      </div>
    );
  }
  if (!user) return <Redirect to={authHref("login", currentPath())} replace />;
  if (staff && !isStaffRole(user.role)) return <Redirect to="/dashboard" replace />;
  return <>{children}</>;
}
