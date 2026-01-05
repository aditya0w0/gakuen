"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { useRouter } from "next/navigation";
import { Check, Sparkles, Zap, Crown, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SUBSCRIPTION_TIERS, SubscriptionTier } from "@/lib/constants/subscription";
import { motion } from "framer-motion";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

export default function PricingPage() {
    const router = useRouter();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const { t } = useTranslation();

    const tiers = Object.values(SUBSCRIPTION_TIERS).filter(t => t.id !== 'free');

    const getTierIcon = (tierId: string) => {
        switch (tierId) {
            case 'basic': return Zap;
            case 'mid': return Sparkles;
            case 'pro': return Crown;
            default: return Zap;
        }
    };

    const getPrice = (tier: { priceYearly: number; priceMonthly: number }) => {
        return billingCycle === 'yearly' ? tier.priceYearly : tier.priceMonthly;
    };

    const getMonthlyEquivalent = (tier: { priceYearly: number; priceMonthly: number }) => {
        if (billingCycle === 'yearly') {
            return (tier.priceYearly / 12).toFixed(2);
        }
        return tier.priceMonthly.toFixed(2);
    };

    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-900">
            {/* Header */}
            <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Gakuen
                    </Link>
                    <Link href={user ? (user.role === "admin" ? "/dashboard" : "/user") : "/"}>
                        <Button variant="outline">
                            {user ? t.back : t.back}
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <section className="pt-16 pb-12 px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-3xl mx-auto"
                >
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-white mb-4">
                        {t.pricing.title}
                    </h1>
                    <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8">
                        {t.pricing.subtitle}
                    </p>

                    {/* Billing Toggle */}
                    <div className="inline-flex items-center gap-4 bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded-full">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={cn(
                                "px-6 py-2 rounded-full text-sm font-medium transition-all",
                                billingCycle === 'monthly'
                                    ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm"
                                    : "text-neutral-600 dark:text-neutral-400"
                            )}
                        >
                            {t.pricing.monthly}
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={cn(
                                "px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                                billingCycle === 'yearly'
                                    ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm"
                                    : "text-neutral-600 dark:text-neutral-400"
                            )}
                        >
                            {t.pricing.yearly}
                            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                                {t.pricing.savePercent}
                            </span>
                        </button>
                    </div>
                </motion.div>
            </section>

            {/* Pricing Cards */}
            <section className="px-6 pb-20">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                    {tiers.map((tier, index) => {
                        const Icon = getTierIcon(tier.id);
                        const isRecommended = tier.recommended;

                        return (
                            <motion.div
                                key={tier.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={cn(
                                    "relative rounded-3xl overflow-hidden",
                                    isRecommended
                                        ? "bg-gradient-to-b from-blue-600 to-indigo-600 p-[2px]"
                                        : "bg-neutral-200 dark:bg-neutral-800 p-[1px]"
                                )}
                            >
                                {/* Badge */}
                                {tier.badge && (
                                    <div className={cn(
                                        "absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full z-10",
                                        isRecommended
                                            ? "bg-white text-indigo-600"
                                            : "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                                    )}>
                                        {tier.badge}
                                    </div>
                                )}

                                <div className={cn(
                                    "h-full rounded-[22px] p-6 flex flex-col",
                                    isRecommended
                                        ? "bg-white dark:bg-neutral-900"
                                        : "bg-white dark:bg-neutral-900"
                                )}>
                                    {/* Header */}
                                    <div className="mb-6">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center mb-4",
                                            tier.id === 'basic' && "bg-blue-100 dark:bg-blue-900/30",
                                            tier.id === 'mid' && "bg-indigo-100 dark:bg-indigo-900/30",
                                            tier.id === 'pro' && "bg-amber-100 dark:bg-amber-900/30"
                                        )}>
                                            <Icon className={cn(
                                                "w-6 h-6",
                                                tier.id === 'basic' && "text-blue-600",
                                                tier.id === 'mid' && "text-indigo-600",
                                                tier.id === 'pro' && "text-amber-600"
                                            )} />
                                        </div>
                                        <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                                            {tier.name}
                                        </h3>
                                        <p className="text-sm text-neutral-500 mt-1">
                                            {tier.description}
                                        </p>
                                    </div>

                                    {/* Price */}
                                    <div className="mb-6">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-bold text-neutral-900 dark:text-white">
                                                ${getMonthlyEquivalent(tier)}
                                            </span>
                                            <span className="text-neutral-500">/mo</span>
                                        </div>
                                        {billingCycle === 'yearly' && (
                                            <p className="text-sm text-neutral-500 mt-1">
                                                Billed ${getPrice(tier)} yearly
                                            </p>
                                        )}
                                    </div>

                                    {/* Features */}
                                    <ul className="space-y-3 mb-8 flex-1">
                                        {tier.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm">
                                                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                <span className="text-neutral-600 dark:text-neutral-400">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA */}
                                    <Button
                                        onClick={() => router.push(`/checkout/subscribe/${tier.id}?billing=${billingCycle}`)}
                                        className={cn(
                                            "w-full h-12 text-base font-semibold",
                                            isRecommended
                                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                                                : "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100"
                                        )}
                                    >
                                        {t.pricing.getStarted}
                                        <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </section>

            {/* Free Tier Section */}
            <section className="px-6 pb-20">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-neutral-100 dark:bg-neutral-800/50 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                                {t.pricing.justStarting}
                            </h3>
                            <p className="text-neutral-600 dark:text-neutral-400">
                                {t.pricing.justStartingDesc}
                            </p>
                        </div>
                        <Link href="/browse">
                            <Button variant="outline" size="lg">
                                {t.pricing.browseFree}
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Comparison Table */}
            <section className="px-6 pb-20">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl font-bold text-center text-neutral-900 dark:text-white mb-8">
                        {t.pricing.comparePlans}
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                                    <th className="text-left py-4 px-4 font-medium text-neutral-500">{t.pricing.features}</th>
                                    <th className="text-center py-4 px-4 font-medium text-neutral-500">{t.pricing.free}</th>
                                    <th className="text-center py-4 px-4 font-medium text-neutral-500">{t.pricing.basic}</th>
                                    <th className="text-center py-4 px-4 font-medium text-indigo-600">{t.pricing.standard}</th>
                                    <th className="text-center py-4 px-4 font-medium text-neutral-500">{t.pricing.pro}</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                <tr className="border-b border-neutral-100 dark:border-neutral-800/50">
                                    <td className="py-4 px-4 text-neutral-600 dark:text-neutral-400">{t.pricing.courseAccess}</td>
                                    <td className="py-4 px-4 text-center">{t.pricing.previewOnly}</td>
                                    <td className="py-4 px-4 text-center">30%</td>
                                    <td className="py-4 px-4 text-center font-medium text-indigo-600">50%</td>
                                    <td className="py-4 px-4 text-center font-medium">100%</td>
                                </tr>
                                <tr className="border-b border-neutral-100 dark:border-neutral-800/50">
                                    <td className="py-4 px-4 text-neutral-600 dark:text-neutral-400">{t.pricing.aiModel}</td>
                                    <td className="py-4 px-4 text-center">Flash Lite</td>
                                    <td className="py-4 px-4 text-center">Flash</td>
                                    <td className="py-4 px-4 text-center font-medium text-indigo-600">Pro + Flash</td>
                                    <td className="py-4 px-4 text-center font-medium">Pro + Flash</td>
                                </tr>
                                <tr className="border-b border-neutral-100 dark:border-neutral-800/50">
                                    <td className="py-4 px-4 text-neutral-600 dark:text-neutral-400">{t.pricing.aiRequestsDay}</td>
                                    <td className="py-4 px-4 text-center">20</td>
                                    <td className="py-4 px-4 text-center">60</td>
                                    <td className="py-4 px-4 text-center font-medium text-indigo-600">30 Pro + ∞ Flash</td>
                                    <td className="py-4 px-4 text-center font-medium">120 Pro + ∞ Flash</td>
                                </tr>
                                <tr className="border-b border-neutral-100 dark:border-neutral-800/50">
                                    <td className="py-4 px-4 text-neutral-600 dark:text-neutral-400">{t.pricing.certificates}</td>
                                    <td className="py-4 px-4 text-center"><X className="w-5 h-5 mx-auto text-neutral-300" /></td>
                                    <td className="py-4 px-4 text-center"><Check className="w-5 h-5 mx-auto text-green-500" /></td>
                                    <td className="py-4 px-4 text-center"><Check className="w-5 h-5 mx-auto text-green-500" /></td>
                                    <td className="py-4 px-4 text-center"><Check className="w-5 h-5 mx-auto text-green-500" /></td>
                                </tr>
                                <tr className="border-b border-neutral-100 dark:border-neutral-800/50">
                                    <td className="py-4 px-4 text-neutral-600 dark:text-neutral-400">{t.pricing.prioritySupport}</td>
                                    <td className="py-4 px-4 text-center"><X className="w-5 h-5 mx-auto text-neutral-300" /></td>
                                    <td className="py-4 px-4 text-center"><X className="w-5 h-5 mx-auto text-neutral-300" /></td>
                                    <td className="py-4 px-4 text-center"><Check className="w-5 h-5 mx-auto text-green-500" /></td>
                                    <td className="py-4 px-4 text-center"><Check className="w-5 h-5 mx-auto text-green-500" /></td>
                                </tr>
                                <tr className="border-b border-neutral-100 dark:border-neutral-800/50">
                                    <td className="py-4 px-4 text-neutral-600 dark:text-neutral-400">{t.pricing.mentoring}</td>
                                    <td className="py-4 px-4 text-center"><X className="w-5 h-5 mx-auto text-neutral-300" /></td>
                                    <td className="py-4 px-4 text-center"><X className="w-5 h-5 mx-auto text-neutral-300" /></td>
                                    <td className="py-4 px-4 text-center"><X className="w-5 h-5 mx-auto text-neutral-300" /></td>
                                    <td className="py-4 px-4 text-center"><Check className="w-5 h-5 mx-auto text-green-500" /></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* FAQ or Footer */}
            <footer className="border-t border-neutral-200 dark:border-neutral-800 py-8 px-6">
                <div className="max-w-6xl mx-auto text-center text-sm text-neutral-500">
                    <p>{t.pricing.questionsContact}</p>
                </div>
            </footer>
        </div>
    );
}
