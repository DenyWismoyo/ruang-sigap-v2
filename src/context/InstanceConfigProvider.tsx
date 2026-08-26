"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useUserAuth } from '@/context/AuthContext';
import { OpdConfig } from '@/types';

interface InstanceConfigContextType {
  config: OpdConfig | null;
  loading: boolean;
}

const InstanceConfigContext = createContext<InstanceConfigContextType>({
  config: null,
  loading: true,
});

function hexToHsl(hex: string) {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${(h * 360).toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`;
}

export const InstanceConfigProvider = ({ children }: { children: ReactNode }) => {
  const { userProfile, loading: authLoading } = useUserAuth();
  const [config, setConfig] = useState<OpdConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    // If not logged in or no OPD ID, just finish loading
    if (!userProfile?.opdId) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'opdConfigs', userProfile.opdId), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as OpdConfig;
        setConfig(data);
        
        // Apply branding dynamically
        if (data.branding?.primaryColor) {
          const hslValue = hexToHsl(data.branding.primaryColor);
          document.documentElement.style.setProperty('--primary', hslValue);
        }
        if (data.branding?.namaAplikasi) {
          document.title = `${data.branding.namaAplikasi} | SIGAP`;
        }
      } else {
        setConfig(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [userProfile, authLoading]);

  return (
    <InstanceConfigContext.Provider value={{ config, loading }}>
      {children}
    </InstanceConfigContext.Provider>
  );
};

export const useInstanceConfig = () => useContext(InstanceConfigContext);
