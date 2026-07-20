// app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Mail, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const errorParam = params.get('error');
      if (errorParam) {
        setError(errorParam);
      }
    }
  }, []);


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
        if (data.loginUrl) {
          window.location.href = data.loginUrl;
        } else {
          setMessage(data.message || 'Login link sent to your inbox!');
        }
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

            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#15202b] text-slate-500 px-2 font-semibold">Or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                window.location.href = '/api/auth/google/login';
              }}
              className="w-full inline-flex justify-center items-center gap-2.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 shadow-md hover:text-white transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
