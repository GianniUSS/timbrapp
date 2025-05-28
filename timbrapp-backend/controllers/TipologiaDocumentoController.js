const sequelize = require('../sequelize');
const models = require('../models');
const { TipologiaDocumento } = models;

// Ottieni tutte le tipologie documento
exports.getAllTipologie = async (req, res) => {
  try {
    const tipologie = await TipologiaDocumento.findAll();
    return res.status(200).json(tipologie);
  } catch (error) {
    console.error('Errore nel recupero delle tipologie documento:', error);
    return res.status(500).json({ message: 'Errore nel recupero delle tipologie documento', error: error.message });
  }
};

// Ottieni una tipologia documento specifica
exports.getTipologia = async (req, res) => {
  try {
    const tipologiaId = req.params.id;
    const tipologia = await TipologiaDocumento.findByPk(tipologiaId);
    
    if (!tipologia) {
      return res.status(404).json({ message: 'Tipologia documento non trovata' });
    }
    
    return res.status(200).json(tipologia);
  } catch (error) {
    console.error('Errore nel recupero della tipologia documento:', error);
    return res.status(500).json({ message: 'Errore nel recupero della tipologia documento', error: error.message });
  }
};

// Crea una nuova tipologia documento
exports.createTipologia = async (req, res) => {
  try {
    const { nome } = req.body;
    
    // Verifica che il nome sia unico
    const tipologiaEsistente = await TipologiaDocumento.findOne({ where: { nome } });
    if (tipologiaEsistente) {
      return res.status(400).json({ message: 'Esiste già una tipologia documento con questo nome' });
    }
    
    const nuovaTipologia = await TipologiaDocumento.create({ nome });
    return res.status(201).json(nuovaTipologia);
  } catch (error) {
    console.error('Errore nella creazione della tipologia documento:', error);
    return res.status(500).json({ message: 'Errore nella creazione della tipologia documento', error: error.message });
  }
};

// Aggiorna una tipologia documento
exports.updateTipologia = async (req, res) => {
  try {
    const tipologiaId = req.params.id;
    const { nome } = req.body;
    
    const tipologia = await TipologiaDocumento.findByPk(tipologiaId);
    if (!tipologia) {
      return res.status(404).json({ message: 'Tipologia documento non trovata' });
    }
    
    // Verifica che il nuovo nome sia unico
    if (nome !== tipologia.nome) {
      const tipologiaEsistente = await TipologiaDocumento.findOne({ where: { nome } });
      if (tipologiaEsistente) {
        return res.status(400).json({ message: 'Esiste già una tipologia documento con questo nome' });
      }
    }
    
    tipologia.nome = nome;
    await tipologia.save();
    
    return res.status(200).json(tipologia);
  } catch (error) {
    console.error('Errore nell\'aggiornamento della tipologia documento:', error);
    return res.status(500).json({ message: 'Errore nell\'aggiornamento della tipologia documento', error: error.message });
  }
};

// Elimina una tipologia documento
exports.deleteTipologia = async (req, res) => {
  try {
    const tipologiaId = req.params.id;
    const tipologia = await TipologiaDocumento.findByPk(tipologiaId);
    
    if (!tipologia) {
      return res.status(404).json({ message: 'Tipologia documento non trovata' });
    }
      // Verifica che non ci siano documenti associati a questa tipologia
    const DocumentoUser = require('../models/DocumentoUser')(sequelize, sequelize.Sequelize.DataTypes);
    const documentiAssociati = await DocumentoUser.count({ where: { tipologiaId: tipologia.id } });
    if (documentiAssociati > 0) {
      return res.status(400).json({ 
        message: 'Impossibile eliminare questa tipologia documento poiché esistono documenti associati',
        count: documentiAssociati
      });
    }
    
    await tipologia.destroy();
    return res.status(200).json({ message: 'Tipologia documento eliminata con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione della tipologia documento:', error);
    return res.status(500).json({ message: 'Errore nell\'eliminazione della tipologia documento', error: error.message });
  }
};
