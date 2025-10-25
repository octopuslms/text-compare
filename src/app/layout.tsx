import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TextCompare Pro - Free AI-Powered Text Comparison Tool | Semantic Analysis",
  description: "Compare text like never before with advanced semantic analysis and chunk-based diff. Ads-free, completely free, faster and smarter. Understand meaning, not just words. Perfect for writers, editors, and developers.",
  keywords: ["text comparison", "semantic analysis", "chunk-based diff", "AI text analysis", "free text compare", "document comparison", "semantic diff", "text diff", "enterprise grade", "ads free", "fast text comparison"],
  authors: [{ name: "OctopusLMS" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  metadataBase: new URL('https://text-compare.octopuslms.com'),
  openGraph: {
    title: "TextCompare Pro - Free AI-Powered Text Comparison",
    description: "Advanced semantic text comparison with chunk-based analysis. Ads-free, completely free, faster and smarter. Understand meaning, not just words.",
    url: "https://text-compare.octopuslms.com",
    siteName: "TextCompare Pro",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "TextCompare Pro - AI-Powered Text Comparison",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TextCompare Pro - Free AI Text Comparison",
    description: "Compare text with advanced semantic analysis. Ads-free, completely free, faster and smarter.",
    images: ["/og-image.jpg"],
  },
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
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
