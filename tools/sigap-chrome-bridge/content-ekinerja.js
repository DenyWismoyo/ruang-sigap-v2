// content-ekinerja.js - Berjalan di Tab Portal e-Kinerja BKPSDM Surakarta
// Target: http://103.115.227.196/e-kinerja/v4/*
// Fokus Utama: Pengisian Nama Kegiatan Harian + URL Bukti Dukung (Drive) + Catatan

console.log("[SIGAP Bridge] Content script e-Kinerja BKPSDM siap.");

// 1. Dengarkan pesan dari background service worker
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'FILL_FORM') {
    console.log("[SIGAP Bridge] Menerima instruksi pengisian form:", request.payload);
    const result = fillEkinerjaForm(request.payload);
    sendResponse(result);
  }
});

// 2. Cek apakah ada antrean data pending saat halaman baru dimuat
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['pendingPayload'], (res) => {
          if (res?.pendingPayload) {
            console.log("[SIGAP Bridge] Mengisi data pending dari antrean:", res.pendingPayload);
            fillEkinerjaForm(res.pendingPayload);
            chrome.storage.local.remove('pendingPayload');
          }
        });
      }
    } catch (e) {}
  }, 1000);
});

// 3. Fungsi Inti Pengisian Form Kegiatan Harian
function fillEkinerjaForm(data) {
  if (!data) return { success: false, reason: 'Payload kosong' };

  console.log("[SIGAP Bridge] Memulai pengisian form dengan data:", data);

  try {
    let filledFieldsCount = 0;

    // Helper visual highlight hijau
    function highlight(el) {
      if (!el) return;
      try {
        el.style.backgroundColor = '#ecfdf5';
        el.style.borderColor = '#10b981';
        el.style.boxShadow = '0 0 0 2px rgba(16, 185, 129, 0.2)';
        el.style.transition = 'all 0.3s ease';
      } catch (e) {}
    }

    // Helper setting nilai textarea secara mendalam
    function setTextareaValue(el, val, fieldName = '') {
      if (!el || val === undefined || val === null || val === '') return false;
      try {
        el.focus();
        el.value = val;
        el.setAttribute('value', val);
        el.innerHTML = val;
        el.textContent = val;

        // Native descriptor setter
        try {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
          if (setter) setter.call(el, val);
        } catch (e) {}

        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));

        highlight(el);
        filledFieldsCount++;
        console.log(`[SIGAP Bridge] Sukses mengisi textarea [${fieldName}]:`, val);
        return true;
      } catch (err) {
        console.warn(`[SIGAP Bridge] Gagal mengisi textarea [${fieldName}]:`, err);
        return false;
      }
    }

    // Helper setting input biasa (Kuantitas / Jam)
    function setInputValue(el, val, fieldName = '') {
      if (!el || val === undefined || val === null || val === '') return false;
      try {
        el.value = val;
        el.setAttribute('value', val);

        try {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          if (setter) setter.call(el, val);
        } catch (e) {}

        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));

        highlight(el);
        filledFieldsCount++;
        console.log(`[SIGAP Bridge] Sukses mengisi input [${fieldName}]:`, val);
        return true;
      } catch (err) {
        return false;
      }
    }

    // Helper cerdas pencari textarea yang terikat dengan label teksnya
    function getTextareaByLabel(labelKeywords) {
      const allLabels = Array.from(document.querySelectorAll('label, td, th, div, span, b, strong, p'));
      for (const lbl of allLabels) {
        if (lbl.children.length > 2) continue;
        const txt = (lbl.textContent || '').trim().toLowerCase();
        if (labelKeywords.some(kw => txt === kw.toLowerCase() || txt.includes(kw.toLowerCase()))) {
          // 1. Cek sibling langsung
          let next = lbl.nextElementSibling;
          while (next) {
            if (next.tagName === 'TEXTAREA') return next;
            const found = next.querySelector('textarea');
            if (found) return found;
            next = next.nextElementSibling;
          }
          // 2. Cek parent container terdekat (tr, form-group, col, div)
          let p = lbl.parentElement;
          for (let i = 0; i < 3 && p; i++) {
            const taList = Array.from(p.querySelectorAll('textarea'));
            if (taList.length === 1) return taList[0];
            p = p.parentElement;
          }
        }
      }
      return null;
    }

    // Ambil seluruh textarea di halaman sebagai fallback urutan
    const allTextareas = Array.from(document.querySelectorAll('textarea')).filter(t => {
      return t.offsetParent !== null || window.getComputedStyle(t).display !== 'none';
    });

    console.log(`[SIGAP Bridge] Ditemukan ${allTextareas.length} textarea pada halaman.`);

    // ----------------------------------------------------
    // 1. NAMA KEGIATAN HARIAN (Textarea #1)
    // Format: [Nama Aktivitas] Uraian Tugas
    // ----------------------------------------------------
    let namaTa = getTextareaByLabel(['Nama Kegiatan Harian', 'Nama Kegiatan', 'Uraian']) ||
                 document.querySelector('textarea[name*="kegiatan" i], textarea[name*="nama" i], textarea[name*="uraian" i]') ||
                 allTextareas[0];

    let teksNamaKegiatan = (data.namaKegiatan || '').trim();
    const namaAktivitas = (data.aktivitasNama || '').trim();

    if (namaAktivitas) {
      const prefix = `[${namaAktivitas}]`;
      if (!teksNamaKegiatan.toLowerCase().includes(namaAktivitas.toLowerCase())) {
        teksNamaKegiatan = `${prefix} ${teksNamaKegiatan}`;
      }
    }

    if (namaTa && teksNamaKegiatan) {
      setTextareaValue(namaTa, teksNamaKegiatan, 'Nama Kegiatan Harian');
    }

    // ----------------------------------------------------
    // 2. AKTIVITAS (SELECT2 DROPDOWN)
    // ----------------------------------------------------
    const selectEl = document.querySelector('select[name*="aktivitas" i], select[name*="kd_aktivitas" i], select.select2') ||
                     document.querySelector('select');

    if (selectEl && namaAktivitas) {
      const options = Array.from(selectEl.options);
      const targetSearch = namaAktivitas.toLowerCase().trim();

      const matched = options.find(o => {
        const txt = o.text.toLowerCase().trim();
        return txt === targetSearch || txt.includes(targetSearch) || targetSearch.includes(txt);
      });

      if (matched) {
        selectEl.value = matched.value;
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));

        const select2Label = document.querySelector('.select2-chosen, .select2-selection__rendered');
        if (select2Label) select2Label.textContent = matched.text;

        highlight(selectEl);
        filledFieldsCount++;
        console.log("[SIGAP Bridge] Sukses memilih Aktivitas Select2:", matched.text);
      }
    }

    // ----------------------------------------------------
    // 3. URL BUKTI DUKUNG (Textarea #2)
    // Aturan User: Jika ada URL Drive dari profil -> isi. Jika tidak ada -> KOSONGKAN.
    // ----------------------------------------------------
    let urlTa = getTextareaByLabel(['URL Bukti Dukung', 'Bukti Dukung', 'URL Bukti']) ||
                document.querySelector('textarea[name*="url" i], textarea[name*="bukti" i], #url_bukti') ||
                allTextareas[1];

    if (urlTa) {
      if (data.urlBuktiDukung && data.urlBuktiDukung.trim() !== '') {
        setTextareaValue(urlTa, data.urlBuktiDukung.trim(), 'URL Bukti Dukung');
      } else {
        // Kosongkan jika belum diisi di profil
        urlTa.value = '';
        urlTa.setAttribute('value', '');
        urlTa.innerHTML = '';
        urlTa.textContent = '';
        urlTa.dispatchEvent(new Event('input', { bubbles: true }));
        urlTa.dispatchEvent(new Event('change', { bubbles: true }));
        console.log("[SIGAP Bridge] URL Bukti Dukung dikosongkan (belum diisi di profil).");
      }
    }

    // ----------------------------------------------------
    // 4. CATATAN (Textarea #3)
    // Diisi dengan: "Dicatat melalui Logbook Harian SIGAP pada [Hari, Tanggal Bulan Tahun]."
    // ----------------------------------------------------
    let catTa = getTextareaByLabel(['Catatan']) ||
                document.querySelector('textarea[name="catatan" i], #catatan') ||
                allTextareas[2];

    if (catTa && data.catatan) {
      setTextareaValue(catTa, data.catatan, 'Catatan');
    }

    // ----------------------------------------------------
    // 5. KUANTITAS (Default: 1)
    // ----------------------------------------------------
    let qtyEl = document.querySelector('input[name*="kuantitas" i], input[name*="jml" i], #kuantitas');
    if (qtyEl) {
      setInputValue(qtyEl, String(data.kuantitas || 1), 'Kuantitas');
    }

    // ----------------------------------------------------
    // 6. JAM MULAI & SELESAI
    // ----------------------------------------------------
    let jamMulaiEl = document.querySelector('input[name*="MULAI" i], input[name*="JAM_AWAL" i], #jam_mulai');
    let jamSelesaiEl = document.querySelector('input[name*="SELESAI" i], input[name*="JAM_AKHIR" i], #jam_selesai');

    if (jamMulaiEl && data.jamMulai) setInputValue(jamMulaiEl, data.jamMulai, 'Jam Mulai');
    if (jamSelesaiEl && data.jamSelesai) setInputValue(jamSelesaiEl, data.jamSelesai, 'Jam Selesai');

    // Tampilkan Toast Notifikasi Elegan
    showSuccessToast(teksNamaKegiatan, namaAktivitas, Boolean(data.urlBuktiDukung), filledFieldsCount);

    return {
      success: true,
      filledFields: filledFieldsCount,
      uraian: teksNamaKegiatan
    };
  } catch (error) {
    console.error("[SIGAP Bridge] Error saat mengisi formulir:", error);
    return { success: false, error: error.message };
  }
}

