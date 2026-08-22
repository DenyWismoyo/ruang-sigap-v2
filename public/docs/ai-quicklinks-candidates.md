# 🤖 Kandidat AI Tools — Rekomendasi untuk QuickLinks Widget

> **Dokumen ini** berisi 50+ kandidat AI tools terkurasi untuk ditampilkan di fitur **"Rekomendasi AI"** pada widget Portal Pintar (QuickLinksWidget).
>
> **Cara penggunaan:**
> 1. Pilih AI tools yang ingin ditampilkan di widget
> 2. Daftarkan diri ke program afiliasi/referral masing-masing platform
> 3. Ganti kolom `🔗 Referral URL` dengan link referral unik milikmu
> 4. Masukkan data ke array `RECOMMENDED_AI_LINKS` di `QuickLinksWidget.tsx`

---

## 📋 Analisis Widget Saat Ini

Widget `QuickLinksWidget.tsx` sudah memiliki:
- ✅ Tab "Rekomendasi AI" dengan array `RECOMMENDED_AI_LINKS`
- ✅ Tampilan grid 2 kolom dengan favicon otomatis dari Google
- ✅ Klik → buka tab baru (`window.open(link.url, '_blank')`)
- ✅ Hover effect dengan tema amber/gold

**Yang perlu diupgrade:**
- Tambah field `referralUrl` agar URL yang dibuka adalah link referral (bukan URL langsung)
- Tambah badge kategori untuk filter/sorting
- Tambah flag `hasFreeplan` untuk info pengguna

---

## 🗂️ Daftar 50+ Kandidat AI Tools

### Cara Baca Tabel
| Kolom | Arti |
|---|---|
| ✅ Free Tier | Ada paket gratis yang bisa langsung dicoba |
| 🔗 Referral | Platform punya program referral/afiliasi resmi |
| ⭐ Priority | Sangat direkomendasikan untuk ditampilkan pertama |

---

## 🧠 Kategori 1: Asisten AI Serbaguna

| # | Nama | URL Utama | Keunggulan Utama | Free Tier | Referral |
|---|------|-----------|-----------------|-----------|---------|
| 1 | **ChatGPT** | https://chatgpt.com | Model GPT-4o terkuat untuk brainstorming, drafting, coding, analisis, Q&A. Paling populer global ⭐ | ✅ | ❌ Tidak ada program afiliasi publik |
| 2 | **Google Gemini** | https://gemini.google.com | Terintegrasi Google Workspace (Docs, Sheets, Gmail). Unggul analisis multimodal & bahasa Indonesia | ✅ | ❌ Tidak ada program afiliasi publik |
| 3 | **Claude (Anthropic)** | https://claude.ai | Terbaik untuk dokumen panjang, PDF, analisis kontrak. Nuansa bahasa paling natural ⭐ | ✅ | ❌ Tidak ada program afiliasi individual |
| 4 | **Microsoft Copilot** | https://copilot.microsoft.com | AI terintegrasi Office 365, Edge, Windows. Gratis via Bing. Berguna jika pakai MS365 | ✅ | ❌ Tidak ada program afiliasi publik |
| 5 | **Grok (xAI)** | https://grok.com | AI dari Elon Musk/xAI. Akses real-time X/Twitter. Dirancang lebih terbuka & jujur | ✅ | ❌ Tidak ada program afiliasi publik |
| 6 | **Meta AI** | https://www.meta.ai | AI gratis dari Meta/Llama. Terintegrasi WhatsApp, Instagram, Facebook | ✅ | ❌ Tidak ada program afiliasi publik |

---

## ✍️ Kategori 2: Penulisan, Konten & Copywriting

