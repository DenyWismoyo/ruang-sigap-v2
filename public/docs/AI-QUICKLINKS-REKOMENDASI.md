# 🤖 Rekomendasi AI Tools untuk Pengguna Ruang Sigap

> **Versi:** 1.0 — Agustus 2026
> **Untuk:** Pengembang & Admin — Panduan pengisian fitur "Rekomendasi AI" di widget Portal Pintar

---

## 📋 Dasar Pertimbangan Kurasi

Daftar ini disusun berdasarkan analisis mendalam terhadap:

1. **Profil pengguna sistem** → ASN (Aparatur Sipil Negara): Staf TU, Pimpinan, Pelaksana di lingkungan Pemerintah Daerah
2. **Aktivitas kerja utama** → Input surat, membuat disposisi, laporan tindak lanjut, notulensi rapat, rekap kinerja, menyusun dokumen dinas
3. **Ketersediaan di Indonesia** → Dapat diakses tanpa VPN, tersedia free tier yang layak
4. **Relevansi fitur sistem** → Mendukung alur kerja yang sudah ada: AI Scan Surat (Gemini), logbook, bukti kinerja, notulensi, persetujuan draf

### ❌ AI yang Tidak Dimasukkan (dengan Alasan)

| AI | Alasan Dikeluarkan |
|----|-------------------|
| SEO tools (Surfer, Semrush, Ahrefs) | Tidak relevan untuk ASN/pemerintah |
| Coding tools (Cursor, Bolt, Replit, v0) | Bukan kebutuhan pengguna akhir sistem |
| Music generator (Suno, Udio) | Tidak relevan sama sekali |
| Ad creator (Adcreative.ai) | Tidak relevan untuk birokrasi |
| Jasper AI | Harga enterprise, tidak cocok untuk ASN |
| Sora (OpenAI) | Dihentikan April 2026 |

---

## 🎯 Peta Aktivitas → Kebutuhan AI

```
AKTIVITAS ASN SEHARI-HARI           KEBUTUHAN AI
══════════════════════════════════════════════════
📄 Input surat masuk         →  AI Scan PDF (sudah ada: Gemini)
📝 Membuat surat dinas       →  Asisten penulisan formal
📋 Menyusun notulensi rapat  →  Transkripsi & ringkasan meeting
📊 Laporan tindak lanjut     →  Asisten penyusunan laporan
🔍 Riset kebijakan/regulasi  →  Mesin pencari AI bereferensi
🔄 Terjemahan dokumen        →  Penerjemah akurat Inggris-Indonesia
🖼️ Membuat infografik/materi →  Desain grafis AI
📺 Presentasi/paparan        →  Generator presentasi otomatis
✅ Rekap kinerja bulanan      →  Asisten penyusunan narasi SKP
```

---

## 🏆 TIER 1 — PRIORITAS UTAMA (Wajib Ada)

*Sangat relevan, free tier memadai, dapat diakses di Indonesia*

---

### 1. 🧠 ChatGPT
- **URL:** https://chatgpt.com
- **Referral URL:** *(tidak ada program afiliasi publik — gunakan URL langsung)*
- **Keunggulan untuk ASN:**
  - Menyusun draf surat dinas, nota dinas, telaahan staf
  - Membantu narasi laporan kinerja & capaian SKP
  - Brainstorming solusi masalah kebijakan
  - Merangkum dokumen/regulasi panjang
- **Free Tier:** ✅ GPT-4o mini gratis, akses GPT-4o terbatas
- **Aksesibilitas Indonesia:** ✅ Penuh — tidak ada VPN diperlukan
- **Bahasa Indonesia:** ✅ Sangat baik
- **Catatan:** Paling dikenal ASN. Pintu gerbang AI terbaik untuk pemula.

---

### 2. 🌟 Google Gemini
- **URL:** https://gemini.google.com
- **Referral URL:** *(tidak ada program afiliasi — gunakan URL langsung)*
- **Keunggulan untuk ASN:**
  - **Terintegrasi Google Drive, Docs, Gmail** — langsung di ekosistem yang sudah dipakai
  - Analisis dokumen PDF surat dinas
  - Ringkasan email/surat panjang
  - Penelusuran real-time terintegrasi Google Search
