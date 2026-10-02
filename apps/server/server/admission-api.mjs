/**
 * API locale : enregistre les inscriptions admission dans PostgreSQL (DATABASE_URL).
 * Les fichiers sont stockés sous uploads/admissions/ et servis sous /admission-files/…
 */
import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import multer from "multer";
import path from "path";
import Stripe from "stripe";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { v2 as cloudinary } from "cloudinary";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import nodemailer from "nodemailer";
import { rateLimit } from "express-rate-limit";
import { Pool } from "pg";
import { createAuthRouter, deliverEmail } from "./auth-api.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnvPath = path.resolve(__dirname, "..", "..", "..", ".env");
dotenv.config({ path: rootEnvPath, override: true });

const PROMOTIONS = new Set(["L1", "L2", "L3", "M1", "M2", "Doc1", "Doc2"]);
const SEXES = new Set(["M", "F"]);
const PDF_FIELDS = ["diplome", "bulletin", "attestation"];
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

const app = express();
app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS || 0));

const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS || "http://localhost:8080,http://localhost:5173,http://localhost:5174,http://localhost:4173,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:4173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

const authPool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;
if (authPool) app.use("/api", createAuthRouter(authPool, allowedOrigins));

const supabaseUrl = process.env.SUPABASE_URL?.trim()
  || process.env.VITE_SUPABASE_URL?.trim()
  || (process.env.VITE_SUPABASE_PROJECT_ID ? `https://${process.env.VITE_SUPABASE_PROJECT_ID.trim()}.supabase.co` : "");
