export const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

export const fadeIn = (
  direction: "up" | "down" | "left" | "right",
  type: "spring" | "tween",
  delay: number,
  duration: number
) => ({
  hidden: {
    opacity: 0,
    y: direction === "up" ? 20 : direction === "down" ? -20 : 0,
    x: direction === "left" ? 20 : direction === "right" ? -20 : 0,
  },
  show: {
    opacity: 1,
    y: 0,
    x: 0,
    transition: {
      type,
      delay,
      duration,
      ease: "easeOut",
    },
  },
});

export const slideIn = (
  direction: "up" | "down" | "left" | "right",
  type: "spring" | "tween",
  delay: number,
  duration: number
) => ({
  hidden: {
    opacity: 0,
    y: direction === "up" ? 100 : direction === "down" ? -100 : 0,
    x: direction === "left" ? 100 : direction === "right" ? -100 : 0,
  },
  show: {
    opacity: 1,
    y: 0,
    x: 0,
    transition: {
      type,
      delay,
      duration,
      ease: "easeOut",
    },
  },
});

export const zoomIn = (delay: number, duration: number) => ({
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "tween",
      delay,
      duration,
      ease: "easeOut",
    },
  },
});

export const textVariant = (delay: number) => ({
  hidden: {
    opacity: 0,
    y: 20,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 12,
      stiffness: 100,
      delay,
    },
  },
});

export const textContainer = {
  hidden: {
    opacity: 0,
  },
  show: (i = 1) => ({
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: i * 0.1 },
  }),
};

export const textVariant2 = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "tween",
      ease: "easeIn",
    },
  },
};

export const scaleVariants = {
  hidden: { opacity: 0, scale: 0.6 },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "tween",
      ease: "easeOut",
      duration: 0.5,
    },
  },
};

export const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3,
      ease: "easeOut",
    },
  }),
};

export const hoverScale = {
  initial: { scale: 1 },
  hover: { scale: 1.05, transition: { duration: 0.3 } },
  tap: { scale: 0.98, transition: { duration: 0.15 } },
};
