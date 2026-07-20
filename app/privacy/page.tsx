// app/privacy/page.tsx
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { ScrollReveal } from '@/components/ScrollReveal';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24 flex-grow w-full">
      <ScrollReveal className="text-center mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Last Updated: July 16, 2026
        </p>
      </ScrollReveal>

      <ScrollReveal className="rounded-2xl border border-slate-900 bg-slate-900/40 p-6 sm:p-10 backdrop-blur-sm space-y-8 text-slate-300 leading-relaxed text-sm">
        
        {/* DPDP Compliance Highlight */}
        <div className="flex gap-4 rounded-xl border border-emerald-950 bg-emerald-950/10 p-5 text-emerald-500">
          <ShieldCheck className="h-6 w-6 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-emerald-400 uppercase tracking-wide text-xs">Digital Personal Data Protection (DPDP) Act, 2023 Compliant</h3>
            <p className="text-xs">
              We process personal data in accordance with the principles of consent, purpose limitation, and data minimization. Your personal data is collected only for document generation and is purged within 48 hours.
            </p>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">1. Data We Collect</h2>
          <p>
            We collect the following category of personal data during the document assembly process:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
            <li>Names of disclosing and receiving parties (entities or individuals)</li>
            <li>Physical registered addresses</li>
            <li>Operational purpose details and effective agreement dates</li>
            <li>Billing metadata during the Razorpay transaction</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">2. Purpose of Collection</h2>
          <p>
            The personal data collected is processed strictly to compile the Non-Disclosure Agreement templates and generate the associated PDF file. We do not use this data for profiling, marketing, or secondary business operations.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">3. Retention and Right to Deletion</h2>
          <p>
            To align with strict data minimization principles under the DPDP Act 2023, LegalDocs retains generated documents and questionnaire inputs for a maximum duration of <strong>48 hours</strong> from transaction checkout. Following this retention period, all associated records, including answers and PDF binaries, are permanently deleted from our active database and file storage.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">4. Third-Party Services</h2>
          <p>
            We share transaction amounts and order IDs with **Razorpay** to process payments. We also route questionnaire parameters (excluding names and addresses) to **Anthropic Claude API** solely for factual consistency audits (e.g. validating date formats or ranges). Anthropic is restricted from training models on this data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">5. Data Protection Officer (DPO)</h2>
          <p>
            For any queries or concerns regarding data collection, processing, or exercising your rights under the DPDP Act, contact our Data Protection Officer at privacy@legaldocs.test.
          </p>
        </section>

        <div className="border-t border-slate-900 pt-6 flex justify-between items-center text-xs text-slate-500">
          <span>Need help? Contact support@legaldocs.test</span>
          <Link href="/" className="text-blue-500 hover:underline">
            Back to Home
          </Link>
        </div>

      </ScrollReveal>
    </div>
  );
}
