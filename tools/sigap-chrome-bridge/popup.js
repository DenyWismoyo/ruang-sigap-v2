// popup.js - Logika popup ekstensi

document.addEventListener('DOMContentLoaded', async () => {
  const autoFocusEl = document.getElementById('autoFocus');
  const autoF2El = document.getElementById('autoF2');
  const autoSubmitEl = document.getElementById('autoSubmit');
  const tabStatusEl = document.getElementById('tab-status');
  const openEkinerjaBtn = document.getElementById('open-ekinerja');
  const openSigapBtn = document.getElementById('open-sigap');

  // 1. Muat pengaturan
  chrome.storage.local.get(['autoFocus', 'autoF2', 'autoSubmit'], (res) => {
    autoFocusEl.checked = res.autoFocus !== false;
    autoF2El.checked = res.autoF2 !== false;
    autoSubmitEl.checked = res.autoSubmit === true;
  });

  // Simpan perubahan toggle
  autoFocusEl.addEventListener('change', () => chrome.storage.local.set({ autoFocus: autoFocusEl.checked }));
  autoF2El.addEventListener('change', () => chrome.storage.local.set({ autoF2: autoF2El.checked }));
  autoSubmitEl.addEventListener('change', () => chrome.storage.local.set({ autoSubmit: autoSubmitEl.checked }));

  // 2. Cek status tab e-Kinerja
  try {
    const tabs = await chrome.tabs.query({ url: ["*://103.115.227.196/e-kinerja/*"] });
    if (tabs && tabs.length > 0) {
      tabStatusEl.textContent = `Terbuka (${tabs.length})`;
      tabStatusEl.className = 'badge badge-online';
    } else {
      tabStatusEl.textContent = 'Belum Dibuka';
      tabStatusEl.className = 'badge badge-offline';
    }
  } catch (err) {
    tabStatusEl.textContent = 'Tidak Terdeteksi';
    tabStatusEl.className = 'badge badge-offline';
  }

  // 3. Tombol navigasi
  openEkinerjaBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://103.115.227.196/e-kinerja/v4/d_kegiatan_harian' });
  });

  openSigapBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3000/dashboard/sigap/bukti-kinerja' });
  });
});
