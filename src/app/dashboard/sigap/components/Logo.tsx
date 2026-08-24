// Lokasi: src/app/dashboard/components/Logo.tsx
import Image from 'next/image';
import logoSigap from '../../../../logo-sigap.png';

const Logo = ({ className }: { className?: string }) => {
  return (
    <div className={`relative ${className}`}>
      <Image
        src={logoSigap}
        alt="Logo SIAP WFA"
        fill
        priority
        style={{ objectFit: 'contain' }}
        // [PERBAIKAN] Mengubah prop sizes menjadi lebih kecil agar Next.js tidak mendownload gambar resolusi raksasa (memperbaiki warning kuning)
        sizes="(max-width: 768px) 200px, 250px" 
      />
    </div>
  );
};

export default Logo;
