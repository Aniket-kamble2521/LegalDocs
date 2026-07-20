// app/onboarding/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  User, 
  Briefcase, 
  Rocket, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  FileText, 
  Check 
} from 'lucide-react';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
  'Uttarakhand', 'West Bengal', 'Delhi'
];

type UserType = 'FREELANCER' | 'STARTUP' | 'BUSINESS' | 'INDIVIDUAL';

const CATEGORIES = [
  { id: 'NDA', label: 'Non-Disclosure Agreements', desc: 'NDA Mutual and Unilateral confidentiality guards.' },
  { id: 'SERVICE_AGREEMENT', label: 'Service & Freelance Agreements', desc: 'Independent contractor work scope, IP rights, and milestones.' },
  { id: 'EMPLOYMENT', label: 'Employment Contracts', desc: 'Standard staff onboarding, salary, benefits, and NDAs.' },
  { id: 'IP_ASSIGNMENT', label: 'Intellectual Property Assignments', desc: 'Secure transfer of tech, patents, and copyright ownership.' }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('');

  // Form Fields
  const [userType, setUserType] = useState<UserType>('FREELANCER');
  const [companyName, setCompanyName] = useState<string>('');
  const [gst, setGst] = useState<string>('');
  const [pan, setPan] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [state, setState] = useState<string>('Maharashtra');
  const [representative, setRepresentative] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [website, setWebsite] = useState<string>('');
  const [selectedCats, setSelectedCats] = useState<string[]>(['NDA', 'SERVICE_AGREEMENT']);

  // Fetch session on load
  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) {
          router.push('/login');
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          if (data.onboarded) {
            router.push('/dashboard');
          } else {
            setUserEmail(data.email);
            setLoading(false);
          }
        }
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  const handleToggleCategory = (catId: string) => {
    setSelectedCats(prev => 
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  const handleNextStep = () => {
    if (step === 3) {
      // Validate company profile form fields
      if (!companyName.trim() || !address.trim() || !state || !representative.trim() || !phone.trim()) {
        alert('Please fill out all required company details.');
        return;
      }
    }
    setStep(prev => Math.min(prev + 1, 5));
  };

  const handlePrevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // 1. Submit Onboarding Data
      const onboardingRes = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_type: userType,
          categories: selectedCats,
        }),
      });

      if (!onboardingRes.ok) {
        throw new Error('Onboarding preferences submission failed.');
      }

      // 2. Submit Company Profile
      const profileRes = await fetch('/api/company-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          gst,
          pan,
          address,
          state,
          country: 'India',
          representative,
          phone,
          email_contact: userEmail,
          website,
        }),
      });

      if (!profileRes.ok) {
        throw new Error('Company profile submission failed.');
      }

      // Go to success slide
      setStep(5);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2500);
    } catch (err: any) {
      alert(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Loading workspace shell...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      
      {/* Background glow animations */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[10%] left-[20%] aspect-square w-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[20%] aspect-square w-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-2xl rounded-3xl border border-slate-900 bg-slate-900/10 backdrop-blur-md p-6 sm:p-8 shadow-2xl relative">
        
        {/* Step Indicator Header */}
        {step < 5 && (
          <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-8">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              STEP {step} OF 4
            </span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    step >= i ? 'bg-blue-500 w-6' : 'bg-slate-800 w-2'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: WELCOME */}
        {step === 1 && (
          <div className="space-y-6 text-left animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-3.5 py-1.5 text-xs font-semibold text-blue-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Welcome to LegalDocs OS</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Let's tailor your smart Legal Operating System.
            </h1>
            
            <p className="text-sm text-slate-400 leading-relaxed">
              We need a few details to configure your reusable corporate metadata profile, adjust AI compliance audits, and recommend templates specific to your operational workflows.
            </p>

            <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-4 space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">What to expect</span>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>Configures an auto-fill company profile for instant contract generation.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>Enables specialized template suggestions tailored to your legal needs.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>Unlocks business insights analytics to measure cost and time savings.</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-all transform hover:scale-105 active:scale-95"
              >
                Get Started
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: SELECT USER TYPE */}
        {step === 2 && (
          <div className="space-y-6 text-left animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Select your operational structure</h2>
              <p className="text-slate-400 text-xs mt-1">This configures default AI warnings and templates suited to your operational category.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { 
                  id: 'FREELANCER', 
                  label: 'Freelancer / Consultant', 
                  icon: Briefcase,
                  desc: 'Draft independent contractor agreements, service schedules, NDAs, and milestone terms.',
                  badge: 'Gigs & Services' 
                },
                { 
                  id: 'STARTUP', 
                  label: 'Early-stage Startup', 
                  icon: Rocket,
                  desc: 'Incorporate founder accords, IP assignments, advisor agreements, and mutual NDAs.',
                  badge: 'Growth Focused' 
                },
                { 
                  id: 'BUSINESS', 
                  label: 'Registered Business', 
                  icon: Building2,
                  desc: 'Establish vendor agreements, employment contracts, standard service leases, and bulk corporate files.',
                  badge: 'Corporate Ready' 
                },
                { 
                  id: 'INDIVIDUAL', 
                  label: 'Individual / Personal', 
                  icon: User,
                  desc: 'Access rental lease documents, personal loans templates, affidavits, and one-way NDAs.',
                  badge: 'Consumer Legal' 
                }
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = userType === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setUserType(item.id as UserType)}
                    className={`cursor-pointer rounded-2xl border p-5 flex flex-col justify-between transition-all transform hover:-translate-y-0.5 duration-300 ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/5' 
                        : 'border-slate-800 bg-slate-950/30 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className={`inline-flex p-2.5 rounded-xl border ${
                        isSelected ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'bg-slate-900/50 border-slate-800 text-slate-500'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-blue-400 block uppercase tracking-wider mb-1">{item.badge}</span>
                        <h3 className="font-bold text-white text-sm">{item.label}</h3>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={handlePrevStep}
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-all transform hover:scale-105 active:scale-95"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: COMPANY PROFILE SYSTEM */}
        {step === 3 && (
          <div className="space-y-6 text-left animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Create your company profile</h2>
              <p className="text-slate-400 text-xs mt-1">This reusable profile automatically populates party parameters in future agreements.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-2 border-b border-slate-900 pb-4">
              
              {/* Company Name */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Company / Individual Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Tech Private Limited"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white placeholder-slate-700 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              {/* Representative Name */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Authorized Signatory Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={representative}
                  onChange={(e) => setRepresentative(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white placeholder-slate-700 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              {/* Contact Phone */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Contact Phone Number *
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white placeholder-slate-700 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              {/* State */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Governing State *
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* GST Identification (Optional) */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  GSTIN (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 27AAAAA1111A1Z1"
                  value={gst}
                  onChange={(e) => setGst(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white placeholder-slate-700 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* PAN Number (Optional) */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  PAN (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ABCDE1234F"
                  value={pan}
                  onChange={(e) => setPan(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white placeholder-slate-700 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Corporate Website (Optional) */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Company Website (Optional)
                </label>
                <input
                  type="url"
                  placeholder="e.g. https://example.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white placeholder-slate-700 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Full Registered Address */}
              <div className="space-y-2 sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Registered Corporate / Personal Address *
                </label>
                <textarea
                  rows={2}
                  placeholder="Full office or residential address..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white placeholder-slate-700 focus:border-blue-500 focus:outline-none resize-none"
                  required
                />
              </div>

            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={handlePrevStep}
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-all transform hover:scale-105 active:scale-95"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: PREFERENCES & CATEGORIES */}
        {step === 4 && (
          <div className="space-y-6 text-left animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Select your template categories</h2>
              <p className="text-slate-400 text-xs mt-1">Determine what legal agreements you generate. This ranks recommendations on your dashboard.</p>
            </div>

            <div className="space-y-3">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCats.includes(cat.id);
                return (
                  <div
                    key={cat.id}
                    onClick={() => handleToggleCategory(cat.id)}
                    className={`cursor-pointer rounded-xl border p-4 flex items-center justify-between transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-500/5' 
                        : 'border-slate-850 bg-slate-950/20 hover:border-slate-800'
                    }`}
                  >
                    <div className="space-y-0.5 text-left pr-4">
                      <span className="font-semibold text-white text-xs block">{cat.label}</span>
                      <span className="text-[10px] text-slate-500 block leading-relaxed">{cat.desc}</span>
                    </div>
                    <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-800 bg-slate-950'
                    }`}>
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={handlePrevStep}
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-500/10 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Finalizing Profile...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: SUCCESS REDIRECT */}
        {step === 5 && (
          <div className="py-12 space-y-6 text-center animate-fade-in flex flex-col items-center">
            <div className="inline-flex rounded-full bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-400 animate-bounce">
              <Check className="h-10 w-10" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">Your Legal OS is Ready!</h2>
              <p className="text-xs text-slate-400 leading-normal max-w-sm mx-auto">
                Your company profile metadata has been compiled successfully. Redirecting you to your workspace console...
              </p>
            </div>

            <Loader2 className="h-5 w-5 text-blue-500 animate-spin mt-4" />
          </div>
        )}

      </div>
    </div>
  );
}
