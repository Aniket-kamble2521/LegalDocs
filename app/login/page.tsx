// app/login/page.tsx
'use client';

import { useState } from 'react';
import { Mail, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');


  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(data.message || 'Login link sent to your inbox!');
      } else {
        setError(data.error || 'Failed to dispatch magic login link.');
      }
    } catch (err: any) {
      setError('Connection error occurred while dispatching link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-900 bg-slate-900/30 p-8 backdrop-blur-md shadow-2xl relative">
        
        <div className="text-center space-y-2 mb-8">
          <Link href="/" className="text-xl font-bold text-white tracking-wider hover:text-blue-400 transition-colors uppercase">
            ⚡ LegalDocs
          </Link>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            Access your agreements, signature statuses, and document credits instantly.
          </p>
        </div>

        {message ? (
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex rounded-full bg-blue-500/10 border border-blue-500/20 p-3 text-blue-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-bold text-white">Check Your Inbox!</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              We have dispatched a magic login link to <strong className="text-white">{email}</strong>. Please check your inbox (and spam folder) and click the link to log in.
            </p>

            <div className="pt-4">
              <button
                onClick={() => setMessage('')}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline"
              >
                Re-enter email
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendLink} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Enter Your Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-600" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/80 pl-10 pr-3 py-2 text-sm text-white placeholder-slate-700 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex gap-2 items-center text-rose-400 text-xs p-3 rounded-lg border border-rose-950/50 bg-rose-950/10">
                <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex justify-center items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-500 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending login link...
                </>
              ) : (
                'Send Magic Login Link'
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
