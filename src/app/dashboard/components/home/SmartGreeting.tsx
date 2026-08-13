"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, CloudSun, Sunset } from 'lucide-react';

export default function SmartGreeting({ userName }: { userName: string }) {
  const [greetingData, setGreetingData] = useState({ 
    text: '', 
    subText: '', 
    icon: <Sun className="w-8 h-8 text-yellow-500" /> 
  });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) {
      setGreetingData({
        text: "Selamat Pagi",
        subText: "Siap untuk memulai hari yang produktif?",
        icon: <CloudSun className="w-8 h-8 text-yellow-400" />
      });
    } else if (hour >= 11 && hour < 15) {
      setGreetingData({
        text: "Selamat Siang",
        subText: "Jangan lupa istirahat sejenak.",
        icon: <Sun className="w-8 h-8 text-orange-500" />
      });
    } else if (hour >= 15 && hour < 19) {
      setGreetingData({
        text: "Selamat Sore",
        subText: "Mari tuntaskan pekerjaan hari ini.",
        icon: <Sunset className="w-8 h-8 text-orange-400" />
      });
    } else {
      setGreetingData({
        text: "Selamat Malam",
        subText: "Terima kasih atas dedikasi Anda hari ini.",
        icon: <Moon className="w-8 h-8 text-indigo-400" />
      });
    }
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
  };
  const iconVariants = {
    hidden: { rotate: -20, scale: 0 },
    visible: { rotate: 0, scale: 1, transition: { type: "spring", bounce: 0.6 } }
  };
  const textVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };
  const userVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { delay: 0.4, duration: 0.5 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col md:flex-row md:items-center gap-4 mb-8 px-1 md:px-0"
    >
      <motion.div variants={iconVariants} className="p-3 bg-card rounded-full shadow-sm border border-border w-fit">
        {greetingData.icon}
      </motion.div>
      <div>
        <motion.h1 variants={textVariants} className="text-3xl font-bold text-foreground">
          {greetingData.text}, <motion.span variants={userVariants} className="text-primary inline-block">{userName}</motion.span>!
        </motion.h1>
        <motion.p variants={textVariants} className="text-muted-foreground mt-1">
          {greetingData.subText}
        </motion.p>
      </div>
    </motion.div>
  );
};