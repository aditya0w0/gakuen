"use client";

import { CreditCard as CreditCardIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Card brand icon component - displays proper card network logos
 */
export function CardBrandIcon({ brand, className }: { brand: string | undefined; className?: string }) {
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