- **Free Tier:** ✅ Gemini 2.0 Flash gratis via web
- **Aksesibilitas Indonesia:** ✅ Penuh
- **Bahasa Indonesia:** ✅ Sangat baik (juga memahami bahasa daerah)
- **Catatan:** *Sistem Ruang Sigap sudah menggunakan Gemini 2.0 Flash untuk AI Scan Surat.* Sangat sinergi.

---

### 3. 🤖 Claude (Anthropic)
- **URL:** https://claude.ai
- **Referral URL:** *(tidak ada program afiliasi individual)*
- **Keunggulan untuk ASN:**
  - **Terbaik untuk dokumen sangat panjang** (200k token) — cocok untuk peraturan daerah, RPJMD, dll.
  - Analisis mendalam PDF regulasi/kebijakan
  - Penulisan formal yang nuansanya paling natural
  - Memahami konteks dokumen yang panjang dan kompleks
- **Free Tier:** ✅ Claude 3.5 Sonnet terbatas
- **Aksesibilitas Indonesia:** ✅ Penuh
- **Bahasa Indonesia:** ✅ Baik
- **Catatan:** Pilihan terbaik ketika perlu menganalisis dokumen RDTR, APBD, atau peraturan panjang sekaligus.

---

### 4. 🔍 Perplexity AI
- **URL:** https://www.perplexity.ai
- **Referral URL:** `[ISI_KODE_REFERRAL_PERPLEXITY_DISINI]`
  - *Format:* `https://pplx.ai/[username]`
  - *Program:* Perplexity Affiliate via dub.co
  - *Cara daftar:* https://perplexity.ai/affiliate
- **Keunggulan untuk ASN:**
  - Riset regulasi/kebijakan dengan **sumber yang bisa diklik & diverifikasi**
  - Cari peraturan perundangan terbaru dengan referensi nyata
  - Tidak ada halusinasi tanpa referensi (sumber selalu ditampilkan)
  - Tersedia bahasa Indonesia
- **Free Tier:** ✅ Free plan memadai untuk penggunaan harian
- **Aksesibilitas Indonesia:** ✅ Penuh — bermitra dengan Telkomsel (2025)
- **Bahasa Indonesia:** ✅ Baik
- **Catatan:** Ideal untuk "cek fakta" regulasi sebelum menyusun surat/laporan.

---

### 5. 📓 NotebookLM (Google)
- **URL:** https://notebooklm.google.com
- **Referral URL:** *(tidak ada program afiliasi)*
- **Keunggulan untuk ASN:**
  - Upload dokumen RPJMD, Renstra, perda → tanya jawab langsung
  - Buat ringkasan audio ("podcast") dari dokumen panjang
  - Analisis multi-dokumen sekaligus
  - Cocok untuk studi kebijakan & penyusunan program kerja
- **Free Tier:** ✅ Sepenuhnya gratis
- **Aksesibilitas Indonesia:** ✅ Penuh
- **Bahasa Indonesia:** ✅ Baik
- **Catatan:** Sangat berguna untuk Pelaksana yang perlu memahami banyak regulasi sebelum menyusun laporan.

---

### 6. 🌐 Google Translate
- **URL:** https://translate.google.com
- **Referral URL:** *(tidak ada program afiliasi)*
- **Keunggulan untuk ASN:**
  - Terjemahan dokumen resmi dari/ke Bahasa Inggris
  - Terjemahan website regulasi internasional (WHO, UN, OECD)
  - Mendukung upload dokumen PDF
  - Tersedia via browser extension
- **Free Tier:** ✅ Sepenuhnya gratis
- **Aksesibilitas Indonesia:** ✅ Penuh
- **Bahasa Indonesia:** ✅ Native

---

### 7. 🌍 DeepL Translator
- **URL:** https://www.deepl.com/translator
- **Referral URL:** `[ISI_KODE_REFERRAL_DEEPL_DISINI]`
  - *Format:* Cek di https://www.deepl.com/partner
  - *Program:* DeepL Partner Program
- **Keunggulan untuk ASN:**
  - Terjemahan **paling natural dan akurat** untuk dokumen formal
  - Hasil terjemahan terasa seperti ditulis manusia
  - Cocok untuk menerjemahkan surat/laporan resmi
  - Bisa upload file Word/PDF
- **Free Tier:** ✅ 50.000 karakter/bulan gratis
- **Aksesibilitas Indonesia:** ✅ Dapat diakses
- **Bahasa Indonesia:** ✅ Tersedia

---

