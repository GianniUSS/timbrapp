// notifications.js - Backend per notifiche Web Push
const webpush = require('web-push');
const Subscription = require('./models/Subscription');

// Generiamo le VAPID keys (da eseguire una sola volta e salvare)
// Decommentare queste righe la prima volta, eseguire, copiare le chiavi e poi ricommentare
// const vapidKeys = webpush.generateVAPIDKeys();
// console.log('VAPID Keys:', vapidKeys);

// Configura le chiavi VAPID
const vapidKeys = {
  publicKey: 'BLFhkCgSxudtn4WP0OsNgqtLk739gkqXpMLnDeEIvsENHDseXy-FpmoHyguowRHRaDygRh5W5B3pr3etel3FVsc',
  privateKey: 'wGopgZKVnUWSrS4WcaOsFFxhApVHz3F9TyEQ09_3AYQ'
};

// Configura web-push
webpush.setVapidDetails(
  'mailto:tua@email.com', // Cambia con la tua email
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Salva una nuova sottoscrizione
const saveSubscription = async (userId, subscription) => {
  console.log('[WEBPUSH] saveSubscription chiamata con userId:', userId);
  console.log('[WEBPUSH] subscription ricevuta:', JSON.stringify(subscription));
  try {
    // Cerca se esiste già una sottoscrizione per questo endpoint
    const existingSubscription = await Subscription.findOne({
      where: {
        endpoint: subscription.endpoint
      }
    });

    if (existingSubscription) {
      console.log('[WEBPUSH] Subscription già esistente, aggiorno dati. ID:', existingSubscription.id);
      // Aggiorna la sottoscrizione esistente
      existingSubscription.userId = userId;
      existingSubscription.p256dh = subscription.keys.p256dh;
      existingSubscription.auth = subscription.keys.auth;
      await existingSubscription.save();
      return existingSubscription;
    } else {
      console.log('[WEBPUSH] Nuova subscription, creo record.');
      // Crea una nuova sottoscrizione
      const newSub = await Subscription.create({
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      });
      console.log('[WEBPUSH] Subscription creata con ID:', newSub.id);
      return newSub;
    }
  } catch (error) {
    console.error('[WEBPUSH] Errore salvataggio sottoscrizione:', error);
    throw error;
  }
};

// Invia una notifica a un utente specifico
const sendNotification = async (userId, payload) => {
  try {
    // Trova tutte le sottoscrizioni per questo utente
    const subscriptions = await Subscription.findAll({
      where: { userId }
    });

    if (subscriptions.length === 0) {
      return { success: false, error: 'Nessuna sottoscrizione trovata per questo utente' };
    }

    const results = [];

    // Invia la notifica a tutte le sottoscrizioni dell'utente
    for (const sub of subscriptions) {
      try {
        // Converte il record del database nel formato richiesto da web-push
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };

        // Invia la notifica
        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(payload)
        );

        results.push({ 
          success: true, 
          subscriptionId: sub.id 
        });
      } catch (error) {
        console.error('Errore invio notifica:', error);
        
        // Se la sottoscrizione non è più valida (410), rimuovila
        if (error.statusCode === 410) {
          await sub.destroy();
        }
        
        results.push({ 
          success: false, 
          subscriptionId: sub.id, 
          error: error.message 
        });
      }
    }

    return {
      success: true,
      results
    };
  } catch (error) {
    console.error('Errore generale invio notifica:', error);
    return { success: false, error: error.message };
  }
};

// Ottieni la chiave pubblica VAPID
const getVapidPublicKey = () => {
  return vapidKeys.publicKey;
};

// Invia una notifica a un utente per una timbratura
const sendTimbratureNotification = async (userId, type) => {
  const title = type === 'start' ? 'Entrata registrata' : 'Uscita registrata';
  const message = type === 'start' 
    ? 'Hai registrato correttamente l\'entrata.' 
    : 'Hai registrato correttamente l\'uscita.';
  
  return await sendNotification(userId, {
    title,
    body: message,
    icon: '/icon-192x192.png',
    data: {
      url: '/',
      type: 'timbratura'
    }
  });
};

// Invia una notifica per una richiesta di permesso/ferie
const sendRequestNotification = async (userId, requestType, requestStatus) => {
  let title, message;
  
  if (requestStatus === 'approved') {
    title = 'Richiesta approvata';
    message = `La tua richiesta di ${requestType} è stata approvata.`;
  } else if (requestStatus === 'rejected') {
    title = 'Richiesta rifiutata';
    message = `La tua richiesta di ${requestType} è stata rifiutata.`;
  } else {
    title = 'Richiesta inviata';
    message = `La tua richiesta di ${requestType} è stata inviata.`;
  }
  
  return await sendNotification(userId, {
    title,
    body: message,
    icon: '/icon-192x192.png',
    data: {
      url: '/requests',
      type: 'richiesta'
    }
  });
};

module.exports = {
  saveSubscription,
  sendNotification,
  sendTimbratureNotification,
  sendRequestNotification,
  getVapidPublicKey
};
