"use client";

import React, { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { getFCMToken } from '@/lib/firebase-messaging';
import { db } from '@/lib/firebase';
import { updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { useUserAuth } from '@/context/AuthContext';

export default function NotificationBanner() {
    const { userProfile } = useUserAuth();
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Cek status izin notifikasi hanya di client
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default' && !isDismissed) {
                setIsVisible(true);
            }
        }
    }, [isDismissed]);

    const handleEnableNotifications = async () => {
        setIsLoading(true);
        try {
            // Meminta izin akan memunculkan pop-up browser
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted' && userProfile?.nip) {
                const token = await getFCMToken();
                if (token) {
                    await updateDoc(doc(db, 'users', userProfile.nip), { 
                        fcmTokens: arrayUnion(token) 
                    });
                    console.log("✅ FCM Token berhasil di-generate dari banner.");
                }
                setIsVisible(false);
            } else if (permission === 'denied') {
                setIsVisible(false);
            }
        } catch (error) {
            console.error("Gagal mengaktifkan notifikasi:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
                <Bell size={20} className="animate-pulse" />
                <div className="text-sm">
                    <strong>Aktifkan Notifikasi</strong> agar tidak tertinggal info surat dan tugas baru.
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={handleEnableNotifications}
                    disabled={isLoading}
                    className="bg-white text-blue-600 px-3 py-1.5 rounded text-sm font-semibold hover:bg-blue-50 transition"
                >
                    {isLoading ? 'Memproses...' : 'Aktifkan'}
                </button>
                <button onClick={() => setIsDismissed(true)} className="p-1 hover:bg-blue-700 rounded transition">
                    <X size={18} />
                </button>
            </div>
        </div>
    );
}
