"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Brain, Zap, Target, BarChart3, Users, Shield, Play, Star, BookOpen, Hexagon, Globe, ChevronRight } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";

// --- HSR UI Components ---
const HsrButton = React.memo(({
  children,
  variant = 'primary',
  icon: Icon,
  href
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'gold';
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  href?: string;
}) => {
  const baseStyles = "relative group px-8 py-3 font-bold uppercase tracking-wider text-sm transition-all duration-300 transform hover:-translate-y-1 overflow-hidden";

  const variants = {
    primary: "bg-white text-black hover:bg-cyan-50 clip-path-slant-right",
    secondary: "bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-black/60 clip-path-slant-left",
    gold: "bg-gradient-to-r from-amber-200 to-amber-500 text-black hover:brightness-110 clip-path-slant-right"
  };

  const content = (
    <button className={`${baseStyles} ${variants[variant]}`}>
      <div className="flex items-center gap-2 relative z-10">
        {Icon && <Icon size={16} className={variant === 'gold' ? 'animate-pulse' : ''} />}
        {children}
      </div>
      <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
    </button>
  );

  return href ? <Link href={href}>{content}</Link> : content;
});
HsrButton.displayName = 'HsrButton';

const TechDecoration = React.memo(({ className }: { className?: string }) => (
  <div className={`absolute pointer-events-none opacity-40 ${className}`}>
    <div className="flex gap-1">
      <div className="w-1 h-1 bg-white rounded-full animate-ping" />
      <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent" />
      <div className="w-1 h-1 bg-white rounded-full" />
    </div>
  </div>
));
TechDecoration.displayName = 'TechDecoration';

// Typing animation component
const TypingText = React.memo(({ text, className }: { text: string; className?: string }) => {
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const typeSpeed = isDeleting ? 30 : 80;
    const pauseTime = isDeleting ? 500 : 2000;

    if (!isDeleting && displayText === text) {
      setTimeout(() => setIsDeleting(true), pauseTime);
      return;
    }

    if (isDeleting && displayText === '') {
      setIsDeleting(false);
      return;
    }

    const timeout = setTimeout(() => {
      setDisplayText(prev =>
        isDeleting
          ? prev.slice(0, -1)
          : text.slice(0, prev.length + 1)
      );
    }, typeSpeed);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, text]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">_</span>
    </span>
  );
});
TypingText.displayName = 'TypingText';

