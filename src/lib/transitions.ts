import { Transition, Variants } from "framer-motion";

// Consistent animation presets for the entire application
export const transitions = {
  default: { duration: 0.2, ease: "easeOut" } as Transition,
  spring: { type: "spring", stiffness: 300, damping: 30 } as Transition,
  slow: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } as Transition,
  bounce: { type: "spring", stiffness: 400, damping: 25 } as Transition,
  smooth: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } as Transition,
};

// Page transition variants
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: transitions.default
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.15 }
  }
};

// Fade in variants
export const fadeInVariants: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: transitions.default
  },
  exit: { opacity: 0 }
};

// Scale in variants (for modals, popovers)
export const scaleInVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: transitions.spring
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: 0.15 }
  }
};

// Slide in from right variants (for drawers)
export const slideInRightVariants: Variants = {
  initial: { x: "100%", opacity: 0 },
  animate: { 
    x: 0, 
    opacity: 1,
    transition: transitions.smooth
  },
  exit: { 
    x: "100%", 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

// Slide in from bottom variants (for mobile sheets)
export const slideInBottomVariants: Variants = {
  initial: { y: "100%", opacity: 0 },
  animate: { 
    y: 0, 
    opacity: 1,
    transition: transitions.smooth
  },
  exit: { 
    y: "100%", 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

// Stagger container variants
export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

// Stagger item variants
export const staggerItemVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: transitions.default
  }
};

// Card hover animation
export const cardHoverAnimation = {
  rest: { scale: 1, y: 0 },
  hover: { 
    scale: 1.02, 
    y: -4,
    transition: transitions.spring
  }
};

// Button tap animation
export const buttonTapAnimation = {
  scale: 0.98
};

// Shake animation for errors
export const shakeAnimation = {
  x: [0, -10, 10, -10, 10, 0],
  transition: { duration: 0.5 }
};

// Pulse animation for loading/attention
export const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: { duration: 2, repeat: Infinity }
};

// Layout animation config
export const layoutAnimation = {
  layout: true,
  transition: transitions.spring
};
