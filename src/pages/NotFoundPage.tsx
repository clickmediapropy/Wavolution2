import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Home, MessageSquare, Search } from "lucide-react";

interface AnimatedDigitProps {
  digit: string;
  delay: number;
}

function AnimatedDigit({ digit, delay }: AnimatedDigitProps): React.ReactElement {
  return (
    <motion.span
      initial={{ opacity: 0, y: 50, rotateX: -90 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ 
        delay, 
        duration: 0.6, 
        type: "spring",
        stiffness: 200,
        damping: 20
      }}
      className="inline-block text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-500"
    >
      {digit}
    </motion.span>
  );
}

interface FloatingElementProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

function FloatingElement({
  children,
  delay = 0,
  duration = 3,
  className = ""
}: FloatingElementProps): React.ReactElement {
  return (
    <motion.div
      animate={{ 
        y: [0, -15, 0],
        rotate: [0, 5, -5, 0],
      }}
      transition={{ 
        duration, 
        repeat: Infinity, 
        ease: "easeInOut",
        delay 
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const DIGITS = ["4", "0", "4"] as const;

export function NotFoundPage(): React.ReactElement {

  return (
    <div className="relative min-h-[70vh] flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <FloatingElement delay={0} duration={4} className="absolute top-1/4 left-1/4">
          <div className="w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />
        </FloatingElement>
        <FloatingElement delay={1} duration={5} className="absolute top-1/3 right-1/4">
          <div className="w-40 h-40 bg-violet-500/5 rounded-full blur-3xl" />
        </FloatingElement>
        <FloatingElement delay={2} duration={6} className="absolute bottom-1/4 left-1/3">
          <div className="w-48 h-48 bg-blue-500/5 rounded-full blur-3xl" />
        </FloatingElement>
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative text-center z-10"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="relative inline-flex mb-8"
        >
          <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full" />
          <div className="relative w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/20">
            <Search className="w-10 h-10 text-white" />
          </div>
          
          {/* Orbiting dots */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          >
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full" />
          </motion.div>
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-8px]"
          >
            <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-violet-400 rounded-full" />
          </motion.div>
        </motion.div>

        {/* 404 with animation */}
        <h1 className="text-8xl sm:text-9xl font-bold mb-4 tracking-tighter">
          {DIGITS.map((digit, i) => (
            <AnimatedDigit key={i} digit={digit} delay={0.3 + i * 0.1} />
          ))}
        </h1>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-3">
            Page not found
          </h2>
          <p className="text-zinc-400 max-w-md mx-auto mb-8 leading-relaxed">
            Oops! Looks like this page has gone on vacation. 
            Let&apos;s get you back to somewhere familiar.
          </p>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-lg shadow-emerald-500/25"
            >
              <Home className="w-4 h-4" />
              Go to Dashboard
            </Link>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-zinc-300 bg-zinc-800/50 border border-zinc-700 rounded-xl hover:bg-zinc-800 hover:text-white transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </motion.div>
        </motion.div>

        {/* Helpful links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="mt-12 pt-8 border-t border-zinc-800/50"
        >
          <p className="text-sm text-zinc-500 mb-4">Looking for something else?</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              { label: "Dashboard", to: "/dashboard" },
              { label: "Contacts", to: "/contacts" },
              { label: "Campaigns", to: "/campaigns" },
              { label: "Send Message", to: "/send" },
            ].map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Decorative elements */}
      <div className="absolute bottom-8 left-8 opacity-20">
        <MessageSquare className="w-8 h-8 text-zinc-600" />
      </div>
      <div className="absolute top-8 right-8 opacity-20">
        <div className="w-12 h-12 border-2 border-zinc-700 rounded-lg rotate-12" />
      </div>
    </div>
  );
}
