import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { UserProfile, LogbookHarian } from '@/types';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1.5,
  },
  header: {
    textAlign: 'center',
    marginBottom: 5,
  },
  headerTop: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    marginVertical: 4,
  },
  divider1: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    marginTop: 10,
  },
  divider2: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    marginTop: 2,
    marginBottom: 20,
  },
  reportTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    textDecoration: 'underline',
    marginBottom: 20,
  },
  // Info Pegawai Section
  infoContainer: {
    marginBottom: 20,
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    width: 100,
    fontFamily: 'Helvetica-Bold',
  },
  infoSeparator: {
    width: 15,
    textAlign: 'center',
  },
  infoValue: {
    flex: 1,
  },
  // Table Styles
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    borderBottomWidth: 0,
    borderRightWidth: 0,
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableColHeader: {
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#000',
    backgroundColor: '#e6e6e6',
    padding: 8,
    textAlign: 'center',
    justifyContent: 'center',
  },
  tableCol: {
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#000',
    padding: 8,
  },
  // Kolom widths
  colNo: { width: '8%', textAlign: 'center' },
  colDate: { width: '22%' },
  colDesc: { width: '55%' },
  colStatus: { width: '15%', textAlign: 'center' },
  
  tableCellHeader: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  tableCell: {
    fontSize: 10,
  },
  tableCellBold: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  
  // Footer / Tanda Tangan
  footer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  signatureBlock: {
    width: 250,
    textAlign: 'center',
  },
  signatureSpace: {
    height: 70,
  },
  signatureName: {
    fontFamily: 'Helvetica-Bold',
    textDecoration: 'underline',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 9,
    color: '#888',
  }
});

interface LogbookPdfProps {
  userProfile: UserProfile;
  jabatanNama: string;
  opdNama: string;
  periode: string; // "Oktober 2025"
  data: LogbookHarian[];
}

export const LogbookPdfDocument = ({ userProfile, jabatanNama, opdNama, periode, data }: LogbookPdfProps) => {
    // Flatten data: Ubah array of hari menjadi array of semua kegiatan tunggal
    const allActivities: any[] = [];
    
    data.forEach(daily => {
        const date = daily.tanggal.toDate();
        const dateStr = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
        const dayName = date.toLocaleDateString('id-ID', { weekday: 'long' });
        
        if (daily.kegiatan.length > 0) {
            daily.kegiatan.forEach((k, idx) => {
                allActivities.push({
                    fullDate: idx === 0 ? `${dayName},\n${dateStr}` : '', // Show date only on first item of the day for cleaner look
                    deskripsi: k.deskripsi,
                    status: k.selesai ? 'Selesai' : 'Proses',
                    tugas: k.tugasTerkaitJudul
                });
            });
        }
    });

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header / Kop Resmi */}
                <View style={styles.header}>
                    <Text style={styles.headerTop}>PEMERINTAH KOTA SURAKARTA</Text>
                    <Text style={styles.title}>{opdNama.toUpperCase()}</Text>
                </View>
                <View style={styles.divider1} />
                <View style={styles.divider2} />

                <Text style={styles.reportTitle}>LAPORAN KINERJA HARIAN PEGAWAI</Text>

                {/* Info Pegawai */}
                <View style={styles.infoContainer}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Nama</Text>
                        <Text style={styles.infoSeparator}>:</Text>
                        <Text style={styles.infoValue}>{userProfile.namaLengkap}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>NIP</Text>
                        <Text style={styles.infoSeparator}>:</Text>
                        <Text style={styles.infoValue}>{userProfile.nip}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Jabatan</Text>
                        <Text style={styles.infoSeparator}>:</Text>
                        <Text style={styles.infoValue}>{jabatanNama}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Periode Laporan</Text>
                        <Text style={styles.infoSeparator}>:</Text>
                        <Text style={styles.infoValue}>{periode}</Text>
                    </View>
                </View>

                {/* Tabel */}
                <View style={styles.table}>
                    {/* Table Header */}
                    <View style={styles.tableRow} wrap={false}>
                        <View style={[styles.tableColHeader, styles.colNo]}>
                            <Text style={styles.tableCellHeader}>No</Text>
                        </View>
                        <View style={[styles.tableColHeader, styles.colDate]}>
                            <Text style={styles.tableCellHeader}>Hari / Tanggal</Text>
                        </View>
                        <View style={[styles.tableColHeader, styles.colDesc]}>
                            <Text style={styles.tableCellHeader}>Uraian Kegiatan</Text>
                        </View>
                        <View style={[styles.tableColHeader, styles.colStatus]}>
                            <Text style={styles.tableCellHeader}>Status</Text>
                        </View>
                    </View>

                    {/* Table Rows - wrap={false} prevents rows from being cut in half across pages */}
                    {allActivities.length > 0 ? (
                        allActivities.map((item, index) => (
                            <View style={styles.tableRow} key={index} wrap={false}>
                                <View style={[styles.tableCol, styles.colNo]}>
                                    <Text style={styles.tableCell}>{index + 1}</Text>
                                </View>
                                <View style={[styles.tableCol, styles.colDate]}>
                                    <Text style={styles.tableCellBold}>{item.fullDate}</Text>
                                </View>
                                <View style={[styles.tableCol, styles.colDesc]}>
                                    <Text style={styles.tableCell}>{item.deskripsi}</Text>
                                    {item.tugas && (
                                        <Text style={{ fontSize: 9, color: '#444', fontStyle: 'italic', marginTop: 4 }}>
                                            [Tugas: {item.tugas}]
                                        </Text>
                                    )}
                                </View>
                                <View style={[styles.tableCol, styles.colStatus]}>
                                    <Text style={styles.tableCell}>{item.status}</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.tableRow} wrap={false}>
                             <View style={[styles.tableCol, { width: '100%', textAlign: 'center' }]}>
                                <Text style={[styles.tableCell, { padding: 15 }]}>
                                    Tidak ada data kegiatan untuk periode ini.
                                </Text>
                             </View>
                        </View>
                    )}
                </View>

                {/* Footer / Tanda Tangan - wrap={false} prevents signature block from splitting */}
                <View style={styles.footer} wrap={false}>
                    <View style={styles.signatureBlock}>
                        <Text style={styles.tableCell}>Surakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
                        <Text style={styles.tableCell}>Yang Melaporkan,</Text>
                        <View style={styles.signatureSpace} />
                        <Text style={styles.signatureName}>{userProfile.namaLengkap}</Text>
                        <Text style={styles.tableCell}>NIP. {userProfile.nip}</Text>
                    </View>
                </View>
                
                {/* Nomor Halaman (Bottom Center) */}
                <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
                    `Halaman ${pageNumber} dari ${totalPages}`
                )} fixed />
            </Page>
        </Document>
    );
};
