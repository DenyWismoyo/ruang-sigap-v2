// content-sigap.js - Berjalan di Tab RUANG SIGAP & POROS
// Bertugas sebagai jembatan komunikasi antara Web App SIGAP dan Background Service Worker

(function() {
  console.log("[SIGAP Bridge] Content script terpasang di SIGAP.");

  // Helper pemeriksa validitas runtime extension (anti 'Extension context invalidated')
  function isExtensionAlive() {
    try {
      return Boolean(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id);
    } catch (e) {
      return false;
    }
  }

  // Beri penanda di DOM agar UI Web App tahu Extension aktif
  function notifyApp() {
    if (!isExtensionAlive()) return;
    try {
      document.documentElement.setAttribute('data-sigap-extension-active', 'true');
      window.postMessage({ type: 'SIGAP_EXTENSION_READY', version: '1.0.0' }, '*');
    } catch (e) {}
  }

  notifyApp();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', notifyApp);
  }

  // Helper pengiriman pesan yang aman dari crash context invalidation
  function safeSendMessage(message, callback) {
    if (!isExtensionAlive()) {
      console.warn("[SIGAP Bridge] Extension context sudah kadaluarsa (reload). Muat ulang tab ini (F5).");
      return;
    }
    try {
      chrome.runtime.sendMessage(message, (res) => {
        if (chrome.runtime.lastError) {
          // Abaikan error background tertutup
          return;
        }
        if (callback) callback(res);
      });
    } catch (err) {
      console.warn("[SIGAP Bridge] sendMessage caught error:", err);
    }
  }

  // Dengarkan pesan dari Web App SIGAP
  window.addEventListener('message', (event) => {
    // Hanya tangkap pesan dari window yang sama
    if (event.source !== window || !event.data) return;

    // 1. Pengiriman data kinerja ke tab e-Kinerja
    if (event.data.type === 'SIGAP_BRIDGE_SEND') {
      const payload = event.data.payload;
      console.log("[SIGAP Bridge] Menerima data dari SIGAP:", payload);

      safeSendMessage({
        action: 'SEND_TO_EKINERJA',
        payload: payload
      }, (response) => {
        console.log("[SIGAP Bridge] Respons dari background:", response);
        window.postMessage({
          type: 'SIGAP_BRIDGE_RESPONSE',
          response: response
        }, '*');
      });
    }

    // 2. Handshake Ping berkala dari modal SIGAP
    if (event.data.type === 'SIGAP_BRIDGE_PING') {
      if (!isExtensionAlive()) return;

      document.documentElement.setAttribute('data-sigap-extension-active', 'true');
      window.postMessage({ type: 'SIGAP_EXTENSION_READY', version: '1.0.0' }, '*');

      safeSendMessage({ action: 'CHECK_CONNECTION' }, (res) => {
        window.postMessage({
          type: 'SIGAP_BRIDGE_STATUS',
          status: res
        }, '*');
      });
    }
  });
})();
