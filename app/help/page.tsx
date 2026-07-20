// app/help/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  HelpCircle, 
  BookOpen, 
  Play, 
  MessageSquare, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  Search, 
  Loader2, 
  ArrowLeft,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

type TicketReply = {
  sender: string;
  message: string;
  timestamp: string;
};

type Ticket = {
  id: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  replies: TicketReply[];
  created_at: string;
  updated_at: string;
};

const FAQ_ITEMS = [
  {
    q: 'How does the digital signature workflow work?',
    a: 'Once your agreement is generated, you can trigger our e-sign integration from the draft workspace. We simulate the signature collection workflow, giving both signers dedicated URL portals to securely review and approve the legal covenants. Signed documents are automatically archived in your repository.'
  },
  {
    q: 'Can I reuse my company profile data?',
    a: 'Yes! The Company Profile stores registered corporate data (GST, PAN, address, representatives, phone) which automatically populates form wizard inputs, eliminating manual entry for future agreements.'
  },
  {
    q: 'How is the document validity period calculated?',
    a: 'By default, all generated PDF links remain active for 48 hours to ensure data security. You can download and save the files locally. Pinned or favorited documents remain searchable in your active dashboard.'
  },
  {
    q: 'What is the refund policy for bundle credits?',
    a: 'If you have purchased a credits bundle but have not generated any document draft, you can initiate a full refund within 7 days. Refunds can be requested by raising a support ticket from this console.'
  }
];

const GUIDES = [
  {
    title: 'NDAs: Mutual vs Unilateral Agreements',
    desc: 'Understand which non-disclosure format is required based on whether one or both parties disclose confidential information.',
    time: '4 min read',
    category: 'Guides'
  },
  {
    title: 'Drafting Professional Freelance Contracts',
    desc: 'A comprehensive checklist on securing intellectual property assignments, milestones billing, and governing jurisdictions.',
    time: '6 min read',
    category: 'Guides'
  },
  {
    title: 'Managing Vendor Negotiations in India',
    desc: 'Best practices for verifying supplier PAN details and state-level arbitration clauses under Indian contract regulations.',
    time: '8 min read',
    category: 'Corporate'
  }
];

const TUTORIALS = [
  {
    title: 'Getting Started with LegalDocs',
    desc: 'Learn how to set up your profile, acquire credits, and draft an NDA in under 3 minutes.',
    duration: '2:15',
    url: '#'
  },
  {
    title: 'Configuring Milestone Schedules',
    desc: 'How to distribute project milestones and verify that details match total contract billing.',
    duration: '1:45',
    url: '#'
  }
];

