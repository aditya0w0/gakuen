"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Lock, CreditCard, Tag, Loader2, CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { SUBSCRIPTION_TIERS, SubscriptionTier } from "@/lib/constants/subscription";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type CheckoutStep = 'review' | 'coupon' | 'payment' | 'success';

export default function SubscribeCheckoutPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const tierId = params.tier as SubscriptionTier;
    const billingCycle = (searchParams?.get('billing') || 'monthly') as 'monthly' | 'yearly';

    const tier = SUBSCRIPTION_TIERS[tierId];

    const [step, setStep] = useState<CheckoutStep>('review');
    const [couponCode, setCouponCode] = useState("");
    const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number } | null>(null);
    const [couponError, setCouponError] = useState("");
    const [couponLoading, setCouponLoading] = useState(false);

    // Payment form
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvv, setCvv] = useState("");
    const [name, setName] = useState("");
    const [paymentError, setPaymentError] = useState("");
    const [processing, setProcessing] = useState(false);

    if (!tier) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Invalid subscription tier</p>
            </div>
        );
    }

    const basePrice = billingCycle === 'yearly' ? tier.priceYearly : tier.priceMonthly;
    const discountAmount = couponApplied ? (basePrice * couponApplied.discount / 100) : 0;
    const finalPrice = basePrice - discountAmount;

    const formatCardNumber = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 16);
        const groups = digits.match(/.{1,4}/g) || [];
        return groups.join(' ');
    };

    const formatExpiry = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 4);
        if (digits.length >= 2) {
            return digits.slice(0, 2) + '/' + digits.slice(2);
        }
        return digits;
    };

    const applyCoupon = async () => {
        if (!couponCode.trim()) return;

        setCouponLoading(true);
        setCouponError("");

        try {
            const res = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponCode, type: 'subscription' }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Invalid coupon');
            }

            setCouponApplied({ code: couponCode, discount: data.discountPercent });
        } catch (err: unknown) {
            setCouponError(err instanceof Error ? err.message : 'Invalid coupon');
        } finally {
            setCouponLoading(false);
        }
    };

    const handlePayment = async () => {
        setPaymentError("");

        // Basic validation
        if (cardNumber.replace(/\s/g, '').length !== 16) {
            setPaymentError("Please enter a valid card number");
            return;
        }
        if (expiry.length !== 5) {
            setPaymentError("Please enter a valid expiry date");
            return;
        }
        if (cvv.length < 3) {
            setPaymentError("Please enter a valid CVV");
            return;
        }

        setProcessing(true);

        try {
            const res = await fetch('/api/subscriptions/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tier: tierId,
                    billingCycle,
                    couponCode: couponApplied?.code,
                    amount: finalPrice,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Payment failed');
            }

            setStep('success');
        } catch (err: unknown) {
            setPaymentError(err instanceof Error ? err.message : 'Payment failed');
        } finally {
            setProcessing(false);
        }
    };

    const steps = [
        { id: 'review', label: 'Review' },
        { id: 'coupon', label: 'Coupon' },
        { id: 'payment', label: 'Payment' },
        { id: 'success', label: 'Complete' },
    ];

    const currentStepIndex = steps.findIndex(s => s.id === step);

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
            {/* Header */}
            <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/pricing" className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
                        <ArrowLeft size={20} />
                        <span>Back to Pricing</span>
                    </Link>
                    <h1 className="text-lg font-semibold">Checkout</h1>
                    <div className="w-20" />
                </div>
            </header>

            {/* Progress Steps */}
            <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                        {steps.map((s, i) => (
                            <div key={s.id} className="flex items-center">
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                                    i < currentStepIndex && "bg-green-500 text-white",
                                    i === currentStepIndex && "bg-blue-600 text-white",
                                    i > currentStepIndex && "bg-neutral-200 dark:bg-neutral-800 text-neutral-500"
                                )}>
                                    {i < currentStepIndex ? <Check size={16} /> : i + 1}
                                </div>
                                <span className={cn(
                                    "ml-2 text-sm hidden sm:block",
                                    i === currentStepIndex ? "text-neutral-900 dark:text-white font-medium" : "text-neutral-500"
                                )}>
                                    {s.label}
                                </span>
                                {i < steps.length - 1 && (
                                    <div className={cn(
                                        "w-8 md:w-16 h-[2px] mx-2",
                                        i < currentStepIndex ? "bg-green-500" : "bg-neutral-200 dark:bg-neutral-800"
                                    )} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Step Content */}
                    <div className="lg:col-span-2">
                        <AnimatePresence mode="wait">
                            {/* Step 1: Review */}
                            {step === 'review' && (
                                <motion.div
                                    key="review"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6"
                                >
                                    <h2 className="text-xl font-semibold mb-6">Review Your Plan</h2>

                                    <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl mb-6">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                                            <Sparkles className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">{tier.name} Plan</h3>
                                            <p className="text-sm text-neutral-500">{tier.description}</p>
                                            <p className="text-sm text-neutral-500 mt-1">
                                                Billed {billingCycle}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <h4 className="font-medium text-sm text-neutral-500 uppercase tracking-wider">Features Included</h4>
                                        {tier.features.map((feature, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <Check className="w-5 h-5 text-green-500" />
                                                <span className="text-sm text-neutral-600 dark:text-neutral-400">{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        onClick={() => setStep('coupon')}
                                        className="w-full h-12 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                                    >
                                        Continue
                                    </Button>
                                </motion.div>
                            )}

                            {/* Step 2: Coupon */}
                            {step === 'coupon' && (
                                <motion.div
                                    key="coupon"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6"
                                >
                                    <h2 className="text-xl font-semibold mb-6">Have a Coupon?</h2>

                                    <div className="space-y-4 mb-6">
                                        <div className="flex gap-3">
                                            <div className="relative flex-1">
                                                <Tag className="absolute left-3 top-3 text-neutral-400" size={18} />
                                                <Input
                                                    placeholder="Enter coupon code"
                                                    className="pl-10 uppercase"
                                                    value={couponCode}
                                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                    disabled={!!couponApplied}
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={applyCoupon}
                                                disabled={couponLoading || !!couponApplied}
                                            >
                                                {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                                            </Button>
                                        </div>

                                        {couponError && (
                                            <p className="text-sm text-red-500">{couponError}</p>
                                        )}

                                        {couponApplied && (
                                            <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl flex items-center gap-2">
                                                <CheckCircle size={18} />
                                                <span className="text-sm font-medium">
                                                    {couponApplied.discount}% discount applied!
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => setStep('review')}
                                            className="flex-1"
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            onClick={() => setStep('payment')}
                                            className="flex-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                                        >
                                            Continue to Payment
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Payment */}
                            {step === 'payment' && (
                                <motion.div
                                    key="payment"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6"
                                >
                                    <h2 className="text-xl font-semibold mb-6">Payment Details</h2>

                                    {paymentError && (
                                        <div className="p-3 mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
                                            {paymentError}
                                        </div>
                                    )}

                                    <div className="space-y-4 mb-6">
                                        <div className="space-y-2">
                                            <Label>Cardholder Name</Label>
                                            <Input
                                                placeholder="John Doe"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Card Number</Label>
                                            <div className="relative">
                                                <CreditCard className="absolute left-3 top-3 text-neutral-400" size={18} />
                                                <Input
                                                    placeholder="4242 4242 4242 4242"
                                                    className="pl-10 font-mono"
                                                    value={cardNumber}
                                                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Expiry</Label>
                                                <Input
                                                    placeholder="MM/YY"
                                                    className="font-mono"
                                                    value={expiry}
                                                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>CVV</Label>
                                                <Input
                                                    placeholder="123"
                                                    className="font-mono"
                                                    type="password"
                                                    maxLength={4}
                                                    value={cvv}
                                                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => setStep('coupon')}
                                            className="flex-1"
                                            disabled={processing}
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            onClick={handlePayment}
                                            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                                            disabled={processing}
                                        >
                                            {processing ? (
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            ) : (
                                                <Lock className="w-4 h-4 mr-2" />
                                            )}
                                            Pay ${finalPrice.toFixed(2)}
                                        </Button>
                                    </div>

                                    <p className="text-xs text-center text-neutral-400 mt-4 flex items-center justify-center gap-1">
                                        <Lock size={12} />
                                        Secure payment simulation (no real charge)
                                    </p>
                                </motion.div>
                            )}

                            {/* Step 4: Success */}
                            {step === 'success' && (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 text-center"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2, type: "spring" }}
                                        className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6"
                                    >
                                        <CheckCircle className="w-10 h-10 text-green-600" />
                                    </motion.div>

                                    <h2 className="text-2xl font-bold mb-2">Welcome to {tier.name}!</h2>
                                    <p className="text-neutral-600 dark:text-neutral-400 mb-8">
                                        Your subscription is now active. Start learning today!
                                    </p>

                                    <Button
                                        onClick={() => router.push('/user')}
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8"
                                    >
                                        Start Learning
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right: Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 sticky top-24">
                            <h3 className="font-semibold mb-4">Order Summary</h3>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">{tier.name} ({billingCycle})</span>
                                    <span>${basePrice.toFixed(2)}</span>
                                </div>

                                {couponApplied && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount ({couponApplied.discount}%)</span>
                                        <span>-${discountAmount.toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3 flex justify-between font-semibold text-lg">
                                    <span>Total</span>
                                    <span className="text-green-600">${finalPrice.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                <p className="text-xs text-neutral-400">
                                    {billingCycle === 'yearly'
                                        ? `Billed annually. Renews at $${tier.priceYearly}/year.`
                                        : `Billed monthly. Renews at $${tier.priceMonthly}/month.`
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
