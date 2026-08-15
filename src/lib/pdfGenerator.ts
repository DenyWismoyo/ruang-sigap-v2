import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { BuktiKinerja } from '@/types';
import { UserProfile } from '@/types';

// Extend jsPDF interface to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const generateLaporanKinerjaPdf = (
  buktiList: BuktiKinerja[], 
  userProfile: UserProfile, 
  monthYearStr: string
) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(16);
  doc.text('LAPORAN KINERJA BULANAN', 105, 15, { align: 'center' });
  
  // User Info
  doc.setFontSize(11);
  doc.text(`Nama: ${userProfile.namaLengkap}`, 14, 25);
  doc.text(`NIP: ${userProfile.nip || '-'}`, 14, 31);
  doc.text(`Bulan/Tahun: ${monthYearStr}`, 14, 37);

  // Table Data
  const tableData = buktiList.map((item, index) => [
    index + 1,
    item.createdAt.toDate().toLocaleDateString('id-ID'),
    item.judul,
    item.sumber === 'laporan' ? 'Laporan Tindak Lanjut' : item.sumber === 'tugas_selesai' ? 'Penyelesaian Tugas' : 'Upload Manual',
    item.deskripsi || '-'
  ]);

  // AutoTable
  doc.autoTable({
    startY: 45,
    head: [['No', 'Tanggal', 'Judul / Aktivitas', 'Sumber', 'Keterangan']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 25 },
      2: { cellWidth: 60 },
      3: { cellWidth: 35 },
      4: { cellWidth: 50 },
    }
  });

  // Tanda Tangan
  const finalY = (doc as any).lastAutoTable.finalY || 100;
  doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')}`, 14, finalY + 10);
  
  doc.text('Mengetahui,', 140, finalY + 20);
  doc.text('Atasan Langsung', 140, finalY + 25);
  doc.text('(...........................................)', 135, finalY + 45);

  // Download
  doc.save(`Laporan_Kinerja_${userProfile.namaLengkap.replace(/[^a-zA-Z0-9]/g, '_')}_${monthYearStr.replace(/ /g, '_')}.pdf`);
};
