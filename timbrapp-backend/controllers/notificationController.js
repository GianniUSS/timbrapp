// controllers/notificationController.js
const { sendUserNotification } = require('../services/notificationsService');
const Subscription = require('../models/Subscription');

/**
 * Endpoint per creare e inviare una notifica push.
 * POST /notifications
 * Body JSON: { userId, title, body, data? }
 */
async function createNotification(req, res) {
  try {
    const { userId, title, body, data } = req.body;
    
    console.log('[Notification] Creazione notifica per utente:', userId);
    
    // Verifica che l'utente abbia sottoscrizioni
    const subscriptions = await Subscription.findAll({ where: { userId } });
    if (!subscriptions.length) {
      return res.status(400).json({ 
        success: false, 
        error: 'Utente non ha sottoscrizioni attive' 
      });
    }

    // Invia la notifica
    const result = await sendUserNotification(userId, { title, body, data });
    console.log('[Notification] Risultato invio:', result);

    if (!result.success) {
      throw new Error(result.error || 'Errore invio notifica');
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('[Notification] Errore:', err);
    return res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
}

/**
 * Salva una nuova sottoscrizione push
 * POST /webpush/subscribe
 * Body: { subscription }
 */
async function saveSubscription(req, res) {
  try {
    console.log('[Subscription] Nuova richiesta di subscription');
    const { subscription } = req.body;
    
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ 
        success: false, 
        error: 'Subscription non valida' 
      });
    }

    // Verifica se esiste già
    const existing = await Subscription.findOne({
      where: { 
        endpoint: subscription.endpoint,
        userId: req.user.id
      }
    });

    if (existing) {
      console.log('[Subscription] Aggiorno subscription esistente');
      existing.p256dh = subscription.keys.p256dh;
      existing.auth = subscription.keys.auth;
      await existing.save();
    } else {
      console.log('[Subscription] Creo nuova subscription');
      await Subscription.create({
        userId: req.user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('[Subscription] Errore:', err);
    return res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
}

module.exports = { 
  createNotification,
  saveSubscription
};
