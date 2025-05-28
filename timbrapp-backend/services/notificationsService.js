// services/notificationsService.js
// Servizio per invio notifiche push dal server

const webpush = require('web-push');
const Subscription = require('../models/Subscription');
const Notification = require('../models/Notification');
// Carica le chiavi VAPID dal file vapid.json
const vapidKeys = require('../vapid.json');

webpush.setVapidDetails(
  'mailto:tuo@indirizzo.email',  // sostituisci con la tua mail
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

/**
 * Invia una notifica push a tutte le subscription di un utente
 * @param {number} userId - ID dell'utente
 * @param {object} payload - Contenuto della notifica { title, body, data }
 */
async function sendUserNotification(userId, payload) {
  // 1) Salva nel DB il record di Notification
  // Mappiamo 'message' al titolo o al corpo della notifica
  await Notification.create({
    userId,
    message: payload.title, // puoi usare title o body
    type: payload.data?.type || 'system'
  });

  // 2) Recupera le subscription dal DB
  const subs = await Subscription.findAll({ where: { userId } });

  // 3) Invia il push a ciascuna subscription
  await Promise.all(subs.map(async (sub) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          data: payload.data
        })
      );
    } catch (err) {
      console.error('Errore invio push a', sub.endpoint, err);
    }
  }));
}

module.exports = { sendUserNotification };
