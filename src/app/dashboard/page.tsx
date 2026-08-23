"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserAuth } from "@/context/AuthContext";
import FullPageLoader from "@/app/dashboard/sigap/components/FullPageLoader";

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { user, userProfile, opdConfig, loading, initializing } = useUserAuth();

  useEffect(() => {
    if (initializing || loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    // Tentukan tema dashboard (sigap atau poros)
    const userTheme = userProfile?.app_theme || opdConfig?.default_theme || "sigap";

    if (userTheme === "poros") {
      router.replace("/dashboard/poros");
    } else {
      router.replace("/dashboard/sigap");
    }
  }, [user, userProfile, opdConfig, loading, initializing, router]);

  return <FullPageLoader message="Mengarahkan ke ruang kerja..." />;
}
