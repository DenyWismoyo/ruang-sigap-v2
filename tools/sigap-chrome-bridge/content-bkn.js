// content-bkn.js - Berjalan di Tab https://kinerja.bkn.go.id/*
// Bertugas menginjeksi data Rencana Aksi, Target, Bukti Dukung (Drive Link), dan Realisasi dari RUANG SIGAP

(function() {
  console.log("[SIGAP BKN Bridge] Content script terpasang di portal e-Kinerja BKN.");

  let activeFloatingBadge = null;

  // Render floating status badge di pojok kanan atas portal BKN
  function createFloatingBadge(text, color = "#2563eb") {
    if (activeFloatingBadge && activeFloatingBadge.parentNode) {
      activeFloatingBadge.parentNode.removeChild(activeFloatingBadge);
    }

    const badge = document.createElement('div');
    badge.id = 'sigap-bkn-floating-badge';
    badge.style.cssText = `
      position: fixed;
      top: 14px;
      right: 14px;
      z-index: 999999;
      background: ${color};
      color: #ffffff;
      padding: 8px 14px;
      border-radius: 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12px;
      font-weight: 600;
      box-shadow: 0 4px 14px rgba(0,0,0,0.18);
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      transition: all 0.2s ease-in-out;
    `;
    badge.innerHTML = `<span>⚡</span> <span>${text}</span>`;

    badge.addEventListener('mouseenter', () => {
      badge.style.transform = 'translateY(-2px) scale(1.02)';
    });
    badge.addEventListener('mouseleave', () => {
      badge.style.transform = 'translateY(0) scale(1)';
    });

    document.body.appendChild(badge);
    activeFloatingBadge = badge;
    return badge;
  }

  // Notifikasi Toast Mengambang
  function showBknToast(message, isSuccess = true) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999999;
      background: ${isSuccess ? '#059669' : '#dc2626'};
      color: #ffffff;
      padding: 12px 18px;
      border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(0,0,0,0.25);
      display: flex;
      align-items: center;
      gap: 8px;
      animation: sigapFadeIn 0.3s ease-out;
    `;
    toast.innerHTML = `<span>${isSuccess ? '✅' : '⚠️'}</span> <span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.4s ease';
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  // Helper trigger event input & change pada elemen DOM
  function triggerInputEvent(element, value) {
    if (!element) return false;
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

    // Efek visual glow hijau
    element.style.transition = 'all 0.3s ease';
    element.style.backgroundColor = '#ecfdf5';
    element.style.borderColor = '#10b981';
    element.style.boxShadow = '0 0 0 2px rgba(16, 185, 129, 0.2)';

    setTimeout(() => {
      element.style.backgroundColor = '';
      element.style.borderColor = '';
      element.style.boxShadow = '';
    }, 2500);

    return true;
  }

  // 1. Injeksi Form Rencana Aksi (Modal Tambah Rencana Aksi)
  function injectRencanaAksi(payload) {
    console.log("[SIGAP BKN Bridge] Mencoba mengisi Rencana Aksi:", payload);

    // Cari modal dialog yang sedang terbuka di DOM
    const modals = Array.from(document.querySelectorAll('.modal, [role="dialog"], .swal2-popup'));
    const openModal = modals.find(m => {
      const style = window.getComputedStyle(m);
      return style.display !== 'none' && style.visibility !== 'hidden';
    }) || document;

    // Cari field Rencana Aksi & Target
    const allInputs = Array.from(openModal.querySelectorAll('input, textarea'));
    
    let rencanaAksiInput = allInputs.find(i => {
      const placeholder = (i.getAttribute('placeholder') || '').toLowerCase();
      const name = (i.getAttribute('name') || '').toLowerCase();
      const id = (i.id || '').toLowerCase();
      const label = i.closest('div')?.querySelector('label')?.textContent?.toLowerCase() || '';
      return placeholder.includes('rencana') || name.includes('rencana') || id.includes('rencana') || label.includes('rencana');
    });

    let targetInput = allInputs.find(i => {
      const placeholder = (i.getAttribute('placeholder') || '').toLowerCase();
      const name = (i.getAttribute('name') || '').toLowerCase();
      const id = (i.id || '').toLowerCase();
      const label = i.closest('div')?.querySelector('label')?.textContent?.toLowerCase() || '';
      return placeholder.includes('target') || name.includes('target') || id.includes('target') || label.includes('target');
    });

    // Fallback jika tidak teridentifikasi lewat atribut: ambil input pertama dan kedua di modal
    if (!rencanaAksiInput && allInputs.length >= 1) rencanaAksiInput = allInputs[0];
    if (!targetInput && allInputs.length >= 2) targetInput = allInputs[1];

    let countFilled = 0;
    if (rencanaAksiInput && payload.rencanaAksi) {
      triggerInputEvent(rencanaAksiInput, payload.rencanaAksi);
      countFilled++;
    }
    if (targetInput && payload.targetAksi) {
      triggerInputEvent(targetInput, payload.targetAksi);
      countFilled++;
    }

    if (countFilled > 0) {
      showBknToast(`Rencana Aksi & Target berhasil diisi dari SIGAP! (${countFilled} field)`, true);
      return { success: true, count: countFilled };
    } else {
      showBknToast("Pastikan Anda sudah mengklik tombol hijau [Tambah] pada baris RHK terkait.", false);
      return { success: false, message: "Modal form Rencana Aksi belum terbuka." };
    }
  }

  // 2. Injeksi Form Eviden / Realisasi (Modal Tambah Eviden atau Edit Realisasi)
  function injectEvidenDanRealisasi(payload) {
    console.log("[SIGAP BKN Bridge] Mencoba mengisi Eviden/Realisasi:", payload);

    const modals = Array.from(document.querySelectorAll('.modal, [role="dialog"], .swal2-popup'));
    const openModal = modals.find(m => {
      const style = window.getComputedStyle(m);
      return style.display !== 'none' && style.visibility !== 'hidden';
    }) || document;

    const allInputs = Array.from(openModal.querySelectorAll('input, textarea'));

    // Cek apakah ini modal Eviden (ada field link / bukti / nama)
    let namaEvidenInput = allInputs.find(i => {
      const placeholder = (i.getAttribute('placeholder') || '').toLowerCase();
      const label = i.closest('div')?.querySelector('label')?.textContent?.toLowerCase() || '';
      return placeholder.includes('nama') || label.includes('nama eviden') || label.includes('nama');
    });

    let linkEvidenInput = allInputs.find(i => {
      const placeholder = (i.getAttribute('placeholder') || '').toLowerCase();
      const label = i.closest('div')?.querySelector('label')?.textContent?.toLowerCase() || '';
      return placeholder.includes('drive') || placeholder.includes('link') || label.includes('link') || label.includes('bukti');
    });

    // Cek apakah ini modal Realisasi
    let realisasiInput = allInputs.find(i => {
      const label = i.closest('div')?.querySelector('label')?.textContent?.toLowerCase() || '';
      return label.includes('realisasi') || i.id.includes('realisasi');
    });

    let sumberDataInput = allInputs.find(i => {
      const label = i.closest('div')?.querySelector('label')?.textContent?.toLowerCase() || '';
      return label.includes('sumber') || i.id.includes('sumber');
    });

    let countFilled = 0;
    if (namaEvidenInput && payload.namaEviden) {
      triggerInputEvent(namaEvidenInput, payload.namaEviden);
      countFilled++;
    }
    if (linkEvidenInput && payload.linkEviden) {
      triggerInputEvent(linkEvidenInput, payload.linkEviden);
      countFilled++;
    }
    if (realisasiInput && payload.realisasi) {
      triggerInputEvent(realisasiInput, payload.realisasi);
      countFilled++;
    }
    if (sumberDataInput && payload.sumberData) {
      triggerInputEvent(sumberDataInput, payload.sumberData);
      countFilled++;
    }

    if (countFilled > 0) {
      showBknToast(`Form BKN berhasil diisi dari SIGAP! (${countFilled} field)`, true);
      return { success: true, count: countFilled };
    } else {
      showBknToast("Klik tombol [Tambah] Bukti Dukung atau tombol [Edit] Realisasi terlebih dahulu.", false);
      return { success: false, message: "Modal form eviden/realisasi belum aktif." };
    }
  }

  // Listener pesan dari Background Service Worker
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'FILL_BKN_FORM') {
      const { payload } = message;
      if (payload.actionType === 'RENCANA_AKSI') {
        const result = injectRencanaAksi(payload);
        sendResponse(result);
      } else {
        const result = injectEvidenDanRealisasi(payload);
        sendResponse(result);
      }
      return true;
    }
  });

  // Deteksi Halaman Aktif saat dimuat
  function initPage() {
    const url = window.location.href;
    if (url.includes('rencana_aksi')) {
      createFloatingBadge('SIGAP Bridge: Siap Injeksi Rencana Aksi', '#2563eb');
    } else if (url.includes('penilaian')) {
      createFloatingBadge('SIGAP Bridge: Siap Injeksi Bukti Dukung & Realisasi', '#059669');
    } else {
      createFloatingBadge('SIGAP e-Kinerja Bridge Aktif', '#4f46e5');
    }
  }

  initPage();
})();
