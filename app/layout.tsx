import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ModernBackground } from "@/components/animations/ModernBackground";
import { AuthProvider } from "@/components/auth/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GlobalErrorHandler } from "@/components/GlobalErrorHandler";
import { ThemeProvider } from "@/components/theme";
import { LanguageProvider } from "@/lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Prevent FOIT
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// SEO Metadata
export const metadata: Metadata = {
  title: {
    default: "Gakuen - Modern Learning Platform",
    template: "%s | Gakuen"
  },
  description: "Gakuen is a modern online learning platform offering interactive courses in programming, design, and more. Learn at your own pace with AI-powered tutoring.",
  keywords: ["learning", "online courses", "education", "programming", "design", "AI tutor", "e-learning"],
  authors: [{ name: "Gakuen Team" }],
  creator: "Gakuen",
  publisher: "Gakuen",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://gakuen.app",
    siteName: "Gakuen",
    title: "Gakuen - Modern Learning Platform",
    description: "Learn programming, design, and more with AI-powered tutoring",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Gakuen Learning Platform",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gakuen - Modern Learning Platform",
    description: "Learn programming, design, and more with AI-powered tutoring",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gakuen",
  },
};

// Viewport configuration (separate from metadata in Next.js 14+)
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfd" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const saved = localStorage.getItem('gakuen-theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const hour = new Date().getHours();
                const timeBasedDark = hour < 6 || hour >= 18;
                
                let isDark = false;
                if (saved === 'dark') isDark = true;
                else if (saved === 'light') isDark = false;
                else if (saved === 'system') isDark = prefersDark;
                else if (saved === 'auto') isDark = timeBasedDark;
                else isDark = prefersDark;
                
                document.documentElement.classList.add(isDark ? 'dark' : 'light');
                document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
              })();
            `,
          }}
        />
        {/* Preconnect to external services */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.youtube-nocookie.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-300`}
      >
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <ErrorBoundary>
                <GlobalErrorHandler />
                <div className="relative min-h-screen">
                  {/* Only show background in dark mode */}
                  <div className="hidden dark:block">
                    <ModernBackground />
                  </div>
                  <main className="relative z-10">
                    {children}
                  </main>
                </div>
              </ErrorBoundary>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
