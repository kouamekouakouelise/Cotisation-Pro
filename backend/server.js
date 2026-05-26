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

// Trésorier-admin uniquement (créateur du compte)
function adminMiddleware(req, res, next) {
  if (req.role !== "admin") {
    return res.status(403).json({ error: "Accès réservé au trésorier (administrateur)." });
  }
  next();
}

// Trésorier : admin OU membre avec poste Trésorier
function trésorierMiddleware(req, res, next) {
  if (req.role === "admin") return next();
  if (req.role === "user" && req.poste && req.poste.toLowerCase().includes("trésorier")) return next();
  return res.status(403).json({ error: "Accès réservé au trésorier." });
}

// Admin OU membre avec un poste (haut membre)
function hautMembreMiddleware(req, res, next) {
  if (req.role === "admin" || (req.role === "user" && req.poste)) return next();
  return res.status(403).json({ error: "Accès réservé aux membres ayant un poste." });
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
    res.json({ status: "ok", db: "connected", time: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: "error", db: "disconnected", message: err.message });
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
        return res.status(409).json({ error: "Un compte trésorier existe déjà pour cet email et cette association." });
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

      // Créer automatiquement l'adhérent du trésorier
      const matricule = await genererMatricule(conn, adminId);
      await conn.query(
        `INSERT INTO adherents (compte_id, matricule, nom, prenom, email, telephone, poste)
         VALUES (?, ?, ?, ?, ?, ?, 'Trésorier')`,
        [adminId, matricule, nom.trim(), prenom.trim(), emailKey, telephone ? telephone.trim() : null]
      );

      await conn.commit();
      const token = jwt.sign(
        { compteId: adminId, email: emailKey, nom_association: nom_association.trim(), role: "admin" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
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
        }

        return res.json(responseData);
      }
    }

    return res.status(401).json({ error: "Email/téléphone ou mot de passe incorrect." });
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
app.get("/api/admin/invite-token", authMiddleware, adminMiddleware, async (req, res) => {
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
app.post("/api/admin/invite-token/reset", authMiddleware, adminMiddleware, async (req, res) => {
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
      `SELECT c.libelle as periode, c.montant_du,
              p.solde_paye, p.reste, p.statut,
              (SELECT MAX(t.date_paiement) FROM transactions t WHERE t.paiement_id = p.id) as dernier_paiement
       FROM cotisations c
       LEFT JOIN paiements p ON p.cotisation_id = c.id AND p.adherent_id = ?
       WHERE c.compte_id = ?
       ORDER BY c.id ASC`,
      [adherentId, req.compteId]
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
        try {
          await sendEmail({
            to: emailKey,
            subject: "Vos identifiants de connexion — Cotisation Pro",
            html: `<p>Bonjour <strong>${nom} ${prenom}</strong>,</p>
                   <p>Votre compte membre a été créé sur <strong>Cotisation Pro</strong> (${req.nomAssociation || "votre association"}).</p>
                   <p style="background:#f4f4f4;padding:12px;border-radius:6px;">
                     <strong>Email :</strong> ${emailKey}<br>
                     <strong>Mot de passe :</strong> ${plainPwd}
                   </p>
                   <p>Connectez-vous et modifiez votre mot de passe depuis votre profil.</p>
                   <p style="color:#888;font-size:12px;">Cotisation Pro</p>`,
          });
          emailSent = true;
        } catch (_) {}
      }
    }

    await conn.commit();
    res.json({ id: adherentId, matricule, emailSent, message: "Adhérent ajouté ✅" });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

app.put("/api/adherents/:id", authMiddleware, trésorierMiddleware, async (req, res) => {
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
          numeroRecu:   r.numero_recu,
          datePaiement: r.date_paiement
            ? new Date(r.date_paiement).toLocaleDateString("fr-FR")
            : "-",
          periode:      r.periode,
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
      auteurPoste = adh?.poste || "Président";
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
