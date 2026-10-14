import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import bcrypt from "bcrypt";
import multer from "multer";
import fs from "fs";
import path from "path";
import {
  users,
  procedures,
  procedureFields,
  procedureRequiredDocuments,
  applications,
  applicationDocuments,
} from "@shared/schema";
import { eq, desc, asc, sql, and } from "drizzle-orm";
import { z } from "zod";

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  submitted: "Transmis",
  received: "Reçu",
  under_review: "En cours d'examen",
  pending_user_action: "Action requise",
  pending_payment: "Paiement requis",
  approved: "Approuvé",
  rejected: "Refusé",
  ready: "Prêt à retirer",
  delivered: "Délivré",
};
const APPLICATION_STATUSES = Object.keys(STATUS_LABELS);
const EDITABLE_STATUSES = ["draft", "pending_user_action"];
const isStaff = (role?: string) => ["agent", "admin", "super_admin"].includes(role || "");

const registerSchema = z.object({
  prenom: z.string().trim().min(2, "Indiquez votre prénom (2 caractères minimum)."),
  nom: z.string().trim().min(2, "Indiquez votre nom (2 caractères minimum)."),
  email: z.string().trim().email("Cette adresse e-mail n'est pas valide."),
  phone: z.string().trim().regex(/^\+?[0-9 ]{9,16}$/, "Indiquez un numéro de téléphone valide, par exemple 0812345678."),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
});

const procedurePayloadSchema = z.object({
  title: z.string().trim().min(3),
  description: z.string().trim().min(3),
  category: z.string().trim().min(2),
  institution: z.string().trim().min(2),
  estimatedDays: z.coerce.number().int().min(0),
  cost: z.coerce.number().int().min(0),
  currency: z.enum(["CDF", "USD"]).nullable().optional(),
  feeStatus: z.enum(["confirmed", "variable", "unconfirmed"]).optional(),
  status: z.enum(["available", "coming_soon"]).optional(),
  channel: z.enum(["docu243", "external", "info"]).optional(),
  externalUrl: z.string().trim().url().nullable().optional().or(z.literal("").transform(() => null)),
  editorialStatus: z.enum(["draft", "to_verify", "validated", "published", "archived"]).optional(),
  verifiedAt: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  isPriority: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
  icon: z.string().optional(),
  guide: z.any().optional(),
});

// Ensure uploads root directory exists
const UPLOADS_ROOT = path.resolve("uploads");
if (!fs.existsSync(UPLOADS_ROOT)) fs.mkdirSync(UPLOADS_ROOT, { recursive: true });

