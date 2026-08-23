export interface Pegawai {
    nip: string;
    nama: string;
    jabatan: string;
    pangkat: string;
    golongan: string;
}

export const DATA_PEGAWAI: Pegawai[] = [
    { nip: "198001012005011001", nama: "Budi Santoso, S.Kom", jabatan: "Kepala Bidang E-Government", pangkat: "Pembina", golongan: "IV/a" },
    { nip: "198502022010022002", nama: "Siti Aminah, M.TI", jabatan: "Kepala Seksi Infrastruktur Jaringan", pangkat: "Penata Tingkat I", golongan: "III/d" },
    { nip: "199003032015031003", nama: "Joko Anwar, S.ST", jabatan: "Pranata Komputer Ahli Muda", pangkat: "Penata", golongan: "III/c" },
    { nip: "199504042020042004", nama: "Ayu Lestari, A.Md", jabatan: "Pranata Komputer Terampil", pangkat: "Pengatur Tingkat I", golongan: "II/d" }
];
