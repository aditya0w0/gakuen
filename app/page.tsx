"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Brain, Zap, Target, BarChart3, Users, Shield, Play, CheckCircle2, Star } from "lucide-react";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import { useRef } from "react";

// Premium counter animation hook
function useCounter(end: number, duration: number = 2) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const spring = useSpring(0, { duration: duration * 1000 });

  if (isInView) {
    spring.set(end);
  }

  return { ref, value: spring };
}

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Parallax effects
  const videoY = useTransform(scrollYProgress, [0, 0.3], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
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

      {/* HERO: Asymmetrical Video Layout */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-24 pb-20 px-6 lg:px-12 overflow-hidden">
        {/* Ambient Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[150px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-white/5 to-transparent rounded-full" />
        </div>

        <motion.div style={{ opacity: heroOpacity }} className="relative w-full max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: Content */}
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-white/10 mb-8"
              >
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  AI-Powered Learning Platform
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-8"
              >
                The future of
                <br />
                <span className="relative">
                  <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent">
                    education
                  </span>
                  <motion.span
                    className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                  />
                </span>
                <br />
                is here.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-lg sm:text-xl text-neutral-400 mb-10 max-w-lg leading-relaxed"
              >
                Experience personalized learning powered by cutting-edge AI.
                Adaptive courses, real-time feedback, and intelligent tutoring
                that evolves with you.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex flex-wrap gap-4"
              >
                <Link href="/login">
                  <Button size="lg" className="bg-white text-black hover:bg-neutral-200 h-14 px-8 text-base font-semibold rounded-full shadow-2xl shadow-white/10 group">
                    Start Free Trial
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-full border-white/20 hover:bg-white/5 group">
                  <Play className="mr-2 w-5 h-5 text-blue-400" />
                  Watch Demo
                </Button>
              </motion.div>

              {/* Social Proof */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="mt-12 flex items-center gap-6"
              >
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-[#0a0a0a] flex items-center justify-center text-xs font-bold">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-neutral-500">Loved by <span className="text-white font-semibold">10,000+</span> learners</p>
                </div>
              </motion.div>
            </div>

            {/* Right: Asymmetrical Video/Visual */}
            <motion.div
              initial={{ opacity: 0, x: 50, rotateY: -10 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              style={{ y: videoY }}
              className="relative lg:ml-auto"
            >
              <div className="relative">
                {/* Main Video Container */}
                <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-indigo-500/10 bg-gradient-to-br from-neutral-900 to-neutral-950">
                  <div className="aspect-[4/3] bg-gradient-to-br from-blue-900/50 via-indigo-900/50 to-pink-900/50 flex items-center justify-center">
                    {/* Fake Dashboard Preview */}
                    <div className="w-full h-full p-6 flex flex-col">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                      </div>
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <div className="col-span-2 bg-white/5 rounded-xl p-4 border border-white/5">
                          <div className="h-3 w-1/2 bg-white/20 rounded mb-3" />
                          <div className="h-2 w-3/4 bg-white/10 rounded mb-2" />
                          <div className="h-2 w-full bg-white/10 rounded mb-2" />
                          <div className="h-2 w-2/3 bg-white/10 rounded" />
                          <div className="mt-4 flex items-center gap-2">
                            <Brain className="w-5 h-5 text-blue-400" />
                            <span className="text-xs text-blue-400">AI analyzing...</span>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl p-3 border border-white/5">
                            <Sparkles className="w-4 h-4 text-indigo-400 mb-2" />
                            <div className="h-2 w-full bg-white/20 rounded" />
                          </div>
                          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                            <BarChart3 className="w-4 h-4 text-green-400 mb-2" />
                            <div className="h-2 w-3/4 bg-green-500/30 rounded" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Cards - Asymmetrical */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1 }}
                  className="absolute -bottom-6 -left-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 shadow-xl shadow-green-500/20"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                    <div>
                      <p className="text-white font-bold text-lg">95%</p>
                      <p className="text-white/80 text-xs">Completion Rate</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.2 }}
                  className="absolute -top-4 -right-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 shadow-xl shadow-blue-500/20"
                >
                  <div className="flex items-center gap-3">
                    <Brain className="w-8 h-8 text-white" />
                    <div>
                      <p className="text-white font-bold text-lg">AI Tutor</p>
                      <p className="text-white/80 text-xs">Always Available</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* INVESTOR STATS - Big Numbers */}
      <section className="py-24 px-6 border-y border-white/5 bg-gradient-to-b from-transparent via-blue-950/10 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "10K+", label: "Active Learners", color: "from-blue-400 to-cyan-400" },
              { value: "$2M+", label: "Revenue Generated", color: "from-green-400 to-emerald-400" },
              { value: "95%", label: "Course Completion", color: "from-indigo-400 to-pink-400" },
              { value: "4.9★", label: "User Rating", color: "from-yellow-400 to-orange-400" },
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
      </section>

      {/* AI FEATURES - The Selling Point */}
      <section id="ai" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6">
              <Brain className="w-4 h-4" />
              Powered by Advanced AI
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Intelligence that
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                understands you
              </span>
            </h2>
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
              Our AI doesn't just teach—it learns how you learn, adapting in real-time to maximize your potential.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: "Smart Tutoring", desc: "AI tutor available 24/7 that answers questions, explains concepts, and guides your learning journey.", gradient: "from-indigo-500 to-pink-500" },
              { icon: Target, title: "Adaptive Learning", desc: "Courses that automatically adjust difficulty and content based on your performance and learning style.", gradient: "from-blue-500 to-cyan-500" },
              { icon: Zap, title: "Instant Feedback", desc: "Real-time assessment and personalized recommendations to keep you on the fastest path to mastery.", gradient: "from-yellow-500 to-orange-500" },
              { icon: BarChart3, title: "Progress Analytics", desc: "Deep insights into your learning patterns, strengths, and areas for improvement with AI-powered analysis.", gradient: "from-green-500 to-emerald-500" },
              { icon: Users, title: "Peer Matching", desc: "AI connects you with study partners and mentors who complement your learning style and goals.", gradient: "from-pink-500 to-rose-500" },
              { icon: Shield, title: "Quality Assurance", desc: "Every course is AI-verified for accuracy, completeness, and pedagogical effectiveness.", gradient: "from-indigo-500 to-indigo-500" },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-8 hover:border-white/20 transition-all hover:shadow-2xl hover:shadow-indigo-500/5"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-neutral-400 leading-relaxed">{feature.desc}</p>

                {/* Hover Glow */}
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity rounded-3xl`} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIAL / TRUST */}
      <section className="py-32 px-6 bg-gradient-to-b from-transparent via-indigo-950/10 to-transparent">
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
              "Gakuen's AI tutor completely transformed how I learn. It's like having a
              <span className="bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent"> personal teacher</span> who knows
              exactly what I need, available whenever I need it."
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-pink-600 flex items-center justify-center text-xl font-bold">
                S
              </div>
              <div className="text-left">
                <p className="font-semibold">Sarah Chen</p>
                <p className="text-neutral-500 text-sm">Software Engineer @ Google</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto"
        >
          <div className="relative rounded-[3rem] overflow-hidden">
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-600 animate-gradient-x" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTJ2Mmgydi0yem0tNCAwaC0ydjJoMnYtMnptLTQgMGgtMnYyaDJ2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />

            <div className="relative px-8 py-20 md:px-16 md:py-24 text-center">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                Ready to transform
                <br />
                your learning?
              </h2>
              <p className="text-white/80 text-lg md:text-xl mb-10 max-w-xl mx-auto">
                Join 10,000+ learners who are already experiencing the future of education.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login">
                  <Button size="lg" className="bg-white text-black hover:bg-neutral-100 h-14 px-10 text-base font-semibold rounded-full shadow-2xl">
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="h-14 px-10 text-base rounded-full border-white/30 text-white hover:bg-white/10">
                  Talk to Sales
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">Gakuen</span>
              <span className="px-2 py-0.5 text-xs bg-indigo-500/20 text-indigo-400 rounded-full">AI</span>
            </div>
            <div className="flex items-center gap-8 text-neutral-500 text-sm">
              <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms</Link>
              <Link href="#" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/5 text-center text-neutral-600 text-sm">
            © 2025 Gakuen. Redefining education with AI.
          </div>
        </div>
      </footer>

      {/* Custom Styles */}
      <style jsx global>{`
                @keyframes gradient-x {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                .animate-gradient-x {
                    background-size: 200% 200%;
                    animation: gradient-x 15s ease infinite;
                }
            `}</style>
    </div>
  );
}
