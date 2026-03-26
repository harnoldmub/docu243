import { pool } from "./db";
import { seedCatalog } from "./seed";

function log(msg: string) {
  const t = new Date().toLocaleTimeString("fr-FR");
  console.log(`${t} [init] ${msg}`);
}

async function ensureTablesExist() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        prenom text NOT NULL DEFAULT '',
        nom text NOT NULL DEFAULT '',
        email text NOT NULL DEFAULT '' UNIQUE,
        phone text NOT NULL DEFAULT '',
        password text NOT NULL,
        role text NOT NULL DEFAULT 'citizen',
        institution text,
        status text NOT NULL DEFAULT 'active',
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now(),
        username text,
        full_name text
      );

      CREATE TABLE IF NOT EXISTS procedures (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        slug text NOT NULL UNIQUE,
        description text NOT NULL,
        category text NOT NULL,
        institution text NOT NULL,
        estimated_days integer NOT NULL,
        cost integer NOT NULL,
        status text NOT NULL DEFAULT 'available',
        is_active boolean NOT NULL DEFAULT true,
        icon text NOT NULL DEFAULT 'FileText',
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS procedure_fields (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        procedure_id varchar NOT NULL,
        label text NOT NULL,
        type text NOT NULL,
        required boolean NOT NULL DEFAULT true,
        options jsonb,
        "order" integer NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS procedure_required_documents (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        procedure_id varchar NOT NULL,
        name text NOT NULL,
        description text NOT NULL,
        required boolean NOT NULL DEFAULT true,
        accepted_formats text[] NOT NULL,
        max_size_mb integer NOT NULL DEFAULT 5,
        "order" integer NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS applications (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        reference text NOT NULL UNIQUE,
        user_id varchar NOT NULL,
        procedure_id varchar NOT NULL,
        status text NOT NULL DEFAULT 'draft',
        submitted_at timestamp,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS application_field_values (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id varchar NOT NULL,
        field_id varchar NOT NULL,
        value text NOT NULL
      );

      CREATE TABLE IF NOT EXISTS application_documents (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id varchar NOT NULL,
        required_doc_id varchar NOT NULL,
        file_url text NOT NULL,
        original_name text NOT NULL,
        mime_type text NOT NULL,
        size integer NOT NULL,
        status text NOT NULL DEFAULT 'submitted',
        rejection_reason text,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS payments (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id varchar NOT NULL,
        amount integer NOT NULL,
        status text NOT NULL DEFAULT 'pending',
        provider text NOT NULL,
        transaction_reference text,
        paid_at timestamp,
        created_at timestamp DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar NOT NULL,
        type text NOT NULL,
        title text NOT NULL,
        message text NOT NULL,
        read_at timestamp,
        metadata jsonb,
        created_at timestamp DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS activity_logs (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_id varchar NOT NULL,
        action text NOT NULL,
        entity_type text NOT NULL,
        entity_id varchar NOT NULL,
        old_value text,
        new_value text,
        created_at timestamp DEFAULT now()
      );
    `);
  } finally {
    client.release();
  }
}

async function hasProcedures(): Promise<boolean> {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query("SELECT COUNT(*) FROM procedures");
      return parseInt(result.rows[0].count, 10) > 0;
    } finally {
      client.release();
    }
  } catch {
    return false;
  }
}

export async function initializeDatabase() {
  try {
    log("Checking database schema...", "init");
    await ensureTablesExist();
    log("Database tables ready.", "init");

    const seeded = await hasProcedures();
    if (!seeded) {
      log("Seeding initial catalog and admin user...", "init");
      const result = await seedCatalog();
      log(
        `Catalog seeded: ${result.total} procedures (${result.available} available, ${result.comingSoon} coming soon).`,
        "init"
      );
    } else {
      log("Catalog already seeded, skipping.", "init");
    }
  } catch (err) {
    log(`Database initialization error: ${(err as Error).message}`, "init");
    throw err;
  }
}
