"use client";

import { useState, useEffect } from 'react';

// Extend Window interface for the beforeinstallprompt event
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
  interface Window {
    __deferredPwaPrompt?: BeforeInstallPromptEvent | null;
    __onPwaPromptReady?: ((e: BeforeInstallPromptEvent) => void) | null;
  }
}

export function usePwaInstall() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Detect if already installed (standalone mode)
    const checkIsInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
        || (window.navigator as any).standalone 
        || document.referrer.includes('android-app://');
      setIsInstalled(!!isStandalone);
      return !!isStandalone;
    };
    
    const installed = checkIsInstalled();

    // 2. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // If it's iOS and not installed, it is installable manually via Share -> Add to Home Screen
    if (isIosDevice && !installed) {
      setIsInstallable(true);
    }

    // 3. Check for early captured beforeinstallprompt event (from root layout script)
    if (window.__deferredPwaPrompt && !installed) {
      setPromptEvent(window.__deferredPwaPrompt);
      setIsInstallable(true);
    }

    // Set callback if script captures event later
    window.__onPwaPromptReady = (e: BeforeInstallPromptEvent) => {
      setPromptEvent(e);
      setIsInstallable(true);
    };

    // 4. Standard beforeinstallprompt event listener (Android / Desktop Chrome / Edge)
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      window.__deferredPwaPrompt = e;
      setPromptEvent(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Listen to successful installation
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setIsInstalled(true);
      setPromptEvent(null);
      window.__deferredPwaPrompt = null;
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.__onPwaPromptReady = null;
    };
  }, []);

  const install = async () => {
    const activePrompt = promptEvent || window.__deferredPwaPrompt;
    if (!activePrompt) return;

    try {
      await activePrompt.prompt();
      const { outcome } = await activePrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
      }
    } catch (err) {
      console.warn('[PWA] Error triggering install prompt:', err);
    } finally {
      setPromptEvent(null);
      window.__deferredPwaPrompt = null;
    }
  };

  return { install, isInstallable, isInstalled, isIOS };
}
