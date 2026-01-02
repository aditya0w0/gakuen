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

      {/* HERO: Gaming-Style - Background Video + Left Text + Centered Buttons */}
      <section ref={heroRef} className="relative h-screen overflow-hidden">
        {/* Background Video/Art - Full Bleed */}
        <div className="absolute inset-0">
          {/* Video background - using gradient as placeholder, replace with actual video */}
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            poster="/hero-poster.jpg"
          >
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>

          {/* Fallback gradient if no video */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0118] via-[#1a0a2e] to-[#0d0515]" />

          {/* Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
        </div>

        {/* Left Text */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="absolute left-8 lg:left-16 top-1/2 -translate-y-1/2 z-10"
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1]">
            <span className="block text-white">Master Any</span>
            <span className="block text-white">Subject</span>
            <span className="block bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
              With AI
            </span>
          </h1>
          <p className="mt-6 text-lg text-white/60 max-w-md">
            V2.0 is Now Open
          </p>
        </motion.div>

        {/* Centered Bottom Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 flex items-center gap-6"
        >
          {/* Button 1 - Secondary */}
          <Link href="/browse">
            <button className="relative px-8 py-3 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-medium rounded hover:bg-white/20 transition-all">
              Browse Courses
            </button>
          </Link>

          {/* Divider */}
          <div className="w-8 h-px bg-white/30" />

          {/* Button 2 - Primary */}
          <Link href="/login">
            <button className="relative px-8 py-3 bg-gradient-to-r from-cyan-400 to-emerald-400 text-black font-bold rounded shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all">
              Start Learning
            </button>
          </Link>
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
