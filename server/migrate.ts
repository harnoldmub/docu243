import type { PoolClient } from "pg";
import { pool } from "./db";
import { accentize } from "./accents";
import { catalog as seedCatalog } from "./seed";
import {
  existingContent,
  newProcedures,
  LEGACY_CATEGORY_MAP,
  SERVICE_FEES,
  DEFAULT_SERVICE_FEE,
  BASE_PRICES,
  DEFAULT_FIELDS,
  type ProcedureContent,
} from "./catalog-content";
import type { ProcedureGuide } from "@shared/schema";

function log(msg: string) {
  console.log(`${new Date().toLocaleTimeString("fr-FR")} [migrate] ${msg}`);
}

// Additive schema changes. Safe to run on every start.
const SCHEMA_SQL = `
  ALTER TABLE procedures ADD COLUMN IF NOT EXISTS is_priority boolean NOT NULL DEFAULT false;
  ALTER TABLE procedures ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 99;
  ALTER TABLE procedures ADD COLUMN IF NOT EXISTS currency text;
  ALTER TABLE procedures ADD COLUMN IF NOT EXISTS fee_status text NOT NULL DEFAULT 'unconfirmed';
  ALTER TABLE procedures ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'docu243';
  ALTER TABLE procedures ADD COLUMN IF NOT EXISTS external_url text;
  -- Rows that existed before the editorial workflow were already public.
  ALTER TABLE procedures ADD COLUMN IF NOT EXISTS editorial_status text NOT NULL DEFAULT 'published';
  ALTER TABLE procedures ALTER COLUMN editorial_status SET DEFAULT 'draft';
  ALTER TABLE procedures ADD COLUMN IF NOT EXISTS verified_at timestamp;
  ALTER TABLE procedures ADD COLUMN IF NOT EXISTS guide jsonb;

  ALTER TABLE procedures ADD COLUMN IF NOT EXISTS service_fee integer NOT NULL DEFAULT 20;

  ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency text;
  ALTER TABLE payments ADD COLUMN IF NOT EXISTS official_amount integer;
  ALTER TABLE payments ADD COLUMN IF NOT EXISTS service_fee integer;
  ALTER TABLE payments ADD COLUMN IF NOT EXISTS checkout_session_id text;
  ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_number text;
  CREATE UNIQUE INDEX IF NOT EXISTS payments_checkout_session_idx ON payments (checkout_session_id);
  CREATE SEQUENCE IF NOT EXISTS receipt_seq;

  ALTER TABLE applications ADD COLUMN IF NOT EXISTS status_note text;
  ALTER TABLE applications ADD COLUMN IF NOT EXISTS requirements_snapshot jsonb;

  CREATE TABLE IF NOT EXISTS file_uploads (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id varchar NOT NULL,
    original_name text NOT NULL,
    mime_type text NOT NULL,
    size integer NOT NULL,
    data text DEFAULT '',
    file_path text,
    uploaded_by varchar NOT NULL,
    created_at timestamp DEFAULT now()
  );
  ALTER TABLE file_uploads ADD COLUMN IF NOT EXISTS file_path text;

  CREATE TABLE IF NOT EXISTS app_migrations (
    id text PRIMARY KEY,
    applied_at timestamp DEFAULT now()
  );
`;

const CONTENT_MIGRATIONS: Array<[string, (client: PoolClient) => Promise<void>]> = [
  ["2026-10-catalog-v1", (c) => applyContent(c)],
  ["2026-10-agency-v1", (c) => applyAgencyModel(c)],
];

export async function migrateSchema() {
  await pool.query(SCHEMA_SQL);
}

