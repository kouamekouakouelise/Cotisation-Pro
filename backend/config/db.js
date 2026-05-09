const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'KouameKouakouElise',
  database: process.env.DB_NAME || 'cotisation_pro'
});

db.connect((err) => {
  if (err) {
    console.log("Erreur MySQL ❌", err);
  } else {
    console.log("Connecté à MySQL ✅");
  }
});

module.exports = db;