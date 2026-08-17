/**
 * Directory: src/app/dashboard/poros/(main)/pengaturan/opd/page.tsx
 * Manajemen OPD & Struktur Wilayah (Poros Version)
 */

"use client";

import React from 'react';
import OpdManagementView from '@/app/dashboard/components/admin/OpdManagementView';

export default function PorosManajemenOpdPage() {
  return <OpdManagementView tenant="poros" />;
}
