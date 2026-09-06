import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { UserProfile, LogbookHarian } from '@/types';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40, // Margin kertas
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
    paddingBottom: 10,
  },
  headerTop: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginVertical: 4,
  },
  subtitle: {
    fontSize: 10,
    marginBottom: 2,
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
    fontWeight: 'bold',
  },
  infoSeparator: {
    width: 10,
    textAlign: 'center',
  },
  infoValue: {
    flex: 1,
  },
  // Table Section
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 20,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#000',
    backgroundColor: '#f0f0f0',
    padding: 5,
    textAlign: 'center',
  },
  tableCol: {
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#000',
    padding: 5,
  },
  // Column Widths
  colNo: {
    width: '8%',
  },
  colDate: {
    width: '25%',
  },
  colDesc: {
    width: '52%',
  },
  colStatus: {
    width: '15%',
    borderRightWidth: 0, // Kolom terakhir tidak perlu border kanan
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  tableCell: {
    fontSize: 10,
  },
  
  // Footer / Tanda Tangan
  footer: {
    marginTop: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  qrSection: {
    width: 210,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    backgroundColor: '#f9fafb',
  },
  qrImage: {
    width: 52,
    height: 52,
    marginRight: 8,
  },
  qrTextContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  qrTitle: {
    fontSize: 7.5,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#1e3a8a',
    marginBottom: 2,
  },
  qrDesc: {
    fontSize: 6,
    color: '#4b5563',
    lineHeight: 1.25,
  },
  signatureBlock: {
    width: 220,
    textAlign: 'center',
  },
  signatureSpace: {
    height: 50,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginTop: 2,
    marginHorizontal: 20,
  },
});

interface LogbookPdfProps {
  userProfile?: UserProfile;
  jabatanNama?: string;
  opdNama?: string;
  periode?: string;
  data?: LogbookHarian[];
}

