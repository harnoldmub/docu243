import type { Express, Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { db, pool } from "./db";
import { storage } from "./storage";
import { payments, type Procedure } from "@shared/schema";

// Keep payments in Stripe test mode until live payments are explicitly enabled.
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (stripeKey && !stripeKey.startsWith("sk_test_")) {
  throw new Error("STRIPE_SECRET_KEY doit être une clé Stripe de test (sk_test_).");
}
const stripe = stripeKey ? new Stripe(stripeKey) : null;
export const paymentsEnabled = () => !!stripe;

/** Official base price + service fee, or null when the base price is not set. */
export function priceOf(p: Pick<Procedure, "cost" | "currency" | "feeStatus" | "serviceFee">) {
  if (p.feeStatus !== "confirmed" || p.currency !== "USD") return null;
  return { currency: "USD", official: p.cost, service: p.serviceFee, total: p.cost + p.serviceFee };
}

function baseUrl(req: Request) {
  return process.env.PUBLIC_URL?.replace(/\/$/, "") || `${req.protocol}://${req.get("host")}`;
}

/** Marks a payment as succeeded and transmits the dossier. Safe to call several times. */
async function confirmPayment(sessionId: string, paymentIntent?: string | null) {
  const [payment] = await db.select().from(payments).where(eq(payments.checkoutSessionId, sessionId));
  if (!payment || payment.status === "succeeded") return payment;

  const seq = await pool.query("SELECT nextval('receipt_seq') AS n");
  const receiptNumber = `MD-${new Date().getFullYear()}-${String(seq.rows[0].n).padStart(6, "0")}`;
  const [updated] = await db
    .update(payments)
    .set({ status: "succeeded", paidAt: new Date(), transactionRef: paymentIntent ?? null, receiptNumber })
    .where(and(eq(payments.id, payment.id), eq(payments.status, "pending")))
    .returning();
  if (!updated) return payment; // confirmed concurrently

  const dossier = await storage.getApplication(payment.applicationId);
  if (!dossier) return updated;
  const procedureFields = await storage.getProcedureFields(dossier.procedureId);
  const requiredDocs = await storage.getProcedureRequiredDocs(dossier.procedureId);
  await storage.updateApplication(dossier.id, {
    status: "submitted",
    statusNote: null,
    submittedAt: new Date(),
    requirementsSnapshot:
      dossier.requirementsSnapshot ?? { fields: procedureFields, documents: requiredDocs, capturedAt: new Date().toISOString() },
  });
  await storage.createActivityLog({
    actorId: dossier.userId,
    action: "payment",
    entityType: "application",
    entityId: dossier.id,
    oldValue: dossier.status,
    newValue: receiptNumber,
  });
  await storage.createNotification({
    userId: dossier.userId,
    type: "payment_received",
    title: "Paiement confirmé",
    message: `Nous avons bien reçu votre paiement (reçu ${receiptNumber}). Notre équipe prend en charge votre dossier ${dossier.reference}.`,
    metadata: { applicationId: dossier.id, paymentId: updated.id },
  });
  return updated;
}

export function registerPaymentRoutes(app: Express, requireAuth: (req: Request, res: Response, next: NextFunction) => void) {
  app.get("/api/payments/config", (_req, res) => res.json({ enabled: paymentsEnabled() }));

  // Creates a Stripe Checkout session for a complete dossier.
  app.post("/api/applications/:id/checkout", requireAuth, async (req: Request, res: Response) => {
    if (!stripe) return res.status(503).json({ error: "Le paiement en ligne n'est pas encore activé. Réessayez plus tard." });
    const dossier = await storage.getApplication(req.params.id);
    if (!dossier || dossier.userId !== req.session.userId) return res.status(404).json({ error: "Dossier introuvable" });
    if (dossier.status !== "draft") return res.status(409).json({ error: "Ce dossier a déjà été transmis." });

    const procedure = await storage.getProcedure(dossier.procedureId);
    const price = procedure && priceOf(procedure);
    if (!procedure || !price) {
      return res.status(409).json({ error: "Le tarif de cette démarche n'est pas encore fixé : le paiement n'est pas possible pour le moment." });
    }

    // Same completeness rule as a direct submission.
    const values = await storage.getApplicationFieldValues(dossier.id);
    const docs = await storage.getApplicationDocuments(dossier.id);
    const fields = await storage.getProcedureFields(dossier.procedureId);
    const required = await storage.getProcedureRequiredDocs(dossier.procedureId);
    const missingFields = fields.filter((f) => f.required && !values.find((v) => v.fieldId === f.id && String(v.value).trim())).map((f) => f.label);
    const missingDocs = required
      .filter((d) => d.required && !docs.find((x) => x.requiredDocId === d.id && !["rejected", "replacement_requested"].includes(x.status)))
      .map((d) => d.name);
    if (missingFields.length || missingDocs.length) {
      return res.status(400).json({ error: "Votre dossier est incomplet.", missingFields, missingDocs });
    }

    const already = await db.select().from(payments).where(and(eq(payments.applicationId, dossier.id), eq(payments.status, "succeeded")));
    if (already.length) return res.status(409).json({ error: "Ce dossier est déjà payé." });

    const user = await storage.getUser(dossier.userId);
    const url = baseUrl(req);
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      ...(price.official > 0
        ? [{ quantity: 1, price_data: { currency: "usd", unit_amount: price.official * 100, product_data: { name: `Frais officiels : ${procedure.title}` } } }]
        : []),
      { quantity: 1, price_data: { currency: "usd", unit_amount: price.service * 100, product_data: { name: "Frais de service MesDémarches" } } },
    ];
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: user?.email,
      client_reference_id: dossier.id,
      metadata: { applicationId: dossier.id, reference: dossier.reference },
      payment_intent_data: { description: `MesDémarches ${dossier.reference} : ${procedure.title}` },
      success_url: `${url}/application/${dossier.id}?paiement=retour&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${url}/application/${dossier.id}?paiement=annule`,
      locale: "fr",
    });

    await db.insert(payments).values({
      applicationId: dossier.id,
      amount: price.total * 100,
      currency: price.currency,
      officialAmount: price.official,
      serviceFee: price.service,
      status: "pending",
      provider: "stripe",
      checkoutSessionId: session.id,
    });

    res.json({ url: session.url });
  });

  // Called when the client comes back from Stripe; the webhook does the same in the background.
  app.post("/api/payments/verify", requireAuth, async (req: Request, res: Response) => {
    if (!stripe) return res.status(503).json({ error: "Paiement non activé" });
    const sessionId = String(req.body?.sessionId ?? "");
    const [payment] = await db.select().from(payments).where(eq(payments.checkoutSessionId, sessionId));
    if (!payment) return res.status(404).json({ error: "Paiement introuvable" });
    const dossier = await storage.getApplication(payment.applicationId);
    if (!dossier || dossier.userId !== req.session.userId) return res.status(404).json({ error: "Paiement introuvable" });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === "paid") {
      const confirmed = await confirmPayment(sessionId, typeof session.payment_intent === "string" ? session.payment_intent : null);
      return res.json({ status: confirmed?.status ?? "succeeded" });
    }
    res.json({ status: payment.status });
  });

  app.get("/api/applications/:id/payments", requireAuth, async (req: Request, res: Response) => {
    const dossier = await storage.getApplication(req.params.id);
    const isStaff = ["agent", "admin", "super_admin"].includes(req.session.role || "");
    if (!dossier || (dossier.userId !== req.session.userId && !isStaff)) return res.status(404).json({ error: "Dossier introuvable" });
    res.json(await db.select().from(payments).where(eq(payments.applicationId, dossier.id)));
  });

  // Stripe webhook: needs the raw body captured in server/index.ts.
  app.post("/api/stripe/webhook", async (req: Request, res: Response) => {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).end();
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody as Buffer, req.headers["stripe-signature"] as string, process.env.STRIPE_WEBHOOK_SECRET);
    } catch {
      return res.status(400).send("Signature invalide");
    }
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === "paid") {
        await confirmPayment(session.id, typeof session.payment_intent === "string" ? session.payment_intent : null);
      }
    } else if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await db
        .update(payments)
        .set({ status: "failed" })
        .where(and(eq(payments.checkoutSessionId, session.id), eq(payments.status, "pending")));
    }
    res.json({ received: true });
  });
}
