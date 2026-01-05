import {
  users,
  citizens,
  services,
  documentRequests,
  payments,
  auditLogs,
  type User,
  type InsertUser,
  type Citizen,
  type InsertCitizen,
  type Service,
  type InsertService,
  type DocumentRequest,
  type InsertDocumentRequest,
  type Payment,
  type InsertPayment,
  type AuditLog,
  type InsertAuditLog,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { createHash, randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Citizens
  getCitizen(id: string): Promise<Citizen | undefined>;
  getCitizenByNationalId(nationalId: string): Promise<Citizen | undefined>;
  getCitizenByPhone(phoneNumber: string): Promise<Citizen | undefined>;
  createCitizen(citizen: InsertCitizen): Promise<Citizen>;
  updateCitizen(id: string, updates: Partial<Citizen>): Promise<Citizen | undefined>;

  // Services
  getAllServices(): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;

  // Document Requests
  getDocumentRequest(id: string): Promise<DocumentRequest | undefined>;
  getDocumentRequestByTrackingCode(trackingCode: string): Promise<DocumentRequest | undefined>;
  getDocumentRequestsByCitizen(citizenId: string): Promise<DocumentRequest[]>;
  getAllDocumentRequests(): Promise<DocumentRequest[]>;
  createDocumentRequest(request: InsertDocumentRequest): Promise<DocumentRequest>;
  updateDocumentRequest(id: string, updates: Partial<DocumentRequest>): Promise<DocumentRequest | undefined>;

  // Payments
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentsByRequest(documentRequestId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined>;

  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(resourceId?: string): Promise<AuditLog[]>;
}

// Database storage implementation using Drizzle ORM
export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Citizens
  async getCitizen(id: string): Promise<Citizen | undefined> {
    const [citizen] = await db.select().from(citizens).where(eq(citizens.id, id));
    return citizen || undefined;
  }

  async getCitizenByNationalId(nationalId: string): Promise<Citizen | undefined> {
    const [citizen] = await db.select().from(citizens).where(eq(citizens.nationalId, nationalId));
    return citizen || undefined;
  }

  async getCitizenByPhone(phoneNumber: string): Promise<Citizen | undefined> {
    const [citizen] = await db.select().from(citizens).where(eq(citizens.phoneNumber, phoneNumber));
    return citizen || undefined;
  }

  async createCitizen(insertCitizen: InsertCitizen): Promise<Citizen> {
    const [citizen] = await db.insert(citizens).values(insertCitizen).returning();
    return citizen;
  }

  async updateCitizen(id: string, updates: Partial<Citizen>): Promise<Citizen | undefined> {
    const [citizen] = await db
      .update(citizens)
      .set(updates)
      .where(eq(citizens.id, id))
      .returning();
    return citizen || undefined;
  }

  // Services
  async getAllServices(): Promise<Service[]> {
    return db.select().from(services);
  }

  async getService(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service || undefined;
  }

  async createService(insertService: InsertService): Promise<Service> {
    const [service] = await db.insert(services).values(insertService).returning();
    return service;
  }

  // Document Requests
  async getDocumentRequest(id: string): Promise<DocumentRequest | undefined> {
    const [request] = await db.select().from(documentRequests).where(eq(documentRequests.id, id));
    return request || undefined;
  }

  async getDocumentRequestByTrackingCode(trackingCode: string): Promise<DocumentRequest | undefined> {
    const [request] = await db
      .select()
      .from(documentRequests)
      .where(eq(documentRequests.trackingCode, trackingCode));
    return request || undefined;
  }

  async getDocumentRequestsByCitizen(citizenId: string): Promise<DocumentRequest[]> {
    return db.select().from(documentRequests).where(eq(documentRequests.citizenId, citizenId));
  }

  async getAllDocumentRequests(): Promise<DocumentRequest[]> {
    return db.select().from(documentRequests).orderBy(documentRequests.createdAt);
  }

  async createDocumentRequest(insertRequest: InsertDocumentRequest): Promise<DocumentRequest> {
    const [request] = await db.insert(documentRequests).values(insertRequest).returning();
    return request;
  }

  async updateDocumentRequest(
    id: string,
    updates: Partial<DocumentRequest>
  ): Promise<DocumentRequest | undefined> {
    const [request] = await db
      .update(documentRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(documentRequests.id, id))
      .returning();
    return request || undefined;
  }

  // Payments
  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async getPaymentsByRequest(documentRequestId: string): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.documentRequestId, documentRequestId));
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(insertPayment).returning();
    return payment;
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    const [payment] = await db
      .update(payments)
      .set(updates)
      .where(eq(payments.id, id))
      .returning();
    return payment || undefined;
  }

  // Audit Logs
  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values(insertLog).returning();
    return log;
  }

  async getAuditLogs(resourceId?: string): Promise<AuditLog[]> {
    if (resourceId) {
      return db.select().from(auditLogs).where(eq(auditLogs.resourceId, resourceId));
    }
    return db.select().from(auditLogs);
  }
}

// Helper function to generate tracking code
export function generateTrackingCode(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `DOC-${year}-${random}`;
}

// Helper function to generate audit hash (blockchain-like)
export function generateAuditHash(data: object): string {
  const content = JSON.stringify(data) + Date.now();
  return createHash("sha256").update(content).digest("hex");
}

export const storage = new DatabaseStorage();
