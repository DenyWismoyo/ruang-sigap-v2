import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { Tagihan } from '@/types';

// Styles for the Enterprise PDF documents
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 50,
    paddingHorizontal: 60,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.5,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  headerSub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  headerLine: {
    marginTop: 10,
    borderBottomWidth: 3,
    borderBottomColor: '#000',
    width: '100%',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
    textDecoration: 'underline',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    textDecoration: 'underline',
  },
  paragraph: {
    marginBottom: 10,
    textAlign: 'justify',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 140,
    fontWeight: 'bold',
  },
  separator: {
    width: 15,
    textAlign: 'center',
  },
  value: {
    flex: 1,
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginTop: 10,
    marginBottom: 10,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f3f4f6',
    padding: 5,
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  tableColHeaderWide: {
    width: '50%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f3f4f6',
    padding: 5,
  },
  tableColWide: {
    width: '50%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  tableCellHeader: {
    margin: 'auto',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tableCell: {
    margin: 'auto',
    fontSize: 10,
  },
  signatureContainer: {
    marginTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    alignItems: 'center',
    width: 200,
  },
  signatureSpace: {
    height: 70,
  },
  signatureName: {
    fontWeight: 'bold',
    textDecoration: 'underline',
  },
  bottomId: {
    position: 'absolute',
    bottom: 30,
    left: 60,
    fontSize: 8,
    color: '#888',
  }
});

interface Props {
  tagihan: Tagihan;
}

const getMonthName = (month: number) => {
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return months[month - 1] || '';
};

// 1. Surat Perintah Kerja (SPK)
export const SpkPdf = ({ tagihan }: Props) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>SURAT PERINTAH KERJA (SPK)</Text>
        <Text style={styles.headerSub}>Layanan Sistem Integrasi & Administrasi Persuratan (SIGAP)</Text>
        <View style={styles.headerLine} />
      </View>
      <Text style={styles.title}>SURAT PERINTAH KERJA</Text>
      <Text style={styles.paragraph}>Nomor: SPK/SIGAP/{tagihan.tahunTagihan}/{tagihan.bulanTagihan.toString().padStart(2, '0')}/{tagihan.id?.substring(0, 5).toUpperCase()}</Text>
      
      <Text style={styles.paragraph}>Pada hari ini, tanggal {new Date().toLocaleDateString('id-ID')}, yang bertanda tangan di bawah ini:</Text>
      <View style={styles.row}><Text style={styles.label}>Nama Instansi</Text><Text style={styles.separator}>:</Text><Text style={styles.value}>{tagihan.namaOpd}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Pekerjaan</Text><Text style={styles.separator}>:</Text><Text style={styles.value}>Langganan Platform SIGAP Paket {tagihan.packageName}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Periode Layanan</Text><Text style={styles.separator}>:</Text><Text style={styles.value}>{getMonthName(tagihan.bulanTagihan)} {tagihan.tahunTagihan}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Nilai Kontrak</Text><Text style={styles.separator}>:</Text><Text style={styles.value}>Rp {tagihan.totalTagihan.toLocaleString('id-ID')}</Text></View>
      
      <Text style={[styles.paragraph, { marginTop: 20 }]}>Dengan ini memerintahkan untuk melaksanakan pekerjaan sesuai dengan spesifikasi dan layanan teknis yang telah disepakati.</Text>
      
      <View style={styles.signatureContainer}>
        <View style={styles.signatureBox}>
          <Text>Pihak Pertama</Text>
          <Text>Pejabat Pembuat Komitmen</Text>
          <View style={styles.signatureSpace} />
          <Text style={styles.signatureName}>______________________</Text>
          <Text>NIP. </Text>
        </View>
        <View style={styles.signatureBox}>
          <Text>Pihak Kedua</Text>
          <Text>Penyedia Layanan SIGAP</Text>
          <View style={styles.signatureSpace} />
          <Text style={styles.signatureName}>Direktur Utama</Text>
        </View>
      </View>
      <Text style={styles.bottomId}>Dicetak oleh Sistem SIGAP | ID Tagihan: {tagihan.id}</Text>
    </Page>
  </Document>
);

