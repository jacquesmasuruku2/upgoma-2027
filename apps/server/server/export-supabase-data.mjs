import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "..", "..", "..", ".env"), override: true, quiet: true });

const tables = [
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

function readSecret(prompt) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
      reject(new Error("Lancez l’export dans un terminal interactif pour saisir la clé sans l’afficher."));
      return;
    }

    let value = "";
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    const finish = (error) => {
      process.stdin.removeListener("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    };
    const onData = (chunk) => {
      for (const character of chunk.toString("utf8")) {
        if (character === "\u0003") return finish(new Error("Export annulé."));
        if (character === "\r" || character === "\n") return finish();
        if (character === "\u0008" || character === "\u007f") value = value.slice(0, -1);
        else if (character >= " ") value += character;
      }
    };
    process.stdin.on("data", onData);
  });
}

const outputPath = process.argv[2];
const projectUrl = process.env.VITE_SUPABASE_URL
  || (process.env.VITE_SUPABASE_PROJECT_ID ? `https://${process.env.VITE_SUPABASE_PROJECT_ID}.supabase.co` : "");

if (!outputPath) throw new Error("Usage: node server/export-supabase-data.mjs <export.json>");
if (!projectUrl || new URL(projectUrl).protocol !== "https:") {
  throw new Error("URL Supabase HTTPS absente. Renseignez-la temporairement dans le terminal ou le .env local.");
}

const serviceKey = await readSecret("Clé service_role Supabase (saisie masquée, non enregistrée) : ");
if (!serviceKey) throw new Error("La clé service_role est obligatoire pour exporter les tables protégées.");

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Accept-Profile": "public",
};

async function getRows(table) {
  const rows = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const url = new URL(`/rest/v1/${encodeURIComponent(table)}`, projectUrl);
    url.searchParams.set("select", "*");
    const response = await fetch(url, {
      headers: { ...headers, "Range-Unit": "items", Range: `${offset}-${offset + pageSize - 1}` },
    });
    if (!response.ok) {
      throw new Error(`Export de public.${table} refusé (${response.status}). Vérifiez le schéma et les droits.`);
    }
    const page = await response.json();
    if (!Array.isArray(page)) throw new Error(`Réponse invalide pour public.${table}.`);
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

async function getAuthUsers() {
  const users = [];
  const perPage = 500;
  for (let page = 1; ; page += 1) {
    const url = new URL("/auth/v1/admin/users", projectUrl);
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", String(perPage));
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Export des identités auth.users refusé (${response.status}). Vérifiez la clé service_role.`);
    }
    const payload = await response.json();
    if (!Array.isArray(payload.users)) throw new Error("Réponse invalide pour auth.users.");
    users.push(...payload.users.map((user) => ({
      id: user.id,
      email: user.email,
      email_confirmed_at: user.email_confirmed_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
    })));
    if (payload.users.length < perPage) return users;
  }
}

const exported = {};
for (const table of tables) {
  process.stdout.write(`Export de public.${table}... `);
  exported[table] = await getRows(table);
  process.stdout.write(`${exported[table].length} ligne(s)\n`);
}
process.stdout.write("Export des identités auth.users... ");
exported.auth_users = await getAuthUsers();
process.stdout.write(`${exported.auth_users.length} ligne(s)\n`);

const destination = path.resolve(outputPath);
await fs.writeFile(destination, JSON.stringify({ formatVersion: 1, tables: exported }, null, 2), { flag: "wx", mode: 0o600 });
console.log(`Export local créé: ${destination}`);
console.log("Les mots de passe et clés d’accès ne sont pas exportés. Protégez ce fichier contenant des données personnelles.");
