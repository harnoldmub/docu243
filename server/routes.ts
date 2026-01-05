import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage, generateTrackingCode, generateAuditHash } from "./storage";
import { insertCitizenSchema, insertServiceSchema, insertPaymentSchema } from "@shared/schema";
import bcrypt from "bcrypt";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    role?: string;
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Non autorisé" });
  }
  if (req.session.role !== "admin" && req.session.role !== "staff") {
    return res.status(403).json({ error: "Accès refusé" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ============ SERVICES API ============
  
  // Get all services
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getAllServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });

  // Get single service
  app.get("/api/services/:id", async (req, res) => {
    try {
      const service = await storage.getService(req.params.id);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Error fetching service:", error);
      res.status(500).json({ error: "Failed to fetch service" });
    }
  });

  // ============ DOCUMENT REQUESTS API ============

  // Create document request
  app.post("/api/requests", async (req, res) => {
    try {
      const { nom, postNom, prenom, nationalId, phoneNumber, serviceId } = req.body;

      // Validate service exists
      const service = await storage.getService(serviceId);
      if (!service) {
        return res.status(400).json({ error: "Service not found" });
      }

      // Find or create citizen
      let citizen = await storage.getCitizenByNationalId(nationalId);
      if (!citizen) {
        citizen = await storage.createCitizen({
          nom,
          postNom,
          prenom,
          nationalId,
          phoneNumber,
          trustLevel: 1,
          confidenceIndex: 25,
        });
      }

      // Create document request
      const trackingCode = generateTrackingCode();
      const documentRequest = await storage.createDocumentRequest({
        citizenId: citizen.id,
        serviceId,
        trackingCode,
        status: "pending",
        paymentStatus: "unpaid",
        submittedDocuments: [],
      });

      // Create audit log
      await storage.createAuditLog({
        actorId: citizen.id,
        action: "CREATE_REQUEST",
        resource: "document_request",
        resourceId: documentRequest.id,
        details: `Created request for service: ${service.name}`,
        hash: generateAuditHash({ citizenId: citizen.id, serviceId, trackingCode }),
      });

      res.status(201).json({
        ...documentRequest,
        trackingCode,
      });
    } catch (error) {
      console.error("Error creating request:", error);
      res.status(500).json({ error: "Failed to create request" });
    }
  });

  // Get document request by ID
  app.get("/api/requests/:id", async (req, res) => {
    try {
      const request = await storage.getDocumentRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error("Error fetching request:", error);
      res.status(500).json({ error: "Failed to fetch request" });
    }
  });

  // Update document request status (workflow progression)
  app.patch("/api/requests/:id/status", async (req, res) => {
    try {
      const { status, rejectionReason } = req.body;
      const validStatuses = ["pending", "payment", "processing", "signature", "ready", "delivered", "rejected"];
      
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const existingRequest = await storage.getDocumentRequest(req.params.id);
      if (!existingRequest) {
        return res.status(404).json({ error: "Request not found" });
      }

      const updates: any = { status };
      if (status === "rejected" && rejectionReason) {
        updates.rejectionReason = rejectionReason;
      }

      const updated = await storage.updateDocumentRequest(req.params.id, updates);

      // Create audit log for status change
      await storage.createAuditLog({
        actorId: "system",
        action: "STATUS_UPDATE",
        resource: "document_request",
        resourceId: req.params.id,
        details: `Status changed from ${existingRequest.status} to ${status}`,
        hash: generateAuditHash({ requestId: req.params.id, oldStatus: existingRequest.status, newStatus: status }),
      });

      res.json(updated);
    } catch (error) {
      console.error("Error updating request status:", error);
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  // Get citizen requests (for account page)
  app.get("/api/citizens/:nationalId/requests", async (req, res) => {
    try {
      const citizen = await storage.getCitizenByNationalId(req.params.nationalId);
      if (!citizen) {
        return res.status(404).json({ error: "Citizen not found" });
      }

      const requests = await storage.getDocumentRequestsByCitizen(citizen.id);
      
      // Enrich with service details
      const enrichedRequests = await Promise.all(
        requests.map(async (request) => {
          const service = await storage.getService(request.serviceId);
          return { ...request, service };
        })
      );

      res.json({ citizen, requests: enrichedRequests });
    } catch (error) {
      console.error("Error fetching citizen requests:", error);
      res.status(500).json({ error: "Failed to fetch citizen requests" });
    }
  });

  // ============ TRACKING API ============

  // Track document by code
  app.get("/api/tracking/:code", async (req, res) => {
    try {
      const request = await storage.getDocumentRequestByTrackingCode(req.params.code);
      if (!request) {
        return res.status(404).json({ error: "Tracking code not found" });
      }

      // Get associated service
      const service = await storage.getService(request.serviceId);

      res.json({
        ...request,
        service,
      });
    } catch (error) {
      console.error("Error tracking request:", error);
      res.status(500).json({ error: "Failed to track request" });
    }
  });

  // ============ PAYMENTS API ============

  // Initiate payment
  app.post("/api/payments/initiate", async (req, res) => {
    try {
      const { documentRequestId, provider, phoneNumber, amount } = req.body;

      // Validate document request exists
      const docRequest = await storage.getDocumentRequest(documentRequestId);
      if (!docRequest && documentRequestId !== "demo-request") {
        return res.status(400).json({ error: "Document request not found" });
      }

      const payment = await storage.createPayment({
        documentRequestId,
        provider,
        phoneNumber,
        amount,
        status: "pending",
      });

      // For MVP simulation: immediately process payment and update status
      // In production, this would be handled by Mobile Money API callback
      const transactionId = `TXN-${Date.now()}`;
      
      await storage.updatePayment(payment.id, {
        status: "confirmed",
        transactionId,
      });

      // Update document request if it exists
      if (docRequest) {
        await storage.updateDocumentRequest(documentRequestId, {
          paymentStatus: "paid",
          paymentReference: payment.id,
          status: "processing",
        });
      }

      // Create audit log
      await storage.createAuditLog({
        actorId: "system",
        action: "PAYMENT_CONFIRMED",
        resource: "payment",
        resourceId: payment.id,
        details: `Payment of ${amount} CDF confirmed via ${provider}`,
        hash: generateAuditHash({ paymentId: payment.id, amount, provider }),
      });

      res.status(201).json({
        ...payment,
        status: "confirmed",
        transactionId,
      });
    } catch (error) {
      console.error("Error initiating payment:", error);
      res.status(500).json({ error: "Failed to initiate payment" });
    }
  });

  // Confirm payment (webhook simulation)
  app.post("/api/payments/confirm", async (req, res) => {
    try {
      const { paymentId, transactionId } = req.body;

      const payment = await storage.updatePayment(paymentId, {
        status: "confirmed",
        transactionId,
      });

      if (payment) {
        await storage.updateDocumentRequest(payment.documentRequestId, {
          paymentStatus: "paid",
          paymentReference: paymentId,
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });

  // ============ USSD SIMULATION API ============

  // USSD endpoint
  app.post("/api/ussd", async (req, res) => {
    try {
      const { msisdn, input } = req.body;

      // Simple USSD menu simulation
      let response = "";
      const parts = input ? input.split("*") : [];

      if (!input || input === "") {
        response = `CON Bienvenue sur DOCU243
1. Suivi de dossier
2. Paiement
3. Duplicata`;
      } else if (parts[0] === "1") {
        if (parts.length === 1) {
          response = `CON Entrez votre code de suivi:`;
        } else {
          const trackingCode = parts[1];
          const request = await storage.getDocumentRequestByTrackingCode(trackingCode);
          if (request) {
            const statusLabels: Record<string, string> = {
              pending: "En attente",
              payment: "Paiement requis",
              processing: "En traitement",
              signature: "En signature",
              ready: "Pret au retrait",
              delivered: "Livre",
              rejected: "Rejete",
            };
            response = `END Dossier: ${trackingCode}
Statut: ${statusLabels[request.status] || request.status}
Paiement: ${request.paymentStatus === "paid" ? "OK" : "En attente"}`;
          } else {
            response = `END Code non trouve: ${trackingCode}`;
          }
        }
      } else if (parts[0] === "2") {
        response = `END Service de paiement
Veuillez utiliser l'application web pour le paiement.`;
      } else if (parts[0] === "3") {
        response = `END Demande de duplicata
Veuillez vous rendre au bureau le plus proche.`;
      } else {
        response = `END Option invalide`;
      }

      res.json({ response });
    } catch (error) {
      console.error("USSD error:", error);
      res.json({ response: "END Erreur systeme. Reessayez plus tard." });
    }
  });

  // ============ CITIZENS API ============

  // Get citizen by national ID
  app.get("/api/citizens/:nationalId", async (req, res) => {
    try {
      const citizen = await storage.getCitizenByNationalId(req.params.nationalId);
      if (!citizen) {
        return res.status(404).json({ error: "Citizen not found" });
      }
      res.json(citizen);
    } catch (error) {
      console.error("Error fetching citizen:", error);
      res.status(500).json({ error: "Failed to fetch citizen" });
    }
  });

  // ============ SEED DATA ============
  
  // Seed initial services
  app.post("/api/seed", async (req, res) => {
    try {
      const existingServices = await storage.getAllServices();
      if (existingServices.length > 0) {
        return res.json({ message: "Services already seeded", count: existingServices.length });
      }

      const initialServices = [
        {
          name: "Passeport Biométrique",
          description: "Demande ou renouvellement de passeport biométrique congolais",
          authority: "Direction Générale de Migration",
          requiredDocuments: ["Carte d'identité nationale", "Acte de naissance", "Photos d'identité (4x)"],
          price: 185000,
          processingTimeDays: 14,
          category: "identite",
          icon: "passport",
        },
        {
          name: "Acte de Naissance",
          description: "Copie intégrale ou extrait d'acte de naissance",
          authority: "État Civil",
          requiredDocuments: ["Carte d'identité du demandeur", "Livret de famille (si disponible)"],
          price: 15000,
          processingTimeDays: 7,
          category: "etat-civil",
          icon: "birth",
        },
        {
          name: "Acte de Mariage",
          description: "Certificat officiel de mariage",
          authority: "État Civil",
          requiredDocuments: ["Cartes d'identité des époux", "Actes de naissance des époux"],
          price: 25000,
          processingTimeDays: 5,
          category: "etat-civil",
          icon: "marriage",
        },
        {
          name: "Permis de Conduire",
          description: "Demande ou renouvellement de permis de conduire",
          authority: "Direction des Transports Routiers",
          requiredDocuments: ["Carte d'identité nationale", "Certificat médical", "Photos d'identité (2x)"],
          price: 75000,
          processingTimeDays: 21,
          category: "transport",
          icon: "driver",
        },
        {
          name: "Attestation de Diplôme",
          description: "Authentification et attestation de diplôme national",
          authority: "Ministère de l'Éducation",
          requiredDocuments: ["Original du diplôme", "Carte d'identité nationale"],
          price: 35000,
          processingTimeDays: 10,
          category: "education",
          icon: "education",
        },
        {
          name: "Casier Judiciaire",
          description: "Extrait du casier judiciaire (Bulletin n°3)",
          authority: "Ministère de la Justice",
          requiredDocuments: ["Carte d'identité nationale", "Justificatif de domicile"],
          price: 20000,
          processingTimeDays: 7,
          category: "justice",
          icon: "legal",
        },
        {
          name: "Registre de Commerce",
          description: "Inscription au registre de commerce et du crédit mobilier",
          authority: "Tribunal de Commerce",
          requiredDocuments: ["Statuts de l'entreprise", "Carte d'identité du gérant", "Preuve d'adresse du siège"],
          price: 150000,
          processingTimeDays: 14,
          category: "commerce",
          icon: "business",
        },
        {
          name: "Certificat de Résidence",
          description: "Attestation officielle de résidence",
          authority: "Commune",
          requiredDocuments: ["Carte d'identité nationale", "Facture de service (eau/électricité)"],
          price: 10000,
          processingTimeDays: 3,
          category: "etat-civil",
          icon: "default",
        },
      ];

      for (const service of initialServices) {
        await storage.createService(service);
      }

      res.json({ message: "Services seeded successfully", count: initialServices.length });
    } catch (error) {
      console.error("Error seeding data:", error);
      res.status(500).json({ error: "Failed to seed data" });
    }
  });

  // ============ AUTHENTICATION API ============

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Nom d'utilisateur et mot de passe requis" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Identifiants invalides" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Identifiants invalides" });
      }

      req.session.userId = user.id;
      req.session.role = user.role;

      await storage.createAuditLog({
        actorId: user.id,
        action: "LOGIN",
        resource: "user",
        resourceId: user.id,
        details: `User ${user.username} logged in`,
        hash: generateAuditHash({ userId: user.id, action: "login" }),
      });

      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ error: "Erreur de connexion" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Erreur de déconnexion" });
      }
      res.json({ message: "Déconnecté avec succès" });
    });
  });

  // Get current user
  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non connecté" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ error: "Utilisateur non trouvé" });
      }

      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Create admin user (protected - only existing admins can create new users)
  app.post("/api/auth/register", requireAdmin, async (req, res) => {
    try {
      const { username, password, fullName, role } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Nom d'utilisateur et mot de passe requis" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Ce nom d'utilisateur existe déjà" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        fullName: fullName || null,
        role: role || "staff",
      });

      await storage.createAuditLog({
        actorId: req.session.userId!,
        action: "CREATE_USER",
        resource: "user",
        resourceId: user.id,
        details: `Created user ${user.username} with role ${user.role}`,
        hash: generateAuditHash({ userId: user.id, createdBy: req.session.userId }),
      });

      res.status(201).json({
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Erreur lors de la création de l'utilisateur" });
    }
  });

  // ============ ADMIN API ============

  // Get all document requests (admin)
  app.get("/api/admin/requests", requireAdmin, async (req, res) => {
    try {
      const requests = await storage.getAllDocumentRequests();
      
      // Enrich with citizen and service info
      const enrichedRequests = await Promise.all(
        requests.map(async (request) => {
          const citizen = await storage.getCitizen(request.citizenId);
          const service = await storage.getService(request.serviceId);
          return {
            ...request,
            citizen: citizen ? {
              nom: citizen.nom,
              postNom: citizen.postNom,
              prenom: citizen.prenom,
              nationalId: citizen.nationalId,
              phoneNumber: citizen.phoneNumber,
            } : null,
            service: service ? {
              name: service.name,
              authority: service.authority,
            } : null,
          };
        })
      );

      res.json(enrichedRequests);
    } catch (error) {
      console.error("Error fetching admin requests:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des demandes" });
    }
  });

  // Update request status (admin)
  app.patch("/api/admin/requests/:id/status", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const validStatuses = ["pending", "payment", "processing", "signature", "ready", "delivered", "rejected"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Statut invalide" });
      }

      const request = await storage.getDocumentRequest(id);
      if (!request) {
        return res.status(404).json({ error: "Demande non trouvée" });
      }

      const previousStatus = request.status;
      const updatedRequest = await storage.updateDocumentRequest(id, {
        status,
        notes: notes || request.notes,
      });

      await storage.createAuditLog({
        actorId: req.session.userId!,
        action: "UPDATE_STATUS",
        resource: "document_request",
        resourceId: id,
        details: `Status changed from ${previousStatus} to ${status}`,
        hash: generateAuditHash({ requestId: id, previousStatus, newStatus: status }),
      });

      res.json(updatedRequest);
    } catch (error) {
      console.error("Error updating request status:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour" });
    }
  });

  // Seed admin user
  app.post("/api/admin/seed", async (req, res) => {
    try {
      const existingAdmin = await storage.getUserByUsername("admin");
      if (existingAdmin) {
        return res.json({ message: "Admin user already exists" });
      }

      const hashedPassword = await bcrypt.hash("admin123", 10);
      await storage.createUser({
        username: "admin",
        password: hashedPassword,
        fullName: "Administrateur Système",
        role: "admin",
      });

      res.json({ message: "Admin user created", username: "admin", password: "admin123" });
    } catch (error) {
      console.error("Error seeding admin:", error);
      res.status(500).json({ error: "Failed to seed admin user" });
    }
  });

  return httpServer;
}
