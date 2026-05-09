-- ============================================================
-- cotisation_pro.sql — Base de données Cotisation Pro v2.0
-- MySQL 5.7+ / MariaDB 10.3+
-- Mot de passe root : KouameKouakouElise
--
-- Import : mysql -u root -p cotisation_pro < cotisation_pro.sql
-- Ou via phpMyAdmin / MySQL Workbench
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS cotisation_pro;
CREATE DATABASE cotisation_pro
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cotisation_pro;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE comptes (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  nom_association  VARCHAR(200) NOT NULL,
  email            VARCHAR(150) NOT NULL,
  mot_de_passe     VARCHAR(255) NOT NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB;

CREATE TABLE adherents (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  compte_id        INT NOT NULL DEFAULT 0,
  matricule        VARCHAR(50),
  nom              VARCHAR(100) NOT NULL,
  prenom           VARCHAR(100) NOT NULL,
  telephone        VARCHAR(30),
  email            VARCHAR(150),
  date_inscription DATE,
  est_supprime     TINYINT(1) NOT NULL DEFAULT 0,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_compte_matricule (compte_id, matricule),
  INDEX idx_compte (compte_id),
  INDEX idx_nom_prenom (nom, prenom)
) ENGINE=InnoDB;

CREATE TABLE matricule_counter (
  compte_id INT NOT NULL DEFAULT 0,
  annee     SMALLINT NOT NULL,
  compteur  INT NOT NULL DEFAULT 0,
  PRIMARY KEY (compte_id, annee)
) ENGINE=InnoDB;

CREATE TABLE cotisations (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  compte_id   INT NOT NULL DEFAULT 0,
  libelle     VARCHAR(200) NOT NULL,
  montant_du  DECIMAL(12,2) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_compte (compte_id),
  UNIQUE KEY uniq_compte_libelle (compte_id, libelle)
) ENGINE=InnoDB;

CREATE TABLE paiements (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  adherent_id    INT NOT NULL,
  cotisation_id  INT NOT NULL,
  solde_paye     DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  reste          DECIMAL(12,2) NOT NULL,
  statut         ENUM('Impayé','Partiel','Payé') NOT NULL DEFAULT 'Impayé',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_adherent_cotisation (adherent_id, cotisation_id),
  FOREIGN KEY (adherent_id)   REFERENCES adherents(id)   ON DELETE CASCADE,
  FOREIGN KEY (cotisation_id) REFERENCES cotisations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE transactions (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  paiement_id    INT NOT NULL,
  numero_recu    VARCHAR(50) NOT NULL UNIQUE,
  montant_paye   DECIMAL(12,2) NOT NULL,
  mode_paiement  ENUM('Espèces','Mobile Money','Virement','Chèque','Autre') NOT NULL DEFAULT 'Espèces',
  date_paiement  DATE NOT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (paiement_id) REFERENCES paiements(id) ON DELETE CASCADE
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- TRIGGERS — Validation et calcul automatique des paiements
-- ============================================================

DELIMITER $

-- Validation AVANT insertion d'une transaction
CREATE TRIGGER trg_before_transaction_insert
BEFORE INSERT ON transactions
FOR EACH ROW
BEGIN
  DECLARE v_montant_du   DECIMAL(12,2);
  DECLARE v_solde_paye   DECIMAL(12,2);
  DECLARE v_reste        DECIMAL(12,2);

  SELECT c.montant_du INTO v_montant_du
  FROM paiements p
  JOIN cotisations c ON c.id = p.cotisation_id
  WHERE p.id = NEW.paiement_id;

  SELECT solde_paye INTO v_solde_paye
  FROM paiements WHERE id = NEW.paiement_id;

  SET v_reste = v_montant_du - v_solde_paye;

  IF NEW.montant_paye <= 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Le montant payé doit être supérieur à zéro.';
  END IF;

  IF NEW.montant_paye > v_reste THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Le montant payé dépasse le reste à payer.';
  END IF;
END $

-- Recalcul APRÈS insertion d'une transaction
CREATE TRIGGER trg_after_transaction_insert
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
  DECLARE v_total_paye  DECIMAL(12,2);
  DECLARE v_montant_du  DECIMAL(12,2);
  DECLARE v_reste       DECIMAL(12,2);
  DECLARE v_statut      ENUM('Impayé','Partiel','Payé');

  SELECT SUM(t.montant_paye) INTO v_total_paye
  FROM transactions t WHERE t.paiement_id = NEW.paiement_id;

  SELECT c.montant_du INTO v_montant_du
  FROM paiements p
  JOIN cotisations c ON c.id = p.cotisation_id
  WHERE p.id = NEW.paiement_id;

  SET v_reste = GREATEST(v_montant_du - v_total_paye, 0);

  IF v_total_paye <= 0 THEN
    SET v_statut = 'Impayé';
  ELSEIF v_reste <= 0 THEN
    SET v_statut = 'Payé';
  ELSE
    SET v_statut = 'Partiel';
  END IF;

  UPDATE paiements
  SET solde_paye = v_total_paye,
      reste      = v_reste,
      statut     = v_statut
  WHERE id = NEW.paiement_id;
END $

-- ============================================================
-- PROCÉDURES STOCKÉES
-- ============================================================

CREATE PROCEDURE enregistrer_paiement(
  IN p_adherent_id    INT,
  IN p_cotisation_id  INT,
  IN p_montant_paye   DECIMAL(12,2),
  IN p_mode_paiement  ENUM('Espèces','Mobile Money','Virement','Chèque','Autre'),
  IN p_numero_recu    VARCHAR(50),
  IN p_date_paiement  DATE
)
BEGIN
  DECLARE v_paiement_id  INT;
  DECLARE v_montant_du   DECIMAL(12,2);

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT montant_du INTO v_montant_du
  FROM cotisations WHERE id = p_cotisation_id;

  -- Créer le paiement si premier versement, sinon récupérer l'existant
  INSERT INTO paiements (adherent_id, cotisation_id, solde_paye, reste, statut)
  VALUES (p_adherent_id, p_cotisation_id, 0, v_montant_du, 'Impayé')
  ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);

  SET v_paiement_id = LAST_INSERT_ID();

  IF p_numero_recu IS NULL OR p_numero_recu = '' THEN
    SET p_numero_recu = CONCAT('REC-', DATE_FORMAT(NOW(), '%Y%m%d'), '-',
                               LPAD(FLOOR(RAND() * 10000), 4, '0'));
  END IF;

  IF p_date_paiement IS NULL THEN
    SET p_date_paiement = CURDATE();
  END IF;

  -- Les triggers calculent solde_paye, reste et statut automatiquement
  INSERT INTO transactions (paiement_id, numero_recu, montant_paye, mode_paiement, date_paiement)
  VALUES (v_paiement_id, p_numero_recu, p_montant_paye, p_mode_paiement, p_date_paiement);

  COMMIT;
END $

-- Consulter l'état de paiement d'un adhérent pour une période
CREATE PROCEDURE solde_adherent(
  IN p_adherent_id   INT,
  IN p_cotisation_id INT
)
BEGIN
  SELECT
    a.matricule, a.nom, a.prenom,
    c.libelle    AS periode,
    c.montant_du,
    p.solde_paye,
    p.reste,
    p.statut,
    COUNT(t.id)  AS nb_transactions
  FROM adherents a
  JOIN paiements p ON p.adherent_id = a.id
  JOIN cotisations c ON c.id = p.cotisation_id
  LEFT JOIN transactions t ON t.paiement_id = p.id
  WHERE a.id = p_adherent_id AND c.id = p_cotisation_id
  GROUP BY a.id, c.id, p.id;
END $

DELIMITER ;

-- ============================================================
-- VUES
-- ============================================================

CREATE OR REPLACE VIEW v_etat_paiements AS
SELECT
  a.id          AS adherent_id,
  a.matricule,
  a.nom,
  a.prenom,
  a.telephone,
  a.email,
  c.id          AS cotisation_id,
  c.libelle     AS periode,
  c.montant_du,
  COALESCE(p.solde_paye, 0)           AS solde_paye,
  COALESCE(p.reste,      c.montant_du) AS reste,
  COALESCE(p.statut,     'Impayé')    AS statut
FROM adherents a
JOIN cotisations c
  ON (a.date_inscription IS NULL OR a.date_inscription <= DATE(c.created_at))
LEFT JOIN paiements p ON p.adherent_id = a.id AND p.cotisation_id = c.id
WHERE a.est_supprime = 0;

CREATE OR REPLACE VIEW v_historique_transactions AS
SELECT
  t.id          AS transaction_id,
  t.numero_recu,
  t.montant_paye,
  t.mode_paiement,
  t.date_paiement,
  p.solde_paye,
  p.reste,
  p.statut,
  a.matricule,
  a.nom,
  a.prenom,
  a.telephone,
  a.email,
  c.libelle     AS periode,
  c.montant_du
FROM transactions t
JOIN paiements p ON p.id = t.paiement_id
JOIN adherents a ON a.id = p.adherent_id
JOIN cotisations c ON c.id = p.cotisation_id
ORDER BY t.date_paiement ASC, t.id ASC;

CREATE OR REPLACE VIEW v_resume_par_periode AS
SELECT
  c.id       AS cotisation_id,
  c.libelle,
  c.montant_du,
  COUNT(DISTINCT a.id)                                           AS nb_adherents_total,
  COUNT(DISTINCT p.adherent_id)                                  AS nb_ayant_paye,
  COALESCE(SUM(p.solde_paye), 0)                                 AS total_encaisse,
  SUM(CASE WHEN p.statut = 'Payé'    THEN 1 ELSE 0 END)         AS nb_payes,
  SUM(CASE WHEN p.statut = 'Partiel' THEN 1 ELSE 0 END)         AS nb_partielsn,
  SUM(CASE WHEN p.statut = 'Impayé' OR p.id IS NULL THEN 1 ELSE 0 END) AS nb_impayes
FROM cotisations c
JOIN adherents a
  ON a.est_supprime = 0
  AND (a.date_inscription IS NULL OR a.date_inscription <= DATE(c.created_at))
LEFT JOIN paiements p ON p.adherent_id = a.id AND p.cotisation_id = c.id
GROUP BY c.id, c.libelle, c.montant_du;

CREATE OR REPLACE VIEW v_adherents_non_soldes AS
SELECT
  a.id         AS adherent_id,
  a.matricule,
  a.nom,
  a.prenom,
  a.telephone,
  c.libelle    AS periode,
  c.montant_du,
  COALESCE(p.solde_paye, 0)           AS solde_paye,
  COALESCE(p.reste,      c.montant_du) AS reste,
  COALESCE(p.statut,     'Impayé')    AS statut
FROM adherents a
JOIN (SELECT * FROM cotisations ORDER BY id DESC LIMIT 1) c
  ON (a.date_inscription IS NULL OR a.date_inscription <= DATE(c.created_at))
LEFT JOIN paiements p ON p.adherent_id = a.id AND p.cotisation_id = c.id
WHERE a.est_supprime = 0
  AND (p.id IS NULL OR p.statut IN ('Impayé', 'Partiel'));

-- ============================================================
-- FIN DU FICHIER
-- Importez ce fichier dans MySQL puis démarrez le backend :
--   cd backend && npm install && node server.js
-- ============================================================
