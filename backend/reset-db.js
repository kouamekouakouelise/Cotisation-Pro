// Script de réinitialisation complète de la base de données
// Usage : node backend/reset-db.js
// Sur Railway : railway run node backend/reset-db.js

require("dotenv").config({ path: __dirname + "/.env" });
const mysql = require("mysql2/promise");

const RAILWAY_URL = process.env.MYSQL_URL || process.env.DATABASE_URL;

async function getPool() {
  if (RAILWAY_URL) {
    return mysql.createPool(RAILWAY_URL);
  }
  return mysql.createPool({
    host:     process.env.DB_HOST     || process.env.MYSQLHOST     || "localhost",
    port:     process.env.DB_PORT     || process.env.MYSQLPORT     || 3306,
    user:     process.env.DB_USER     || process.env.MYSQLUSER     || "root",
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || "",
    database: process.env.DB_NAME     || process.env.MYSQLDATABASE || "cotisation_pro",
  });
}

const TABLES = [
  "audit_logs",
  "message_likes",
  "messages",
  "paiements",
  "cotisations",
  "depenses",
  "budgets",
  "transactions",
  "adherents",
  "matricule_counter",
  "comptes",
];

(async () => {
  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");
    for (const table of TABLES) {
      try {
        await conn.query(`TRUNCATE TABLE \`${table}\``);
        console.log(`✓ ${table} vidée`);
      } catch (e) {
        console.warn(`⚠  ${table} : ${e.message}`);
      }
    }
    await conn.query("SET FOREIGN_KEY_CHECKS = 1");
    console.log("\n✅ Base de données réinitialisée avec succès.");
  } finally {
    conn.release();
    await pool.end();
  }
})();