| # | Nama | URL Utama | Keunggulan Utama | Free Tier | Referral |
|---|------|-----------|-----------------|-----------|---------|
| 7 | **Writesonic** | https://writesonic.com | Generator konten SEO, artikel, iklan, landing page. 25+ bahasa ⭐ | ✅ | ✅ 30% lifetime recurring via PartnerStack |
| 8 | **Copy.ai** | https://www.copy.ai | Fokus copywriting marketing: tagline, email, iklan, product description | ✅ | ✅ 45% recurring 12 bln via PartnerStack |
| 9 | **Jasper AI** | https://www.jasper.ai | Platform enterprise untuk konten marketing panjang + template brand | ❌ Trial | ✅ Program afiliasi aktif via Impact |
| 10 | **QuillBot** | https://quillbot.com | Parafrase, ringkas, koreksi tata bahasa, penerjemah. Berguna pelajar & penulis ⭐ | ✅ | ✅ Program referral — cek quillbot.com/affiliate |
| 11 | **Grammarly** | https://www.grammarly.com | Standar industri koreksi grammar bahasa Inggris + deteksi plagiarisme | ✅ | ✅ Program afiliasi via Impact.com |
| 12 | **Rytr** | https://rytr.me | Penulis konten AI murah dengan 40+ use-case dan 30+ bahasa | ✅ | ✅ 30% recurring — rytr.me/?via=[kode] |
| 13 | **Hemingway Editor** | https://hemingwayapp.com | Membuat tulisan lebih jelas, padat, dan mudah dibaca | ✅ | ❌ |
| 14 | **Wordtune** | https://www.wordtune.com | Rewrite & perbaiki kalimat secara kontekstual | ✅ | ❌ |

---

## 💻 Kategori 3: Coding & Developer Tools

| # | Nama | URL Utama | Keunggulan Utama | Free Tier | Referral |
|---|------|-----------|-----------------|-----------|---------|
| 15 | **GitHub Copilot** | https://github.com/features/copilot | Standar industri code completion. Terintegrasi VSCode, JetBrains, Neovim ⭐ | ✅ terbatas | ✅ GitHub Affiliate via Impact |
| 16 | **Cursor AI** | https://www.cursor.com | IDE berbasis VSCode dengan agent coding AI. Terbaik 2025 multi-file refactor ⭐ | ✅ | ❌ Tidak ada program afiliasi resmi |
| 17 | **v0 by Vercel** | https://v0.dev | Generate UI React/Next.js dari deskripsi teks | ✅ | ❌ |
| 18 | **Tabnine** | https://www.tabnine.com | Code completion AI dengan opsi on-premise. Cocok untuk kebutuhan privasi tinggi | ✅ | ✅ Ada program afiliasi — cek website resmi |
| 19 | **Bolt.new** | https://bolt.new | Build fullstack app dari prompt. Auto-generate + deploy tanpa setup | ✅ | ❌ |
| 20 | **Replit Agent** | https://replit.com | Coding & deploy app berbasis browser. Ideal untuk prototyping cepat | ✅ | ✅ Referral replit.com?r=[kode] |

---

## 🔍 Kategori 4: Riset & Pencarian

| # | Nama | URL Utama | Keunggulan Utama | Free Tier | Referral |
|---|------|-----------|-----------------|-----------|---------|
| 21 | **Perplexity AI** | https://www.perplexity.ai | Mesin pencari AI dengan sitasi real-time. Terbaik untuk riset cepat + akurat ⭐ | ✅ | ✅ Program afiliasi via dub.co — pplx.ai/[username] |
| 22 | **NotebookLM** | https://notebooklm.google.com | Upload dokumen → tanya jawab & ringkasan otomatis. Ideal riset akademik ⭐ | ✅ | ❌ |
| 23 | **Consensus** | https://consensus.app | Cari jawaban ilmiah dari 200+ juta paper akademik | ✅ | ✅ Ada program referral — cek website |
| 24 | **Elicit** | https://elicit.com | Literature review otomatis dari paper ilmiah | ✅ | ❌ |
| 25 | **ChatPDF** | https://www.chatpdf.com | Upload PDF → tanya jawab langsung. Sederhana & cepat | ✅ | ❌ |
| 26 | **Kimi (Moonshot AI)** | https://kimi.moonshot.cn | AI riset mendalam 200k+ token. Sangat bagus untuk analisis dokumen panjang | ✅ | ❌ |

