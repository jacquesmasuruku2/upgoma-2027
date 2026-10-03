import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "..", "..", "..", ".env"), override: true });

const tableOrder = [
  "auth_users",
  "profiles",
  "user_roles",
  "personnel",
  "faculty_content",
  "courses",
  "blog_articles",
  "blog_comments",
  "calendar_events",
  "fees",
  "gallery",
  "videos",
  "college_posts",
  "library_books",
  "services",
  "partners",
  "partnership_requests",
  "newsletter_subscribers",
  "newsletter_campaigns",
  "students",
  "payments",
  "grades",
  "grade_history",
  "requests",
  "assignments",
  "assignment_submissions",
  "attendances",
  "announcements",
  "announcement_reads",
  "chat_messages",
  "document_verification_logs",
];

const knownTables = new Set(tableOrder);
const applyChanges = process.argv.includes("--apply");
const filePath = process.argv.find((argument) => !argument.startsWith("--") && argument !== process.argv[0] && argument !== process.argv[1]);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL est nécessaire dans le .env racine.");
}
if (!filePath) {
  throw new Error("Usage: node server/import-cockroach-export.mjs <export.json> [--apply]");
}

const source = JSON.parse(await fs.readFile(path.resolve(filePath), "utf8"));
if (source.formatVersion !== 1 || !source.tables || typeof source.tables !== "object") {
  throw new Error("Export invalide. Attendu: formatVersion=1 et un objet tables.");
}

const tables = { ...source.tables };
if (source.authUsers !== undefined) tables.auth_users = source.authUsers;
const unexpectedTables = Object.keys(tables).filter((table) => !knownTables.has(table));
if (unexpectedTables.length) {
  throw new Error(`Tables non prises en charge, aucune écriture effectuée: ${unexpectedTables.join(", ")}`);
}

for (const [table, rows] of Object.entries(tables)) {
  if (!Array.isArray(rows) || rows.some((row) => !row || typeof row !== "object" || Array.isArray(row))) {
    throw new Error(`Export invalide pour ${table}: un tableau d’objets était attendu.`);
  }
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
const report = { mode: applyChanges ? "apply" : "dry-run", tables: {}, errors: [] };

try {
  await client.connect();

  const { rows: schemaRows } = await client.query(
    `SELECT table_schema, table_name, column_name, is_nullable, column_default, udt_name
     FROM information_schema.columns
     WHERE table_schema IN ('public', 'auth')`,
  );
  const schema = new Map();
  for (const row of schemaRows) {
    const name = `${row.table_schema}.${row.table_name}`;
    if (!schema.has(name)) schema.set(name, new Map());
    schema.get(name).set(row.column_name, row);
  }

  for (const table of tableOrder) {
    const rows = tables[table] ?? [];
    if (!rows.length) continue;
    const schemaName = table === "auth_users" ? "auth.users" : `public.${table}`;
    const targetTable = table === "auth_users" ? "users" : table;
    const columns = schema.get(schemaName);
    if (!columns) {
      report.errors.push(`${schemaName}: la table n’existe pas dans CockroachDB.`);
      continue;
    }

    const incomingColumns = new Set(rows.flatMap((row) => Object.keys(row)));
    if (table === "auth_users") {
      for (const user of rows) {
        if (!user.id || !user.email) {
          report.errors.push("auth_users: chaque compte exporté doit contenir id et email.");
          break;
        }
      }
      for (const column of ["id", "email", "email_confirmed_at", "created_at", "updated_at"]) {
        if (rows.some((row) => row[column] !== undefined)) incomingColumns.add(column);
      }
    }
    const unknownColumns = [...incomingColumns].filter((column) => !columns.has(column));
    if (unknownColumns.length) {
      report.errors.push(`${table}: colonnes absentes du schéma CockroachDB: ${unknownColumns.join(", ")}.`);
      continue;
    }
    if (table === "auth_users" && incomingColumns.has("encrypted_password")) {
      report.errors.push("auth_users: l’export ne doit pas inclure de mots de passe.");
      continue;
    }

    const missingRequired = [...columns.values()]
      .filter((column) => column.is_nullable === "NO" && column.column_default === null && !incomingColumns.has(column.column_name))
      .map((column) => column.column_name);
    if (missingRequired.length) {
      report.errors.push(`${table}: export incomplet; colonnes obligatoires manquantes: ${missingRequired.join(", ")}.`);
      continue;
    }

    report.tables[table] = { sourceRows: rows.length, imported: 0, skippedExisting: 0 };
  }

  if (report.errors.length) {
    console.error(JSON.stringify(report, null, 2));
    process.exitCode = 1;
  } else if (!applyChanges) {
    console.log(JSON.stringify(report, null, 2));
    console.log("Aucune donnée modifiée. Relancez avec --apply après vérification.");
  } else {
    await client.query("BEGIN");
    try {
      for (const table of tableOrder) {
        const rows = tables[table] ?? [];
        if (!rows.length) continue;
        const schemaName = table === "auth_users" ? "auth" : "public";
        const targetTable = table === "auth_users" ? "users" : table;
        const columns = table === "auth_users"
          ? ["id", "email", "email_confirmed_at", "created_at", "updated_at"].filter((column) =>
              rows.some((row) => row[column] !== undefined),
            )
          : [...new Set(rows.flatMap((row) => Object.keys(row)))];
        const quotedColumns = columns.map((column) => `"${column}"`).join(", ");
        const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
          const statement = `INSERT INTO "${schemaName}"."${targetTable}" (${quotedColumns}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
          const tableReport = report.tables[table];

          for (const row of rows) {
            const values = columns.map((column) => row[column] ?? null);
          const result = await client.query(statement, values);
          if (result.rowCount) tableReport.imported += result.rowCount;
          else tableReport.skippedExisting += 1;
        }
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    }
    console.log(JSON.stringify(report, null, 2));
  }
} finally {
  await client.end();
}