### 8. 🎨 Canva
- **URL:** https://www.canva.com
- **Referral URL:** `[ISI_KODE_REFERRAL_CANVA_DISINI]`
  - *Format:* Melalui Impact.com affiliate dashboard
  - *Program:* Canva Affiliate via Impact
  - *Cara daftar:* https://www.canva.com/affiliates/
- **Keunggulan untuk ASN:**
  - Buat infografik program/capaian instansi
  - Desain banner kegiatan/event resmi
  - Template presentasi profesional pemerintah
  - Buat konten media sosial instansi
  - Magic Design & Magic Write dengan AI
- **Free Tier:** ✅ Sangat lengkap secara gratis
- **Aksesibilitas Indonesia:** ✅ Penuh — populer di Indonesia
- **Bahasa Indonesia:** ✅ Interface tersedia Bahasa Indonesia

---

### 9. 📊 Gamma App
- **URL:** https://gamma.app
- **Referral URL:** `[ISI_KODE_REFERRAL_GAMMA_DISINI]`
  - *Format:* `https://gamma.app/?r=[kode]`
  - *Program:* Gamma via PartnerStack
  - *Cara daftar:* https://gamma.app/partners
- **Keunggulan untuk ASN:**
  - **Buat paparan/presentasi dari teks dalam hitungan menit**
  - Input narasi → otomatis jadi slide profesional
  - Sangat berguna untuk bahan rapat, paparan kepala dinas
  - Dokumen web interaktif untuk laporan
- **Free Tier:** ✅ Cukup untuk kebutuhan dasar
- **Aksesibilitas Indonesia:** ✅ Penuh
- **Bahasa Indonesia:** ✅ Baik

---

## 🥈 TIER 2 — SANGAT DIREKOMENDASIKAN

*Relevan dan berguna, free tier memadai, sedikit lebih spesifik*

---

### 10. 🎙️ Otter.ai
- **URL:** https://otter.ai
- **Referral URL:** `[ISI_KODE_REFERRAL_OTTER_DISINI]`
  - *Format:* Cek di akun Otter → Settings → Referral
  - *Program:* Otter.ai Referral Program
- **Keunggulan untuk ASN:**
  - Transkripsi rapat otomatis real-time
  - Integrasi dengan Zoom, Google Meet, Teams
  - Buat ringkasan & action items otomatis
  - Cocok untuk notulensi rapat dinas
- **Free Tier:** ✅ 300 menit/bulan
- **Aksesibilitas Indonesia:** ✅ Dapat diakses
- **Bahasa Indonesia:** ⚠️ Terutama English — untuk rapat berbahasa Indonesia gunakan Widya Notulensi
- **Catatan:** Terbaik untuk rapat hybrid/virtual yang menggunakan Bahasa Inggris atau campuran.

---

### 11. 🔥 Fireflies.ai
- **URL:** https://fireflies.ai
- **Referral URL:** `[ISI_KODE_REFERRAL_FIREFLIES_DISINI]`
  - *Format:* Cek di Fireflies dashboard → Refer a Friend
- **Keunggulan untuk ASN:**
  - Transkripsi rapat 100+ bahasa termasuk **Bahasa Indonesia**
  - AI summary & action items otomatis
  - Terintegrasi Zoom, Teams, Google Meet
  - Lebih baik dari Otter.ai untuk bahasa Indonesia
- **Free Tier:** ✅ Unlimited transkripsi (terbatas penyimpanan 800 menit)
- **Aksesibilitas Indonesia:** ✅ Penuh
- **Bahasa Indonesia:** ✅ **Mendukung Bahasa Indonesia**

---

### 12. ✍️ QuillBot
- **URL:** https://quillbot.com
- **Referral URL:** `[ISI_KODE_REFERRAL_QUILLBOT_DISINI]`
  - *Format:* Cek di https://quillbot.com/affiliate
  - *Program:* QuillBot Affiliate Program
- **Keunggulan untuk ASN:**
  - Parafrase teks laporan/surat agar lebih formal/profesional
  - Ringkas teks panjang menjadi poin-poin
  - Koreksi tata bahasa (grammar check)
  - Penerjemah terintegrasi
- **Free Tier:** ✅ Parafrase dasar gratis
- **Aksesibilitas Indonesia:** ✅ Penuh
- **Bahasa Indonesia:** ✅ Tersedia (kualitas Inggris lebih baik)

---

