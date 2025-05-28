const sequelize = require('../sequelize');
const models = require('../models');
const { User, DocumentoUser, TipologiaDocumento } = models;

// Ottieni tutti i documenti
exports.getAllDocumenti = async (req, res) => {
  try {
    const documenti = await DocumentoUser.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'nome', 'email'] },
        { model: TipologiaDocumento, as: 'tipologia' }
      ]
    });
    return res.status(200).json(documenti);
  } catch (error) {
    console.error('Errore nel recupero dei documenti:', error);
    return res.status(500).json({ message: 'Errore nel recupero dei documenti', error: error.message });
  }
};

// Ottieni documenti di un utente
exports.getDocumentiByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const documenti = await DocumentoUser.findAll({
      where: { userId },
      include: [
        { model: TipologiaDocumento, as: 'tipologia' }
      ]
    });
    return res.status(200).json(documenti);
  } catch (error) {
    console.error('Errore nel recupero dei documenti dell\'utente:', error);
    return res.status(500).json({ message: 'Errore nel recupero dei documenti dell\'utente', error: error.message });
  }
};

// Ottieni un documento specifico
exports.getDocumento = async (req, res) => {
  try {
    const documentoId = req.params.id;
    const documento = await DocumentoUser.findByPk(documentoId, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'nome', 'email'] },
        { model: TipologiaDocumento, as: 'tipologia' }
      ]
    });
    
    if (!documento) {
      return res.status(404).json({ message: 'Documento non trovato' });
    }
    
    return res.status(200).json(documento);
  } catch (error) {
    console.error('Errore nel recupero del documento:', error);
    return res.status(500).json({ message: 'Errore nel recupero del documento', error: error.message });
  }
};

// Crea un nuovo documento
exports.createDocumento = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { userId, tipologiaId, nome, url } = req.body;
    
    // Verifica che l'utente esista
    const user = await User.findByPk(userId);
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Utente non trovato' });
    }
    
    // Verifica che la tipologia esista
    const tipologia = await TipologiaDocumento.findByPk(tipologiaId);
    if (!tipologia) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Tipologia documento non trovata' });
    }
    
    const nuovoDocumento = await DocumentoUser.create({
      userId,
      tipologiaId,
      nome,
      url,
      stato_lettura: 'non letto'
    }, { transaction });
    
    await transaction.commit();
    
    // Recupera il documento completo con le relazioni
    const documentoCreato = await DocumentoUser.findByPk(nuovoDocumento.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'nome', 'email'] },
        { model: TipologiaDocumento, as: 'tipologia' }
      ]
    });
    
    return res.status(201).json(documentoCreato);
  } catch (error) {
    await transaction.rollback();
    console.error('Errore nella creazione del documento:', error);
    return res.status(500).json({ message: 'Errore nella creazione del documento', error: error.message });
  }
};

// Aggiorna stato lettura di un documento
exports.updateStatoLettura = async (req, res) => {
  try {
    const documentoId = req.params.id;
    const { stato_lettura } = req.body;
    
    if (!['letto', 'non letto'].includes(stato_lettura)) {
      return res.status(400).json({ message: 'Stato lettura non valido. Valori accettati: letto, non letto' });
    }
    
    const documento = await DocumentoUser.findByPk(documentoId);
    if (!documento) {
      return res.status(404).json({ message: 'Documento non trovato' });
    }
    
    documento.stato_lettura = stato_lettura;
    await documento.save();
    
    return res.status(200).json(documento);
  } catch (error) {
    console.error('Errore nell\'aggiornamento dello stato di lettura:', error);
    return res.status(500).json({ message: 'Errore nell\'aggiornamento dello stato di lettura', error: error.message });
  }
};

// Elimina un documento
exports.deleteDocumento = async (req, res) => {
  try {
    const documentoId = req.params.id;
    const documento = await DocumentoUser.findByPk(documentoId);
    
    if (!documento) {
      return res.status(404).json({ message: 'Documento non trovato' });
    }
    
    await documento.destroy();
    return res.status(200).json({ message: 'Documento eliminato con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione del documento:', error);
    return res.status(500).json({ message: 'Errore nell\'eliminazione del documento', error: error.message });
  }
};