export default function HelpCenterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [userEmail, setUserEmail] = useState<string>('');

  // UI Tabs
  const [activeTab, setActiveTab] = useState<'kb' | 'tickets'>('kb');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Accordion FAQs state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Tickets states
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loadingTickets, setLoadingTickets] = useState<boolean>(false);
  
  // Create ticket form states
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [ticketSubject, setTicketSubject] = useState<string>('');
  const [ticketMessage, setTicketMessage] = useState<string>('');
  const [ticketPriority, setTicketPriority] = useState<string>('MEDIUM');
  const [creatingTicket, setCreatingTicket] = useState<boolean>(false);

  // Reply states
  const [replyMessage, setReplyMessage] = useState<string>('');
  const [sendingReply, setSendingReply] = useState<boolean>(false);

  // Auth gate check
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
        if (data && data.success) {
          if (!data.onboarded) {
            router.push('/onboarding');
          } else {
            setUserEmail(data.email);
            setLoading(false);
          }
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  // Load tickets when switching to tickets tab
  useEffect(() => {
    if (activeTab === 'tickets') {
      fetchTickets();
    }
  }, [activeTab]);

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await fetch('/api/tickets');
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets);
        // Refresh active ticket details if selected
        if (selectedTicket) {
          const fresh = data.tickets.find((t: Ticket) => t.id === selectedTicket.id);
          if (fresh) setSelectedTicket(fresh);
        }
      }
    } catch (e) {
      console.error('Failed to fetch support tickets:', e);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;
    setCreatingTicket(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: ticketSubject,
          message: ticketMessage,
          priority: ticketPriority,
        })
      });
      const data = await res.json();
      if (data.success) {
        setTicketSubject('');
        setTicketMessage('');
        setShowCreateForm(false);
        fetchTickets();
        alert('Support ticket created successfully!');
      }
    } catch (e) {
      alert('Failed to submit ticket.');
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;
    setSendingReply(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          ticketId: selectedTicket.id,
          message: replyMessage,
        })
      });
      const data = await res.json();
      if (data.success) {
        setReplyMessage('');
        fetchTickets(); // This will also update selectedTicket state via useEffect logic
      }
    } catch (e) {
      alert('Failed to post reply.');
    } finally {
      setSendingReply(false);
    }
  };

  const filteredFaqs = FAQ_ITEMS.filter(faq => 
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGuides = GUIDES.filter(guide => 
    guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Loading Help Desk Shell...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow flex flex-col lg:flex-row gap-8 items-start text-left">
      
      {/* Sidebar Controls */}
      <aside className="w-full lg:w-64 flex flex-col gap-4 lg:sticky lg:top-24">
        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-4 text-left space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Logged in as</span>
          <span className="text-xs font-semibold text-white block truncate">{userEmail}</span>
        </div>

        <nav className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1.5 border-b lg:border-b-0 pb-3 lg:pb-0 border-slate-900 w-full text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => { setActiveTab('kb'); setSelectedTicket(null); }}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 border transition-all ${
              activeTab === 'kb' 
                ? 'bg-blue-600/10 border-blue-500 text-blue-400' 
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/30'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Knowledge Base</span>
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 border transition-all ${
              activeTab === 'tickets' 
                ? 'bg-blue-600/10 border-blue-500 text-blue-400' 
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/30'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Support Tickets</span>
          </button>

          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 rounded-xl border border-transparent px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-900/30 transition-all whitespace-nowrap lg:mt-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Workspace</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow w-full space-y-8">
        
        {/* Help Center Welcome Header */}
        <div className="rounded-3xl border border-slate-900 bg-slate-900/10 p-6 md:p-8 backdrop-blur-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-xl">
            <h1 className="text-2xl font-bold text-white tracking-tight sm:text-3xl">
              {activeTab === 'kb' ? 'Help & Learning Center' : 'Your Support Tickets'}
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              {activeTab === 'kb' 
                ? 'Browse legal agreement drafting articles, read jurisdiction details, and explore quick video walkthroughs.'
                : 'Track diagnostic support cases, request credit refunds, or coordinate answers with our operations specialists.'
              }
            </p>
          </div>
          
          {activeTab === 'kb' ? (
            <button
              onClick={() => setActiveTab('tickets')}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-blue-500 transition-colors"
            >
              Raise Support Ticket
            </button>
          ) : (
            !selectedTicket && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-blue-500 transition-colors"
              >
                <Plus className="h-4 w-4" />
                New Ticket
              </button>
            )
          )}
        </div>

        {/* TAB 1: KNOWLEDGE BASE */}
        {activeTab === 'kb' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-600" />
              <input
                type="text"
                placeholder="Search resources, tutorials, and FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-880 bg-slate-900/40 pl-12 pr-4 py-3 text-sm text-white placeholder-slate-700 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Guides Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Helpful Guides</h3>
              {filteredGuides.length === 0 ? (
                <p className="text-xs text-slate-500">No guides matching search query.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {filteredGuides.map((guide, index) => (
                    <div 
                      key={index} 
                      className="rounded-2xl border border-slate-900 bg-slate-900/5 p-5 hover:border-slate-800 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10 inline-block">
                          {guide.category}
                        </span>
                        <h4 className="font-bold text-white text-sm leading-normal">{guide.title}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">{guide.desc}</p>
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-4 block">{guide.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Video Tutorials Grid */}
            <div className="space-y-4 border-t border-slate-900 pt-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Video Tutorials</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {TUTORIALS.map((video, idx) => (
                  <div 
                    key={idx} 
                    className="rounded-2xl border border-slate-900 bg-slate-900/5 p-5 flex items-start gap-4 hover:border-slate-800 transition-all"
                  >
                    <div className="bg-blue-600/15 border border-blue-500/20 p-3 rounded-xl text-blue-400">
                      <Play className="h-5 w-5 fill-current" />
                    </div>
                    <div className="space-y-1 text-left flex-grow">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-white text-sm">{video.title}</h4>
                        <span className="text-[9px] font-mono text-slate-500 bg-slate-900 border border-slate-850 px-1.5 py-0.5 rounded">{video.duration}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{video.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Accordion FAQs list */}
            <div className="space-y-4 border-t border-slate-900 pt-6 text-left">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Frequently Asked Questions</h3>
              {filteredFaqs.length === 0 ? (
                <p className="text-xs text-slate-500">No FAQs match your search query.</p>
              ) : (
                <div className="space-y-3">
                  {filteredFaqs.map((faq, index) => {
                    const isOpen = openFaqIndex === index;
                    return (
                      <div 
                        key={index} 
                        className="rounded-xl border border-slate-900 bg-slate-900/5 overflow-hidden transition-all"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                          className="w-full px-5 py-4 flex items-center justify-between text-left font-semibold text-white text-xs hover:bg-slate-900/20 transition-colors"
                        >
                          <span>{faq.q}</span>
                          {isOpen ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
                        </button>
                        <div 
                          className={`transition-all duration-350 ease-in-out overflow-hidden ${
                            isOpen ? 'max-h-40 opacity-100 pb-4 pt-3' : 'max-h-0 opacity-0 pb-0 pt-0'
                          }`}
                        >
                          <div className="px-5 text-xs text-slate-400 leading-relaxed border-t border-slate-950/40 pt-3">
                            {faq.a}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: SUPPORT TICKETS SYSTEM */}
        {activeTab === 'tickets' && (
          <div className="space-y-6 animate-fade-in">
            
            {showCreateForm ? (
              /* Create Support Ticket Form */
              <div className="rounded-2xl border border-slate-900 bg-slate-900/10 p-6 text-left space-y-6">
                <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                  <h3 className="font-bold text-white text-sm">Raise a New Support Ticket</h3>
                  <button onClick={() => setShowCreateForm(false)} className="text-xs text-slate-500 hover:text-white uppercase font-bold">Cancel</button>
                </div>

                <form onSubmit={handleCreateTicket} className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ticket Subject</label>
                    <input
                      type="text"
                      placeholder="Brief summary of your inquiry (e.g. credit billing issue)..."
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-700 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority Level</label>
                    <select
                      value={ticketPriority}
                      onChange={(e) => setTicketPriority(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-400 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="LOW">Low (General Inquiry)</option>
                      <option value="MEDIUM">Medium (Contract compilation issues)</option>
                      <option value="HIGH">High (Billing failures or account locked)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Message Description</label>
                    <textarea
                      rows={4}
                      placeholder="Detail your request or issue..."
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-700 focus:border-blue-500 focus:outline-none resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={creatingTicket}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-blue-550 transition-colors disabled:opacity-50"
                  >
                    {creatingTicket ? (
                      <>
                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
                        Submitting Case...
                      </>
                    ) : (
                      'Submit Ticket'
                    )}
                  </button>
                </form>
              </div>
            ) : selectedTicket ? (
              /* Ticket Details & Replies Chat Room */
              <div className="rounded-2xl border border-slate-900 bg-slate-900/10 overflow-hidden flex flex-col h-[500px]">
                
                {/* Header info */}
                <div className="bg-slate-950/40 px-6 py-4 border-b border-slate-900 flex justify-between items-center">
                  <div className="text-left space-y-1">
                    <button 
                      onClick={() => setSelectedTicket(null)}
                      className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider inline-flex items-center gap-1 mb-1"
                    >
                      <ArrowLeft className="h-3 w-3" /> Back to tickets list
                    </button>
                    <h3 className="font-bold text-white text-base">{selectedTicket.subject}</h3>
                    <p className="text-[9px] text-slate-500 font-mono">Case ID: {selectedTicket.id}</p>
                  </div>

                  <div className="flex gap-2">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      selectedTicket.status === 'OPEN' ? 'bg-amber-500/15 text-amber-450 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20'
                    }`}>
                      {selectedTicket.status}
                    </span>
                    <span className="inline-flex rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-[9px] font-semibold text-slate-400">
                      Priority: {selectedTicket.priority}
                    </span>
                  </div>
                </div>

                {/* Message logs */}
                <div className="flex-grow p-6 overflow-y-auto space-y-4 text-xs">
                  
                  {/* Original message */}
                  <div className="flex flex-col items-start gap-1 max-w-lg text-left">
                    <div className="text-[10px] font-bold text-slate-450">{selectedTicket.email} (Owner)</div>
                    <div className="rounded-2xl rounded-tl-none bg-slate-900 border border-slate-850 px-4 py-3 text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {selectedTicket.message}
                    </div>
                    <div className="text-[8px] text-slate-600 font-mono">{new Date(selectedTicket.created_at).toLocaleString()}</div>
                  </div>

                  {/* Replies list */}
                  {Array.isArray(selectedTicket.replies) && selectedTicket.replies.map((reply, i) => {
                    const isCurrentUser = reply.sender === userEmail;
                    return (
                      <div 
                        key={i} 
                        className={`flex flex-col gap-1 max-w-lg text-left ${isCurrentUser ? 'items-end ml-auto' : 'items-start'}`}
                      >
                        <div className="text-[10px] font-bold text-slate-450">
                          {isCurrentUser ? 'You' : `${reply.sender} (Staff)`}
                        </div>
                        <div className={`rounded-2xl px-4 py-3 leading-relaxed whitespace-pre-wrap ${
                          isCurrentUser 
                            ? 'rounded-tr-none bg-blue-600 text-white' 
                            : 'rounded-tl-none bg-slate-950 border border-slate-880 text-slate-300'
                        }`}>
                          {reply.message}
                        </div>
                        <div className="text-[8px] text-slate-600 font-mono">{new Date(reply.timestamp).toLocaleString()}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply composer footer */}
                <div className="bg-slate-950/40 p-4 border-t border-slate-900">
                  {selectedTicket.status === 'CLOSED' ? (
                    <div className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-wider py-2">
                      This support ticket has been closed. You cannot post further replies.
                    </div>
                  ) : (
                    <form onSubmit={handleSendReply} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type your response to the support agent..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        className="flex-grow rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                        required
                      />
                      <button
                        type="submit"
                        disabled={sendingReply}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow transition-all disabled:opacity-50"
                      >
                        {sendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </button>
                    </form>
                  )}
                </div>

              </div>
            ) : (
              /* Support Tickets List Desk */
              <div className="rounded-2xl border border-slate-900 bg-slate-900/10 overflow-hidden text-left">
                <div className="px-6 py-5 border-b border-slate-900 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-white text-base">Inquiry & Ticket Registry</h3>
                    <p className="text-xs text-slate-500 mt-1">Review active support cases raised by your workspace.</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-450 bg-slate-950 border border-slate-850 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {tickets.length} Tickets
                  </span>
                </div>

                {loadingTickets ? (
                  <div className="py-16 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-7 w-7 text-blue-500 animate-spin" />
                    <span className="text-[10px] text-slate-550 uppercase tracking-widest font-bold">Fetching support case archives...</span>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="py-16 text-center text-xs space-y-3">
                    <div className="inline-flex bg-slate-950 border border-slate-850 p-3.5 rounded-full text-slate-550">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <h4 className="font-bold text-white">No active support tickets found</h4>
                    <p className="text-slate-500 max-w-xs mx-auto leading-relaxed">
                      Need help? Raise a ticket and our technical operational specialists will get back to you shortly.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-900 bg-slate-900/5">
                    {tickets.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTicket(t)}
                        className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/20 transition-all cursor-pointer group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs group-hover:text-blue-400 transition-colors leading-normal">
                              {t.subject}
                            </span>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${
                              t.status === 'OPEN' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {t.status}
                            </span>
                          </div>
                          <div className="flex gap-2 text-[9px] text-slate-550 font-mono">
                            <span>Case ID: {t.id}</span>
                            <span>•</span>
                            <span>Updated: {new Date(t.updated_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-950 border border-slate-880 px-2 py-0.5 rounded">
                            Priority: {t.priority}
                          </span>
                          <ChevronRight className="h-4 w-4 text-slate-550 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
