require("dns").setDefaultResultOrder("ipv4first");
const nodemailer = require("nodemailer");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();

const allowedOrigins = new Set([
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean));

app.use(cors({
  origin: (origin, callback) => {
    // Autorise les requêtes sans origin (ex: Postman, mobile) et toutes les origines connues
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    // En production, on accepte la même origine que le serveur
    if (process.env.NODE_ENV === "production") return callback(null, true);
    callback(new Error(`CORS: origine non autorisée — ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

const { randomBytes } = require("crypto");
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  JWT_SECRET = randomBytes(48).toString("hex");
  console.error("⚠️  JWT_SECRET non défini — une clé aléatoire est utilisée pour cette session.");
  console.error("⚠️  Ajoutez JWT_SECRET dans vos variables Railway pour que les sessions persistent.");
}
const SALT_ROUNDS = 10;

// ── Connexion MySQL (local et Railway) ────────────────────────
const mysql = require("mysql2/promise");
function buildMysqlPool() {
  if (process.env.MYSQL_URL) {
    const sep = process.env.MYSQL_URL.includes("?") ? "&" : "?";
    return mysql.createPool(
      process.env.MYSQL_URL + sep + "waitForConnections=true&connectionLimit=10&queueLimit=0&multipleStatements=false"
    );
  }
  return mysql.createPool({
    host:     process.env.DB_HOST     || process.env.MYSQLHOST     || "localhost",
    port:     parseInt(process.env.DB_PORT || process.env.MYSQLPORT || "3306"),
    user:     process.env.DB_USER     || process.env.MYSQLUSER     || "root",
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || "KouameKouakouElise",
    database: process.env.DB_NAME     || process.env.MYSQLDATABASE || "cotisation_pro",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: "local",
  });
}
const pool = buildMysqlPool();

// ── SSE clients : compteId → Set<Response> ────────────────────
const sseClients = new Map();
function broadcastToCompte(compteId, eventName, data) {
  const clients = sseClients.get(String(compteId));
  if (!clients || clients.size === 0) return;
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    try { client.write(payload); } catch {}
  }
}

// ── Store OTP en mémoire : email → { code, expires } ──────────
const otpStore = new Map();

// ── Rate limiting OTP : email → { count, firstAt } ────────────
const otpRateLimit = new Map();
const OTP_MAX_REQUESTS = 3;
const OTP_WINDOW_MS    = 10 * 60 * 1000; // 10 minutes

function checkOtpRateLimit(emailKey) {
  const now = Date.now();
  const entry = otpRateLimit.get(emailKey);
  if (!entry || now - entry.firstAt > OTP_WINDOW_MS) {
    otpRateLimit.set(emailKey, { count: 1, firstAt: now });
    return true;
  }
  if (entry.count >= OTP_MAX_REQUESTS) return false;
  entry.count++;
  return true;
}

// Nettoyage périodique des OTPs et rate limits expirés (toutes les 15 min)
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of otpStore.entries())     if (now > val.expires)              otpStore.delete(key);
  for (const [key, val] of otpRateLimit.entries()) if (now - val.firstAt > OTP_WINDOW_MS) otpRateLimit.delete(key);
}, 15 * 60 * 1000);

// ── Envoi email via Gmail SMTP (port 465 SSL) ─────────────────
const GMAIL_USER = process.env.EMAIL_USER;
const GMAIL_PASS = process.env.EMAIL_PASS;
const emailReady = !!(GMAIL_USER && GMAIL_PASS);

let transporter = null;
if (!emailReady) {
  console.warn("⚠️  EMAIL_USER ou EMAIL_PASS manquant — envoi d'OTP désactivé.");
} else {
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: GMAIL_USER, pass: GMAIL_PASS },
  });
  console.log(`✉️  Email (Gmail SSL) prêt — expéditeur : ${GMAIL_USER}`);
}

async function sendEmail({ to, subject, html }) {
  if (!transporter) throw new Error("Service email non configuré.");
  await transporter.sendMail({
    from: `"Cotisation Pro" <${GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

// ── Envoi SMS via Africa's Talking ─────────────────────────────
const AT_USERNAME   = process.env.AT_USERNAME;
const AT_API_KEY    = process.env.AT_API_KEY;
const AT_SENDER_ID  = process.env.AT_SENDER_ID  || "CotisaPro";
const AT_COUNTRY    = process.env.AT_COUNTRY     || "225"; // +225 = Côte d'Ivoire par défaut
const smsReady      = !!(AT_USERNAME && AT_API_KEY);

let atSMS = null;
if (smsReady) {
  try {
    const AfricasTalking = require("africastalking");
    const at = AfricasTalking({ username: AT_USERNAME, apiKey: AT_API_KEY });
    atSMS = at.SMS;
    console.log(`📱 SMS (Africa's Talking) prêt — expéditeur : ${AT_SENDER_ID}`);
  } catch (e) {
    console.warn("⚠️  Erreur initialisation Africa's Talking :", e.message);
  }
} else {
  console.warn("⚠️  AT_USERNAME ou AT_API_KEY manquant — envoi de SMS désactivé.");
}

function normaliserTelephone(tel) {
  if (!tel) return null;
  let n = String(tel).replace(/[\s\-().]/g, "");
  if (n.startsWith("+")) return n;
  if (n.startsWith("00")) return "+" + n.slice(2);
  // Numéro local sans indicatif → ajouter le pays par défaut
  if (!n.startsWith(AT_COUNTRY)) n = AT_COUNTRY + n;
  return "+" + n;
}

async function sendSMS(telephone, message) {
  if (!atSMS) throw new Error("Service SMS non configuré.");
  const to = normaliserTelephone(telephone);
  if (!to) throw new Error("Numéro de téléphone invalide.");
  await atSMS.send({ to: [to], message, from: AT_SENDER_ID });
}

const PWD_ERROR = "Le mot de passe doit contenir au moins 8 caractères, une minuscule, une majuscule, un chiffre et un caractère spécial (ex: @, #, !, %).";
const pwdOk = (p) => p && p.length >= 8 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /[0-9]/.test(p) && /[^a-zA-Z0-9]/.test(p);

function generatePassword(length = 8) {
  const { randomBytes } = require("crypto");
  const chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(length);
  let pwd = "";
  for (let i = 0; i < length; i++) pwd += chars[bytes[i] % chars.length];
  return pwd;
}

// ── Initialisation de la base de données ──────────────────────
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS comptes (
      id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      nom_association  VARCHAR(200) NOT NULL,
      email            VARCHAR(150) NOT NULL,
      mot_de_passe     VARCHAR(255) NOT NULL,
      created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS adherents (
      id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      compte_id        INT UNSIGNED NOT NULL DEFAULT 0,
      matricule        VARCHAR(50),
      nom              VARCHAR(100) NOT NULL,
      prenom           VARCHAR(100) NOT NULL,
      telephone        VARCHAR(30),
      email            VARCHAR(150),
      date_inscription DATE,
      photo            MEDIUMTEXT DEFAULT NULL,
      est_supprime     TINYINT(1) NOT NULL DEFAULT 0,
      created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_compte (compte_id),
      INDEX idx_nom_prenom (nom, prenom)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS matricule_counter (
      compte_id INT UNSIGNED NOT NULL,
      annee     SMALLINT NOT NULL,
      compteur  INT NOT NULL DEFAULT 0,
      PRIMARY KEY (compte_id, annee)
    ) ENGINE=InnoDB
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cotisations (
      id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      compte_id  INT UNSIGNED NOT NULL DEFAULT 0,
      libelle    VARCHAR(200) NOT NULL,
      montant_du DECIMAL(15,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_compte (compte_id),
      UNIQUE KEY uniq_compte_libelle (compte_id, libelle)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS paiements (
      id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      adherent_id   INT UNSIGNED NOT NULL,
      cotisation_id INT UNSIGNED NOT NULL,
      solde_paye    DECIMAL(15,2) NOT NULL DEFAULT 0,
      reste         DECIMAL(15,2) NOT NULL DEFAULT 0,
      statut        ENUM('Impayé','Partiel','Payé') NOT NULL DEFAULT 'Impayé',
      UNIQUE KEY uniq_adh_cot (adherent_id, cotisation_id),
      FOREIGN KEY (adherent_id)   REFERENCES adherents(id)   ON DELETE CASCADE,
      FOREIGN KEY (cotisation_id) REFERENCES cotisations(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      paiement_id   INT UNSIGNED NOT NULL,
      numero_recu   VARCHAR(100),
      montant_paye  DECIMAL(15,2) NOT NULL,
      mode_paiement VARCHAR(50) DEFAULT 'Espèces',
      date_paiement DATE,
      FOREIGN KEY (paiement_id) REFERENCES paiements(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS demandes_paiement (
      id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      adherent_id     INT UNSIGNED NOT NULL,
      cotisation_id   INT UNSIGNED NOT NULL,
      montant         DECIMAL(15,2) NOT NULL,
      numero_transaction VARCHAR(100),
      statut          ENUM('en_attente','approuve','rejete') NOT NULL DEFAULT 'en_attente',
      date_demande    DATETIME DEFAULT CURRENT_TIMESTAMP,
      date_traitement DATETIME,
      note_refus      VARCHAR(255),
      FOREIGN KEY (adherent_id)   REFERENCES adherents(id)   ON DELETE CASCADE,
      FOREIGN KEY (cotisation_id) REFERENCES cotisations(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      compte_id  INT UNSIGNED NOT NULL,
      titre      VARCHAR(255) NOT NULL,
      contenu    TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_compte (compte_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Table likes messages
  await pool.query(`
    CREATE TABLE IF NOT EXISTS message_likes (
      id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      message_id INT UNSIGNED NOT NULL,
      liker_key  VARCHAR(50)  NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_like (message_id, liker_key),
      INDEX idx_msg (message_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Migrations silencieuses pour les tables existantes
  await pool.query(`DROP TRIGGER IF EXISTS trg_before_transaction_insert`);
  await pool.query(`DROP TRIGGER IF EXISTS trg_after_transaction_insert`);
  try { await pool.query(`ALTER TABLE adherents ADD COLUMN est_supprime TINYINT(1) NOT NULL DEFAULT 0`); } catch (_) {}
  try { await pool.query(`ALTER TABLE adherents ADD COLUMN compte_id INT UNSIGNED NOT NULL DEFAULT 0`); } catch (_) {}
  try { await pool.query(`ALTER TABLE adherents ADD COLUMN photo MEDIUMTEXT DEFAULT NULL`); } catch (_) {}
  try { await pool.query(`ALTER TABLE cotisations ADD COLUMN compte_id INT UNSIGNED NOT NULL DEFAULT 0`); } catch (_) {}
  try { await pool.query(`ALTER TABLE messages ADD COLUMN auteur_nom VARCHAR(100) DEFAULT NULL`); } catch (_) {}
  try { await pool.query(`ALTER TABLE messages ADD COLUMN auteur_prenom VARCHAR(100) DEFAULT NULL`); } catch (_) {}
  try { await pool.query(`ALTER TABLE messages ADD COLUMN auteur_poste VARCHAR(150) DEFAULT NULL`); } catch (_) {}
  try { await pool.query(`ALTER TABLE message_likes ADD COLUMN emoji VARCHAR(10) NOT NULL DEFAULT '👍'`); } catch (_) {}
  try { await pool.query(`ALTER TABLE message_likes ADD COLUMN liker_nom VARCHAR(100) DEFAULT NULL`); } catch (_) {}
  try { await pool.query(`ALTER TABLE message_likes DROP INDEX uniq_like`); } catch (_) {}
  try { await pool.query(`ALTER TABLE message_likes ADD UNIQUE KEY uniq_like_emoji (message_id, liker_key, emoji)`); } catch (_) {}
  try { await pool.query(`ALTER TABLE messages ADD COLUMN sender_key VARCHAR(50) DEFAULT NULL`); } catch (_) {}

  const [badIndexes] = await pool.query(`
    SELECT DISTINCT s.INDEX_NAME
    FROM information_schema.STATISTICS s
    WHERE s.TABLE_SCHEMA = DATABASE()
      AND s.TABLE_NAME   = 'adherents'
      AND s.NON_UNIQUE   = 0
      AND s.INDEX_NAME  != 'PRIMARY'
      AND s.INDEX_NAME  != 'uniq_compte_matricule'
      AND s.COLUMN_NAME  = 'matricule'
      AND s.INDEX_NAME NOT IN (
        SELECT INDEX_NAME
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'adherents'
          AND COLUMN_NAME  = 'compte_id'
          AND NON_UNIQUE   = 0
      )
  `);
  for (const { INDEX_NAME } of badIndexes) {
    try { await pool.query(`ALTER TABLE adherents DROP INDEX \`${INDEX_NAME}\``); } catch (_) {}
  }

  try { await pool.query(`ALTER TABLE adherents ADD UNIQUE KEY uniq_compte_matricule (compte_id, matricule)`); } catch (_) {}
  try { await pool.query(`ALTER TABLE cotisations ADD UNIQUE KEY uniq_compte_libelle (compte_id, libelle)`); } catch (_) {}
  try {
    await pool.query(`ALTER TABLE matricule_counter ADD COLUMN compte_id INT UNSIGNED NOT NULL DEFAULT 0`);
    await pool.query(`ALTER TABLE matricule_counter DROP PRIMARY KEY`);
    await pool.query(`ALTER TABLE matricule_counter ADD PRIMARY KEY (compte_id, annee)`);
  } catch (_) {}

  // Migrations rôles & téléphone
  try { await pool.query(`ALTER TABLE comptes ADD COLUMN role ENUM('admin','user') NOT NULL DEFAULT 'admin'`); } catch (_) {}
  try { await pool.query(`ALTER TABLE comptes ADD COLUMN telephone VARCHAR(30)`); } catch (_) {}
  try { await pool.query(`ALTER TABLE comptes ADD COLUMN admin_compte_id INT UNSIGNED NULL`); } catch (_) {}
  try { await pool.query(`ALTER TABLE comptes ADD COLUMN adherent_id INT UNSIGNED NULL`); } catch (_) {}
  try { await pool.query(`ALTER TABLE comptes ADD COLUMN invite_token VARCHAR(64) NULL`); } catch (_) {}
  try { await pool.query(`ALTER TABLE adherents ADD COLUMN poste VARCHAR(100) DEFAULT NULL`); } catch (_) {}

  // Migrations Mobile Money
  try { await pool.query(`ALTER TABLE comptes ADD COLUMN om_numero VARCHAR(30) NULL`); } catch (_) {}
  try { await pool.query(`ALTER TABLE comptes ADD COLUMN om_nom VARCHAR(100) NULL`); } catch (_) {}
  try { await pool.query(`ALTER TABLE comptes ADD COLUMN wave_numero VARCHAR(30) NULL`); } catch (_) {}
  try { await pool.query(`ALTER TABLE comptes ADD COLUMN wave_nom VARCHAR(100) NULL`); } catch (_) {}
  try { await pool.query(`ALTER TABLE comptes ADD COLUMN mtn_numero VARCHAR(30) NULL`); } catch (_) {}
  try { await pool.query(`ALTER TABLE comptes ADD COLUMN mtn_nom VARCHAR(100) NULL`); } catch (_) {}
  try { await pool.query(`ALTER TABLE demandes_paiement ADD COLUMN operateur VARCHAR(50) NULL`); } catch (_) {}

  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      compte_id    INT UNSIGNED NOT NULL,
      user_id      INT UNSIGNED NULL,
      user_type    ENUM('admin','user') NOT NULL DEFAULT 'admin',
      action       VARCHAR(100) NOT NULL,
      details      TEXT NULL,
      ip_address   VARCHAR(45) NULL,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_compte_audit (compte_id),
      INDEX idx_created_audit (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS depenses (
      id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      compte_id     INT UNSIGNED NOT NULL,
      libelle       VARCHAR(200) NOT NULL,
      montant       DECIMAL(15,2) NOT NULL,
      categorie     VARCHAR(100) NOT NULL DEFAULT 'Autre',
      date_depense  DATE NOT NULL,
      description   TEXT NULL,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_compte_depense (compte_id),
      INDEX idx_date_depense (date_depense)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS budgets (
      id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      compte_id     INT UNSIGNED NOT NULL,
      libelle       VARCHAR(200) NOT NULL,
      montant_prevu DECIMAL(15,2) NOT NULL,
      date_debut    DATE NULL,
      date_fin      DATE NULL,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_compte_budget (compte_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  console.log("Base de données initialisée ✅");
}

// ── Middleware JWT ─────────────────────────────────────────────
async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentification requise." });
  }
  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.compteId = decoded.compteId;
    req.role = decoded.role || "admin";
    req.userId = decoded.userId;
    req.adherentId = decoded.adherentId;
    req.nomAssociation = decoded.nom_association;
    // Lire le poste depuis la BDD pour refléter les changements en temps réel
    if (decoded.role === "user" && decoded.adherentId) {
      try {
        const [[adh]] = await pool.query(
          "SELECT poste FROM adherents WHERE id = ? AND compte_id = ?",
          [decoded.adherentId, decoded.compteId]
        );
        req.poste = adh?.poste || null;
      } catch {
        req.poste = decoded.poste || null;
      }
    } else {
      req.poste = decoded.poste || null;
    }
    next();
  } catch {
    return res.status(401).json({ error: "Session expirée. Veuillez vous reconnecter." });
  }
}

// Créateur du compte uniquement
function adminMiddleware(req, res, next) {
  if (req.role !== "admin") {
    return res.status(403).json({ error: "Accès réservé au créateur de l'association." });
  }
  next();
}

// Trésorier : admin SI aucun trésorier n'est encore assigné, OU membre avec poste Trésorier
async function trésorierMiddleware(req, res, next) {
  if (req.role === "user" && req.poste && req.poste.toLowerCase().includes("trésorier")) return next();
  if (req.role === "admin") {
    try {
      const [[{ cnt }]] = await pool.query(
        "SELECT COUNT(*) as cnt FROM adherents WHERE compte_id = ? AND est_supprime = 0 AND poste LIKE '%trésorier%'",
        [req.compteId]
      );
      if (cnt === 0) return next(); // Pas encore de trésorier → l'admin conserve ce rôle
      return res.status(403).json({ error: "Accès réservé au trésorier." });
    } catch {
      return res.status(500).json({ error: "Erreur serveur." });
    }
  }
  return res.status(403).json({ error: "Accès réservé au trésorier." });
}

// Admin OU membre avec un poste (haut membre)
function hautMembreMiddleware(req, res, next) {
  if (req.role === "admin" || (req.role === "user" && req.poste)) return next();
  return res.status(403).json({ error: "Accès réservé aux membres ayant un poste." });
}

// Président : admin SI aucun président n'est encore assigné, OU membre avec poste Président
async function presidentMiddleware(req, res, next) {
  if (req.role === "user" && req.poste && req.poste.toLowerCase().includes("président")) return next();
  if (req.role === "admin") {
    try {
      const [[{ cnt }]] = await pool.query(
        "SELECT COUNT(*) as cnt FROM adherents WHERE compte_id = ? AND est_supprime = 0 AND poste LIKE '%résident%'",
        [req.compteId]
      );
      if (cnt === 0) return next(); // Pas encore de président → l'admin conserve ce rôle
      return res.status(403).json({ error: "Accès réservé au président." });
    } catch {
      return res.status(500).json({ error: "Erreur serveur." });
    }
  }
  return res.status(403).json({ error: "Accès réservé au président." });
}

// Attribution de postes : créateur SI aucun président n'existe encore, sinon seulement le président
async function canAssignPosteMiddleware(req, res, next) {
  // Membre avec poste Président : toujours autorisé
  if (req.role === "user" && req.poste && req.poste.toLowerCase().includes("président")) return next();

  if (req.role === "admin") {
    try {
      // Vérifier si le créateur lui-même est président (son propre adhérent)
      const [[adminAdh]] = await pool.query(
        "SELECT poste FROM adherents WHERE compte_id = ? AND est_supprime = 0 ORDER BY id ASC LIMIT 1",
        [req.compteId]
      );
      if (adminAdh?.poste && adminAdh.poste.toLowerCase().includes("président")) return next();

      // Vérifier si un président existe parmi les membres
      const [[{ cnt }]] = await pool.query(
        "SELECT COUNT(*) as cnt FROM adherents WHERE compte_id = ? AND est_supprime = 0 AND poste LIKE '%résident%'",
        [req.compteId]
      );
      if (cnt === 0) return next(); // Pas encore de président → le créateur peut attribuer
      return res.status(403).json({ error: "Un président est en place. Seul le président peut désormais attribuer des postes." });
    } catch {
      return res.status(500).json({ error: "Erreur serveur." });
    }
  }

  return res.status(403).json({ error: "Accès réservé au président." });
}

// ── Génération unique du matricule ─────────────────────────────
async function genererMatricule(conn, compteId) {
  const annee = new Date().getFullYear();
  await conn.query(
    "INSERT IGNORE INTO matricule_counter (compte_id, annee, compteur) VALUES (?, ?, 0)",
    [compteId, annee]
  );
  await conn.query(
    "UPDATE matricule_counter SET compteur = LAST_INSERT_ID(compteur + 1) WHERE compte_id = ? AND annee = ?",
    [compteId, annee]
  );
  const [[{ num }]] = await conn.query("SELECT LAST_INSERT_ID() AS num");
  return `ADH-${annee}-${String(num).padStart(3, "0")}`;
}

// ── Adresse IP du client ───────────────────────────────────────
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || req.ip || null;
}

// ── Journal d'audit ────────────────────────────────────────────
async function logAudit(compteId, userId, userType, action, details, ip) {
  try {
    await pool.query(
      "INSERT INTO audit_logs (compte_id, user_id, user_type, action, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
      [compteId, userId || null, userType || "admin", action, details || null, ip || null]
    );
  } catch (_) {}
}

// ═══════════════════════════════════════════════════════════════
// ROUTE — SSE (événements temps réel)
// ═══════════════════════════════════════════════════════════════
app.get("/api/events", (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).end();
  let compteId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    compteId = String(decoded.compteId);
  } catch {
    return res.status(401).end();
  }
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  if (!sseClients.has(compteId)) sseClients.set(compteId, new Set());
  sseClients.get(compteId).add(res);
  res.write("event: ping\ndata: connected\n\n");
  const keepAlive = setInterval(() => {
    try { res.write("event: ping\ndata: ping\n\n"); } catch {}
  }, 25000);
  req.on("close", () => {
    clearInterval(keepAlive);
    sseClients.get(compteId)?.delete(res);
  });
});

// ═══════════════════════════════════════════════════════════════
// ROUTE — SANTÉ (publique)
// ═══════════════════════════════════════════════════════════════
app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      status: "ok", db: "connected", time: new Date().toISOString(),
      email: emailReady, sms: smsReady,
    });
  } catch (err) {
    res.status(503).json({ status: "error", db: "disconnected", message: err.message });
  }
});

// Test d'envoi SMS (admin uniquement)
app.post("/api/admin/test-sms", authMiddleware, adminMiddleware, async (req, res) => {
  if (!atSMS) return res.status(503).json({ error: "Service SMS non configuré. Ajoutez AT_USERNAME et AT_API_KEY dans les variables d'environnement." });
  const { telephone } = req.body;
  if (!telephone) return res.status(400).json({ error: "Numéro de téléphone requis." });
  try {
    await sendSMS(telephone, `Test SMS Cotisation Pro ✓\nLe service SMS est opérationnel.\n${new Date().toLocaleString("fr-FR")}`);
    res.json({ ok: true, message: `SMS de test envoyé au ${telephone}.` });
  } catch (err) {
    res.status(500).json({ error: `Échec de l'envoi SMS : ${err.message}` });
  }
});

// ═══════════════════════════════════════════════════════════════
// ROUTES — AUTHENTIFICATION (publiques)
// ═══════════════════════════════════════════════════════════════

// Envoyer un code OTP par email (avant inscription)
app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email requis." });

    // Validation format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: "Adresse email invalide." });
    }

    // Vérifier que l'email est disponible (pas déjà utilisé)
    const emailKey = email.trim().toLowerCase();

    // Rate limiting : max 3 envois par email par 10 min
    if (!checkOtpRateLimit(emailKey)) {
      return res.status(429).json({ error: "Trop de demandes. Attendez 10 minutes avant de réessayer." });
    }

    if (!emailReady) {
      return res.status(503).json({ error: "Service email indisponible. Contactez l'administrateur." });
    }

    const code = String(Math.floor(1000 + Math.random() * 9000));
    otpStore.set(emailKey, { code, expires: Date.now() + 10 * 60 * 1000 });

    await sendEmail({
      to: emailKey,
      subject: "Votre code de vérification — Cotisation Pro",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8f9fa;border-radius:12px;">
          <h2 style="color:#2c3e50;margin-bottom:8px;">Cotisation Pro</h2>
          <p style="color:#555;margin-bottom:24px;">Voici votre code de vérification pour créer votre compte :</p>
          <div style="display:flex;gap:10px;justify-content:center;margin:24px 0;">
            ${code.split("").map(d => `<span style="display:inline-block;width:56px;height:64px;line-height:64px;text-align:center;font-size:32px;font-weight:bold;background:#fff;border:2px solid #2c3e50;border-radius:10px;color:#2c3e50;">${d}</span>`).join("")}
          </div>
          <p style="color:#888;font-size:13px;text-align:center;">Ce code expire dans <strong>10 minutes</strong>.<br>Si vous n'avez pas demandé ce code, ignorez cet email.</p>
        </div>
      `,
    });

    res.json({ message: "Code envoyé." });
  } catch (err) {
    console.error("Erreur envoi OTP:", err.message);
    res.status(500).json({ error: "Impossible d'envoyer l'email de vérification." });
  }
});

// Créer un compte
app.post("/api/auth/register", async (req, res) => {
  try {
    const { nom_association, email, mot_de_passe, nom, prenom, telephone } = req.body;

    if (!nom_association || !email || !mot_de_passe || !nom || !prenom) {
      return res.status(400).json({ error: "Tous les champs obligatoires sont requis (nom, prénom, association, email, mot de passe)." });
    }
    if (!pwdOk(mot_de_passe)) {
      return res.status(400).json({ error: PWD_ERROR });
    }

    const emailKey = email.trim().toLowerCase();

    // Vérifier unicité email + nom_association
    const [existingAccounts] = await pool.query(
      "SELECT id, nom_association, mot_de_passe, role FROM comptes WHERE email = ? AND role = 'admin'",
      [emailKey]
    );

    for (const account of existingAccounts) {
      if (account.nom_association.toLowerCase() === nom_association.trim().toLowerCase()) {
        return res.status(409).json({ error: "Un compte existe déjà pour cet email et cette association." });
      }
    }

    const hash = await bcrypt.hash(mot_de_passe, SALT_ROUNDS);
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [result] = await conn.query(
        "INSERT INTO comptes (nom_association, email, mot_de_passe, role, telephone) VALUES (?, ?, ?, 'admin', ?)",
        [nom_association.trim(), emailKey, hash, telephone ? telephone.trim() : null]
      );
      const adminId = result.insertId;

      // Créer automatiquement l'adhérent du créateur (sans poste attribué)
      const matricule = await genererMatricule(conn, adminId);
      await conn.query(
        `INSERT INTO adherents (compte_id, matricule, nom, prenom, email, telephone)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [adminId, matricule, nom.trim(), prenom.trim(), emailKey, telephone ? telephone.trim() : null]
      );

      await conn.commit();
      const token = jwt.sign(
        { compteId: adminId, email: emailKey, nom_association: nom_association.trim(), role: "admin" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Email de bienvenue (non bloquant)
      sendEmail({
        to: emailKey,
        subject: "Bienvenue sur Cotisation Pro !",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#f8fafc;border-radius:12px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:32px 24px;text-align:center;">
              <h1 style="color:white;margin:0;font-size:24px;">Bienvenue sur Cotisation Pro !</h1>
            </div>
            <div style="padding:28px 24px;background:white;">
              <p style="color:#374151;font-size:16px;">Bonjour <strong>${prenom.trim()} ${nom.trim()}</strong>,</p>
              <p style="color:#374151;font-size:15px;">Votre compte administrateur pour l'association <strong>${nom_association.trim()}</strong> a bien été créé.</p>
              <p style="color:#374151;font-size:15px;">Vous pouvez dès maintenant vous connecter et commencer à gérer vos cotisations.</p>
              <div style="text-align:center;margin:28px 0;">
                <a href="${process.env.FRONTEND_URL || 'https://cotisation-pro.up.railway.app'}"
                   style="background:#2563eb;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">
                  Accéder à mon espace
                </a>
              </div>
              <p style="color:#6b7280;font-size:13px;">Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.</p>
            </div>
            <div style="padding:16px 24px;background:#f1f5f9;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} Cotisation Pro — Tous droits réservés</p>
            </div>
          </div>
        `,
      }).catch((e) => console.warn("Email bienvenue non envoyé:", e.message));

      res.json({ token, nom_association: nom_association.trim(), email: emailKey, role: "admin" });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Connexion (email ou téléphone)
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;
    if (!email || !mot_de_passe) {
      return res.status(400).json({ error: "Email/téléphone et mot de passe requis." });
    }

    const identifier = email.trim();
    const identifierLower = identifier.toLowerCase();

    const [accounts] = await pool.query(
      `SELECT id, nom_association, email, telephone, mot_de_passe, role, admin_compte_id, adherent_id
       FROM comptes
       WHERE LOWER(email) = ? OR (telephone IS NOT NULL AND telephone != '' AND telephone = ?)`,
      [identifierLower, identifier]
    );

    if (accounts.length === 0) {
      return res.status(401).json({ error: "Email/téléphone ou mot de passe incorrect." });
    }

    for (const account of accounts) {
      const match = await bcrypt.compare(mot_de_passe, account.mot_de_passe);
      if (match) {
        let tokenPayload, responseData;

        if (account.role === "user") {
          // Récupérer le nom de l'association de l'admin parent
          const [[adminCompte]] = await pool.query(
            "SELECT nom_association FROM comptes WHERE id = ?",
            [account.admin_compte_id]
          );
          // Récupérer le poste de l'adhérent lié
          const [[adherentInfo]] = await pool.query(
            "SELECT poste FROM adherents WHERE id = ?",
            [account.adherent_id]
          );
          const poste = adherentInfo?.poste || null;
          tokenPayload = {
            compteId: account.admin_compte_id,
            userId: account.id,
            email: account.email || account.telephone,
            nom_association: adminCompte?.nom_association || "",
            role: "user",
            adherentId: account.adherent_id,
            poste,
          };
          responseData = {
            token: jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "7d" }),
            nom_association: adminCompte?.nom_association || "",
            email: account.email || account.telephone,
            role: "user",
            poste,
          };
          await logAudit(account.admin_compte_id, account.id, "user", "CONNEXION", `Connexion membre (${account.email || account.telephone})`, getClientIp(req));
        } else {
          tokenPayload = {
            compteId: account.id,
            email: account.email,
            nom_association: account.nom_association,
            role: "admin",
          };
          responseData = {
            token: jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "7d" }),
            nom_association: account.nom_association,
            email: account.email,
            role: "admin",
          };
          await logAudit(account.id, account.id, "admin", "CONNEXION", `Connexion créateur (${account.email})`, getClientIp(req));
        }

        return res.json(responseData);
      }
    }

    return res.status(401).json({ error: "Email/téléphone ou mot de passe incorrect." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Déconnexion — enregistre l'événement dans le journal d'audit
app.post("/api/auth/logout", authMiddleware, async (req, res) => {
  try {
    const [[compte]] = await pool.query("SELECT email, telephone FROM comptes WHERE id = ?", [req.userId || req.compteId]);
    const identity = compte?.email || compte?.telephone || (req.role === "admin" ? `admin#${req.compteId}` : `membre#${req.userId}`);
    const details = req.role === "admin"
      ? `Déconnexion admin (${identity})`
      : `Déconnexion membre (${identity})`;
    await logAudit(req.compteId, req.userId || req.compteId, req.role || "user", "DECONNEXION", details, getClientIp(req));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// L'inscription publique est toujours ouverte (multi-association)
app.get("/api/auth/registration-open", (_req, res) => {
  res.json({ open: true });
});

// Étape 1 — vérifier email + nom association (sans modifier le mot de passe)
app.post("/api/auth/verify-identity", async (req, res) => {
  try {
    const { email, nom_association } = req.body;
    if (!email || !nom_association) {
      return res.status(400).json({ error: "Email et nom de l'association requis." });
    }
    const emailKey = email.trim().toLowerCase();
    const [rows] = await pool.query(
      "SELECT id FROM comptes WHERE email = ? AND nom_association = ?",
      [emailKey, nom_association.trim()]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Email ou nom d'association incorrect." });
    }
    res.json({ message: "Identité vérifiée." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Étape 2 — réinitialisation de mot de passe (email + nom association + nouveau mot de passe)
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { email, nom_association, nouveau_mot_de_passe } = req.body;
    if (!email || !nom_association || !nouveau_mot_de_passe) {
      return res.status(400).json({ error: "Tous les champs sont requis." });
    }
    if (!pwdOk(nouveau_mot_de_passe)) {
      return res.status(400).json({ error: PWD_ERROR });
    }
    const emailKey = email.trim().toLowerCase();
    const [rows] = await pool.query(
      "SELECT id FROM comptes WHERE email = ? AND nom_association = ?",
      [emailKey, nom_association.trim()]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Aucun compte trouvé avec cet email et ce nom d'association." });
    }
    const hash = await bcrypt.hash(nouveau_mot_de_passe, 10);
    await pool.query(
      "UPDATE comptes SET mot_de_passe = ? WHERE email = ? AND nom_association = ?",
      [hash, emailKey, nom_association.trim()]
    );
    res.json({ message: "Mot de passe réinitialisé avec succès." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Vérifier le mot de passe actuel (connecté) — utilisé avant d'afficher étape 2
app.post("/api/auth/verify-password", authMiddleware, async (req, res) => {
  try {
    const { mot_de_passe } = req.body;
    if (!mot_de_passe) return res.status(400).json({ error: "Mot de passe requis." });
    const accountId = req.role === "user" ? req.userId : req.compteId;
    const [[compte]] = await pool.query("SELECT mot_de_passe FROM comptes WHERE id = ?", [accountId]);
    if (!compte) return res.status(404).json({ error: "Compte introuvable." });
    const match = await bcrypt.compare(mot_de_passe, compte.mot_de_passe);
    if (!match) return res.status(400).json({ error: "Mot de passe incorrect." });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Modifier le mot de passe (connecté)
app.post("/api/auth/change-password", authMiddleware, async (req, res) => {
  try {
    const { ancien_mot_de_passe, nouveau_mot_de_passe } = req.body;
    if (!ancien_mot_de_passe || !nouveau_mot_de_passe)
      return res.status(400).json({ error: "Tous les champs sont requis." });
    if (!pwdOk(nouveau_mot_de_passe))
      return res.status(400).json({ error: PWD_ERROR });
    const accountId = req.role === "user" ? req.userId : req.compteId;
    const [[compte]] = await pool.query("SELECT id, mot_de_passe FROM comptes WHERE id = ?", [accountId]);
    if (!compte) return res.status(404).json({ error: "Compte introuvable." });
    const match = await bcrypt.compare(ancien_mot_de_passe, compte.mot_de_passe);
    if (!match) return res.status(400).json({ error: "Ancien mot de passe incorrect." });
    const hash = await bcrypt.hash(nouveau_mot_de_passe, SALT_ROUNDS);
    await pool.query("UPDATE comptes SET mot_de_passe = ? WHERE id = ?", [hash, accountId]);
    await logAudit(req.compteId, req.userId || req.compteId, req.role, "CHANGEMENT_MOT_DE_PASSE", "Mot de passe modifié", getClientIp(req));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Envoyer un OTP pour changer l'email (connecté)
app.post("/api/auth/send-change-email-otp", authMiddleware, async (req, res) => {
  try {
    const { nouveau_email, mot_de_passe } = req.body;
    if (!nouveau_email || !mot_de_passe)
      return res.status(400).json({ error: "Tous les champs sont requis." });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(nouveau_email.trim()))
      return res.status(400).json({ error: "Adresse email invalide." });
    const newEmailKey = nouveau_email.trim().toLowerCase();
    const [[compte]] = await pool.query("SELECT id, mot_de_passe, email FROM comptes WHERE id = ?", [req.compteId]);
    if (!compte) return res.status(404).json({ error: "Compte introuvable." });
    const match = await bcrypt.compare(mot_de_passe, compte.mot_de_passe);
    if (!match) return res.status(400).json({ error: "Mot de passe incorrect." });
    if (newEmailKey === compte.email.toLowerCase())
      return res.status(400).json({ error: "Cet email est déjà votre adresse actuelle." });
    const [existing] = await pool.query("SELECT id FROM comptes WHERE email = ?", [newEmailKey]);
    if (existing.length > 0)
      return res.status(400).json({ error: "Cette adresse email est déjà utilisée par un autre compte." });
    if (!checkOtpRateLimit(newEmailKey))
      return res.status(429).json({ error: "Trop de demandes. Attendez 10 minutes avant de réessayer." });
    if (!emailReady)
      return res.status(503).json({ error: "Service email indisponible. Contactez l'administrateur." });
    const code = String(Math.floor(1000 + Math.random() * 9000));
    otpStore.set(newEmailKey, { code, expires: Date.now() + 10 * 60 * 1000 });
    await sendEmail({
      to: newEmailKey,
      subject: "Confirmation de changement d'email — Cotisation Pro",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8f9fa;border-radius:12px;">
          <h2 style="color:#2c3e50;margin-bottom:8px;">Cotisation Pro</h2>
          <p style="color:#555;margin-bottom:24px;">Voici votre code pour confirmer votre nouvelle adresse email :</p>
          <div style="display:flex;gap:10px;justify-content:center;margin:24px 0;">
            ${code.split("").map(d => `<span style="display:inline-block;width:56px;height:64px;line-height:64px;text-align:center;font-size:32px;font-weight:bold;background:#fff;border:2px solid #2c3e50;border-radius:10px;color:#2c3e50;">${d}</span>`).join("")}
          </div>
          <p style="color:#888;font-size:13px;text-align:center;">Ce code expire dans <strong>10 minutes</strong>.<br>Si vous n'avez pas demandé ce changement, ignorez cet email.</p>
        </div>
      `,
    });
    res.json({ message: "Code envoyé." });
  } catch (err) {
    console.error("Erreur send-change-email-otp:", err.message);
    res.status(500).json({ error: "Impossible d'envoyer l'email de vérification." });
  }
});

// Confirmer le changement d'email (connecté)
app.post("/api/auth/change-email", authMiddleware, async (req, res) => {
  try {
    const { nouveau_email, otp } = req.body;
    if (!nouveau_email || !otp)
      return res.status(400).json({ error: "Tous les champs sont requis." });
    const newEmailKey = nouveau_email.trim().toLowerCase();
    const stored = otpStore.get(newEmailKey);
    if (!stored || Date.now() > stored.expires || stored.code !== String(otp).trim())
      return res.status(400).json({ error: "Code incorrect ou expiré." });
    const [existing] = await pool.query("SELECT id FROM comptes WHERE email = ? AND id != ?", [newEmailKey, req.compteId]);
    if (existing.length > 0)
      return res.status(400).json({ error: "Cette adresse email est déjà utilisée." });
    await pool.query("UPDATE comptes SET email = ? WHERE id = ?", [newEmailKey, req.compteId]);
    otpStore.delete(newEmailKey);
    await logAudit(req.compteId, req.compteId, "admin", "CHANGEMENT_EMAIL", `Nouvel email : ${newEmailKey}`, getClientIp(req));
    const [[compte]] = await pool.query("SELECT nom_association FROM comptes WHERE id = ?", [req.compteId]);
    const newToken = jwt.sign(
      { compteId: req.compteId, email: newEmailKey, nom_association: compte.nom_association },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ success: true, token: newToken, email: newEmailKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// ROUTES — CODE D'INVITATION (admin) + AUTO-INSCRIPTION MEMBRE
// ═══════════════════════════════════════════════════════════════

// Obtenir (ou générer) le code d'invitation de l'association
app.get("/api/admin/invite-token", authMiddleware, hautMembreMiddleware, async (req, res) => {
  try {
    const [[compte]] = await pool.query(
      "SELECT invite_token, nom_association FROM comptes WHERE id = ?",
      [req.compteId]
    );
    if (!compte.invite_token) {
      const { randomBytes } = require("crypto");
      const token = String(1000 + (randomBytes(4).readUInt32BE() % 9000));
      await pool.query("UPDATE comptes SET invite_token = ? WHERE id = ?", [token, req.compteId]);
      return res.json({ token, nom_association: compte.nom_association });
    }
    res.json({ token: compte.invite_token, nom_association: compte.nom_association });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Réinitialiser le code d'invitation (génère un nouveau)
app.post("/api/admin/invite-token/reset", authMiddleware, hautMembreMiddleware, async (req, res) => {
  try {
    const { randomBytes } = require("crypto");
    const token = String(1000 + (randomBytes(4).readUInt32BE() % 9000));
    await pool.query("UPDATE comptes SET invite_token = ? WHERE id = ?", [token, req.compteId]);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auto-inscription d'un membre avec code d'invitation (route publique)
app.post("/api/auth/register-member", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { invite_token, nom, prenom, email, telephone, mot_de_passe } = req.body;
    if (!invite_token) return res.status(400).json({ error: "Code d'invitation requis." });
    if (!nom || !prenom) return res.status(400).json({ error: "Nom et prénom obligatoires." });
    if (!pwdOk(mot_de_passe))
      return res.status(400).json({ error: PWD_ERROR });
    if (!email && !telephone)
      return res.status(400).json({ error: "Email ou numéro de téléphone requis." });

    const [[adminCompte]] = await pool.query(
      "SELECT id, nom_association FROM comptes WHERE invite_token = ? AND role = 'admin'",
      [invite_token.trim()]
    );
    if (!adminCompte) return res.status(404).json({ error: "Code d'invitation invalide ou expiré." });

    const emailKey = email ? email.trim().toLowerCase() : null;
    const telKey = telephone ? telephone.trim() : null;

    if (emailKey) {
      const [ex] = await conn.query("SELECT mot_de_passe FROM comptes WHERE LOWER(email) = ?", [emailKey]);
      for (const existing of ex) {
        const same = await bcrypt.compare(mot_de_passe, existing.mot_de_passe);
        if (same) return res.status(409).json({
          error: "Cet email est déjà utilisé avec ce mot de passe dans une autre association. Veuillez choisir un mot de passe différent."
        });
      }
    }
    if (telKey) {
      const [ex] = await conn.query("SELECT mot_de_passe FROM comptes WHERE telephone = ?", [telKey]);
      for (const existing of ex) {
        const same = await bcrypt.compare(mot_de_passe, existing.mot_de_passe);
        if (same) return res.status(409).json({
          error: "Ce téléphone est déjà utilisé avec ce mot de passe dans une autre association. Veuillez choisir un mot de passe différent."
        });
      }
    }

    await conn.beginTransaction();

    // Vérifier si un adhérent avec cet email existe déjà (pré-créé par l'admin)
    let adherentId = null;
    let matricule = null;
    if (emailKey) {
      const [[existing]] = await conn.query(
        `SELECT a.id, a.matricule FROM adherents a
         WHERE a.email = ? AND a.compte_id = ? AND a.est_supprime = 0
           AND NOT EXISTS (SELECT 1 FROM comptes c WHERE c.adherent_id = a.id AND c.role = 'user')`,
        [emailKey, adminCompte.id]
      );
      if (existing) { adherentId = existing.id; matricule = existing.matricule; }
    }

    if (!adherentId) {
      matricule = await genererMatricule(conn, adminCompte.id);
      const [adhResult] = await conn.query(
        `INSERT INTO adherents (compte_id, matricule, nom, prenom, telephone, email, date_inscription)
         VALUES (?, ?, ?, ?, ?, ?, CURDATE())`,
        [adminCompte.id, matricule, nom.trim(), prenom.trim(), telKey, emailKey]
      );
      adherentId = adhResult.insertId;
      const [cotisEligibles] = await conn.query(
        "SELECT id, montant_du FROM cotisations WHERE compte_id = ?",
        [adminCompte.id]
      );
      for (const cot of cotisEligibles) {
        await conn.query(
          `INSERT IGNORE INTO paiements (adherent_id, cotisation_id, solde_paye, reste, statut)
           VALUES (?, ?, 0, ?, 'Impayé')`,
          [adherentId, cot.id, cot.montant_du]
        );
      }
    } else {
      await conn.query(
        "UPDATE adherents SET nom=?, prenom=?, telephone=COALESCE(?,telephone) WHERE id=?",
        [nom.trim(), prenom.trim(), telKey, adherentId]
      );
    }

    const hash = await bcrypt.hash(mot_de_passe, SALT_ROUNDS);
    const [compteResult] = await conn.query(
      `INSERT INTO comptes (nom_association, email, telephone, mot_de_passe, role, admin_compte_id, adherent_id)
       VALUES ('', ?, ?, ?, 'user', ?, ?)`,
      [emailKey, telKey, hash, adminCompte.id, adherentId]
    );

    await conn.commit();

    // Email de bienvenue (non bloquant)
    if (emailKey && transporter) {
      sendEmail({
        to: emailKey,
        subject: `Bienvenue dans ${adminCompte.nom_association} — Cotisation Pro`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#f8fafc;border-radius:12px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:32px 24px;text-align:center;">
              <h1 style="color:white;margin:0;font-size:24px;">Bienvenue dans l'association !</h1>
              <p style="color:#bfdbfe;margin:8px 0 0;font-size:15px;">${adminCompte.nom_association}</p>
            </div>
            <div style="padding:28px 24px;background:white;">
              <p style="color:#374151;font-size:16px;">Bonjour <strong>${nom.trim()} ${prenom.trim()}</strong>,</p>
              <p style="color:#374151;font-size:15px;">Votre inscription à l'association <strong>${adminCompte.nom_association}</strong> a bien été enregistrée sur <strong>Cotisation Pro</strong>.</p>
              <p style="color:#374151;font-size:15px;">Voici vos informations de connexion :</p>
              <div style="background:#f1f5f9;border-radius:8px;padding:16px 20px;margin:20px 0;border-left:4px solid #2563eb;">
                <p style="margin:0 0 8px;color:#374151;font-size:14px;"><strong>Email :</strong> ${emailKey}</p>
                <p style="margin:0 0 8px;color:#374151;font-size:14px;"><strong>Mot de passe :</strong> celui que vous avez choisi lors de l'inscription</p>
                <p style="margin:0;color:#374151;font-size:14px;"><strong>Matricule :</strong> ${matricule}</p>
              </div>
              <div style="text-align:center;margin:28px 0;">
                <a href="${process.env.FRONTEND_URL || 'https://cotisation-pro.up.railway.app'}"
                   style="background:#2563eb;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">
                  Accéder à mon espace
                </a>
              </div>
              <p style="color:#6b7280;font-size:13px;">Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.</p>
            </div>
            <div style="padding:16px 24px;background:#f1f5f9;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} Cotisation Pro — Tous droits réservés</p>
            </div>
          </div>
        `,
      }).catch((e) => console.warn("Email bienvenue membre non envoyé:", e.message));
    }

    await logAudit(adminCompte.id, compteResult.insertId, "user", "INSCRIPTION_MEMBRE", `Auto-inscription via lien : ${nom.trim()} ${prenom.trim()} (${emailKey || telKey})`, getClientIp(req));

    const token = jwt.sign(
      {
        compteId: adminCompte.id,
        userId: compteResult.insertId,
        email: emailKey || telKey,
        nom_association: adminCompte.nom_association,
        role: "user",
        adherentId,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token, nom_association: adminCompte.nom_association, email: emailKey || telKey, role: "user" });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// ═══════════════════════════════════════════════════════════════
// ROUTES — GESTION UTILISATEURS par l'admin (protégées admin)
// ═══════════════════════════════════════════════════════════════

// Créer un compte utilisateur + adhérent lié
app.post("/api/admin/users", authMiddleware, adminMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { nom, prenom, email, telephone, mot_de_passe, photo, date_inscription } = req.body;
    if (!nom || !prenom) return res.status(400).json({ error: "Nom et prénom obligatoires." });
    if (!pwdOk(mot_de_passe))
      return res.status(400).json({ error: PWD_ERROR });
    if (!email && !telephone)
      return res.status(400).json({ error: "Email ou numéro de téléphone requis." });

    const emailKey = email ? email.trim().toLowerCase() : null;
    const telKey = telephone ? telephone.trim() : null;

    if (emailKey) {
      const [ex] = await conn.query("SELECT mot_de_passe FROM comptes WHERE LOWER(email) = ?", [emailKey]);
      for (const existing of ex) {
        const same = await bcrypt.compare(mot_de_passe, existing.mot_de_passe);
        if (same) return res.status(409).json({
          error: "Cet email est déjà utilisé avec ce mot de passe dans une autre association. Veuillez choisir un mot de passe différent."
        });
      }
    }
    if (telKey) {
      const [ex] = await conn.query("SELECT mot_de_passe FROM comptes WHERE telephone = ?", [telKey]);
      for (const existing of ex) {
        const same = await bcrypt.compare(mot_de_passe, existing.mot_de_passe);
        if (same) return res.status(409).json({
          error: "Ce téléphone est déjà utilisé avec ce mot de passe dans une autre association. Veuillez choisir un mot de passe différent."
        });
      }
    }

    await conn.beginTransaction();

    const matricule = await genererMatricule(conn, req.compteId);
    const [adhResult] = await conn.query(
      `INSERT INTO adherents (compte_id, matricule, nom, prenom, telephone, email, date_inscription, photo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.compteId, matricule, nom, prenom, telKey, emailKey, date_inscription || null, photo || null]
    );
    const adherentId = adhResult.insertId;

    const [cotisEligibles] = await conn.query(
      "SELECT id, montant_du FROM cotisations WHERE compte_id = ?",
      [req.compteId]
    );
    for (const cot of cotisEligibles) {
      await conn.query(
        `INSERT IGNORE INTO paiements (adherent_id, cotisation_id, solde_paye, reste, statut)
         VALUES (?, ?, 0, ?, 'Impayé')`,
        [adherentId, cot.id, cot.montant_du]
      );
    }

    const hash = await bcrypt.hash(mot_de_passe, SALT_ROUNDS);
    const [compteResult] = await conn.query(
      `INSERT INTO comptes (nom_association, email, telephone, mot_de_passe, role, admin_compte_id, adherent_id)
       VALUES ('', ?, ?, ?, 'user', ?, ?)`,
      [emailKey, telKey, hash, req.compteId, adherentId]
    );

    await conn.commit();
    await logAudit(req.compteId, req.compteId, "admin", "CREATION_UTILISATEUR", `Compte créé pour ${nom} ${prenom} (${emailKey || telKey})`, getClientIp(req));
    res.json({ id: compteResult.insertId, adherentId, matricule, message: "Utilisateur créé ✅" });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// Lister les comptes utilisateurs de l'association
app.get("/api/admin/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.email, c.telephone, c.created_at,
              a.id as adherent_id, a.matricule, a.nom, a.prenom, a.photo
       FROM comptes c
       JOIN adherents a ON a.id = c.adherent_id
       WHERE c.admin_compte_id = ? AND c.role = 'user' AND a.est_supprime = 0
       ORDER BY c.created_at DESC`,
      [req.compteId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Supprimer l'accès d'un utilisateur (ne supprime pas l'adhérent)
app.delete("/api/admin/users/:userId", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM comptes WHERE id = ? AND admin_compte_id = ? AND role = 'user'",
      [req.params.userId, req.compteId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Utilisateur introuvable." });
    await logAudit(req.compteId, req.compteId, "admin", "SUPPRESSION_UTILISATEUR", `Compte supprimé (id=${req.params.userId})`, getClientIp(req));
    res.json({ message: "Accès supprimé ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// ROUTES — PROFIL PERSONNEL (/api/me)
// ═══════════════════════════════════════════════════════════════

// Obtenir son propre profil
app.get("/api/me", authMiddleware, async (req, res) => {
  try {
    if (req.role === "admin") {
      const [[compte]] = await pool.query(
        "SELECT id, nom_association, email, telephone, created_at FROM comptes WHERE id = ?",
        [req.compteId]
      );
      const [[adherent]] = await pool.query(
        "SELECT id, matricule, nom, prenom, photo, poste, date_inscription FROM adherents WHERE compte_id = ? AND est_supprime = 0 ORDER BY id ASC LIMIT 1",
        [req.compteId]
      );
      return res.json({ type: "admin", ...compte, adherent: adherent || null });
    }
    const [[adherent]] = await pool.query(
      `SELECT id, matricule, nom, prenom, telephone, email, date_inscription, photo, poste, created_at
       FROM adherents WHERE id = ? AND compte_id = ? AND est_supprime = 0`,
      [req.adherentId, req.compteId]
    );
    if (!adherent) return res.status(404).json({ error: "Profil introuvable." });
    res.json({ type: "user", ...adherent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mettre à jour son propre profil
app.put("/api/me", authMiddleware, async (req, res) => {
  try {
    if (req.role === "admin") {
      const { nom, prenom, telephone, photo, poste } = req.body;
      if (!nom || !prenom) return res.status(400).json({ error: "Nom et prénom obligatoires." });
      const sets = ["nom=?", "prenom=?", "telephone=?"];
      const vals = [nom, prenom, telephone || null];
      if (photo !== undefined) { sets.push("photo=?"); vals.push(photo || null); }
      if (poste !== undefined) { sets.push("poste=?"); vals.push(poste || null); }
      vals.push(req.compteId);
      await pool.query(
        `UPDATE adherents SET ${sets.join(",")} WHERE compte_id=? AND est_supprime=0 ORDER BY id ASC LIMIT 1`,
        vals
      );
      if (poste !== undefined) broadcastToCompte(req.compteId, "adherents_updated", {});
      return res.json({ message: "Profil mis à jour ✅" });
    }
    const { nom, prenom, telephone, photo } = req.body;
    if (!nom || !prenom) return res.status(400).json({ error: "Nom et prénom obligatoires." });

    if (photo !== undefined) {
      await pool.query(
        "UPDATE adherents SET nom=?, prenom=?, telephone=?, photo=? WHERE id=? AND compte_id=?",
        [nom, prenom, telephone || null, photo || null, req.adherentId, req.compteId]
      );
    } else {
      await pool.query(
        "UPDATE adherents SET nom=?, prenom=?, telephone=? WHERE id=? AND compte_id=?",
        [nom, prenom, telephone || null, req.adherentId, req.compteId]
      );
    }
    if (telephone !== undefined) {
      await pool.query(
        "UPDATE comptes SET telephone=? WHERE id=? AND role='user'",
        [telephone || null, req.userId]
      );
    }
    res.json({ message: "Profil mis à jour ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtenir ses propres cotisations (utilisateur seulement)
app.get("/api/me/cotisations", authMiddleware, async (req, res) => {
  try {
    let adherentId = req.adherentId;
    if (req.role === "admin") {
      const [[adm]] = await pool.query(
        "SELECT id FROM adherents WHERE compte_id = ? AND est_supprime = 0 ORDER BY id ASC LIMIT 1",
        [req.compteId]
      );
      if (!adm) return res.json([]);
      adherentId = adm.id;
    }
    const [rows] = await pool.query(
      `SELECT c.id as cotisation_id, c.libelle as periode, c.montant_du,
              p.solde_paye, p.reste, p.statut,
              (SELECT MAX(t.date_paiement) FROM transactions t WHERE t.paiement_id = p.id) as dernier_paiement
       FROM cotisations c
       LEFT JOIN paiements p ON p.cotisation_id = c.id AND p.adherent_id = ?
       WHERE c.compte_id = ?
       ORDER BY c.id ASC`,
      [adherentId, req.compteId]
    );
    res.json(rows.map((r) => ({
      cotisationId: r.cotisation_id,
      periode: r.periode,
      montantDu: Number(r.montant_du).toLocaleString("fr-FR") + " F",
      soldePaye: r.solde_paye != null ? Number(r.solde_paye).toLocaleString("fr-FR") + " F" : "0 F",
      reste: r.reste != null ? Number(r.reste).toLocaleString("fr-FR") + " F" : Number(r.montant_du).toLocaleString("fr-FR") + " F",
      statut: r.statut || "Impayé",
      dernierPaiement: r.dernier_paiement ? new Date(r.dernier_paiement).toLocaleDateString("fr-FR") : null,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Liste tous les membres de l'association (pour un membre connecté)
app.get("/api/me/membres", authMiddleware, async (req, res) => {
  try {
    if (req.role === "admin") return res.status(403).json({ error: "Route réservée aux membres." });
    const [rows] = await pool.query(
      `SELECT id, matricule, nom, prenom, telephone, email, date_inscription, photo, poste
       FROM adherents WHERE compte_id = ? AND est_supprime = 0 ORDER BY nom ASC, prenom ASC`,
      [req.compteId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Vue globale des cotisations pour un membre connecté
app.get("/api/me/toutes-cotisations", authMiddleware, async (req, res) => {
  try {
    if (req.role === "admin") return res.status(403).json({ error: "Route réservée aux membres." });
    const [cotisations] = await pool.query(
      "SELECT id, libelle, montant_du FROM cotisations WHERE compte_id = ? ORDER BY id ASC",
      [req.compteId]
    );
    const result = [];
    for (const cot of cotisations) {
      const [paiements] = await pool.query(
        `SELECT p.statut FROM paiements p
         JOIN adherents a ON a.id = p.adherent_id
         WHERE p.cotisation_id = ? AND a.est_supprime = 0`,
        [cot.id]
      );
      const total = paiements.length;
      const payes = paiements.filter((p) => p.statut === "Payé").length;
      const partiels = paiements.filter((p) => p.statut === "Partiel").length;
      result.push({
        id: cot.id,
        libelle: cot.libelle,
        montantDu: Number(cot.montant_du).toLocaleString("fr-FR") + " F",
        total,
        payes,
        partiels,
        impayes: total - payes - partiels,
      });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// ROUTES — ADHÉRENTS (protégées)
// ═══════════════════════════════════════════════════════════════

// Cotisations d'un adhérent spécifique (admin uniquement)
app.get("/api/adherents/:id/cotisations", authMiddleware, trésorierMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT c.libelle as periode, c.montant_du,
              p.solde_paye, p.reste, p.statut,
              (SELECT MAX(t.date_paiement) FROM transactions t WHERE t.paiement_id = p.id) as dernier_paiement
       FROM cotisations c
       LEFT JOIN paiements p ON p.cotisation_id = c.id AND p.adherent_id = ?
       WHERE c.compte_id = ?
       ORDER BY c.id ASC`,
      [id, req.compteId]
    );
    res.json(rows.map((r) => ({
      periode: r.periode,
      montantDu: Number(r.montant_du).toLocaleString("fr-FR") + " F",
      soldePaye: r.solde_paye != null ? Number(r.solde_paye).toLocaleString("fr-FR") + " F" : "0 F",
      reste: r.reste != null ? Number(r.reste).toLocaleString("fr-FR") + " F" : Number(r.montant_du).toLocaleString("fr-FR") + " F",
      statut: r.statut || "Impayé",
      dernierPaiement: r.dernier_paiement ? new Date(r.dernier_paiement).toLocaleDateString("fr-FR") : null,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/adherents", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, matricule, nom, prenom, telephone, email, date_inscription, photo, poste, created_at
       FROM adherents WHERE compte_id = ? AND est_supprime = 0 ORDER BY id ASC`,
      [req.compteId]
    );
    res.json(rows.map((a) => ({ ...a, date: a.date_inscription || null, paid: false })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/adherents", authMiddleware, trésorierMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { nom, prenom, telephone, email, date_inscription } = req.body;
    if (!nom || !prenom)
      return res.status(400).json({ error: "Nom et prénom obligatoires." });

    const emailKey = email ? email.trim().toLowerCase() : null;
    const telKey = telephone ? telephone.trim() : null;

    await conn.beginTransaction();

    const matricule = await genererMatricule(conn, req.compteId);

    const [result] = await conn.query(
      `INSERT INTO adherents (compte_id, matricule, nom, prenom, telephone, email, date_inscription)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.compteId, matricule, nom, prenom, telKey, emailKey, date_inscription || null]
    );

    const adherentId = result.insertId;

    // Règle : NULL = éligible à toutes les cotisations du compte
    let cotisEligibles;
    if (date_inscription) {
      [cotisEligibles] = await conn.query(
        "SELECT id, montant_du FROM cotisations WHERE compte_id = ? AND DATE(created_at) >= ?",
        [req.compteId, date_inscription]
      );
    } else {
      [cotisEligibles] = await conn.query(
        "SELECT id, montant_du FROM cotisations WHERE compte_id = ?",
        [req.compteId]
      );
    }

    for (const cot of cotisEligibles) {
      await conn.query(
        `INSERT IGNORE INTO paiements (adherent_id, cotisation_id, solde_paye, reste, statut)
         VALUES (?, ?, 0, ?, 'Impayé')`,
        [adherentId, cot.id, cot.montant_du]
      );
    }

    // Créer automatiquement un compte utilisateur si email fourni
    let emailSent = false;
    if (emailKey) {
      const plainPwd = generatePassword();
      const hash = await bcrypt.hash(plainPwd, SALT_ROUNDS);
      await conn.query(
        `INSERT INTO comptes (nom_association, email, telephone, mot_de_passe, role, admin_compte_id, adherent_id)
         VALUES ('', ?, ?, ?, 'user', ?, ?)`,
        [emailKey, telKey, hash, req.compteId, adherentId]
      );
      if (transporter) {
        sendEmail({
          to: emailKey,
          subject: `Bienvenue dans ${req.nomAssociation || "l'association"} — Cotisation Pro`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#f8fafc;border-radius:12px;overflow:hidden;">
              <div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:32px 24px;text-align:center;">
                <h1 style="color:white;margin:0;font-size:24px;">Bienvenue dans l'association !</h1>
                <p style="color:#bfdbfe;margin:8px 0 0;font-size:15px;">${req.nomAssociation || ""}</p>
              </div>
              <div style="padding:28px 24px;background:white;">
                <p style="color:#374151;font-size:16px;">Bonjour <strong>${nom} ${prenom}</strong>,</p>
                <p style="color:#374151;font-size:15px;">Votre compte membre a été créé sur <strong>Cotisation Pro</strong> par votre association.</p>
                <p style="color:#374151;font-size:15px;">Voici vos identifiants de connexion :</p>
                <div style="background:#f1f5f9;border-radius:8px;padding:16px 20px;margin:20px 0;border-left:4px solid #2563eb;">
                  <p style="margin:0 0 8px;color:#374151;font-size:14px;"><strong>Email :</strong> ${emailKey}</p>
                  <p style="margin:0 0 8px;color:#374151;font-size:14px;"><strong>Mot de passe :</strong> ${plainPwd}</p>
                  <p style="margin:0;color:#374151;font-size:14px;"><strong>Matricule :</strong> ${matricule}</p>
                </div>
                <p style="color:#374151;font-size:14px;">Pensez à changer votre mot de passe après votre première connexion.</p>
                <div style="text-align:center;margin:28px 0;">
                  <a href="${process.env.FRONTEND_URL || 'https://cotisation-pro.up.railway.app'}"
                     style="background:#2563eb;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">
                    Accéder à mon espace
                  </a>
                </div>
                <p style="color:#6b7280;font-size:13px;">Si vous n'êtes pas à l'origine de cette création, contactez votre association.</p>
              </div>
              <div style="padding:16px 24px;background:#f1f5f9;text-align:center;">
                <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} Cotisation Pro — Tous droits réservés</p>
              </div>
            </div>
          `,
        }).then(() => { emailSent = true; }).catch((e) => console.warn("Email bienvenue membre non envoyé:", e.message));
      }
    }

    // SMS de bienvenue si téléphone disponible
    const smsSent = false;

    await conn.commit();
    await logAudit(req.compteId, req.userId || req.compteId, req.role, "AJOUT_ADHERENT", `Adhérent ajouté : ${nom} ${prenom} (${matricule})`, getClientIp(req));
    res.json({ id: adherentId, matricule, emailSent, smsSent, message: "Adhérent ajouté ✅" });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

app.put("/api/adherents/:id", authMiddleware, canAssignPosteMiddleware, async (req, res) => {
  try {
    const { nom, prenom, telephone, email, photo, poste } = req.body;
    if (!nom || !prenom)
      return res.status(400).json({ error: "Nom et prénom obligatoires." });

    // Si on nomme un nouveau trésorier, retirer ce poste des autres adhérents
    let myPosteWasCleared = false;
    if (poste && poste.toLowerCase().includes("trésorier")) {
      await pool.query(
        "UPDATE adherents SET poste = NULL WHERE compte_id = ? AND id != ? AND poste LIKE '%résorier%'",
        [req.compteId, req.params.id]
      );
      // Vérifier si l'adhérent connecté était l'ancien trésorier
      if (req.adherentId && String(req.adherentId) !== String(req.params.id) && req.poste?.toLowerCase().includes("trésorier")) {
        myPosteWasCleared = true;
      }
    }

    if (photo !== undefined) {
      await pool.query(
        "UPDATE adherents SET nom=?, prenom=?, telephone=?, email=?, photo=?, poste=? WHERE id=? AND compte_id=?",
        [nom, prenom, telephone || null, email || null, photo || null, poste || null, req.params.id, req.compteId]
      );
    } else {
      await pool.query(
        "UPDATE adherents SET nom=?, prenom=?, telephone=?, email=?, poste=? WHERE id=? AND compte_id=?",
        [nom, prenom, telephone || null, email || null, poste || null, req.params.id, req.compteId]
      );
    }
    broadcastToCompte(req.compteId, "adherents_updated", { updatedId: String(req.params.id) });
    await logAudit(req.compteId, req.userId || req.compteId, req.role, "MODIFICATION_ADHERENT", `Adhérent modifié : ${nom} ${prenom}${poste ? ` — poste: ${poste}` : ""}`, getClientIp(req));
    res.json({ message: "Adhérent modifié ✅", myPosteWasCleared });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/adherents/:id", authMiddleware, trésorierMiddleware, async (req, res) => {
  try {
    await pool.query(
      "UPDATE adherents SET est_supprime = 1 WHERE id = ? AND compte_id = ?",
      [req.params.id, req.compteId]
    );
    await logAudit(req.compteId, req.userId || req.compteId, req.role, "SUPPRESSION_ADHERENT", `Adhérent supprimé (id=${req.params.id})`, getClientIp(req));
    res.json({ message: "Adhérent supprimé ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// ROUTES — PÉRIODES (protégées)
// ═══════════════════════════════════════════════════════════════

app.get("/api/periodes", authMiddleware, async (req, res) => {
  try {
    const [cotisations] = await pool.query(
      "SELECT id, libelle, montant_du, created_at FROM cotisations WHERE compte_id = ? ORDER BY id ASC",
      [req.compteId]
    );

    if (cotisations.length === 0) return res.json([]);

    // ID de la dernière cotisation créée
    const derniereCotisationId = cotisations[cotisations.length - 1].id;

    const result = [];
    for (const cot of cotisations) {
      const isLast = cot.id === derniereCotisationId;

      // Règle d'éligibilité :
      // - Dernière cotisation → tous les adhérents actifs
      // - Cotisations passées → seulement ceux présents au moment de sa création
      const [eligibleRows] = await pool.query(
        `SELECT id FROM adherents
         WHERE compte_id = ? AND est_supprime = 0
           AND (? = 1 OR created_at <= ?)`,
        [req.compteId, isLast ? 1 : 0, cot.created_at]
      );

      const eligibleAdherentIds = eligibleRows.map((r) => r.id);
      const eligibleSet = new Set(eligibleAdherentIds);

      const [paiements] = await pool.query(
        `SELECT p.id, p.adherent_id, p.solde_paye, p.reste, p.statut,
                a.matricule, a.nom, a.prenom, a.telephone, a.email
         FROM paiements p
         JOIN adherents a ON a.id = p.adherent_id
         WHERE p.cotisation_id = ?
         ORDER BY a.nom ASC, a.prenom ASC`,
        [cot.id]
      );

      result.push({
        id: cot.id,
        libelle: cot.libelle,
        montantDu: String(cot.montant_du),
        createdAt: cot.created_at,
        eligibleAdherentIds,
        paiements: paiements
          .filter((p) => eligibleSet.has(p.adherent_id))
          .map((p) => ({
            id: p.id,
            adherent_id: p.adherent_id,
            matricule: p.matricule || "-",
            nom: p.nom,
            prenom: p.prenom,
            telephone: p.telephone || "-",
            email: p.email || "-",
            soldePaye: Number(p.solde_paye).toLocaleString("fr-FR") + " F",
            reste: Number(p.reste).toLocaleString("fr-FR") + " F",
            statut: p.statut,
          })),
      });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/periodes", authMiddleware, trésorierMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { libelle, montantDu } = req.body;
    if (!libelle || !montantDu)
      return res.status(400).json({ error: "Libellé et montant dû obligatoires." });

    const montant = Number(String(montantDu).replace(/[^0-9.]/g, ""));
    if (isNaN(montant) || montant <= 0)
      return res.status(400).json({ error: "Montant invalide." });

    const [existing] = await conn.query(
      "SELECT id FROM cotisations WHERE compte_id = ? AND libelle = ?",
      [req.compteId, libelle]
    );
    if (existing.length > 0)
      return res.status(409).json({ error: "Cette période existe déjà." });

    await conn.beginTransaction();

    const [result] = await conn.query(
      "INSERT INTO cotisations (compte_id, libelle, montant_du) VALUES (?, ?, ?)",
      [req.compteId, libelle, montant]
    );
    const cotisationId = result.insertId;

    const [[newCot]] = await conn.query(
      "SELECT created_at FROM cotisations WHERE id = ?",
      [cotisationId]
    );

    const [adherentsEligibles] = await conn.query(
      `SELECT id FROM adherents
       WHERE compte_id = ? AND est_supprime = 0
         AND (date_inscription IS NULL OR date_inscription <= DATE(?))`,
      [req.compteId, newCot.created_at]
    );

    for (const adh of adherentsEligibles) {
      await conn.query(
        `INSERT IGNORE INTO paiements (adherent_id, cotisation_id, solde_paye, reste, statut)
         VALUES (?, ?, 0, ?, 'Impayé')`,
        [adh.id, cotisationId, montant]
      );
    }

    await conn.commit();
    await logAudit(req.compteId, req.userId || req.compteId, req.role, "CREATION_PERIODE", `Période créée : ${libelle} — ${montant} F`, getClientIp(req));
    res.json({ id: cotisationId, message: "Cotisation créée ✅" });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// ═══════════════════════════════════════════════════════════════
// ROUTES — PAIEMENTS (protégées)
// ═══════════════════════════════════════════════════════════════

app.post("/api/periodes/:periodeId/paiements", authMiddleware, trésorierMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { adherent_id, montantPaye, modePaiement, numeroRecu, datePaiement } = req.body;
    const periodeId = Number(req.params.periodeId);

    if (!adherent_id || !montantPaye)
      return res.status(400).json({ error: "adherent_id et montantPaye obligatoires." });

    const montant = Number(String(montantPaye).replace(/[^0-9.]/g, ""));
    if (isNaN(montant) || montant <= 0)
      return res.status(400).json({ error: "Montant invalide." });

    await conn.beginTransaction();

    // Vérifier que la cotisation appartient bien à ce compte
    const [[cotisation]] = await conn.query(
      "SELECT montant_du, created_at FROM cotisations WHERE id = ? AND compte_id = ?",
      [periodeId, req.compteId]
    );
    if (!cotisation) {
      await conn.rollback();
      return res.status(404).json({ error: "Période introuvable." });
    }
    const montantDu = Number(cotisation.montant_du);

    // Vérifier éligibilité : adhérent actif du compte,
    // présent avant la cotisation OU c'est la dernière cotisation
    const [[derniereCot]] = await conn.query(
      "SELECT MAX(id) as maxId FROM cotisations WHERE compte_id = ?",
      [req.compteId]
    );
    const isLastCotisation = Number(periodeId) === Number(derniereCot.maxId);

    const [[adherentCheck]] = await conn.query(
      `SELECT id FROM adherents
       WHERE id = ? AND compte_id = ? AND est_supprime = 0
         AND (? = 1 OR created_at <= ?)`,
      [adherent_id, req.compteId, isLastCotisation ? 1 : 0, cotisation.created_at]
    );
    if (!adherentCheck) {
      await conn.rollback();
      return res.status(404).json({
        error: "Cet adhérent n'est pas éligible à cette cotisation.",
      });
    }

    const [[existingPay]] = await conn.query(
      "SELECT id, solde_paye, reste FROM paiements WHERE adherent_id = ? AND cotisation_id = ?",
      [adherent_id, periodeId]
    );

    let paiementId;
    let dejaPaye = 0;

    if (existingPay) {
      paiementId = existingPay.id;
      dejaPaye = Number(existingPay.solde_paye);
    } else {
      const [ins] = await conn.query(
        `INSERT INTO paiements (adherent_id, cotisation_id, solde_paye, reste, statut)
         VALUES (?, ?, 0, ?, 'Impayé')`,
        [adherent_id, periodeId, montantDu]
      );
      paiementId = ins.insertId;
    }

    const resteAvant = montantDu - dejaPaye;
    if (montant > resteAvant) {
      await conn.rollback();
      return res.status(400).json({
        error: `Le montant (${montant} F) dépasse le reste à payer (${resteAvant} F).`,
      });
    }

    const recu = numeroRecu || `REC-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const dateP = datePaiement || new Date().toISOString().split("T")[0];

    await conn.query(
      `INSERT INTO transactions (paiement_id, numero_recu, montant_paye, mode_paiement, date_paiement)
       VALUES (?, ?, ?, ?, ?)`,
      [paiementId, recu, montant, modePaiement || "Espèces", dateP]
    );

    const nouveauSolde = dejaPaye + montant;
    const nouveauReste = Math.max(montantDu - nouveauSolde, 0);
    const statut = nouveauReste <= 0 ? "Payé" : nouveauSolde > 0 ? "Partiel" : "Impayé";

    await conn.query(
      "UPDATE paiements SET solde_paye = ?, reste = ?, statut = ? WHERE id = ?",
      [nouveauSolde, nouveauReste, statut, paiementId]
    );

    await conn.commit();
    await logAudit(req.compteId, req.userId || req.compteId, req.role, "ENREGISTREMENT_PAIEMENT", `Paiement ${montant} F — adhérent id=${adherent_id} — reçu ${recu}`, getClientIp(req));

    // Email de confirmation à l'adhérent (si email disponible)
    if (transporter) {
      try {
        const [[adh]] = await pool.query(
          "SELECT nom, prenom, email FROM adherents WHERE id = ? AND email IS NOT NULL AND email != ''",
          [adherent_id]
        );
        const [[cot]] = await pool.query("SELECT libelle FROM cotisations WHERE id = ?", [periodeId]);
        if (adh?.email) {
          const [[nomAssoc]] = await pool.query("SELECT nom_association FROM comptes WHERE id = ?", [req.compteId]);
          const nomOrg = nomAssoc?.nom_association || "votre association";
          const formatMontant = (v) => Number(v).toLocaleString("fr-FR");
          await sendEmail({
            to: adh.email,
            subject: `Confirmation de paiement — ${cot?.libelle || "Cotisation"}`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f9f9f9;border-radius:10px;overflow:hidden;border:1px solid #e0e0e0">
                <div style="background:#27ae60;padding:24px 28px;text-align:center">
                  <h1 style="color:white;margin:0;font-size:22px">✅ Paiement confirmé</h1>
                  <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px">${nomOrg}</p>
                </div>
                <div style="padding:28px">
                  <p style="font-size:15px;color:#2c3e50">Bonjour <strong>${adh.prenom} ${adh.nom}</strong>,</p>
                  <p style="color:#555;font-size:14px;line-height:1.6">
                    Votre paiement pour la période <strong>${cot?.libelle || "cotisation"}</strong> a bien été enregistré.
                  </p>
                  <div style="background:#f0faf4;border:1px solid #b2dfdb;border-radius:8px;padding:18px 20px;margin:20px 0">
                    <table style="width:100%;border-collapse:collapse;font-size:14px">
                      <tr><td style="color:#777;padding:4px 0">Montant payé</td><td style="text-align:right;font-weight:700;color:#27ae60">${formatMontant(montant)} FCFA</td></tr>
                      <tr><td style="color:#777;padding:4px 0">Reste à payer</td><td style="text-align:right;font-weight:700;color:${nouveauReste > 0 ? "#e67e22" : "#27ae60"}">${formatMontant(nouveauReste)} FCFA</td></tr>
                      <tr><td style="color:#777;padding:4px 0">Statut</td><td style="text-align:right"><span style="background:${statut === "Payé" ? "#e8f5e9" : "#fff3e0"};color:${statut === "Payé" ? "#27ae60" : "#e67e22"};padding:3px 12px;border-radius:20px;font-weight:700;font-size:13px">${statut}</span></td></tr>
                      <tr><td style="color:#777;padding:4px 0">N° reçu</td><td style="text-align:right;font-family:monospace;font-size:12px;color:#555">${recu}</td></tr>
                      <tr><td style="color:#777;padding:4px 0">Date</td><td style="text-align:right;color:#555">${new Date(dateP).toLocaleDateString("fr-FR")}</td></tr>
                      <tr><td style="color:#777;padding:4px 0">Mode</td><td style="text-align:right;color:#555">${modePaiement || "Espèces"}</td></tr>
                    </table>
                  </div>
                  <p style="color:#888;font-size:12px;margin-top:24px">Ce message est envoyé automatiquement par Cotisation Pro. Merci de ne pas y répondre.</p>
                </div>
              </div>`,
          });
        }
      } catch (_) {}
    }

    // SMS de confirmation de paiement (si téléphone disponible)
    if (atSMS) {
      try {
        const [[adhSms]] = await pool.query(
          "SELECT nom, prenom, telephone FROM adherents WHERE id = ? AND telephone IS NOT NULL AND telephone != ''",
          [adherent_id]
        );
      } catch (_) {}
    }

    res.json({ message: "Paiement enregistré ✅" });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// Historique des transactions du membre connecté uniquement
app.get("/api/me/historique", authMiddleware, async (req, res) => {
  try {
    if (req.role === "admin") return res.status(403).json({ error: "Route réservée aux membres." });
    const [rows] = await pool.query(
      `SELECT t.id, t.numero_recu, t.montant_paye, t.mode_paiement, t.date_paiement,
              p.solde_paye, p.reste, p.statut,
              c.libelle AS periode, c.montant_du
       FROM transactions t
       JOIN paiements p   ON p.id = t.paiement_id
       JOIN adherents a   ON a.id = p.adherent_id
       JOIN cotisations c ON c.id = p.cotisation_id
       WHERE a.id = ? AND a.compte_id = ?
       ORDER BY t.date_paiement DESC, t.id DESC`,
      [req.adherentId, req.compteId]
    );
    res.json(rows.map((r) => ({
      numeroRecu:   r.numero_recu,
      datePaiement: r.date_paiement ? new Date(r.date_paiement).toLocaleDateString("fr-FR") : "-",
      periode:      r.periode,
      montantDu:    Number(r.montant_du).toLocaleString("fr-FR") + " F",
      montantPaye:  Number(r.montant_paye).toLocaleString("fr-FR") + " F",
      totalPaye:    Number(r.solde_paye).toLocaleString("fr-FR") + " F",
      reste:        Number(r.reste).toLocaleString("fr-FR") + " F",
      statut:       r.statut,
      modePaiement: r.mode_paiement || "-",
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// ROUTES — DEMANDES DE PAIEMENT MOBILE MONEY (membres)
// ═══════════════════════════════════════════════════════════════

// Membre : soumettre une demande de paiement Mobile Money
app.post("/api/me/demandes-paiement", authMiddleware, async (req, res) => {
  try {
    let adherentId = req.adherentId;
    if (req.role === "admin") {
      const [[adm]] = await pool.query("SELECT id FROM adherents WHERE compte_id = ? AND est_supprime = 0 ORDER BY id ASC LIMIT 1", [req.compteId]);
      if (!adm) return res.status(403).json({ error: "Vous n'êtes pas enregistré comme membre." });
      adherentId = adm.id;
    }
    if (!adherentId) return res.status(403).json({ error: "Vous n'êtes pas enregistré comme membre." });
    const { cotisation_id, montant, numero_transaction, operateur } = req.body;
    if (!cotisation_id || !montant) return res.status(400).json({ error: "cotisation_id et montant requis." });

    // Vérifier que la cotisation appartient à cette association et que l'adhérent y est associé
    const [[cot]] = await pool.query(
      `SELECT c.id, c.montant_du FROM cotisations c WHERE c.id = ? AND c.compte_id = ?`,
      [cotisation_id, req.compteId]
    );
    if (!cot) return res.status(404).json({ error: "Cotisation introuvable." });

    const mt = parseFloat(montant);
    if (isNaN(mt) || mt <= 0) return res.status(400).json({ error: "Montant invalide." });
    if (mt > parseFloat(cot.montant_du)) return res.status(400).json({ error: "Montant supérieur au montant dû." });

    // Vérifier qu'il n'y a pas déjà une demande en attente pour cette cotisation
    const [[existing]] = await pool.query(
      `SELECT id FROM demandes_paiement WHERE adherent_id = ? AND cotisation_id = ? AND statut = 'en_attente'`,
      [adherentId, cotisation_id]
    );
    if (existing) return res.status(409).json({ error: "Vous avez déjà une demande en attente pour cette cotisation." });

    // Vérifier que la cotisation n'est pas déjà totalement payée
    const [[paie]] = await pool.query(
      `SELECT statut FROM paiements WHERE adherent_id = ? AND cotisation_id = ?`,
      [adherentId, cotisation_id]
    );
    if (paie && paie.statut === "Payé") return res.status(409).json({ error: "Cette cotisation est déjà payée." });

    await pool.query(
      `INSERT INTO demandes_paiement (adherent_id, cotisation_id, montant, numero_transaction, operateur) VALUES (?, ?, ?, ?, ?)`,
      [adherentId, cotisation_id, mt, numero_transaction ? numero_transaction.trim() : null, operateur ? operateur.trim() : null]
    );
    res.json({ success: true, message: "Demande de paiement soumise. En attente de validation par le trésorier." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Membre : récupérer ses demandes en cours
app.get("/api/me/demandes-paiement", authMiddleware, async (req, res) => {
  try {
    let adherentId = req.adherentId;
    if (req.role === "admin") {
      const [[adm]] = await pool.query("SELECT id FROM adherents WHERE compte_id = ? AND est_supprime = 0 ORDER BY id ASC LIMIT 1", [req.compteId]);
      if (!adm) return res.json([]);
      adherentId = adm.id;
    }
    if (!adherentId) return res.json([]);
    const [rows] = await pool.query(
      `SELECT dp.id, dp.cotisation_id, dp.montant, dp.numero_transaction, dp.operateur, dp.statut,
              dp.date_demande, dp.date_traitement, dp.note_refus,
              c.libelle AS periode
       FROM demandes_paiement dp
       JOIN cotisations c ON c.id = dp.cotisation_id
       WHERE dp.adherent_id = ?
       ORDER BY dp.date_demande DESC`,
      [adherentId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trésorier/Admin : lister toutes les demandes en attente
app.get("/api/demandes-paiement", authMiddleware, trésorierMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT dp.id, dp.montant, dp.numero_transaction, dp.operateur, dp.statut,
              dp.date_demande, dp.date_traitement, dp.note_refus,
              c.libelle AS periode, c.id AS cotisation_id, c.montant_du,
              a.id AS adherent_id, a.nom, a.prenom, a.matricule
       FROM demandes_paiement dp
       JOIN cotisations c  ON c.id  = dp.cotisation_id
       JOIN adherents  a  ON a.id  = dp.adherent_id
       WHERE c.compte_id = ? AND dp.statut = 'en_attente'
       ORDER BY dp.date_demande ASC`,
      [req.compteId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trésorier/Admin : approuver une demande → crée le paiement réel
app.put("/api/demandes-paiement/:id/approuver", authMiddleware, trésorierMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [[dp]] = await conn.query(
      `SELECT dp.*, c.montant_du, c.compte_id
       FROM demandes_paiement dp
       JOIN cotisations c ON c.id = dp.cotisation_id
       WHERE dp.id = ? AND dp.statut = 'en_attente'`,
      [req.params.id]
    );
    if (!dp) return res.status(404).json({ error: "Demande introuvable ou déjà traitée." });
    if (dp.compte_id !== req.compteId) return res.status(403).json({ error: "Accès refusé." });

    await conn.beginTransaction();

    const montantDu = parseFloat(dp.montant_du);
    const montantPaye = parseFloat(dp.montant);

    // Upsert paiement
    let [[paiement]] = await conn.query(
      `SELECT id, solde_paye, reste FROM paiements WHERE adherent_id = ? AND cotisation_id = ?`,
      [dp.adherent_id, dp.cotisation_id]
    );
    let paiementId;
    if (!paiement) {
      const [ins] = await conn.query(
        `INSERT INTO paiements (adherent_id, cotisation_id, solde_paye, reste, statut) VALUES (?, ?, 0, ?, 'Impayé')`,
        [dp.adherent_id, dp.cotisation_id, montantDu]
      );
      paiementId = ins.insertId;
      paiement = { solde_paye: 0, reste: montantDu };
    } else {
      paiementId = paiement.id;
    }

    const nouveauSolde = parseFloat(paiement.solde_paye) + montantPaye;
    const nouveauReste = Math.max(montantDu - nouveauSolde, 0);
    const nouveauStatut = nouveauReste <= 0 ? "Payé" : nouveauSolde > 0 ? "Partiel" : "Impayé";

    await conn.query(
      `UPDATE paiements SET solde_paye = ?, reste = ?, statut = ? WHERE id = ?`,
      [nouveauSolde, nouveauReste, nouveauStatut, paiementId]
    );

    // Générer numéro de reçu
    const recu = `MMRECU${Date.now()}`;
    await conn.query(
      `INSERT INTO transactions (paiement_id, numero_recu, montant_paye, mode_paiement, date_paiement) VALUES (?, ?, ?, 'Mobile Money', CURDATE())`,
      [paiementId, recu, montantPaye]
    );

    await conn.query(
      `UPDATE demandes_paiement SET statut = 'approuve', date_traitement = NOW() WHERE id = ?`,
      [dp.id]
    );

    await conn.commit();
    res.json({ success: true, message: "Paiement validé.", nouveauStatut });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// Trésorier/Admin : rejeter une demande
app.put("/api/demandes-paiement/:id/rejeter", authMiddleware, trésorierMiddleware, async (req, res) => {
  try {
    const { note_refus } = req.body;
    const [[dp]] = await pool.query(
      `SELECT dp.*, c.compte_id FROM demandes_paiement dp JOIN cotisations c ON c.id = dp.cotisation_id WHERE dp.id = ? AND dp.statut = 'en_attente'`,
      [req.params.id]
    );
    if (!dp) return res.status(404).json({ error: "Demande introuvable ou déjà traitée." });
    if (dp.compte_id !== req.compteId) return res.status(403).json({ error: "Accès refusé." });

    await pool.query(
      `UPDATE demandes_paiement SET statut = 'rejete', date_traitement = NOW(), note_refus = ? WHERE id = ?`,
      [note_refus ? note_refus.trim() : null, dp.id]
    );
    res.json({ success: true, message: "Demande rejetée." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// ROUTES — HISTORIQUE (protégée)
// ═══════════════════════════════════════════════════════════════

app.get("/api/historique", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.id, t.numero_recu, t.montant_paye, t.mode_paiement, t.date_paiement,
              p.solde_paye, p.reste, p.statut,
              a.matricule, a.nom, a.prenom, a.telephone, a.email,
              c.libelle AS periode, c.montant_du
       FROM transactions t
       JOIN paiements p    ON p.id = t.paiement_id
       JOIN adherents a    ON a.id = p.adherent_id
       JOIN cotisations c  ON c.id = p.cotisation_id
       WHERE a.compte_id = ?
       ORDER BY t.date_paiement ASC, t.id ASC`,
      [req.compteId]
    );
    res.json(
      rows.map((r) => {
        const totalPaye = Number(r.solde_paye);
        const montantPaye = Number(r.montant_paye);
        const dejaPaye = Math.max(0, totalPaye - montantPaye);
        return {
          numeroRecu:      r.numero_recu,
          datePaiement:    r.date_paiement ? new Date(r.date_paiement).toLocaleDateString("fr-FR") : "-",
          datePaiementRaw: r.date_paiement ? new Date(r.date_paiement).toISOString().slice(0, 10) : null,
          periode:         r.periode,
          nom:          r.nom,
          prenom:       r.prenom,
          telephone:    r.telephone || "-",
          matricule:    r.matricule || "-",
          email:        r.email || "-",
          montantDu:    Number(r.montant_du).toLocaleString("fr-FR") + " F",
          montantPaye:  montantPaye.toLocaleString("fr-FR") + " F",
          totalPaye:    totalPaye.toLocaleString("fr-FR") + " F",
          reste:        Number(r.reste).toLocaleString("fr-FR") + " F",
          statut:       r.statut,
          modePaiement: r.mode_paiement,
          dejaPaye:     dejaPaye.toLocaleString("fr-FR") + " F",
        };
      })
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// ROUTES — JOURNAL D'AUDIT (admin uniquement)
// ═══════════════════════════════════════════════════════════════

app.get("/api/audit-logs", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit)  || 100, 500);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);
    const action = req.query.action || null;

    const whereClauses = ["al.compte_id = ?"];
    const params = [req.compteId];
    if (action) { whereClauses.push("al.action = ?"); params.push(action); }
    const whereSQL = whereClauses.join(" AND ");

    const [rows] = await pool.query(
      `SELECT al.id, al.user_type, al.action, al.details, al.ip_address, al.created_at,
              a.nom, a.prenom, a.poste
       FROM audit_logs al
       LEFT JOIN comptes c  ON c.id = al.user_id
       LEFT JOIN adherents a ON a.id = c.adherent_id
       WHERE ${whereSQL}
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM audit_logs al WHERE ${whereSQL}`,
      params
    );

    res.json({ rows, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// MESSAGES
// ═══════════════════════════════════════════════════════════════

app.get("/api/messages", authMiddleware, async (req, res) => {
  try {
    const myKey = req.role === "admin" ? `a${req.compteId}` : `u${req.adherentId}`;
    const [msgs] = await pool.query(
      `SELECT m.id, m.titre, m.contenu, m.created_at, m.auteur_nom, m.auteur_prenom, m.auteur_poste, m.sender_key
       FROM messages m WHERE m.compte_id = ? ORDER BY m.created_at DESC`,
      [req.compteId]
    );
    if (!msgs.length) return res.json([]);
    const msgIds = msgs.map(m => m.id);
    const [rxns] = await pool.query(
      `SELECT message_id, emoji, liker_key, liker_nom FROM message_likes WHERE message_id IN (?)`,
      [msgIds]
    );
    const reactionsByMsg = {};
    for (const r of rxns) {
      if (!reactionsByMsg[r.message_id]) reactionsByMsg[r.message_id] = {};
      if (!reactionsByMsg[r.message_id][r.emoji])
        reactionsByMsg[r.message_id][r.emoji] = { count: 0, reactors: [], my_reaction: false };
      reactionsByMsg[r.message_id][r.emoji].count++;
      if (r.liker_nom) reactionsByMsg[r.message_id][r.emoji].reactors.push(r.liker_nom);
      if (r.liker_key === myKey) reactionsByMsg[r.message_id][r.emoji].my_reaction = true;
    }
    res.json(msgs.map(m => ({ ...m, is_mine: m.sender_key === myKey, reactions: reactionsByMsg[m.id] || {} })));
  } catch { res.status(500).json({ error: "Erreur serveur." }); }
});

app.post("/api/messages", authMiddleware, hautMembreMiddleware, async (req, res) => {
  const { titre, contenu } = req.body;
  if (!titre?.trim() || !contenu?.trim())
    return res.status(400).json({ error: "Titre et contenu requis." });
  try {
    let auteurNom = null, auteurPrenom = null, auteurPoste = null;
    if (req.role === "admin") {
      const [[adh]] = await pool.query(
        "SELECT nom, prenom, poste FROM adherents WHERE compte_id = ? AND est_supprime = 0 ORDER BY id ASC LIMIT 1",
        [req.compteId]
      );
      auteurNom = adh?.nom || null;
      auteurPrenom = adh?.prenom || null;
      auteurPoste = adh?.poste || "Créateur";
    } else {
      const [[adh]] = await pool.query(
        "SELECT nom, prenom FROM adherents WHERE id = ? AND compte_id = ?",
        [req.adherentId, req.compteId]
      );
      auteurNom = adh?.nom || null;
      auteurPrenom = adh?.prenom || null;
      auteurPoste = req.poste || null;
    }
    const senderKey = req.role === "admin" ? `a${req.compteId}` : `u${req.adherentId}`;
    const [result] = await pool.query(
      "INSERT INTO messages (compte_id, titre, contenu, auteur_nom, auteur_prenom, auteur_poste, sender_key) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [req.compteId, titre.trim(), contenu.trim(), auteurNom, auteurPrenom, auteurPoste, senderKey]
    );
    const [[msg]] = await pool.query(
      "SELECT id, titre, contenu, created_at, auteur_nom, auteur_prenom, auteur_poste, sender_key FROM messages WHERE id = ?",
      [result.insertId]
    );
    res.status(201).json({ ...msg, is_mine: true, reactions: {} });
    broadcastToCompte(req.compteId, "messages_updated", {});
  } catch { res.status(500).json({ error: "Erreur serveur." }); }
});

app.post("/api/messages/:id/react", authMiddleware, async (req, res) => {
  try {
    const likerKey = req.role === "admin" ? `a${req.compteId}` : `u${req.adherentId}`;
    const { id } = req.params;
    const emoji = (req.body.emoji || "👍").slice(0, 10);
    let likerNom = null;
    if (req.role === "admin") {
      const [[adh]] = await pool.query(
        "SELECT nom, prenom FROM adherents WHERE compte_id = ? AND est_supprime = 0 ORDER BY id ASC LIMIT 1",
        [req.compteId]
      );
      if (adh) likerNom = `${adh.prenom || ""} ${adh.nom || ""}`.trim();
    } else {
      const [[adh]] = await pool.query(
        "SELECT nom, prenom FROM adherents WHERE id = ? AND compte_id = ?",
        [req.adherentId, req.compteId]
      );
      if (adh) likerNom = `${adh.prenom || ""} ${adh.nom || ""}`.trim();
    }
    const [[msg]] = await pool.query("SELECT id FROM messages WHERE id = ? AND compte_id = ?", [id, req.compteId]);
    if (!msg) return res.status(404).json({ error: "Message introuvable." });
    const [[existing]] = await pool.query(
      "SELECT id FROM message_likes WHERE message_id = ? AND liker_key = ? AND emoji = ?",
      [id, likerKey, emoji]
    );
    if (existing) {
      await pool.query("DELETE FROM message_likes WHERE message_id = ? AND liker_key = ? AND emoji = ?", [id, likerKey, emoji]);
    } else {
      await pool.query(
        "INSERT INTO message_likes (message_id, liker_key, emoji, liker_nom) VALUES (?, ?, ?, ?)",
        [id, likerKey, emoji, likerNom]
      );
    }
    const [rxns] = await pool.query("SELECT emoji, liker_key, liker_nom FROM message_likes WHERE message_id = ?", [id]);
    const grouped = {};
    for (const r of rxns) {
      if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, reactors: [], my_reaction: false };
      grouped[r.emoji].count++;
      if (r.liker_nom) grouped[r.emoji].reactors.push(r.liker_nom);
      if (r.liker_key === likerKey) grouped[r.emoji].my_reaction = true;
    }
    res.json({ reactions: grouped });
  } catch { res.status(500).json({ error: "Erreur serveur." }); }
});

app.delete("/api/messages/:id", authMiddleware, trésorierMiddleware, async (req, res) => {
  try {
    await pool.query("DELETE FROM message_likes WHERE message_id = ?", [req.params.id]);
    await pool.query("DELETE FROM messages WHERE id = ? AND compte_id = ?", [req.params.id, req.compteId]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Erreur serveur." }); }
});

// ═══════════════════════════════════════════════════════════════
// RAPPELS EMAIL — Cotisations impayées / partielles
// ═══════════════════════════════════════════════════════════════

app.post("/api/cotisations/:id/rappels", authMiddleware, trésorierMiddleware, async (req, res) => {
  if (!transporter && !atSMS) return res.status(503).json({ error: "Aucun service de notification configuré (email ou SMS)." });
  try {
    const cotisationId = Number(req.params.id);
    const [[cot]] = await pool.query(
      "SELECT id, libelle, montant_du FROM cotisations WHERE id = ? AND compte_id = ?",
      [cotisationId, req.compteId]
    );
    if (!cot) return res.status(404).json({ error: "Période introuvable." });

    const [[nomAssoc]] = await pool.query("SELECT nom_association FROM comptes WHERE id = ?", [req.compteId]);
    const nomOrg = nomAssoc?.nom_association || "votre association";

    // Tous les adhérents impayés/partiels (email OU téléphone)
    const [nonPayes] = await pool.query(`
      SELECT a.id, a.nom, a.prenom, a.email, a.telephone,
             COALESCE(p.solde_paye, 0)  AS solde_paye,
             COALESCE(p.reste, ?)       AS reste,
             COALESCE(p.statut, 'Impayé') AS statut
      FROM adherents a
      LEFT JOIN paiements p ON p.adherent_id = a.id AND p.cotisation_id = ?
      WHERE a.compte_id = ? AND a.est_supprime = 0
        AND (a.email IS NOT NULL AND a.email != '' OR a.telephone IS NOT NULL AND a.telephone != '')
        AND (p.statut IS NULL OR p.statut IN ('Impayé', 'Partiel'))
    `, [cot.montant_du, cotisationId, req.compteId]);

    if (nonPayes.length === 0) {
      return res.json({ emails: 0, sms: 0, ignores: 0, message: "Aucun adhérent impayé avec contact disponible." });
    }

    const fm = (v) => Number(v).toLocaleString("fr-FR");
    let emailsEnvoyes = 0, smsEnvoyes = 0, ignores = 0;

    for (const adh of nonPayes) {
      // ── Email ──
      if (transporter && adh.email) {
        try {
          await sendEmail({
            to: adh.email,
            subject: `Rappel de cotisation — ${cot.libelle}`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f9f9f9;border-radius:10px;overflow:hidden;border:1px solid #e0e0e0">
                <div style="background:#e67e22;padding:24px 28px;text-align:center">
                  <h1 style="color:white;margin:0;font-size:22px">🔔 Rappel de cotisation</h1>
                  <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px">${nomOrg}</p>
                </div>
                <div style="padding:28px">
                  <p style="font-size:15px;color:#2c3e50">Bonjour <strong>${adh.prenom} ${adh.nom}</strong>,</p>
                  <p style="color:#555;font-size:14px;line-height:1.6">
                    Nous vous rappelons que votre cotisation pour la période <strong>${cot.libelle}</strong> n'a pas encore été réglée ou est en cours de règlement.
                  </p>
                  <div style="background:#fff8f0;border:1px solid #f0c27f;border-radius:8px;padding:18px 20px;margin:20px 0">
                    <table style="width:100%;border-collapse:collapse;font-size:14px">
                      <tr><td style="color:#777;padding:4px 0">Période</td><td style="text-align:right;font-weight:700;color:#2c3e50">${cot.libelle}</td></tr>
                      <tr><td style="color:#777;padding:4px 0">Montant total dû</td><td style="text-align:right;font-weight:700;color:#e74c3c">${fm(cot.montant_du)} FCFA</td></tr>
                      <tr><td style="color:#777;padding:4px 0">Déjà payé</td><td style="text-align:right;color:#27ae60;font-weight:700">${fm(adh.solde_paye)} FCFA</td></tr>
                      <tr><td style="color:#777;padding:4px 0">Reste à payer</td><td style="text-align:right;font-weight:800;color:#e74c3c;font-size:16px">${fm(adh.reste)} FCFA</td></tr>
                      <tr><td style="color:#777;padding:4px 0">Statut</td><td style="text-align:right"><span style="background:#fff3e0;color:#e67e22;padding:3px 12px;border-radius:20px;font-weight:700;font-size:13px">${adh.statut}</span></td></tr>
                    </table>
                  </div>
                  <p style="color:#555;font-size:14px">Merci de régulariser votre situation dans les meilleurs délais auprès de votre trésorier(e).</p>
                  <p style="color:#888;font-size:12px;margin-top:24px">Ce message est envoyé automatiquement par Cotisation Pro.</p>
                </div>
              </div>`,
          });
          emailsEnvoyes++;
        } catch (_) { ignores++; }
      }

    }

    await logAudit(req.compteId, req.userId || req.compteId, req.role, "RAPPELS_NOTIFICATION",
      `Période ${cot.libelle} — ${emailsEnvoyes} email(s), ${smsEnvoyes} SMS envoyé(s)`, getClientIp(req));
    res.json({ emails: emailsEnvoyes, sms: smsEnvoyes, ignores, message: `${emailsEnvoyes} email(s) et ${smsEnvoyes} SMS envoyé(s).` });
  } catch { res.status(500).json({ error: "Erreur serveur." }); }
});

// ═══════════════════════════════════════════════════════════════
// MOBILE MONEY — Configuration
// ═══════════════════════════════════════════════════════════════

// Obtenir la config Mobile Money de l'association (tous membres authentifiés)
app.get("/api/mobile-money/config", authMiddleware, async (req, res) => {
  try {
    const [[row]] = await pool.query(
      "SELECT om_numero, om_nom, wave_numero, wave_nom, mtn_numero, mtn_nom FROM comptes WHERE id = ?",
      [req.compteId]
    );
    res.json(row || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mettre à jour la config Mobile Money (admin uniquement)
app.put("/api/mobile-money/config", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { om_numero, om_nom, wave_numero, wave_nom, mtn_numero, mtn_nom } = req.body;
    await pool.query(
      `UPDATE comptes SET
        om_numero   = ?, om_nom   = ?,
        wave_numero = ?, wave_nom = ?,
        mtn_numero  = ?, mtn_nom  = ?
       WHERE id = ?`,
      [
        om_numero   || null, om_nom   || null,
        wave_numero || null, wave_nom || null,
        mtn_numero  || null, mtn_nom  || null,
        req.compteId,
      ]
    );
    await logAudit(req.compteId, req.compteId, "admin", "CONFIG_MOBILE_MONEY", "Configuration Mobile Money mise à jour", getClientIp(req));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// COMPTABILITÉ — Dépenses & Budgets
// ═══════════════════════════════════════════════════════════════

// Résumé financier : recettes collectées, dépenses, solde
app.get("/api/comptabilite/resume", authMiddleware, trésorierMiddleware, async (req, res) => {
  try {
    const { dateDebut, dateFin } = req.query;
    let recettesCond = "a.compte_id = ?";
    let recettesParams = [req.compteId];
    let depensesCond = "d.compte_id = ?";
    let depensesParams = [req.compteId];
    if (dateDebut) {
      recettesCond += " AND t.date_paiement >= ?";
      recettesParams.push(dateDebut);
      depensesCond += " AND d.date_depense >= ?";
      depensesParams.push(dateDebut);
    }
    if (dateFin) {
      recettesCond += " AND t.date_paiement <= ?";
      recettesParams.push(dateFin);
      depensesCond += " AND d.date_depense <= ?";
      depensesParams.push(dateFin);
    }
    const [[{ recettes }]] = await pool.query(
      `SELECT COALESCE(SUM(t.montant_paye), 0) AS recettes
       FROM transactions t
       JOIN paiements p ON p.id = t.paiement_id
       JOIN adherents a ON a.id = p.adherent_id
       WHERE ${recettesCond} AND a.est_supprime = 0`,
      recettesParams
    );
    const [[{ depenses }]] = await pool.query(
      `SELECT COALESCE(SUM(d.montant), 0) AS depenses FROM depenses d WHERE ${depensesCond}`,
      depensesParams
    );
    res.json({ recettes: Number(recettes), depenses: Number(depenses), solde: Number(recettes) - Number(depenses) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Liste des dépenses
app.get("/api/depenses", authMiddleware, trésorierMiddleware, async (req, res) => {
  try {
    const { dateDebut, dateFin, categorie } = req.query;
    let where = "WHERE compte_id = ?";
    const params = [req.compteId];
    if (dateDebut) { where += " AND date_depense >= ?"; params.push(dateDebut); }
    if (dateFin)   { where += " AND date_depense <= ?"; params.push(dateFin); }
    if (categorie) { where += " AND categorie = ?"; params.push(categorie); }
    const [rows] = await pool.query(
      `SELECT id, libelle, montant, categorie, date_depense, description, created_at FROM depenses ${where} ORDER BY date_depense DESC, id DESC`,
      params
    );
    res.json(rows);
  } catch { res.status(500).json({ error: "Erreur serveur." }); }
});

// Créer une dépense
app.post("/api/depenses", authMiddleware, trésorierMiddleware, async (req, res) => {
  try {
    const { libelle, montant, categorie, date_depense, description } = req.body;
    if (!libelle?.trim() || !montant || !date_depense) return res.status(400).json({ error: "Libellé, montant et date requis." });
    const m = parseFloat(montant);
    if (isNaN(m) || m <= 0) return res.status(400).json({ error: "Montant invalide." });
    const [result] = await pool.query(
      "INSERT INTO depenses (compte_id, libelle, montant, categorie, date_depense, description) VALUES (?, ?, ?, ?, ?, ?)",
      [req.compteId, libelle.trim(), m, (categorie || "Autre").trim(), date_depense, description?.trim() || null]
    );
    await logAudit(req.compteId, req.userId, req.role, "AJOUT_DEPENSE", `${libelle.trim()} — ${m} FCFA`, getClientIp(req));
    res.json({ id: result.insertId, libelle: libelle.trim(), montant: m, categorie: (categorie || "Autre").trim(), date_depense, description: description?.trim() || null });
  } catch { res.status(500).json({ error: "Erreur serveur." }); }
});

// Modifier une dépense
app.put("/api/depenses/:id", authMiddleware, trésorierMiddleware, async (req, res) => {
  try {
    const { libelle, montant, categorie, date_depense, description } = req.body;
    if (!libelle?.trim() || !montant || !date_depense) return res.status(400).json({ error: "Libellé, montant et date requis." });
    const m = parseFloat(montant);
    if (isNaN(m) || m <= 0) return res.status(400).json({ error: "Montant invalide." });
    const [[dep]] = await pool.query("SELECT id FROM depenses WHERE id = ? AND compte_id = ?", [req.params.id, req.compteId]);
    if (!dep) return res.status(404).json({ error: "Dépense introuvable." });
    await pool.query(
      "UPDATE depenses SET libelle = ?, montant = ?, categorie = ?, date_depense = ?, description = ? WHERE id = ? AND compte_id = ?",
      [libelle.trim(), m, (categorie || "Autre").trim(), date_depense, description?.trim() || null, req.params.id, req.compteId]
    );
    await logAudit(req.compteId, req.userId, req.role, "MODIF_DEPENSE", `${libelle.trim()} — ${m} FCFA`, getClientIp(req));
    res.json({ id: Number(req.params.id), libelle: libelle.trim(), montant: m, categorie: (categorie || "Autre").trim(), date_depense, description: description?.trim() || null });
  } catch { res.status(500).json({ error: "Erreur serveur." }); }
});

// Supprimer une dépense
app.delete("/api/depenses/:id", authMiddleware, trésorierMiddleware, async (req, res) => {
  try {
    const [[dep]] = await pool.query("SELECT id, libelle FROM depenses WHERE id = ? AND compte_id = ?", [req.params.id, req.compteId]);
    if (!dep) return res.status(404).json({ error: "Dépense introuvable." });
    await pool.query("DELETE FROM depenses WHERE id = ? AND compte_id = ?", [req.params.id, req.compteId]);
    await logAudit(req.compteId, req.userId, req.role, "SUPPRESSION_DEPENSE", dep.libelle, getClientIp(req));
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Erreur serveur." }); }
});

// Liste des budgets
app.get("/api/budgets", authMiddleware, trésorierMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, libelle, montant_prevu, date_debut, date_fin, created_at FROM budgets WHERE compte_id = ? ORDER BY created_at DESC",
      [req.compteId]
    );
    // Pour chaque budget, calculer les dépenses de la période
    const enriched = await Promise.all(rows.map(async (b) => {
      let where = "WHERE compte_id = ?";
      const params = [req.compteId];
      if (b.date_debut) { where += " AND date_depense >= ?"; params.push(b.date_debut); }
      if (b.date_fin)   { where += " AND date_depense <= ?"; params.push(b.date_fin); }
      const [[{ total }]] = await pool.query(`SELECT COALESCE(SUM(montant), 0) AS total FROM depenses ${where}`, params);
      return { ...b, depenses_reelles: Number(total) };
    }));
    res.json(enriched);
  } catch { res.status(500).json({ error: "Erreur serveur." }); }
});

// Créer un budget
app.post("/api/budgets", authMiddleware, trésorierMiddleware, async (req, res) => {
  try {
    const { libelle, montant_prevu, date_debut, date_fin } = req.body;
    if (!libelle?.trim() || !montant_prevu) return res.status(400).json({ error: "Libellé et montant prévisionnel requis." });
    const m = parseFloat(montant_prevu);
    if (isNaN(m) || m <= 0) return res.status(400).json({ error: "Montant invalide." });
    const [result] = await pool.query(
      "INSERT INTO budgets (compte_id, libelle, montant_prevu, date_debut, date_fin) VALUES (?, ?, ?, ?, ?)",
      [req.compteId, libelle.trim(), m, date_debut || null, date_fin || null]
    );
    res.json({ id: result.insertId, libelle: libelle.trim(), montant_prevu: m, date_debut: date_debut || null, date_fin: date_fin || null, depenses_reelles: 0 });
  } catch { res.status(500).json({ error: "Erreur serveur." }); }
});

// Modifier un budget
app.put("/api/budgets/:id", authMiddleware, trésorierMiddleware, async (req, res) => {
  try {
    const { libelle, montant_prevu, date_debut, date_fin } = req.body;
    if (!libelle?.trim() || !montant_prevu) return res.status(400).json({ error: "Libellé et montant prévisionnel requis." });
    const m = parseFloat(montant_prevu);
    if (isNaN(m) || m <= 0) return res.status(400).json({ error: "Montant invalide." });
    const [[b]] = await pool.query("SELECT id FROM budgets WHERE id = ? AND compte_id = ?", [req.params.id, req.compteId]);
    if (!b) return res.status(404).json({ error: "Budget introuvable." });
    await pool.query(
      "UPDATE budgets SET libelle = ?, montant_prevu = ?, date_debut = ?, date_fin = ? WHERE id = ? AND compte_id = ?",
      [libelle.trim(), m, date_debut || null, date_fin || null, req.params.id, req.compteId]
    );
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Erreur serveur." }); }
});

// Supprimer un budget
app.delete("/api/budgets/:id", authMiddleware, trésorierMiddleware, async (req, res) => {
  try {
    const [[b]] = await pool.query("SELECT id FROM budgets WHERE id = ? AND compte_id = ?", [req.params.id, req.compteId]);
    if (!b) return res.status(404).json({ error: "Budget introuvable." });
    await pool.query("DELETE FROM budgets WHERE id = ? AND compte_id = ?", [req.params.id, req.compteId]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Erreur serveur." }); }
});

// Évolution mensuelle recettes vs dépenses (12 derniers mois)
app.get("/api/comptabilite/evolution", authMiddleware, trésorierMiddleware, async (req, res) => {
  try {
    const [recRows] = await pool.query(
      `SELECT DATE_FORMAT(t.date_paiement,'%Y-%m') AS mois, SUM(t.montant_paye) AS total
       FROM transactions t
       JOIN paiements p ON p.id = t.paiement_id
       JOIN cotisations c ON c.id = p.cotisation_id
       JOIN adherents a ON a.id = p.adherent_id
       WHERE c.compte_id = ? AND a.est_supprime = 0
         AND t.date_paiement >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       GROUP BY mois ORDER BY mois`,
      [req.compteId]
    );
    const [depRows] = await pool.query(
      `SELECT DATE_FORMAT(date_depense,'%Y-%m') AS mois, SUM(montant) AS total
       FROM depenses WHERE compte_id = ?
         AND date_depense >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       GROUP BY mois ORDER BY mois`,
      [req.compteId]
    );
    const moisSet = new Set([...recRows.map(r => r.mois), ...depRows.map(r => r.mois)]);
    const sorted = [...moisSet].sort();
    const result = sorted.map(m => ({
      mois: m,
      recettes: Number(recRows.find(r => r.mois === m)?.total || 0),
      depenses: Number(depRows.find(r => r.mois === m)?.total || 0),
    }));
    res.json(result);
  } catch { res.status(500).json({ error: "Erreur serveur." }); }
});

// Livre de caisse : toutes les entrées et sorties chronologiques avec solde cumulatif
app.get("/api/comptabilite/livre-de-caisse", authMiddleware, trésorierMiddleware, async (req, res) => {
  try {
    const { dateDebut, dateFin } = req.query;
    let recCond = "a.compte_id = ?";
    let depCond = "d.compte_id = ?";
    const recParams = [req.compteId];
    const depParams = [req.compteId];
    if (dateDebut) {
      recCond += " AND t.date_paiement >= ?"; recParams.push(dateDebut);
      depCond += " AND d.date_depense >= ?";  depParams.push(dateDebut);
    }
    if (dateFin) {
      recCond += " AND t.date_paiement <= ?"; recParams.push(dateFin);
      depCond += " AND d.date_depense <= ?";  depParams.push(dateFin);
    }
    const [rows] = await pool.query(`
      (SELECT t.date_paiement AS date,
              CONCAT(a.nom, ' ', a.prenom, ' — ', c.libelle) AS libelle,
              'Recette' AS type,
              t.montant_paye AS entree,
              0 AS sortie,
              COALESCE(t.numero_recu, '') AS ref
       FROM transactions t
       JOIN paiements p   ON p.id = t.paiement_id
       JOIN adherents a   ON a.id = p.adherent_id
       JOIN cotisations c ON c.id = p.cotisation_id
       WHERE ${recCond})
      UNION ALL
      (SELECT d.date_depense AS date,
              d.libelle,
              'Dépense' AS type,
              0 AS entree,
              d.montant AS sortie,
              d.categorie AS ref
       FROM depenses d
       WHERE ${depCond})
      ORDER BY date ASC, type ASC
    `, [...recParams, ...depParams]);
    let solde = 0;
    const lignes = rows.map(r => {
      solde += Number(r.entree) - Number(r.sortie);
      return { date: r.date, libelle: r.libelle, type: r.type, entree: Number(r.entree), sortie: Number(r.sortie), ref: r.ref, solde: Math.round(solde * 100) / 100 };
    });
    res.json(lignes);
  } catch { res.status(500).json({ error: "Erreur serveur." }); }
});

// Taux de recouvrement par période de cotisation
app.get("/api/comptabilite/recouvrement", authMiddleware, trésorierMiddleware, async (req, res) => {
  try {
    const [[{ total_adherents }]] = await pool.query(
      "SELECT COUNT(*) AS total_adherents FROM adherents WHERE compte_id = ? AND est_supprime = 0",
      [req.compteId]
    );
    const [rows] = await pool.query(`
      SELECT c.id, c.libelle, c.montant_du, c.created_at,
             COALESCE(SUM(CASE WHEN p.statut = 'Payé' THEN 1 ELSE 0 END), 0) AS payes_complets,
             COALESCE(SUM(CASE WHEN p.statut IN ('Payé','Partiel') THEN 1 ELSE 0 END), 0) AS ont_paye,
             COALESCE(SUM(p.solde_paye), 0) AS montant_collecte
      FROM cotisations c
      LEFT JOIN paiements p ON p.cotisation_id = c.id
      WHERE c.compte_id = ?
      GROUP BY c.id, c.libelle, c.montant_du, c.created_at
      ORDER BY c.created_at DESC
    `, [req.compteId]);
    const attendus = Number(total_adherents);
    res.json(rows.map(r => ({
      id: r.id,
      libelle: r.libelle,
      montant_du: Number(r.montant_du),
      attendus,
      ont_paye: Number(r.ont_paye),
      payes_complets: Number(r.payes_complets),
      montant_collecte: Number(r.montant_collecte),
      taux: attendus > 0 ? Math.round((Number(r.payes_complets) / attendus) * 100) : 0,
    })));
  } catch { res.status(500).json({ error: "Erreur serveur." }); }
});

// ═══════════════════════════════════════════════════════════════
// FRONTEND — servir le build React en production
// ═══════════════════════════════════════════════════════════════
const distPath = path.join(__dirname, "..", "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// ═══════════════════════════════════════════════════════════════
// DÉMARRAGE
// ═══════════════════════════════════════════════════════════════
const PORT = process.env.PORT || 3000;

initDB()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () =>
      console.log(`Serveur Cotisation Pro démarré sur http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("Erreur initialisation BDD ❌", err.message || err.code || JSON.stringify(err));
    console.error("DB_HOST:", process.env.DB_HOST);
    console.error("DB_USER:", process.env.DB_USER);
    console.error("DB_NAME:", process.env.DB_NAME);
    console.error("DB_PORT:", process.env.DB_PORT);
    process.exit(1);
  });
