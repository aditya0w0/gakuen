"use client";

import { authenticatedFetch } from "@/lib/api/authenticated-fetch";

import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, CheckCircle, Loader2, AlertCircle, CreditCard as CreditCardIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
    detectCardBrand,
    validateCardNumber,
    validateExpiry,
    validateCVV,
    formatCardNumber,
    formatExpiry,
    shouldDecline,
    TEST_CARDS,
    type CardBrandConfig,
} from "@/lib/payment/card-validator";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (paymentId: string) => void;
    course: {
        id: string;
        title: string;
        thumbnail: string;
        price: number;
        originalPrice?: number;
    };
}

type PaymentStep = 'form' | 'processing' | 'success' | 'declined';

// Card brand colors for visual feedback
const BRAND_COLORS: Record<string, string> = {
    visa: 'from-blue-600 to-blue-800',
    mastercard: 'from-red-500 to-orange-500',
    amex: 'from-blue-500 to-cyan-500',
    discover: 'from-orange-500 to-amber-500',
    diners: 'from-blue-700 to-indigo-700',
    maestro: 'from-blue-500 to-blue-700',
    unionpay: 'from-red-600 to-red-800',
};

// Card brand icons as simple SVG components
function CardBrandIcon({ brand, className }: { brand: string | undefined; className?: string }) {
    if (!brand || brand === 'unknown') {
        return <CreditCardIcon className={cn("text-neutral-400", className)} />;
    }

    const colors: Record<string, string> = {
        visa: '#1A1F71',
        mastercard: '#EB001B',
        amex: '#006FCF',
        discover: '#FF6600',
        diners: '#004A97',
        maestro: '#0066CC',
        unionpay: '#E21836',
    };

    return (
        <svg viewBox="0 0 24 24" className={className} fill={colors[brand] || '#666'}>
            {brand === 'visa' && (
                <path d="M9.5 4h5c.83 0 1.5.67 1.5 1.5v13c0 .83-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5v-13c0-.83.67-1.5 1.5-1.5z" />
            )}
            {brand === 'mastercard' && (
                <>
                    <circle cx="9" cy="12" r="5" fill="#EB001B" />
                    <circle cx="15" cy="12" r="5" fill="#F79E1B" />
                    <path d="M12 8.5c1.38 1.12 2 2.12 2 3.5s-.62 2.38-2 3.5c-1.38-1.12-2-2.12-2-3.5s.62-2.38 2-3.5z" fill="#FF5F00" />
                </>
            )}
            {brand === 'amex' && (
                <path d="M4 6h16v12H4V6zm2 2v8h12V8H6z" />
            )}
            {brand === 'discover' && (
                <circle cx="12" cy="12" r="8" />
            )}
            {brand === 'diners' && (
                <>
                    <circle cx="12" cy="12" r="9" fill="none" stroke={colors.diners} strokeWidth="2" />
                    <circle cx="12" cy="12" r="5" />
                </>
            )}
            {brand === 'maestro' && (
                <>
                    <circle cx="9" cy="12" r="5" fill="#0066CC" />
                    <circle cx="15" cy="12" r="5" fill="#CC0000" />
                    <path d="M12 8c1.1.9 1.8 2.4 1.8 4s-.7 3.1-1.8 4c-1.1-.9-1.8-2.4-1.8-4s.7-3.1 1.8-4z" fill="#7700AA" />
                </>
            )}
            {brand === 'unionpay' && (
                <path d="M4 6h16v12H4V6zm2 2v8h12V8H6zm2 2h3v4H8v-4z" />
            )}
        </svg>
    );
}

