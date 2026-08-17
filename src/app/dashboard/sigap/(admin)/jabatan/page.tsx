/**
 * Directory: src/app/dashboard/sigap/(admin)/jabatan/page.tsx
 * Manajemen Jabatan (Sigap Version)
 */

"use client";

import React from 'react';
import JabatanManagementView from '@/app/dashboard/components/admin/JabatanManagementView';

export default function SigapManajemenJabatanPage() {
  return <JabatanManagementView tenant="sigap" />;
}