---

## 🎨 Kategori 5: Desain, Gambar & Visual

| # | Nama | URL Utama | Keunggulan Utama | Free Tier | Referral |
|---|------|-----------|-----------------|-----------|---------|
| 27 | **Canva Magic Studio** | https://www.canva.com | Desain grafis AI terintegrasi. Social media, poster, presentasi, logo ⭐ | ✅ | ✅ Program afiliasi Canva via Impact.com |
| 28 | **Midjourney** | https://www.midjourney.com | Generator gambar AI terbaik untuk kualitas artistik. Standar industri kreatif | ❌ | ❌ Tidak ada program afiliasi resmi |
| 29 | **DALL-E 3 via ChatGPT** | https://chatgpt.com | Tersedia langsung di ChatGPT Plus. Paling mudah untuk non-desainer | ✅ terbatas | ❌ |
| 30 | **Leonardo AI** | https://leonardo.ai | Image generation dengan kontrol kreatif tinggi. Banyak model & style ⭐ | ✅ | ✅ Referral program — leonardo.ai/?via=[kode] |
| 31 | **Adobe Firefly** | https://firefly.adobe.com | AI generatif Adobe. Aman komersial, terintegrasi Photoshop & Illustrator | ✅ | ✅ Adobe Affiliate via Commission Junction |
| 32 | **Microsoft Designer** | https://designer.microsoft.com | DALL-E 3 gratis via Microsoft. Buat desain cepat dari prompt teks | ✅ | ❌ |
| 33 | **DreamStudio** | https://dreamstudio.ai | Platform berbasis Stable Diffusion. Kontrol penuh atas output gambar | ✅ | ✅ Ada credit system & referral |

---

## 🎬 Kategori 6: Video & Audio

| # | Nama | URL Utama | Keunggulan Utama | Free Tier | Referral |
|---|------|-----------|-----------------|-----------|---------|
| 34 | **ElevenLabs** | https://elevenlabs.io | Voice synthesis & cloning terealistis. Text-to-speech 32 bahasa termasuk Indonesia ⭐ | ✅ | ✅ 22% recurring 12 bln via PartnerStack |
| 35 | **HeyGen** | https://www.heygen.com | Avatar video AI untuk presentasi, marketing, training. Lip-sync ultra-realistis ⭐ | ✅ terbatas | ✅ Referral program aktif — cek dashboard |
| 36 | **Suno AI** | https://suno.com | Text-to-music AI. Buat lagu lengkap dari lirik & deskripsi genre | ✅ | ✅ Referral — suno.com/r/[kode] |
| 37 | **Udio** | https://www.udio.com | Kompetitor Suno. Kualitas musik AI dengan kontrol lebih banyak | ✅ | ❌ |
| 38 | **Runway ML** | https://runwayml.com | Video generation & editing AI. Digunakan profesional film & kreator konten | ✅ terbatas | ✅ Ada program referral |
| 39 | **Descript** | https://www.descript.com | Edit video/podcast dengan mengedit teks transkrip. Revolusioner untuk editor | ✅ | ✅ Program afiliasi via PartnerStack |
| 40 | **Otter.ai** | https://otter.ai | Transkripsi rapat & meeting otomatis real-time. Integrasi Zoom/Teams ⭐ | ✅ | ✅ Referral program aktif — cek pengaturan akun |
| 41 | **Adobe Podcast** | https://podcast.adobe.com | Perbaiki kualitas audio rekaman otomatis (remove noise). Gratis & powerful | ✅ | ✅ Adobe Affiliate via Commission Junction |

---

## 📊 Kategori 7: Presentasi & Dokumen