export async function migrateContent() {
  for (const [id, run] of CONTENT_MIGRATIONS) {
    const client = await pool.connect();
    try {
      const done = await client.query("SELECT 1 FROM app_migrations WHERE id = $1", [id]);
      if (done.rowCount) continue;
      await client.query("BEGIN");
      await run(client);
      await client.query("INSERT INTO app_migrations (id) VALUES ($1)", [id]);
      await client.query("COMMIT");
      log(`Content migration ${id} applied.`);
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }
}

// Every published procedure is now carried out by MesDémarches on the client's behalf.
async function applyAgencyModel(client: PoolClient) {
  const rows = await client.query("SELECT id, slug, editorial_status, guide FROM procedures");
  for (const row of rows.rows) {
    const fee = SERVICE_FEES[row.slug] ?? DEFAULT_SERVICE_FEE;
    const base = BASE_PRICES[row.slug];
    const guide: ProcedureGuide = row.guide ?? {};
    if (base?.note) guide.feeNote = base.note;
    const set: Record<string, unknown> = { service_fee: fee, guide: JSON.stringify(guide) };
    if (row.editorial_status === "published") {
      set.channel = "docu243";
      set.status = "available";
    }
    if (base) {
      set.cost = base.amount;
      set.currency = "USD";
      set.fee_status = "confirmed";
    } else {
      // Legacy amounts were entered in CDF without a source: they must be set again in USD.
      set.fee_status = "unconfirmed";
    }
    await updateRow(client, row.id, set);

    // Give every procedure a form our team can work from.
    const docs = await client.query("SELECT 1 FROM procedure_required_documents WHERE procedure_id = $1 LIMIT 1", [row.id]);
    if (!docs.rowCount) {
      const items = (guide.checklist ?? []).filter((i) => i.kind === "upload" || i.kind === "original");
      let order = 1;
      for (const item of items) {
        await client.query(
          `INSERT INTO procedure_required_documents (procedure_id, name, description, required, accepted_formats, max_size_mb, "order")
           VALUES ($1, $2, $3, $4, $5, 5, $6)`,
          [
            row.id,
            item.label,
            item.requirement === "required" ? (item.description ?? "Copie lisible du document.") : `Selon votre situation. ${item.description ?? ""}`.trim(),
            item.requirement === "required",
            ["pdf", "jpg", "png"],
            order++,
          ],
        );
      }
    }
    const fields = await client.query("SELECT 1 FROM procedure_fields WHERE procedure_id = $1 LIMIT 1", [row.id]);
    if (!fields.rowCount) {
      let order = 1;
      for (const f of DEFAULT_FIELDS) {
        await client.query(
          `INSERT INTO procedure_fields (procedure_id, label, type, required, "order") VALUES ($1, $2, $3, $4, $5)`,
          [row.id, f.label, f.type, f.required, order++],
        );
      }
    }
  }
}

async function applyContent(client: PoolClient) {
  // 1. Accents on texts that still match the original seed vocabulary.
  const procs = await client.query("SELECT id, slug, title, description, category, institution, cost, estimated_days FROM procedures");
  for (const row of procs.rows) {
    const category = LEGACY_CATEGORY_MAP[row.category] ?? row.category;
    await client.query(
      "UPDATE procedures SET title = $2, description = $3, institution = $4, category = $5 WHERE id = $1",
      [row.id, accentize(row.title), accentize(row.description), accentize(row.institution), category],
    );
  }
  const fields = await client.query("SELECT id, label FROM procedure_fields");
  for (const f of fields.rows) {
    const label = accentize(f.label);
    if (label !== f.label) await client.query("UPDATE procedure_fields SET label = $2 WHERE id = $1", [f.id, label]);
  }
  const docs = await client.query("SELECT id, name, description FROM procedure_required_documents");
  for (const d of docs.rows) {
    const name = accentize(d.name);
    const description = accentize(d.description);
    if (name !== d.name || description !== d.description) {
      await client.query("UPDATE procedure_required_documents SET name = $2, description = $3 WHERE id = $1", [d.id, name, description]);
    }
  }

  // 2. Editorial content for existing procedures.
  const current = await client.query("SELECT id, slug, title, description, institution, cost, estimated_days FROM procedures");
  for (const row of current.rows) {
    const content = existingContent[row.slug];
    if (!content) continue;
    const seed = seedCatalog.find((s) => s.slug === row.slug);
    const untouched = (value: string, seedValue?: string) => !!seedValue && value === accentize(seedValue);

    const set: Record<string, unknown> = {
      guide: JSON.stringify(content.guide),
      fee_status: content.feeStatus ?? "unconfirmed",
      channel: content.channel ?? "docu243",
      external_url: content.externalUrl ?? null,
    };
    if (content.currency !== undefined) set.currency = content.currency;
    if (content.isPriority !== undefined) set.is_priority = content.isPriority;
    if (content.sortOrder !== undefined) set.sort_order = content.sortOrder;
    if (content.title && untouched(row.title, seed?.title)) set.title = content.title;
    if (content.description && untouched(row.description, seed?.description)) set.description = content.description;
    if (content.institution && untouched(row.institution, seed?.institution)) set.institution = content.institution;
    if (content.category) set.category = content.category;
    if (content.cost !== undefined && seed && row.cost === seed.cost) set.cost = content.cost;
    if (content.estimatedDays !== undefined && seed && row.estimated_days === seed.estimatedDays) {
      set.estimated_days = content.estimatedDays;
    }
    await updateRow(client, row.id, set);
  }

  // 3. New procedures (published when sourced, draft otherwise).
  for (const p of newProcedures) {
    const exists = await client.query("SELECT 1 FROM procedures WHERE slug = $1", [p.slug]);
    if (exists.rowCount) continue;
    await client.query(
      `INSERT INTO procedures (title, slug, description, category, institution, estimated_days, cost, status, is_active, icon,
        is_priority, sort_order, currency, fee_status, channel, external_url, editorial_status, guide)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [
        p.title, p.slug, p.description, p.category, p.institution, p.estimatedDays ?? 0, p.cost ?? 0,
        p.status ?? "coming_soon", p.icon, p.isPriority ?? false, p.sortOrder ?? 99, p.currency ?? null,
        p.feeStatus ?? "unconfirmed", p.channel ?? "info", p.externalUrl ?? null, p.editorialStatus ?? "draft",
        JSON.stringify(p.guide),
      ],
    );
  }
}

async function updateRow(client: PoolClient, id: string, set: Record<string, unknown>) {
  const keys = Object.keys(set);
  if (!keys.length) return;
  const assignments = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
  await client.query(`UPDATE procedures SET ${assignments}, updated_at = now() WHERE id = $1`, [id, ...keys.map((k) => set[k])]);
}

export type { ProcedureContent };
