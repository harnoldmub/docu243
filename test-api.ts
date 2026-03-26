import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./shared/schema.js";
import { eq, like } from "drizzle-orm";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function check() {
  const apps = await db.select().from(schema.applications).where(like(schema.applications.id, '2cf16c53%'));
  if (apps.length === 0) {
    console.log("Application not found.");
    process.exit(0);
  }
  const dossier = apps[0];
  
  const [procedure] = await db.select().from(schema.procedures).where(eq(schema.procedures.id, dossier.procedureId));
  const procedureFields = procedure ? await db.select().from(schema.procedureFields).where(eq(schema.procedureFields.procedureId, procedure.id)).orderBy(schema.procedureFields.order) : [];
  const procedureRequiredDocs = procedure ? await db.select().from(schema.procedureRequiredDocuments).where(eq(schema.procedureRequiredDocuments.procedureId, procedure.id)).orderBy(schema.procedureRequiredDocuments.order) : [];

  const response = {
      ...dossier,
      procedure: procedure
        ? {
            ...procedure,
            fields: procedureFields,
            requiredDocuments: procedureRequiredDocs,
          }
        : undefined
  };
  
  console.log(JSON.stringify(response.procedure?.fields, null, 2));
  process.exit(0);
}

check().catch(console.error);
