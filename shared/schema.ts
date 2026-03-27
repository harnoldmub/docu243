import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// --- Users & Roles ---
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prenom: text("prenom").notNull(),
  nom: text("nom").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("citizen"), // citizen, agent, admin, super_admin
  institution: text("institution"), // For agents
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// --- Procedures (Definitions) ---
export const procedures = pgTable("procedures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  category: text("category").notNull(), // civil, identity, property, etc.
  institution: text("institution").notNull(),
  estimatedDays: integer("estimated_days").notNull(),
  cost: integer("cost").notNull(), // in USD
  status: text("status").notNull().default("available"), // available, coming_soon
  isActive: boolean("is_active").notNull().default(true),
  icon: text("icon").notNull().default("FileText"),
  isPriority: boolean("is_priority").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(99),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProcedureSchema = createInsertSchema(procedures).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Procedure = typeof procedures.$inferSelect;

// --- Procedure Dynamic Fields ---
export const procedureFields = pgTable("procedure_fields", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  procedureId: varchar("procedure_id").notNull(),
  label: text("label").notNull(),
  type: text("type").notNull(), // text, number, date, select, textarea
  required: boolean("required").notNull().default(true),
  options: jsonb("options"), // For selects
  order: integer("order").notNull().default(0),
});

export const insertProcedureFieldSchema = createInsertSchema(procedureFields).omit({
  id: true,
});

export type ProcedureField = typeof procedureFields.$inferSelect;

// --- Procedure Required Documents ---
export const procedureRequiredDocuments = pgTable("procedure_required_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  procedureId: varchar("procedure_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  required: boolean("required").notNull().default(true),
  acceptedFormats: text("accepted_formats").array().notNull(), // pdf, jpg, png
  maxSizeMb: integer("max_size_mb").notNull().default(5),
  order: integer("order").notNull().default(0),
});

export const insertProcedureRequiredDocSchema = createInsertSchema(procedureRequiredDocuments).omit({
  id: true,
});

export type ProcedureRequiredDoc = typeof procedureRequiredDocuments.$inferSelect;

// --- Applications (Submission instances) ---
export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reference: text("reference").notNull().unique(), // e.g., DOC-2024-ABCDE
  userId: varchar("user_id").notNull(),
  procedureId: varchar("procedure_id").notNull(),
  status: text("status").notNull().default("draft"), // draft, submitted, received, under_review, pending_user_action, pending_payment, approved, rejected, ready, delivered
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  reference: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applications.$inferSelect;

// --- Application Field Values ---
export const applicationFieldValues = pgTable("application_field_values", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull(),
  fieldId: varchar("field_id").notNull(),
  value: text("value").notNull(),
});

export type ApplicationFieldValue = typeof applicationFieldValues.$inferSelect;

// --- Application Documents ---
export const applicationDocuments = pgTable("application_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull(),
  requiredDocId: varchar("required_doc_id").notNull(),
  fileUrl: text("file_url").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  status: text("status").notNull().default("submitted"), // submitted, approved, rejected, replacement_requested
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type ApplicationDocument = typeof applicationDocuments.$inferSelect;

// --- File Uploads ---
// New uploads are saved to disk at uploads/{reference}/{filename}.
// The file_path column stores the absolute disk path; data column is kept for legacy base64 files.
export const fileUploads = pgTable("file_uploads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  data: text("data").default(""), // legacy base64 (kept for backward compat)
  filePath: text("file_path"),   // disk path for new uploads
  uploadedBy: varchar("uploaded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type FileUpload = typeof fileUploads.$inferSelect;

// --- Payments ---
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending"), // pending, succeeded, failed, refunded
  provider: text("provider").notNull(), // mpesa, airtel, orange
  transactionRef: text("transaction_reference"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Payment = typeof payments.$inferSelect;

// --- Notifications ---
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(), // application_update, payment_received, document_rejected, etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  readAt: timestamp("read_at"),
  metadata: jsonb("metadata"), // e.g., { applicationId: "..." }
  createdAt: timestamp("created_at").defaultNow(),
});

export type Notification = typeof notifications.$inferSelect;

// --- Activity Logs ---
export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actorId: varchar("actor_id").notNull(),
  action: text("action").notNull(), // submit, approve_doc, reject_doc, change_status
  entityType: text("entity_type").notNull(), // application, document, procedure
  entityId: varchar("entity_id").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
