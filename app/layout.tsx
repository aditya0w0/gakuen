import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ModernBackground } from "@/components/animations/ModernBackground";
import { AuthProvider } from "@/components/auth/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GlobalErrorHandler } from "@/components/GlobalErrorHandler";

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
    { media: "(prefers-color-scheme: light)", color: "#0a0a0a" },
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
    <html lang="en" className="dark">
      <head>
        {/* Preconnect to external services */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.youtube-nocookie.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ErrorBoundary>
            <GlobalErrorHandler />
            <div className="relative min-h-screen">
              <ModernBackground />
              <main className="relative z-10">
                {children}
              </main>
            </div>
          </ErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  );
}
