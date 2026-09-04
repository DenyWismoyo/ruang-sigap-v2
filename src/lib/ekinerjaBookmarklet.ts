/**
 * E-Kinerja BKPSDM Kota Surakarta Bridge & Bookmarklet Generator
 * Menghubungkan data Bukti Kinerja RUANG SIGAP & POROS dengan Form Kegiatan Harian e-Kinerja Solo
 */

export interface EkinerjaFormPayload {
  tglPelaksanaan: string; // Format DD/MM/YYYY
  aktivitasId?: number;
  aktivitasNama: string;  // Sesuai kamus 152 Kepwal 786/154/2020
  namaKegiatan: string;   // Uraian kegiatan
  jamMulai?: string;      // default 08:00
  jamSelesai?: string;    // default 09:30
  kuantitas?: number;     // default 1
  urlBuktiDukung: string; // Link Google Drive dari RUANG SIGAP
  catatan?: string;
}

/**
 * Format tanggal dari Date/Timestamp ke format input e-Kinerja (DD/MM/YYYY)
 */
export function formatToEkinerjaDate(date: any): string {
  if (!date) {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    return `${d}/${m}/${y}`;
  }

  let dObj: Date;
  if (typeof date?.toDate === 'function') {
    dObj = date.toDate();
  } else if (date instanceof Date) {
    dObj = date;
  } else {
    dObj = new Date(date);
  }

  if (isNaN(dObj.getTime())) {
    dObj = new Date();
  }

  const d = String(dObj.getDate()).padStart(2, '0');
  const m = String(dObj.getMonth() + 1).padStart(2, '0');
  const y = dObj.getFullYear();
  return `${d}/${m}/${y}`;
}

/**
 * Salin payload e-Kinerja ke Clipboard dengan format JSON dan Teks Terstruktur
 */
export async function copyEkinerjaPayloadToClipboard(payload: EkinerjaFormPayload): Promise<boolean> {
  try {
    const jsonStr = JSON.stringify(payload);
    await navigator.clipboard.writeText(jsonStr);
    return true;
  } catch (err) {
    console.warn("Gagal menyalin langsung ke clipboard:", err);
    return false;
  }
}

/**
 * Kode Bookmarklet 1-Klik Browser Chrome untuk mengisi otomatis Form Kegiatan Harian di e-Kinerja Solo
 */
