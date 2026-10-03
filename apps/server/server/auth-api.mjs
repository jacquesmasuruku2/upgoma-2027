import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
import express from "express";
import { rateLimit } from "express-rate-limit";
import { deliverEmail, deliverEmails } from "./email/brevo.mjs";

export { deliverEmail, deliverEmails };

const scrypt = promisify(scryptCallback);
const sessionCookie = "upg_session";
const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;
const assignableRoles = new Set(["super_admin", "appariteur", "enseignant", "finance"]);

const hashToken = (token) => createHash("sha256").update(token).digest("hex");
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]);

function isStrongPassword(password) {
  return password.length >= 12
    && /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9]/.test(password);
}

function isSmtpIpRejected(error) {
  const message = error instanceof Error ? error.message : String(error);
  return /unauthorized ip address|5\.7\.1/i.test(message);
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

async function verifyPassword(password, encodedHash) {
  const [algorithm, costText, blockSizeText, parallelizationText, saltHex, hashHex] = String(encodedHash || "").split("$");
  const cost = Number(costText);
  const blockSize = Number(blockSizeText);
  const parallelization = Number(parallelizationText);
  if (algorithm !== "scrypt" || !saltHex || !hashHex || cost < 16384 || cost > 131072 || blockSize < 1 || blockSize > 16 || parallelization < 1 || parallelization > 4) {
    return false;
  }

  const expected = Buffer.from(hashHex, "hex");
  const actual = Buffer.from(await scrypt(password, Buffer.from(saltHex, "hex"), expected.length, {
    N: cost,
    r: blockSize,
    p: parallelization,
    maxmem: 256 * 1024 * 1024,
  }));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function getCookie(req, name) {
  const pair = (req.headers.cookie || "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : "";
}

function writeSessionCookie(req, res, token) {
  const secure = process.env.NODE_ENV === "production" || req.secure;
  res.setHeader("Set-Cookie", `${sessionCookie}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${Math.floor(sessionDurationMs / 1000)}${secure ? "; Secure" : ""}`);
}

function clearSessionCookie(req, res) {
  const secure = process.env.NODE_ENV === "production" || req.secure;
  res.setHeader("Set-Cookie", `${sessionCookie}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`);
}

async function readUser(pool, userId) {
  const { rows: users } = await pool.query(
    "SELECT u.id, u.email, p.nom, p.role AS profile_role FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id WHERE u.id = $1",
    [userId],
  );
  if (!users.length) return null;

  const { rows: roles } = await pool.query(
    "SELECT role::text AS role FROM public.user_roles WHERE user_id = $1 ORDER BY role::text",
    [userId],
  );
  const { rows: students } = await pool.query(
    "SELECT * FROM public.students WHERE user_id = $1 AND status = 'approved' LIMIT 1",
    [userId],
  );
  const studentData = students[0] || undefined;
  const role = studentData ? "etudiant" : users[0].profile_role || roles[0]?.role || "etudiant";
  return {
    id: users[0].id,
    email: users[0].email,
    nom: studentData ? [studentData.nom, studentData.postnom].filter(Boolean).join(" ") : users[0].nom || users[0].email,
    role,
    ...(studentData ? { studentData } : {}),
  };
}

async function findSession(pool, req) {
  const token = getCookie(req, sessionCookie);
  if (!token) return null;
  const tokenHash = hashToken(token);
  const { rows } = await pool.query(
    "SELECT id, user_id FROM auth.app_sessions WHERE token_hash = $1 AND expires_at > now() LIMIT 1",
    [tokenHash],
  );
  if (!rows.length) return null;
  const user = await readUser(pool, rows[0].user_id);
  return user ? { user, sessionId: rows[0].id, tokenHash } : null;
}

function requireAuth(pool) {
  return async (req, res, next) => {
    try {
      const session = await findSession(pool, req);
      if (!session) return res.status(401).json({ error: "Session expirée. Reconnectez-vous." });
      req.authSession = session;
      return next();
    } catch (error) {
      console.error("[auth] Session lookup failed:", error instanceof Error ? error.message : "unknown error");
      return res.status(503).json({ error: "Le service d’authentification est indisponible." });
    }
  };
}

function requireSuperAdmin(pool) {
  const requireSession = requireAuth(pool);
  return async (req, res, next) => requireSession(req, res, async () => {
    try {
      const { rows } = await pool.query(
        "SELECT 1 FROM public.user_roles WHERE user_id = $1 AND role = 'super_admin' LIMIT 1",
        [req.authSession.user.id],
      );
      if (!rows.length) return res.status(403).json({ error: "Seul un super administrateur peut inviter des utilisateurs." });
      return next();
    } catch (error) {
      console.error("[auth] Role lookup failed:", error instanceof Error ? error.message : "unknown error");
      return res.status(503).json({ error: "Impossible de vérifier les droits administrateur." });
    }
  });
}

async function createAccountToken(pool, userId, purpose) {
  const token = randomBytes(32).toString("base64url");
  await pool.query("DELETE FROM auth.account_tokens WHERE user_id = $1 AND purpose = $2", [userId, purpose]);
  await pool.query(
    "INSERT INTO auth.account_tokens (user_id, token_hash, purpose, expires_at) VALUES ($1, $2, $3, now() + interval '1 hour')",
    [userId, hashToken(token), purpose],
  );
  return token;
}

function accountLink(req, token) {
  const appUrl = (process.env.APP_URL || process.env.APP_PUBLIC_URL || "https://system.upgoma.org").replace(/\/$/, "");
  return `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
}

async function sendAccountEmail({ req, email, name, purpose, token }) {
  const link = accountLink(req, token);
  const invitation = purpose === "invite";
  const safeName = escapeHtml(name);
  const safeLink = escapeHtml(link);
  const subject = invitation ? "Invitation à rejoindre l’UPG" : "Réinitialisation de votre mot de passe UPG";
  const action = invitation ? "Activer mon compte" : "Réinitialiser mon mot de passe";
  const description = invitation
    ? "Vous êtes invité(e) à rejoindre l’espace de gestion de l’Université Polytechnique de Goma. Choisissez un mot de passe pour activer votre compte."
    : "Une demande de réinitialisation du mot de passe de votre compte UPG a été reçue.";
  await deliverEmail({
    to: email,
    name,
    subject,
    text: `Bonjour ${name},\n\n${description}\n\nCe lien expire dans une heure : ${link}\n\nSi vous n’êtes pas à l’origine de cette demande, ignorez ce message.`,
    html: `<!doctype html><html lang="fr"><body style="margin:0;padding:32px;background:#f3f6f2;font-family:Arial,sans-serif;color:#20352d"><main style="max-width:560px;margin:auto;padding:28px;background:#fff;border:1px solid #dce5de;border-radius:8px"><p style="font-size:12px;font-weight:bold;color:#205b4b">UNIVERSITÉ POLYTECHNIQUE DE GOMA</p><h1 style="font-size:22px">${invitation ? "Votre compte vous attend" : "Sécurisez votre compte"}</h1><p>Bonjour <strong>${safeName}</strong>,</p><p>${description}</p><p style="margin:28px 0"><a href="${safeLink}" style="padding:12px 18px;background:#205b4b;color:#fff;text-decoration:none;border-radius:4px">${action}</a></p><p style="font-size:13px;color:#64756b">Ce lien expire dans une heure. Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.</p></main></body></html>`,
  });
}

const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false });
const emailLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: "draft-8", legacyHeaders: false });
const campaignLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: "draft-8", legacyHeaders: false });

export function createAuthRouter(pool, trustedOrigins) {
  const router = express.Router();
  router.use((req, res, next) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
    const origin = req.get("origin");
    if (!origin || !trustedOrigins.has(origin)) return res.status(403).json({ error: "Origine non autorisée." });
    if (!pool) return res.status(503).json({ error: "Le service d’authentification n’est pas configuré (DATABASE_URL)." });
    return next();
  });

  router.post("/auth/login", loginLimit, async (req, res) => {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const requestedRole = typeof req.body.role === "string" ? req.body.role : "";
    if (!email || !password) return res.status(400).json({ error: "Adresse e-mail et mot de passe obligatoires." });

    try {
      const { rows } = await pool.query(
        "SELECT id, email, encrypted_password, email_confirmed_at FROM auth.users WHERE lower(trim(email)) = $1 LIMIT 1",
        [email],
      );
      const account = rows[0];
      const valid = account?.encrypted_password && await verifyPassword(password, account.encrypted_password);
      if (!valid || !account.email_confirmed_at) return res.status(401).json({ error: "Identifiants incorrects ou compte non activé." });

      const user = await readUser(pool, account.id);
      if (!user || (requestedRole && requestedRole !== user.role)) return res.status(401).json({ error: "Ce profil ne correspond pas au compte." });

      const token = randomBytes(32).toString("base64url");
      await pool.query(
        "INSERT INTO auth.app_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, now() + interval '7 days')",
        [user.id, hashToken(token)],
      );
      writeSessionCookie(req, res, token);
      return res.json({ user });
    } catch (error) {
      console.error("[auth/login] Failed:", error instanceof Error ? error.message : "unknown error");
      return res.status(503).json({ error: "Le service de connexion est indisponible." });
    }
  });

  const sendCurrentUser = (req, res) => res.json({ user: req.authSession.user });
  router.get("/auth/session", requireAuth(pool), sendCurrentUser);
  router.get("/auth/me", requireAuth(pool), sendCurrentUser);

  router.post("/auth/logout", async (req, res) => {
    try {
      const token = getCookie(req, sessionCookie);
      if (token) await pool.query("DELETE FROM auth.app_sessions WHERE token_hash = $1", [hashToken(token)]);
      clearSessionCookie(req, res);
      return res.json({ ok: true });
    } catch (error) {
      console.error("[auth/logout] Failed:", error instanceof Error ? error.message : "unknown error");
      clearSessionCookie(req, res);
      return res.status(503).json({ error: "Impossible de fermer la session." });
    }
  });

  router.post("/auth/forgot-password", emailLimit, async (req, res) => {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Adresse e-mail invalide." });

    try {
      const { rows } = await pool.query(
        "SELECT id, email FROM auth.users WHERE lower(trim(email)) = $1 LIMIT 1",
        [email],
      );
      if (rows[0]) {
        const user = await readUser(pool, rows[0].id);
        const token = await createAccountToken(pool, rows[0].id, "password_reset");
        await sendAccountEmail({ req, email, name: user?.nom || email, purpose: "password_reset", token });
      }
      return res.status(202).json({ ok: true, message: "Si un compte actif correspond à cette adresse, un e-mail sera envoyé." });
    } catch (error) {
      console.error("[auth/forgot-password] Failed:", error instanceof Error ? error.message : "unknown error");
      if (isSmtpIpRejected(error)) {
        return res.status(503).json({
          error: "Brevo refuse l’envoi depuis l’adresse IP de ce serveur. Autorisez son IP publique sortante dans les paramètres SMTP Brevo, puis réessayez.",
        });
      }
      return res.status(503).json({ error: "Le service d’e-mail est indisponible. Réessayez plus tard." });
    }
  });

  const completeAccountToken = async (req, res) => {
    const token = typeof req.body.token === "string" ? req.body.token : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    if (!token || !isStrongPassword(password)) {
      return res.status(400).json({ error: "Le mot de passe doit avoir 12 caractères minimum, avec majuscule, minuscule, chiffre et symbole." });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        `SELECT t.id AS token_id, t.user_id, t.purpose
         FROM auth.account_tokens t
         WHERE t.token_hash = $1 AND t.expires_at > now()
         FOR UPDATE`,
        [hashToken(token)],
      );
      if (!rows[0]) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Ce lien est invalide ou expiré." });
      }

      const passwordHash = await hashPassword(password);
      await client.query(
        "UPDATE auth.users SET encrypted_password = $1, email_confirmed_at = COALESCE(email_confirmed_at, now()), updated_at = now() WHERE id = $2",
        [passwordHash, rows[0].user_id],
      );
      await client.query("DELETE FROM auth.account_tokens WHERE user_id = $1", [rows[0].user_id]);
      await client.query("DELETE FROM auth.app_sessions WHERE user_id = $1", [rows[0].user_id]);
      const sessionToken = randomBytes(32).toString("base64url");
      await client.query(
        "INSERT INTO auth.app_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, now() + interval '7 days')",
        [rows[0].user_id, hashToken(sessionToken)],
      );
      await client.query("COMMIT");

      const user = await readUser(pool, rows[0].user_id);
      writeSessionCookie(req, res, sessionToken);
      return res.json({ ok: true, user, purpose: rows[0].purpose });
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      console.error("[auth/reset-password] Failed:", error instanceof Error ? error.message : "unknown error");
      return res.status(503).json({ error: "Impossible de définir le mot de passe pour le moment." });
    } finally {
      client.release();
    }
  };
  router.post("/auth/reset-password", completeAccountToken);
  router.post("/auth/complete-token", completeAccountToken);

  router.post("/auth/change-password", requireAuth(pool), async (req, res) => {
    const currentPassword = typeof req.body.currentPassword === "string" ? req.body.currentPassword : "";
    const newPassword = typeof req.body.newPassword === "string" ? req.body.newPassword : "";
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ error: "Le nouveau mot de passe doit avoir 12 caractères minimum, avec majuscule, minuscule, chiffre et symbole." });
    }

    try {
      const { rows } = await pool.query("SELECT encrypted_password FROM auth.users WHERE id = $1", [req.authSession.user.id]);
      if (!rows[0]?.encrypted_password || !(await verifyPassword(currentPassword, rows[0].encrypted_password))) {
        return res.status(401).json({ error: "Le mot de passe actuel est incorrect." });
      }
      const passwordHash = await hashPassword(newPassword);
      await pool.query("UPDATE auth.users SET encrypted_password = $1, updated_at = now() WHERE id = $2", [passwordHash, req.authSession.user.id]);
      await pool.query("DELETE FROM auth.app_sessions WHERE user_id = $1 AND id <> $2", [req.authSession.user.id, req.authSession.sessionId]);
      return res.json({ ok: true });
    } catch (error) {
      console.error("[auth/change-password] Failed:", error instanceof Error ? error.message : "unknown error");
      return res.status(503).json({ error: "Impossible de modifier le mot de passe pour le moment." });
    }
  });

  router.get("/admin/users", requireSuperAdmin(pool), async (_req, res) => {
    try {
      const { rows } = await pool.query(
        "SELECT id, email, nom, role::text AS role FROM public.profiles WHERE role IS NOT NULL ORDER BY nom, email",
      );
      return res.json({ users: rows });
    } catch (error) {
      console.error("[auth/users] Failed:", error instanceof Error ? error.message : "unknown error");
      return res.status(503).json({ error: "Impossible de charger les utilisateurs." });
    }
  });

  router.get("/admin/newsletter", requireSuperAdmin(pool), async (_req, res) => {
    try {
      const { rows } = await pool.query(
        "SELECT id, name, email, confirmed, created_at, confirmed_at, unsubscribed_at FROM public.newsletter_subscribers ORDER BY created_at DESC",
      );
      return res.json({ subscribers: rows });
    } catch (error) {
      console.error("[auth/newsletter] Failed:", error instanceof Error ? error.message : "unknown error");
      return res.status(503).json({ error: "Impossible de charger les abonnés newsletter." });
    }
  });

  router.get("/admin/newsletter/sources", requireSuperAdmin(pool), async (_req, res) => {
    try {
      const { rows } = await pool.query(
        "SELECT id, titre AS title, contenu AS content, image_url, created_at FROM public.announcements ORDER BY created_at DESC LIMIT 200",
      );
      return res.json({ announcements: rows });
    } catch (error) {
      console.error("[auth/newsletter-sources] Failed:", error instanceof Error ? error.message : "unknown error");
      return res.status(503).json({ error: "Impossible de charger les communiqués." });
    }
  });

  router.get("/admin/newsletter/campaigns", requireSuperAdmin(pool), async (_req, res) => {
    try {
      const { rows } = await pool.query(
        "SELECT id, source_type, title, subject, status, recipient_count, sent_count, failed_count, created_at, completed_at FROM public.newsletter_campaigns ORDER BY created_at DESC LIMIT 100",
      );
      return res.json({ campaigns: rows });
    } catch (error) {
      console.error("[auth/newsletter-campaigns] History load failed:", error instanceof Error ? error.message : "unknown error");
      return res.status(503).json({ error: "Impossible de charger l’historique des campagnes." });
    }
  });

  router.post("/admin/newsletter/campaigns", campaignLimit, requireSuperAdmin(pool), async (req, res) => {
    const sourceType = typeof req.body.sourceType === "string" ? req.body.sourceType : "custom";
    const sourceId = typeof req.body.sourceId === "string" ? req.body.sourceId : null;
    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    const subject = typeof req.body.subject === "string" ? req.body.subject.trim() : "";
    const body = typeof req.body.body === "string" ? req.body.body.trim() : "";
    const sourceUrl = typeof req.body.sourceUrl === "string" ? req.body.sourceUrl.trim() : "";
    const imageUrl = typeof req.body.imageUrl === "string" ? req.body.imageUrl.trim() : "";
    const allowedSourceTypes = new Set(["blog", "communique", "custom"]);

    if (!allowedSourceTypes.has(sourceType)) return res.status(400).json({ error: "Type de campagne invalide." });
    if (!title || title.length > 200) return res.status(400).json({ error: "Le titre est obligatoire (200 caractères maximum)." });
    if (!subject || subject.length > 180) return res.status(400).json({ error: "L’objet est obligatoire (180 caractères maximum)." });
    if (!body || body.length > 50000) return res.status(400).json({ error: "Le contenu est obligatoire (50 000 caractères maximum)." });

    const normalizeUrl = (value) => {
      if (!value) return null;
      try {
        const url = new URL(value);
        return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
      } catch {
        return null;
      }
    };
    const campaignUrl = normalizeUrl(sourceUrl);
    const campaignImage = normalizeUrl(imageUrl);
    if (sourceUrl && !campaignUrl) return res.status(400).json({ error: "Lien du contenu invalide." });
    if (imageUrl && !campaignImage) return res.status(400).json({ error: "Lien de l’image invalide." });

    const client = await pool.connect();
    let campaignId;
    let recipients = [];
    try {
      await client.query("BEGIN");
      const { rows: subscribers } = await client.query(
        "SELECT id, name, email, unsubscribe_token FROM public.newsletter_subscribers WHERE confirmed = true AND unsubscribed_at IS NULL ORDER BY confirmed_at, id LIMIT 2001",
      );
      if (!subscribers.length) {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: "Aucun abonné confirmé et actif à contacter." });
      }
      if (subscribers.length > 2000) {
        await client.query("ROLLBACK");
        return res.status(413).json({ error: "La liste dépasse la limite de 2 000 destinataires par campagne." });
      }
      recipients = subscribers;

      const { rows: campaigns } = await client.query(
        "INSERT INTO public.newsletter_campaigns (created_by, source_type, source_id, title, subject, body, source_url, image_url, status, recipient_count) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'sending', $9) RETURNING id",
        [req.authSession.user.id, sourceType, sourceId, title, subject, body, campaignUrl, campaignImage, recipients.length],
      );
      campaignId = campaigns[0].id;
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      console.error("[newsletter/campaign] Setup failed:", error instanceof Error ? error.message : "unknown error");
      return res.status(503).json({ error: "Impossible de préparer cette campagne." });
    } finally {
      client.release();
    }

    const appOrigin = (process.env.APP_PUBLIC_URL?.trim() || "https://www.upgoma.org").replace(/\/$/, "");
    const safeTitle = escapeHtml(title);
    const safeBody = escapeHtml(body).replace(/\r?\n/g, "<br>");
    const safeCampaignUrl = campaignUrl ? escapeHtml(campaignUrl) : "";
    const safeImageUrl = campaignImage ? escapeHtml(campaignImage) : "";
    const messages = recipients.map((recipient) => {
      const safeName = escapeHtml(recipient.name);
      const unsubscribeUrl = `${appOrigin}/desabonner-newsletter?token=${encodeURIComponent(recipient.unsubscribe_token)}`;
      const safeUnsubscribeUrl = escapeHtml(unsubscribeUrl);
      const articleLink = safeCampaignUrl
        ? `<p style="margin:28px 0"><a href="${safeCampaignUrl}" style="padding:12px 18px;background:#205b4b;color:#fff;text-decoration:none;border-radius:4px">Lire sur le site</a></p>`
        : "";
      const image = safeImageUrl ? `<img src="${safeImageUrl}" alt="" style="display:block;width:100%;height:auto;margin:20px 0;border-radius:6px">` : "";
      return {
        to: recipient.email,
        name: recipient.name,
        subject,
        text: `Bonjour ${recipient.name},\n\n${title}\n\n${body}${campaignUrl ? `\n\nLire sur le site : ${campaignUrl}` : ""}\n\nSe désabonner : ${unsubscribeUrl}`,
        html: `<!doctype html><html lang="fr"><body style="margin:0;padding:32px;background:#f3f6f2;font-family:Arial,sans-serif;color:#20352d"><main style="max-width:600px;margin:auto;padding:28px;background:#fff;border:1px solid #dce5de;border-radius:8px"><p style="font-size:12px;font-weight:bold;color:#205b4b">UNIVERSITÉ POLYTECHNIQUE DE GOMA</p><p>Bonjour <strong>${safeName}</strong>,</p><h1 style="font-size:24px;line-height:1.3">${safeTitle}</h1>${image}<div style="font-size:15px;line-height:1.7">${safeBody}</div>${articleLink}<hr style="margin:28px 0;border:0;border-top:1px solid #dce5de"><p style="font-size:12px;color:#64756b">Vous recevez cette newsletter après votre inscription sur le site de l’UPG. <a href="${safeUnsubscribeUrl}" style="color:#205b4b">Se désabonner</a></p></main></body></html>`,
      };
    });

    let delivery;
    try {
      delivery = await deliverEmails(messages);
    } catch (error) {
      console.error("[newsletter/campaign] Delivery failed:", error instanceof Error ? error.message : "unknown error");
      await pool.query(
        "UPDATE public.newsletter_campaigns SET status = 'failed', failed_count = recipient_count, completed_at = now() WHERE id = $1",
        [campaignId],
      );
      return res.status(503).json({ error: "L’envoi a échoué. Vérifiez la configuration SMTP/Brevo." });
    }

    const status = delivery.failed === 0 ? "sent" : delivery.sent === 0 ? "failed" : "partial";
    await pool.query(
      "UPDATE public.newsletter_campaigns SET status = $1, sent_count = $2, failed_count = $3, completed_at = now() WHERE id = $4",
      [status, delivery.sent, delivery.failed, campaignId],
    );
    if (status === "failed") return res.status(502).json({ error: "Aucun message n’a pu être envoyé. Vérifiez le relais SMTP/Brevo." });
    return res.status(201).json({ ok: true, campaignId, ...delivery, recipientCount: recipients.length, status });
  });
  router.post("/admin/invitations", emailLimit, requireSuperAdmin(pool), async (req, res) => {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const role = typeof req.body.role === "string" ? req.body.role.trim() : "";
    if (!name || name.length > 120) return res.status(400).json({ error: "Le nom est obligatoire (120 caractères maximum)." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return res.status(400).json({ error: "Adresse e-mail invalide." });
    if (!assignableRoles.has(role)) return res.status(400).json({ error: "Rôle utilisateur invalide." });

    const client = await pool.connect();
    let userId;
    let token;
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        "SELECT id, email_confirmed_at FROM auth.users WHERE lower(trim(email)) = $1 FOR UPDATE",
        [email],
      );
      if (rows[0]?.email_confirmed_at) {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: "Un compte actif existe déjà pour cette adresse." });
      }

      if (rows[0]) {
        userId = rows[0].id;
      } else {
        const inserted = await client.query("INSERT INTO auth.users (email) VALUES ($1) RETURNING id", [email]);
        userId = inserted.rows[0].id;
      }

      await client.query(
        "INSERT INTO public.profiles (id, email, nom, role) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, nom = EXCLUDED.nom, role = EXCLUDED.role",
        [userId, email, name, role],
      );
      await client.query(
        "INSERT INTO public.user_roles (user_id, role) VALUES ($1, $2) ON CONFLICT (user_id, role) DO NOTHING",
        [userId, role],
      );

      token = randomBytes(32).toString("base64url");
      await client.query("DELETE FROM auth.account_tokens WHERE user_id = $1 AND purpose = 'invite'", [userId]);
      await client.query(
        "INSERT INTO auth.account_tokens (user_id, token_hash, purpose, expires_at) VALUES ($1, $2, 'invite', now() + interval '1 hour')",
        [userId, hashToken(token)],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      console.error("[auth/invitations] Database operation failed:", error instanceof Error ? error.message : "unknown error");
      return res.status(503).json({ error: "Impossible de préparer cette invitation." });
    } finally {
      client.release();
    }

    try {
      await sendAccountEmail({ req, email, name, purpose: "invite", token });
      return res.status(201).json({ ok: true, email, name, role });
    } catch (error) {
      console.error("[auth/invitations] Email delivery failed:", error instanceof Error ? error.message : "unknown error");
      return res.status(503).json({ error: "Le compte est préparé, mais l’e-mail n’a pas été envoyé. Vérifiez Brevo/SMTP puis relancez l’invitation." });
    }
  });

  router.use((error, _req, res, _next) => {
    console.error("[auth] Unhandled request error:", error instanceof Error ? error.message : "unknown error");
    return res.status(500).json({ error: "Erreur inattendue du service d’authentification." });
  });

  return router;
}