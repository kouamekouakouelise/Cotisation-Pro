const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Ajouter paiement
router.post('/', (req, res) => {
  const { cotisation_id, montant } = req.body;

  if (!cotisation_id || !montant) {
    return res.status(400).json({ error: "Cotisation et montant obligatoires" });
  }

  db.query(
    "INSERT INTO paiements (cotisation_id, montant_paye) VALUES (?, ?)",
    [cotisation_id, montant],
    (err, result) => {
      if (err) {
        console.error("Erreur insertion paiement:", err);
        return res.status(500).json({ error: err.message || String(err) });
      }
      res.json({ message: "Paiement enregistré ✅", id: result.insertId });
    }
  );
});

// Lister tous les paiements
router.get('/', (req, res) => {
  db.query("SELECT * FROM paiements ORDER BY date_paiement DESC", (err, result) => {
    if (err) {
      console.error("Erreur lecture paiements:", err);
      return res.status(500).json({ error: err.message || String(err) });
    }
    res.json(result);
  });
});

// Voir solde
router.get('/solde/:id', (req, res) => {
  const id = req.params.id;

  const sql = `
    SELECT 
      c.montant_total,
      IFNULL(SUM(p.montant_paye),0) AS total_paye,
      (c.montant_total - IFNULL(SUM(p.montant_paye),0)) AS solde
    FROM cotisations c
    LEFT JOIN paiements p ON p.cotisation_id = c.id
    WHERE c.id = ?
    GROUP BY c.id
  `;

  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
});

module.exports = router;