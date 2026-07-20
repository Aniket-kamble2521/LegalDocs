// app/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Scale, 
  ShieldCheck, 
  Cpu, 
  Lock, 
  MapPin, 
  ArrowRight, 
  FileText, 
  Sparkles, 
  Check, 
  Zap, 
  Play, 
  CheckCircle2,
  X
} from 'lucide-react';
import { ScrollReveal } from '@/components/ScrollReveal';
import { AnimatedCounter } from '@/components/AnimatedCounter';


export default function Home() {
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [config, setConfig] = useState<any>({
    heroHeadline: "Professional Legal Documents. Generated in Minutes.",
    heroSubtitle: "Create customized, lawyer-reviewed legal contracts tailored for Indian jurisdiction. Our AI-assisted validator prevents naming errors, checks term chronology, and outputs clean print-ready PDFs instantly.",
    pricingSingle: "199",
    pricingBundle: "499",
    trustCounterClients: "12,000+",
    trustCounterVetted: "100% Lawyer Vetted",
    legalNotice: "Disclaimer: LegalDocs is a document automation platform. Vetted draft templates do not substitute custom professional legal counsel from an advocate."
  });

  React.useEffect(() => {
    fetch('/api/admin/content')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.config) {
          setConfig(data.config);
        }
      })
      .catch(err => console.error('Error loading config:', err));
  }, []);

  return (
    <div className="relative isolate overflow-hidden bg-slate-950 flex flex-col justify-start items-center min-h-screen w-full flex-grow">
      
      {/* Dynamic Background Glows */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Top-Right Blue Glow */}
        <div 
          className="absolute right-0 top-[-10%] aspect-square w-[600px] rounded-full bg-blue-500/10 blur-[120px]"
          style={{ transform: 'translate(20%, -20%)' }}
        />
        {/* Left Centered Purple Glow */}
        <div 
          className="absolute left-[-10%] top-[40%] aspect-square w-[500px] rounded-full bg-indigo-500/5 blur-[100px]"
        />
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Heading and CTAs */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-3 py-1 text-xs font-semibold text-blue-400">
              <Sparkles className="h-3 w-3" />
              <span>Smart Document Assembly Engine v2.0</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl leading-[1.1] bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent">
              {config.heroHeadline ? (
                config.heroHeadline.split(/(?<=\.)\s+/).map((part: string, index: number) => (
                  <span
                    key={index}
                    className={`block opacity-0 ${
                      index === 0 ? 'animate-headline-line1' : 'animate-headline-line2 mt-2 sm:mt-4'
                    }`}
                  >
                    {part}
                  </span>
                ))
              ) : (
                ''
              )}
            </h1>

            <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl opacity-0 animate-hero-subtitle">
              {config.heroSubtitle}
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/wizard"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-500/20 opacity-0 animate-hero-cta1 btn-premium-interactive"
              >
                Start Wizard
                <ArrowRight className="h-4 w-4" />
              </Link>
              
              <button
                type="button"
                onClick={() => setShowSampleModal(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:border-slate-700 opacity-0 animate-hero-cta2 btn-premium-interactive"
              >
                <FileText className="h-4 w-4" />
                View Sample PDF
              </button>
            </div>

            {/* Statistics Mini-Row */}
            <div className="flex items-center gap-8 pt-6 border-t border-slate-900 w-full max-w-xl opacity-0 animate-hero-subtitle">
              <div>
                <span className="text-2xl font-extrabold text-white block">
                  <AnimatedCounter value={config.trustCounterClients} />
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Active Clients</span>
              </div>
              <div className="w-px h-8 bg-slate-900" />
              <div>
                <span className="text-2xl font-extrabold text-white block">
                  <AnimatedCounter value={config.trustCounterVetted} />
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Attorney Vetted</span>
              </div>
            </div>
          </div>

          {/* Right Column: Floating Document Mockup */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end relative">
            
            {/* Subtle backdrop circle glow behind document */}
            <div className="absolute inset-0 m-auto w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -z-10" />

            {/* Document Frame Mockup with ScrollReveal */}
            <ScrollReveal animationClass="reveal-image-up" className="w-full max-w-[360px]">
              <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-2xl backdrop-blur-md animate-float relative overflow-hidden group hover:border-blue-500/30 transition-colors duration-500">
                
                {/* Header Details */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Preview — NDA_Mutual.pdf</span>
                </div>

                {/* Fake Document Content Body */}
                <div className="space-y-4 text-left">
                  {/* Title */}
                  <div className="h-4 bg-slate-800 rounded w-3/4 mx-auto mb-6" />
                  
                  {/* Paragraph Lines */}
                  <div className="space-y-2">
                    <div className="h-2 bg-slate-800/80 rounded w-full" />
                    <div className="h-2 bg-slate-800/80 rounded w-full" />
                    <div className="h-2 bg-slate-800/80 rounded w-5/6" />
                  </div>

                  <div className="h-px bg-slate-800 my-4" />

                  {/* Section title */}
                  <div className="h-3 bg-slate-800 rounded w-1/3 mb-2" />
                  <div className="space-y-2">
                    <div className="h-2 bg-slate-800/60 rounded w-full" />
                    <div className="h-2 bg-slate-800/60 rounded w-4/5" />
                  </div>

                  <div className="h-px bg-slate-800 my-4" />

                  {/* Signature boxes */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="border border-dashed border-slate-800 rounded p-3 text-center">
                      <div className="h-2 bg-slate-800/50 rounded w-2/3 mx-auto mb-4" />
                      <span className="text-[9px] font-bold text-blue-400 block tracking-wider uppercase">Signer A</span>
                    </div>
                    <div className="border border-dashed border-slate-800 rounded p-3 text-center">
                      <div className="h-2 bg-slate-800/50 rounded w-2/3 mx-auto mb-4" />
                      <span className="text-[9px] font-bold text-indigo-400 block tracking-wider uppercase">Signer B</span>
                    </div>
                  </div>
                </div>

                {/* Decorative side accent lines */}
                <div className="absolute top-0 right-0 w-[2px] h-full bg-gradient-to-b from-blue-500/20 to-transparent" />
              </div>
            </ScrollReveal>
          </div>

        </div>
      </div>      {/* Trust Strip */}
      <ScrollReveal className="w-full border-y border-slate-900 bg-slate-950/40 py-8 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 text-xs sm:text-sm font-semibold text-slate-400 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-blue-500" />
              <span>✓ Lawyer Reviewed</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              <span>✓ Secure Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-blue-500" />
              <span>✓ AI Assisted</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-blue-500" />
              <span>✓ 256-bit Encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              <span>✓ Indian Law Focused</span>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Features Grid */}
      <div id="features" className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center space-y-16">
        <ScrollReveal className="space-y-4">
          <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Engineered for Precision & Compliance
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Our platform guarantees legally accurate drafting, factual check loops, and frictionless sandbox payments.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <ScrollReveal delay={0} className="flex h-full">
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-8 text-left space-y-4 card-premium-interactive w-full">
              <div className="inline-flex bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-blue-400">
                <Scale className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Vetted Templates</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Fully customized configurations covering Mutual and Unilateral NDAs, Freelance Agreements, and service scope schedules validated by practicing legal attorneys.
              </p>
            </div>
          </ScrollReveal>

          {/* Card 2 */}
          <ScrollReveal delay={100} className="flex h-full">
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-8 text-left space-y-4 card-premium-interactive w-full">
              <div className="inline-flex bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-blue-400">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">AI Consistency Auditing</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Integrated checks evaluate naming alignments, contract sum accuracy, and timeline dates before rendering files, preventing double entries and mistakes.
              </p>
            </div>
          </ScrollReveal>

          {/* Card 3 */}
          <ScrollReveal delay={200} className="flex h-full">
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-8 text-left space-y-4 card-premium-interactive w-full">
              <div className="inline-flex bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-blue-400">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Instant A4 Rendering</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Compile drafts directly to standardized A4 PDFs using Headless Chrome. Access secure links for 48 hours and coordinate digital signature workflows.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center space-y-16 border-t border-slate-900">
        <ScrollReveal className="space-y-4">
          <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Simple, Transparent Pricing Plan
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Choose the package suited for your requirements. Pay securely with Razorpay test mode bypasses.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          
          {/* Plan 1: Single Document */}
          <ScrollReveal delay={0} className="flex h-full">
            <div className="rounded-3xl border border-slate-900 bg-slate-900/20 p-8 flex flex-col justify-between text-left card-premium-interactive w-full">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Single Agreement</span>
                  <span className="bg-slate-800/40 text-slate-300 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase">Standard</span>
                </div>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-extrabold text-white">₹{config.pricingSingle}</span>
                  <span className="text-xs text-slate-500">/ document generation</span>
                </div>
                
                <ul className="space-y-4 text-xs text-slate-300 mb-8">
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-blue-500" />
                    <span>1x compiled NDA or Freelance Service Agreement</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-blue-500" />
                    <span>Full LLM consistency validation verification</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-blue-500" />
                    <span>A4 Puppeteer rendering & 48h active link access</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-blue-500" />
                    <span>Indian Aadhaar-based OTP signature simulation</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/wizard"
                className="block w-full text-center rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-colors btn-premium-interactive"
              >
                Get Started
              </Link>
            </div>
          </ScrollReveal>

          {/* Plan 2: 3-Document Bundle */}
          <ScrollReveal delay={100} className="flex h-full">
            <div className="rounded-3xl border border-blue-500/20 bg-blue-950/5 p-8 flex flex-col justify-between text-left card-premium-interactive relative overflow-hidden w-full">
              {/* Best Value Badge */}
              <div className="absolute top-0 right-0 bg-blue-600 text-white font-bold text-[9px] px-4 py-1 uppercase tracking-widest rounded-bl-xl">
                Save 15%
              </div>

              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Document Bundle</span>
                  <span className="bg-blue-600/10 text-blue-400 border border-blue-500/20 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase">Most Popular</span>
                </div>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-extrabold text-white">₹{config.pricingBundle}</span>
                  <span className="text-xs text-slate-500">/ 3 document credits</span>
                </div>

                <ul className="space-y-4 text-xs text-slate-300 mb-8">
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-blue-400" />
                    <span className="font-semibold text-slate-200">3x Document Credits (never expire)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-blue-400" />
                    <span>Generate documents instantly from credits</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-blue-405" />
                    <span>Full access to repeat-user Dashboard Workspace</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-blue-405" />
                    <span>Priority rendering & e-Sign status monitors</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/wizard"
                className="block w-full text-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-colors btn-premium-interactive"
              >
                Acquire Bundle Plan
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Dynamic Sample Preview Modal */}
      {showSampleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative animate-fade-in">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-400" />
                <span className="font-bold text-sm text-white">Standard Mutual NDA Sample Preview</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSampleModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Preview */}
            <div className="flex-grow p-6 overflow-y-auto bg-white text-slate-900 font-serif leading-relaxed text-sm space-y-6 max-h-[60vh]">
              <div className="text-center font-bold text-lg uppercase tracking-wider underline mb-4">
                MUTUAL NON-DISCLOSURE AGREEMENT
              </div>
              
              <p>
                This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of the Effective Date by and between the parties defined below.
              </p>

              <div>
                <strong>1. PARTIES:</strong>
                <p className="pl-4 mt-1">
                  <strong>First Party (Party A):</strong> Disclosing Corp Inc., having its principal office at 101 Innovation Way, Tech Park, Bangalore, India.<br />
                  <strong>Second Party (Party B):</strong> Receiving Ltd., having its principal office at 202 Startup Circle, HSR Layout, Bangalore, India.
                </p>
              </div>

              <div>
                <strong>2. PURPOSE:</strong>
                <p className="pl-4 mt-1">
                  The parties wish to explore a potential business relationship or strategic discussion, during which they may disclose proprietary and confidential business information to one another.
                </p>
              </div>

              <div>
                <strong>3. MUTUAL CONFIDENTIALITY OBLIGATIONS:</strong>
                <p className="pl-4 mt-1">
                  Each party agrees to maintain the strict confidentiality of all proprietary details shared by the other party. Neither party shall disclose or utilize the confidential info for purposes outside the scope of this Agreement.
                </p>
              </div>

              <div>
                <strong>4. TERM & GOVERNING JURISDICTION:</strong>
                <p className="pl-4 mt-1">
                  The obligations of confidentiality shall survive for 12 months after the Effective Date. This agreement is governed by the laws of Karnataka, India.
                </p>
              </div>

              <div className="pt-8 grid grid-cols-2 gap-8 text-xs font-sans">
                <div className="border-t border-slate-300 pt-2">
                  <span className="block font-bold">First Party A:</span>
                  <span className="block italic mt-4">Authorized Signature</span>
                </div>
                <div className="border-t border-slate-300 pt-2">
                  <span className="block font-bold">Second Party B:</span>
                  <span className="block italic mt-4">Authorized Signature</span>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSampleModal(false)}
                className="rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-colors"
              >
                Close Preview
              </button>
              <Link
                href="/wizard"
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-blue-500 transition-colors"
              >
                Start Wizard
              </Link>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
