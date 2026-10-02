import dotenv from "dotenv";
import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "..", "..", "..", ".env"), override: true });

const scrypt = promisify(scryptCallback);
const email = process.argv[2]?.trim().toLowerCase();
const name = process.argv[3]?.trim() || email?.split("@")[0];

function readSecret(prompt) {
  return new Promise((resolve, reject) => {
    const input = process.stdin;
    if (!input.isTTY) return reject(new Error("Lancez ce script dans un terminal interactif."));

    let value = "";
    process.stdout.write(prompt);
    input.setRawMode(true);
    input.resume();

    const finish = (error) => {
      input.removeListener("data", onData);
      input.setRawMode(false);
      input.pause();
      process.stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    };

    const onData = (chunk) => {
      for (const character of chunk.toString("utf8")) {
        if (character === "\u0003") return finish(new Error("Opération annulée."));
        if (character === "\r" || character === "\n") return finish();
        if (character === "\u0008" || character === "\u007f") {
          value = value.slice(0, -1);
          process.stdout.write("\b \b");
        } else if (character >= " ") {
          value += character;
          process.stdout.write("*");
        }
      }
    };

    input.on("data", onData);
  });
}

async function hashPassword(password) {
  const salt = randomBytes(16);
  const cost = 32768;
  const blockSize = 8;
  const parallelization = 1;
  const derivedKey = await scrypt(password, salt, 64, {
    N: cost,
    r: blockSize,
    p: parallelization,
    maxmem: 64 * 1024 * 1024,
  });
  return `scrypt$${cost}$${blockSize}$${parallelization}$${salt.toString("hex")}$${Buffer.from(derivedKey).toString("hex")}`;
}

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Usage: node server/bootstrap-super-admin.mjs <email> [nom]");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL est nécessaire dans le .env racine.");
  process.exit(1);
}

const password = await readSecret("Nouveau mot de passe (12 caractères minimum) : ");
const confirmation = await readSecret("Confirmez le mot de passe : ");
if (password !== confirmation) throw new Error("Les mots de passe ne correspondent pas.");
if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
  throw new Error("Le mot de passe doit avoir 12 caractères minimum, avec majuscule, minuscule, chiffre et symbole.");
}

const passwordHash = await hashPassword(password);
const client = new Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();
  await client.query("BEGIN");

  const existing = await client.query("SELECT id FROM auth.users WHERE lower(trim(email)) = $1 FOR UPDATE", [email]);
  if (existing.rowCount) throw new Error("Ce compte existe déjà; utilisez le flux de réinitialisation du mot de passe.");

  const { rows: insertedUsers } = await client.query(
    "INSERT INTO auth.users (email, encrypted_password, email_confirmed_at) VALUES ($1, $2, now()) RETURNING id",
    [email, passwordHash],
  );
  const userId = insertedUsers[0].id;

  await client.query(
    "INSERT INTO public.profiles (id, email, nom, role) VALUES ($1, $2, $3, 'super_admin')",
    [userId, email, name],
  );
  await client.query(
    "INSERT INTO public.user_roles (user_id, role) VALUES ($1, 'super_admin') ON CONFLICT (user_id, role) DO NOTHING",
    [userId],
  );
  await client.query("COMMIT");
  console.log(`Super-administrateur créé dans CockroachDB: ${email}`);
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  throw error;
} finally {
  await client.end();
}