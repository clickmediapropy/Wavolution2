import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {
  MessageSquare,
  Send,
  Users,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Shield,
  Play,
  Upload,
  Globe,
  ChevronDown,
  Star,
  Quote,
  Check,
} from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    icon: Send,
    title: "Bulk Messaging",
    description:
      "Send thousands of personalized WhatsApp messages in minutes with smart throttling that keeps your number safe.",
    color: "emerald",
  },
  {
    icon: Users,
    title: "Contact Management",
    description:
      "Import contacts via CSV, segment with tags, and keep every conversation organized in one place.",
    color: "blue",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description:
      "Track delivery, read rates, and campaign performance with live dashboards that update instantly.",
    color: "violet",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "End-to-end encryption, role-based access, and audit logs keep your data protected at every step.",
    color: "amber",
  },
  {
    icon: Upload,
    title: "Media Attachments",
    description:
      "Attach images, PDFs, videos, and documents to any message or campaign with drag-and-drop ease.",
    color: "rose",
  },
  {
    icon: Globe,
    title: "Multi-Instance Support",
    description:
      "Connect multiple WhatsApp numbers and manage them all from a single unified dashboard.",
    color: "cyan",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Connect Your WhatsApp",
    description:
      "Scan a QR code to link your WhatsApp number. You're live in under two minutes — no API keys, no approvals.",
  },
  {
    step: "02",
    title: "Import & Organize Contacts",
    description:
      "Upload a CSV or add contacts manually. Tag and segment your audience so every message reaches the right people.",
  },
  {
    step: "03",
    title: "Launch Campaigns",
    description:
      "Write your message, personalize with templates, attach media, and hit send. Watch delivery progress in real time.",
  },
];

const TESTIMONIALS = [
  {
    name: "Sofia Martinez",
    role: "Growth Lead at Revel Commerce",
    avatar: "SM",
    content:
      "We switched from a clunky SMS tool and saw our reply rate jump 4x in the first week. Message Hub made WhatsApp campaigns feel effortless.",
    rating: 5,
  },
  {
    name: "James Okonkwo",
    role: "Founder, BrightPath Edu",
    avatar: "JO",
    content:
      "I send weekly updates to 3,000+ students. The CSV import and personalization templates save me hours every Monday morning.",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "Head of CX, LunaFit",
    avatar: "PS",
    content:
      "The real-time analytics changed the game for us. We can see exactly which messages land and iterate on the fly. 10/10 would recommend.",
    rating: 5,
  },
];

