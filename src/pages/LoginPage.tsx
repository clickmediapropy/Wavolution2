import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthActions } from "@convex-dev/auth/react";
import { motion } from "framer-motion";
import { MessageSquare, Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react";
import { pageVariants } from "@/lib/transitions";

export function LoginPage() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await signIn("password", { email, password, flow: "signIn" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative flex items-center justify-center min-h-[80vh] overflow-hidden"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-gradient-mesh opacity-50"
          style={{ animation: "gradient-shift 20s ease infinite" }}
        />
        
        {/* Floating orbs */}
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            y: [0, 20, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            x: [0, 30, 0],
            y: [0, -15, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/2 right-1/3 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative w-full max-w-md px-4">
        {/* Logo and header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-16 h-16 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/20"
          >
            <MessageSquare className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-zinc-100 mb-2">Welcome back</h1>
          <p className="text-zinc-400">Sign in to continue to Message Hub</p>
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 p-8 shadow-2xl"
        >
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              role="alert" 
              className="bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl px-4 py-3 text-sm mb-6 flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field */}
            <div className="relative">
              <label 
                htmlFor="email" 
                className={cn(
                  "block text-sm font-medium mb-2 transition-colors",
                  focusedField === "email" ? "text-emerald-400" : "text-zinc-300"
                )}
              >
                Email address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  required
                  className={cn(
                    "w-full px-4 py-3 bg-zinc-800/50 border rounded-xl text-zinc-100 placeholder:text-zinc-500",
                    "outline-none transition-all duration-200",
                    "focus:bg-zinc-800 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10",
                    focusedField === "email" ? "border-emerald-500/50" : "border-zinc-700"
                  )}
                  placeholder="you@example.com"
                />
                {email && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </motion.div>
                )}
              </div>
            </div>

            {/* Password field */}
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <label 
                  htmlFor="password" 
                  className={cn(
                    "text-sm font-medium transition-colors",
                    focusedField === "password" ? "text-emerald-400" : "text-zinc-300"
                  )}
                >
                  Password
                </label>
                <Link 
                  to="#" 
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  required
                  className={cn(
                    "w-full px-4 py-3 bg-zinc-800/50 border rounded-xl text-zinc-100 placeholder:text-zinc-500",
                    "outline-none transition-all duration-200",
                    "focus:bg-zinc-800 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10",
                    focusedField === "password" ? "border-emerald-500/50" : "border-zinc-700"
                  )}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-zinc-700/50"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full relative overflow-hidden group",
                "bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500",
                "hover:from-emerald-500 hover:via-emerald-400 hover:to-teal-400",
                "text-white py-3.5 rounded-xl font-semibold",
                "transition-all duration-300 shadow-lg shadow-emerald-500/25",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                "flex items-center justify-center gap-2"
              )}
            >
              {/* Button glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-zinc-900 text-zinc-500">or continue with</span>
            </div>
          </div>

          {/* Social buttons placeholder */}
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-xl text-zinc-300 transition-all duration-200">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm font-medium">Google</span>
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-xl text-zinc-300 transition-all duration-200">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              <span className="text-sm font-medium">GitHub</span>
            </button>
          </div>

          {/* Sign up link */}
          <p className="text-center text-sm text-zinc-500 pt-6 mt-6 border-t border-zinc-800">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
              Create account
            </Link>
          </p>
        </motion.div>

        {/* Footer text */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-zinc-600 mt-8"
        >
          Protected by industry-standard encryption
        </motion.p>
      </div>
    </motion.div>
  );
}

// Helper function for className concatenation
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