// 2. Berita Acara Serah Terima (BAST)
export const BastPdf = ({ tagihan }: Props) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>BERITA ACARA SERAH TERIMA (BAST)</Text>
        <Text style={styles.headerSub}>Layanan Sistem Integrasi & Administrasi Persuratan (SIGAP)</Text>
        <View style={styles.headerLine} />
      </View>
      <Text style={styles.title}>BERITA ACARA SERAH TERIMA LAYANAN</Text>
      
      <Text style={styles.paragraph}>Berdasarkan Surat Perintah Kerja (SPK) Nomor: SPK/SIGAP/{tagihan.tahunTagihan}/{tagihan.bulanTagihan.toString().padStart(2, '0')}/{tagihan.id?.substring(0, 5).toUpperCase()}, kami yang bertanda tangan di bawah ini:</Text>
      <Text style={styles.paragraph}>Pihak Kedua telah menyerahkan hasil pekerjaan Layanan Platform SIGAP Paket {tagihan.packageName} kepada Pihak Pertama untuk periode layanan bulan {getMonthName(tagihan.bulanTagihan)} tahun {tagihan.tahunTagihan}, dengan rincian sebagai berikut:</Text>
      
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={styles.tableColHeaderWide}><Text style={styles.tableCellHeader}>Deskripsi Layanan</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Kuantitas</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Status</Text></View>
        </View>
        <View style={styles.tableRow}>
          <View style={styles.tableColWide}><Text style={styles.tableCell}>Langganan SIGAP Paket {tagihan.packageName} ({tagihan.jumlahPenggunaAktif} Pengguna Aktif)</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>1 Bulan</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>Selesai & Berjalan Baik</Text></View>
        </View>
      </View>
      
      <Text style={styles.paragraph}>Pihak Pertama telah menerima hasil pekerjaan tersebut dengan baik dan lengkap.</Text>
      
      <View style={styles.signatureContainer}>
        <View style={styles.signatureBox}>
          <Text>Yang Menerima,</Text>
          <Text>Pihak Pertama ({tagihan.namaOpd})</Text>
          <View style={styles.signatureSpace} />
          <Text style={styles.signatureName}>______________________</Text>
        </View>
        <View style={styles.signatureBox}>
          <Text>Yang Menyerahkan,</Text>
          <Text>Pihak Kedua (Penyedia SIGAP)</Text>
          <View style={styles.signatureSpace} />
          <Text style={styles.signatureName}>______________________</Text>
        </View>
      </View>
      <Text style={styles.bottomId}>Dicetak oleh Sistem SIGAP | ID Tagihan: {tagihan.id}</Text>
    </Page>
  </Document>
);

// 3. Invoice
export const InvoicePdf = ({ tagihan }: Props) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>INVOICE PENAGIHAN</Text>
        <Text style={styles.headerSub}>Layanan Sistem Integrasi & Administrasi Persuratan (SIGAP)</Text>
        <View style={styles.headerLine} />
      </View>
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        <View>
          <Text style={{ fontWeight: 'bold' }}>Ditagihkan Kepada:</Text>
          <Text>{tagihan.namaOpd}</Text>
          <Text>Pemerintah Daerah</Text>
        </View>
        <View>
          <Text><Text style={{ fontWeight: 'bold' }}>No. Invoice:</Text> INV/SIGAP/{tagihan.tahunTagihan}/{tagihan.bulanTagihan.toString().padStart(2, '0')}/{tagihan.id?.substring(0, 5).toUpperCase()}</Text>
          <Text><Text style={{ fontWeight: 'bold' }}>Tanggal:</Text> {tagihan.tanggalDibuat.toDate().toLocaleDateString('id-ID')}</Text>
        </View>
      </View>
      
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={styles.tableColHeaderWide}><Text style={styles.tableCellHeader}>Deskripsi</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Periode</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Total (Rp)</Text></View>
        </View>
        <View style={styles.tableRow}>
          <View style={styles.tableColWide}><Text style={styles.tableCell}>Langganan SIGAP Paket {tagihan.packageName} ({tagihan.jumlahPenggunaAktif} User)</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>{getMonthName(tagihan.bulanTagihan)} {tagihan.tahunTagihan}</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>{tagihan.hargaBulanan.toLocaleString('id-ID')}</Text></View>
        </View>
      </View>
      
      <View style={{ alignItems: 'flex-end', marginTop: 10 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 14 }}>Total Tagihan: Rp {tagihan.totalTagihan.toLocaleString('id-ID')}</Text>
      </View>
      
      <View style={{ marginTop: 40 }}>
        <Text style={{ fontWeight: 'bold' }}>Instruksi Pembayaran:</Text>
        <Text>Mohon lakukan pembayaran ke rekening berikut:</Text>
        <Text>Bank: Bank Pembangunan Daerah</Text>
        <Text>No Rekening: 123-456-789</Text>
        <Text>Atas Nama: PT. Penyedia Aplikasi SIGAP</Text>
      </View>
      
      <View style={styles.signatureContainer}>
        <View style={{ width: 200 }}></View>
        <View style={styles.signatureBox}>
          <Text>Hormat Kami,</Text>
          <Text>Bagian Keuangan SIGAP</Text>
          <View style={styles.signatureSpace} />
          <Text style={styles.signatureName}>Manager Keuangan</Text>
        </View>
      </View>
      <Text style={styles.bottomId}>Dicetak oleh Sistem SIGAP | ID Tagihan: {tagihan.id}</Text>
    </Page>
  </Document>
);