export const LogbookPdfDocument = ({ userProfile, jabatanNama, opdNama, periode, data = [] }: LogbookPdfProps) => {
    // Flatten data: Ubah array of hari menjadi array of semua kegiatan tunggal
    const allActivities: any[] = [];
    
    (data || []).forEach(daily => {
        const date = daily.tanggal?.toDate ? daily.tanggal.toDate() : new Date();
        const dateStr = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
        const dayName = date.toLocaleDateString('id-ID', { weekday: 'long' });
        
        const kegiatanList = daily.kegiatan || [];
        if (kegiatanList.length > 0) {
            kegiatanList.forEach((k, idx) => {
                allActivities.push({
                    fullDate: idx === 0 ? `${dayName},\n${dateStr}` : '', // Show date only on first item of the day for cleaner look
                    deskripsi: k.deskripsi || '-',
                    status: k.selesai ? 'Selesai' : 'Proses',
                    tugas: k.tugasTerkaitJudul
                });
            });
        }
    });

    const safeNama = userProfile?.namaLengkap || '-';
    const safeNip = userProfile?.nip || '-';
    const safeJabatan = jabatanNama || '-';
    const safeOpd = opdNama ? opdNama.toUpperCase() : 'ORGANISASI PERANGKAT DAERAH';
    const safePeriode = periode || '-';
    const verifyUrl = `https://sgp.omnifit.cloud/verify/logbook?uid=${userProfile?.uid || ''}&nip=${userProfile?.nip || ''}&periode=${encodeURIComponent(safePeriode)}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header / Kop */}
                <View style={styles.header}>
                    <Text style={styles.headerTop}>PEMERINTAH KOTA SURAKARTA</Text>
                    <Text style={styles.title}>{safeOpd}</Text>
                    <Text style={styles.subtitle}>LAPORAN KINERJA HARIAN PEGAWAI</Text>
                </View>

                {/* Info Pegawai */}
                <View style={styles.infoContainer}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Nama</Text>
                        <Text style={styles.infoSeparator}>:</Text>
                        <Text style={styles.infoValue}>{safeNama}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>NIP</Text>
                        <Text style={styles.infoSeparator}>:</Text>
                        <Text style={styles.infoValue}>{safeNip}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Jabatan</Text>
                        <Text style={styles.infoSeparator}>:</Text>
                        <Text style={styles.infoValue}>{safeJabatan}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Periode</Text>
                        <Text style={styles.infoSeparator}>:</Text>
                        <Text style={styles.infoValue}>{safePeriode}</Text>
                    </View>
                </View>

                {/* Tabel */}
                <View style={styles.table}>
                    {/* Table Header */}
                    <View style={styles.tableRow}>
                        <View style={{ ...styles.tableColHeader, ...styles.colNo }}>
                            <Text style={styles.tableCellHeader}>No</Text>
                        </View>
                        <View style={{ ...styles.tableColHeader, ...styles.colDate }}>
                            <Text style={styles.tableCellHeader}>Hari/Tanggal</Text>
                        </View>
                        <View style={{ ...styles.tableColHeader, ...styles.colDesc }}>
                            <Text style={styles.tableCellHeader}>Uraian Kegiatan</Text>
                        </View>
                        <View style={{ ...styles.tableColHeader, ...styles.colStatus }}>
                            <Text style={styles.tableCellHeader}>Status</Text>
                        </View>
                    </View>

                    {/* Table Rows */}
                    {allActivities.length > 0 ? (
                        allActivities.map((item, index) => (
                            <View style={styles.tableRow} key={index}>
                                <View style={{ ...styles.tableCol, ...styles.colNo }}>
                                    <Text style={{ ...styles.tableCell, textAlign: 'center' }}>{index + 1}</Text>
                                </View>
                                <View style={{ ...styles.tableCol, ...styles.colDate }}>
                                    <Text style={styles.tableCell}>{item.fullDate}</Text>
                                </View>
                                <View style={{ ...styles.tableCol, ...styles.colDesc }}>
                                    <Text style={styles.tableCell}>{item.deskripsi}</Text>
                                    {item.tugas && (
                                        <Text style={{ fontSize: 8, color: '#444', fontStyle: 'italic', marginTop: 2 }}>
                                            [Terkait Tugas: {item.tugas}]
                                        </Text>
                                    )}
                                </View>
                                <View style={{ ...styles.tableCol, ...styles.colStatus }}>
                                    <Text style={{ ...styles.tableCell, textAlign: 'center' }}>{item.status}</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.tableRow}>
                             <View style={{ ...styles.tableCol, width: '100%' }}>
                                <Text style={{ ...styles.tableCell, textAlign: 'center', padding: 20 }}>
                                    Tidak ada data kegiatan untuk periode ini.
                                </Text>
                             </View>
                        </View>
                    )}
                </View>

                {/* Footer / Tanda Tangan & QR Verification Pass */}
                <View style={styles.footer}>
                    {/* QR Code Verification Pass */}
                    <View style={styles.qrSection}>
                        <Image src={qrCodeUrl} style={styles.qrImage} />
                        <View style={styles.qrTextContainer}>
                            <Text style={styles.qrTitle}>Dokumen Sah Terverifikasi</Text>
                            <Text style={styles.qrDesc}>Pemerintah Kota Surakarta</Text>
                            <Text style={styles.qrDesc}>Pindai QR Code untuk memvalidasi keaslian laporan kinerja ini pada portal RUANG SIGAP / POROS.</Text>
                        </View>
                    </View>

                    {/* Blok Tanda Tangan Pelapor */}
                    <View style={styles.signatureBlock}>
                        <Text>Surakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
                        <Text>Yang Melaporkan,</Text>
                        <View style={styles.signatureSpace} />
                        <Text style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{safeNama}</Text>
                        <Text>NIP. {safeNip}</Text>
                    </View>
                </View>
                
                {/* Nomor Halaman (Bottom Center) */}
                <Text style={{ position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center', fontSize: 9, color: '#888' }} render={({ pageNumber, totalPages }) => (
                    `${pageNumber} / ${totalPages}`
                )} fixed />
            </Page>
        </Document>
    );
};