// app/terms/page.tsx
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { ScrollReveal } from '@/components/ScrollReveal';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24 flex-grow w-full">
      <ScrollReveal className="text-center mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Last Updated: July 16, 2026
        </p>
      </ScrollReveal>

      <ScrollReveal className="rounded-2xl border border-slate-900 bg-slate-900/40 p-6 sm:p-10 backdrop-blur-sm space-y-8 text-slate-300 leading-relaxed text-sm">
        
        {/* Highlighted Attorney-Client Disclaimer */}
        <div className="flex gap-4 rounded-xl border border-amber-950 bg-amber-950/10 p-5 text-amber-500">
          <ShieldAlert className="h-6 w-6 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-amber-400 uppercase tracking-wide text-xs">No Attorney-Client Relationship or Legal Advice</h3>
            <p className="text-xs">
              LegalDocs is a self-serve document assembly system and NOT a law firm. Using this website or generating documents through it does NOT create an attorney-client relationship. We do not review your answers for legal sufficiency, draw legal conclusions, or apply the law to your specific circumstances. Seek the advice of a registered attorney for your transaction.
            </p>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">1. Service Scope</h2>
          <p>
            LegalDocs provides automated compilation of pre-approved document templates (specifically, Mutual and Unilateral Non-Disclosure Agreements) based on information provided by the user in a questionnaire format. The service does not write customized legal clauses or alter contract provisions dynamically beyond inserting variables into placeholders.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">2. Payment and Refunds</h2>
          <p>
            Generation of a document requires a one-time payment of ₹199 (inclusive of transaction fees, in test mode for local demonstration). Since the compilation occurs instantly upon payment verification, all sales are final.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">3. Document Storage and Link Expiration</h2>
          <p>
            Once a document is compiled, the download link will remain active for exactly <strong>48 hours</strong> or up to 5 downloads, whichever occurs first. After 48 hours, the PDF file will be permanently purged from our servers, and the download link will expire (returning HTTP 410). It is the user's sole responsibility to save the PDF.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">4. Disclaimers of Warranties</h2>
          <p>
            THE SERVICE AND ALL DOCUMENT TEMPLATES ARE PROVIDED "AS IS" AND "AS AVAILABLE". LEGALDOCS MAKES NO WARRANTY, EXPRESS OR IMPLIED, REGARDING THE LEGAL ENFORCEABILITY, SUFFICIENCY, OR CORRECTNESS OF THE GENERATED DOCUMENTS UNDER INDIAN LAW OR ANY OTHER JURISDICTION.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">5. Governance</h2>
          <p>
            These terms are governed by the laws of India. Any disputes arising out of the use of this service shall be subject to the exclusive jurisdiction of the courts located in Mumbai, Maharashtra.
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
