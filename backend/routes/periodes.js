const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Ajouter période
router.post('/', (req, res) => {
  const { libelle, debut, fin } = req.body;

  if (!libelle || !debut || !fin) {
    return res.status(400).json({ error: "Libellé, début et fin obligatoires" });
  }

  db.query(
    "INSERT INTO periodes (libelle, date_debut, date_fin) VALUES (?, ?, ?)",
    [libelle, debut, fin],
    (err, result) => {
      if (err) {
        console.error("Erreur insertion période:", err);
        return res.status(500).json({ error: err.message || String(err) });
      }
      res.json({ message: "Période ajoutée ✅", id: result.insertId });
    }
  );
});

// Lister
router.get('/', (req, res) => {
  db.query("SELECT * FROM periodes ORDER BY date_debut DESC", (err, result) => {
    if (err) {
      console.error("Erreur lecture périodes:", err);
      return res.status(500).json({ error: err.message || String(err) });
    }
    res.json(result);
  });
});

module.exports = router;