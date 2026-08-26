import { useUserAuth } from '@/context/AuthContext';
import { RoleAccessKey } from '@/types';

/**
 * Hook untuk mengecek apakah user saat ini memiliki akses ke fitur tertentu
 * berdasarkan pengaturan layout per role dari super_admin di opd_config.
 */
export function useRoleAccess() {
  const { userProfile, jabatanProfile, opdConfig } = useUserAuth();

  const hasAccess = (key: RoleAccessKey): boolean => {
    // Jika tidak ada user profile atau opd config, secara default izinkan (aman)
    if (!userProfile || !opdConfig) return true;

    // Hanya role tertentu yang dikontrol via roleAccessConfig
    // super_admin selalu memiliki akses penuh secara default untuk semua layout
    if (userProfile.role === 'super_admin') return true;

    const roleAccessConfig = opdConfig.roleAccessConfig;

    // Jika super_admin belum melakukan konfigurasi sama sekali untuk OPD ini,
    // fallback ke default (semua diizinkan) agar tidak breaking.
    if (!roleAccessConfig) return true;

    let effectiveRole: string = userProfile.role;
    if (effectiveRole === 'user') {
      const isPimpinan = jabatanProfile && jabatanProfile.level <= 5;
      effectiveRole = isPimpinan ? 'user_pimpinan' : 'user_bawahan';
    }

    let roleConfig = roleAccessConfig[effectiveRole as keyof typeof roleAccessConfig];
    
    // Fallback to 'user' if specific pimpinan/bawahan config is not set yet
    if (!roleConfig && userProfile.role === 'user') {
      roleConfig = roleAccessConfig['user'];
    }

    // Jika tidak ada konfigurasi spesifik untuk role user ini,
    // fallback ke default (diizinkan)
    if (!roleConfig) return true;

    // Periksa apakah key terdapat dalam daftar akses yang diizinkan untuk role ini
    return roleConfig.includes(key);
  };

  return { hasAccess };
}
