import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Citizen Identity with trust levels
export const citizens = pgTable("citizens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nom: text("nom").notNull(),
  postNom: text("post_nom").notNull(),
  prenom: text("prenom").notNull(),
  nationalId: text("national_id").notNull().unique(),
  phoneNumber: text("phone_number").notNull(),
  trustLevel: integer("trust_level").notNull().default(1), // 1, 2, or 3
  confidenceIndex: integer("confidence_index").notNull().default(0), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCitizenSchema = createInsertSchema(citizens).omit({
  id: true,
  createdAt: true,
});

export type InsertCitizen = z.infer<typeof insertCitizenSchema>;
export type Citizen = typeof citizens.$inferSelect;

// Administrative Services
export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  authority: text("authority").notNull(),
  requiredDocuments: text("required_documents").array().notNull(),
  price: integer("price").notNull(), // in CDF (Congolese Franc)
  processingTimeDays: integer("processing_time_days").notNull(),
  category: text("category").notNull(),
  icon: text("icon").notNull(),
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
});

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

// Document Requests (Workflow)
export const documentRequests = pgTable("document_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  citizenId: varchar("citizen_id").notNull(),
  serviceId: varchar("service_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, payment, processing, signature, ready, delivered, rejected
  trackingCode: text("tracking_code").notNull().unique(),
  submittedDocuments: text("submitted_documents").array(),
  paymentStatus: text("payment_status").notNull().default("unpaid"), // unpaid, pending, paid, failed
  paymentReference: text("payment_reference"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDocumentRequestSchema = createInsertSchema(documentRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDocumentRequest = z.infer<typeof insertDocumentRequestSchema>;
export type DocumentRequest = typeof documentRequests.$inferSelect;

// Payments
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentRequestId: varchar("document_request_id").notNull(),
  amount: integer("amount").notNull(),
  provider: text("provider").notNull(), // mpesa, airtel, orange
  phoneNumber: text("phone_number").notNull(),
  status: text("status").notNull().default("initiated"), // initiated, pending, confirmed, failed
  transactionId: text("transaction_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// Audit Log for traceability
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actorId: varchar("actor_id").notNull(),
  action: text("action").notNull(),
  resource: text("resource").notNull(),
  resourceId: varchar("resource_id"),
  details: text("details"),
  hash: text("hash").notNull(), // SHA-256 for blockchain-like traceability
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// USSD Session for simulation
export const ussdSessions = pgTable("ussd_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  msisdn: text("msisdn").notNull(),
  currentMenu: text("current_menu").notNull().default("main"),
  sessionData: text("session_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUssdSessionSchema = createInsertSchema(ussdSessions).omit({
  id: true,
  createdAt: true,
});

export type InsertUssdSession = z.infer<typeof insertUssdSessionSchema>;
export type UssdSession = typeof ussdSessions.$inferSelect;

// Admin/Staff users for backend management
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("staff"), // admin, staff
  fullName: text("full_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
