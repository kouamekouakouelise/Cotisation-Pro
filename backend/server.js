const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

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

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET manquant dans les variables d'environnement");
const SALT_ROUNDS = 10;

// ── Connexion MySQL (local et Railway) ────────────────────────
const mysql = require("mysql2/promise");
const pool = process.env.MYSQL_URL
  ? mysql.createPool(process.env.MYSQL_URL + "?waitForConnections=true&connectionLimit=10&queueLimit=0")
  : mysql.createPool({
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

// ── Transporteur email (Gmail SMTP via nodemailer) ─────────────
// ── Envoi email via Brevo (HTTPS — jamais bloqué par Railway) ─────────────
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_FROM    = process.env.BREVO_FROM || process.env.EMAIL_USER;
let emailReady = !!BREVO_API_KEY;

if (!BREVO_API_KEY) {
  console.warn("⚠️  BREVO_API_KEY manquant — l'envoi d'OTP sera désactivé.");
} else {
  console.log(`✉️  Email (Brevo HTTPS) prêt — expéditeur : ${BREVO_FROM}`);
}

async function sendEmail({ to, subject, html }) {
  if (!BREVO_API_KEY) throw new Error("BREVO_API_KEY non configuré.");

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "Cotisation Pro", email: BREVO_FROM },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Brevo erreur HTTP ${res.status}`);
  }
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

  // Migrations silencieuses pour les tables existantes
  await pool.query(`DROP TRIGGER IF EXISTS trg_before_transaction_insert`);
  await pool.query(`DROP TRIGGER IF EXISTS trg_after_transaction_insert`);
  try { await pool.query(`ALTER TABLE adherents ADD COLUMN est_supprime TINYINT(1) NOT NULL DEFAULT 0`); } catch (_) {}
  try { await pool.query(`ALTER TABLE adherents ADD COLUMN compte_id INT UNSIGNED NOT NULL DEFAULT 0`); } catch (_) {}
  try { await pool.query(`ALTER TABLE adherents ADD COLUMN photo MEDIUMTEXT DEFAULT NULL`); } catch (_) {}
  try { await pool.query(`ALTER TABLE cotisations ADD COLUMN compte_id INT UNSIGNED NOT NULL DEFAULT 0`); } catch (_) {}

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

  console.log("Base de données initialisée ✅");
}

// ── Middleware JWT ─────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentification requise." });
  }
  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.compteId = decoded.compteId;
    req.nomAssociation = decoded.nom_association;
    next();
  } catch {
    return res.status(401).json({ error: "Session expirée. Veuillez vous reconnecter." });
  }
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
    const { nom_association, email, mot_de_passe, otp } = req.body;

    if (!nom_association || !email || !mot_de_passe) {
      return res.status(400).json({ error: "Tous les champs sont obligatoires." });
    }
    if (mot_de_passe.length < 6) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères." });
    }

    const emailKey = email.trim().toLowerCase();

    // Vérification OTP
    const otpEntry = otpStore.get(emailKey);
    if (!otpEntry) {
      return res.status(400).json({ error: "Aucun code de vérification trouvé. Veuillez en demander un nouveau." });
    }
    if (Date.now() > otpEntry.expires) {
      otpStore.delete(emailKey);
      return res.status(400).json({ error: "Le code de vérification a expiré. Veuillez en demander un nouveau." });
    }
    if (otp !== otpEntry.code) {
      return res.status(400).json({ error: "Code de vérification incorrect." });
    }
    otpStore.delete(emailKey);
    const [existingAccounts] = await pool.query(
      "SELECT id, nom_association, mot_de_passe FROM comptes WHERE email = ?",
      [emailKey]
    );

    for (const account of existingAccounts) {
      const samePassword = await bcrypt.compare(mot_de_passe, account.mot_de_passe);
      const sameAssociation = account.nom_association.toLowerCase() === nom_association.trim().toLowerCase();

      if (samePassword && sameAssociation) {
        return res.status(409).json({ error: "Ce compte existe déjà." });
      }
      if (samePassword && !sameAssociation) {
        return res.status(409).json({ error: "Ce mot de passe est déjà utilisé avec cet email." });
      }
      if (!samePassword && sameAssociation) {
        return res.status(409).json({ error: "Cette association est déjà enregistrée avec cet email." });
      }
    }

    const hash = await bcrypt.hash(mot_de_passe, SALT_ROUNDS);
    const [result] = await pool.query(
      "INSERT INTO comptes (nom_association, email, mot_de_passe) VALUES (?, ?, ?)",
      [nom_association.trim(), emailKey, hash]
    );

    const token = jwt.sign(
      { compteId: result.insertId, email: emailKey, nom_association: nom_association.trim() },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, nom_association: nom_association.trim(), email: emailKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Connexion
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;
    if (!email || !mot_de_passe) {
      return res.status(400).json({ error: "Email et mot de passe requis." });
    }

    const [accounts] = await pool.query(
      "SELECT id, nom_association, email, mot_de_passe FROM comptes WHERE email = ?",
      [email.trim().toLowerCase()]
    );

    if (accounts.length === 0) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect." });
    }

    for (const account of accounts) {
      const match = await bcrypt.compare(mot_de_passe, account.mot_de_passe);
      if (match) {
        const token = jwt.sign(
          { compteId: account.id, email: account.email, nom_association: account.nom_association },
          JWT_SECRET,
          { expiresIn: "7d" }
        );
        return res.json({ token, nom_association: account.nom_association, email: account.email });
      }
    }

    return res.status(401).json({ error: "Email ou mot de passe incorrect." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
    if (nouveau_mot_de_passe.length < 6) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères." });
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
    const [[compte]] = await pool.query("SELECT mot_de_passe FROM comptes WHERE id = ?", [req.compteId]);
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
    if (nouveau_mot_de_passe.length < 6)
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères." });
    const [[compte]] = await pool.query("SELECT id, mot_de_passe FROM comptes WHERE id = ?", [req.compteId]);
    if (!compte) return res.status(404).json({ error: "Compte introuvable." });
    const match = await bcrypt.compare(ancien_mot_de_passe, compte.mot_de_passe);
    if (!match) return res.status(400).json({ error: "Ancien mot de passe incorrect." });
    const hash = await bcrypt.hash(nouveau_mot_de_passe, SALT_ROUNDS);
    await pool.query("UPDATE comptes SET mot_de_passe = ? WHERE id = ?", [hash, req.compteId]);
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
// ROUTES — ADHÉRENTS (protégées)
// ═══════════════════════════════════════════════════════════════

app.get("/api/adherents", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, matricule, nom, prenom, telephone, email, date_inscription, photo, created_at
       FROM adherents WHERE compte_id = ? AND est_supprime = 0 ORDER BY id ASC`,
      [req.compteId]
    );
    res.json(rows.map((a) => ({ ...a, date: a.date_inscription || null, paid: false })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/adherents", authMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { nom, prenom, telephone, email, date_inscription, photo } = req.body;
    if (!nom || !prenom)
      return res.status(400).json({ error: "Nom et prénom obligatoires." });

    await conn.beginTransaction();

    const matricule = await genererMatricule(conn, req.compteId);

    const [result] = await conn.query(
      `INSERT INTO adherents (compte_id, matricule, nom, prenom, telephone, email, date_inscription, photo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.compteId, matricule, nom, prenom, telephone || null, email || null, date_inscription || null, photo || null]
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

    await conn.commit();
    res.json({ id: adherentId, matricule, message: "Adhérent ajouté ✅" });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

app.put("/api/adherents/:id", authMiddleware, async (req, res) => {
  try {
    const { nom, prenom, telephone, email, photo } = req.body;
    if (!nom || !prenom)
      return res.status(400).json({ error: "Nom et prénom obligatoires." });

    if (photo !== undefined) {
      await pool.query(
        "UPDATE adherents SET nom=?, prenom=?, telephone=?, email=?, photo=? WHERE id=? AND compte_id=?",
        [nom, prenom, telephone || null, email || null, photo || null, req.params.id, req.compteId]
      );
    } else {
      await pool.query(
        "UPDATE adherents SET nom=?, prenom=?, telephone=?, email=? WHERE id=? AND compte_id=?",
        [nom, prenom, telephone || null, email || null, req.params.id, req.compteId]
      );
    }
    res.json({ message: "Adhérent modifié ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/adherents/:id", authMiddleware, async (req, res) => {
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

app.post("/api/periodes", authMiddleware, async (req, res) => {
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

app.post("/api/periodes/:periodeId/paiements", authMiddleware, async (req, res) => {
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