export const EKINERJA_BOOKMARKLET_SCRIPT = `(function(){
  try {
    function fillForm(data) {
      if (!data) return;
      var $ = window.jQuery || window.$;

      function highlight(el) {
        if (!el) return;
        el.style.backgroundColor = '#ecfdf5';
        el.style.borderColor = '#10b981';
      }

      function setTextarea(el, val) {
        if (!el || !val) return;
        el.focus();
        el.value = val;
        el.setAttribute('value', val);
        el.innerHTML = val;
        el.textContent = val;
        if ($) $(el).val(val).trigger('input').trigger('change');
        el.dispatchEvent(new Event('input', {bubbles:true}));
        el.dispatchEvent(new Event('change', {bubbles:true}));
        highlight(el);
      }

      var allTextareas = Array.from(document.querySelectorAll('textarea')).filter(function(t){
        return t.offsetParent !== null || window.getComputedStyle(t).display !== 'none';
      });

      // 1. NAMA KEGIATAN HARIAN (Fokus Utama: Uraian + [Aktivitas])
      var namaTa = document.querySelector('textarea[name*="kegiatan" i], textarea[name*="nama" i], textarea[name*="uraian" i], #nama_kegiatan') || allTextareas[0];
      var uraianLengkap = (data.namaKegiatan || '').trim();
      var namaAktivitas = (data.aktivitasNama || '').trim();
      if (namaAktivitas && uraianLengkap.toLowerCase().indexOf(namaAktivitas.toLowerCase()) === -1) {
        uraianLengkap = '[' + namaAktivitas + '] ' + uraianLengkap;
      }
      if (namaTa && uraianLengkap) {
        setTextarea(namaTa, uraianLengkap);
      }

      // 2. AKTIVITAS (Select2 Dropdown) - Best Effort
      var selectEl = document.querySelector('select[name*="aktivitas" i], select[name*="kd_aktivitas" i], select.select2') || document.querySelector('select');
      if (selectEl && namaAktivitas) {
        var options = Array.from(selectEl.options);
        var targetSearch = namaAktivitas.toLowerCase().trim();
        var matched = options.find(function(o){
          var txt = o.text.toLowerCase().trim();
          return txt === targetSearch || txt.indexOf(targetSearch) !== -1 || targetSearch.indexOf(txt) !== -1;
        });
        if (matched) {
          selectEl.value = matched.value;
          if ($ && $.fn && $.fn.select2) {
            $(selectEl).val(matched.value).trigger('change');
            try { $(selectEl).select2('val', matched.value); } catch(e) {}
          } else {
            selectEl.dispatchEvent(new Event('change', {bubbles:true}));
          }
          $('.select2-chosen, .select2-selection__rendered').text(matched.text);
          highlight(selectEl);
        }
      }

      function getTaByLabel(labelKeywords) {
        var allLabels = Array.from(document.querySelectorAll('label, td, th, div, span, b, strong, p'));
        for (var i = 0; i < allLabels.length; i++) {
          var lbl = allLabels[i];
          if (lbl.children.length > 2) continue;
          var txt = (lbl.textContent || '').trim().toLowerCase();
          if (labelKeywords.some(function(kw){ return txt === kw.toLowerCase() || txt.indexOf(kw.toLowerCase()) !== -1; })) {
            var next = lbl.nextElementSibling;
            while (next) {
              if (next.tagName === 'TEXTAREA') return next;
              var found = next.querySelector('textarea');
              if (found) return found;
              next = next.nextElementSibling;
            }
            var p = lbl.parentElement;
            for (var d = 0; d < 3 && p; d++) {
              var taList = Array.from(p.querySelectorAll('textarea'));
              if (taList.length === 1) return taList[0];
              p = p.parentElement;
            }
          }
        }
        return null;
      }

      // 3. URL BUKTI DUKUNG (Textarea #2)
      var urlTa = getTaByLabel(['URL Bukti Dukung', 'Bukti Dukung']) || allTextareas[1];
      if (urlTa) {
        if (data.urlBuktiDukung && data.urlBuktiDukung.trim() !== '') {
          setTextarea(urlTa, data.urlBuktiDukung.trim());
        } else {
          urlTa.value = '';
          urlTa.setAttribute('value', '');
          urlTa.innerHTML = '';
          urlTa.textContent = '';
        }
      }

      // 4. CATATAN (Textarea #3)
      var catTa = getTaByLabel(['Catatan']) || document.querySelector('textarea[name="catatan" i], #catatan') || allTextareas[2];
      if (catTa && data.catatan) {
        setTextarea(catTa, data.catatan);
      }

      // 5. KUANTITAS (Default: 1)
      var qtyEl = document.querySelector('input[name*="kuantitas" i], input[name*="jml" i], #kuantitas');
      if (qtyEl) {
        qtyEl.value = String(data.kuantitas || 1);
        if ($) $(qtyEl).val(String(data.kuantitas || 1)).trigger('input').trigger('change');
        qtyEl.dispatchEvent(new Event('input', {bubbles:true}));
        qtyEl.dispatchEvent(new Event('change', {bubbles:true}));
        highlight(qtyEl);
      }

      // Tampilkan Notifikasi Sukses
      var toast = document.createElement('div');
      toast.innerHTML = '<div style="position:fixed;top:20px;right:20px;z-index:99999;background:linear-gradient(135deg, #065f46 0%, #047857 100%);color:#fff;padding:16px 20px;border-radius:12px;font-family:sans-serif;font-size:13px;box-shadow:0 10px 25px rgba(0,0,0,0.25);display:flex;align-items:center;gap:10px;"><span>⚡</span><div><strong style=\\"display:block;font-size:14px;\\">Otomasi SIGAP Berhasil!</strong>Uraian kegiatan e-Kinerja berhasil diisi.</div></div>';
      document.body.appendChild(toast);
      setTimeout(function(){ toast.remove(); }, 4000);
    }

    // Coba baca dari Clipboard API
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(function(clipText){
        try {
          var payload = JSON.parse(clipText);
          if (payload && payload.urlBuktiDukung) {
            fillForm(payload);
            return;
          }
        } catch(e){}
        promptManual();
      }).catch(function(){
        promptManual();
      });
    } else {
      promptManual();
    }

    function promptManual() {
      var raw = prompt("Paste Data Kinerja dari RUANG SIGAP di sini (Ctrl+V):");
      if (raw) {
        try {
          fillForm(JSON.parse(raw));
        } catch(err) {
          alert("Format data tidak valid.");
        }
      }
    }
  } catch(err) {
    alert("Terjadi kesalahan pada bookmarklet: " + err.message);
  }
})();`;

/**
 * Bookmarklet URL siap pasang di browser: javascript:...
 */
export function getEkinerjaBookmarkletHref(): string {
  return `javascript:${encodeURIComponent(EKINERJA_BOOKMARKLET_SCRIPT)}`;
}
