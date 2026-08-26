export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  agency: string;
}

export const testimonials: Testimonial[] = [
  {
    id: "1",
    quote: "SIGAP sangat membantu dalam merampingkan proses administrasi persuratan kami. Semuanya menjadi lebih cepat, transparan, dan mudah dilacak.",
    author: "Bapak/Ibu Pengguna",
    role: "Administrator",
    agency: "Instansi Pemerintah Daerah"
  }
];