const supabaseKey = process.env.SUPABASE_ANON_KEY?.trim()
  || process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
  || "";
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
const r2Bucket = process.env.CLOUDFLARE_R2_BUCKET?.trim();
const r2AccessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim();
const r2SecretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim();
const r2Client = cloudflareAccountId && r2AccessKeyId && r2SecretAccessKey
  ? new S3Client({
      region: "auto",
      endpoint: `https://${cloudflareAccountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: r2AccessKeyId, secretAccessKey: r2SecretAccessKey },
    })
  : null;

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    })
  : null;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 4, fields: 20, fieldSize: 64 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = file.fieldname === "photo"
      ? ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]
      : PDF_FIELDS.includes(file.fieldname) && file.mimetype === "application/pdf";
    callback(allowed ? null : new Error("Format de fichier non autorisé."), allowed);
  },
});

const genericUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const isImage = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(file.mimetype);
    const isPdf = file.mimetype === "application/pdf";
    callback((isImage || isPdf) ? null : new Error("Format de fichier non autorisé."), isImage || isPdf);
  },
});

const uploadFields = upload.fields([
  { name: "photo", maxCount: 1 },
  { name: "diplome", maxCount: 1 },
  { name: "bulletin", maxCount: 1 },
  { name: "attestation", maxCount: 1 },
]);

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character] ?? character);

async function uploadPhotoToR2(file, studentId) {
  const key = `admissions/${studentId}/photo-${Date.now()}.${(file.originalname || "photo.png").split(".").pop() || "png"}`;
  await r2Client.send(new PutObjectCommand({
    Bucket: r2Bucket,
    Key: key,
    Body: file.buffer,
    ContentLength: file.size,
    ContentType: file.mimetype || "image/png",
    Metadata: { studentId, kind: "photo" },
  }));
  return { key, url: `https://${cloudflareAccountId}.r2.cloudflarestorage.com/${r2Bucket}/${key}` };
}

async function uploadGeneralImageToR2(file, folder = "general") {
  const safeFolder = String(folder).trim() || "general";
  const ext = (file.originalname || "image.png").split(".").pop()?.toLowerCase() || "png";
  const key = `${safeFolder}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  await r2Client.send(new PutObjectCommand({
    Bucket: r2Bucket,
    Key: key,
    Body: file.buffer,
    ContentLength: file.size,
    ContentType: file.mimetype || "image/png",
    Metadata: { folder: safeFolder },
  }));
  return { key, url: `https://${cloudflareAccountId}.r2.cloudflarestorage.com/${r2Bucket}/${key}` };
}

async function uploadPdfToR2(file, studentId, fieldName) {
  const key = `admissions/${studentId}/${fieldName}.pdf`;
  await r2Client.send(new PutObjectCommand({
    Bucket: r2Bucket,
    Key: key,
    Body: file.buffer,
    ContentLength: file.size,
    ContentType: "application/pdf",
    Metadata: { studentId, documentType: fieldName },
  }));
  return { key, url: `r2://${r2Bucket}/${key}` };
}

async function uploadDocumentToR2(file, folder = "documents") {
  const safeFolder = String(folder).trim() || "documents";
  const safeName = path.basename(file.originalname || "document.pdf").replace(/[^a-zA-Z0-9._-]+/g, "-");
  const key = `${safeFolder}/${Date.now()}-${safeName}`;
  await r2Client.send(new PutObjectCommand({
    Bucket: r2Bucket,
    Key: key,
    Body: file.buffer,
    ContentLength: file.size,
    ContentType: file.mimetype || "application/octet-stream",
    Metadata: { folder: safeFolder },
  }));
  return { key, url: `https://${cloudflareAccountId}.r2.cloudflarestorage.com/${r2Bucket}/${key}` };
}

async function deleteUploadedObjects({ r2Keys }) {
  const cleanup = [];
  if (r2Client && r2Bucket) {
    cleanup.push(...r2Keys.map((key) => r2Client.send(new DeleteObjectCommand({ Bucket: r2Bucket, Key: key }))));
  }
  await Promise.allSettled(cleanup);
}

function buildAdmissionEmail({ studentId, nom, postnom, prenom, email, domaine, filiere, promotion, annee_academique }) {
  const name = [prenom, nom, postnom].filter(Boolean).join(" ");
  const reference = `UPG-ADM-${studentId.slice(0, 8).toUpperCase()}`;
  const safe = {
    name: escapeHtml(name),
    email: escapeHtml(email),
    domaine: escapeHtml(domaine),
    filiere: escapeHtml(filiere),
    promotion: escapeHtml(promotion),
    annee: escapeHtml(annee_academique),
    reference: escapeHtml(reference),
  };
  return {
    subject: "Votre dossier d’inscription a bien été reçu — UPG",
    text: `Bonjour ${name},\n\nL’Université Polytechnique de Goma a bien reçu votre dossier d’inscription.\n\nRéférence : ${reference}\nFaculté : ${domaine}\nFilière : ${filiere}\nPromotion : ${promotion}\nAnnée académique : ${annee_academique}\n\nVotre dossier est en attente de validation. Cet e-mail confirme sa réception, pas encore l’admission définitive.\n\nUniversité Polytechnique de Goma`,
    html: `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirmation d’inscription UPG</title></head><body style="margin:0;background:#f2f5f1;font-family:Arial,Helvetica,sans-serif;color:#20352d"><div style="max-width:600px;margin:32px auto;padding:0 16px"><div style="overflow:hidden;border:1px solid #dce5de;border-radius:12px;background:#fff"><div style="padding:24px 28px;background:#153d33;color:#fff"><div style="font-size:12px;font-weight:bold;letter-spacing:2px;color:#f0c46b">UPG · ADMISSIONS</div><h1 style="margin:10px 0 0;font-size:22px;line-height:1.3">Votre dossier a bien été reçu</h1></div><div style="padding:28px"><p>Bonjour <strong>${safe.name}</strong>,</p><p style="line-height:1.6;color:#52665c">L’Université Polytechnique de Goma confirme la réception de votre demande d’inscription.</p><div style="padding:18px;border:1px solid #dce5de;border-radius:8px;background:#f8faf8"><div style="font-size:12px;color:#64756b">RÉFÉRENCE DU DOSSIER</div><div style="margin:8px 0 16px;font-size:18px;font-weight:bold;color:#205b4b">${safe.reference}</div><table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.6"><tr><td style="padding:5px 0;color:#64756b">Faculté</td><td style="padding:5px 0;text-align:right;font-weight:bold">${safe.domaine}</td></tr><tr><td style="padding:5px 0;color:#64756b">Filière</td><td style="padding:5px 0;text-align:right;font-weight:bold">${safe.filiere}</td></tr><tr><td style="padding:5px 0;color:#64756b">Promotion</td><td style="padding:5px 0;text-align:right;font-weight:bold">${safe.promotion}</td></tr><tr><td style="padding:5px 0;color:#64756b">Année académique</td><td style="padding:5px 0;text-align:right;font-weight:bold">${safe.annee}</td></tr></table></div><p style="margin-top:20px;padding:14px 16px;border-left:3px solid #f0c46b;background:#fbf8ef;font-size:14px;line-height:1.6">Votre dossier est <strong>en attente de validation</strong>. Cet e-mail confirme sa réception, pas encore l’admission définitive.</p><p style="font-size:14px;color:#52665c">Une question ? Répondez à cet e-mail ou contactez le service des admissions de l’UPG.</p></div><div style="padding:16px 28px;border-top:1px solid #e7ece8;font-size:12px;color:#718078">Université Polytechnique de Goma · Goma, RDC<br>Message envoyé à ${safe.email}</div></div></div></body></html>`,
  };
}

async function sendAdmissionEmail(student) {
  const content = buildAdmissionEmail(student);
  const sender = process.env.EMAIL_FROM || process.env.BREVO_SENDER_EMAIL;

  if (process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL) {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { name: process.env.BREVO_SENDER_NAME || "Université Polytechnique de Goma", email: process.env.BREVO_SENDER_EMAIL },
        to: [{ email: student.email, name: [student.prenom, student.nom, student.postnom].filter(Boolean).join(" ") }],
        subject: content.subject,
        htmlContent: content.html,
        textContent: content.text,
      }),
    });
    if (!response.ok) throw new Error(`Brevo API returned HTTP ${response.status}`);
    return true;
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && sender) {
    const port = Number(process.env.SMTP_PORT || 587);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE === "true" || port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({ from: sender, to: student.email, ...content });
    transporter.close();
    return true;
  }

  return false;
}

const admissionSubmissionLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: Number(process.env.ADMISSION_SUBMISSIONS_PER_HOUR || 5),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Trop de tentatives. Réessayez dans une heure." },
});

const newsletterSubmissionLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: Number(process.env.NEWSLETTER_SUBMISSIONS_PER_HOUR || 5),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Trop de tentatives. Réessayez plus tard." },
});

app.post("/api/newsletter/subscribe", newsletterSubmissionLimit, async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!authPool) return res.status(503).json({ error: "La base newsletter n’est pas configurée." });
  if (!name || name.length > 120) return res.status(400).json({ error: "Le nom est obligatoire (120 caractères maximum)." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return res.status(400).json({ error: "Adresse e-mail invalide." });

  try {
    const token = randomUUID();
    const unsubscribeToken = randomUUID();
    const { rows } = await authPool.query(
      `INSERT INTO public.newsletter_subscribers AS subscriber (name, email, confirmed, confirmation_token, unsubscribe_token)
       VALUES ($1, $2, false, $3, $4)
       ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name,
         confirmed = CASE WHEN subscriber.unsubscribed_at IS NOT NULL THEN false ELSE subscriber.confirmed END,
         confirmation_token = CASE WHEN subscriber.confirmed AND subscriber.unsubscribed_at IS NULL THEN subscriber.confirmation_token ELSE EXCLUDED.confirmation_token END,
         unsubscribe_token = CASE WHEN subscriber.unsubscribed_at IS NOT NULL THEN EXCLUDED.unsubscribe_token ELSE subscriber.unsubscribe_token END,
         unsubscribed_at = NULL
       RETURNING confirmed, confirmation_token`,
      [name, email, token, unsubscribeToken],
    );

    if (!rows[0].confirmed) {
      const origin = req.get("origin");
      const appOrigin = process.env.APP_PUBLIC_URL?.trim()
        || (origin && allowedOrigins.has(origin) ? origin : "https://www.upgoma.org");
      const confirmationUrl = `${appOrigin.replace(/\/$/, "")}/confirmer-newsletter?token=${encodeURIComponent(rows[0].confirmation_token)}`;
      const safeName = escapeHtml(name);
      const safeUrl = escapeHtml(confirmationUrl);
      await deliverEmail({
        to: email,
        name,
        subject: "Confirmez votre inscription à la newsletter UPG",
        text: `Bonjour ${name},\n\nConfirmez votre inscription à la newsletter de l’Université Polytechnique de Goma en ouvrant ce lien : ${confirmationUrl}\n\nSi vous n’êtes pas à l’origine de cette demande, ignorez ce message.`,
        html: `<!doctype html><html lang="fr"><body style="margin:0;padding:32px;background:#f3f6f2;font-family:Arial,sans-serif;color:#20352d"><main style="max-width:560px;margin:auto;padding:28px;background:#fff;border:1px solid #dce5de;border-radius:8px"><p style="font-size:12px;font-weight:bold;color:#205b4b">UNIVERSITÉ POLYTECHNIQUE DE GOMA</p><h1 style="font-size:22px">Confirmez votre inscription</h1><p>Bonjour <strong>${safeName}</strong>,</p><p>Confirmez votre adresse pour recevoir les actualités de l’UPG.</p><p style="margin:28px 0"><a href="${safeUrl}" style="padding:12px 18px;background:#205b4b;color:#fff;text-decoration:none;border-radius:4px">Confirmer mon adresse</a></p><p style="font-size:13px;color:#64756b">Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.</p></main></body></html>`,
      });
    }

    return res.status(202).json({ ok: true, message: "Si votre adresse doit être confirmée, un e-mail vient de vous être envoyé." });
  } catch (error) {
    console.error("[newsletter/subscribe] Failed:", error instanceof Error ? error.message : "unknown error");
    return res.status(503).json({ error: "Impossible de traiter l’inscription newsletter pour le moment." });
  }
});

