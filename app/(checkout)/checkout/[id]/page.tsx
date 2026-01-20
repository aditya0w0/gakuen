"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Lock, CreditCard as CreditCardIcon, Tag, Loader2, CheckCircle, Clock, Users, Star, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/auth/AuthContext";
import { CardBrandIcon } from "@/components/payment/CardBrandIcon";
import {
    detectCardBrand,
    validateCardNumber,
    validateExpiry,
    validateCVV,
    formatCardNumber,
    formatExpiry,
} from "@/lib/payment/card-validator";

interface Course {
    id: string;
    title: string;
    description: string;
    instructor: string;
    thumbnail: string;
    duration: string;
    enrolledCount: number;
    rating: number;
    price: number;
    originalPrice?: number;
    lessonsCount: number;
}

type CheckoutStep = 'payment' | 'success' | 'review' | 'coupon';

export default function CourseCheckoutPage() {
    const params = useParams();
    const router = useRouter();
    const { refreshUser } = useAuth();
    const courseId = params.id as string;

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState<CheckoutStep>('payment');

    // Coupon
    const [couponCode, setCouponCode] = useState("");
    const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number } | null>(null);
    const [couponError, setCouponError] = useState("");
    const [couponLoading, setCouponLoading] = useState(false);

    // Payment
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvv, setCvv] = useState("");
    const [name, setName] = useState("");
    const [paymentError, setPaymentError] = useState("");
    const [processing, setProcessing] = useState(false);

    // CRITICAL: Ref-based lock to prevent double payment even if disabled state is bypassed
    const paymentInFlightRef = useRef(false);

    // Card validation - MUST be before any early returns
    const cardBrand = useMemo(() => detectCardBrand(cardNumber), [cardNumber]);
    const cardValidation = useMemo(() => validateCardNumber(cardNumber), [cardNumber]);
    const expiryValidation = useMemo(() => validateExpiry(expiry), [expiry]);
    const cvvValidation = useMemo(() => validateCVV(cvv, cardBrand), [cvv, cardBrand]);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await fetch(`/api/courses/${courseId}`);
                if (res.ok) {
                    const data = await res.json();
                    setCourse(data);
                }
            } catch (error) {
                console.error('Failed to fetch course:', error);
            } finally {
                setLoading(false);
            }
        };

        if (courseId) {
            fetchCourse();
        }
    }, [courseId]);

    // Handler functions
    const handleCardChange = (value: string) => {
        setCardNumber(formatCardNumber(value, cardBrand));
    };

    const handleExpiryChange = (value: string) => {
        setExpiry(formatExpiry(value));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold mb-4">Course not found</h1>
                <Link href="/browse"><Button>Browse Courses</Button></Link>
            </div>
        );
    }

    const basePrice = course.price;
    const discountAmount = couponApplied ? (basePrice * couponApplied.discount / 100) : 0;
    const finalPrice = basePrice - discountAmount;

    const applyCoupon = async () => {
        if (!couponCode.trim()) return;
        setCouponLoading(true);
        setCouponError("");

        try {
            const res = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponCode, type: 'course' }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Invalid coupon');
            setCouponApplied({ code: couponCode, discount: data.discountPercent });
        } catch (err: any) {
            setCouponError(err.message);
        } finally {
            setCouponLoading(false);
        }
    };

    const handlePayment = async () => {
        setPaymentError("");

        if (!cardValidation.isValid) {
            setPaymentError(cardValidation.error || "Please enter a valid card number");
            return;
        }
        if (!expiryValidation.isValid) {
            setPaymentError(expiryValidation.error || "Please enter a valid expiry date");
            return;
        }
        if (cvv.length < 3) {
            setPaymentError("Please enter a valid CVV");
            return;
        }

        // CRITICAL: Double-click prevention - check ref BEFORE processing state
        if (paymentInFlightRef.current) {
            console.warn('⚠️ Payment already in flight, ignoring duplicate click');
            return;
        }
        paymentInFlightRef.current = true;
        setProcessing(true);

        try {
            const res = await fetch('/api/payments/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId: course.id,
                    amount: finalPrice,
                    couponCode: couponApplied?.code,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Payment failed');

            // CRITICAL: Refresh user session so enrolled courses update
            await refreshUser();

            setStep('success');
        } catch (err: any) {
            setPaymentError(err.message);
        } finally {
            paymentInFlightRef.current = false;
            setProcessing(false);
        }
    };

    const steps = [
        { id: 'payment', label: 'Payment' },
        { id: 'success', label: 'Complete' },
    ];

    const currentStepIndex = steps.findIndex(s => s.id === step);

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
            {/* Header */}
            <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/browse" className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
                        <ArrowLeft size={20} />
                        <span>Back</span>
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
                                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
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
                                    className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
                                >
                                    {/* Course Image */}
                                    <div className="relative h-48">
                                        <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    </div>

                                    <div className="p-6">
                                        <h2 className="text-xl font-bold mb-2">{course.title}</h2>
                                        <p className="text-neutral-500 text-sm mb-4">by {course.instructor}</p>

                                        <div className="flex flex-wrap gap-4 mb-6 text-sm text-neutral-600 dark:text-neutral-400">
                                            <span className="flex items-center gap-1"><Clock size={16} /> {course.duration}</span>
                                            <span className="flex items-center gap-1"><Users size={16} /> {course.enrolledCount} enrolled</span>
                                            <span className="flex items-center gap-1 text-amber-500"><Star size={16} fill="currentColor" /> {course.rating}</span>
                                        </div>

                                        <div className="space-y-2 mb-6">
                                            <div className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Lifetime access</div>
                                            <div className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> {course.lessonsCount} lessons</div>
                                            <div className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> AI Assistant (Flash)</div>
                                        </div>

                                        <Button onClick={() => setStep('coupon')} className="w-full h-12">
                                            Continue
                                        </Button>
                                    </div>
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

                                    <div className="flex gap-3 mb-4">
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
                                        <Button variant="outline" onClick={applyCoupon} disabled={couponLoading || !!couponApplied}>
                                            {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                                        </Button>
                                    </div>

                                    {couponError && <p className="text-sm text-red-500 mb-4">{couponError}</p>}
                                    {couponApplied && (
                                        <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-700 rounded-xl flex items-center gap-2 mb-4">
                                            <CheckCircle size={18} />
                                            <span className="text-sm font-medium">{couponApplied.discount}% discount applied!</span>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <Button variant="outline" onClick={() => setStep('review')} className="flex-1">Back</Button>
                                        <Button onClick={() => setStep('payment')} className="flex-1">Continue</Button>
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
                                        <div className="p-3 mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl text-sm">{paymentError}</div>
                                    )}

                                    <div className="space-y-4 mb-6">
                                        <div>
                                            <Label>Cardholder Name</Label>
                                            <Input placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Card Number</Label>
                                            <div className="relative">
                                                <CreditCardIcon className="absolute left-3 top-3 text-neutral-400" size={18} />
                                                <Input
                                                    className={cn(
                                                        "pl-10 font-mono",
                                                        cardValidation.isValid && "border-green-500",
                                                        cardValidation.error && "border-red-500"
                                                    )}
                                                    placeholder="4242 4242 4242 4242"
                                                    value={cardNumber}
                                                    onChange={(e) => handleCardChange(e.target.value)}
                                                />
                                                <CardBrandIcon brand={cardBrand?.brand} className="absolute right-3 top-2.5 w-6 h-6" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Expiry</Label>
                                                <Input
                                                    className={cn(
                                                        "font-mono",
                                                        expiryValidation.isValid && "border-green-500",
                                                        expiryValidation.error && "border-red-500"
                                                    )}
                                                    placeholder="MM/YY"
                                                    value={expiry}
                                                    onChange={(e) => handleExpiryChange(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label>CVV</Label>
                                                <Input className="font-mono" type="password" placeholder="123" maxLength={4} value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button variant="outline" onClick={() => setStep('coupon')} className="flex-1" disabled={processing}>Back</Button>
                                        <Button onClick={handlePayment} className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600" disabled={processing}>
                                            {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                                            Pay ${finalPrice.toFixed(2)}
                                        </Button>
                                    </div>
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
                                    <h2 className="text-2xl font-bold mb-2">You're Enrolled!</h2>
                                    <p className="text-neutral-500 mb-8">Start learning {course.title} now</p>
                                    <Button onClick={() => router.push(`/class/${course.id}`)} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8">
                                        Start Learning
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right: Order Summary */}
                    <div>
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 sticky top-24">
                            <h3 className="font-semibold mb-4">Order Summary</h3>

                            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                                <div className="relative w-16 h-12 rounded-lg overflow-hidden">
                                    <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{course.title}</p>
                                    <p className="text-xs text-neutral-500">{course.instructor}</p>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">Price</span>
                                    <span>${course.price.toFixed(2)}</span>
                                </div>
                                {couponApplied && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount ({couponApplied.discount}%)</span>
                                        <span>-${discountAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex justify-between font-semibold text-lg">
                                    <span>Total</span>
                                    <span className="text-green-600">${finalPrice.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-2 text-xs text-neutral-400">
                                <Shield size={14} />
                                <span>30-day money-back guarantee</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
