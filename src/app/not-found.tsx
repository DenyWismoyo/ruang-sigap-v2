import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Halaman Tidak Ditemukan</h2>
      <p className="text-muted-foreground mb-4">Maaf, halaman yang Anda cari tidak ada.</p>
      <Link href="/" className="text-primary hover:underline">
        Kembali ke Beranda
      </Link>
    </div>
  );
}
