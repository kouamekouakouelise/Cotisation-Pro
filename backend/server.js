const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());

// ── Transporteur email ─────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Store OTP en mémoire ───────────────────────────────────────
// Structure : email → { code, expiresAt, purpose }
const otpStore = new Map();

function genererOTP() {
  return String(Math.floor(10000 + Math.random() * 90000)); // 5 chiffres
}

async function envoyerOTP(email, code, purpose) {
  const sujet = purpose === "register"
    ? "Cotisation Pro — Code de vérification pour la création de compte"
    : "Cotisation Pro — Code de vérification pour la connexion";

  const action = purpose === "register"
    ? "confirmer la création de votre compte"
    : "vous connecter";

  await transporter.sendMail({
    from: `"Cotisation Pro" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: sujet,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f7f9fc;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#2c3e50;margin:0;">Cotisation Pro</h2>
          <p style="color:#7f8c8d;font-size:14px;margin:4px 0 0;">Gestion des cotisations d'associations</p>
        </div>
        <div style="background:white;border-radius:10px;padding:28px 24px;box-shadow:0 2px 12px rgba(0,0,0,0.07);">
          <p style="color:#2c3e50;font-size:15px;margin:0 0 20px;">Bonjour,</p>
          <p style="color:#444;font-size:14px;margin:0 0 24px;">Voici votre code de vérification pour <strong>${action}</strong> :</p>
          <div style="text-align:center;background:#f0f4ff;border-radius:10px;padding:20px;margin-bottom:24px;">
            <span style="font-size:38px;font-weight:bold;letter-spacing:14px;color:#2c3e50;">${code}</span>
          </div>
          <p style="color:#7f8c8d;font-size:13px;margin:0;">Ce code est valable <strong>10 minutes</strong>. Ne le partagez avec personne.</p>
        </div>
        <p style="color:#b0b8c1;font-size:12px;text-align:center;margin-top:20px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
      </div>
    `,
  });
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET manquant dans les variables d'environnement");
const SALT_ROUNDS = 10;

// ── Pool MySQL ─────────────────────────────────────────────────
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "KouameKouakouElise",
  database: process.env.DB_NAME || "cotisation_pro",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "local",
});

// ── Initialisation de la base de données ──────────────────────
async function initDB() {
  // Table comptes (authentification multi-associations)
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

  // Table adhérents
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
      est_supprime     TINYINT(1) NOT NULL DEFAULT 0,
      created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_compte (compte_id),
      INDEX idx_nom_prenom (nom, prenom)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Table compteur de matricules
  await pool.query(`
    CREATE TABLE IF NOT EXISTS matricule_counter (
      compte_id INT UNSIGNED NOT NULL,
      annee     SMALLINT NOT NULL,
      compteur  INT NOT NULL DEFAULT 0,
      PRIMARY KEY (compte_id, annee)
    ) ENGINE=InnoDB
  `);

  // Table cotisations (périodes)
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

  // Table paiements (une ligne par adhérent × cotisation)
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

  // Table transactions (détail des versements)
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
  try { await pool.query(`ALTER TABLE cotisations ADD COLUMN compte_id INT UNSIGNED NOT NULL DEFAULT 0`); } catch (_) {}

  // Supprimer TOUS les index uniques portant sur matricule seul (quel que soit leur nom)
  // On interroge information_schema pour trouver leur vrai nom dans la base actuelle
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

  // Ajouter la contrainte composite (compte_id, matricule) si elle n'existe pas encore
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
// ROUTES — AUTHENTIFICATION (publiques)
// ═══════════════════════════════════════════════════════════════

// Envoyer un code OTP par email
app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const { email, purpose, mot_de_passe } = req.body;
    if (!email || !purpose) {
      return res.status(400).json({ error: "Email et purpose requis." });
    }

    // Pour la connexion : vérifier les identifiants avant d'envoyer le code
    if (purpose === "login") {
      if (!mot_de_passe) {
        return res.status(400).json({ error: "Mot de passe requis." });
      }
      const [accounts] = await pool.query(
        "SELECT id, mot_de_passe FROM comptes WHERE email = ?",
        [email.trim().toLowerCase()]
      );
      if (accounts.length === 0) {
        return res.status(401).json({ error: "Email ou mot de passe incorrect." });
      }
      let credentialsOk = false;
      for (const account of accounts) {
        if (await bcrypt.compare(mot_de_passe, account.mot_de_passe)) {
          credentialsOk = true;
          break;
        }
      }
      if (!credentialsOk) {
        return res.status(401).json({ error: "Email ou mot de passe incorrect." });
      }
    }

    const code = genererOTP();
    otpStore.set(email.trim().toLowerCase(), {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      purpose,
    });

    await envoyerOTP(email.trim().toLowerCase(), code, purpose);
    res.json({ message: "Code envoyé par email." });
  } catch (err) {
    console.error("Erreur envoi OTP:", err);
    res.status(500).json({ error: "Impossible d'envoyer le code. Vérifiez la configuration email." });
  }
});

