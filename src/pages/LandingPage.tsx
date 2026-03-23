import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { 
  MessageSquare, 
  Send, 
  Users, 
  Megaphone, 
  ArrowRight, 
  Zap,
  Sparkles,
  BarChart3,
  Shield,
  Clock,
  CheckCircle2,
  Play
} from "lucide-react";
import { useRef } from "react";

const VALUE_PROPS = [
  {
    icon: Users,
    color: "blue",
    title: "Contact Management",
    description: "Import CSV files, organize contacts with tags, and track message delivery status in real-time.",
  },
  {
    icon: Send,
    color: "emerald",
    title: "Direct Messaging",
    description: "Send individual WhatsApp messages with rich media attachments and live preview before sending.",
  },
  {
    icon: Megaphone,
    color: "violet",
    title: "Bulk Campaigns",
    description: "Create targeted campaigns with personalization templates, smart delays, and live progress tracking.",
  },
];

const FEATURES = [
  { icon: Zap, label: "Instant Delivery", color: "amber" },
  { icon: Shield, label: "End-to-End Secure", color: "emerald" },
  { icon: BarChart3, label: "Real-time Analytics", color: "blue" },
  { icon: Clock, label: "Scheduled Campaigns", color: "violet" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const }
  },
};

function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated gradient orbs */}
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[120px]"
      />
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          x: [0, -30, 0],
          y: [0, 50, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        className="absolute -bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-[100px]"
      />
      <motion.div
        animate={{ 
          scale: [1, 1.3, 1],
          rotate: [0, 180, 360],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[80px]"
      />
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="relative">
      {/* Glow effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-violet-500/20 to-blue-500/20 blur-3xl rounded-3xl" />
      
      {/* Main card */}
      <div className="relative bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-6 shadow-2xl">
        {/* Header bar */}
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-zinc-800">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex-1 mx-4">
            <div className="h-7 bg-zinc-800 rounded-lg flex items-center px-3">
              <span className="text-xs text-zinc-500">app.messagehub.com</span>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: "Contacts", value: "1,234", color: "bg-blue-500" },
            { label: "Messages", value: "8.5K", color: "bg-violet-500" },
            { label: "Active", value: "12", color: "bg-amber-500" },
            { label: "Status", value: "Online", color: "bg-emerald-500" },
          ].map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50"
            >
              <div className={`w-2 h-2 rounded-full ${stat.color} mb-2`} />
              <div className="text-xs text-zinc-500 mb-1">{stat.label}</div>
              <div className="text-lg font-bold text-zinc-200">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Table header */}
        <div className="flex items-center gap-3 py-2 border-b border-zinc-800 mb-2">
          {["Name", "Phone", "Status", "Last Message"].map((h) => (
            <div key={h} className="text-xs text-zinc-500 font-medium flex-1">{h}</div>
          ))}
        </div>
        
        {/* Table rows */}
        {[
          { name: "John Doe", phone: "+1234567890", status: "Active" },
          { name: "Jane Smith", phone: "+0987654321", status: "Delivered" },
          { name: "Mike Johnson", phone: "+1122334455", status: "Sent" },
        ].map((row, i) => (
          <motion.div 
            key={row.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + i * 0.1 }}
            className="flex items-center gap-3 py-2.5 border-b border-zinc-800/50 last:border-0"
          >
            <div className="flex-1 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-zinc-700" />
              <span className="text-xs text-zinc-300">{row.name}</span>
            </div>
            <div className="flex-1 text-xs text-zinc-500">{row.phone}</div>
            <div className="flex-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                row.status === "Active" ? "bg-emerald-500/20 text-emerald-400" :
                row.status === "Delivered" ? "bg-blue-500/20 text-blue-400" :
                "bg-zinc-700 text-zinc-400"
              }`}>
                {row.status}
              </span>
            </div>
            <div className="flex-1 text-xs text-zinc-500">2 min ago</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const Icon = feature.icon;
  const colorMap: Record<string, string> = {
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    violet: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`flex flex-col items-center gap-3 p-5 rounded-2xl border bg-zinc-900/50 backdrop-blur-sm ${colorMap[feature.color]}`}
    >
      <Icon className="w-6 h-6" />
      <span className="text-sm font-medium text-zinc-300">{feature.label}</span>
    </motion.div>
  );
}

function ValuePropCard({ prop, index }: { prop: typeof VALUE_PROPS[0]; index: number }) {
  const Icon = prop.icon;
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
    violet: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
  };
  const colors = colorMap[prop.color] ?? colorMap.emerald!;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15 }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className={`group bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 hover:border-zinc-700 rounded-2xl p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-black/20`}
    >
      <div className={`w-14 h-14 rounded-2xl ${colors.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className={`w-7 h-7 ${colors.text}`} />
      </div>
      <h3 className="text-lg font-semibold text-zinc-100 mb-3">
        {prop.title}
      </h3>
      <p className="text-sm text-zinc-400 leading-relaxed">
        {prop.description}
      </p>
    </motion.div>
  );
}

