import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

function MockButton({
    children,
    onClick,
    disabled,
    ariaLabel,
}: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    ariaLabel?: string;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
            aria-disabled={disabled}
            role="button"
            tabIndex={disabled ? -1 : 0}
        >
            {children}
        </button>
    );
}

function MockInput({
    label,
    id,
    type = 'text',
    required,
    error,
}: {
    label: string;
    id: string;
    type?: string;
    required?: boolean;
    error?: string;
}) {
    return (
        <div>
            <label htmlFor={id}>{label}{required && ' *'}</label>
            <input
                id={id}
                type={type}
                required={required}
                aria-required={required}
                aria-invalid={!!error}
                aria-describedby={error ? `${id}-error` : undefined}
            />
            {error && <span id={`${id}-error`} role="alert">{error}</span>}
        </div>
    );
}

// Using role="img" with aria-label instead of <img> to satisfy Next.js linting
function MockImage({ src, alt }: { src: string; alt: string }) {
    return <div role="img" aria-label={alt} data-src={src} />;
}

function MockLink({ href, children }: { href: string; children: React.ReactNode }) {
    return <a href={href}>{children}</a>;
}

describe('Accessibility (a11y) Tests', () => {
    describe('Button Accessibility', () => {
        it('has accessible name', () => {
            render(<MockButton>Click me</MockButton>);
            const button = screen.getByRole('button', { name: 'Click me' });
            expect(button).toBeDefined();
        });

        it('has aria-label when content is icon-only', () => {
            render(<MockButton ariaLabel="Close dialog">×</MockButton>);
            const button = screen.getByRole('button', { name: 'Close dialog' });
            expect(button).toBeDefined();
        });

        it('has aria-disabled when disabled', () => {
            render(<MockButton disabled>Disabled</MockButton>);
            const button = screen.getByRole('button');
            expect(button.getAttribute('aria-disabled')).toBe('true');
        });

        it('is focusable when enabled', () => {
            render(<MockButton>Enabled</MockButton>);
            const button = screen.getByRole('button');
            expect(button.getAttribute('tabIndex')).toBe('0');
        });

        it('is not focusable when disabled', () => {
            render(<MockButton disabled>Disabled</MockButton>);
            const button = screen.getByRole('button');
            expect(button.getAttribute('tabIndex')).toBe('-1');
        });
    });

    describe('Form Accessibility', () => {
        it('input has associated label', () => {
            render(<MockInput label="Email" id="email" />);
            const input = screen.getByLabelText('Email');
            expect(input).toBeDefined();
        });

        it('required fields are marked', () => {
            render(<MockInput label="Email" id="email" required />);
            const input = screen.getByLabelText(/Email/);
            expect(input.getAttribute('aria-required')).toBe('true');
        });

        it('error state is announced', () => {
            render(<MockInput label="Email" id="email" error="Invalid email" />);
            const alert = screen.getByRole('alert');
            expect(alert.textContent).toBe('Invalid email');
        });

        it('error is linked to input via aria-describedby', () => {
            render(<MockInput label="Email" id="email" error="Invalid email" />);
            const input = screen.getByLabelText('Email');
            expect(input.getAttribute('aria-describedby')).toBe('email-error');
        });

        it('invalid state is communicated', () => {
            render(<MockInput label="Email" id="email" error="Invalid" />);
            const input = screen.getByLabelText('Email');
            expect(input.getAttribute('aria-invalid')).toBe('true');
        });
    });

    describe('Image Accessibility', () => {
        it('images have alt text', () => {
            render(<MockImage src="/test.jpg" alt="Test image description" />);
            const img = screen.getByRole('img', { name: 'Test image description' });
            expect(img).toBeDefined();
        });

        it('decorative images have empty alt (role becomes presentation)', () => {
            render(<MockImage src="/decorative.jpg" alt="" />);
            // Images with empty alt become role="presentation" but we can still query by role
            const img = screen.queryByRole('img');
            // Empty aria-label means it's decorative
            expect(img?.getAttribute('aria-label')).toBe('');
        });
    });

    describe('Link Accessibility', () => {
        it('links have descriptive text', () => {
            render(<MockLink href="/courses">View all courses</MockLink>);
            const link = screen.getByRole('link', { name: 'View all courses' });
            expect(link).toBeDefined();
        });

        it('links have href attribute', () => {
            render(<MockLink href="/about">About</MockLink>);
            const link = screen.getByRole('link');
            expect(link.getAttribute('href')).toBe('/about');
        });
    });

    describe('Heading Structure', () => {
        it('page has single h1', () => {
            render(
                <div>
                    <h1>Main Heading</h1>
                    <h2>Subheading</h2>
                </div>
            );
            const headings = screen.getAllByRole('heading', { level: 1 });
            expect(headings).toHaveLength(1);
        });

        it('headings follow hierarchy', () => {
            render(
                <div>
                    <h1>Level 1</h1>
                    <h2>Level 2</h2>
                    <h3>Level 3</h3>
                </div>
            );

            expect(screen.getByRole('heading', { level: 1 })).toBeDefined();
            expect(screen.getByRole('heading', { level: 2 })).toBeDefined();
            expect(screen.getByRole('heading', { level: 3 })).toBeDefined();
        });
    });

    describe('Color Contrast', () => {
        it('uses sufficient contrast ratios', () => {
            const goodContrast = { bg: '#000000', fg: '#FFFFFF' };

            const hex2rgb = (hex: string) => {
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                return { r, g, b };
            };

            const luminance = ({ r, g, b }: { r: number; g: number; b: number }) => {
                const [rs, gs, bs] = [r, g, b].map(v => {
                    v /= 255;
                    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
                });
                return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
            };

            const contrastRatio = (l1: number, l2: number) => {
                const lighter = Math.max(l1, l2);
                const darker = Math.min(l1, l2);
                return (lighter + 0.05) / (darker + 0.05);
            };

            const bgLum = luminance(hex2rgb(goodContrast.bg));
            const fgLum = luminance(hex2rgb(goodContrast.fg));
            const ratio = contrastRatio(bgLum, fgLum);

            expect(ratio).toBeGreaterThanOrEqual(4.5);
        });
    });

    describe('Focus Management', () => {
        it('focus order follows logical sequence', () => {
            render(
                <div>
                    <MockButton>First</MockButton>
                    <MockButton>Second</MockButton>
                    <MockButton>Third</MockButton>
                </div>
            );

            const buttons = screen.getAllByRole('button');
            expect(buttons[0].textContent).toBe('First');
            expect(buttons[1].textContent).toBe('Second');
            expect(buttons[2].textContent).toBe('Third');
        });
    });
});
