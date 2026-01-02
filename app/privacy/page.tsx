"use client";

import Link from "next/link";
import { ArrowLeft, Shield, Eye, Database, Lock, Users, Globe, Trash2 } from "lucide-react";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-neutral-50/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200 dark:border-white/10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-16">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                        <Shield className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Privacy Policy</h1>
                        <p className="text-neutral-500 dark:text-neutral-400">Last updated: January 2025</p>
                    </div>
                </div>

                <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
                    <p className="text-lg text-neutral-600 dark:text-neutral-300">
                        At Gakuen, we take your privacy seriously. This policy explains what data we collect,
                        how we use it, and your rights regarding your personal information.
                    </p>

                    <section className="grid gap-6">
                        <div className="p-6 bg-white dark:bg-white/5 rounded-xl border border-neutral-200 dark:border-white/10">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                    <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-neutral-900 dark:text-white m-0 mb-2">Information We Collect</h3>
                                    <ul className="text-neutral-600 dark:text-neutral-300 text-sm list-disc pl-4 m-0 space-y-1">
                                        <li>Account information (name, email, password hash)</li>
                                        <li>Learning progress and course completions</li>
                                        <li>Usage analytics and interaction patterns</li>
                                        <li>Device information and IP address</li>
                                        <li>Payment information (processed by third-party providers)</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white dark:bg-white/5 rounded-xl border border-neutral-200 dark:border-white/10">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                    <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-neutral-900 dark:text-white m-0 mb-2">How We Use Your Data</h3>
                                    <ul className="text-neutral-600 dark:text-neutral-300 text-sm list-disc pl-4 m-0 space-y-1">
                                        <li>Provide and personalize your learning experience</li>
                                        <li>Process payments and manage subscriptions</li>
                                        <li>Send important service notifications</li>
                                        <li>Improve our AI models and service quality</li>
                                        <li>Prevent fraud and ensure platform security</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white dark:bg-white/5 rounded-xl border border-neutral-200 dark:border-white/10">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                    <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-neutral-900 dark:text-white m-0 mb-2">Data Security</h3>
                                    <p className="text-neutral-600 dark:text-neutral-300 text-sm m-0">
                                        We use industry-standard encryption (TLS 1.3) for data in transit and AES-256 for data at rest.
                                        Your password is hashed using bcrypt and never stored in plain text. We regularly audit our
                                        security practices and infrastructure.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white dark:bg-white/5 rounded-xl border border-neutral-200 dark:border-white/10">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                                    <Users className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-neutral-900 dark:text-white m-0 mb-2">Third-Party Services</h3>
                                    <p className="text-neutral-600 dark:text-neutral-300 text-sm m-0">
                                        We use trusted third-party services including: Google Cloud (hosting), Stripe (payments),
                                        Firebase (authentication), and Google AI (content generation). Each provider has their own
                                        privacy policy and data handling practices.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white dark:bg-white/5 rounded-xl border border-neutral-200 dark:border-white/10">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                    <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-neutral-900 dark:text-white m-0 mb-2">Your Rights</h3>
                                    <ul className="text-neutral-600 dark:text-neutral-300 text-sm list-disc pl-4 m-0 space-y-1">
                                        <li>Access and download your personal data</li>
                                        <li>Request correction of inaccurate data</li>
                                        <li>Request deletion of your account and data</li>
                                        <li>Opt out of marketing communications</li>
                                        <li>Lodge a complaint with supervisory authorities</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white dark:bg-white/5 rounded-xl border border-neutral-200 dark:border-white/10">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center flex-shrink-0">
                                    <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-neutral-900 dark:text-white m-0 mb-2">Data Retention</h3>
                                    <p className="text-neutral-600 dark:text-neutral-300 text-sm m-0">
                                        We retain your data for as long as your account is active or as needed to provide services.
                                        You can request account deletion at any time. After deletion, we may retain anonymized data
                                        for analytics purposes. Some data may be retained as required by law.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="p-6 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/20">
                        <h3 className="font-bold text-blue-800 dark:text-blue-300 m-0 mb-2">Contact Us</h3>
                        <p className="text-blue-700 dark:text-blue-400 text-sm m-0">
                            If you have questions about this Privacy Policy or want to exercise your rights,
                            please visit our <Link href="/contact" className="underline font-medium">Contact Page</Link> or
                            email us at <a href="mailto:privacy@gakuen.edu" className="underline font-medium">privacy@gakuen.edu</a>.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}
