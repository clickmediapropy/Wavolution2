import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthActions } from "@convex-dev/auth/react";
import { MessageSquare } from "lucide-react";

export function LoginPage() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div className="flex items-center justify-center min-h-[80vh] animate-fadeIn">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">Welcome back</h1>
          <p className="text-zinc-500 mt-1">Sign in to Message Hub</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 space-y-4">
          {error && (
            <div role="alert" className="bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>

          <p className="text-center text-sm text-zinc-500">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-medium">
              Create account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
