"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ShieldCheck, Database, Server } from "lucide-react";

const faqs = [
  {
    question: "Apakah sistem ini mematuhi standar SPBE Nasional?",
    answer: "Ya. Infrastruktur dan arsitektur data dirancang secara ketat mengikuti pedoman Peraturan Presiden No. 95 Tahun 2018 tentang Sistem Pemerintahan Berbasis Elektronik (SPBE). Semua pemrosesan data dilakukan dengan kedaulatan tinggi."
  },
  {
    question: "Di mana data instansi kami disimpan?",
    answer: "Sesuai dengan amanat PP No. 71 Tahun 2019 (PSTE), seluruh data, dokumen arsip, dan database ditempatkan eksklusif pada Cloud Server berlokasi di wilayah hukum Indonesia (Data Center Region Jakarta). Tidak ada data yang melintasi batas negara."
  },
  {
    question: "Apakah data OPD kami bercampur dengan instansi lain?",
    answer: "Tidak. Kami mengimplementasikan Tenant Isolation yang ketat di level query dan database. Setiap instansi memiliki ruang partisi datanya sendiri yang tidak bisa ditembus oleh instansi lain, didukung Firestore Security Rules berstandar enterprise."
  },
  {
    question: "Seberapa aman dokumen rahasia instansi?",
    answer: "Seluruh transmisi data dienkripsi dengan standar TLS (Transport Layer Security) 1.2+ dan data yang tersimpan (Data-at-Rest) dienkripsi dengan AES-256 (Advanced Encryption Standard). Selain itu, login terproteksi via Firebase Auth dan token JWT yang aman."
  },
  {
    question: "Berapa lama proses setup hingga Go-Live?",
    answer: "Sistem dapat langsung digunakan dalam waktu kurang dari 1 minggu setelah proses administrasi awal selesai."
  },
  {
    question: "Apakah kami perlu tim IT sendiri untuk mengoperasikannya?",
    answer: "Tidak perlu. Sistem ini didesain user-friendly sehingga cukup dioperasikan oleh Admin OPD masing-masing atau bagian Tata Usaha (TU) OPD tanpa memerlukan keahlian teknis khusus."
  }
];

export function ComplianceFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 bg-muted/30 relative z-10 border-t border-border/50">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-semibold mb-6 border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" />
            <span>Keamanan & Kepatuhan</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-4">Pertanyaan yang Sering Diajukan</h2>
          <p className="text-muted-foreground text-lg">Informasi terkait kedaulatan data dan operasional SPBE.</p>
        </div>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`border border-border/50 rounded-2xl overflow-hidden transition-colors ${openIndex === index ? 'bg-background shadow-sm border-primary/20' : 'bg-transparent hover:bg-background/50'}`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
              >
                <span className="font-semibold text-foreground">{faq.question}</span>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 shrink-0 ${openIndex === index ? 'rotate-180 text-primary' : ''}`} />
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-6 pb-5 pt-1 text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
        
        {/* Trust badges */}
        <div className="mt-16 flex flex-wrap justify-center gap-8 opacity-60">
           <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
             <ShieldCheck className="w-5 h-5" /> AES-256 Encryption
           </div>
           <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
             <Database className="w-5 h-5" /> Data Sovereignty (ID)
           </div>
           <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
             <Server className="w-5 h-5" /> Cloud Native Architecture
           </div>
        </div>
      </div>
    </section>
  );
}
