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

  async request<T>(pathname: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${BASE_URL}${pathname}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(this.cookieHeader ? { Cookie: this.cookieHeader } : {}),
        ...(init.headers ?? {}),
      },
    });

    const setCookies = response.headers.getSetCookie?.() ?? [];
    if (setCookies.length > 0) {
      this.cookieHeader = setCookies.map((cookie) => cookie.split(";")[0]).join("; ");
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${init.method || "GET"} ${pathname} failed: ${response.status} ${text}`);
    }

    return response.json() as Promise<T>;
  }
}

loadLocalEnv();

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:5001";
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL || "admin.test@docu243.cd";
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD || "admin1234";
const CITIZEN_EMAIL = process.env.SMOKE_CITIZEN_EMAIL || "citoyen.test@docu243.cd";
const CITIZEN_PASSWORD = process.env.SMOKE_CITIZEN_PASSWORD || "citoyen123";

async function main() {
  const citizen = new SessionClient();
  const admin = new SessionClient();

  const citizenUser = await citizen.request<{ id: string; prenom: string; email: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: CITIZEN_EMAIL, password: CITIZEN_PASSWORD }),
  });
  const adminUser = await admin.request<{ id: string; prenom: string; email: string; role: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  assert(["agent", "admin", "super_admin"].includes(adminUser.role), "Le compte admin n'a pas un role agent/admin valide.");

  const procedures = await citizen.request<Array<{ id: string; slug: string; title: string; status: string }>>("/api/procedures");
  assert(procedures.length > 0, "Aucune procedure disponible.");

  const preferredProcedure =
    procedures.find((procedure) => procedure.slug === "legalisation-de-document") ||
    procedures.find((procedure) => procedure.status === "available") ||
    procedures[0];
  assert(preferredProcedure, "Impossible de selectionner une procedure de test.");

  const createdApplication = await citizen.request<{ id: string; procedureId: string; status: string; reference: string }>("/api/applications", {
    method: "POST",
    body: JSON.stringify({ procedureId: preferredProcedure.id }),
  });
  assert(createdApplication.status === "draft", "La creation du dossier ne retourne pas un statut brouillon.");

  const detail = await citizen.request<any>(`/api/applications/${createdApplication.id}`);
  assert(Array.isArray(detail.procedure?.fields), "Les champs de procedure sont absents.");
  assert(Array.isArray(detail.procedure?.requiredDocuments), "Les documents requis sont absents.");

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

  if (detail.procedure.requiredDocuments.length > 0) {
    await citizen.request(`/api/applications/${createdApplication.id}/documents`, {
      method: "POST",
      body: JSON.stringify({
        requiredDocId: detail.procedure.requiredDocuments[0].id,
        fileUrl: "https://storage.docu243.cd/tests/document-de-test.pdf",
        originalName: "document-de-test.pdf",
        mimeType: "application/pdf",
        size: 120000,
      }),
    });
  }

  await citizen.request(`/api/applications/${createdApplication.id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "submitted" }),
  });

  const adminApplications = await admin.request<any[]>("/api/admin/applications");
  const targetApplication = adminApplications.find((application) => application.id === createdApplication.id);
  assert(targetApplication, "Le dossier soumis n'apparait pas dans le backoffice admin.");

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
