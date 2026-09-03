const { jsPDF } = require('jspdf');
const autoTableModule = require('jspdf-autotable');
const autoTable = autoTableModule.default || autoTableModule;
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '..', 'public', 'docs', 'stp');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// 1. GENERATE PANDUAN RINGKAS PENGGUNA PDF
function generatePanduanPDF() {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const primaryColor = [26, 86, 219]; // Royal Blue
    const darkColor = [30, 41, 59]; // Slate 800
    const textMuted = [100, 116, 139]; // Slate 500

    // Header Banner
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('PANDUAN RINGKAS PENGGUNAAN SIGAP E-OFFICE', 14, 13);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('UPTD Kawasan Sains dan Teknologi Solo Technopark | https://sgp.omnifit.cloud', 14, 21);

    let y = 36;

    // Box Akses Aplikasi
    doc.setFillColor(239, 246, 255); // Blue 50
    doc.setDrawColor(191, 219, 254); // Blue 200
    doc.roundedRect(14, y, 182, 16, 2, 2, 'FD');

    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Tautan Akses Aplikasi Resmi:', 18, y + 6);

    doc.setTextColor(...darkColor);
    doc.setFont('helvetica', 'normal');
    doc.text('Buka browser (Chrome / Safari / Edge) di HP atau Laptop: https://sgp.omnifit.cloud', 18, y + 11);

    y += 24;

    const sections = [
        {
            title: '1. Cara Login ke Aplikasi',
            icon: '[AKUN]',
            steps: [
                'Buka alamat https://sgp.omnifit.cloud di peramban browser Anda.',
                'Untuk Pegawai BLUD & ASN: Pilih tab "Masuk dengan NIP/NIK", ketik NIK/NIP dan Password (Default: StpUser2026!).',
                'Untuk Admin OPD / Staf TU: Pilih tab "Masuk dengan Email" atau klik "Masuk dengan Google".',
                'Klik tombol "Masuk" untuk menuju Dashboard Instansi Anda.'
            ]
        },
        {
            title: '2. Tata Usaha (TU) - Upload Surat Masuk',
            icon: '[TU]',
            steps: [
                'Buka menu "Kotak Masuk / Persuratan" lalu klik "Upload Surat Baru".',
                'Pilih berkas PDF surat masuk (maks. 5MB).',
                'Gunakan fitur AI "Baca Otomatis" untuk mengekstrak nomor surat, perihal, pengirim, dan tanggal/jam agenda secara otomatis.',
                'Arahkan ke Pimpinan Awal: Pilih pimpinan tujuan (misal: Kepala UPTD atau Pemimpin BLUD).',
                'Klik "Simpan & Unggah" -> Surat otomatis masuk ke feed Ruang Kerja Pimpinan secara real-time.'
            ]
        },
        {
            title: '3. Pimpinan - Memberikan Disposisi',
            icon: '[PIMPINAN]',
            steps: [
                'Buka menu "Ruang Kerja" (atau buka surat dari Kotak Masuk).',
                'Surat baru yang belum didisposisi akan berada pada daftar "Perlu Tindakan".',
                'Klik tombol "Disposisi", centang nama bawahan penerima (bisa multi-penerima), pilih instruksi kerja, dan berikan catatan arahan.',
                'Opsi Tambahan: Pilih "Tindak Lanjut Mandiri" jika pimpinan akan menghadiri/menyelesaikan surat sendiri.',
                'Klik "Kirim Disposisi" -> Bawahan akan langsung menerima notifikasi dan antrean tugas.'
            ]
        },
        {
            title: '4. Penerima Disposisi - Ruang Kerja Digital',
            icon: '[STAF]',
            steps: [
                'Semua tugas dan disposisi yang Anda terima berkumpul di menu "Ruang Kerja".',
                'Klik kartu tugas untuk membaca instruksi disposisi dan mengunduh berkas PDF asli.',
                'Pejabat Struktural / Koordinator dapat mendisposisikan kembali ke staf pelaksana di bawahnya (Disposisi Berjenjang).',
                'Staf Pelaksana melaksanakan instruksi tugas sesuai arahan pimpinan.'
            ]
        },
        {
            title: '5. Staf - Mengirimkan Laporan Tindak Lanjut & Kinerja',
            icon: '[LAPOR]',
            steps: [
                'Pada kartu tugas di menu "Ruang Kerja", klik tombol "Tindak Lanjut / Lapor".',
                'Ketik ringkasan hasil pelaksanaan tugas pada kolom uraian tindak lanjut.',
                'Sertakan tautan dokumen pendukung (Google Drive / tautan berkas) atau lampirkan foto dokumentasi.',
                'Centang opsi "Catat ke Logbook Kinerja" agar otomatis dihitung sebagai bukti E-Kinerja harian Anda.',
                'Klik "Kirim Laporan & Selesaikan" -> Status surat berubah "Selesai" dan terekam di audit trail.'
            ]
        }
    ];

    sections.forEach((sec, idx) => {
        if (y > 255) {
            doc.addPage();
            y = 20;
        }

        // Section Title
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(14, y, 182, 8, 1, 1, 'F');

        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.text(sec.title, 18, y + 5.5);

        y += 11;

        doc.setTextColor(...darkColor);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);

        sec.steps.forEach((step) => {
            const lines = doc.splitTextToSize(`* ${step}`, 174);
            doc.text(lines, 18, y);
            y += lines.length * 4.2;
        });

        y += 3;
    });

    // Footer Box
    if (y > 260) {
        doc.addPage();
        y = 20;
    }
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y, 182, 12, 1, 1, 'FD');

    doc.setTextColor(...textMuted);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text('Alur Singkat: TU Upload Surat -> Pimpinan Disposisi -> Staf Eksekusi di Ruang Kerja -> Kirim Laporan Selesai & Logbook', 18, y + 7);

    const filePath = path.join(outputDir, 'PANDUAN_RINGKAS_PENGGUNA.pdf');
    doc.save(filePath);
    console.log('Saved:', filePath);
}

