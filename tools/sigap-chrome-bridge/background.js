// background.js - SIGAP e-Kinerja Bridge Service Worker (Manifest V3)

console.log("[SIGAP Bridge] Background Service Worker Started.");

// Inisialisasi default settings
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['autoFocus', 'autoF2', 'autoSubmit'], (res) => {
    if (res.autoFocus === undefined) chrome.storage.local.set({ autoFocus: true });
    if (res.autoF2 === undefined) chrome.storage.local.set({ autoF2: true });
    if (res.autoSubmit === undefined) chrome.storage.local.set({ autoSubmit: false });
  });
  console.log("[SIGAP Bridge] Settings initialized.");
});

// Listener pesan antar-skrip
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'SEND_TO_EKINERJA') {
    handleSendToEkinerja(message.payload, sendResponse);
    return true; // Asynchronous response
  }

  if (message.action === 'CHECK_CONNECTION') {
    checkActiveTabs(sendResponse);
    return true;
  }
});

// Helper pencari tab e-Kinerja Solo yang tahan banting
async function findEkinerjaTab() {
  // Cara 1: Query langsung dengan match patterns
  try {
    const tabs = await chrome.tabs.query({
      url: [
        "*://103.115.227.196/e-kinerja/*",
        "*://103.115.227.196/*"
      ]
    });
    if (tabs && tabs.length > 0) return tabs[0];
  } catch (e) {
    console.warn("[SIGAP Bridge] Query url error:", e);
  }

  // Cara 2: Fallback query semua tab dan filter URL
  try {
    const allTabs = await chrome.tabs.query({});
    const found = allTabs.find(t => t.url && t.url.includes('103.115.227.196'));
    if (found) return found;
  } catch (e) {
    console.warn("[SIGAP Bridge] Query all tabs error:", e);
  }

  return null;
}

// Fungsi pencarian tab e-Kinerja dan penyaluran data
async function handleSendToEkinerja(payload, sendResponse) {
  try {
    const targetTab = await findEkinerjaTab();

    if (!targetTab) {
      // Simpan sebagai pending payload bila tab belum dibuka
      await chrome.storage.local.set({ pendingPayload: payload });
      sendResponse({
        success: false,
        status: 'TAB_NOT_FOUND',
        message: 'Tab e-Kinerja BKPSDM belum ditemukan. Pastikan tab http://103.115.227.196/e-kinerja/... sudah terbuka di browser.'
      });
      return;
    }

    const settings = await chrome.storage.local.get(['autoFocus', 'autoF2', 'autoSubmit']);

    // Kirim data ke tab e-Kinerja dengan auto-inject fallback
    const deliverResult = await deliverPayloadToTab(targetTab.id, payload, settings);

    if (deliverResult.success) {
      // Bawa tab e-Kinerja ke fokus jika autoFocus aktif
      if (settings.autoFocus !== false && targetTab.id) {
        try {
          await chrome.tabs.update(targetTab.id, { active: true });
          if (targetTab.windowId) {
            await chrome.windows.update(targetTab.windowId, { focused: true });
          }
        } catch (err) {
          // ignore focus error
        }
      }

      sendResponse({
        success: true,
        status: 'SUCCESS',
        tabId: targetTab.id,
        details: deliverResult.details
      });
    } else {
      sendResponse({
        success: false,
        status: 'ERROR',
        message: deliverResult.message || 'Gagal mengisi form di tab e-Kinerja.'
      });
    }
  } catch (error) {
    console.error("[SIGAP Bridge] Handler error:", error);
    sendResponse({
      success: false,
      status: 'CRASH',
      message: error.message
    });
  }
}

// Helper pengirim pesan ke tab dengan injeksi script on-the-fly jika tab belum terpasang content script
async function deliverPayloadToTab(tabId, payload, settings) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, {
      action: 'FILL_FORM',
      payload: payload,
      settings: settings
    }, async (response) => {
      if (chrome.runtime.lastError) {
        console.log("[SIGAP Bridge] Content script belum aktif di tab e-Kinerja, mencoba inject otomatis...");
        try {
          // Suntikkan content-ekinerja.js secara on-the-fly
          await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content-ekinerja.js']
          });

          // Beri jeda 350ms agar script selesai terinisialisasi
          setTimeout(() => {
            chrome.tabs.sendMessage(tabId, {
              action: 'FILL_FORM',
              payload: payload,
              settings: settings
            }, (retryResponse) => {
              if (chrome.runtime.lastError) {
                console.error("[SIGAP Bridge] Retry failed:", chrome.runtime.lastError.message);
                resolve({ success: false, message: chrome.runtime.lastError.message });
              } else {
                resolve({ success: true, details: retryResponse });
              }
            });
          }, 350);
        } catch (injectErr) {
          console.error("[SIGAP Bridge] Injeksi gagal:", injectErr);
          resolve({ success: false, message: 'Gagal menginjeksi ekstensi ke tab e-Kinerja: ' + injectErr.message });
        }
      } else {
        resolve({ success: true, details: response });
      }
    });
  });
}

// Cek ketersediaan tab aktif
async function checkActiveTabs(sendResponse) {
  try {
    const targetTab = await findEkinerjaTab();
    sendResponse({
      ekinerjaOpen: !!targetTab,
      ekinerjaCount: targetTab ? 1 : 0
    });
  } catch (err) {
    sendResponse({ ekinerjaOpen: false, ekinerjaCount: 0 });
  }
}
