import { Component, type ErrorInfo, type ReactNode, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Bug,
  ChevronDown,
  ChevronUp,
  Home,
  LifeBuoy,
  RotateCcw,
} from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorDetailsProps {
  error: Error;
  errorInfo: ErrorInfo | null;
}

function ErrorDetails({ error, errorInfo }: ErrorDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const errorText = `${error.toString()}\n\n${errorInfo?.componentStack || ""}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(errorText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-6 bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4" />
          <span>Error details</span>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4">
              <div className="relative">
                <pre className="text-xs text-red-400/80 bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-auto max-h-48 font-mono leading-relaxed">
                  {error.message}
                  {errorInfo?.componentStack}
                </pre>
                <button
                  onClick={copyToClipboard}
                  className="absolute top-2 right-2 px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded transition-colors"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-lg"
          >
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className="relative inline-flex mb-6"
                >
                  <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
                  <div className="relative w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center shadow-xl shadow-red-500/20">
                    <AlertTriangle className="w-10 h-10 text-white" />
                  </div>
                  
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 border-2 border-red-500/30 rounded-2xl"
                  />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold text-zinc-100 mb-2"
                >
                  Oops! Something went wrong
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-zinc-400 leading-relaxed"
                >
                  We&apos;re sorry, but something unexpected happened. 
                  Don&apos;t worry, it&apos;s not your fault!
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-2 gap-3 mb-6"
              >
                <button
                  onClick={this.handleRetry}
                  className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <RotateCcw className="w-4 h-4" />
                  Try Again
                </button>
                
                <Link
                  to="/dashboard"
                  className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-zinc-700 hover:text-white transition-all"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-zinc-800/30 rounded-xl p-4 mb-6"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <LifeBuoy className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-zinc-200 mb-1">Need help?</h3>
                    <p className="text-xs text-zinc-400 mb-2">
                      If this error persists, please contact our support team.
                    </p>
                    <a 
                      href="mailto:support@messagehub.com"
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                      Contact Support →
                    </a>
                  </div>
                </div>
              </motion.div>

              {this.state.error && (
                <ErrorDetails error={this.state.error} errorInfo={this.state.errorInfo} />
              )}
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center text-xs text-zinc-600 mt-6"
            >
              Message Hub
            </motion.p>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
