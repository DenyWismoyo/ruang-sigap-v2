"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { EkinerjaSubscription } from "@/types";

export interface EkinerjaSubscriptionInfo {
  isSubscribed: boolean;
  status: 'ACTIVE' | 'EXPIRED' | 'INACTIVE';
  expiryDate: Date | null;
  formattedExpiry: string | null;
  daysRemaining: number;
  isExpiringSoon: boolean;
  subscription: EkinerjaSubscription | null;
}

export function useEkinerjaSubscription(): EkinerjaSubscriptionInfo {
  const { userProfile } = useAuth();

  return useMemo(() => {
    const subscription = userProfile?.ekinerjaSubscription || null;

    if (!subscription || !subscription.activeUntil) {
      return {
        isSubscribed: false,
        status: 'INACTIVE',
        expiryDate: null,
        formattedExpiry: null,
        daysRemaining: 0,
        isExpiringSoon: false,
        subscription: null,
      };
    }

    // Ekstraksi Date dari Firestore Timestamp atau string/Date
    let expiryDate: Date | null = null;
    if (typeof subscription.activeUntil?.toDate === 'function') {
      expiryDate = subscription.activeUntil.toDate();
    } else if (subscription.activeUntil?.seconds) {
      expiryDate = new Date(subscription.activeUntil.seconds * 1000);
    } else if (subscription.activeUntil instanceof Date) {
      expiryDate = subscription.activeUntil;
    } else if (typeof subscription.activeUntil === 'string') {
      expiryDate = new Date(subscription.activeUntil);
    }

    if (!expiryDate || isNaN(expiryDate.getTime())) {
      return {
        isSubscribed: false,
        status: 'INACTIVE',
        expiryDate: null,
        formattedExpiry: null,
        daysRemaining: 0,
        isExpiringSoon: false,
        subscription,
      };
    }

    const now = Date.now();
    const expiryTime = expiryDate.getTime();
    const diffMs = expiryTime - now;
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const isSubscribed = Boolean(subscription.isActive && diffMs > 0);
    const status: 'ACTIVE' | 'EXPIRED' | 'INACTIVE' = isSubscribed ? 'ACTIVE' : 'EXPIRED';
    const isExpiringSoon = isSubscribed && daysRemaining <= 5;

    const formattedExpiry = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(expiryDate);

    return {
      isSubscribed,
      status,
      expiryDate,
      formattedExpiry,
      daysRemaining,
      isExpiringSoon,
      subscription,
    };
  }, [userProfile?.ekinerjaSubscription]);
}