### 13. 📝 Microsoft Copilot
- **URL:** https://copilot.microsoft.com
- **Referral URL:** *(tidak ada program afiliasi individual)*
- **Keunggulan untuk ASN:**
  - **Gratis via browser Edge/Bing**
  - Terintegrasi Microsoft 365 (Word, Excel, PowerPoint, Outlook)
  - Membuat draf surat langsung di Word
  - Analisis spreadsheet data kinerja di Excel
- **Free Tier:** ✅ Gratis via web
- **Aksesibilitas Indonesia:** ✅ Penuh
- **Bahasa Indonesia:** ✅ Baik
- **Catatan:** Wajib dikenal ASN yang menggunakan Microsoft Office sehari-hari.

---

### 14. 📄 ChatPDF
- **URL:** https://www.chatpdf.com
- **Referral URL:** *(tidak ada program afiliasi)*
- **Keunggulan untuk ASN:**
  - Upload PDF surat/peraturan → langsung tanya jawab
  - Tidak perlu baca dokumen panjang dari awal
  - Cepat dan langsung tanpa akun premium
  - Cocok untuk peraturan daerah atau RDTR
- **Free Tier:** ✅ Terbatas tapi cukup untuk penggunaan sesekali
- **Aksesibilitas Indonesia:** ✅ Penuh
- **Bahasa Indonesia:** ✅ Baik

---

### 15. 🔊 ElevenLabs
- **URL:** https://elevenlabs.io
- **Referral URL:** `[ISI_KODE_REFERRAL_ELEVENLABS_DISINI]`
  - *Format:* `https://elevenlabs.io/?ref=[kode]`
  - *Program:* ElevenLabs Affiliate via PartnerStack
  - *Komisi:* 22% recurring 12 bulan
- **Keunggulan untuk ASN:**
  - Text-to-speech berkualitas tinggi
  - Buat narasi audio untuk video sosialisasi program
  - **Mendukung Bahasa Indonesia dengan aksen natural**
  - Berguna untuk konten edukasi masyarakat
- **Free Tier:** ✅ 10.000 karakter/bulan
- **Aksesibilitas Indonesia:** ✅ Penuh
- **Bahasa Indonesia:** ✅ Sangat baik

---

### 16. 🖼️ Adobe Firefly
- **URL:** https://firefly.adobe.com
- **Referral URL:** `[ISI_KODE_REFERRAL_ADOBE_DISINI]`
  - *Program:* Adobe Affiliate via Commission Junction (CJ)
- **Keunggulan untuk ASN:**
  - Generate gambar/ilustrasi untuk infografik program pemerintah
  - **Aman secara komersial** — tidak ada risiko hak cipta
  - Terintegrasi Adobe Express (gratis)
  - Cocok untuk konten media sosial instansi
- **Free Tier:** ✅ 25 kredit/bulan
- **Aksesibilitas Indonesia:** ✅ Penuh
- **Bahasa Indonesia:** ✅ Interface tersedia

---

## 🇮🇩 TIER 3 — AI LOKAL INDONESIA

*Dikembangkan oleh anak bangsa, data processing di Indonesia, mendukung konteks pemerintahan*

---

### 17. 🎙️ Widya Notulensi (Widya Wicara)
- **URL:** https://notulensi.id
- **Referral URL:** *(belum ada informasi program afiliasi — cek langsung di website)*
- **Keunggulan untuk ASN:**
  - **Transkripsi rapat dalam Bahasa Indonesia** — lebih akurat dari Otter.ai untuk bahasa Indonesia
  - Fitur ringkasan & poin-poin keputusan otomatis
  - Data diproses di server Indonesia (aman untuk rapat dinas)
  - Dikembangkan khusus untuk kebutuhan Indonesia
- **Free Tier:** Cek di website (tergantung paket terkini)
- **Aksesibilitas Indonesia:** ✅ Native Indonesia
- **Bahasa Indonesia:** ✅ **Terbaik untuk Bahasa Indonesia**
- **Catatan:** ⭐ **Sangat direkomendasikan** untuk notulensi rapat dinas dalam Bahasa Indonesia. Sinergi sempurna dengan fitur Notulensi Rapat di sistem ini.

---