// 2. GENERATE DAFTAR AKUN PEGAWAI BLUD STP PDF
function generateDaftarAkunPDF() {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const primaryColor = [16, 185, 129]; // Emerald Green for BLUD
    const headerColor = [15, 118, 110]; // Teal 700
    const darkColor = [30, 41, 59];

    // Header Banner
    doc.setFillColor(...headerColor);
    doc.rect(0, 0, 210, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('DAFTAR AKUN PEGAWAI BLUD SOLO TECHNOPARK 2026', 14, 13);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text('SIGAP E-Office | Login: https://sgp.omnifit.cloud | Password Default: StpUser2026!', 14, 21);

    const userRawData = [
        ["1", "Yudit Cahyantoro Nyoto Saputro, S.T., M.T.", "33720130037220002", "Pemimpin BLUD", "StpUser2026!"],
        ["2", "Ariyani Oktaviana Rakhmawati, SE.", "3311126310720003", "Kepala Divisi Akuntansi", "StpUser2026!"],
        ["3", "Salsa Bella Radifa, S.Ak.", "3372055209010003", "Staf Keuangan", "StpUser2026!"],
        ["4", "Anang Handyka Pratama, S.Akun", "3310181504970001", "Kepala Divisi Anggaran", "StpUser2026!"],
        ["5", "Budiharto, ST.", "3313031401870001", "Kepala Divisi Pengelolaan Aset", "StpUser2026!"],
        ["6", "Untung Priyohananto, S.E.", "3402113105770002", "Pejabat Teknis Umum", "StpUser2026!"],
        ["7", "Ani Anggraeni, SE.", "3372054508850028", "Kepala Divisi Administrasi dan Kepegawaian", "StpUser2026!"],
        ["8", "Renny Widyaningsih, S.Ak.", "3313115401930001", "Staf Kesekretariatan", "StpUser2026!"],
        ["9", "Oktafianto Nugroho, ST.", "3372051510870003", "Kepala Divisi Logistik", "StpUser2026!"],
        ["10", "Nanang Dwi Setiawan", "3372040503820026", "Driver", "StpUser2026!"],
        ["11", "Agus Jatmiko, S.Kom", "3309111507919004", "Kepala Divisi Information Technology", "StpUser2026!"],
        ["12", "Muhammad Restu Choiri, A.Md", "3311121807010004", "Staf Information Technology", "StpUser2026!"],
        ["13", "Danang Cahyono", "3313121803810001", "Kepala Divisi Pemberdayaan Kawasan", "StpUser2026!"],
        ["14", "Lucia Citra Hirawati, SE.", "3175094404750009", "Kepala Divisi Public Relation", "StpUser2026!"],
        ["15", "Tegar Pinatar, SE.", "3372052806900007", "Staf Pemberdayaan Kawasan 1", "StpUser2026!"],
        ["16", "Rika Dewi Savitri, ST.", "3372034602810003", "Staf Pemberdayaan Kawasan 2", "StpUser2026!"],
        ["17", "Anang Tri Ruwiyanto, ST.", "3372012407780006", "Staff Maintenance 1", "StpUser2026!"],
        ["18", "Sri Purwanto", "3372040305800002", "Staff Maintenance 2", "StpUser2026!"],
        ["19", "Sarino", "3313132801730002", "Staff Maintenance 3", "StpUser2026!"],
        ["20", "Sapardi", "3372042109710002", "House Keeping", "StpUser2026!"],
        ["21", "Susilo Budi Arianto, S.T.", "3372013001830003", "Manager Dukungan Bisnis Pelayanan & Pengembangan", "StpUser2026!"],
        ["22", "Riza Kurniawan, SH.", "3372010311890001", "Kepala Divisi Kerjasama dan Hukum", "StpUser2026!"],
        ["23", "Yuli Tri Hartuti, SH.", "3372054407840004", "Staf Divisi Kerjasama dan Hukum 1", "StpUser2026!"],
        ["24", "Alfian Sherendra Zulfa, SH.", "3372050702020002", "Staf Divisi Kerjasama dan Hukum 2", "StpUser2026!"],
        ["25", "Thessa Anial John, SH.", "3372056003960008", "Marketing Officer", "StpUser2026!"],
        ["26", "Abednego Danu Setyawan, A.Md", "3372050408830044", "Kepala Divisi Riset dan Inkubator", "StpUser2026!"],
        ["27", "Ridho Adi Prabowo, SE.", "3314020405970004", "Staf Riset dan Inkubator 1", "StpUser2026!"],
        ["28", "Prasetyo Okmana Saputra, S.Sos", "3313130510010001", "Staf Riset dan Inkubator 2", "StpUser2026!"],
        ["29", "Arief Wibowo", "3311090807790007", "Kepala Divisi Diklat", "StpUser2026!"],
        ["30", "Erwin Sudrajat", "3372012509890004", "Kepala Divisi Welding Edukasi", "StpUser2026!"],
        ["31", "Jati Utomo", "3372012906850023", "Toolman dan Expedisi", "StpUser2026!"],
        ["32", "Sri Hartono", "3372041010920005", "Operator Welding", "StpUser2026!"],
        ["33", "Eva Sofyana", "3372027105870001", "Marketing Diklat", "StpUser2026!"],
        ["34", "Andre Firmansyah", "3314013009010003", "Support OGSCI", "StpUser2026!"],
        ["35", "Agus Munaji, S.Kom", "3311121408880002", "Instruktur Welding", "StpUser2026!"],
        ["36", "Anton Efendi", "3372011804840003", "Instruktur Milling", "StpUser2026!"],
        ["37", "Mulyanto", "3311092110850002", "Instruktur Grinding", "StpUser2026!"],
        ["38", "Putra Adi Widrajat, A.Md.", "3308081102830001", "Instruktur Bubut", "StpUser2026!"],
        ["39", "Agus Wahyudi", "3372051008850013", "Instruktur Kerja Bangku", "StpUser2026!"],
        ["40", "Tommy Trisula Putra, ST.", "3372021204910001", "Instruktur Cadcam/ Gambar Teknik", "StpUser2026!"],
        ["41", "Febri Arif Purnomo, A.Md", "3372052202890003", "Kepala Divisi Produksi Dan Pemasaran", "StpUser2026!"],
        ["42", "Bangun Fajar Kusnanto", "3372041604940002", "Operator Manual", "StpUser2026!"],
        ["43", "Jarot Sutono", "3314052106990001", "Programer CNC Bubut", "StpUser2026!"],
        ["44", "Farid Mahendra", "3372022711990001", "Programer CNC Milling 1", "StpUser2026!"],
        ["45", "Andreas", "3372041905020001", "Operator CNC Milling", "StpUser2026!"],
        ["46", "Dio Achmad Thoriq", "3372012009020002", "Programer CNC Milling 2", "StpUser2026!"],
        ["47", "Tammarizqi Arsyinta Putrie", "3317077103020001", "Staff Admin Produksi", "StpUser2026!"]
    ];

    autoTable(doc, {
        startY: 32,
        head: [['No', 'Nama Lengkap', 'NIK (Username)', 'Nama Jabatan', 'Password Default']],
        body: userRawData,
        theme: 'striped',
        headStyles: {
            fillColor: headerColor,
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 8.5
        },
        bodyStyles: {
            fontSize: 8,
            textColor: darkColor
        },
        alternateRowStyles: {
            fillColor: [240, 253, 250] // Teal 50
        },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 55 },
            2: { cellWidth: 38, fontStyle: 'bold', textColor: [15, 118, 110] },
            3: { cellWidth: 55 },
            4: { cellWidth: 26, fontStyle: 'italic', textColor: [100, 116, 139] }
        },
        margin: { left: 13, right: 13 }
    });

    const filePath = path.join(outputDir, 'DAFTAR_AKUN_PEGAWAI_BLUD_STP.pdf');
    doc.save(filePath);
    console.log('Saved:', filePath);
}

