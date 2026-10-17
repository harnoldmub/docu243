import type { Express, Request, Response } from "express";
import { storage } from "./storage";

// Public tracking by dossier number. Without signing in, only the general
// progress is returned: no personal data, documents or messages.

const STAGES = ["draft", "submitted", "under_review", "received", "approved", "ready", "delivered"];
const STAGE_OF: Record<string, number> = {
  draft: 0,
  pending_payment: 0,
  submitted: 1,
  pending_user_action: 2,
  under_review: 2,
  received: 3,
  approved: 4,
  ready: 5,
  delivered: 6,
  rejected: 6,
};

// Simple in-memory rate limit, per IP: 20 lookups per 10 minutes.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_LOOKUPS = 20;
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_LOOKUPS;
}

export function normalizeReference(input: string) {
  const raw = input.trim().toUpperCase().replace(/[\s-]+/g, "_");
  const code = raw.replace(/^DOCU_?/, "");
  return /^[A-F0-9]{6}$/.test(code) ? `DOCU_${code}` : null;
}

export function registerTrackingRoutes(app: Express) {
  app.get("/api/track/:reference", async (req: Request, res: Response) => {
    if (limited(req.ip ?? "unknown")) {
      return res.status(429).json({ error: "Trop de recherches. Réessayez dans quelques minutes." });
    }
    const reference = normalizeReference(String(req.params.reference));
    if (!reference) {
      return res.status(400).json({ error: "Ce numéro n'a pas le bon format. Il ressemble à DOCU_1A2B3C." });
    }
    const dossier = await storage.getApplicationByReference(reference);
    if (!dossier) {
      return res.status(404).json({ error: "Aucun dossier ne correspond à ce numéro. Vérifiez-le sur votre reçu ou dans votre espace." });
    }
    const procedure = await storage.getProcedure(dossier.procedureId);
    const owner = req.session.userId === dossier.userId;
    res.json({
      // The internal id is only given to the signed-in owner.
      id: owner ? dossier.id : undefined,
      reference: dossier.reference,
      procedureTitle: procedure?.title ?? "Démarche",
      status: dossier.status,
      stage: STAGE_OF[dossier.status] ?? 0,
      stages: STAGES.length,
      updatedAt: dossier.updatedAt,
      owner,
    });
  });
}