// Multer: memory storage — we write to disk manually after getting the dossier reference
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Type de fichier non accepté. JPEG, PNG, WEBP ou PDF uniquement."));
  },
});

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
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        return res.status(400).json({ error: issue.message, field: issue.path[0] });
      }
      const { prenom, nom, email, phone, password } = parsed.data;
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: "Un compte existe déjà avec cette adresse e-mail. Connectez-vous.", field: "email" });
      }

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
      const email = String(req.body?.email ?? "").trim();
      const password = String(req.body?.password ?? "");
      if (!email || !password) {
        return res.status(400).json({ error: "Indiquez votre adresse e-mail et votre mot de passe." });
      }
      const user = await storage.getUserByEmail(email);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Adresse e-mail ou mot de passe incorrect." });
      }
      if (user.status !== "active") {
        return res.status(403).json({ error: "Ce compte est désactivé." });
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

  app.get("/api/procedures", async (_req: Request, res: Response) => {
    const procs = await storage.getAllProcedures();
    res.json(procs.filter((p) => p.editorialStatus === "published"));
  });

  app.get("/api/procedures/:slug", async (req: Request, res: Response) => {
    const proc = await storage.getProcedureBySlug(req.params.slug);
    const visible = proc && (proc.editorialStatus === "published" && proc.isActive || isStaff(req.session.role));
    if (!proc || !visible) return res.status(404).json({ error: "Démarche introuvable" });

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
    if (procedure.status !== "available" || procedure.channel !== "docu243" || procedure.editorialStatus !== "published") {
      return res.status(409).json({ error: "Cette démarche n'est pas encore ouverte en ligne dans MesDémarches." });
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
    // Once submitted, a dossier keeps the requirements that applied at that time.
    const snapshot = dossier.requirementsSnapshot as { fields?: any[]; documents?: any[] } | null;
    const procedureFields = snapshot?.fields ?? (procedure ? await storage.getProcedureFields(procedure.id) : []);
    const procedureRequiredDocs = snapshot?.documents ?? (procedure ? await storage.getProcedureRequiredDocs(procedure.id) : []);
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

    if (dossier.userId !== req.session.userId) {
      return res.status(403).json({ error: "Accès refusé" });
    }
    if (!EDITABLE_STATUSES.includes(dossier.status)) {
      return res.status(409).json({ error: "Ce dossier a déjà été transmis : il ne peut plus être modifié." });
    }
    if (status && status !== "submitted") {
      return res.status(400).json({ error: "Changement de statut non autorisé." });
    }

    // A dossier sent back for correction keeps the requirements captured at its first submission.
    const snapshot = dossier.requirementsSnapshot as { fields?: any[]; documents?: any[] } | null;
    const procedureFieldsList: any[] = snapshot?.fields ?? (await storage.getProcedureFields(dossier.procedureId));
    const allowedFieldIds = new Set(procedureFieldsList.map((f) => f.id));

    // If field values provided, save them
    if (fieldValues && Array.isArray(fieldValues)) {
      for (const fv of fieldValues) {
        if (!allowedFieldIds.has(fv.fieldId)) continue;
        await storage.setApplicationFieldValue(req.params.id, fv.fieldId, String(fv.value ?? "").slice(0, 2000));
      }
    }

    if (status === "submitted") {
      const values = await storage.getApplicationFieldValues(dossier.id);
      const docs = await storage.getApplicationDocuments(dossier.id);
      const requiredDocs: any[] = snapshot?.documents ?? (await storage.getProcedureRequiredDocs(dossier.procedureId));
      const missingFields = procedureFieldsList
        .filter((f) => f.required && !values.find((v) => v.fieldId === f.id && String(v.value).trim()))
        .map((f) => f.label);
      const missingDocs = requiredDocs
        .filter((d) => d.required && !docs.find((x) => x.requiredDocId === d.id && !["rejected", "replacement_requested"].includes(x.status)))
        .map((d) => d.name);
      if (missingFields.length || missingDocs.length) {
        return res.status(400).json({
          error: "Votre dossier est incomplet.",
          missingFields,
          missingDocs,
        });
      }

      await storage.updateApplication(req.params.id, {
        status,
        statusNote: null,
        submittedAt: new Date(),
        requirementsSnapshot: snapshot ?? { fields: procedureFieldsList, documents: requiredDocs, capturedAt: new Date().toISOString() },
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
            : `Le statut de votre dossier ${dossier.reference} est passé à « ${STATUS_LABELS[status] ?? status} ».`,
        metadata: { applicationId: dossier.id, status },
      });
    }

    res.json({ success: true });
  });

  // Citizen retracts a submitted dossier (only allowed while status is "submitted")
  app.post("/api/applications/:id/retract", requireAuth, async (req: Request, res: Response) => {
    const dossier = await storage.getApplication(req.params.id);
    if (!dossier) return res.status(404).json({ error: "Dossier introuvable" });
    if (dossier.userId !== req.session.userId) return res.status(403).json({ error: "Accès refusé" });
    if (dossier.status !== "submitted") {
      return res.status(409).json({ error: "Le dossier ne peut être retiré que lorsqu'il est en attente de traitement." });
    }

    await storage.updateApplication(req.params.id, { status: "draft" });
    await storage.createActivityLog({
      actorId: req.session.userId!,
      action: "retraction",
      entityType: "application",
      entityId: req.params.id,
      oldValue: "submitted",
      newValue: "draft",
    });
    await storage.createNotification({
      userId: dossier.userId,
      type: "application_update",
      title: "Dossier retiré",
      message: `Votre dossier ${dossier.reference} a été retiré et repassé en mode brouillon. Vous pouvez le modifier et le soumettre à nouveau.`,
      metadata: { applicationId: dossier.id },
    });

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
    if (!EDITABLE_STATUSES.includes(dossier.status)) {
      return res.status(409).json({ error: "Ce dossier a déjà été transmis : ses pièces ne peuvent plus être modifiées." });
    }
    const docSnapshot = dossier.requirementsSnapshot as { documents?: any[] } | null;
    const requiredDocs: any[] = docSnapshot?.documents ?? (await storage.getProcedureRequiredDocs(dossier.procedureId));
    if (!requiredDocs.find((d) => d.id === requiredDocId)) {
      return res.status(400).json({ error: "Pièce inconnue pour cette démarche." });
    }
    const storedName = typeof fileUrl === "string" && fileUrl.startsWith(`/file/${dossier.reference}/`) ? path.basename(fileUrl) : "";
    const storedPath = storedName ? path.join(UPLOADS_ROOT, dossier.reference, storedName) : "";
    if (!storedPath || !fs.existsSync(storedPath)) {
      return res.status(400).json({ error: "Fichier invalide." });
    }

    // Size and type come from the stored file, not from the request.
    const ext = path.extname(storedName).toLowerCase();
    const realMime = ({ ".pdf": "application/pdf", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" } as Record<string, string>)[ext] ?? mimeType;
    const doc = await storage.upsertApplicationDocument({
      applicationId: req.params.id,
      requiredDocId,
      fileUrl,
      originalName: String(originalName ?? storedName).slice(0, 200),
      mimeType: realMime,
      size: fs.statSync(storedPath).size,
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

  // ============ FILE UPLOAD & DOWNLOAD ============

  // Upload a file linked to an application — saved to disk under uploads/{reference}/
  app.post(
    "/api/applications/:id/upload",
    requireAuth,
    (req: Request, res: Response, next: NextFunction) => {
      upload.single("file")(req, res, (err: unknown) => {
        if (!err) return next();
        const tooLarge = err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE";
        res.status(400).json({
          error: tooLarge ? "Ce fichier dépasse 10 Mo." : (err as Error).message || "Fichier refusé.",
        });
      });
    },
    async (req: Request, res: Response) => {
      if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu." });

      const dossier = await storage.getApplication(req.params.id);
      if (!dossier) return res.status(404).json({ error: "Dossier introuvable" });
      if (dossier.userId !== req.session.userId) return res.status(403).json({ error: "Accès refusé" });
      if (!EDITABLE_STATUSES.includes(dossier.status)) {
        return res.status(409).json({ error: "Ce dossier a déjà été transmis : ses pièces ne peuvent plus être modifiées." });
      }

      // Check the file against the rules of the targeted document, when given.
      if (req.body?.requiredDocId) {
        const reqDocs = await storage.getProcedureRequiredDocs(dossier.procedureId);
        const target = reqDocs.find((d) => d.id === req.body.requiredDocId);
        if (target) {
          const ext = (req.file.originalname.split(".").pop() || "").toLowerCase();
          const allowed = target.acceptedFormats.map((f) => f.toLowerCase());
          const extOk = allowed.includes(ext) || (ext === "jpeg" && allowed.includes("jpg"));
          if (!extOk) {
            return res.status(400).json({ error: `Format non accepté pour cette pièce. Formats possibles : ${allowed.join(", ").toUpperCase()}.` });
          }
          if (req.file.size > target.maxSizeMb * 1024 * 1024) {
            return res.status(400).json({ error: `Ce fichier dépasse ${target.maxSizeMb} Mo.` });
          }
        }
      }

      // Build safe filename: timestamp + sanitised original name
      const safeOriginal = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filename = `${Date.now()}-${safeOriginal}`;
      const reference = dossier.reference; // e.g. DOCU_4568B0

      // Create directory uploads/{reference}/ if needed
      const dir = path.join(UPLOADS_ROOT, reference);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      // Write file to disk
      const filePath = path.join(dir, filename);
      fs.writeFileSync(filePath, req.file.buffer);

      // Store metadata in DB (no base64 — filePath points to disk)
      const fileRecord = await storage.createFileUpload({
        applicationId: req.params.id,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        data: "",
        filePath: filePath,
        uploadedBy: req.session.userId!,
      });

      const fileUrl = `/file/${reference}/${filename}`;
      res.status(201).json({ fileId: fileRecord.id, fileUrl, originalName: req.file.originalname });
    }
  );

  // Serve files stored on disk — /file/{reference}/{filename}
  // Auth required: citizen sees only their own files, agents see all
  app.get("/file/:reference/:filename", requireAuth, async (req: Request, res: Response) => {
    const { reference, filename } = req.params;
    const isAgent = ["agent", "admin", "super_admin"].includes(req.session.role || "");

    // For citizens, verify they own a dossier with this reference
    if (!isAgent) {
      const app_ = await storage.getApplicationByReference(reference);
      if (!app_ || app_.userId !== req.session.userId) {
        return res.status(403).json({ error: "Accès refusé" });
      }
    }

    const filePath = path.join(UPLOADS_ROOT, reference, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Fichier introuvable" });

    // Determine mime type from extension
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".pdf": "application/pdf",
      ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
    };
    const mimeType = mimeTypes[ext] || "application/octet-stream";

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(filename)}"`);
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.sendFile(filePath);
  });

  // Legacy route — serve old base64 files still stored in PostgreSQL
  app.get("/api/files/:id", requireAuth, async (req: Request, res: Response) => {
    const fileRecord = await storage.getFileUpload(req.params.id);
    if (!fileRecord) return res.status(404).json({ error: "Fichier introuvable" });

    const isAgent = ["agent", "admin", "super_admin"].includes(req.session.role || "");
    if (!isAgent) {
      const dossier = await storage.getApplication(fileRecord.applicationId);
      if (!dossier || dossier.userId !== req.session.userId) {
        return res.status(403).json({ error: "Accès refusé" });
      }
    }

    // New files: serve from disk via filePath
    if (fileRecord.filePath && fs.existsSync(fileRecord.filePath)) {
      res.setHeader("Content-Type", fileRecord.mimeType);
      res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(fileRecord.originalName)}"`);
      res.setHeader("Cache-Control", "private, max-age=3600");
      return res.sendFile(fileRecord.filePath);
    }

    // Legacy: serve from base64 data
    if (!fileRecord.data) return res.status(404).json({ error: "Fichier introuvable" });
    const buffer = Buffer.from(fileRecord.data, "base64");
    res.setHeader("Content-Type", fileRecord.mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(fileRecord.originalName)}"`);
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.send(buffer);
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
      const note = typeof req.body.note === "string" ? req.body.note.trim().slice(0, 1000) : "";
      if (!APPLICATION_STATUSES.includes(status)) return res.status(400).json({ error: "Statut inconnu" });
      if (status === "pending_user_action" && !note) {
        return res.status(400).json({ error: "Précisez au citoyen ce qu'il doit corriger." });
      }
      const dossier = await storage.getApplication(req.params.id);
      if (!dossier) return res.status(404).json({ error: "Dossier introuvable" });

      await storage.updateApplication(req.params.id, { status, statusNote: note || null });

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
        message: note
          ? `Votre dossier ${dossier.reference} est maintenant « ${STATUS_LABELS[status]} » : ${note}`
          : `Votre dossier ${dossier.reference} est maintenant « ${STATUS_LABELS[status]} ».`,
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
      if (!["submitted", "approved", "rejected", "replacement_requested"].includes(status)) {
        return res.status(400).json({ error: "Statut de pièce inconnu" });
      }
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
      const parsed = procedurePayloadSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Champs invalides : " + parsed.error.issues.map((i) => i.path.join(".")).join(", ") });
      const data = parsed.data;
      const slug = slugify(data.title);
      const existing = await db.select().from(procedures).where(eq(procedures.slug, slug));
      if (existing.length > 0) {
        return res.status(400).json({ error: "Une démarche avec ce titre existe déjà" });
      }

      const [procedure] = await db.insert(procedures).values({
        ...data,
        slug,
        status: data.status || "coming_soon",
        editorialStatus: data.editorialStatus || "draft",
        isActive: data.isActive ?? true,
        icon: data.icon || "FileText",
        verifiedAt: data.verifiedAt ? new Date(data.verifiedAt) : null,
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
      res.status(500).json({ error: "Erreur lors de la création de la démarche" });
    }
  });

  app.patch("/api/admin/procedures/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const parsed = procedurePayloadSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Champs invalides : " + parsed.error.issues.map((i) => i.path.join(".")).join(", ") });
      const data = parsed.data;
      const [before] = await db.select().from(procedures).where(eq(procedures.id, req.params.id));
      if (!before) return res.status(404).json({ error: "Démarche introuvable" });

      const [procedure] = await db
        .update(procedures)
        .set({
          ...data,
          verifiedAt: data.verifiedAt === undefined ? undefined : data.verifiedAt ? new Date(data.verifiedAt) : null,
          updatedAt: new Date(),
        })
        .where(eq(procedures.id, req.params.id))
        .returning();

      await storage.createActivityLog({
        actorId: req.session.userId!,
        action: "procedure_update",
        entityType: "procedure",
        entityId: procedure.id,
        oldValue: before.editorialStatus,
        newValue: procedure.editorialStatus === before.editorialStatus ? procedure.title : procedure.editorialStatus,
      });

      res.json(procedure);
    } catch (_error) {
      res.status(500).json({ error: "Erreur lors de la mise à jour de la démarche" });
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
    await storage.markNotificationAsRead(req.params.id, req.session.userId!);
    res.json({ success: true });
  });

  app.post("/api/notifications/read-all", requireAuth, async (req: Request, res: Response) => {
    await storage.markAllNotificationsAsRead(req.session.userId!);
    res.json({ success: true });
  });

  // ============ MES DOCUMENTS ============

  // Every file the citizen has attached to one of their dossiers.
  app.get("/api/documents/me", requireAuth, async (req: Request, res: Response) => {
    const apps = await storage.getApplicationsByUser(req.session.userId!);
    const rows = [];
    for (const a of apps) {
      const proc = await storage.getProcedure(a.procedureId);
      const required = await storage.getProcedureRequiredDocs(a.procedureId);
      const docs = await storage.getApplicationDocuments(a.id);
      for (const d of docs) {
        rows.push({
          ...d,
          documentName: required.find((r) => r.id === d.requiredDocId)?.name ?? d.originalName,
          application: { id: a.id, reference: a.reference, status: a.status },
          procedureTitle: proc?.title,
        });
      }
    }
    res.json(rows);
  });

  // Unknown API routes must not fall through to the web app.
  app.all("/api/*", (_req: Request, res: Response) => {
    res.status(404).json({ error: "Route inconnue" });
  });

  return httpServer;
}