// 4. Kwitansi
export const KwitansiPdf = ({ tagihan }: Props) => (
  <Document>
    <Page size="A4" style={[styles.page, { paddingVertical: 100 }]}>
      <View style={{ borderWidth: 2, borderColor: '#000', padding: 20 }}>
        <Text style={[styles.title, { marginTop: 0 }]}>KWITANSI PEMBAYARAN</Text>
        
        <View style={styles.row}><Text style={styles.label}>Telah terima dari</Text><Text style={styles.separator}>:</Text><Text style={styles.value}>{tagihan.namaOpd}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Uang sebesar</Text><Text style={styles.separator}>:</Text><Text style={styles.value}>Rp {tagihan.totalTagihan.toLocaleString('id-ID')}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Guna pembayaran</Text><Text style={styles.separator}>:</Text><Text style={styles.value}>Langganan Layanan Aplikasi SIGAP Paket {tagihan.packageName} Periode {getMonthName(tagihan.bulanTagihan)} {tagihan.tahunTagihan}</Text></View>
        
        <View style={[styles.signatureContainer, { marginTop: 30 }]}>
          <View style={[styles.signatureBox, { alignItems: 'flex-start' }]}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', padding: 10, borderWidth: 1 }}>Rp {tagihan.totalTagihan.toLocaleString('id-ID')}</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            <Text>Penerima,</Text>
            <View style={styles.signatureSpace} />
            <Text style={styles.signatureName}>Bagian Keuangan</Text>
          </View>
        </View>
      </View>
    </Page>
  </Document>
);

// 5. Faktur Pajak (Simplified representation)
export const FakturPajakPdf = ({ tagihan }: Props) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>FAKTUR PAJAK</Text>
        <View style={styles.headerLine} />
      </View>
      
      <View style={{ borderWidth: 1, borderColor: '#000', padding: 10, marginBottom: 10 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>PENGUSAHA KENA PAJAK</Text>
        <Text>Nama: PT. Penyedia Aplikasi SIGAP</Text>
        <Text>Alamat: Gedung Perkantoran, Jl. Sudirman No 1</Text>
        <Text>NPWP: 01.234.567.8-901.000</Text>
      </View>
      
      <View style={{ borderWidth: 1, borderColor: '#000', padding: 10, marginBottom: 10 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>PEMBELI BARANG KENA PAJAK / PENERIMA JASA KENA PAJAK</Text>
        <Text>Nama: {tagihan.namaOpd}</Text>
        <Text>Alamat: Pemerintah Daerah Setempat</Text>
        <Text>NPWP: 00.000.000.0-000.000</Text>
      </View>
      
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={styles.tableColHeaderWide}><Text style={styles.tableCellHeader}>Nama Barang Kena Pajak / Jasa Kena Pajak</Text></View>
          <View style={styles.tableColHeaderWide}><Text style={styles.tableCellHeader}>Harga Jual/Penggantian/Uang Muka/Termin (Rp)</Text></View>
        </View>
        <View style={styles.tableRow}>
          <View style={styles.tableColWide}><Text style={styles.tableCell}>Jasa Langganan SIGAP Paket {tagihan.packageName} Bulan {getMonthName(tagihan.bulanTagihan)} {tagihan.tahunTagihan}</Text></View>
          <View style={styles.tableColWide}><Text style={styles.tableCell}>{tagihan.totalTagihan.toLocaleString('id-ID')}</Text></View>
        </View>
      </View>
      
      <View style={{ alignItems: 'flex-end', marginTop: 10, paddingRight: 20 }}>
        <View style={styles.row}><Text style={{ width: 150 }}>Harga Jual / Penggantian</Text><Text>: Rp {tagihan.totalTagihan.toLocaleString('id-ID')}</Text></View>
        <View style={styles.row}><Text style={{ width: 150 }}>Dikurangi Potongan Harga</Text><Text>: Rp 0</Text></View>
        <View style={styles.row}><Text style={{ width: 150 }}>Dasar Pengenaan Pajak</Text><Text>: Rp {tagihan.totalTagihan.toLocaleString('id-ID')}</Text></View>
        <View style={styles.row}><Text style={{ width: 150 }}>PPN = 11% x Dasar Pengenaan</Text><Text>: Rp {Math.floor(tagihan.totalTagihan * 0.11).toLocaleString('id-ID')}</Text></View>
      </View>
      
      <View style={styles.signatureContainer}>
        <View style={{ width: 200 }}></View>
        <View style={styles.signatureBox}>
          <Text>Direktur Utama</Text>
          <View style={styles.signatureSpace} />
          <Text style={styles.signatureName}>______________________</Text>
        </View>
      </View>
      <Text style={styles.bottomId}>ID Tagihan: {tagihan.id}</Text>
    </Page>
  </Document>
);
