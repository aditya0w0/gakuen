"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, MessageSquare, AlertCircle, Send, Check, MapPin, Clock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "general",
        message: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1500));

        // In production, send to your backend/email service
        console.log("Form submitted:", formData);

        setIsSubmitting(false);
        setIsSubmitted(true);
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                        <Check className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Message Sent!</h1>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-8">
                        Thank you for reaching out. We&apos;ll get back to you within 1-2 business days.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-neutral-50/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200 dark:border-white/10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-16">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">Contact Us</h1>
                    <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                        Have a question, concern, or feedback? We&apos;re here to help.
                        Fill out the form below or reach us through other channels.
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-12">
                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-white/5 rounded-2xl border border-neutral-200 dark:border-white/10 p-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="name" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                            Your Name
                                        </label>
                                        <input
                                            id="name"
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="John Doe"
                                            required
                                            className="w-full px-4 py-3 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="email" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                            Email Address
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="john@example.com"
                                            required
                                            className="w-full px-4 py-3 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="subject" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        Subject
                                    </label>
                                    <select
                                        id="subject"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="w-full px-4 py-3 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    >
                                        <option value="general">General Inquiry</option>
                                        <option value="support">Technical Support</option>
                                        <option value="billing">Billing & Payments</option>
                                        <option value="copyright">Copyright / Content Issue</option>
                                        <option value="partnership">Partnership Opportunity</option>
                                        <option value="feedback">Feedback / Suggestion</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="message" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        Message
                                    </label>
                                    <textarea
                                        id="message"
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        placeholder="Please describe your question or concern in detail..."
                                        required
                                        rows={6}
                                        className="w-full px-4 py-3 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                                    />
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
                                        <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-medium"
                                >
                                    {isSubmitting ? (
                                        <>Sending...</>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            Send Message
                                        </>
                                    )}
                                </Button>
                            </form>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-6">
                        <div className="p-6 bg-white dark:bg-white/5 rounded-2xl border border-neutral-200 dark:border-white/10">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-neutral-900 dark:text-white mb-1">Email</h3>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        General: <a href="mailto:support@gakuen.edu" className="text-blue-600 dark:text-blue-400 hover:underline">support@gakuen.edu</a>
                                    </p>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        Legal: <a href="mailto:legal@gakuen.edu" className="text-blue-600 dark:text-blue-400 hover:underline">legal@gakuen.edu</a>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white dark:bg-white/5 rounded-2xl border border-neutral-200 dark:border-white/10">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                    <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-neutral-900 dark:text-white mb-1">Response Time</h3>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        We typically respond within 1-2 business days. For urgent issues, please indicate so in your message.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white dark:bg-white/5 rounded-2xl border border-neutral-200 dark:border-white/10">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                    <MessageSquare className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-neutral-900 dark:text-white mb-1">Content Issues</h3>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        If you believe our AI-generated content resembles your copyrighted work, select &quot;Copyright / Content Issue&quot; above.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-500/10 dark:to-cyan-500/10 rounded-2xl border border-blue-200 dark:border-blue-500/20">
                            <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2">Legal Links</h3>
                            <div className="space-y-2 text-sm">
                                <Link href="/terms" className="block text-blue-600 dark:text-blue-400 hover:underline">
                                    Terms of Service →
                                </Link>
                                <Link href="/privacy" className="block text-blue-600 dark:text-blue-400 hover:underline">
                                    Privacy Policy →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
