/**
 * Directory: src/app/dashboard/poros/(main)/pengaturan/users/page.tsx
 * Manajemen Pengguna (Poros Version)
 */

"use client";

import React from 'react';
import UserManagementView from '@/app/dashboard/components/admin/UserManagementView';

export default function PorosManajemenUserPage() {
  return <UserManagementView tenant="poros" />;
}
