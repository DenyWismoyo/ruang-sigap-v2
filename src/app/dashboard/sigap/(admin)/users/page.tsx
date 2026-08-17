/**
 * Directory: src/app/dashboard/sigap/(admin)/users/page.tsx
 * Manajemen Pengguna (Sigap Version)
 */

"use client";

import React from 'react';
import UserManagementView from '@/app/dashboard/components/admin/UserManagementView';

export default function SigapManajemenUserPage() {
  return <UserManagementView tenant="sigap" />;
}