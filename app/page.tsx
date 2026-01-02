"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Brain, Zap, Target, BarChart3, Users, Shield, Play, CheckCircle2, Star, GraduationCap, Cpu, BookOpen, Clock } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#09090b] text-white overflow-x-hidden">
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

      {/* HERO: Gaming-Style Full Bleed */}
      <section ref={heroRef} className="relative h-screen flex items-end justify-center overflow-hidden">
        {/* Full-Bleed Background Art */}
        <div className="absolute inset-0">
          {/* Dramatic gradient background simulating game art */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0118] via-[#1a0a2e] to-[#0d0515]" />

          {/* Atmospheric particles/stars */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Glowing orbs */}
            <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[200px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-fuchsia-500/15 rounded-full blur-[180px] animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[150px]" />
          </div>

          {/* Floating petals/particles effect */}
          <div className="absolute inset-0">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-br from-cyan-400/60 to-fuchsia-400/60 rounded-full"
                initial={{
                  x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                  y: -20,
                  opacity: 0
                }}
                animate={{
                  y: typeof window !== 'undefined' ? window.innerHeight + 20 : 800,
                  opacity: [0, 1, 1, 0],
                  rotate: 360
                }}
                transition={{
                  duration: 8 + Math.random() * 4,
                  delay: i * 0.8,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{ left: `${Math.random() * 100}%` }}
              />
            ))}
          </div>

          {/* Vignette overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/50" />
        </div>

        {/* Hero Content - Bottom Positioned like Star Rail */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 w-full pb-24 px-6 lg:px-12"
        >
          <div className="max-w-7xl mx-auto">
            {/* Version Tag - Gaming style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <span className="inline-flex items-center gap-2 text-sm text-cyan-300/80 font-medium tracking-wider">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                V2.0 NOW LIVE
              </span>
            </motion.div>

            {/* Main Title - Dramatic Typography */}
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              <span className="block text-white drop-shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                Master Any Subject
              </span>
              <span className="block bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-amber-200 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(244,114,182,0.4)]">
                With AI
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg sm:text-xl text-neutral-300/80 max-w-2xl mb-12"
            >
              Your personal AI tutor is here. Adaptive learning, instant answers,
              unlimited potential.
            </motion.p>

            {/* CTA Buttons - Gaming Style Ornate */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap items-center gap-6"
            >
              {/* Primary CTA - Ornate style */}
              <Link href="/login">
                <button className="group relative px-10 py-4 bg-gradient-to-r from-cyan-500 via-cyan-400 to-emerald-400 text-black font-bold text-base rounded-sm overflow-hidden shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:shadow-[0_0_50px_rgba(34,211,238,0.6)] transition-all">
                  {/* Ornate corners */}
                  <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-black/30" />
                  <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-black/30" />
                  <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-black/30" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-black/30" />

                  <span className="flex items-center gap-3">
                    <Play className="w-5 h-5" />
                    Start Learning
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </Link>

              {/* Secondary CTA */}
              <button className="group relative px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/20 text-white font-medium text-base rounded-sm hover:bg-white/10 hover:border-white/30 transition-all">
                <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/40" />
                <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/40" />
                Browse Courses
              </button>
            </motion.div>

            {/* Bottom Stats Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
              className="mt-16 flex items-center gap-8 text-sm text-neutral-400"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">10K+</span>
                <span className="text-neutral-500">Learners</span>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">95%</span>
                <span className="text-neutral-500">Completion</span>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span className="text-2xl font-bold text-white">4.9</span>
                <span className="text-neutral-500">Rating</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border border-white/20 flex items-start justify-center p-2"
          >
            <div className="w-1 h-2 bg-white/60 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* STATS SECTION */}
      <section className="py-24 px-6 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "10K+", label: "Active Learners", color: "from-cyan-400 to-cyan-500" },
              { value: "$2M+", label: "Revenue Generated", color: "from-emerald-400 to-emerald-500" },
              { value: "95%", label: "Course Completion", color: "from-teal-400 to-cyan-400" },
              { value: "4.9★", label: "User Rating", color: "from-yellow-400 to-amber-400" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group"
              >
                <div className={`text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform`}>
                  {stat.value}
                </div>
                <p className="text-neutral-500 text-sm uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section >

      {/* AI FEATURES */}
      < section id="ai" className="py-32 px-6" >
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6">
              <Brain className="w-4 h-4" />
              AI-First Platform
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Your personal
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                AI tutor
              </span>
            </h2>
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
              Ask anything. Get instant, accurate answers tailored to your learning level.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: "Smart Tutoring", desc: "24/7 AI tutor that explains concepts, answers questions, and guides your learning.", gradient: "from-cyan-500 to-teal-500" },
              { icon: Target, title: "Adaptive Learning", desc: "Courses adjust to your pace. Struggle with a topic? Get more practice automatically.", gradient: "from-emerald-500 to-green-500" },
              { icon: Zap, title: "Instant Feedback", desc: "Know what's right, what's wrong, and why—in real time.", gradient: "from-amber-500 to-yellow-500" },
              { icon: BarChart3, title: "Progress Tracking", desc: "See exactly where you stand and what to focus on next.", gradient: "from-teal-500 to-cyan-500" },
              { icon: BookOpen, title: "Rich Content", desc: "Video, interactive exercises, and AI-generated summaries.", gradient: "from-sky-500 to-cyan-500" },
              { icon: Shield, title: "Quality Verified", desc: "Every course is reviewed for accuracy and pedagogical quality.", gradient: "from-slate-500 to-gray-500" },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group relative overflow-hidden rounded-3xl bg-white/[0.03] border border-white/10 p-8 hover:border-white/20 transition-all hover:bg-white/[0.05]"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-neutral-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section >

      {/* TESTIMONIAL */}
      < section className="py-32 px-6" >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex justify-center gap-1 mb-8">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className="w-8 h-8 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <blockquote className="text-2xl md:text-3xl lg:text-4xl font-medium leading-relaxed mb-8">
              "Finally, an AI tutor that actually
              <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent"> understands</span> how I learn.
              It's like having a brilliant friend who's always free to help."
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-xl font-bold">
                S
              </div>
              <div className="text-left">
                <p className="font-semibold">Sarah Chen</p>
                <p className="text-neutral-500 text-sm">Software Engineer @ Google</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section >

      {/* FINAL CTA */}
      < section className="py-32 px-6" >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto"
        >
          <div className="relative rounded-[3rem] overflow-hidden">
            {/* Gradient Background - Cyan to Emerald */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTJ2Mmgydi0yem0tNCAwaC0ydjJoMnYtMnptLTQgMGgtMnYyaDJ2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />

            <div className="relative px-8 py-20 md:px-16 md:py-24 text-center">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                Ready to learn
                <br />
                smarter?
              </h2>
              <p className="text-white/80 text-lg md:text-xl mb-10 max-w-xl mx-auto">
                Start for free. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login">
                  <Button size="lg" className="bg-white text-black hover:bg-neutral-100 h-14 px-10 text-base font-semibold rounded-full shadow-2xl">
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="h-14 px-10 text-base rounded-full border-white/30 text-white hover:bg-white/10">
                  Contact Sales
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </section >

      {/* FOOTER */}
      < footer className="border-t border-white/10 py-16 px-6" >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">Gakuen</span>
              <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded-full">AI</span>
            </div>
            <div className="flex items-center gap-8 text-neutral-500 text-sm">
              <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms</Link>
              <Link href="#" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/5 text-center text-neutral-600 text-sm">
            © 2025 Gakuen. AI-powered learning.
          </div>
        </div>
      </footer >
    </div >
  );
}
