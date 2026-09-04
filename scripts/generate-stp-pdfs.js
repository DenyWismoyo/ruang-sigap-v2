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
        ["2", "Ariyani Oktaviana Rakhmawati, SE.", "14.231072.2012", "Kepala Divisi Akuntansi", "StpUser2026!"],
        ["3", "Salsa Bella Radifa, S.Ak.", "2026.120901.77", "Staf Keuangan", "StpUser2026!"],
        ["4", "Anang Handyka Pratama, S.Akun", "28.150497.2022", "Kepala Divisi Anggaran", "StpUser2026!"],
        ["5", "Budiharto, ST.", "02.140187.2005", "Kepala Divisi Pemasaran dan Marketing", "StpUser2026!"],
        ["6", "Untung Priyohananto, S.E.", "3402113105770002", "Pejabat Teknis Umum", "StpUser2026!"],
        ["7", "Ani Anggraeni, SE.", "11.050885.2010", "Kepala Divisi Administrasi dan Kepegawaian", "StpUser2026!"],
        ["8", "Renny Widyaningsih, S.Ak.", "1450-12-14", "Staf Kesekretariatan", "StpUser2026!"],
        ["9", "Oktafianto Nugroho, ST.", "04.151087.2007", "Kepala Divisi Logistik", "StpUser2026!"],
        ["10", "Nanang Dwi Setiawan", "13.050382.2012", "Driver", "StpUser2026!"],
        ["11", "Agus Jatmiko, S.Kom", "09.150791.2010", "Kepala Divisi Information Technology", "StpUser2026!"],
        ["12", "Muhammad Restu Choiri, A.Md", "2023.180701.63", "Staf Information Technology", "StpUser2026!"],
        ["13", "Danang Cahyono", "07.180381.2009", "Kepala Divisi Pemberdayaan Kawasan", "StpUser2026!"],
        ["14", "Lucia Citra Hirawati, SE.", "08.040475.2009", "Kepala Divisi Public Relation", "StpUser2026!"],
        ["15", "Tegar Pinatar, SE.", "27.280690.2021", "Staf Pemberdayaan Kawasan 1", "StpUser2026!"],
        ["16", "Rika Dewi Savitri, ST.", "2024.060281.73", "Marketing Pemberdayaan Kawasan", "StpUser2026!"],
        ["17", "Anang Tri Ruwiyanto, ST.", "06.240778.2009", "Staff Maintenance 1", "StpUser2026!"],
        ["18", "Sri Purwanto", "20.030580.2013", "Staff Maintenance 2", "StpUser2026!"],
        ["19", "Sarino", "21.280173.2013", "Staff Maintenance 3", "StpUser2026!"],
        ["20", "Sapardi", "19.210971.2012", "House Keeping", "StpUser2026!"],
        ["21", "Susilo Budi Arianto, S.T.", "12.300183.2010", "Manager Dukungan Bisnis Pelayanan & Pengembangan", "StpUser2026!"],
        ["22", "Riza Kurniawan, SH.", "26.031189.2021", "Kepala Divisi Kerjasama dan Hukum", "StpUser2026!"],
        ["23", "Yuli Tri Hartuti, SH.", "29.040784.2022", "Staf Divisi Kerjasama dan Hukum 1", "StpUser2026!"],
        ["24", "Alfian Sherendra Zulfa, SH.", "2024.070202.70", "Staf Divisi Kerjasama dan Hukum 2", "StpUser2026!"],
        ["25", "Thessa Anial John, SH.", "2023.200396.59", "Marketing Officer", "StpUser2026!"],
        ["26", "Abednego Danu Setyawan, A.Md", "15.040883.2012", "Kepala Divisi Riset dan Inkubator", "StpUser2026!"],
        ["27", "Ridho Adi Prabowo, SE.", "30.040597.2022", "Staf Riset dan Inkubator 1", "StpUser2026!"],
        ["28", "Prasetyo Okmana Saputra, S.Sos", "2025.051001.76", "Staf Riset dan Inkubator 2", "StpUser2026!"],
        ["29", "Arief Wibowo", "16.080779.2012", "Kepala Divisi Diklat", "StpUser2026!"],
        ["30", "Erwin Sudrajat", "17.250989.2012", "Kepala Divisi Welding Edukasi", "StpUser2026!"],
        ["31", "Jati Utomo", "18.290685.2012", "Toolman dan Expedisi", "StpUser2026!"],
        ["32", "Sri Hartono", "23.101092.2017", "Operator Welding", "StpUser2026!"],
        ["33", "Eva Sofyana", "31.300587.2022", "Marketing Diklat", "StpUser2026!"],
        ["34", "Andre Firmansyah", "2024.300901.71", "Support OGSCI", "StpUser2026!"],
        ["35", "Agus Munaji, S.Kom", "2025.140888.75", "Instruktur Welding", "StpUser2026!"],
        ["36", "Anton Efendi", "01.180484.2003", "Instruktur Milling", "StpUser2026!"],
        ["37", "Mulyanto", "03.211085.2005", "Instruktur Grinding", "StpUser2026!"],
        ["38", "Putra Adi Widrajat, A.Md.", "05.110283.2008", "Instruktur Bubut", "StpUser2026!"],
        ["39", "Agus Wahyudi", "10.100885.2010", "Instruktur Kerja Bangku", "StpUser2026!"],
        ["40", "Tommy Trisula Putra, ST.", "2023.120491.55", "Instruktur Cadcam/ Gambar Teknik", "StpUser2026!"],
        ["41", "Febri Arif Purnomo, A.Md", "449-12-14", "Kepala Divisi Produksi Dan Pemasaran", "StpUser2026!"],
        ["42", "Bangun Fajar Kusnanto", "22.160494.2017", "Operator Manual", "StpUser2026!"],
        ["43", "Jarot Sutono", "24.210699.2018", "Programer CNC Bubut", "StpUser2026!"],
        ["44", "Farid Mahendra", "25.271199.2019", "Programer CNC Milling 1", "StpUser2026!"],
        ["45", "Andreas", "2023.190502.56", "Operator CNC Milling", "StpUser2026!"],
        ["46", "Admin BLUD Solo Technopark", "admin.blud.stp", "Admin BLUD Solo Technopark", "StpUser2026!"]
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