app.post("/api/newsletter/confirm", async (req, res) => {
  const token = typeof req.body.token === "string" ? req.body.token.trim() : "";
  if (!authPool) return res.status(503).json({ error: "La base newsletter n’est pas configurée." });
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) {
    return res.status(400).json({ error: "Lien de confirmation invalide." });
  }

  try {
    const { rows } = await authPool.query(
      "UPDATE public.newsletter_subscribers SET confirmed = true, confirmed_at = COALESCE(confirmed_at, now()) WHERE confirmation_token = $1::uuid RETURNING id",
      [token],
    );
    if (!rows.length) return res.status(404).json({ error: "Ce lien est invalide." });
    return res.json({ ok: true });
  } catch (error) {
    console.error("[newsletter/confirm] Failed:", error instanceof Error ? error.message : "unknown error");
    return res.status(503).json({ error: "Impossible de confirmer l’inscription pour le moment." });
  }
});

app.post("/api/newsletter/unsubscribe", async (req, res) => {
  const token = typeof req.body.token === "string" ? req.body.token.trim() : "";
  if (!authPool) return res.status(503).json({ error: "La base newsletter n’est pas configurée." });
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) {
    return res.status(400).json({ error: "Lien de désabonnement invalide." });
  }

  try {
    const { rows } = await authPool.query(
      "UPDATE public.newsletter_subscribers SET unsubscribed_at = COALESCE(unsubscribed_at, now()) WHERE unsubscribe_token = $1::uuid RETURNING id",
      [token],
    );
    if (!rows.length) return res.status(404).json({ error: "Ce lien est invalide." });
    return res.json({ ok: true });
  } catch (error) {
    console.error("[newsletter/unsubscribe] Failed:", error instanceof Error ? error.message : "unknown error");
    return res.status(503).json({ error: "Impossible de traiter le désabonnement pour le moment." });
  }
});