### 18. 🤖 kakak.ai
- **URL:** https://kakak.ai
- **Referral URL:** *(belum ada informasi program afiliasi — cek langsung)*
- **Keunggulan untuk ASN:**
  - Platform AI serba guna berbahasa Indonesia
  - Asisten untuk penulisan, riset, dan analisis dokumen
  - Dirancang untuk profesional & edukasi di Indonesia
  - Berbagai agen AI spesifik tersedia
- **Free Tier:** Cek di website (ada paket gratis)
- **Aksesibilitas Indonesia:** ✅ Native Indonesia — server lokal
- **Bahasa Indonesia:** ✅ **Bahasa Indonesia sebagai prioritas utama**
- **Catatan:** Alternatif lokal yang baik untuk ChatGPT, terutama jika ada kekhawatiran privasi data.

---

### 19. 🔬 Prosa.ai (Meemo)
- **URL:** https://prosa.ai
- **Referral URL:** *(belum ada informasi program afiliasi)*
- **Keunggulan untuk ASN:**
  - NLP Bahasa Indonesia paling mendalam
  - **Meemo:** Transkripsi rapat Bahasa Indonesia khusus
  - Voice-to-text untuk dokumen dinas
  - Digunakan oleh BUMN dan lembaga pemerintah
- **Free Tier:** Ada tier terbatas — cek website
- **Aksesibilitas Indonesia:** ✅ Native Indonesia
- **Bahasa Indonesia:** ✅ **Spesialis NLP Bahasa Indonesia**

---

### 20. 🌐 Sahabat-AI
- **URL:** https://sahabat-ai.com
- **Referral URL:** *(tidak ada program afiliasi)*
- **Keunggulan untuk ASN:**
  - LLM open-source **resmi didukung Indosat & GoTo**
  - Memahami dialek daerah (Jawa, Sunda, Bali, Batak)
  - Data 100% di Indonesia — aman untuk dokumen dinas
  - Dirancang untuk kedaulatan digital Indonesia
- **Free Tier:** Open-source (akses tergantung deployment)
- **Aksesibilitas Indonesia:** ✅ Native Indonesia
- **Bahasa Indonesia:** ✅ **Model terbaik untuk bahasa daerah Indonesia**

---

## 📋 TIER 4 — PELENGKAP BERGUNA

*Relevan tapi lebih spesifik atau untuk kebutuhan tertentu*

---

### 21. 🎬 HeyGen
- **URL:** https://www.heygen.com
- **Referral URL:** `[ISI_KODE_REFERRAL_HEYGEN_DISINI]`
  - *Program:* HeyGen Referral Program — cek di dashboard
- **Keunggulan untuk ASN:**
  - Buat video sosialisasi/edukasi masyarakat dengan avatar AI
  - Presentasi program pemerintah dalam format video
  - Cocok untuk Humas instansi
- **Free Tier:** ✅ Sangat terbatas (1 video/bulan)
- **Aksesibilitas Indonesia:** ✅ Dapat diakses
- **Bahasa Indonesia:** ✅ Mendukung

---

### 22. 📑 MagicSlides
- **URL:** https://www.magicslides.app
- **Referral URL:** *(belum ada informasi program afiliasi)*
- **Keunggulan untuk ASN:**
  - Konversi PDF/teks → Google Slides atau PowerPoint otomatis
  - Sangat praktis untuk membuat paparan dari dokumen yang sudah ada
  - Terintegrasi langsung di Google Slides
- **Free Tier:** ✅ Terbatas
- **Aksesibilitas Indonesia:** ✅ Penuh

---

### 23. 📖 Elicit
- **URL:** https://elicit.com
- **Referral URL:** *(tidak ada program afiliasi)*
- **Keunggulan untuk ASN:**
  - Literature review dari paper akademik & laporan riset
  - Berguna untuk Bappeda dalam menyusun dokumen perencanaan berbasis bukti
  - Merangkum temuan dari banyak dokumen riset sekaligus
- **Free Tier:** ✅ Terbatas
- **Aksesibilitas Indonesia:** ✅ Penuh

---

### 24. 💬 Writesonic
- **URL:** https://writesonic.com
- **Referral URL:** `[ISI_KODE_REFERRAL_WRITESONIC_DISINI]`
  - *Format:* `https://writesonic.com/?via=[KODEMU]`
  - *Program:* PartnerStack — 30% lifetime recurring
  - *Cara daftar:* https://writesonic.com/affiliates
- **Keunggulan untuk ASN:**
  - Generator konten untuk media sosial instansi
  - Artikel berita/rilis pers kegiatan dinas
  - Template surat dan laporan resmi