const PRICING = [
  {
    name: "Starter",
    price: "0",
    period: "forever",
    description: "Perfect for testing the waters",
    features: [
      "Up to 500 contacts",
      "1 WhatsApp number",
      "100 messages / day",
      "CSV import & export",
      "Basic analytics",
    ],
    cta: "Get Started Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "49",
    period: "/ month",
    description: "For growing teams that need more power",
    features: [
      "Unlimited contacts",
      "3 WhatsApp numbers",
      "5,000 messages / day",
      "Media attachments",
      "Campaign scheduling",
      "Advanced analytics",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "199",
    period: "/ month",
    description: "For large-scale operations",
    features: [
      "Everything in Pro",
      "Unlimited WhatsApp numbers",
      "Unlimited messages",
      "API access",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
      "SSO & audit logs",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const FAQ = [
  {
    question: "Do I need the WhatsApp Business API?",
    answer:
      "No. Message Hub connects through the standard WhatsApp app via QR code — the same way WhatsApp Web works. No Meta Business verification or API approval required.",
  },
  {
    question: "Is there a risk of getting my number banned?",
    answer:
      "We include smart throttling and configurable delays between messages to mimic natural sending patterns. Combined with best-practice guidelines, this significantly reduces risk. That said, always follow WhatsApp's terms of service.",
  },
  {
    question: "Can I send images, PDFs, and videos?",
    answer:
      "Absolutely. Every plan supports media attachments. Just drag and drop files into the campaign builder and they'll be sent alongside your message.",
  },
  {
    question: "How does the free plan work?",
    answer:
      "The Starter plan is free forever — no credit card required. You get 500 contacts and 100 messages per day, which is plenty for personal use or small-scale testing.",
  },
  {
    question: "Can I use multiple WhatsApp numbers?",
    answer:
      "Yes. The Pro plan supports up to 3 numbers and the Enterprise plan has no limit. Each number gets its own instance that you can manage from a single dashboard.",
  },
];

const STATS = [
  { value: "2M+", label: "Messages Sent" },
  { value: "4,500+", label: "Active Users" },
  { value: "98.7%", label: "Delivery Rate" },
  { value: "<2min", label: "Setup Time" },
];

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */

const GRID_BACKGROUND_STYLE: React.CSSProperties = {
  backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                   linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
  backgroundSize: "60px 60px",
};

function statusColorClass(status: string): string {
  switch (status) {
    case "Read":
      return "bg-emerald-500/20 text-emerald-400";
    case "Delivered":
      return "bg-blue-500/20 text-blue-400";
    default:
      return "bg-zinc-700 text-zinc-400";
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

function FadeInWhenVisible({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5,
        }}
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
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={GRID_BACKGROUND_STYLE}
      />
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-violet-500/20 to-blue-500/20 blur-3xl rounded-3xl" />
      <div className="relative bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-zinc-800">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex-1 mx-4">
            <div className="h-7 bg-zinc-800 rounded-lg flex items-center px-3">
              <span className="text-xs text-zinc-500">
                bulk.agentifycrm.io/dashboard
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: "Contacts", value: "12,847", color: "bg-blue-500" },
            { label: "Sent Today", value: "3,219", color: "bg-emerald-500" },
            { label: "Campaigns", value: "24", color: "bg-violet-500" },
            { label: "Delivery", value: "98.7%", color: "bg-amber-500" },
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
              <div className="text-lg font-bold text-zinc-200">
                {stat.value}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center gap-3 py-2 border-b border-zinc-800 mb-2">
          {["Name", "Phone", "Status", "Last Message"].map((h) => (
            <div
              key={h}
              className="text-xs text-zinc-500 font-medium flex-1"
            >
              {h}
            </div>
          ))}
        </div>

        {[
          { name: "Sofia Martinez", phone: "+1 (555) 012-3456", status: "Delivered" },
          { name: "James Okonkwo", phone: "+44 7700 900123", status: "Read" },
          { name: "Priya Sharma", phone: "+91 98765 43210", status: "Sent" },
        ].map((row, i) => (
          <motion.div
            key={row.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + i * 0.1 }}
            className="flex items-center gap-3 py-2.5 border-b border-zinc-800/50 last:border-0"
          >
            <div className="flex-1 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-400">
                {row.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <span className="text-xs text-zinc-300">{row.name}</span>
            </div>
            <div className="flex-1 text-xs text-zinc-500">{row.phone}</div>
            <div className="flex-1">
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${statusColorClass(row.status)}`}
              >
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

function SectionHeading({
  badge,
  title,
  subtitle,
}: {
  badge?: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="text-center mb-16 max-w-3xl mx-auto">
      {badge && (
        <FadeInWhenVisible>
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
            {badge}
          </span>
        </FadeInWhenVisible>
      )}
      <FadeInWhenVisible delay={0.05}>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-100 mb-4 tracking-tight">
          {title}
        </h2>
      </FadeInWhenVisible>
      <FadeInWhenVisible delay={0.1}>
        <p className="text-lg text-zinc-400 leading-relaxed">{subtitle}</p>
      </FadeInWhenVisible>
    </div>
  );
}

const FEATURE_COLOR_MAP: Record<string, { icon: string; bg: string; border: string }> = {
  emerald: {
    icon: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "group-hover:border-emerald-500/30",
  },
  blue: {
    icon: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "group-hover:border-blue-500/30",
  },
  violet: {
    icon: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "group-hover:border-violet-500/30",
  },
  amber: {
    icon: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "group-hover:border-amber-500/30",
  },
  rose: {
    icon: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "group-hover:border-rose-500/30",
  },
  cyan: {
    icon: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "group-hover:border-cyan-500/30",
  },
};

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof FEATURES)[0];
  index: number;
}) {
  const Icon = feature.icon;
  const c = FEATURE_COLOR_MAP[feature.color] ?? FEATURE_COLOR_MAP.emerald!;

  return (
    <FadeInWhenVisible delay={index * 0.08}>
      <motion.div
        whileHover={{ y: -6, transition: { duration: 0.25 } }}
        className={`group relative h-full bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 ${c.border} rounded-2xl p-8 transition-colors duration-300`}
      >
        <div
          className={`w-14 h-14 rounded-2xl ${c.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className={`w-7 h-7 ${c.icon}`} />
        </div>
        <h3 className="text-lg font-semibold text-zinc-100 mb-3">
          {feature.title}
        </h3>
        <p className="text-sm text-zinc-400 leading-relaxed">
          {feature.description}
        </p>
      </motion.div>
    </FadeInWhenVisible>
  );
}

function StepCard({
  step,
  index,
}: {
  step: (typeof HOW_IT_WORKS)[0];
  index: number;
}) {
  return (
    <FadeInWhenVisible delay={index * 0.15} className="relative">
      <div className="relative flex flex-col items-center text-center">
        {/* Step number */}
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
            <span className="text-xl font-bold text-emerald-400">
              {step.step}
            </span>
          </div>
          {/* Connector line (hidden on last item) */}
          {index < HOW_IT_WORKS.length - 1 && (
            <div className="hidden md:block absolute top-1/2 left-full w-full h-px bg-gradient-to-r from-emerald-500/30 to-transparent" />
          )}
        </div>
        <h3 className="text-xl font-semibold text-zinc-100 mb-3">
          {step.title}
        </h3>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-xs mx-auto">
          {step.description}
        </p>
      </div>
    </FadeInWhenVisible>
  );
}

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: (typeof TESTIMONIALS)[0];
  index: number;
}) {
  return (
    <FadeInWhenVisible delay={index * 0.12}>
      <motion.div
        whileHover={{ y: -4, transition: { duration: 0.25 } }}
        className="relative h-full bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 hover:border-zinc-700 rounded-2xl p-8 transition-colors duration-300"
      >
        <Quote className="w-8 h-8 text-emerald-500/20 mb-4" />
        <p className="text-zinc-300 leading-relaxed mb-6 text-sm">
          "{testimonial.content}"
        </p>
        <div className="flex items-center gap-1 mb-4">
          {Array.from({ length: testimonial.rating }).map((_, i) => (
            <Star
              key={i}
              className="w-4 h-4 fill-amber-400 text-amber-400"
            />
          ))}
        </div>
        <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-violet-500/20 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
            {testimonial.avatar}
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-200">
              {testimonial.name}
            </div>
            <div className="text-xs text-zinc-500">{testimonial.role}</div>
          </div>
        </div>
      </motion.div>
    </FadeInWhenVisible>
  );
}

function PricingCard({
  plan,
  index,
}: {
  plan: (typeof PRICING)[0];
  index: number;
}) {
  return (
    <FadeInWhenVisible delay={index * 0.12}>
      <motion.div
        whileHover={{ y: -6, transition: { duration: 0.25 } }}
        className={`relative h-full rounded-2xl p-8 transition-colors duration-300 ${
          plan.highlighted
            ? "bg-gradient-to-b from-emerald-500/10 via-zinc-900 to-zinc-900 border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/10"
            : "bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 hover:border-zinc-700"
        }`}
      >
        {plan.highlighted && (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span className="px-4 py-1 rounded-full text-xs font-semibold bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
              Most Popular
            </span>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-zinc-100 mb-1">
            {plan.name}
          </h3>
          <p className="text-sm text-zinc-500">{plan.description}</p>
        </div>

        <div className="flex items-baseline gap-1 mb-6">
          <span className="text-4xl font-bold text-zinc-100">
            ${plan.price}
          </span>
          <span className="text-sm text-zinc-500">{plan.period}</span>
        </div>

        <Link
          to="/register"
          className={`block w-full text-center py-3 px-6 rounded-xl text-sm font-semibold transition-all mb-8 ${
            plan.highlighted
              ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-500/25"
              : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700"
          }`}
        >
          {plan.cta}
        </Link>

        <ul className="space-y-3">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-3 text-sm">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-zinc-400">{f}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </FadeInWhenVisible>
  );
}

function FAQItem({
  item,
  index,
}: {
  item: (typeof FAQ)[0];
  index: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <FadeInWhenVisible delay={index * 0.08}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 hover:border-zinc-700 rounded-2xl p-6 transition-colors duration-200"
      >
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-base font-semibold text-zinc-200">
            {item.question}
          </h3>
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0"
          >
            <ChevronDown className="w-5 h-5 text-zinc-500" />
          </motion.div>
        </div>
        <motion.div
          initial={false}
          animate={{
            height: open ? "auto" : 0,
            opacity: open ? 1 : 0,
            marginTop: open ? 12 : 0,
          }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <p className="text-sm text-zinc-400 leading-relaxed">
            {item.answer}
          </p>
        </motion.div>
      </button>
    </FadeInWhenVisible>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const mockupY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const mockupScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      <AnimatedBackground />

      {/* ============================================================ */}
      {/*  HERO                                                        */}
      {/* ============================================================ */}
      <section className="relative pt-16 pb-24">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          {/* Logo */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
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
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-xl shadow-emerald-500/25"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
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
            {[
              "No credit card required",
              "Free forever plan",
              "Setup in 2 minutes",
            ].map((text) => (
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

      {/* ============================================================ */}
      {/*  SOCIAL PROOF BAR                                            */}
      {/* ============================================================ */}
      <section className="relative py-16 border-t border-zinc-800/50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <FadeInWhenVisible
                key={stat.label}
                delay={i * 0.1}
                className="text-center"
              >
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-zinc-500">{stat.label}</div>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FEATURES (6 cards)                                          */}
      {/* ============================================================ */}
      <section className="relative py-24 border-t border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-4">
          <SectionHeading
            badge="Features"
            title="Everything you need to own your outreach"
            subtitle="Powerful tools designed to make WhatsApp messaging efficient, personal, and measurable."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} feature={f} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  HOW IT WORKS (3 steps)                                      */}
      {/* ============================================================ */}
      <section className="relative py-24 border-t border-zinc-800/50">
        <div className="max-w-5xl mx-auto px-4">
          <SectionHeading
            badge="How It Works"
            title="Up and running in three simple steps"
            subtitle="No technical expertise required. Connect, import, and send — it really is that easy."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <StepCard key={step.step} step={step} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  TESTIMONIALS (3 cards)                                      */}
      {/* ============================================================ */}
      <section className="relative py-24 border-t border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-4">
          <SectionHeading
            badge="Testimonials"
            title="Loved by businesses everywhere"
            subtitle="Don't take our word for it — hear from the teams that rely on Message Hub every day."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={t.name} testimonial={t} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  PRICING (3 tiers)                                           */}
      {/* ============================================================ */}
      <section className="relative py-24 border-t border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-4">
          <SectionHeading
            badge="Pricing"
            title="Simple, transparent pricing"
            subtitle="Start free and scale as you grow. No hidden fees, no surprises."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {PRICING.map((plan, i) => (
              <PricingCard key={plan.name} plan={plan} index={i} />
            ))}
          </div>
          <FadeInWhenVisible delay={0.3}>
            <p className="text-center text-sm text-zinc-500 mt-8">
              All plans include a 14-day free trial. No credit card required.
            </p>
          </FadeInWhenVisible>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FAQ (5 questions)                                           */}
      {/* ============================================================ */}
      <section className="relative py-24 border-t border-zinc-800/50">
        <div className="max-w-3xl mx-auto px-4">
          <SectionHeading
            badge="FAQ"
            title="Frequently asked questions"
            subtitle="Everything you need to know before getting started."
          />
          <div className="space-y-4">
            {FAQ.map((item, i) => (
              <FAQItem key={item.question} item={item} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FINAL CTA                                                   */}
      {/* ============================================================ */}
      <section className="relative py-24 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <FadeInWhenVisible>
            <div className="relative bg-gradient-to-br from-emerald-500/10 via-zinc-900 to-zinc-900 border border-emerald-500/20 rounded-3xl p-12 sm:p-16 overflow-hidden">
              {/* Background glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px]" />

              <div className="relative">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-100 mb-4 tracking-tight">
                  Ready to transform your
                  <br />
                  <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    WhatsApp outreach?
                  </span>
                </h2>
                <p className="text-lg text-zinc-400 mb-8 max-w-lg mx-auto">
                  Join thousands of businesses using Message Hub to connect
                  with their customers at scale.
                </p>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-block"
                >
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-10 py-4 text-base font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-xl shadow-emerald-500/25"
                  >
                    Start Free Trial
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </motion.div>
                <p className="text-sm text-zinc-500 mt-4">
                  No credit card required &middot; 14-day free trial &middot;
                  Cancel anytime
                </p>
              </div>
            </div>
          </FadeInWhenVisible>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FOOTER                                                      */}
      {/* ============================================================ */}
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
              &copy; 2025 Message Hub. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {["Privacy", "Terms", "Contact"].map((link) => (
                <Link
                  key={link}
                  to="#"
                  className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
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
