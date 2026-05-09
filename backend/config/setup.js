const mysql = require('mysql2');
require('dotenv').config();

const dbName = process.env.DB_NAME || 'cotisation_pro';
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'KouameKouakouElise'
});

const isDirectExecution = require.main === module;

db.connect((err) => {
  if (err) {
    console.log("Erreur MySQL ❌", err);
    if (isDirectExecution) process.exit(1);
    return;
  }
  console.log("Connecté à MySQL ✅");
  db.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`, (dbErr) => {
    if (dbErr) {
      console.log("Erreur création base de données:", dbErr);
      if (isDirectExecution) process.exit(1);
      return;
    }

    db.changeUser({ database: dbName }, (changeErr) => {
      if (changeErr) {
        console.log("Erreur sélection base de données:", changeErr);
        if (isDirectExecution) process.exit(1);
        return;
      }
      initializeTables();
    });
  });
});

function initializeTables() {
  // Créer table matricules
  const createMatriculesTable = `
    CREATE TABLE IF NOT EXISTS matricules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      annee INT NOT NULL,
      numero INT NOT NULL,
      matricule VARCHAR(50) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY annee_numero_unique (annee, numero)
    )
  `;

  // Créer table adherents
  const createAdherentsTable = `
    CREATE TABLE IF NOT EXISTS adherents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      matricule VARCHAR(50) UNIQUE NOT NULL,
      nom VARCHAR(100) NOT NULL,
      prenom VARCHAR(100) NOT NULL,
      telephone VARCHAR(20),
      email VARCHAR(100),
      date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Créer table periodes
  const createPeriodesTable = `
    CREATE TABLE IF NOT EXISTS periodes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      libelle VARCHAR(100) NOT NULL,
      date_debut DATE NOT NULL,
      date_fin DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Créer table cotisations
  const createCotisationsTable = `
    CREATE TABLE IF NOT EXISTS cotisations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      adherent_id INT NOT NULL,
      periode_id INT NOT NULL,
      montant_total DECIMAL(10, 2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (adherent_id) REFERENCES adherents(id),
      FOREIGN KEY (periode_id) REFERENCES periodes(id)
    )
  `;

  // Créer table paiements
  const createPaiementsTable = `
    CREATE TABLE IF NOT EXISTS paiements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cotisation_id INT NOT NULL,
      montant_paye DECIMAL(10, 2) NOT NULL,
      date_paiement DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cotisation_id) REFERENCES cotisations(id)
    )
  `;

  db.query(createMatriculesTable, (err) => {
    if (err) {
      console.log("Erreur création table matricules:", err);
    } else {
      console.log("✅ Table matricules prête");
    }
  });

  db.query(createAdherentsTable, (err) => {
    if (err) {
      console.log("Erreur création table adherents:", err);
    } else {
      console.log("✅ Table adherents prête");
    }
  });

  db.query(createPeriodesTable, (err) => {
    if (err) {
      console.log("Erreur création table periodes:", err);
    } else {
      console.log("✅ Table periodes prête");
    }
  });

  db.query(createCotisationsTable, (err) => {
    if (err) {
      console.log("Erreur création table cotisations:", err);
    } else {
      console.log("✅ Table cotisations prête");
    }
  });

  db.query(createPaiementsTable, (err) => {
    if (err) {
      console.log("Erreur création table paiements:", err);
    } else {
      console.log("✅ Table paiements prête");
    }

    console.log("\n🎉 Initialisation terminée !");
    
    if (isDirectExecution) {
      db.end();
      process.exit(0);
    }
  });
}
