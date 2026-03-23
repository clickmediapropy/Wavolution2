import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthActions } from "@convex-dev/auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Eye, EyeOff, MessageSquare, Sparkles, X } from "lucide-react";
import { getPasswordStrength, STRENGTH_COLORS } from "@/lib/passwordStrength";
import { pageVariants } from "@/lib/transitions";
import { cn } from "@/lib/utils";

export function RegisterPage(): React.ReactElement {
  const navigate = useNavigate();
  const { signIn } = useAuthActions();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const strengthColor = STRENGTH_COLORS[passwordStrength] || STRENGTH_COLORS[0];
  const strengthLabels = ["Empty", "Weak", "Fair", "Good", "Strong"];
  const strengthLabel = strengthLabels[passwordStrength] || "Empty";

  // Password requirements
  const requirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Contains lowercase letter", met: /[a-z]/.test(password) },
    { label: "Contains number", met: /\d/.test(password) },
    { label: "Contains special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    
    if (passwordStrength < 3) {
      setError("Please choose a stronger password");
      return;
    }
    
    setIsSubmitting(true);

    try {
      await signIn("password", { 
        name,
        email, 
        password, 
        flow: "signUp" 
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
      className="relative flex items-center justify-center min-h-[80vh] overflow-hidden py-12"
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
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            y: [0, 20, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"
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
          <h1 className="text-3xl font-bold text-zinc-100 mb-2">Create account</h1>
          <p className="text-zinc-400">Start your messaging journey today</p>
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
            {/* Name field */}
            <div className="relative">
              <label 
                htmlFor="name" 
                className={cn(
                  "block text-sm font-medium mb-2 transition-colors",
                  focusedField === "name" ? "text-emerald-400" : "text-zinc-300"
                )}
              >
                Full name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField(null)}
                required
                className={cn(
                  "w-full px-4 py-3 bg-zinc-800/50 border rounded-xl text-zinc-100 placeholder:text-zinc-500",
                  "outline-none transition-all duration-200",
                  "focus:bg-zinc-800 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10",
                  focusedField === "name" ? "border-emerald-500/50" : "border-zinc-700"
                )}
                placeholder="John Doe"
              />
            </div>

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
            </div>

            {/* Password field */}
            <div className="relative">
              <label 
                htmlFor="password" 
                className={cn(
                  "block text-sm font-medium mb-2 transition-colors",
                  focusedField === "password" ? "text-emerald-400" : "text-zinc-300"
                )}
              >
                Password
              </label>
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
                  placeholder="Create a strong password"
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

              {/* Password strength indicator */}
              <AnimatePresence>
                {password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 space-y-2"
                  >
                    {/* Strength bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(passwordStrength / 5) * 100}%` }}
                          transition={{ duration: 0.3 }}
                          className={cn("h-full rounded-full transition-colors", strengthColor)}
                        />
                      </div>
                      <span className={cn("text-xs font-medium", strengthColor.replace("bg-", "text-"))}>
                        {strengthLabel}
                      </span>
                    </div>

                    {/* Requirements checklist */}
                    <div className="space-y-1">
                      {requirements.map((req, i) => (
                        <motion.div
                          key={req.label}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={cn(
                            "flex items-center gap-2 text-xs transition-colors",
                            req.met ? "text-emerald-400" : "text-zinc-500"
                          )}
                        >
                          {req.met ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <X className="w-3 h-3" />
                          )}
                          {req.label}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Submit button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isSubmitting || passwordStrength < 3}
              className={cn(
                "w-full relative overflow-hidden group",
                "bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500",
                "hover:from-emerald-500 hover:via-emerald-400 hover:to-teal-400",
                "text-white py-3.5 rounded-xl font-semibold",
                "transition-all duration-300 shadow-lg shadow-emerald-500/25",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                "flex items-center justify-center gap-2 mt-6"
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
                  Creating account...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Create account
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>

          {/* Sign in link */}
          <p className="text-center text-sm text-zinc-500 pt-6 mt-6 border-t border-zinc-800">
            Already have an account?{" "}
            <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
              Sign in
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
          By creating an account, you agree to our Terms and Privacy Policy
        </motion.p>
      </div>
    </motion.div>
  );
}
