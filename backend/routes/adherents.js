const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 🔥 Génération matricule PRO
function genererMatricule(callback) {
  const annee = new Date().getFullYear();

  db.query(
    "SELECT COUNT(*) AS total FROM adherents WHERE YEAR(date_inscription)=?",
    [annee],
    (err, result) => {
      if (err) return callback(err);

      const numero = result[0].total + 1;
      const matricule = `ADH-${annee}-${String(numero).padStart(3, '0')}`;

      callback(null, matricule);
    }
  );
}

function formatMysqlDate(value) {
  if (!value) {
    const now = new Date();
    return now.toISOString().slice(0, 19).replace('T', ' ');
  }
  
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    const now = new Date();
    return now.toISOString().slice(0, 19).replace('T', ' ');
  }
  
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

// ➕ AJOUTER ADHÉRENT
router.post('/', (req, res) => {
  const { nom, prenom, telephone, email, date_inscription } = req.body;

  if (!nom || !prenom) {
    return res.status(400).json({ error: "Nom et prénom obligatoires" });
  }

  genererMatricule((err, matricule) => {
    if (err) {
      console.error("Erreur génération matricule:", err);
      return res.status(500).json({ error: err.message || "Erreur génération matricule" });
    }

    const sql = `
      INSERT INTO adherents (matricule, nom, prenom, telephone, email, date_inscription)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const dateValue = formatMysqlDate(date_inscription);

    db.query(sql, [matricule, nom, prenom, telephone || null, email || null, dateValue], (err, result) => {
      if (err) {
        console.error("Erreur insertion adhérent:", err);
        return res.status(500).json({ error: err.message || String(err) });
      }

      res.json({
        message: "Adhérent ajouté avec succès ✅",
        matricule: matricule,
        id: result.insertId
      });
    });
  });
});

// 📋 LISTER ADHÉRENTS
router.get('/', (req, res) => {
  db.query("SELECT * FROM adherents ORDER BY id DESC", (err, result) => {
    if (err) {
      console.error("Erreur lecture adhérents:", err);
      return res.status(500).json({ error: err.message || String(err) });
    }
    res.json(result);
  });
});

// 🔍 UN ADHÉRENT
router.get('/:id', (req, res) => {
  db.query("SELECT * FROM adherents WHERE id=?", [req.params.id], (err, result) => {
    if (err) {
      console.error("Erreur lecture adhérent:", err);
      return res.status(500).json({ error: err.message || String(err) });
    }
    res.json(result[0] || null);
  });
});

// ✏️ MODIFIER
router.put('/:id', (req, res) => {
  const { nom, prenom, telephone, email } = req.body;

  if (!nom || !prenom) {
    return res.status(400).json({ error: "Nom et prénom obligatoires" });
  }

  db.query(
    `UPDATE adherents 
     SET nom=?, prenom=?, telephone=?, email=? 
     WHERE id=?`,
    [nom, prenom, telephone || null, email || null, req.params.id],
    (err) => {
      if (err) {
        console.error("Erreur modification adhérent:", err);
        return res.status(500).json({ error: err.message || String(err) });
      }
      res.json({ message: "Adhérent modifié ✅" });
    }
  );
});

// ❌ SUPPRIMER
router.delete('/:id', (req, res) => {
  db.query("DELETE FROM adherents WHERE id=?", [req.params.id], (err) => {
    if (err) {
      console.error("Erreur suppression adhérent:", err);
      return res.status(500).json({ error: err.message || String(err) });
    }
    res.json({ message: "Adhérent supprimé ✅" });
  });
});

module.exports = router;