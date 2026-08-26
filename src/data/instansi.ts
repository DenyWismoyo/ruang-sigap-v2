export type InstansiCategory = "Pemilik Inovasi" | "Pemerintah Daerah" | "Kecamatan & Kelurahan" | "Kementerian & Lembaga" | "Instansi Pendidikan";

export interface InstansiData {
  id: string;
  name: string;
  category: InstansiCategory;
  location: string;
  year: number;
  description?: string;
  status: "Aktif" | "Tahap Integrasi";
}

export const dataInstansi: InstansiData[] = [
  {
    id: "ins-1",
    name: "Kecamatan Banjarsari",
    category: "Pemilik Inovasi",
    location: "Kota Surakarta, Jawa Tengah",
    year: 2025,
    description: "Inisiator dan pemilik inovasi sistem SIGAP E-Office.",
    status: "Aktif"
  },
  {
    id: "ins-2",
    name: "BKPSDM Kota Surakarta",
    category: "Pemerintah Daerah",
    location: "Kota Surakarta, Jawa Tengah",
    year: 2026,
    description: "Replikasi sistem untuk optimalisasi administrasi dan persuratan.",
    status: "Aktif"
  },
  {
    id: "ins-3",
    name: "15 Kelurahan se-Kecamatan Banjarsari",
    category: "Kecamatan & Kelurahan",
    location: "Kota Surakarta, Jawa Tengah",
    year: 2025,
    description: "Implementasi masif ke seluruh kelurahan di wilayah Kecamatan Banjarsari.",
    status: "Aktif"
  }
];
