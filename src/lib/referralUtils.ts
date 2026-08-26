// src/lib/referralUtils.ts
// Utilitas untuk menangkap dan membaca kode referral affiliate
// Kode referral disimpan di localStorage agar persisten selama sesi browsing

const REFERRAL_KEY = 'sigap_ref_code';
const REFERRAL_SOURCE_KEY = 'sigap_ref_source'; // page URL saat kode ditangkap

/**
 * Simpan kode referral ke localStorage.
 * Dipanggil saat user mengunjungi halaman publik dengan query param ?ref=KODE
 */
export function captureReferralCode(code: string, sourceUrl?: string): void {
  if (typeof window === 'undefined') return;
  if (!code || code.trim() === '') return;
  
  const sanitizedCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  if (sanitizedCode.length === 0) return;

  localStorage.setItem(REFERRAL_KEY, sanitizedCode);
  localStorage.setItem(REFERRAL_SOURCE_KEY, sourceUrl || window.location.href);
}

/**
 * Baca kode referral yang tersimpan di localStorage.
 * Dipanggil saat user submit form agar kode disertakan secara diam-diam.
 * @returns kode referral atau null jika tidak ada
 */
export function getStoredReferralCode(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFERRAL_KEY);
}

/**
 * Hapus kode referral dari localStorage.
 * Dipanggil setelah form berhasil disubmit untuk membersihkan state.
 */
export function clearReferralCode(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(REFERRAL_KEY);
  localStorage.removeItem(REFERRAL_SOURCE_KEY);
}
