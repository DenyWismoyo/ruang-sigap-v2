// Lokasi: src/app/page.tsx
import { redirect } from 'next/navigation';

export default function Home() {
  // Langsung mengarahkan pengguna ke halaman login
  redirect('/login');
}