app.post("/api/admissions", admissionSubmissionLimit, uploadFields, async (req, res) => {
  const objects = { r2Keys: [] };
  let studentSaved = false;

  try {
    if (!supabase) {
      return res.status(503).json({ error: "Le stockage des inscriptions n’est pas configuré." });
    }
    if (!r2Client || !r2Bucket) {
      return res.status(503).json({ error: "Le stockage Cloudflare R2 n’est pas configuré pour les images et documents." });
    }

    const body = req.body;
    const str = (key) => (typeof body[key] === "string" ? body[key].trim() : "");
    const admission = {
      nom: str("nom"),
      postnom: str("postnom"),
      prenom: str("prenom"),
      sexe: str("sexe"),
      date_naissance: str("date_naissance"),
      lieu_naissance: str("lieu_naissance"),
      nationalite: str("nationalite") || "Congolaise",
      telephone: str("telephone"),
      email: str("email").toLowerCase(),
      adresse: str("adresse"),
      domaine: str("domaine"),
      filiere: str("filiere"),
      promotion: str("promotion"),
      annee_academique: str("annee_academique") || "2025-2026",
    };

    if (Object.entries(admission).some(([key, value]) => key !== "nationalite" && !value)) {
      return res.status(400).json({ error: "Veuillez compléter tous les champs obligatoires." });
    }
    if (!SEXES.has(admission.sexe)) return res.status(400).json({ error: "Sexe invalide." });
    if (!PROMOTIONS.has(admission.promotion)) return res.status(400).json({ error: "Promotion invalide." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(admission.email)) return res.status(400).json({ error: "Adresse e-mail invalide." });

    const files = req.files || {};
    const photo = files.photo?.[0];
    if (!photo) return res.status(400).json({ error: "La photo passeport est obligatoire." });
    if (photo.size > MAX_PHOTO_SIZE) return res.status(400).json({ error: "La photo ne doit pas dépasser 5 Mo." });
    if (photo.buffer.subarray(0, 3).toString("hex") !== "ffd8ff" &&
        photo.buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a" &&
        photo.buffer.subarray(0, 4).toString() !== "RIFF" &&
        !["image/webp", "image/heic", "image/heif"].includes(photo.mimetype)) {
      return res.status(400).json({ error: "Le fichier photo n’est pas une image acceptée." });
    }

    const documents = Object.fromEntries(PDF_FIELDS
      .map((field) => [field, files[field]?.[0]])
      .filter(([, file]) => Boolean(file)));
    for (const [field, file] of Object.entries(documents)) {
      if (file.size > 10 * 1024 * 1024 || file.buffer.subarray(0, 5).toString() !== "%PDF-") {
        return res.status(400).json({ error: `Le document ${field} doit être un PDF valide de 10 Mo maximum.` });
      }
    }
    if (Object.keys(documents).length && (!r2Client || !r2Bucket)) {
      return res.status(503).json({ error: "Le stockage des documents PDF n’est pas configuré." });
    }

    const studentId = randomUUID();
    const photoObject = await uploadPhotoToR2(photo, studentId);
    objects.r2Keys.push(photoObject.key);
    const documentUrls = {};

    for (const [field, file] of Object.entries(documents)) {
      const object = await uploadPdfToR2(file, studentId, field);
      objects.r2Keys.push(object.key);
      documentUrls[`${field}_url`] = object.url;
    }

    const { error: insertError } = await supabase.from("students").insert({
      id: studentId,
      ...admission,
      status: "pending",
      photo_url: photoObject.url,
      diplome_url: documentUrls.diplome_url ?? null,
      bulletin_url: documentUrls.bulletin_url ?? null,
      attestation_url: documentUrls.attestation_url ?? null,
    });
    if (insertError) throw insertError;
    studentSaved = true;

    let emailConfirmationSent = false;
    try {
      emailConfirmationSent = await sendAdmissionEmail({ ...admission, id: studentId });
    } catch (emailError) {
      console.error("[admission email] Delivery failed:", emailError instanceof Error ? emailError.message : "unknown error");
    }

    return res.status(201).json({
      ok: true,
      studentId,
      reference: `UPG-ADM-${studentId.slice(0, 8).toUpperCase()}`,
      emailConfirmationSent,
    });
  } catch (error) {
    if (!studentSaved) await deleteUploadedObjects(objects);
    console.error("[admission-api] Submission failed:", error instanceof Error ? error.message : "unknown error");
    return res.status(500).json({ error: "Impossible d’enregistrer l’inscription. Veuillez réessayer." });
  }
});

app.post("/api/uploads", genericUpload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier reçu." });
    }

    const type = String(req.body.type || "image").toLowerCase();
    const folder = String(req.body.folder || "general").trim() || "general";

    if (type === "image") {
      if (!r2Client || !r2Bucket) {
        return res.status(503).json({ error: "Cloudflare R2 n’est pas configuré côté serveur. Vérifiez CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY et CLOUDFLARE_R2_BUCKET." });
      }

      const result = await uploadGeneralImageToR2(req.file, folder);
      return res.status(201).json({ ok: true, url: result.url, key: result.key, type });
    }

    if (type === "document") {
      if (!r2Client || !r2Bucket) {
        return res.status(503).json({ error: "Cloudflare R2 n’est pas configuré côté serveur. Vérifiez CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY et CLOUDFLARE_R2_BUCKET." });
      }

      const result = await uploadDocumentToR2(req.file, folder);
      return res.status(201).json({ ok: true, url: result.url, key: result.key, type });
    }

    return res.status(400).json({ error: "Le type de fichier doit être 'image' ou 'document'." });
  } catch (error) {
    console.error("[api/uploads] Failed:", error instanceof Error ? error.message : "unknown error");
    return res.status(500).json({ error: error instanceof Error ? error.message : "Erreur serveur lors de l’upload." });
  }
});

