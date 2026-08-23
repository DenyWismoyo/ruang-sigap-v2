export interface MarkdownTemplate {
    id: string;
    nama: string;
    kategori: string;
    konten: string;
}

export const markdownTemplates: MarkdownTemplate[] = [
    {
        id: 'kop-surat',
        nama: 'Kerangka Kop Surat (Standar)',
        kategori: 'Kop Surat Saja',
        konten: `<div align="center">
<strong>PEMERINTAH KABUPATEN DAERAH</strong><br/>
<strong>NAMA INSTANSI / OPD</strong><br/>
Jl. Contoh Alamat No. 123, Telp. (0123) 456789
<br/>Website: www.contoh.go.id | Email: email@contoh.go.id
</div>

---`
    },
    {
        id: 'undangan-rapat',
        nama: 'Undangan Rapat Resmi',
        kategori: 'Undangan',
        konten: `<div align="right">
Nama Kota, {{tanggal}}<br/>
Kepada Yth.<br/>
<strong>{{kepada}}</strong><br/>
{{di_tempat}}
</div>

**Nomor:** {{no_surat}}<br/>
**Sifat:** {{sifat}}<br/>
**Lampiran:** {{lampiran}}<br/>
**Hal:** Undangan Rapat

Dengan hormat,

Sehubungan dengan akan dilaksanakannya evaluasi program kerja tahunan, maka dengan ini kami mengundang Bapak/Ibu untuk hadir pada acara rapat yang akan diselenggarakan pada:

| | |
| --- | --- |
| **Hari, Tanggal** | {{hari}}, {{tanggal_acara}} |
| **Waktu** | {{waktu}} s.d. selesai |
| **Tempat** | {{tempat}} |
| **Acara** | {{acara}} |

Mengingat pentingnya acara tersebut, kehadiran Bapak/Ibu sangat kami harapkan tepat pada waktunya.

Demikian undangan ini kami sampaikan, atas perhatian dan kehadirannya diucapkan terima kasih.

<br/><br/>
<div align="right">
<strong>{{jabatan_pengirim}}</strong>
<br/><br/><br/><br/>
<strong><u>{{nama_pengirim}}</u></strong><br/>
NIP. {{nip_pengirim}}
</div>
`
    },
    {
        id: 'nota-dinas',
        nama: 'Nota Dinas',
        kategori: 'Nota Dinas',
        konten: `<div align="center">
<strong><u>NOTA DINAS</u></strong>
</div>

<br/>

| | |
| --- | --- |
| **Kepada Yth** | {{kepada}} |
| **Dari** | {{nama_pengirim}} / {{jabatan_pengirim}} |
| **Tanggal** | {{tanggal}} |
| **Nomor** | {{no_surat}} |
| **Sifat** | {{sifat}} |
| **Hal** | {{perihal}} |

---

Menindaklanjuti perihal tersebut di atas, bersama ini kami sampaikan laporan sebagai berikut:

1. **Dasar Hukum / Latar Belakang**
   {{dasar_hukum}}

2. **Isi Laporan / Pelaksanaan**
   {{isi_laporan}}

3. **Kesimpulan dan Saran**
   {{kesimpulan}}

Demikian nota dinas ini disampaikan untuk menjadikan maklum dan mohon arahan lebih lanjut.

<br/><br/>
<div align="right">
<strong>{{jabatan_pengirim}}</strong>
<br/><br/><br/><br/>
<strong><u>{{nama_pengirim}}</u></strong><br/>
NIP. {{nip_pengirim}}
</div>
`
    },
    {
        id: 'surat-tugas',
        nama: 'Surat Tugas Perjalanan Dinas',
        kategori: 'Surat Tugas',
        konten: `<div align="center">
<strong><u>SURAT TUGAS</u></strong><br/>
Nomor: {{no_surat}}
</div>

<br/>

Yang bertanda tangan di bawah ini:

| | |
| --- | --- |
| **Nama** | {{nama_pengirim}} |
| **NIP** | {{nip_pengirim}} |
| **Jabatan** | {{jabatan_pengirim}} |

Dengan ini memberikan tugas kepada:

| | |
| --- | --- |
| **Nama** | {{nama_pegawai}} |
| **NIP** | {{nip_pegawai}} |
| **Pangkat/Golongan** | {{golongan_pegawai}} |
| **Jabatan** | {{jabatan_pegawai}} |

**Maksud Perjalanan Dinas:** <br/>
Melaksanakan {{perihal}}

**Tempat Tujuan:** <br/>
{{tempat_tujuan}}

**Lama Perjalanan Dinas:** <br/>
Selama {{lama_hari}} hari, berangkat tanggal {{tanggal_berangkat}} dan kembali tanggal {{tanggal_kembali}}.

Demikian Surat Tugas ini diberikan untuk dilaksanakan dengan penuh tanggung jawab dan segera melaporkan hasilnya setelah selesai melaksanakan tugas.

<br/><br/>
<div align="right">
Dikeluarkan di: Nama Kota<br/>
Pada Tanggal: {{tanggal}}
<br/><br/>
<strong>{{jabatan_pengirim}}</strong>
<br/><br/><br/><br/>
<strong><u>{{nama_pengirim}}</u></strong><br/>
NIP. {{nip_pengirim}}
</div>
`
    },
    {
        id: 'surat-edaran',
        nama: 'Surat Edaran Internal',
        kategori: 'Surat Edaran',
        konten: `<div align="center">
<strong><u>SURAT EDARAN</u></strong><br/>
Nomor: {{no_surat}}
<br/><br/>
TENTANG<br/>
<strong>{{perihal_edaran}}</strong>
</div>

<br/>

**1. Latar Belakang**<br/>
Memperhatikan dan menindaklanjuti peraturan terkait {{dasar_aturan}}, maka diperlukan penyesuaian di lingkungan organisasi.

**2. Maksud dan Tujuan**<br/>
Surat Edaran ini dimaksudkan untuk memberikan panduan bagi seluruh pegawai terkait penerapan ketentuan tersebut di atas, dengan tujuan {{tujuan_edaran}}.

**3. Isi Edaran**<br/>
Berkenaan dengan hal tersebut, kami menginstruksikan kepada seluruh pegawai untuk:
- Melaksanakan kewajiban sesuai poin a.
- Mematuhi tata tertib pada poin b.
- {{isi_edaran_tambahan}}

**4. Penutup**<br/>
Surat Edaran ini mulai berlaku pada tanggal ditetapkan. Demikian untuk menjadi perhatian dan dilaksanakan sebagaimana mestinya.

<br/><br/>
<div align="right">
Ditetapkan di: Nama Kota<br/>
Tanggal: {{tanggal}}
<br/><br/>
<strong>{{jabatan_pengirim}}</strong>
<br/><br/><br/><br/>
<strong><u>{{nama_pengirim}}</u></strong><br/>
NIP. {{nip_pengirim}}
</div>
`
    }
];
