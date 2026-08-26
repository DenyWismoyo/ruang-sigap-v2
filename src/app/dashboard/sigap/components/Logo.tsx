// Lokasi: src/app/dashboard/components/Logo.tsx
"use client";

import Image from 'next/image';
import logoSigap from '../../../../logo-sigap.png';
import { useInstanceConfig } from '@/context/InstanceConfigProvider';

const Logo = ({ className }: { className?: string }) => {
  const { config } = useInstanceConfig();
  const customLogoUrl = config?.branding?.logoUrl;
  const appName = config?.branding?.namaAplikasi || "SIGAP";

  return (
    <div className={`relative ${className}`}>
      {customLogoUrl ? (
        <img
          src={customLogoUrl}
          alt={`Logo ${appName}`}
          className="object-contain w-full h-full"
        />
      ) : (
        <Image
          src={logoSigap}
          alt={`Logo ${appName}`}
          fill
          priority
          style={{ objectFit: 'contain' }}
          sizes="(max-width: 768px) 200px, 250px" 
        />
      )}
    </div>
  );
};

export default Logo;
