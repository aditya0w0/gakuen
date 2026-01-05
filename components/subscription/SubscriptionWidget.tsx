"use client";

import { useAuth } from "@/components/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Crown, ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { SUBSCRIPTION_TIERS } from "@/lib/constants/subscription";
import { useTranslation } from "@/lib/i18n";

/**
 * A seamless, non-intrusive subscription widget for the dashboard
 * Appears as a subtle banner for free users
 */
export function SubscriptionWidget() {
    const { user } = useAuth();
    const [isDismissed, setIsDismissed] = useState(false);
    const { t } = useTranslation();

    // All hooks MUST be called before any returns
    const tier = user?.subscription?.tier || 'free';
    const shouldShow = user && !isDismissed && tier === 'free';

    // Early return AFTER all hooks
    if (!shouldShow) return null;

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600/10 via-blue-600/10 to-indigo-600/10 dark:from-indigo-500/20 dark:via-blue-500/20 dark:to-indigo-500/20 border border-indigo-200/50 dark:border-indigo-500/20 p-4 sm:p-5">
            {/* Dismiss button */}
            <button
                onClick={() => setIsDismissed(true)}
                className="absolute top-3 right-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
            >
                <X size={18} />
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Icon */}
                <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                        {t.subscription.unlockPremium}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                        {t.subscription.unlockDesc}
                    </p>
                </div>

                {/* CTA */}
                <Link href="/pricing" className="flex-shrink-0">
                    <Button
                        size="sm"
                        className="bg-gradient-to-r from-indigo-600 to-indigo-600 hover:from-indigo-700 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                    >
                        {t.subscription.viewPlans}
                        <ArrowRight className="ml-1.5 w-4 h-4" />
                    </Button>
                </Link>
            </div>

            {/* Subtle animated gradient overlay */}
            <div className="absolute inset-0 -z-10 opacity-30">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(139,92,246,0.3),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(59,130,246,0.3),transparent_50%)]" />
            </div>
        </div>
    );
}

/**
 * Compact subscription status badge for the sidebar or header
 */
export function SubscriptionBadge() {
    const { user } = useAuth();

    if (!user) return null;

    const tier = user.subscription?.tier || 'free';
    const tierConfig = SUBSCRIPTION_TIERS[tier];

    const Icon = tier === 'pro' ? Crown : tier === 'free' ? Zap : Sparkles;

    const tierColors = {
        free: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
        basic: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        mid: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
        pro: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    };

    return (
        <div className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
            tierColors[tier]
        )}>
            <Icon className="w-3.5 h-3.5" />
            <span className="capitalize">{tierConfig.name}</span>
        </div>
    );
}
