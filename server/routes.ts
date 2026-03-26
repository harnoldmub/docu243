import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import bcrypt from "bcrypt";
import { seedCatalog } from "./seed";
import {
  users,
  procedures,
  procedureFields,
  procedureRequiredDocuments,
  applications,
  applicationDocuments,
} from "@shared/schema";
import { eq, desc, asc, sql } from "drizzle-orm";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    role?: string;
  }
}

// Middleware for authentication
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Non connecté" });
  }
  next();
}

// Middleware for agent/admin access
function requireAgent(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Non connecté" });
  }
  if (!["agent", "admin", "super_admin"].includes(req.session.role || "")) {
    return res.status(403).json({ error: "Accès refusé" });
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Non connecté" });
  }
  if (!["admin", "super_admin"].includes(req.session.role || "")) {
    return res.status(403).json({ error: "Accès refusé" });
  }
  next();
}

function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sanitizeUser(user: any) {
  if (!user) return user;
  const { password, ...safeUser } = user;
  return safeUser;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ============ AUTHENTICATION ============

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { prenom, nom, email, phone, password } = req.body;
      const existing = await storage.getUserByEmail(email);
      if (existing) return res.status(400).json({ error: "Email déjà utilisé" });

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        prenom,
        nom,
        email,
        phone,
        password: hashedPassword,
        role: "citizen",
      });

      req.session.userId = user.id;
      req.session.role = user.role;

      res.status(201).json({
        id: user.id,
        email: user.email,
        role: user.role,
        prenom: user.prenom,
        nom: user.nom,
      });
    } catch (e) {
      res.status(500).json({ error: "Erreur lors de l'inscription" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Identifiants invalides" });
      }

      req.session.userId = user.id;
      req.session.role = user.role;

      res.json({ id: user.id, email: user.email, role: user.role, prenom: user.prenom, nom: user.nom });
    } catch (e) {
      res.status(500).json({ error: "Erreur de connexion" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => res.json({ success: true }));
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.userId) return res.status(401).json({ error: "Non connecté" });
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
    res.json({ id: user.id, email: user.email, role: user.role, prenom: user.prenom, nom: user.nom });
  });

  // ============ PROCEDURES ============

  app.get("/api/procedures", async (req: Request, res: Response) => {
    const procs = await storage.getAllProcedures();
    res.json(procs);
  });

  app.get("/api/procedures/:slug", async (req: Request, res: Response) => {
    const proc = await storage.getProcedureBySlug(req.params.slug);
    if (!proc) return res.status(404).json({ error: "Procédure introuvable" });

    const fields = await storage.getProcedureFields(proc.id);
    const docs = await storage.getProcedureRequiredDocs(proc.id);

    res.json({ ...proc, fields, requiredDocuments: docs });
  });

  // ============ APPLICATIONS (USER) ============

  app.post("/api/applications", requireAuth, async (req: Request, res: Response) => {
    const { procedureId } = req.body;
    const procedure = await storage.getProcedure(procedureId);
    if (!procedure) {
      return res.status(404).json({ error: "Procedure introuvable" });
    }
    if (procedure.status !== "available") {
      return res.status(409).json({ error: "Cette demarche est annoncee mais pas encore ouverte en ligne." });
    }

    const app_doc = await storage.createApplication(req.session.userId!, procedureId);

    await storage.createActivityLog({
      actorId: req.session.userId!,
      action: "creation",
      entityType: "application",
      entityId: app_doc.id,
      newValue: "draft",
    });

    await storage.createNotification({
      userId: req.session.userId!,
      type: "application_created",
      title: "Dossier créé",
      message: `Votre dossier ${app_doc.reference} a été créé et enregistré comme brouillon.`,
      metadata: { applicationId: app_doc.id, procedureId: procedure.id },
    });

    res.status(201).json(app_doc);
  });

  app.get("/api/applications/me", requireAuth, async (req: Request, res: Response) => {
    const apps = await storage.getApplicationsByUser(req.session.userId!);
    // Enrich with procedure info
    const enriched = await Promise.all(apps.map(async (a) => {
      const proc = await storage.getProcedure(a.procedureId);
      return { ...a, procedure: proc };
    }));
    res.json(enriched);
  });

  app.get("/api/applications/:id", requireAuth, async (req: Request, res: Response) => {
    const dossier = await storage.getApplication(req.params.id);
    if (!dossier) return res.status(404).json({ error: "Dossier introuvable" });

    // Check ownership or agent access
    if (dossier.userId !== req.session.userId && !["agent", "admin", "super_admin"].includes(req.session.role || "")) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const procedure = await storage.getProcedure(dossier.procedureId);
    const procedureFields = procedure ? await storage.getProcedureFields(procedure.id) : [];
    const procedureRequiredDocs = procedure ? await storage.getProcedureRequiredDocs(procedure.id) : [];
    const fieldValues = await storage.getApplicationFieldValues(dossier.id);
    const documents = await storage.getApplicationDocuments(dossier.id);
    const activityLogs = await storage.getActivityLogs(dossier.id);
    const dossierUser =
      dossier.userId !== req.session.userId && ["agent", "admin", "super_admin"].includes(req.session.role || "")
        ? await storage.getUser(dossier.userId)
        : undefined;

    res.json({
      ...dossier,
      procedure: procedure
        ? {
            ...procedure,
            fields: procedureFields,
            requiredDocuments: procedureRequiredDocs,
          }
        : undefined,
      fieldValues,
      documents,
      activityLogs,
      user: dossierUser ? sanitizeUser(dossierUser) : undefined,
    });
  });

  app.patch("/api/applications/:id", requireAuth, async (req: Request, res: Response) => {
    const { status, fieldValues } = req.body;
    const dossier = await storage.getApplication(req.params.id);
    if (!dossier) {
      return res.status(404).json({ error: "Dossier introuvable" });
    }

    const isAgent = ["agent", "admin", "super_admin"].includes(req.session.role || "");
    if (dossier.userId !== req.session.userId && !isAgent) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    // If field values provided, save them
    if (fieldValues && Array.isArray(fieldValues)) {
      for (const fv of fieldValues) {
        await storage.setApplicationFieldValue(req.params.id, fv.fieldId, fv.value);
      }
    }

    if (status) {
      await storage.updateApplication(req.params.id, {
        status,
        submittedAt: status === "submitted" ? new Date() : undefined
      });

      await storage.createActivityLog({
        actorId: req.session.userId!,
        action: status === "submitted" ? "submission" : "status_update",
        entityType: "application",
        entityId: req.params.id,
        oldValue: dossier.status,
        newValue: status,
      });

      await storage.createNotification({
        userId: dossier.userId,
        type: "application_update",
        title: status === "submitted" ? "Dossier soumis" : "Statut mis à jour",
        message:
          status === "submitted"
            ? `Votre dossier ${dossier.reference} a bien été soumis pour traitement.`
            : `Le statut de votre dossier ${dossier.reference} est passé à ${status}.`,
        metadata: { applicationId: dossier.id, status },
      });
    }

    res.json({ success: true });
  });

  // ============ DOCUMENTS ============

  app.post("/api/applications/:id/documents", requireAuth, async (req: Request, res: Response) => {
    const { requiredDocId, fileUrl, originalName, mimeType, size } = req.body;
    const dossier = await storage.getApplication(req.params.id);
    if (!dossier) {
      return res.status(404).json({ error: "Dossier introuvable" });
    }
    if (dossier.userId !== req.session.userId) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const doc = await storage.addApplicationDocument({
      applicationId: req.params.id,
      requiredDocId,
      fileUrl,
      originalName,
      mimeType,
      size,
      status: "submitted",
    });

    await storage.createActivityLog({
      actorId: req.session.userId!,
      action: "document_upload",
      entityType: "application",
      entityId: req.params.id,
      newValue: originalName,
    });

    res.status(201).json(doc);
  });

  // ============ AGENT BACKOFFICE ============

  app.get("/api/admin/applications", requireAgent, async (req: Request, res: Response) => {
    try {
      const apps = await storage.getAllApplications();
      const enriched = await Promise.all(apps.map(async (a) => {
        const proc = await storage.getProcedure(a.procedureId);
        const user = await storage.getUser(a.userId);
        const documents = await storage.getApplicationDocuments(a.id);

        return {
          ...a,
          procedure: proc,
          user: { prenom: user?.prenom, nom: user?.nom, email: user?.email },
          documents
        };
      }));
      res.json(enriched);
    } catch (e) {
      res.status(500).json({ error: "Erreur lors de la récupération des dossiers" });
    }
  });

  app.patch("/api/admin/applications/:id/status", requireAgent, async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const dossier = await storage.getApplication(req.params.id);
      if (!dossier) return res.status(404).json({ error: "Dossier introuvable" });

      await storage.updateApplication(req.params.id, { status });

      await storage.createActivityLog({
        actorId: req.session.userId!,
        action: "admin_status_update",
        entityType: "application",
        entityId: req.params.id,
        oldValue: dossier.status,
        newValue: status,
      });

      await storage.createNotification({
        userId: dossier.userId,
        type: "application_update",
        title: "Dossier mis à jour",
        message: `Votre dossier ${dossier.reference} est maintenant au statut ${status}.`,
        metadata: { applicationId: dossier.id, status },
      });

      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Erreur lors de la mise à jour du statut" });
    }
  });

  app.patch("/api/admin/documents/:id/validate", requireAgent, async (req: Request, res: Response) => {
    try {
      const { status, feedback } = req.body;
      await storage.updateApplicationDocumentStatus(req.params.id, status, feedback);

      const [document] = await db
        .select()
        .from(applicationDocuments)
        .where(eq(applicationDocuments.id, req.params.id));

      if (document) {
        const [application] = await db
          .select()
          .from(applications)
          .where(eq(applications.id, document.applicationId));

        if (application) {
          await storage.createNotification({
            userId: application.userId,
            type: "document_validation",
            title: status === "approved" ? "Document approuvé" : "Document à corriger",
            message:
              status === "approved"
                ? "Un document de votre dossier a été approuvé."
                : feedback || "Un document de votre dossier nécessite une correction.",
            metadata: { applicationId: application.id, documentId: document.id, status },
          });
        }
      }

      await storage.createActivityLog({
        actorId: req.session.userId!,
        action: "document_validation",
        entityType: "document",
        entityId: req.params.id,
        newValue: status,
      });

      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Erreur lors de la validation du document" });
    }
  });

  app.get("/api/admin/users", requireAdmin, async (_req: Request, res: Response) => {
    const users = await storage.getUsers();
    res.json(users.map(sanitizeUser));
  });

  app.post("/api/admin/users", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { prenom, nom, email, phone, password, institution, role } = req.body;
      const existing = await storage.getUserByEmail(email);
      if (existing) return res.status(400).json({ error: "Email déjà utilisé" });

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        prenom,
        nom,
        email,
        phone,
        password: hashedPassword,
        institution: institution || null,
        role: role || "agent",
        status: "active",
      });

      await storage.createActivityLog({
        actorId: req.session.userId!,
        action: "user_create",
        entityType: "user",
        entityId: user.id,
        newValue: user.role,
      });

      res.status(201).json(sanitizeUser(user));
    } catch (_error) {
      res.status(500).json({ error: "Erreur lors de la création de l'utilisateur" });
    }
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { role, status, institution } = req.body;
      const [updatedUser] = await db
        .update(users)
        .set({
          role,
          status,
          institution,
          updatedAt: new Date(),
        })
        .where(eq(users.id, req.params.id))
        .returning();

      if (!updatedUser) return res.status(404).json({ error: "Utilisateur introuvable" });

      await storage.createActivityLog({
        actorId: req.session.userId!,
        action: "user_update",
        entityType: "user",
        entityId: updatedUser.id,
        newValue: `${updatedUser.role}:${updatedUser.status}`,
      });

      res.json(sanitizeUser(updatedUser));
    } catch (_error) {
      res.status(500).json({ error: "Erreur lors de la mise à jour de l'utilisateur" });
    }
  });

  app.get("/api/admin/procedures", requireAgent, async (_req: Request, res: Response) => {
    const rows = await db
      .select()
      .from(procedures)
      .orderBy(
        sql`case when ${procedures.status} = 'available' then 0 else 1 end`,
        asc(procedures.title),
      );
    res.json(rows);
  });

  app.post("/api/admin/procedures", requireAdmin, async (req: Request, res: Response) => {
    try {
      const {
        title,
        description,
        category,
        institution,
        estimatedDays,
        cost,
        status,
        isActive,
        icon,
      } = req.body;

      const slug = slugify(title);
      const existing = await db.select().from(procedures).where(eq(procedures.slug, slug));
      if (existing.length > 0) {
        return res.status(400).json({ error: "Une procédure avec ce titre existe déjà" });
      }

      const [procedure] = await db.insert(procedures).values({
        title,
        slug,
        description,
        category,
        institution,
        estimatedDays,
        cost,
        status: status || "coming_soon",
        isActive: isActive ?? true,
        icon: icon || "FileText",
      }).returning();

      await storage.createActivityLog({
        actorId: req.session.userId!,
        action: "procedure_create",
        entityType: "procedure",
        entityId: procedure.id,
        newValue: procedure.title,
      });

      res.status(201).json(procedure);
    } catch (_error) {
      res.status(500).json({ error: "Erreur lors de la création de la procédure" });
    }
  });

  app.patch("/api/admin/procedures/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const {
        title,
        description,
        category,
        institution,
        estimatedDays,
        cost,
        status,
        isActive,
        icon,
      } = req.body;

      const [procedure] = await db
        .update(procedures)
        .set({
          title,
          description,
          category,
          institution,
          estimatedDays,
          cost,
          status,
          isActive,
          icon,
          updatedAt: new Date(),
        })
        .where(eq(procedures.id, req.params.id))
        .returning();

      if (!procedure) return res.status(404).json({ error: "Procédure introuvable" });

      await storage.createActivityLog({
        actorId: req.session.userId!,
        action: "procedure_update",
        entityType: "procedure",
        entityId: procedure.id,
        newValue: procedure.title,
      });

      res.json(procedure);
    } catch (_error) {
      res.status(500).json({ error: "Erreur lors de la mise à jour de la procédure" });
    }
  });

  app.post("/api/admin/procedures/:id/fields", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { label, type, required, options } = req.body;
      const existingFields = await storage.getProcedureFields(req.params.id);
      const [field] = await db.insert(procedureFields).values({
        procedureId: req.params.id,
        label,
        type,
        required: required ?? true,
        options: options ?? null,
        order: existingFields.length + 1,
      }).returning();
      res.status(201).json(field);
    } catch (_error) {
      res.status(500).json({ error: "Erreur lors de l'ajout du champ" });
    }
  });

  app.delete("/api/admin/procedure-fields/:fieldId", requireAdmin, async (req: Request, res: Response) => {
    await db.delete(procedureFields).where(eq(procedureFields.id, req.params.fieldId));
    res.json({ success: true });
  });

  app.post("/api/admin/procedures/:id/documents", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { name, description, acceptedFormats, maxSizeMb, required } = req.body;
      const existingDocs = await storage.getProcedureRequiredDocs(req.params.id);
      const [doc] = await db.insert(procedureRequiredDocuments).values({
        procedureId: req.params.id,
        name,
        description,
        acceptedFormats,
        maxSizeMb: maxSizeMb ?? 5,
        required: required ?? true,
        order: existingDocs.length + 1,
      }).returning();
      res.status(201).json(doc);
    } catch (_error) {
      res.status(500).json({ error: "Erreur lors de l'ajout du document" });
    }
  });

  app.delete("/api/admin/procedure-documents/:docId", requireAdmin, async (req: Request, res: Response) => {
    await db.delete(procedureRequiredDocuments).where(eq(procedureRequiredDocuments.id, req.params.docId));
    res.json({ success: true });
  });

  app.get("/api/admin/logs", requireAgent, async (req: Request, res: Response) => {
    const logs = await storage.getActivityLogs();
    res.json(logs);
  });

  // ============ NOTIFICATIONS ============

  app.get("/api/notifications", requireAuth, async (req: Request, res: Response) => {
    const notes = await storage.getNotificationsByUser(req.session.userId!);
    res.json(notes);
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req: Request, res: Response) => {
    await storage.markNotificationAsRead(req.params.id);
    res.json({ success: true });
  });

  // ============ SEEDING ============

  app.post("/api/seed", async (req: Request, res: Response) => {
    const result = await seedCatalog();
    res.json({ success: true, ...result });
  });

  return httpServer;
}
