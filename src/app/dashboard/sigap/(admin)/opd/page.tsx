/**
 * Directory: src/app/dashboard/sigap/(admin)/opd/page.tsx
 * History Updates:
 * - 2024-11-20: Refactoring menggunakan `useMasterData` (SSOT).
 * - Refactored: Delegated UI to shared OpdManagementView
 */

"use client";

import React from 'react';
import OpdManagementView from '@/app/dashboard/components/admin/OpdManagementView';

export default function ManajemenOpdPage() {
  return <OpdManagementView tenant="sigap" />;
}