import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";
import { Providers } from "../components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://resugpt.com'),
  title: {
    default: 'ResuGPT - AI-Powered Resume & Cover Letter Generator',
    template: '%s | ResuGPT'
  },
  description: 'Create professional, ATS-optimized resumes and tailored cover letters in minutes with AI assistance. Land more interviews with personalized job application documents.',
  keywords: ['resume builder', 'AI resume', 'cover letter generator', 'ATS resume', 'job application', 'resume maker', 'professional resume'],
  authors: [{ name: 'ResuGPT' }],
  applicationName: 'ResuGPT',
  alternates: { canonical: 'https://resugpt.com' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'ResuGPT - AI-Powered Resume & Cover Letter Generator',
    description: 'Create professional, ATS-optimized resumes and tailored cover letters in minutes. Land more interviews with AI-powered job application documents.',
    type: 'website',
    siteName: 'ResuGPT',
    url: 'https://resugpt.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ResuGPT - AI Resume & Cover Letter Generator',
    description: 'Create professional, ATS-optimized resumes and cover letters with AI. Land more interviews.',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-white dark:bg-black text-black dark:text-white transition-colors`}
      >
        <Script id="schema-website" type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "ResuGPT",
            "alternateName": ["ResuGPT AI", "ResuGPT Resume Builder"],
            "url": "https://resugpt.com",
            "description": "AI-powered resume and cover letter generator"
          })}
        </Script>
        <Providers>
          <Navbar />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