- **Free Tier:** ✅ 25 kredit/bulan
- **Aksesibilitas Indonesia:** ✅ Penuh

---

### 25. 📝 Notion AI
- **URL:** https://www.notion.com
- **Referral URL:** `[ISI_KODE_REFERRAL_NOTION_DISINI]`
  - *Program:* Notion via PartnerStack (status: terbuka secara berkala)
- **Keunggulan untuk ASN:**
  - Workspace catatan, database proyek, & wiki instansi
  - AI terintegrasi langsung untuk merangkum & menulis
  - Manajemen knowledge base tim
- **Free Tier:** ✅ Personal plan gratis
- **Aksesibilitas Indonesia:** ✅ Penuh

---

## 📊 RINGKASAN UNTUK DATA WIDGET

### Top 15 yang Wajib Ditampilkan (Berurutan)

```typescript
const RECOMMENDED_AI_LINKS = [
  // TIER 1 — PRIORITAS UTAMA
  { id:'ai-1',  judul:'ChatGPT',            url:'https://chatgpt.com',                   deskripsi:'Asisten AI serbaguna — draf surat, laporan, SKP',         kategori:'Asisten AI' },
  { id:'ai-2',  judul:'Google Gemini',       url:'https://gemini.google.com',             deskripsi:'Terintegrasi Google Drive & Docs. AI milik pemerintah',  kategori:'Asisten AI' },
  { id:'ai-3',  judul:'Claude',              url:'https://claude.ai',                     deskripsi:'Analisis dokumen panjang: perda, RPJMD, regulasi',        kategori:'Asisten AI' },
  { id:'ai-4',  judul:'Perplexity AI',       url:'https://www.perplexity.ai',             deskripsi:'Riset regulasi dengan sumber & referensi terverifikasi',  kategori:'Riset'      },
  { id:'ai-5',  judul:'NotebookLM',          url:'https://notebooklm.google.com',         deskripsi:'Tanya jawab dari dokumen yang Anda upload',               kategori:'Riset'      },
  { id:'ai-6',  judul:'Canva',               url:'https://www.canva.com',                 deskripsi:'Desain infografik, banner, & konten instansi dengan AI',  kategori:'Desain'     },
  { id:'ai-7',  judul:'Gamma App',           url:'https://gamma.app',                     deskripsi:'Buat paparan/presentasi dari teks dalam menit',           kategori:'Presentasi' },
  { id:'ai-8',  judul:'Microsoft Copilot',   url:'https://copilot.microsoft.com',         deskripsi:'AI gratis terintegrasi Office 365, Word, Excel',          kategori:'Asisten AI' },
  { id:'ai-9',  judul:'DeepL',               url:'https://www.deepl.com/translator',      deskripsi:'Terjemahan dokumen paling natural & akurat',              kategori:'Terjemahan' },
  { id:'ai-10', judul:'Google Translate',    url:'https://translate.google.com',          deskripsi:'Terjemahan cepat — gratis tanpa batas untuk web',         kategori:'Terjemahan' },

  // TIER 2 — SANGAT DIREKOMENDASIKAN  
  { id:'ai-11', judul:'Fireflies.ai',        url:'https://fireflies.ai',                  deskripsi:'Transkripsi & notulensi rapat Bahasa Indonesia',          kategori:'Notulensi'  },
  { id:'ai-12', judul:'QuillBot',            url:'https://quillbot.com',                  deskripsi:'Parafrase & perbaiki teks laporan/surat dinas',           kategori:'Penulisan'  },
  { id:'ai-13', judul:'ChatPDF',             url:'https://www.chatpdf.com',               deskripsi:'Upload PDF peraturan → tanya jawab langsung',             kategori:'Riset'      },

  // TIER 3 — AI LOKAL INDONESIA
  { id:'ai-14', judul:'Widya Notulensi',     url:'https://notulensi.id',                  deskripsi:'Notulensi rapat otomatis — server Indonesia 🇮🇩',         kategori:'Notulensi'  },
  { id:'ai-15', judul:'kakak.ai',            url:'https://kakak.ai',                      deskripsi:'Asisten AI lokal berbahasa Indonesia 🇮🇩',                kategori:'Asisten AI' },
];
```

---

## 💰 Tabel Referral — Isi Kode Milikmu