export function PaymentModal({ isOpen, onClose, onSuccess, course }: PaymentModalProps) {
    const [step, setStep] = useState<PaymentStep>('form');
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvv, setCvv] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // Detect card brand in real-time
    const cardBrand = useMemo(() => detectCardBrand(cardNumber), [cardNumber]);

    // Validate fields in real-time
    const cardValidation = useMemo(() => validateCardNumber(cardNumber), [cardNumber]);
    const expiryValidation = useMemo(() => validateExpiry(expiry), [expiry]);
    const cvvValidation = useMemo(() => validateCVV(cvv, cardBrand), [cvv, cardBrand]);
    const nameValid = name.trim().length >= 2;

    // Overall form validity
    const isFormValid = cardValidation.isValid && expiryValidation.isValid && cvvValidation.isValid && nameValid;

    // CRITICAL: Ref-based lock to prevent double payment
    const paymentInFlightRef = useRef(false);

    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCardNumber(e.target.value, cardBrand);
        setCardNumber(formatted);
    };

    const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setExpiry(formatExpiry(e.target.value));
    };

    const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const maxLen = cardBrand?.cvvLength ?? 4;
        setCvv(e.target.value.replace(/\D/g, '').slice(0, maxLen));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // CRITICAL: Double-click prevention
        if (paymentInFlightRef.current) {
            console.warn('⚠️ Payment already in flight, ignoring duplicate click');
            return;
        }

        // Mark all fields as touched
        setTouched({ cardNumber: true, expiry: true, cvv: true, name: true });

        if (!isFormValid) {
            setError("Please fix the errors above");
            return;
        }

        // Check if this is a decline test card
        if (shouldDecline(cardNumber)) {
            setStep('processing');
            await new Promise(resolve => setTimeout(resolve, 1500));
            setStep('declined');
            return;
        }

        // Start processing
        paymentInFlightRef.current = true;
        setStep('processing');

        try {
            const response = await authenticatedFetch('/api/payments/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId: course.id,
                    amount: course.price,
                    // Demo mode - don't send real card data
                    cardLast4: cardNumber.replace(/\D/g, '').slice(-4),
                    cardBrand: cardBrand?.brand || 'unknown',
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Payment failed');
            }

            // Show success
            setStep('success');

            // Wait a moment then callback
            setTimeout(() => {
                onSuccess(data.paymentId);
            }, 2000);
        } catch (err: any) {
            paymentInFlightRef.current = false;
            setError(err.message);
            setStep('form');
        }
    };

    const resetAndClose = () => {
        paymentInFlightRef.current = false;
        setStep('form');
        setCardNumber("");
        setExpiry("");
        setCvv("");
        setName("");
        setError("");
        setTouched({});
        onClose();
    };

    const getInputStyles = (field: string, validation: { isValid: boolean; isPotentiallyValid?: boolean }) => {
        if (!touched[field]) return '';
        if (validation.isValid) return 'border-green-500 focus:ring-green-500';
        if (validation.isPotentiallyValid === false) return 'border-red-500 focus:ring-red-500';
        return '';
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    onClick={resetAndClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="relative p-6 border-b border-neutral-100 dark:border-neutral-800">
                            <button
                                onClick={resetAndClose}
                                className="absolute right-4 top-4 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-neutral-100">
                                    <Image
                                        src={course.thumbnail}
                                        alt={course.title}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-500">Purchasing</p>
                                    <h3 className="font-semibold text-lg line-clamp-1">{course.title}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xl font-bold text-green-600">${course.price.toFixed(2)}</span>
                                        {course.originalPrice && (
                                            <span className="text-sm text-neutral-400 line-through">${course.originalPrice.toFixed(2)}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <AnimatePresence mode="wait">
                                {step === 'form' && (
                                    <motion.form
                                        key="form"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        onSubmit={handleSubmit}
                                        className="space-y-4"
                                    >
                                        {/* Demo Mode Notice */}
                                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm">
                                            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium mb-1">
                                                <AlertCircle size={16} />
                                                Demo Mode
                                            </div>
                                            <p className="text-amber-600 dark:text-amber-500 text-xs">
                                                Use test card: <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">4242 4242 4242 4242</code>
                                            </p>
                                        </div>

                                        {error && (
                                            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl flex items-center gap-2">
                                                <AlertCircle size={16} />
                                                {error}
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <Label>Cardholder Name</Label>
                                            <Input
                                                placeholder="John Doe"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                onBlur={() => setTouched(t => ({ ...t, name: true }))}
                                                className={cn(touched.name && !nameValid && 'border-red-500')}
                                                required
                                            />
                                            {touched.name && !nameValid && (
                                                <p className="text-xs text-red-500">Name is required</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Card Number</Label>
                                            <div className="relative">
                                                {/* Card brand icon */}
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center">
                                                    <CardBrandIcon brand={cardBrand?.brand} className="w-6 h-6" />
                                                </div>
                                                <Input
                                                    placeholder="4242 4242 4242 4242"
                                                    className={cn(
                                                        "pl-12 pr-10 font-mono",
                                                        getInputStyles('cardNumber', cardValidation)
                                                    )}
                                                    value={cardNumber}
                                                    onChange={handleCardNumberChange}
                                                    onBlur={() => setTouched(t => ({ ...t, cardNumber: true }))}
                                                    required
                                                />
                                                {touched.cardNumber && cardValidation.isValid && (
                                                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                                                )}
                                            </div>
                                            {touched.cardNumber && cardValidation.error && (
                                                <p className="text-xs text-red-500">{cardValidation.error}</p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Expiry</Label>
                                                <Input
                                                    placeholder="MM/YY"
                                                    className={cn(
                                                        "font-mono",
                                                        getInputStyles('expiry', expiryValidation)
                                                    )}
                                                    value={expiry}
                                                    onChange={handleExpiryChange}
                                                    onBlur={() => setTouched(t => ({ ...t, expiry: true }))}
                                                    required
                                                />
                                                {touched.expiry && expiryValidation.error && (
                                                    <p className="text-xs text-red-500">{expiryValidation.error}</p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label>CVV</Label>
                                                <Input
                                                    placeholder={cardBrand?.brand === 'amex' ? '1234' : '123'}
                                                    className={cn(
                                                        "font-mono",
                                                        getInputStyles('cvv', cvvValidation)
                                                    )}
                                                    type="password"
                                                    value={cvv}
                                                    onChange={handleCvvChange}
                                                    onBlur={() => setTouched(t => ({ ...t, cvv: true }))}
                                                    required
                                                />
                                                {touched.cvv && cvvValidation.error && (
                                                    <p className="text-xs text-red-500">{cvvValidation.error}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <Button
                                                type="submit"
                                                disabled={!isFormValid}
                                                className={cn(
                                                    "w-full h-12 text-base transition-all",
                                                    cardBrand ? `bg-gradient-to-r ${BRAND_COLORS[cardBrand.brand] || 'from-green-600 to-emerald-600'}` : 'bg-gradient-to-r from-green-600 to-emerald-600',
                                                    "hover:opacity-90 disabled:opacity-50"
                                                )}
                                            >
                                                <Lock size={16} className="mr-2" />
                                                Pay ${course.price.toFixed(2)}
                                            </Button>
                                        </div>

                                        <p className="text-xs text-center text-neutral-400 flex items-center justify-center gap-1">
                                            <Lock size={12} />
                                            Demo payment - no real charges
                                        </p>
                                    </motion.form>
                                )}

                                {step === 'processing' && (
                                    <motion.div
                                        key="processing"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="py-12 text-center"
                                    >
                                        <Loader2 className="w-16 h-16 mx-auto text-green-600 animate-spin mb-4" />
                                        <h3 className="text-xl font-semibold mb-2">Processing Payment</h3>
                                        <p className="text-neutral-500">Please wait while we process your payment...</p>
                                    </motion.div>
                                )}

                                {step === 'success' && (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="py-12 text-center"
                                    >
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.2, type: "spring" }}
                                            className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4"
                                        >
                                            <CheckCircle className="w-10 h-10 text-green-600" />
                                        </motion.div>
                                        <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
                                        <p className="text-neutral-500">Redirecting to your course...</p>
                                    </motion.div>
                                )}

                                {step === 'declined' && (
                                    <motion.div
                                        key="declined"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="py-12 text-center"
                                    >
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
                                            transition={{ delay: 0.2, type: "spring" }}
                                            className="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4"
                                        >
                                            <X className="w-10 h-10 text-red-600" />
                                        </motion.div>
                                        <h3 className="text-xl font-semibold mb-2 text-red-600">Payment Declined</h3>
                                        <p className="text-neutral-500 mb-4">Your card was declined. Please try a different card.</p>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setStep('form');
                                                setCardNumber('');
                                            }}
                                        >
                                            Try Again
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