// Roster Section for AI Learning Modes
const RosterSection = React.memo(() => {
  const [activeUnit, setActiveUnit] = useState(0);

  const units = [
    {
      id: 0,
      name: "Standard Mode",
      role: "Gemini 3.0 / Learning",
      desc: "Perfect for everyday learning. Fast responses, clear explanations, and adaptive difficulty.",
      stats: { speed: 95, clarity: 85, depth: 70 },
      color: "from-cyan-500 to-blue-600",
      icon: Brain
    },
    {
      id: 1,
      name: "Pro Mode",
      role: "Gemini 3.0 Pro / Advanced",
      desc: "Deep analysis and complex problem solving. Handles multi-step reasoning and research tasks.",
      stats: { speed: 75, clarity: 90, depth: 95 },
      color: "from-amber-400 to-orange-500",
      icon: Zap
    },
    {
      id: 2,
      name: "Adaptive Mode",
      role: "Auto-Select / Personalized",
      desc: "AI automatically selects the best model based on your question complexity and learning history.",
      stats: { speed: 85, clarity: 90, depth: 85 },
      color: "from-emerald-400 to-teal-500",
      icon: Target
    }
  ];

  const current = units[activeUnit];

  return (
    <div className="relative py-20 overflow-hidden border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-12">
          <div className="w-16 h-1 bg-cyan-500" />
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">AI Learning Modes</h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 min-h-[500px]">
          {/* List Selection */}
          <div className="w-full lg:w-1/3 space-y-2">
            {units.map((unit, idx) => (
              <button
                key={unit.id}
                onClick={() => setActiveUnit(idx)}
                className={`w-full group relative h-20 flex items-center px-6 transition-all duration-300 ${activeUnit === idx
                  ? 'bg-gradient-to-r from-white/10 to-transparent border-l-4 border-cyan-400 translate-x-2'
                  : 'bg-black/40 hover:bg-white/5 border-l-4 border-transparent hover:border-white/20'
                  }`}
              >
                <div className="mr-4">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${unit.color} flex items-center justify-center`}>
                    <unit.icon size={20} className="text-white" />
                  </div>
                </div>
                <div className="text-left">
                  <h3 className={`font-bold uppercase text-sm ${activeUnit === idx ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                    {unit.name}
                  </h3>
                  <p className="text-[10px] text-gray-500 font-mono tracking-widest">{unit.role}</p>
                </div>

                {activeUnit === idx && (
                  <ChevronRight className="absolute right-4 text-cyan-400 animate-pulse" size={16} />
                )}
              </button>
            ))}
          </div>

          {/* Main Display */}
          <div className="w-full lg:w-2/3 relative">
            <div className="absolute inset-0 bg-white/5 clip-path-slant-right backdrop-blur-sm border border-white/10" />

            <div className="relative z-10 p-12 flex flex-col md:flex-row gap-8 h-full items-center">
              {/* Mode Icon Display */}
              <div className="w-64 h-64 md:w-80 md:h-full flex-shrink-0 relative group">
                <div className={`absolute inset-0 bg-gradient-to-b ${current.color} opacity-20 rounded-full blur-3xl group-hover:opacity-40 transition-opacity`} />
                <div className="relative w-full h-full border-2 border-white/10 bg-black/50 flex items-center justify-center clip-path-hexagon">
                  <current.icon size={80} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                </div>

                <div className="absolute top-0 right-0 w-4 h-4 bg-white rounded-full animate-ping" />
                <div className="absolute bottom-10 left-0 w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
              </div>

              {/* Details */}
              <div className="flex-1 space-y-6">
                <div>
                  <h3 className="text-4xl font-black italic text-white mb-2">{current.name}</h3>
                  <div className="inline-block px-3 py-1 bg-white/10 rounded text-xs font-mono text-cyan-400 border border-cyan-500/30">
                    {current.role}
                  </div>
                </div>

                <p className="text-gray-400 leading-relaxed text-sm border-l-2 border-white/10 pl-4">
                  {current.desc}
                </p>

                {/* Stats Bars */}
                <div className="space-y-3 pt-4">
                  {Object.entries(current.stats).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="w-12 text-xs font-bold uppercase text-gray-500">{key}</span>
                      <div className="flex-1 h-2 bg-white/10 skew-x-[-20deg] overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${current.color}`}
                          style={{ width: `${val}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-white">{val}</span>
                    </div>
                  ))}
                </div>

                <Link href="/login">
                  <button className="mt-4 px-8 py-2 bg-white text-black font-bold uppercase text-xs hover:bg-cyan-400 transition-colors skew-x-[-20deg]">
                    <span className="inline-block skew-x-[20deg]">Try This Mode</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
RosterSection.displayName = 'RosterSection';

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Throttle with requestAnimationFrame for performance
      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(() => {
        setMousePos({
          x: (e.clientX / window.innerWidth) * 20,
          y: (e.clientY / window.innerHeight) * 20
        });
        rafRef.current = null;
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#050510] text-white overflow-x-hidden selection:bg-cyan-500/30">
      {/* Premium Floating Navbar - KEEPING AS REQUESTED */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
      >
        <nav className="flex items-center gap-1 px-2 py-2 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl shadow-black/50">
          <Link href="/" className="px-4 py-2 text-sm font-semibold text-white">
            Gakuen
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            <Link href="#features" className="px-3 py-1.5 text-sm text-neutral-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
              Features
            </Link>
            <Link href="#ai" className="px-3 py-1.5 text-sm text-neutral-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
              AI
            </Link>
          </div>
          <Link href="/login">
            <Button size="sm" className="bg-white text-black hover:bg-neutral-200 rounded-full px-4 h-8 text-sm font-medium">
              Sign In
            </Button>
          </Link>
        </nav>
      </motion.header>

      {/* HERO: HSR-Style with Space Background */}
      <section className="relative min-h-screen overflow-hidden">
        {/* --- Dynamic Space Background --- */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#050510] to-black" />
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
          <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/3 w-[800px] h-[800px] rounded-full bg-gradient-to-b from-cyan-500/10 to-purple-600/10 blur-[100px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>

        {/* --- Main Content --- */}
        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20 flex flex-col md:flex-row items-center min-h-screen">

          {/* Left: Text Content */}
          <div className="w-full md:w-1/2 space-y-8" style={{ transform: `translate(${mousePos.x * -1}px, ${mousePos.y * -1}px)` }}>

            {/* Decorative Label */}
            <div className="flex items-center gap-3">
              <div className="h-[1px] w-12 bg-amber-400/50" />
              <span className="text-amber-400 text-xs font-bold tracking-[0.2em] uppercase">Version 2.0 Live</span>
              <div className="h-[1px] w-12 bg-amber-400/50" />
            </div>

            {/* Headline */}
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter leading-[0.9] text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-500 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              MASTER <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">ANY</span> <br />
              SUBJECT
            </h1>

            {/* Description Glass Panel */}
            <div className="relative max-w-md p-6 bg-gradient-to-r from-black/60 to-black/20 backdrop-blur-md border-l-2 border-cyan-500">
              <p className="text-gray-300 leading-relaxed text-sm">
                Your personal AI tutor is here. Adaptive learning, instant explanations,
                and unlimited knowledge at your fingertips.
              </p>
              <div className="absolute top-0 right-0 p-1">
                <div className="w-2 h-2 border-t border-r border-white/30" />
              </div>
              <div className="absolute bottom-0 right-0 p-1">
                <div className="w-2 h-2 border-b border-r border-white/30" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
              <HsrButton variant="gold" icon={Sparkles} href="/login">
                Start Learning
              </HsrButton>
              <HsrButton variant="secondary" icon={Play} href="/browse">
                Browse Courses
              </HsrButton>
            </div>

            {/* Stat Readouts */}
            <div className="flex gap-8 pt-8 border-t border-white/10">
              {[
                { label: 'Active Learners', value: '10K+' },
                { label: 'Completion', value: '95%' },
                { label: 'Rating', value: '4.9★' }
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold font-mono text-white">{stat.value}</div>
                  <div className="text-[10px] uppercase tracking-widest text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Floating Card with Rings */}
          <div className="w-full md:w-1/2 relative mt-12 md:mt-0 h-[600px] flex items-center justify-center">

            {/* Rotating Rings - GPU accelerated */}
            <div className="absolute w-[500px] h-[500px] rounded-full border border-white/10 animate-[spin_10s_linear_infinite] will-change-transform" style={{ transform: 'translateZ(0)' }} />
            <div className="absolute w-[400px] h-[400px] rounded-full border border-cyan-500/20 animate-[spin_15s_linear_infinite_reverse] will-change-transform" style={{ transform: 'translateZ(0)' }} />
            <div className="absolute w-[600px] h-[600px] rounded-full border border-dashed border-white/5 animate-[spin_30s_linear_infinite] will-change-transform" style={{ transform: 'translateZ(0)' }} />

            {/* Main Card - GPU accelerated */}
            <div
              className="relative w-[320px] h-[480px] bg-gray-900/80 backdrop-blur-xl border border-white/10 transition-transform duration-500 group will-change-transform"
              style={{
                transform: `perspective(1000px) rotateY(${mousePos.x * 0.5}deg) rotateX(${mousePos.y * -0.5}deg) translateZ(0)`,
                boxShadow: '0 0 50px rgba(0, 200, 255, 0.1)',
                backfaceVisibility: 'hidden'
              }}
            >
              {/* Card Header */}
              <div className="h-1/2 bg-gradient-to-b from-indigo-900 to-black relative overflow-hidden p-6 flex flex-col justify-end">
                <div className="absolute top-4 right-4">
                  <Hexagon className="text-white/20" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-white italic">AI TUTOR</h3>
                <p className="text-cyan-400 text-xs font-mono">GEMINI 3.0 // PRO</p>
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-white/10">
                  <span className="text-xs text-gray-400 uppercase">Capabilities</span>
                  <Zap size={14} className="text-amber-400" />
                </div>

                <div className="space-y-2">
                  {['Explain', 'Quiz', 'Adapt'].map(stat => (
                    <div key={stat} className="flex items-center gap-2 text-sm">
                      <span className="w-12 text-gray-500 font-mono text-xs">{stat}</span>
                      <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400 w-[90%]" />
                      </div>
                    </div>
                  ))}
                </div>

                <Link href="/login">
                  <button className="w-full mt-4 bg-white text-black font-bold py-2 text-xs uppercase hover:bg-cyan-400 transition-colors">
                    Try Now
                  </button>
                </Link>
              </div>

              {/* Floating Badges */}
              <div className="absolute -right-12 top-20 bg-black/80 backdrop-blur border border-amber-500/50 p-2 transform rotate-12">
                <Star className="text-amber-400 fill-amber-400" size={20} />
              </div>
              <div className="absolute -left-8 bottom-20 bg-black/80 backdrop-blur border border-cyan-500/50 p-3 transform -rotate-6">
                <Globe className="text-cyan-400" size={20} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Floating UI Elements */}
        <TechDecoration className="top-1/4 left-10" />
        <TechDecoration className="bottom-1/4 right-10 rotate-180" />

        {/* Bottom Ticker */}
        <div className="absolute bottom-0 w-full h-12 border-t border-white/10 bg-black/80 backdrop-blur flex items-center overflow-hidden z-20">
          <div className="flex animate-marquee whitespace-nowrap gap-12 px-4">
            {[1, 2, 3, 4].map(i => (
              <span key={i} className="text-[10px] font-mono text-gray-500 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                AI TUTOR: ONLINE // 10,000+ LEARNERS // 95% COMPLETION RATE
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* STATS SECTION - HSR Terminal Style */}
      <section className="relative py-16 border-y border-white/10 overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_24px,rgba(255,255,255,0.03)_1px),linear-gradient(0deg,transparent_24px,rgba(255,255,255,0.03)_1px)] bg-[length:25px_25px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          {/* Header Tag - Typing Animation */}
          <div className="flex items-center gap-2 mb-8 justify-center">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <TypingText
              text="SYSTEM STATUS // ALL SYSTEMS NOMINAL"
              className="text-[10px] font-mono text-green-400 uppercase tracking-widest"
            />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "10,847", label: "ACTIVE USERS", icon: Users, color: "cyan", suffix: "" },
              { value: "2.4", label: "REVENUE", icon: Zap, color: "emerald", suffix: "M" },
              { value: "95.7", label: "COMPLETION", icon: Target, color: "amber", suffix: "%" },
              { value: "4.9", label: "AVG RATING", icon: Star, color: "purple", suffix: "/5" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative"
              >
                {/* Card */}
                <div className="relative bg-black/60 backdrop-blur-sm border border-white/10 p-6 hover:border-white/20 transition-all duration-300">
                  {/* Top Glow Line */}
                  <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-${stat.color}-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity`} />

                  {/* Icon */}
                  <div className="flex items-center gap-2 mb-4">
                    <stat.icon className={`text-${stat.color}-400`} size={16} />
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{stat.label}</span>
                  </div>

                  {/* Value */}
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl md:text-5xl font-black text-white tabular-nums`}>
                      {stat.value}
                    </span>
                    <span className={`text-xl font-bold text-${stat.color}-400`}>{stat.suffix}</span>
                  </div>

                  {/* Bottom Bar - Animated Fill */}
                  <div className="mt-4 h-1 bg-white/5 rounded overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${70 + i * 8}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, delay: 0.3 + i * 0.2, ease: "easeOut" }}
                      className={`h-full bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-400`}
                    />
                  </div>

                  {/* Corner Accent */}
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-white/10 group-hover:border-white/30 transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI FEATURES - HSR Style */}
      <section id="ai" className="relative py-32 border-t border-white/5 bg-black/40">
        {/* Background Grid Accent */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* Section Header */}
          <div className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-amber-400 rotate-45" />
                <span className="text-amber-400 font-mono text-xs tracking-widest uppercase">AI Architecture</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black italic text-white uppercase tracking-tighter">
                Core <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Modules</span>
              </h2>
            </div>
            <div className="max-w-md text-sm md:text-right font-mono border-r-2 border-green-400/50 pr-4">
              <TypingText
                text="Initialize learning protocols. Accessing AI... Select a module to begin."
                className="text-green-400"
              />
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Smart Tutor", sub: "24/7 AI-powered tutoring. Ask any question, get instant explanations tailored to your level.", icon: Brain, color: "from-cyan-400 to-blue-500" },
              { title: "Adaptive Engine", sub: "Courses that adapt in real-time. Struggle with a topic? Get more practice automatically.", icon: Target, color: "from-amber-400 to-orange-500" },
              { title: "Progress Matrix", sub: "Deep analytics on your learning patterns. See exactly where you stand and what to focus on.", icon: BarChart3, color: "from-emerald-400 to-green-500" },
            ].map((feature, i) => (
              <div key={i} className="relative group p-1">
                {/* Hover Border Glow */}
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500`} />

                {/* Card Container */}
                <div className="relative h-full bg-black/60 backdrop-blur-xl border border-white/10 p-8 clip-path-slant-left hover:bg-white/5 transition-all duration-300 group-hover:-translate-y-2">

                  {/* Top Decoration */}
                  <div className="absolute top-0 right-0 p-2 opacity-50">
                    <feature.icon className="text-white/20" size={64} />
                  </div>

                  <div className="relative z-10 space-y-4">
                    {/* Icon Badge */}
                    <div className="w-12 h-12 bg-white/10 flex items-center justify-center border border-white/20 rotate-45 group-hover:rotate-90 transition-transform duration-500">
                      <feature.icon className="text-white -rotate-45 group-hover:-rotate-90 transition-transform duration-500" size={24} />
                    </div>

                    <div className="pt-4">
                      <h3 className="text-xl font-black italic uppercase tracking-wider text-white mb-2">{feature.title}</h3>
                      <p className="text-sm text-gray-400 leading-relaxed font-mono">{feature.sub}</p>
                    </div>

                    <div className="pt-4 flex items-center text-xs font-bold text-cyan-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0">
                      Access Module <ArrowRight size={14} className="ml-1" />
                    </div>
                  </div>

                  {/* Corner Accents */}
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/10 group-hover:border-cyan-400/50 transition-colors" />
                </div>
              </div>
            ))}
          </div>

          {/* Secondary Info Bar */}
          <div className="mt-20 relative overflow-hidden group">
            {/* Skewed background */}
            <div className="absolute inset-0 bg-white/5 backdrop-blur-sm border border-white/10 skew-x-[-2deg]" />

            {/* Shine effect - sweeps left to right */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shine" />
            </div>

            {/* Content */}
            <div className="relative p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center animate-pulse">
                  <Sparkles className="text-cyan-400" size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-white uppercase">AI Tutor Online</h4>
                  <p className="text-xs text-gray-400 font-mono">Gemini 3.0 Flash ready for your questions...</p>
                </div>
              </div>
              <div className="flex gap-8">
                <div className="text-center">
                  <div className="text-2xl font-black text-white">95%</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest">Completion</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-white">24/7</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest">Available</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI LEARNING MODES - Roster Style */}
      <RosterSection />

      {/* REVIEWS - HSR Style */}
      <section className="relative py-32 overflow-hidden border-t border-white/5">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-indigo-950/20 to-black" />

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-16">
            <div className="w-16 h-1 bg-amber-400" />
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Trailblazer Reviews</h2>
            <div className="flex items-center gap-1 ml-auto">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
              <span className="text-amber-400 font-bold ml-2">4.9</span>
            </div>
          </div>

          {/* Review Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Sarah Chen",
                rank: "Lv. 70",
                role: "Software Engineer",
                avatar: "S",
                color: "from-cyan-500 to-blue-600",
                quote: "Finally, an AI tutor that actually understands how I learn. Like having a brilliant friend who's always free.",
                rating: 5,
              },
              {
                name: "Marcus Rivera",
                rank: "Lv. 45",
                role: "CS Student",
                avatar: "M",
                color: "from-amber-400 to-orange-500",
                quote: "Went from struggling in algorithms to acing my interviews. The adaptive learning is game-changing.",
                rating: 5,
              },
              {
                name: "Emily Zhang",
                rank: "Lv. 82",
                role: "Tech Lead @ Meta",
                avatar: "E",
                color: "from-purple-500 to-pink-500",
                quote: "I've tried every learning platform. This is the only one that feels like it was built for engineers.",
                rating: 5,
              },
            ].map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="group relative"
              >
                {/* Card */}
                <div className="relative bg-black/60 backdrop-blur-sm border border-white/10 p-6 hover:border-white/20 transition-all duration-300 clip-path-slant-left">

                  {/* Rating */}
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(review.rating)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="text-gray-300 text-sm leading-relaxed mb-6 italic">
                    "{review.quote}"
                  </blockquote>

                  {/* User Info */}
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${review.color} flex items-center justify-center text-white font-bold text-lg`}>
                      {review.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{review.name}</span>
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">{review.rank}</span>
                      </div>
                      <span className="text-xs text-gray-500">{review.role}</span>
                    </div>
                  </div>

                  {/* Corner Accent */}
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/10 group-hover:border-amber-400/50 transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom Stats Bar */}
          <div className="mt-16 flex flex-col md:flex-row items-center justify-center gap-8 text-center">
            <div className="flex items-center gap-3">
              <Users className="text-cyan-400" size={24} />
              <div>
                <div className="text-2xl font-black text-white">50,000+</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest">Active Users</div>
              </div>
            </div>
            <div className="w-px h-12 bg-white/10 hidden md:block" />
            <div className="flex items-center gap-3">
              <Star className="text-amber-400 fill-amber-400" size={24} />
              <div>
                <div className="text-2xl font-black text-white">4.9/5.0</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest">Average Rating</div>
              </div>
            </div>
            <div className="w-px h-12 bg-white/10 hidden md:block" />
            <div className="flex items-center gap-3">
              <Zap className="text-emerald-400" size={24} />
              <div>
                <div className="text-2xl font-black text-white">1M+ Hours</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest">Learning Time</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEWSLETTER - Warp Style */}
      <section className="relative py-32 overflow-hidden flex items-center justify-center">
        {/* Background with warp tunnel effect */}
        <div className="absolute inset-0 bg-black">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-black to-black" />
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 49px, rgba(255,255,255,0.1) 50px)'
            }}
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">

          {/* Ticket Visual */}
          <div className="relative mx-auto w-full max-w-2xl bg-gradient-to-r from-amber-200 to-amber-500 rounded-lg p-1 shadow-[0_0_50px_rgba(251,191,36,0.3)] transform hover:scale-105 transition-transform duration-500 mb-12 cursor-pointer group">
            <div className="bg-black/90 h-full w-full rounded border border-amber-300/50 p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">

              {/* Ticket Stub (Left) */}
              <div className="flex-1 text-left space-y-2 relative z-10">
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-widest">
                  <Star size={12} fill="currentColor" />
                  <span>Gakuen Newsletter</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black italic text-white uppercase">
                  Join the <br /> <span className="text-amber-400">Learning</span>
                </h2>
                <p className="text-gray-400 text-sm max-w-sm">
                  Get AI learning tips, new course drops, and platform updates delivered to your inbox.
                </p>
              </div>

              {/* QR Decoration (Right) */}
              <div className="hidden md:block w-32 h-32 border-l-2 border-dashed border-white/20 pl-8 relative">
                <div className="w-full h-full bg-white/5 rounded flex items-center justify-center">
                  <div className="text-5xl font-black text-white/10">QR</div>
                </div>
              </div>

              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
            </div>
          </div>

          {/* Input Field */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email..."
              className="flex-1 bg-white/5 border border-white/10 px-4 py-3 rounded text-sm text-white focus:outline-none focus:border-cyan-400 focus:bg-white/10 transition-all placeholder:text-gray-600"
            />
            <button className="bg-white text-black font-bold uppercase text-xs px-8 py-3 hover:bg-cyan-400 transition-colors clip-path-slant-right">
              Subscribe
            </button>
          </div>

          <p className="mt-6 text-[10px] text-gray-600 font-mono uppercase tracking-widest">
            Join 50,000+ Learners
          </p>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">Gakuen</span>
              <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded-full">AI</span>
            </div>
            <div className="flex items-center gap-8 text-neutral-500 text-sm">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-neutral-600 text-sm">
            <div>© 2025 Gakuen. AI-powered learning.</div>
            <div className="text-xs text-neutral-500">All educational content is AI-generated and not protected by copyright.</div>
          </div>
        </div>
      </footer>

      {/* Custom Styles for HSR Elements */}
      <style jsx global>{`
        .clip-path-slant-right { clip-path: polygon(15% 0, 100% 0, 100% 100%, 0% 100%); }
        .clip-path-slant-left { clip-path: polygon(0 0, 100% 0, 85% 100%, 0% 100%); }
        
        /* GPU-accelerated marquee */
        @keyframes marquee {
          0% { transform: translateX(0) translateZ(0); }
          100% { transform: translateX(-50%) translateZ(0); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
          will-change: transform;
        }
        
        .clip-path-hexagon { 
          clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%); 
        }
        
        /* GPU-accelerated shine */
        @keyframes shine {
          0% { transform: translateX(-100%) translateZ(0); }
          100% { transform: translateX(200%) translateZ(0); }
        }
        .animate-shine {
          animation: shine 3s ease-in-out infinite;
          will-change: transform;
        }
        
        /* Optimize backdrop-blur for large elements */
        .backdrop-blur-xl { 
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
}