// Créer un compte
app.post("/api/auth/register", async (req, res) => {
  try {
    const { nom_association, email, mot_de_passe, code } = req.body;

    if (!nom_association || !email || !mot_de_passe) {
      return res.status(400).json({ error: "Tous les champs sont obligatoires." });
    }
    if (!code) {
      return res.status(400).json({ error: "Code de vérification requis." });
    }

    // Vérifier le code OTP
    const emailKey = email.trim().toLowerCase();
    const stored = otpStore.get(emailKey);
    if (!stored || stored.purpose !== "register") {
      return res.status(400).json({ error: "Aucun code envoyé pour cet email. Veuillez demander un nouveau code." });
    }
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(emailKey);
      return res.status(400).json({ error: "Code expiré. Veuillez demander un nouveau code." });
    }
    if (stored.code !== code.trim()) {
      return res.status(400).json({ error: "Code incorrect. Vérifiez votre email et réessayez." });
    }
    otpStore.delete(emailKey);

    if (mot_de_passe.length < 6) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères." });
    }

    // Récupérer tous les comptes ayant le même email
    const [existingAccounts] = await pool.query(
      "SELECT id, nom_association, mot_de_passe FROM comptes WHERE email = ?",
      [email.trim().toLowerCase()]
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
      [nom_association.trim(), email.trim().toLowerCase(), hash]
    );

    const token = jwt.sign(
      { compteId: result.insertId, email: email.trim().toLowerCase(), nom_association: nom_association.trim() },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, nom_association: nom_association.trim(), email: email.trim().toLowerCase() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Connexion
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, mot_de_passe, code } = req.body;
    if (!email || !mot_de_passe) {
      return res.status(400).json({ error: "Email et mot de passe requis." });
    }
    if (!code) {
      return res.status(400).json({ error: "Code de vérification requis." });
    }

    // Vérifier le code OTP
    const emailKey = email.trim().toLowerCase();
    const stored = otpStore.get(emailKey);
    if (!stored || stored.purpose !== "login") {
      return res.status(400).json({ error: "Aucun code envoyé pour cet email. Veuillez demander un nouveau code." });
    }
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(emailKey);
      return res.status(400).json({ error: "Code expiré. Veuillez demander un nouveau code." });
    }
    if (stored.code !== code.trim()) {
      return res.status(400).json({ error: "Code incorrect. Vérifiez votre email et réessayez." });
    }
    otpStore.delete(emailKey);

    const [accounts] = await pool.query(
      "SELECT id, nom_association, email, mot_de_passe FROM comptes WHERE email = ?",
      [emailKey]
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

// Mot de passe oublié — envoyer OTP
app.post("/api/auth/forgot-password", async (req, res) => {
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
      return res.status(404).json({ error: "Aucun compte trouvé avec cet email et ce nom d'association." });
    }
    const code = genererOTP();
    otpStore.set(emailKey, { code, expiresAt: Date.now() + 10 * 60 * 1000, purpose: "reset" });
    await transporter.sendMail({
      from: `"Cotisation Pro" <${process.env.EMAIL_USER}>`,
      to: emailKey,
      subject: "Cotisation Pro — Réinitialisation de mot de passe",
      html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border-radius:12px;background:#f9f9f9;border:1px solid #e0e0e0">
        <h2 style="color:#2c3e50;margin-top:0">Réinitialisation de mot de passe</h2>
        <p style="color:#555">Votre code de vérification pour réinitialiser votre mot de passe :</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#2c3e50;text-align:center;padding:20px;background:#fff;border-radius:8px;border:2px solid #3498db;margin:20px 0">${code}</div>
        <p style="color:#888;font-size:13px">Ce code est valable <strong>10 minutes</strong>. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
      </div>`,
    });
    res.json({ message: "Code envoyé." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mot de passe oublié — valider OTP et définir nouveau mot de passe
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { email, code, nouveau_mot_de_passe } = req.body;
    if (!email || !code || !nouveau_mot_de_passe) {
      return res.status(400).json({ error: "Tous les champs sont requis." });
    }
    if (nouveau_mot_de_passe.length < 6) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères." });
    }
    const emailKey = email.trim().toLowerCase();
    const stored = otpStore.get(emailKey);
    if (!stored || stored.purpose !== "reset") {
      return res.status(400).json({ error: "Aucun code de réinitialisation en cours. Recommencez." });
    }
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(emailKey);
      return res.status(400).json({ error: "Code expiré. Veuillez recommencer." });
    }
    if (stored.code !== code.trim()) {
      return res.status(400).json({ error: "Code incorrect. Vérifiez et réessayez." });
    }
    otpStore.delete(emailKey);
    const hash = await bcrypt.hash(nouveau_mot_de_passe, 10);
    await pool.query("UPDATE comptes SET mot_de_passe = ? WHERE email = ?", [hash, emailKey]);
    res.json({ message: "Mot de passe réinitialisé avec succès." });
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
      `SELECT id, matricule, nom, prenom, telephone, email, date_inscription, created_at
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
    const { nom, prenom, telephone, email, date_inscription } = req.body;
    if (!nom || !prenom)
      return res.status(400).json({ error: "Nom et prénom obligatoires." });

    await conn.beginTransaction();

    const matricule = await genererMatricule(conn, req.compteId);

    const [result] = await conn.query(
      `INSERT INTO adherents (compte_id, matricule, nom, prenom, telephone, email, date_inscription)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.compteId, matricule, nom, prenom, telephone || null, email || null, date_inscription || null]
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
    const { nom, prenom, telephone, email } = req.body;
    if (!nom || !prenom)
      return res.status(400).json({ error: "Nom et prénom obligatoires." });

    await pool.query(
      "UPDATE adherents SET nom=?, prenom=?, telephone=?, email=? WHERE id=? AND compte_id=?",
      [nom, prenom, telephone || null, email || null, req.params.id, req.compteId]
    );
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

async function nettoyerPaiementsIneligibles() {
  // Plus de restriction par date — tous les adhérents actifs sont éligibles
}

// ═══════════════════════════════════════════════════════════════
// DÉMARRAGE
// ═══════════════════════════════════════════════════════════════
const PORT = process.env.PORT || 3000;

initDB()
  .then(() => nettoyerPaiementsIneligibles())
  .then(() => {
    app.listen(PORT, () =>
      console.log(`Serveur Cotisation Pro démarré sur http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("Erreur initialisation BDD ❌", err.message);
    process.exit(1);
  });