| # | Nama | URL Utama | Keunggulan Utama | Free Tier | Referral |
|---|------|-----------|-----------------|-----------|---------|
| 42 | **Gamma App** | https://gamma.app | Buat presentasi, dokumen, webpage dari teks/AI dalam hitungan menit ⭐ | ✅ | ✅ Referral credit — gamma.app/?r=[kode] via PartnerStack |
| 43 | **Tome** | https://tome.app | Storytelling & presentasi interaktif berbasis AI. Cocok untuk pitch deck | ✅ | ✅ Ada program referral — cek website |
| 44 | **Beautiful.ai** | https://www.beautiful.ai | Presentasi yang selalu terlihat profesional & konsisten brand | ✅ terbatas | ✅ Program afiliasi aktif |
| 45 | **MagicSlides** | https://www.magicslides.app | Konversi PDF/teks jadi slide Google Slides atau PowerPoint otomatis | ✅ | ❌ |

---

## ⚙️ Kategori 8: Otomasi & Workflow AI

| # | Nama | URL Utama | Keunggulan Utama | Free Tier | Referral |
|---|------|-----------|-----------------|-----------|---------|
| 46 | **Zapier** | https://zapier.com | Otomasi koneksi 8000+ apps tanpa kode. Standar industri workflow automation ⭐ | ✅ | ✅ Program afiliasi via PartnerStack |
| 47 | **Make** | https://www.make.com | Visual workflow automation. Lebih fleksibel dari Zapier untuk use-case kompleks | ✅ | ✅ 20% recurring via PartnerStack |
| 48 | **n8n** | https://n8n.io | Open-source automation platform. Bisa self-host, ideal untuk developer | ✅ | ✅ Program afiliasi — cek n8n.io/affiliate |

---

## 📁 Kategori 9: Produktivitas & Manajemen

| # | Nama | URL Utama | Keunggulan Utama | Free Tier | Referral |
|---|------|-----------|-----------------|-----------|---------|
| 49 | **Notion AI** | https://www.notion.com | Workspace all-in-one dengan AI terintegrasi. Catatan, project, database, wiki ⭐ | ✅ | ✅ Program afiliasi via PartnerStack (terbatas) |
| 50 | **DeepL Translator** | https://www.deepl.com/translator | Penerjemah dokumen paling akurat. Kualitas terjemahan paling natural ⭐ | ✅ | ✅ Referral program — cek deepl.com/partner |
| 51 | **Reclaim.ai** | https://reclaim.ai | Smart scheduling & time blocking otomatis di Google Calendar | ✅ | ✅ Program afiliasi aktif |
| 52 | **Lex.page** | https://lex.page | AI writing tool berbasis dokumen Google Docs style. Cocok untuk penulis panjang | ✅ | ❌ |

---

## 📈 Kategori 10: SEO & Marketing

| # | Nama | URL Utama | Keunggulan Utama | Free Tier | Referral |
|---|------|-----------|-----------------|-----------|---------|
| 53 | **Surfer SEO** | https://surferseo.com | Audit & optimasi konten SEO berbasis data. Standar industri content marketer ⭐ | ❌ Trial | ✅ 25% lifetime recurring via PartnerStack |
| 54 | **Semrush** | https://www.semrush.com | Suite SEO & marketing terlengkap. Riset kata kunci, backlink, competitor analysis | ✅ terbatas | ✅ Program afiliasi via Impact — komisi tinggi |
| 55 | **Adcreative.ai** | https://www.adcreative.ai | Generate iklan visual & copy berperforma tinggi dengan AI | ❌ Trial | ✅ 30% lifetime recurring — adcreative.ai?ref=[kode] |

---

## 🗳️ Rekomendasi Prioritas Tampilan Widget (Top 15)

Berdasarkan popularitas, relevansi untuk pengguna pemerintahan/ASN, dan ketersediaan free tier:

