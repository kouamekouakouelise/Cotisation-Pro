const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Créer cotisation
router.post('/', (req, res) => {
  const { adherent_id, periode_id, montant } = req.body;

  if (!adherent_id || !periode_id || !montant) {
    return res.status(400).json({ error: "Adhérent, période et montant obligatoires" });
  }

  db.query(
    "INSERT INTO cotisations (adherent_id, periode_id, montant_total) VALUES (?, ?, ?)",
    [adherent_id, periode_id, montant],
    (err, result) => {
      if (err) {
        console.error("Erreur insertion cotisation:", err);
        return res.status(500).json({ error: err.message || String(err) });
      }
      res.json({ message: "Cotisation créée ✅", id: result.insertId });
    }
  );
});

// Lister
router.get('/', (req, res) => {
  db.query("SELECT * FROM cotisations ORDER BY id DESC", (err, result) => {
    if (err) {
      console.error("Erreur lecture cotisations:", err);
      return res.status(500).json({ error: err.message || String(err) });
    }
    res.json(result);
  });
});

module.exports = router;