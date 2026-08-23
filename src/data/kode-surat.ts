export interface KodeKlasifikasi {
    kode: string;
    deskripsi: string;
    kategori: string;
}

export const KODE_KLASIFIKASI_SURAT: KodeKlasifikasi[] = [
    // 000 UMUM
    { kode: "000", deskripsi: "Umum", kategori: "UMUM" },
    { kode: "005", deskripsi: "Undangan", kategori: "UMUM" },
    { kode: "010", deskripsi: "Urusan Dalam (Fasilitas, Gedung)", kategori: "UMUM" },
    { kode: "020", deskripsi: "Peralatan (Barang, Inventaris)", kategori: "UMUM" },
    { kode: "040", deskripsi: "Perpustakaan, Dokumentasi, Kearsipan", kategori: "UMUM" },
    { kode: "050", deskripsi: "Perencanaan", kategori: "UMUM" },
    { kode: "060", deskripsi: "Organisasi dan Tata Laksana", kategori: "UMUM" },
    { kode: "070", deskripsi: "Penelitian", kategori: "UMUM" },
    { kode: "090", deskripsi: "Perjalanan Dinas", kategori: "UMUM" },

    // 100 PEMERINTAHAN
    { kode: "100", deskripsi: "Pemerintahan", kategori: "PEMERINTAHAN" },
    { kode: "110", deskripsi: "Pemerintahan Pusat", kategori: "PEMERINTAHAN" },
    { kode: "120", deskripsi: "Pemerintah Propinsi", kategori: "PEMERINTAHAN" },
    { kode: "130", deskripsi: "Pemerintah Kabupaten / Kota", kategori: "PEMERINTAHAN" },
    { kode: "140", deskripsi: "Pemerintahan Desa / Kelurahan", kategori: "PEMERINTAHAN" },
    { kode: "160", deskripsi: "DPRD", kategori: "PEMERINTAHAN" },

    // 200 POLITIK
    { kode: "200", deskripsi: "Politik", kategori: "POLITIK" },
    { kode: "270", deskripsi: "Pemilihan Umum (KPU)", kategori: "POLITIK" },

    // 300 KEAMANAN DAN KETERTIBAN
    { kode: "300", deskripsi: "Keamanan dan Ketertiban", kategori: "KEAMANAN" },
    { kode: "330", deskripsi: "Ketentraman dan Ketertiban Umum", kategori: "KEAMANAN" },

    // 400 KESEJAHTERAAN RAKYAT
    { kode: "400", deskripsi: "Kesejahteraan Rakyat", kategori: "KESRA" },
    { kode: "410", deskripsi: "Pembangunan Desa", kategori: "KESRA" },
    { kode: "420", deskripsi: "Pendidikan", kategori: "KESRA" },
    { kode: "430", deskripsi: "Kebudayaan", kategori: "KESRA" },
    { kode: "440", deskripsi: "Kesehatan", kategori: "KESRA" },
    { kode: "450", deskripsi: "Agama", kategori: "KESRA" },
    { kode: "460", deskripsi: "Sosial", kategori: "KESRA" },

    // 500 PEREKONOMIAN
    { kode: "500", deskripsi: "Perekonomian", kategori: "PEREKONOMIAN" },
    { kode: "510", deskripsi: "Perdagangan", kategori: "PEREKONOMIAN" },
    { kode: "520", deskripsi: "Pertanian", kategori: "PEREKONOMIAN" },
    { kode: "530", deskripsi: "Perindustrian", kategori: "PEREKONOMIAN" },
    { kode: "550", deskripsi: "Perhubungan", kategori: "PEREKONOMIAN" },
    { kode: "580", deskripsi: "Perbankan / Moneter", kategori: "PEREKONOMIAN" },

    // 600 PEKERJAAN UMUM DAN KETENAGAAN
    { kode: "600", deskripsi: "Pekerjaan Umum dan Ketenagaan", kategori: "PU & KETENAGAAN" },
    { kode: "610", deskripsi: "Pengairan", kategori: "PU & KETENAGAAN" },
    { kode: "620", deskripsi: "Jalan", kategori: "PU & KETENAGAAN" },
    { kode: "650", deskripsi: "Bangunan", kategori: "PU & KETENAGAAN" },

    // 700 PENGAWASAN
    { kode: "700", deskripsi: "Pengawasan", kategori: "PENGAWASAN" },
    { kode: "710", deskripsi: "Bidang Pemerintahan", kategori: "PENGAWASAN" },
    { kode: "730", deskripsi: "Bidang Keuangan", kategori: "PENGAWASAN" },

    // 800 KEPEGAWAIAN
    { kode: "800", deskripsi: "Kepegawaian", kategori: "KEPEGAWAIAN" },
    { kode: "810", deskripsi: "Pengadaan Pegawai", kategori: "KEPEGAWAIAN" },
    { kode: "820", deskripsi: "Mutasi, Kepangkatan", kategori: "KEPEGAWAIAN" },
    { kode: "830", deskripsi: "Kedudukan", kategori: "KEPEGAWAIAN" },
    { kode: "840", deskripsi: "Kesejahteraan Pegawai", kategori: "KEPEGAWAIAN" },
    { kode: "850", deskripsi: "Cuti Pegawai", kategori: "KEPEGAWAIAN" },
    { kode: "860", deskripsi: "Penilaian, Hukuman Disiplin", kategori: "KEPEGAWAIAN" },

    // 900 KEUANGAN
    { kode: "900", deskripsi: "Keuangan", kategori: "KEUANGAN" },
    { kode: "910", deskripsi: "Anggaran", kategori: "KEUANGAN" },
    { kode: "970", deskripsi: "Pendapatan", kategori: "KEUANGAN" },
    { kode: "980", deskripsi: "Pembinaan Bendaharawan", kategori: "KEUANGAN" },
];
