"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import { testimonials } from '@/data/testimonials';

export function SocialProofBanner() {
  // Hanya menampilkan satu testimoni secara acak atau yang pertama untuk banner mikro
  const testimonial = testimonials[0];

  if (!testimonial) return null;

  return (
    <section className="w-full py-12 border-b border-border/40 bg-muted/20 relative z-20">
      <div className="max-w-4xl mx-auto px-6 flex flex-col items-center text-center">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative glass-enterprise p-8 md:p-10 rounded-3xl border border-white/10 shadow-sm"
        >
          <Quote className="absolute top-6 left-6 w-8 h-8 text-primary/20" />
          
          <p className="text-lg md:text-xl font-medium text-foreground leading-relaxed relative z-10 mb-6 italic">
            "{testimonial.quote}"
          </p>
          
          <div className="flex flex-col items-center gap-1 relative z-10">
            <h4 className="font-bold text-foreground text-sm">{testimonial.author}</h4>
            <p className="text-xs text-muted-foreground">{testimonial.role}, {testimonial.agency}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
