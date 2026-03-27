import {
  users,
  procedures,
  procedureFields,
  procedureRequiredDocuments,
  applications,
  applicationFieldValues,
  applicationDocuments,
  fileUploads,
  payments,
  notifications,
  activityLogs,
  type User,
  type InsertUser,
  type Procedure,
  type ProcedureField,
  type ProcedureRequiredDoc,
  type Application,
  type InsertApplication,
  type FileUpload,
  type Payment,
  type Notification,
  type ActivityLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;

  // Procedures
  getAllProcedures(): Promise<Procedure[]>;
  getProcedure(id: string): Promise<Procedure | undefined>;
  getProcedureBySlug(slug: string): Promise<Procedure | undefined>;
  getProcedureFields(procedureId: string): Promise<ProcedureField[]>;
  getProcedureRequiredDocs(procedureId: string): Promise<ProcedureRequiredDoc[]>;

  // Applications
  getApplication(id: string): Promise<Application | undefined>;
  getApplicationByReference(reference: string): Promise<Application | undefined>;
  getApplicationsByUser(userId: string): Promise<Application[]>;
  getAllApplications(): Promise<Application[]>;
  createApplication(userId: string, procedureId: string): Promise<Application>;
  updateApplication(id: string, updates: Partial<Application>): Promise<Application | undefined>;

  // Application Data
  getApplicationFieldValues(applicationId: string): Promise<any[]>;
  getApplicationDocuments(applicationId: string): Promise<any[]>;
  setApplicationFieldValue(applicationId: string, fieldId: string, value: string): Promise<void>;
  addApplicationDocument(doc: any): Promise<any>;
  updateApplicationDocumentStatus(id: string, status: string, reason?: string): Promise<void>;

  // Payments
  getPaymentsByApplication(applicationId: string): Promise<any[]>;
  createPayment(payment: any): Promise<any>;
  updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined>;

  // Notifications
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  createNotification(notification: any): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;

  // File Uploads
  createFileUpload(file: Omit<FileUpload, "id" | "createdAt">): Promise<FileUpload>;
  getFileUpload(id: string): Promise<FileUpload | undefined>;
  getFileUploadsByApplication(applicationId: string): Promise<FileUpload[]>;

  // Activity Logs
  createActivityLog(log: any): Promise<ActivityLog>;
  getActivityLogs(entityId?: string): Promise<ActivityLog[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  // Procedures
  async getAllProcedures(): Promise<Procedure[]> {
    return db
      .select()
      .from(procedures)
      .where(eq(procedures.isActive, true))
      .orderBy(
        sql`case when ${procedures.status} = 'available' then 0 else 1 end`,
        asc(procedures.sortOrder),
        asc(procedures.estimatedDays),
        asc(procedures.title),
      );
  }

  async getProcedure(id: string): Promise<Procedure | undefined> {
    const [proc] = await db.select().from(procedures).where(eq(procedures.id, id));
    return proc || undefined;
  }

  async getProcedureBySlug(slug: string): Promise<Procedure | undefined> {
    const [proc] = await db.select().from(procedures).where(eq(procedures.slug, slug));
    return proc || undefined;
  }

  async getProcedureFields(procedureId: string): Promise<ProcedureField[]> {
    return db.select().from(procedureFields).where(eq(procedureFields.procedureId, procedureId)).orderBy(procedureFields.order);
  }

  async getProcedureRequiredDocs(procedureId: string): Promise<ProcedureRequiredDoc[]> {
    return db.select().from(procedureRequiredDocuments).where(eq(procedureRequiredDocuments.procedureId, procedureId)).orderBy(procedureRequiredDocuments.order);
  }

  // Applications
  async getApplication(id: string): Promise<Application | undefined> {
    const [app] = await db.select().from(applications).where(eq(applications.id, id));
    return app || undefined;
  }

  async getApplicationByReference(reference: string): Promise<Application | undefined> {
    const [app] = await db.select().from(applications).where(eq(applications.reference, reference));
    return app || undefined;
  }

  async getApplicationsByUser(userId: string): Promise<Application[]> {
    return db.select().from(applications).where(eq(applications.userId, userId)).orderBy(desc(applications.createdAt));
  }

  async getAllApplications(): Promise<Application[]> {
    return db.select().from(applications).orderBy(desc(applications.createdAt));
  }

  async createApplication(userId: string, procedureId: string): Promise<Application> {
    let reference = "";

    do {
      reference = `DOCU_${randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`;
    } while (await this.getApplicationByReference(reference));

    const [app] = await db.insert(applications).values({
      userId,
      procedureId,
      reference,
      status: "draft",
    }).returning();
    return app;
  }

  async updateApplication(id: string, updates: Partial<Application>): Promise<Application | undefined> {
    const [app] = await db
      .update(applications)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();
    return app || undefined;
  }

  // Application Data
  async getApplicationFieldValues(applicationId: string): Promise<any[]> {
    return db.select().from(applicationFieldValues).where(eq(applicationFieldValues.applicationId, applicationId));
  }

  async getApplicationDocuments(applicationId: string): Promise<any[]> {
    return db.select().from(applicationDocuments).where(eq(applicationDocuments.applicationId, applicationId));
  }

  async setApplicationFieldValue(applicationId: string, fieldId: string, value: string): Promise<void> {
    // Upsert logic
    const existing = await db.select().from(applicationFieldValues).where(
      and(eq(applicationFieldValues.applicationId, applicationId), eq(applicationFieldValues.fieldId, fieldId))
    );
    if (existing.length > 0) {
      await db.update(applicationFieldValues).set({ value }).where(eq(applicationFieldValues.id, existing[0].id));
    } else {
      await db.insert(applicationFieldValues).values({ applicationId, fieldId, value });
    }
  }

  async addApplicationDocument(doc: any): Promise<any> {
    const [newDoc] = await db.insert(applicationDocuments).values(doc).returning();
    return newDoc;
  }

  async updateApplicationDocumentStatus(id: string, status: string, reason?: string): Promise<void> {
    await db.update(applicationDocuments).set({ status, rejectionReason: reason || null, updatedAt: new Date() }).where(eq(applicationDocuments.id, id));
  }

  // Payments
  async getPaymentsByApplication(applicationId: string): Promise<any[]> {
    return db.select().from(payments).where(eq(payments.applicationId, applicationId));
  }

  async createPayment(payment: any): Promise<any> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    const [p] = await db.update(payments).set(updates).where(eq(payments.id, id)).returning();
    return p || undefined;
  }

  // Notifications
  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: any): Promise<Notification> {
    const [n] = await db.insert(notifications).values(notification).returning();
    return n;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db.update(notifications).set({ readAt: new Date() }).where(eq(notifications.id, id));
  }

  // File Uploads
  async createFileUpload(file: Omit<FileUpload, "id" | "createdAt">): Promise<FileUpload> {
    const [f] = await db.insert(fileUploads).values(file).returning();
    return f;
  }

  async getFileUpload(id: string): Promise<FileUpload | undefined> {
    const [f] = await db.select().from(fileUploads).where(eq(fileUploads.id, id));
    return f || undefined;
  }

  async getFileUploadsByApplication(applicationId: string): Promise<FileUpload[]> {
    return db.select().from(fileUploads).where(eq(fileUploads.applicationId, applicationId)).orderBy(desc(fileUploads.createdAt));
  }

  // Activity Logs
  async createActivityLog(log: any): Promise<ActivityLog> {
    const [l] = await db.insert(activityLogs).values(log).returning();
    return l;
  }

  async getActivityLogs(entityId?: string): Promise<ActivityLog[]> {
    if (entityId) {
      return db.select().from(activityLogs).where(eq(activityLogs.entityId, entityId)).orderBy(desc(activityLogs.createdAt));
    }
    return db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt));
  }
}

export const storage = new DatabaseStorage();
