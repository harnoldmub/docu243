import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { Bell, CheckCheck, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { relative } from "@/lib/dates";
import { cn } from "@/lib/utils";

type Note = { id: string; title: string; message: string; readAt: string | null; createdAt: string | null; metadata?: { applicationId?: string } | null };

/** Bell button opening a closable panel with the latest notifications. */
export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { data: notes = [] } = useQuery<Note[]>({
    queryKey: ["/api/notifications"],
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  const unread = notes.filter((n) => !n.readAt).length;
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
  const markOne = useMutation({ mutationFn: (id: string) => apiRequest("PATCH", `/api/notifications/${id}/read`), onSuccess: invalidate });
  const markAll = useMutation({ mutationFn: () => apiRequest("POST", "/api/notifications/read-all"), onSuccess: invalidate });

  const openNote = (n: Note) => {
    if (!n.readAt) markOne.mutate(n.id);
    if (n.metadata?.applicationId) setLocation(`/application/${n.metadata.applicationId}`);
  };

  return (
    <Menu.Root open={open} onOpenChange={setOpen}>
      <Menu.Trigger
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl text-brand-ink transition-colors hover:bg-brand-mist data-[state=open]:bg-brand-mist"
        aria-label={unread ? `Notifications, ${unread} non lue${unread > 1 ? "s" : ""}` : "Notifications"}
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex min-w-[18px] items-center justify-center rounded-full bg-brand-red px-1 text-[11px] font-bold leading-[18px] text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="z-50 w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-brand-line bg-white shadow-float data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <div className="flex items-center justify-between gap-2 border-b border-brand-line py-2 pl-4 pr-2">
            <p className="font-display text-lg font-bold text-brand-ink">
              Notifications{unread > 0 && <span className="ml-1.5 text-sm font-semibold text-brand-ink-2">({unread} non lue{unread > 1 ? "s" : ""})</span>}
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-brand-ink hover:bg-brand-mist"
              aria-label="Fermer les notifications"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {notes.length === 0 ? (
            <p className="px-4 py-8 text-center text-[0.9375rem] text-brand-ink-2">Aucune notification pour le moment.</p>
          ) : (
            <div className="max-h-[min(60vh,420px)] overflow-y-auto">
              {notes.slice(0, 6).map((n) => (
                <Menu.Item
                  key={n.id}
                  onSelect={() => openNote(n)}
                  className="flex cursor-pointer gap-3 border-b border-brand-line px-4 py-3 outline-none last:border-0 data-[highlighted]:bg-brand-mist"
                >
                  <span
                    className={cn("mt-2 h-2 w-2 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-brand-red")}
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className={cn("block text-[0.9375rem]", n.readAt ? "text-brand-ink-2" : "font-semibold text-brand-ink")}>
                      {!n.readAt && <span className="sr-only">Non lue : </span>}
                      {n.title}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-sm text-brand-ink-2">{n.message}</span>
                    <span className="mt-1 block text-xs text-brand-ink-2">{relative(n.createdAt)}</span>
                  </span>
                </Menu.Item>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-2 border-t border-brand-line bg-brand-mist px-2 py-1.5">
            <Menu.Item asChild>
              <Link href="/notifications" className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-brand-royal outline-none data-[highlighted]:underline">
                Tout voir
              </Link>
            </Menu.Item>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-brand-ink hover:bg-white"
              >
                <CheckCheck className="h-4 w-4" aria-hidden="true" /> Tout marquer comme lu
              </button>
            )}
          </div>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
