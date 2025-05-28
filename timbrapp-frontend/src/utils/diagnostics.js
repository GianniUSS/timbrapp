export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function getNetworkInfo() {
  if (!navigator.connection) {
    return {
      online: navigator.onLine,
      type: 'unknown',
      effectiveType: 'unknown'
    };
  }
  
  return {
    online: navigator.onLine,
    type: navigator.connection.type || 'unknown',
    effectiveType: navigator.connection.effectiveType || 'unknown',
    downlink: navigator.connection.downlink || 0,
    rtt: navigator.connection.rtt || 0,
    saveData: navigator.connection.saveData || false
  };
}

export function formatNetworkType(type) {
  const types = {
    'slow-2g': '2G (lento)',
    '2g': '2G',
    '3g': '3G',
    '4g': '4G',
    'wifi': 'Wi-Fi',
    'ethernet': 'Ethernet',
    'cellular': 'Rete mobile',
    'bluetooth': 'Bluetooth',
    'wimax': 'WiMAX',
    'unknown': 'Sconosciuta'
  };
  
  return types[type] || type;
}

export function getDiagnosticInfo() {
  const storage = getStorageUsage();
  const network = getNetworkInfo();
  
  return {
    browser: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages,
      platform: navigator.platform,
      vendor: navigator.vendor,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack
    },
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      colorDepth: window.screen.colorDepth,
      pixelDepth: window.screen.pixelDepth
    },
    storage,
    network,
    serviceWorker: {
      supported: 'serviceWorker' in navigator,
      controller: navigator.serviceWorker && navigator.serviceWorker.controller ? true : false
    }
  };
}

export function getStorageUsage() {
  return {
    localStorage: getLocalStorageSize(),
    sessionStorage: getSessionStorageSize(),
    cookiesSize: document.cookie.length,
    indexedDBSupported: 'indexedDB' in window
  };
}

function getLocalStorageSize() {
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      total += (key.length + value.length) * 2; // UTF-16 consumes 2 bytes per character
    }
    return total;
  } catch (e) {
    return 0;
  }
}

function getSessionStorageSize() {
  try {
    let total = 0;
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      const value = sessionStorage.getItem(key);
      total += (key.length + value.length) * 2;
    }
    return total;
  } catch (e) {
    return 0;
  }
}
