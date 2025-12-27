"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Users, Award, TrendingUp, Sparkles, Check } from "lucide-react";
import { useAnime } from "@/components/animations/useAnime";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hero animation
  useAnime(".hero-content", {
    opacity: [0, 1],
    translateY: [30, 0],
    ease: "out-expo",
    duration: 1200,
    delay: 200,
  });

  // Features stagger
  useAnime(".feature-card", {
    opacity: [0, 1],
    translateY: [20, 0],
    ease: "out-quad",
    delay: (el, i) => 400 + i * 100,
    duration: 800,
  });

  // Stats animation
  useAnime(".stat-item", {
    opacity: [0, 1],
    scale: [0.8, 1],
    ease: "out-back",
    delay: (el, i) => 600 + i * 150,
    duration: 1000,
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-transparent to-transparent" />

        <div className="hero-content max-w-5xl mx-auto text-center z-10 opacity-0">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-neutral-200">Transforming Education Through Technology</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Learn Programming
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              The Smart Way
            </span>
          </h1>

          <p className="text-xl text-neutral-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Master in-demand skills with expert-crafted courses. Join thousands of learners building their dream careers in tech.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/login">
              <Button size="lg" className="bg-white text-black hover:bg-neutral-200 h-12 px-8 text-base font-medium group">
                Get Started Free
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base border-white/20 hover:bg-white/10">
                Explore Courses
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="stat-item opacity-0">
              <div className="text-3xl font-bold text-white">10K+</div>
              <div className="text-sm text-neutral-400">Active Learners</div>
            </div>
            <div className="stat-item opacity-0">
              <div className="text-3xl font-bold text-white">50+</div>
              <div className="text-sm text-neutral-400">Expert Courses</div>
            </div>
            <div className="stat-item opacity-0">
              <div className="text-3xl font-bold text-white">95%</div>
              <div className="text-sm text-neutral-400">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Why Choose Gakuen?
            </h2>
            <p className="text-neutral-400 text-lg">
              Everything you need to accelerate your learning journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="feature-card p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all opacity-0">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Expert-Crafted Content</h3>
              <p className="text-neutral-400">
                Learn from industry professionals with real-world experience and proven teaching methods.
              </p>
            </div>

            <div className="feature-card p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all opacity-0">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Track Your Progress</h3>
              <p className="text-neutral-400">
                Monitor your learning journey with detailed analytics and personalized insights.
              </p>
            </div>

            <div className="feature-card p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all opacity-0">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Community Support</h3>
              <p className="text-neutral-400">
                Connect with fellow learners, share knowledge, and grow together in our vibrant community.
              </p>
            </div>

            <div className="feature-card p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all opacity-0">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Earn Certificates</h3>
              <p className="text-neutral-400">
                Receive recognized certificates upon completion to showcase your new skills.
              </p>
            </div>

            <div className="feature-card p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all opacity-0">
              <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Adaptive Learning</h3>
              <p className="text-neutral-400">
                Personalized learning paths that adapt to your pace and style for maximum effectiveness.
              </p>
            </div>

            <div className="feature-card p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all opacity-0">
              <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Career Growth</h3>
              <p className="text-neutral-400">
                Build job-ready skills that employers are actively seeking in today's market.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 backdrop-blur-sm border border-white/10">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Ready to Start Learning?
            </h2>
            <p className="text-neutral-300 text-lg mb-8">
              Join thousands of students already learning on Gakuen
            </p>
            <Link href="/login">
              <Button size="lg" className="bg-white text-black hover:bg-neutral-200 h-12 px-8 text-base font-medium">
                Start Learning Today
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-neutral-500 text-sm">
          <p>© 2025 Gakuen. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