// 3. GENERATE DAFTAR AKUN PEGAWAI ASN STP PDF
function generateDaftarAkunAsnPDF() {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const headerColor = [30, 58, 138]; // Royal Blue 900
    const darkColor = [30, 41, 59];

    // Header Banner
    doc.setFillColor(...headerColor);
    doc.rect(0, 0, 210, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('DAFTAR AKUN PEGAWAI ASN SOLO TECHNOPARK', 14, 13);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text('SIGAP E-Office | Login: https://sgp.omnifit.cloud | Tab: Masuk dengan NIP/NIK', 14, 21);

    const userRawData = [
        ["1", "RONY WIDJANARKO, S.H., M.H.", "198412112009121002", "Kepala UPTD Kawasan Sains dan Teknologi Solo Technopark", "Rony1211"],
        ["2", "DENY WISMOYO, S.STP", "199311012016091003", "Kepala Subbagian Tata Usaha UPTD KST Solo Technopark", "Deny1101"],
        ["3", "WAHYU KURNIAWAN, ST", "198506082009031004", "Penelaah Teknis Kebijakan", "Wonosobo.juni2024"],
        ["4", "ALVIN PRAYOGO ANINDITO, A.Md. Ak.", "199308042025211016", "Pengelola Layanan Operasional 1", "Alvin1923"],
        ["5", "MUHAMMAD FAJAR AL FANDYARI", "199810202025211006", "Pengelola Layanan Operasional 2", "Alfandy51"],
        ["6", "RADITYA GUNTUR DEWANGGA", "199309092025211019", "Pengelola Layanan Operasional 3", "ditraditya09"],
        ["7", "AGUS TRI HANANTO, SE", "198508032004121003", "Pengolah Data dan Informasi", "5Tp12345@"]
    ];

    autoTable(doc, {
        startY: 34,
        head: [['No', 'Nama Lengkap', 'NIP (Username)', 'Nama Jabatan', 'Password Akun']],
        body: userRawData,
        theme: 'striped',
        headStyles: {
            fillColor: headerColor,
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 8.5
        },
        bodyStyles: {
            fontSize: 8.5,
            textColor: darkColor
        },
        alternateRowStyles: {
            fillColor: [239, 246, 255] // Blue 50
        },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 55 },
            2: { cellWidth: 40, fontStyle: 'bold', textColor: [30, 58, 138] },
            3: { cellWidth: 50 },
            4: { cellWidth: 29, fontStyle: 'bold', textColor: [185, 28, 28] }
        },
        margin: { left: 13, right: 13 }
    });

    const filePath = path.join(outputDir, 'DAFTAR_AKUN_PEGAWAI_ASN_STP.pdf');
    doc.save(filePath);
    console.log('Saved:', filePath);
}

try {
    generatePanduanPDF();
    generateDaftarAkunPDF();
    generateDaftarAkunAsnPDF();
    console.log("SUCCESS Generating all STP PDFs!");
} catch (e) {
    console.error("ERROR Generating PDFs:", e);
    process.exit(1);
}