export function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  const mockupY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const mockupScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Hero Section */}
      <section className="relative pt-16 pb-24">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          {/* Logo */}
          <motion.div variants={itemVariants} className="flex items-center justify-center gap-3 mb-8">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-emerald-500 rounded-2xl blur-xl -z-10"
              />
            </div>
          </motion.div>

          {/* Announcement badge */}
          <motion.div variants={itemVariants} className="mb-8">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-sm text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all group"
            >
              <Sparkles className="w-4 h-4" />
              <span>Now with AI-powered templates</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 tracking-tight"
          >
            <span className="bg-gradient-to-b from-white via-white to-zinc-400 bg-clip-text text-transparent">
              WhatsApp Messaging
            </span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 bg-clip-text text-transparent">
              at Scale
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Manage contacts, send personalized messages, and run bulk campaigns
            — all from one powerful dashboard. Built for modern businesses.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-xl shadow-emerald-500/25"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-zinc-300 bg-zinc-800/50 border border-zinc-700 rounded-xl hover:bg-zinc-800 hover:text-white transition-all backdrop-blur-sm"
              >
                <Play className="w-4 h-4" />
                Watch Demo
              </Link>
            </motion.div>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-zinc-500"
          >
            {["No credit card required", "Free forever plan", "Setup in 2 minutes"].map((text) => (
              <div key={text} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{text}</span>
              </div>
            ))}
          </motion.div>

          {/* Dashboard mockup with parallax */}
          <motion.div
            variants={itemVariants}
            style={{ y: mockupY, scale: mockupScale }}
            className="relative mt-20 max-w-4xl mx-auto px-4"
          >
            <DashboardMockup />
          </motion.div>
        </motion.div>
      </section>

      {/* Features grid */}
      <section className="relative py-20 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl font-bold text-zinc-100 mb-3">Everything you need</h2>
            <p className="text-zinc-400">Powerful features to supercharge your messaging</p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FEATURES.map((feature, i) => (
              <FeatureCard key={feature.label} feature={feature} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="relative py-24 border-t border-zinc-800/50">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-4">
              Built for modern teams
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              Streamline your WhatsApp communication with tools designed for efficiency and scale.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VALUE_PROPS.map((prop, i) => (
              <ValuePropCard key={prop.title} prop={prop} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-br from-emerald-500/10 via-zinc-900 to-zinc-900 border border-emerald-500/20 rounded-3xl p-12 overflow-hidden"
          >
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px]" />
            
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-4">
                Ready to get started?
              </h2>
              <p className="text-lg text-zinc-400 mb-8 max-w-lg mx-auto">
                Join thousands of businesses using Message Hub to connect with their customers.
              </p>
              <motion.div 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }}
                className="inline-block"
              >
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-xl shadow-emerald-500/25"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
              <p className="text-sm text-zinc-500 mt-4">
                No credit card required • 14-day free trial
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 border-t border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-zinc-100">Message Hub</span>
            </div>
            <p className="text-sm text-zinc-500">
              © 2025 Message Hub. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {["Privacy", "Terms", "Contact"].map((link) => (
                <Link key={link} to="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                  {link}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
