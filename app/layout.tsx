// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { ScrollReveal } from '@/components/ScrollReveal';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LegalDocs — Secure Pay-Per-Document NDA Generator',
  description: 'Instantly generate compliant Unilateral and Mutual NDAs. Answer a quick wizard, pay securely, and download your clean legal PDF in minutes.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className={`${inter.className} flex flex-col min-h-screen bg-slate-950 text-slate-100 antialiased`}>
        {/* Navigation Header */}
        <Header />

        {/* Main Content Area */}
        <main className="flex-grow flex flex-col">
          {children}
        </main>

        {/* Persistent Compliance Disclaimer & Footer */}
        <footer className="w-full border-t border-slate-900 bg-slate-950/60 py-12 px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="max-w-7xl mx-auto flex flex-col gap-10">
            
            {/* Regulatory Compliance Disclaimer Banner */}
            <div className="w-full max-w-4xl mx-auto rounded-2xl border border-amber-950 bg-amber-950/5 p-5 text-center text-xs text-amber-500/80 leading-relaxed shadow-lg">
              <span className="font-bold uppercase tracking-wider block mb-1 text-amber-400">⚠️ IMPORTANT LEGAL COMPLIANCE DISCLAIMER</span>
              LegalDocs is a self-serve document assembly tool, not a law firm. We do not provide legal advice, legal opinions, or recommendations about your legal rights or strategies. No attorney-client relationship is formed. All generated documents are pending formal lawyer review and are not suitable for active execution in production until reviewed.
            </div>

            {/* SaaS Footer Columns */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs border-t border-slate-900 pt-10">
              <div className="space-y-3">
                <span className="font-bold text-white uppercase tracking-wider block">Product</span>
                <ul className="space-y-2 text-slate-500">
                  <li><Link href="/wizard" className="hover:text-slate-300 transition-colors">NDA Generator</Link></li>
                  <li><Link href="/wizard" className="hover:text-slate-300 transition-colors">Service Agreement</Link></li>
                  <li><Link href="/dashboard" className="hover:text-slate-300 transition-colors">e-Signatures</Link></li>
                  <li><Link href="/wizard" className="hover:text-slate-300 transition-colors">Pricing</Link></li>
                </ul>
              </div>

              <div className="space-y-3">
                <span className="font-bold text-white uppercase tracking-wider block">Company</span>
                <ul className="space-y-2 text-slate-500">
                  <li><span className="hover:text-slate-300 cursor-pointer transition-colors">About Us</span></li>
                  <li><span className="hover:text-slate-300 cursor-pointer transition-colors">Security</span></li>
                  <li><span className="hover:text-slate-300 cursor-pointer transition-colors">Trust & Safety</span></li>
                  <li><span className="hover:text-slate-300 cursor-pointer transition-colors">Careers</span></li>
                </ul>
              </div>

              <div className="space-y-3">
                <span className="font-bold text-white uppercase tracking-wider block">Resources</span>
                <ul className="space-y-2 text-slate-500">
                  <li><span className="hover:text-slate-300 cursor-pointer transition-colors">API Documentation</span></li>
                  <li><span className="hover:text-slate-300 cursor-pointer transition-colors">Help Center</span></li>
                  <li><span className="hover:text-slate-300 cursor-pointer transition-colors">Guides</span></li>
                  <li><span className="hover:text-slate-300 cursor-pointer transition-colors">Status</span></li>
                </ul>
              </div>

              <div className="space-y-3">
                <span className="font-bold text-white uppercase tracking-wider block">Legal</span>
                <ul className="space-y-2 text-slate-500">
                  <li><Link href="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link></li>
                  <li><Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link></li>
                  <li><span className="hover:text-slate-300 cursor-pointer transition-colors">Cookie Settings</span></li>
                  <li><span className="hover:text-slate-300 cursor-pointer transition-colors">Compliance</span></li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between w-full text-slate-600 text-xs border-t border-slate-900 pt-8 gap-4">
              <div>
                © {new Date().getFullYear()} LegalDocs. All rights reserved.
              </div>
              <div className="flex gap-4 text-slate-500">
                <span className="hover:text-white cursor-pointer transition-colors">Twitter</span>
                <span>•</span>
                <span className="hover:text-white cursor-pointer transition-colors">LinkedIn</span>
                <span>•</span>
                <span className="hover:text-white cursor-pointer transition-colors">GitHub</span>
              </div>
            </div>

          </ScrollReveal>
        </footer>
      </body>
    </html>
  );
}