| Prioritas | Nama | Kategori | Alasan |
|-----------|------|----------|--------|
| ⭐ 1 | ChatGPT | Asisten Umum | Paling dikenal, paling serbaguna |
| ⭐ 2 | Google Gemini | Asisten Umum | Ekosistem Google, bahasa Indonesia baik |
| ⭐ 3 | Claude | Asisten Umum | Terbaik untuk dokumen panjang & PDF |
| ⭐ 4 | Perplexity AI | Riset | Riset dengan sumber terverifikasi |
| ⭐ 5 | NotebookLM | Riset | Upload dokumen & tanya jawab |
| ⭐ 6 | Gamma App | Presentasi | Buat presentasi instan dari teks |
| ⭐ 7 | Canva | Desain | Desain grafis dengan AI |
| ⭐ 8 | ElevenLabs | Video/Audio | Text-to-speech Indonesia |
| ⭐ 9 | DeepL | Produktivitas | Terjemahan paling akurat |
| ⭐ 10 | QuillBot | Penulisan | Parafrase & ringkas teks |
| ⭐ 11 | Otter.ai | Video/Audio | Notulensi rapat otomatis |
| ⭐ 12 | Grammarly | Penulisan | Koreksi grammar |
| ⭐ 13 | Microsoft Copilot | Asisten Umum | Gratis + terintegrasi Office |
| ⭐ 14 | Writesonic | Penulisan | Konten SEO & artikel |
| ⭐ 15 | HeyGen | Video | Video presentasi AI avatar |

---

## 💰 Tabel Referral — Isi Kode Milikmu

> ⚠️ **Penting:** Jangan menebak-nebak format URL referral. Daftar ke program afiliasi resmi masing-masing platform, lalu copy link unik dari dashboard mereka. Format di bawah adalah *contoh format umum* — URL aktualmu bisa berbeda.

| # | Platform | Program Afiliasi | Format URL (Contoh) | Komisi | Kode Referralmu |
|---|----------|-----------------|---------------------|--------|-----------------|
| 1 | **Writesonic** | PartnerStack | `https://writesonic.com/?via=[KODEMU]` | 30% lifetime | `[ISI_DISINI]` |
| 2 | **Copy.ai** | PartnerStack | `https://www.copy.ai/?via=[KODEMU]` | 45% / 12 bln | `[ISI_DISINI]` |
| 3 | **Jasper AI** | Impact | `https://www.jasper.ai/?fpr=[KODEMU]` | Variatif | `[ISI_DISINI]` |
| 4 | **QuillBot** | Internal | `https://quillbot.com/?ref=[KODEMU]` | Ada komisi | `[ISI_DISINI]` |
| 5 | **Grammarly** | Impact | `https://grammarly.com/partner/[KODEMU]` | $0.20-$20/signup | `[ISI_DISINI]` |
| 6 | **Rytr** | Internal | `https://rytr.me/?via=[KODEMU]` | 30% recurring | `[ISI_DISINI]` |
| 7 | **GitHub Copilot** | Impact (GitHub) | `https://github.com/features/copilot?via=[KODEMU]` | Variatif | `[ISI_DISINI]` |
| 8 | **Perplexity** | dub.co | `https://pplx.ai/[USERNAME]` | Variatif | `[ISI_DISINI]` |
| 9 | **Canva** | Impact | `https://www.canva.com/?signup_ref=[KODEMU]` | Per signup | `[ISI_DISINI]` |
| 10 | **Leonardo AI** | Internal | `https://leonardo.ai/?via=[KODEMU]` | Ada kredit | `[ISI_DISINI]` |
| 11 | **Adobe** | CJ Affiliate | `https://adobe.com/?a_bid=[KODEMU]` | % per sales | `[ISI_DISINI]` |
| 12 | **ElevenLabs** | PartnerStack | `https://elevenlabs.io/?ref=[KODEMU]` | 22% / 12 bln | `[ISI_DISINI]` |
| 13 | **HeyGen** | Internal | `https://www.heygen.com/?ref=[KODEMU]` | Ada komisi | `[ISI_DISINI]` |
| 14 | **Suno AI** | Internal | `https://suno.com/r/[KODEMU]` | Ada kredit | `[ISI_DISINI]` |
| 15 | **Runway ML** | Internal | `https://runwayml.com/?ref=[KODEMU]` | Ada komisi | `[ISI_DISINI]` |
| 16 | **Descript** | PartnerStack | `https://www.descript.com/?ref=[KODEMU]` | Ada komisi | `[ISI_DISINI]` |
| 17 | **Otter.ai** | Internal | `https://otter.ai/?ref=[KODEMU]` | Ada komisi | `[ISI_DISINI]` |
| 18 | **Gamma App** | PartnerStack | `https://gamma.app/?r=[KODEMU]` | Credit/referral | `[ISI_DISINI]` |
| 19 | **Zapier** | PartnerStack | `https://zapier.com/?ref=[KODEMU]` | Ada komisi | `[ISI_DISINI]` |
| 20 | **Make** | PartnerStack | `https://www.make.com/?ref=[KODEMU]` | 20% recurring | `[ISI_DISINI]` |
| 21 | **n8n** | Internal | `https://n8n.io/?ref=[KODEMU]` | Ada komisi | `[ISI_DISINI]` |
| 22 | **Notion** | PartnerStack | `https://www.notion.com/?ref=[KODEMU]` | Ada komisi | `[ISI_DISINI]` |
| 23 | **DeepL** | deepl.com/partner | `https://www.deepl.com/?via=[KODEMU]` | Ada komisi | `[ISI_DISINI]` |
| 24 | **Reclaim.ai** | Internal | `https://reclaim.ai/?ref=[KODEMU]` | Ada komisi | `[ISI_DISINI]` |
| 25 | **Surfer SEO** | PartnerStack | `https://surferseo.com/?ref=[KODEMU]` | 25% lifetime | `[ISI_DISINI]` |
| 26 | **Semrush** | Impact | `https://www.semrush.com/?ref=[KODEMU]` | Komisi tinggi | `[ISI_DISINI]` |
| 27 | **Adcreative.ai** | Internal | `https://www.adcreative.ai?ref=[KODEMU]` | 30% lifetime | `[ISI_DISINI]` |

