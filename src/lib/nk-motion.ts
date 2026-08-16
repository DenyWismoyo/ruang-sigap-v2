export const nkTransition = {
  fast: { duration: 0.15, ease: [0.4, 0, 0.2, 1] },
  normal: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
  slow: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  spring: { type: "spring", stiffness: 350, damping: 30 },
  springBounce: { type: "spring", stiffness: 300, damping: 20 },
};

export const nkVariants = {
  fadeInUp: {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: nkTransition.normal }
  },
  fadeInLeft: {
    hidden: { opacity: 0, x: -12 },
    visible: { opacity: 1, x: 0, transition: nkTransition.normal }
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: nkTransition.spring }
  },
  stagger: {
    visible: { transition: { staggerChildren: 0.05 } }
  },
  hoverCard: {
    rest: { y: 0, boxShadow: "var(--nk-shadow-sm)" },
    hover: { 
      y: -2, 
      boxShadow: "var(--nk-shadow-md)",
      transition: nkTransition.normal
    }
  },
  tapButton: {
    rest: { scale: 1 },
    tap: { scale: 0.97, transition: nkTransition.fast }
  }
};