// Stripe Checkout API
app.post("/api/create-checkout-session", async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: "Stripe not configured" });
  }

  try {
    const { items, successUrl, cancelUrl, metadata = {} } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Invalid items" });
    }

    const totalAmount = items.reduce((sum, item) => sum + (item.amount * item.quantity), 0);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            description: item.description || "",
          },
          unit_amount: item.amount,
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      success_url: successUrl || `${req.headers.origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.origin}/checkout-cancel`,
      metadata: {
        ...metadata,
        total_amount: totalAmount.toString(),
      },
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error("Stripe API error:", error);
    res.status(500).json({ error: error.message || "Failed to create checkout session" });
  }
});

app.get("/api/checkout-session", async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: "Stripe not configured" });
  }

  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ error: "Session ID required" });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    res.json(session);
  } catch (error) {
    console.error("Stripe session retrieval error:", error);
    res.status(500).json({ error: error.message || "Failed to retrieve session" });
  }
});

app.use((err, _req, res, _next) => {
  if (err && err.name === "MulterError") {
    return res.status(400).json({ error: err.message || "Fichier refusé." });
  }
  console.error(err);
  res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
});

const port = Number(process.env.ADMISSION_API_PORT || 8787);
app.listen(port, "127.0.0.1", () => {
  console.log(`[admission-api] http://127.0.0.1:${port} — PostgreSQL via DATABASE_URL`);
});