---

## 🛠️ Panduan Implementasi di QuickLinksWidget.tsx

Setelah mengumpulkan kode referral, update struktur data di widget:

```typescript
// Tambah field referralUrl ke interface (buat baru atau tambah ke PersonalLink)
interface AILink {
  id: string;
  judul: string;
  url: string;           // URL utama (fallback / untuk favicon)
  referralUrl?: string;  // URL referral (prioritas dibuka jika ada)
  deskripsi: string;
  kategori?: string;
  hasFreeplan?: boolean;
}

const RECOMMENDED_AI_LINKS: AILink[] = [
  { 
    id: 'ai-1', 
    judul: 'ChatGPT', 
    url: 'https://chatgpt.com/', 
    // referralUrl tidak diisi karena tidak ada program afiliasi
    deskripsi: 'Asisten AI Serbaguna (Drafting & Ide)', 
    kategori: 'Asisten Umum',
    hasFreeplan: true,
  },
  { 
    id: 'ai-7', 
    judul: 'Gamma App', 
    url: 'https://gamma.app/', 
    referralUrl: 'https://gamma.app/?r=KODE_REFERRALMU', // ganti dengan kode asli
    deskripsi: 'Pembuatan Presentasi Otomatis', 
    kategori: 'Presentasi',
    hasFreeplan: true,
  },
];

// Di komponen, buka referralUrl jika tersedia, fallback ke url biasa:
onClick={() => window.open(link.referralUrl ?? link.url, '_blank')}
```

---

## ✅ Checklist Sebelum Launch Fitur

- [ ] Daftar ke program afiliasi setiap platform yang dipilih
- [ ] Salin URL referral unik dari dashboard masing-masing
- [ ] Update file ini dengan kode referral aktual
- [ ] Update array `RECOMMENDED_AI_LINKS` di `QuickLinksWidget.tsx`
- [ ] Test klik link → pastikan redirect ke URL referral dengan benar
- [ ] (Opsional) Tambahkan tooltip/badge kecil indikator "via Ruang Sigap"

---

*Dokumen dibuat: Agustus 2026 | Update berkala sesuai perkembangan platform AI*