> ⚠️ **Penting:** Format URL di bawah adalah *contoh format umum*. Kode referral aslimu bisa berbeda. Selalu copy dari dashboard afiliasi resmi masing-masing platform. Jangan ubah format yang diberikan dashboard karena tracking akan gagal.

| # | Platform | Platform Afiliasi | Format URL Contoh | Komisi | Kode/URL Referralmu |
|---|----------|------------------|-------------------|--------|---------------------|
| 1 | **Perplexity AI** | dub.co | `https://pplx.ai/[username]` | Variatif | `[ISI_DISINI]` |
| 2 | **DeepL** | deepl.com/partner | `https://www.deepl.com/?via=[KODEMU]` | Ada komisi | `[ISI_DISINI]` |
| 3 | **Canva** | Impact.com | Via dashboard Impact | Per signup | `[ISI_DISINI]` |
| 4 | **Gamma App** | PartnerStack | `https://gamma.app/?r=[KODEMU]` | Kredit per referral | `[ISI_DISINI]` |
| 5 | **Fireflies.ai** | Internal | Cek di dashboard → Refer a Friend | Ada benefit | `[ISI_DISINI]` |
| 6 | **QuillBot** | Internal | `https://quillbot.com/?ref=[KODEMU]` | Ada komisi | `[ISI_DISINI]` |
| 7 | **ElevenLabs** | PartnerStack | `https://elevenlabs.io/?ref=[KODEMU]` | 22% / 12 bln | `[ISI_DISINI]` |
| 8 | **HeyGen** | Internal | `https://www.heygen.com/?ref=[KODEMU]` | Ada komisi | `[ISI_DISINI]` |
| 9 | **Adobe** | CJ Affiliate | Via CJ dashboard | % per sales | `[ISI_DISINI]` |
| 10 | **Writesonic** | PartnerStack | `https://writesonic.com/?via=[KODEMU]` | 30% lifetime | `[ISI_DISINI]` |
| 11 | **Notion** | PartnerStack | Via PartnerStack dashboard | Ada komisi | `[ISI_DISINI]` |
| 12 | **Otter.ai** | Internal | Cek di Settings → Referral | Ada benefit | `[ISI_DISINI]` |

---

## 🛠️ Panduan Upgrade Widget

Untuk mengaktifkan fitur referral URL di `QuickLinksWidget.tsx`, tambahkan field `referralUrl` dan logika fallback:

```typescript
// Struktur data AI Link dengan referral support
interface AILinkItem {
  id: string;
  judul: string;
  url: string;            // URL utama (dipakai untuk favicon & fallback)
  referralUrl?: string;   // URL referral — prioritas dibuka jika ada
  deskripsi: string;
  kategori?: 'Asisten AI' | 'Riset' | 'Terjemahan' | 'Notulensi' | 'Penulisan' | 'Desain' | 'Presentasi' | 'Lokal 🇮🇩';
  hasFreeplan?: boolean;
  isLokal?: boolean;      // Untuk badge "AI Lokal Indonesia"
}

// Cara pakai di onClick:
onClick={() => window.open(link.referralUrl ?? link.url, '_blank')}

// Contoh badge lokal di render:
{link.isLokal && (
  <span className="text-[9px] bg-red-50 text-red-600 border border-red-200 rounded px-1">
    🇮🇩 Lokal
  </span>
)}
```

---

## ✅ Checklist Sebelum Launch

- [ ] Daftar ke program afiliasi/referral masing-masing platform yang dipilih
- [ ] Salin URL referral unik dari dashboard afiliasi (jangan ubah formatnya)
- [ ] Isi kolom "Kode/URL Referralmu" di tabel referral di atas
- [ ] Update array `RECOMMENDED_AI_LINKS` di [`QuickLinksWidget.tsx`](../src/app/dashboard/sigap/(main)/ruang-kerja/components/QuickLinksWidget.tsx)
- [ ] Tambahkan field `referralUrl` dan logika `referralUrl ?? url` di widget
- [ ] Test klik setiap link di browser mode incognito — pastikan tracking aktif
- [ ] Tambahkan badge "🇮🇩 Lokal" untuk AI buatan Indonesia

---

*Dokumen ini menggantikan `ai-quicklinks-candidates.md` yang sebelumnya.*
*Dibuat berdasarkan analisis mendalam Blueprint Sistem Ruang Sigap v2 — Agustus 2026*
