'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    // Check initial scroll state
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 w-full border-b transition-all duration-300 backdrop-blur-md ${
      scrolled 
        ? 'border-slate-900 bg-slate-950/95 shadow-md shadow-slate-950/20' 
        : 'border-transparent bg-slate-950/80'
    }`}>
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2 text-lg font-bold tracking-tight text-white hover:opacity-90 transition-opacity">
            <span className="flex items-center gap-2">
              <span className="bg-gradient-to-r from-blue-500 to-indigo-500 p-1.5 rounded-lg text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/10">LD</span>
              <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent font-extrabold uppercase tracking-wide">LegalDocs</span>
            </span>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors">
            Home
          </Link>
          <Link href="/wizard" className="text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors">
            Wizard
          </Link>
          <Link href="/dashboard" className="text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link href="/help" className="text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors">
            Help
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link 
            href="/wizard" 
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-blue-500 transition-all hover:scale-105 active:scale-95 btn-premium-interactive"
          >
            Create Document
          </Link>

          {/* Hamburger Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
            className="inline-flex md:hidden items-center justify-center text-slate-400 hover:text-white focus:outline-none p-2 rounded-lg border border-slate-900 bg-slate-900/30 backdrop-blur-md transition-all active:scale-95"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-900 bg-slate-950/95 backdrop-blur-lg transition-all duration-300">
          <div className="space-y-1 px-4 pt-2 pb-4 flex flex-col">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-slate-900/50 transition-all"
            >
              Home
            </Link>
            <Link
              href="/wizard"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-slate-900/50 transition-all"
            >
              Wizard
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-slate-900/50 transition-all"
            >
              Dashboard
            </Link>
            <Link
              href="/help"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-slate-900/50 transition-all"
            >
              Help
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
