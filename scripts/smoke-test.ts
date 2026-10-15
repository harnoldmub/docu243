import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

function loadLocalEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;

  const contents = readFileSync(envPath, "utf8");
  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^"/, "").replace(/"$/, "");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

class SessionClient {
  private cookieHeader = "";

  async raw(pathname: string, init: RequestInit = {}): Promise<Response> {
    const isForm = init.body instanceof FormData;
    const response = await fetch(`${BASE_URL}${pathname}`, {
      ...init,
      headers: {
        ...(isForm ? {} : { "Content-Type": "application/json" }),
        ...(this.cookieHeader ? { Cookie: this.cookieHeader } : {}),
        ...(init.headers ?? {}),
      },
    });

    const setCookies = response.headers.getSetCookie?.() ?? [];
    if (setCookies.length > 0) {
      this.cookieHeader = setCookies.map((cookie) => cookie.split(";")[0]).join("; ");
    }
    return response;
  }

  async request<T>(pathname: string, init: RequestInit = {}): Promise<T> {
    const response = await this.raw(pathname, init);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${init.method || "GET"} ${pathname} failed: ${response.status} ${text}`);
    }
    return response.json() as Promise<T>;
  }

  /** Asserts that a request is refused with the given status. */
  async expectStatus(pathname: string, init: RequestInit, status: number, message: string) {
    const response = await this.raw(pathname, init);
    assert(response.status === status, `${message} (reçu ${response.status})`);
  }
}

loadLocalEnv();

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:5001";
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL || "admin@docu243.cd";
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD || "admin123";
// A fresh citizen account is created for each run.
const CITIZEN_EMAIL = `smoke.${Date.now()}@example.test`;
const CITIZEN_PASSWORD = "Smoke-Test-2026";

// Smallest valid PNG (1x1 pixel).
const PNG = Uint8Array.from(
  atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="),
  (c) => c.charCodeAt(0),
);

async function main() {
  const citizen = new SessionClient();
  const admin = new SessionClient();

  const citizenUser = await citizen.request<{ id: string; prenom: string; email: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ prenom: "Smoke", nom: "Test", email: CITIZEN_EMAIL, phone: "0812345678", password: CITIZEN_PASSWORD }),
  });
  const adminUser = await admin.request<{ id: string; prenom: string; email: string; role: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  assert(["agent", "admin", "super_admin"].includes(adminUser.role), "Le compte admin n'a pas un role agent/admin valide.");

  const procedures = await citizen.request<Array<{ id: string; slug: string; title: string; status: string; channel: string; editorialStatus: string }>>(
    "/api/procedures",
  );
  assert(procedures.length > 0, "Aucune procedure disponible.");
  assert(procedures.every((p) => p.editorialStatus === "published"), "Le catalogue public expose des fiches non publiees.");

  await citizen.expectStatus("/api/inconnue", {}, 404, "Une route API inconnue doit repondre 404.");

  // Prefer a procedure with a payable price so that the Stripe checkout can be exercised.
  const preferredProcedure =
    procedures.find((p: any) => p.status === "available" && p.feeStatus === "confirmed" && p.currency === "USD") ||
    procedures.find((procedure) => procedure.status === "available" && procedure.channel === "docu243");
  assert(preferredProcedure, "Impossible de selectionner une procedure de test.");

  const createdApplication = await citizen.request<{ id: string; procedureId: string; status: string; reference: string }>("/api/applications", {
    method: "POST",
    body: JSON.stringify({ procedureId: preferredProcedure.id }),
  });
  assert(createdApplication.status === "draft", "La creation du dossier ne retourne pas un statut brouillon.");

  const detail = await citizen.request<any>(`/api/applications/${createdApplication.id}`);
  assert(Array.isArray(detail.procedure?.fields), "Les champs de procedure sont absents.");
  assert(Array.isArray(detail.procedure?.requiredDocuments), "Les documents requis sont absents.");

  await citizen.expectStatus(`/api/applications/${createdApplication.id}`, { method: "PATCH", body: JSON.stringify({ status: "approved" }) }, 400,
    "Un citoyen ne doit pas pouvoir approuver son propre dossier.");

  const requiredDocs = detail.procedure.requiredDocuments.filter((d: any) => d.required);
  if (requiredDocs.length > 0) {
    await citizen.expectStatus(`/api/applications/${createdApplication.id}`, { method: "PATCH", body: JSON.stringify({ status: "submitted" }) }, 400,
      "Un dossier incomplet ne doit pas pouvoir etre transmis.");
  }

  if (detail.procedure.fields.length > 0) {
    const fieldValues = detail.procedure.fields.map((field: any, index: number) => ({
      fieldId: field.id,
      value: `Valeur de test ${index + 1}`,
    }));

    await citizen.request(`/api/applications/${createdApplication.id}`, {
      method: "PATCH",
      body: JSON.stringify({ fieldValues }),
    });
  }

  for (const doc of detail.procedure.requiredDocuments) {
    const form = new FormData();
    form.append("requiredDocId", doc.id);
    form.append("file", new Blob([PNG], { type: "image/png" }), "piece-de-test.png");
    const uploaded = await citizen.request<{ fileUrl: string }>(`/api/applications/${createdApplication.id}/upload`, { method: "POST", body: form });
    await citizen.request(`/api/applications/${createdApplication.id}/documents`, {
      method: "POST",
      body: JSON.stringify({ requiredDocId: doc.id, fileUrl: uploaded.fileUrl, originalName: "piece-de-test.png" }),
    });
  }

  // A complete dossier still needs a confirmed payment before it is transmitted.
  await citizen.expectStatus(`/api/applications/${createdApplication.id}`, { method: "PATCH", body: JSON.stringify({ status: "submitted" }) }, 402,
    "Un dossier non paye ne doit pas pouvoir etre transmis.");
  const payConfig = await citizen.request<{ enabled: boolean }>("/api/payments/config");
  const checkout = await citizen.raw(`/api/applications/${createdApplication.id}/checkout`, { method: "POST" });
  if (payConfig.enabled) {
    const body = await checkout.json();
    assert(checkout.ok && typeof body.url === "string", `La session Stripe n'a pas ete creee (${checkout.status}).`);
  } else {
    assert(checkout.status === 503, `Sans cle Stripe, le paiement doit repondre 503 (recu ${checkout.status}).`);
  }

