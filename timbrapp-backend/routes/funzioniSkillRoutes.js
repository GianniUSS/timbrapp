const express = require('express');
const router = express.Router();
const models = require('../models');
const { Funzione, Skill, FunzioneSkill } = models;

// GET tutte le funzioni
router.get('/funzioni', async (req, res) => {
  try {
    console.log('Ricevuta richiesta per elenco funzioni');
    // Rimuoviamo l'include per ora, per evitare errori di associazione
    const funzioni = await Funzione.findAll();
    console.log(`Restituite ${funzioni.length} funzioni`);
    res.json(funzioni);
  } catch (err) {
    console.error('Errore nel recupero delle funzioni:', err);
    res.status(500).json({ message: 'Errore nel recupero delle funzioni', error: err.message });
  }
});

// GET tutte le skill
router.get('/skill', async (req, res) => {
  try {
    const skills = await Skill.findAll();
    res.json(skills);
  } catch (err) {
    console.error('Errore nel recupero delle skill:', err);
    res.status(500).json({ message: 'Errore nel recupero delle skill', error: err.message });
  }
});

// POST nuova funzione
router.post('/funzioni', async (req, res) => {
  const { nome, descrizione, skillIds } = req.body;
  const funzione = await Funzione.create({ nome, descrizione });
  if (Array.isArray(skillIds) && skillIds.length > 0) {
    for (const skillId of skillIds) {
      await FunzioneSkill.create({ funzioneId: funzione.id, skillId });
    }
  }
  res.status(201).json(funzione);
});

// POST nuova skill
router.post('/skill', async (req, res) => {
  const { nome } = req.body;
  const skill = await Skill.create({ nome });
  res.status(201).json(skill);
});

module.exports = router;