// Toast Notifikasi Visual di Pojok Kanan Atas e-Kinerja
function showSuccessToast(namaKegiatan, namaAktivitas, hasDriveLink, count) {
  const existing = document.getElementById('sigap-bridge-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'sigap-bridge-toast';
  toast.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 9999999;
    background: linear-gradient(135deg, #065f46 0%, #047857 100%);
    color: #ffffff;
    padding: 16px 20px;
    border-radius: 14px;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.15);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 13px;
    max-width: 380px;
    animation: sigapSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    align-items: flex-start;
    gap: 12px;
  `;

  toast.innerHTML = `
    <div style="font-size: 22px; line-height: 1; flex-shrink: 0; padding-top: 2px;">⚡</div>
    <div style="flex: 1; min-width: 0;">
      <div style="font-weight: 700; font-size: 14px; margin-bottom: 3px; display: flex; align-items: center; justify-content: space-between;">
        <span>Otomasi SIGAP Berhasil!</span>
        <span style="font-size: 11px; background: rgba(255,255,255,0.25); padding: 2px 7px; border-radius: 10px;">${count} Kolom Terisi</span>
      </div>
      <div style="font-size: 12px; opacity: 0.95; line-height: 1.4; margin-bottom: 6px; word-break: break-word;">
        ${escapeHtml(namaKegiatan)}
      </div>
      <div style="font-size: 11px; opacity: 0.85; display: flex; flex-wrap: wrap; gap: 8px;">
        ${namaAktivitas ? `<span>🎯 ${escapeHtml(namaAktivitas.substring(0, 24))}</span>` : ''}
        <span>📁 ${hasDriveLink ? 'Link Drive Terpasang' : 'URL Drive Kosong'}</span>
      </div>
    </div>
  `;

  if (!document.getElementById('sigap-toast-keyframes')) {
    const style = document.createElement('style');
    style.id = 'sigap-toast-keyframes';
    style.textContent = `
      @keyframes sigapSlideIn {
        from { transform: translateX(50px) scale(0.95); opacity: 0; }
        to { transform: translateX(0) scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.4s ease';
    setTimeout(() => toast.remove(), 400);
  }, 4500);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