  const adminApplications = await admin.request<any[]>("/api/admin/applications");
  const targetApplication = adminApplications.find((application) => application.id === createdApplication.id);
  assert(targetApplication, "Le dossier n'apparait pas dans le backoffice admin.");
  assert(targetApplication.paid === false, "Le dossier non paye apparait comme paye.");

  await admin.request(`/api/admin/applications/${createdApplication.id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "under_review" }),
  });

  const adminDetail = await admin.request<any>(`/api/applications/${createdApplication.id}`);
  assert(Array.isArray(adminDetail.activityLogs), "L'historique n'est pas expose sur le detail dossier.");

  if (adminDetail.documents.length > 0) {
    await admin.request(`/api/admin/documents/${adminDetail.documents[0].id}/validate`, {
      method: "PATCH",
      body: JSON.stringify({ status: "approved" }),
    });
  }

  await admin.expectStatus(`/api/admin/applications/${createdApplication.id}/status`, { method: "PATCH", body: JSON.stringify({ status: "pending_user_action" }) }, 400,
    "Une demande de correction sans message doit etre refusee.");

  await admin.request(`/api/admin/applications/${createdApplication.id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "ready" }),
  });


  const citizenNotifications = await citizen.request<any[]>("/api/notifications");
  assert(
    citizenNotifications.some((notification) => notification.metadata?.applicationId === createdApplication.id),
    "Le citoyen ne recoit pas de notification exploitable pour le dossier teste.",
  );

  console.log(JSON.stringify({
    ok: true,
    applicationId: createdApplication.id,
    reference: createdApplication.reference,
    procedure: preferredProcedure.title,
    citizen: citizenUser.email,
    admin: adminUser.email,
    notificationsChecked: citizenNotifications.length,
  }, null, 2));
}

main().catch((error) => {
  console.error("[smoke-test] failure");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
