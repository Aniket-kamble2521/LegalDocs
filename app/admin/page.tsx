'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  IndianRupee, 
  TrendingUp, 
  Clock, 
  Download, 
  ShieldCheck, 
  XCircle, 
  AlertCircle,
  Coins,
  Key,
  Users,
  FileCheck,
  Search,
  Settings,
  HelpCircle,
  MessageSquare,
  DollarSign,
  Layers,
  Edit,
  Trash,
  Lock,
  Loader2,
  Plus,
  RefreshCw,
  Send
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  
  // Auth & Navigation States
  const [isAdminAuth, setIsAdminAuth] = useState<boolean>(false);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Backend Data States
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [templateStats, setTemplateStats] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [paymentAudits, setPaymentAudits] = useState<any[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [landingConfig, setLandingConfig] = useState<any>({
    heroHeadline: "",
    heroSubtitle: "",
    pricingSingle: "",
    pricingBundle: "",
    trustCounterClients: "",
    trustCounterVetted: "",
    legalNotice: ""
  });

  // New Upgraded Admin States
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<any>({
    enable_esign: true,
    enable_ai: true,
    enable_sandbox_payments: true,
    announcement: '',
    maintenance_mode: false,
    email_welcome_subject: 'Welcome to LegalDocs!',
    email_welcome_body: 'Thank you for choosing LegalDocs.',
    email_magic_subject: 'Magic Login Link',
    email_magic_body: 'Here is your link.',
    referral_reward_amount: 100
  });
  const [coupons, setCoupons] = useState<any[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [healthStats, setHealthStats] = useState<any>(null);

  // New Coupon States
  const [newCouponCode, setNewCouponCode] = useState<string>('');
  const [newCouponDiscount, setNewCouponDiscount] = useState<number>(15);
  const [newCouponExpiry, setNewCouponExpiry] = useState<string>('');
  const [newCouponMaxUses, setNewCouponMaxUses] = useState<number>(100);

  // Dynamic Workflows admin states
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [savingWorkflow, setSavingWorkflow] = useState<boolean>(false);
  const [workflowSuccess, setWorkflowSuccess] = useState<string>('');
  const [workflowError, setWorkflowError] = useState<string>('');

  // Loading/Interventions state
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [creditAdjustment, setCreditAdjustment] = useState<Record<string, number>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [supportReply, setSupportReply] = useState<string>('');

  // 1. Verify Authentication Role
  useEffect(() => {
    fetch('/api/admin/auth-check')
      .then(res => {
        if (res.ok) {
          setIsAdminAuth(true);
          fetchDashboardData();
        } else {
          router.push('/login?admin=true');
        }
      })
      .catch(() => {
        router.push('/login?admin=true');
      })
      .finally(() => {
        setLoadingAuth(false);
      });
  }, []);

  // 2. Load Dashboard Metrics
  const fetchDashboardData = async () => {
    setLoadingData(true);
    try {
      // Fetch stats
      const statsRes = await fetch('/api/admin/dashboard-stats');
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.stats);

      // Fetch users
      const usersRes = await fetch('/api/admin/users');
      const usersData = await usersRes.json();
      if (usersData.success) {
        setUsers(usersData.users);
        setActivityLogs(usersData.logs);
      }

      // Fetch documents
      const docsRes = await fetch('/api/admin/documents');
      const docsData = await docsRes.json();
      if (docsData.success) {
        setDocuments(docsData.documents);
        setTemplateStats(docsData.templateStats);
      }

      // Fetch templates
      const tempRes = await fetch('/api/admin/templates');
      const tempData = await tempRes.json();
      if (tempData.success) {
        setTemplates(tempData.templates);
        if (tempData.templates.length > 0) setSelectedTemplate(tempData.templates[0]);
      }

      // Fetch payments
      const payRes = await fetch('/api/admin/payments');
      const payData = await payRes.json();
      if (payData.success) {
        setOrders(payData.orders);
        setPaymentAudits(payData.audits);
        setWebhookLogs(payData.webhooks);
      }

      // Fetch support tickets
      const tickRes = await fetch('/api/admin/tickets');
      const tickData = await tickRes.json();
      if (tickData.success) {
        setTickets(tickData.tickets);
        if (tickData.tickets.length > 0 && !selectedTicket) setSelectedTicket(tickData.tickets[0]);
      }

      // Fetch content config
      const configRes = await fetch('/api/admin/content');
      const configData = await configRes.json();
      if (configData.success) {
        setLandingConfig(configData.config);
      }

      // NEW DATA FETCHES FOR UPGRADES
      const fbRes = await fetch('/api/feedback');
      const fbData = await fbRes.json();
      if (fbData.success) setFeedbacks(fbData.feedbacks);

      const setRes = await fetch('/api/admin/settings');
      const setData = await setRes.json();
      if (setData.success) setSystemSettings(setData.settings);

      const coupRes = await fetch('/api/admin/coupons');
      const coupData = await coupRes.json();
      if (coupData.success) setCoupons(coupData.coupons);

      const backRes = await fetch('/api/system/backup');
      const backData = await backRes.json();
      if (backData.success) setBackups(backData.backups);

      const healthRes = await fetch('/api/system/health');
      const healthData = await healthRes.json();
      if (healthData.success) setHealthStats(healthData.health);

      // Fetch dynamic workflows
      const wfRes = await fetch('/api/workflows');
      const wfData = await wfRes.json();
      if (wfData.success) {
        setWorkflows(wfData.workflows);
        if (wfData.workflows.length > 0) {
          const firstWf = wfData.workflows[0];
          setSelectedWorkflow({
            ...firstWf,
            question_set: typeof firstWf.question_set === 'object' ? JSON.stringify(firstWf.question_set, null, 2) : firstWf.question_set,
            validation_rules: typeof firstWf.validation_rules === 'object' ? JSON.stringify(firstWf.validation_rules, null, 2) : firstWf.validation_rules,
            ai_suggestions: typeof firstWf.ai_suggestions === 'object' ? JSON.stringify(firstWf.ai_suggestions, null, 2) : firstWf.ai_suggestions
          });
        }
      }

    } catch (e) {
      console.error('Error fetching admin dashboard metrics:', e);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchWorkflows = async () => {
    try {
      const res = await fetch('/api/workflows');
      const data = await res.json();
      if (data.success) {
        setWorkflows(data.workflows);
      }
    } catch (err) {
      console.error('Error fetching admin workflows:', err);
    }
  };

  const handleSaveWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkflow) return;
    setSavingWorkflow(true);
    setWorkflowSuccess('');
    setWorkflowError('');

    try {
      let parsedQuestionSet = selectedWorkflow.question_set;
      let parsedValidationRules = selectedWorkflow.validation_rules;
      let parsedAiSuggestions = selectedWorkflow.ai_suggestions;

      if (typeof parsedQuestionSet === 'string') {
        parsedQuestionSet = JSON.parse(parsedQuestionSet);
      }
      if (typeof parsedValidationRules === 'string') {
        parsedValidationRules = JSON.parse(parsedValidationRules);
      }
      if (typeof parsedAiSuggestions === 'string') {
        parsedAiSuggestions = JSON.parse(parsedAiSuggestions);
      }

      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...selectedWorkflow,
          question_set: parsedQuestionSet,
          validation_rules: parsedValidationRules,
          ai_suggestions: parsedAiSuggestions
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setWorkflowSuccess('Workflow configuration saved successfully!');
        fetchWorkflows();
      } else {
        throw new Error(data.error || 'Failed to save configuration.');
      }
    } catch (err: any) {
      console.error(err);
      setWorkflowError(err.message || 'Error occurred while parsing or saving JSON settings.');
    } finally {
      setSavingWorkflow(false);
    }
  };

  // Upgraded Settings & Backups Actions
  const handleSaveAllSettings = async () => {
    setActionLoading(true);
    try {
      for (const key of Object.keys(systemSettings)) {
        await fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value: systemSettings[key] })
        });
      }
      alert('System configurations saved successfully!');
      fetchDashboardData();
    } catch (e) {
      alert('Failed to update system settings.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddCoupon = async () => {
    if (!newCouponCode.trim() || !newCouponExpiry) {
      alert('Promo code and expiry date are required.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCouponCode,
          discountPercent: newCouponDiscount,
          expiresAt: newCouponExpiry,
          maxUses: newCouponMaxUses
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNewCouponCode('');
        setCoupons(data.coupons);
        alert('Promo code created successfully!');
      } else {
        alert(data.error || 'Failed to create promo code.');
      }
    } catch (e) {
      alert('Connection error creating coupon.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!confirm(`Are you sure you want to delete promo code ${code}?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', code })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCoupons(data.coupons);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerBackup = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/system/backup', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        fetchDashboardData();
      }
    } catch (e) {
      alert('Failed to trigger backup.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    if (!confirm(`Are you sure you want to restore templates and settings from ${filename}?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/system/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', filename })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        fetchDashboardData();
      } else {
        alert(data.error || 'Failed to restore backup.');
      }
    } catch (e) {
      alert('Failed to execute restore.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateFeedbackStatus = async (id: string, status: string) => {
    alert(`Feedback status changed to ${status}.`);
    setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status } : f));
  };

  // User Actions
  const handleUserStatus = async (email: string, action: 'suspend' | 'activate') => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, email })
      });
      if (res.ok) fetchDashboardData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdjustCredits = async (email: string) => {
    const credits = creditAdjustment[email] || 0;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'adjust-credits', email, credits })
      });
      if (res.ok) {
        alert('Credits updated successfully!');
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Document Actions
  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document record? This action is permanent.')) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });
      if (res.ok) fetchDashboardData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Template Vetting Vets Save
  const handleSaveTemplateMetadata = async () => {
    if (!selectedTemplate) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedTemplate)
      });
      if (res.ok) {
        alert('Template configuration saved successfully!');
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Payment refund trigger
  const handleRefundPayment = async (orderId: string) => {
    if (!confirm('Are you sure you want to approve and execute refund for this order?')) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refund', orderId })
      });
      if (res.ok) {
        alert('Refund approved successfully!');
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Ticketing replies
  const handleSendTicketReply = async () => {
    if (!selectedTicket || !supportReply.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          ticketId: selectedTicket.id,
          message: supportReply
        })
      });
      if (res.ok) {
        setSupportReply('');
        alert('Reply posted successfully!');
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: 'OPEN' | 'RESOLVED' | 'CLOSED') => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', ticketId, status })
      });
      if (res.ok) fetchDashboardData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Save content config
  const handleSaveLandingConfig = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: landingConfig })
      });
      if (res.ok) {
        alert('Landing page content config updated successfully!');
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Verifying Admin Access...</span>
      </div>
    );
  }

  if (!isAdminAuth) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow w-full space-y-8 text-left">
      
      {/* Header Info Block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Admin Management Console
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Supervise user directories, template rules, financial logs, support queues, and dynamic configuration states.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchDashboardData}
          disabled={loadingData}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loadingData ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Tabs Navigation Sidebar Slider */}
      <div className="flex gap-2 overflow-x-auto border-b border-slate-900 pb-2 text-xs uppercase font-bold tracking-wider">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'users', label: 'Users Desk', icon: Users },
          { id: 'documents', label: 'Contracts Desk', icon: FileText },
          { id: 'templates', label: 'Template Manager', icon: Layers },
          { id: 'payments', label: 'Financial Ledger', icon: DollarSign },
          { id: 'support', label: 'Support Queue', icon: MessageSquare },
          { id: 'feedback', label: 'Feedback Desk', icon: MessageSquare },
          { id: 'settings', label: 'Feature Flags & Settings', icon: Settings },
          { id: 'diagnostics', label: 'Diagnostics & Backups', icon: ShieldCheck },
          { id: 'content', label: 'Content Customizer', icon: Settings },
          { id: 'workflows', label: 'Dynamic Workflows', icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-sm'
                  : 'bg-slate-900/40 border-slate-900 text-slate-400 hover:text-white hover:border-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loadingData ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Synchronizing metrics from database...</span>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-8 animate-fade-in">
              {/* Metric grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Users', value: stats.totalUsers, desc: 'Registered Emails', color: 'blue' },
                  { label: 'Active Users', value: stats.activeUsers, desc: 'Engaged users count', color: 'indigo' },
                  { label: 'Documents Created', value: stats.documentsGenerated, desc: 'SUCCESS compiled PDFs', color: 'emerald' },
                  { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, desc: 'Paid Orders Volume', color: 'emerald' },
                  { label: 'Revenue Today', value: `₹${stats.revenueToday.toLocaleString()}`, desc: 'Today captured', color: 'blue' },
                  { label: 'Conversion Rate', value: `${stats.conversionRate}%`, desc: 'Orders payment rate', color: 'indigo' },
                  { label: 'Wizard Completion', value: `${stats.wizardCompletionRate}%`, desc: 'Generate/Start funnel', color: 'blue' },
                  { label: 'Payment Success', value: `${stats.paymentSuccessRate}%`, desc: 'Paid / processed attempts', color: 'emerald' },
                ].map((m, i) => (
                  <div key={i} className="rounded-2xl border border-slate-900 bg-slate-950/20 p-5 space-y-1">
                    <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">{m.label}</span>
                    <span className="text-xl font-bold text-white block">{m.value}</span>
                    <span className="text-[9px] text-slate-500 block leading-none">{m.desc}</span>
                  </div>
                ))}
              </div>

              {/* Lower Section: Popular template & activity feed */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Popular template */}
                <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-2">Most Popular Template</h3>
                  <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/10 px-4 py-3 rounded-xl">
                    <FileCheck className="h-6 w-6 text-blue-400" />
                    <div>
                      <span className="text-xs font-bold text-white uppercase block">{stats.mostPopularTemplate.replace('_', ' ')}</span>
                      <span className="text-[10px] text-slate-400">Widest usage parameters</span>
                    </div>
                  </div>
                </div>

                {/* Activity Feed */}
                <div className="lg:col-span-2 rounded-2xl border border-slate-900 bg-slate-955/20 p-6 space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-2">Recent System Activity Feed</h3>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    {stats.recentActivity.length === 0 ? (
                      <p className="text-xs text-slate-600 italic">No logged activity recorded.</p>
                    ) : (
                      stats.recentActivity.map((act: any, idx: number) => (
                        <div key={idx} className="text-xs flex justify-between items-start gap-4 border-b border-slate-900/60 pb-3 last:border-b-0">
                          <div>
                            <span className="font-semibold text-slate-200 block">{act.title}</span>
                            <span className="text-slate-500 text-[10px] block mt-0.5">{act.description}</span>
                          </div>
                          <span className="text-[9px] text-slate-500 font-mono whitespace-nowrap">{new Date(act.timestamp).toLocaleTimeString('en-IN')}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: USERS DESK */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex gap-4 items-center">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-600" />
                  <input
                    type="text"
                    placeholder="Search users email address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-10 py-2.5 text-xs text-white placeholder-slate-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-900 bg-slate-950/20 overflow-hidden">
                <table className="min-w-full text-xs text-left divide-y divide-slate-900">
                  <thead className="bg-slate-950/40 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-5 py-3.5">Email</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Credits</th>
                      <th className="px-5 py-3.5">Docs</th>
                      <th className="px-5 py-3.5">Total Paid</th>
                      <th className="px-5 py-3.5">Manage Credits</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-300">
                    {users
                      .filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((u) => (
                        <tr key={u.email} className="hover:bg-slate-900/20">
                          <td className="px-5 py-3.5 font-semibold text-slate-200">{u.email}</td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-block px-2 py-0.5 rounded font-bold text-[9px] uppercase ${
                              u.status === 'ACTIVE' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' 
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/10'
                            }`}>{u.status}</span>
                          </td>
                          <td className="px-5 py-3.5 font-bold text-white">{u.credits}</td>
                          <td className="px-5 py-3.5 text-slate-400">{u.documentsCount}</td>
                          <td className="px-5 py-3.5 font-semibold text-white">₹{u.totalSpent}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                placeholder="Set count"
                                value={creditAdjustment[u.email] !== undefined ? creditAdjustment[u.email] : u.credits}
                                onChange={(e) => setCreditAdjustment({
                                  ...creditAdjustment,
                                  [u.email]: parseInt(e.target.value) || 0
                                })}
                                className="w-16 rounded border border-slate-800 bg-slate-950 px-2 py-1 text-center font-mono text-[10px]"
                              />
                              <button
                                type="button"
                                onClick={() => handleAdjustCredits(u.email)}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[9px] px-2 py-1 rounded"
                              >
                                Save
                              </button>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right space-x-2">
                            {u.status === 'ACTIVE' ? (
                              <button
                                type="button"
                                onClick={() => handleUserStatus(u.email, 'suspend')}
                                className="text-rose-400 hover:underline font-bold uppercase text-[9px]"
                              >
                                Suspend
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleUserStatus(u.email, 'activate')}
                                className="text-emerald-400 hover:underline font-bold uppercase text-[9px]"
                              >
                                Activate
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CONTRACTS DESK */}
          {activeTab === 'documents' && (
            <div className="space-y-6 animate-fade-in">
              <div className="rounded-2xl border border-slate-900 bg-slate-950/20 overflow-hidden">
                <table className="min-w-full text-xs text-left divide-y divide-slate-900">
                  <thead className="bg-slate-950/40 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-5 py-3.5">Document ID</th>
                      <th className="px-5 py-3.5">Type</th>
                      <th className="px-5 py-3.5">Email Owner</th>
                      <th className="px-5 py-3.5">Expires</th>
                      <th className="px-5 py-3.5">Views</th>
                      <th className="px-5 py-3.5">Downloads</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-300">
                    {documents.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-900/20">
                        <td className="px-5 py-3.5 font-mono text-[10px] text-slate-500">{d.id}</td>
                        <td className="px-5 py-3.5">
                          <span className="bg-blue-500/10 border border-blue-500/10 px-2 py-0.5 rounded text-blue-450 font-bold uppercase tracking-wider text-[9px]">{d.type}</span>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-slate-200">{d.email || 'guest@legaldocs.co'}</td>
                        <td className="px-5 py-3.5 text-slate-500">{new Date(d.expires_at).toLocaleDateString('en-IN')}</td>
                        <td className="px-5 py-3.5">{d.view_count} views</td>
                        <td className="px-5 py-3.5">{d.download_count} times</td>
                        <td className="px-5 py-3.5 text-right space-x-3">
                          {d.pdf_url && (
                            <a
                              href={d.pdf_url}
                              download
                              className="text-blue-400 hover:underline font-bold"
                            >
                              Download
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(d.id)}
                            className="text-rose-450 hover:text-rose-400 font-bold"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: TEMPLATE MANAGER */}
          {activeTab === 'templates' && selectedTemplate && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
              
              {/* Template selector side-list */}
              <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-4 space-y-2 h-fit">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block pb-2">Active Templates</span>
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t)}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-semibold uppercase tracking-wider block transition-all ${
                      selectedTemplate.id === t.id
                        ? 'border-blue-500 bg-blue-600/10 text-blue-450'
                        : 'border-slate-900 bg-slate-950/20 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="block font-bold">{t.name}</span>
                    <span className="text-[9px] text-slate-500 block font-normal mt-0.5">{t.type} / {t.variant} (v{t.version})</span>
                  </button>
                ))}
              </div>

              {/* Template Editor form */}
              <div className="lg:col-span-2 rounded-2xl border border-slate-900 bg-slate-950/20 p-6 space-y-5 text-xs">
                <div className="border-b border-slate-900 pb-3 flex justify-between items-center">
                  <h3 className="text-base font-bold text-white">Edit Template Metadata: <span className="text-blue-400">{selectedTemplate.name}</span></h3>
                  <button
                    type="button"
                    onClick={handleSaveTemplateMetadata}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold uppercase tracking-wider"
                  >
                    Save Changes
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase block">Version String</label>
                    <input
                      type="text"
                      value={selectedTemplate.version}
                      onChange={(e) => setSelectedTemplate({ ...selectedTemplate, version: e.target.value })}
                      className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase block">Base Price (INR)</label>
                    <input
                      type="number"
                      value={selectedTemplate.price}
                      onChange={(e) => setSelectedTemplate({ ...selectedTemplate, price: e.target.value })}
                      className="w-full rounded border border-slate-800 bg-slate-955 px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase block">Compliance Description</label>
                  <textarea
                    rows={2}
                    value={selectedTemplate.description}
                    onChange={(e) => setSelectedTemplate({ ...selectedTemplate, description: e.target.value })}
                    className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>

                <div className="flex gap-6 py-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-300">
                    <input
                      type="checkbox"
                      checked={selectedTemplate.is_active}
                      onChange={(e) => setSelectedTemplate({ ...selectedTemplate, is_active: e.target.checked })}
                      className="rounded bg-slate-950 border-slate-800"
                    />
                    <span>Active Template</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-300">
                    <input
                      type="checkbox"
                      checked={selectedTemplate.lawyer_reviewed}
                      onChange={(e) => setSelectedTemplate({ ...selectedTemplate, lawyer_reviewed: e.target.checked })}
                      className="rounded bg-slate-955 border-slate-800"
                    />
                    <span>Lawyer Reviewed Vetted</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-300">
                    <input
                      type="checkbox"
                      checked={selectedTemplate.ai_assisted}
                      onChange={(e) => setSelectedTemplate({ ...selectedTemplate, ai_assisted: e.target.checked })}
                      className="rounded bg-slate-955 border-slate-800"
                    />
                    <span>AI Auditor Enabled</span>
                  </label>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center border-t border-slate-900 pt-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Vetted FAQ List</span>
                    <button
                      type="button"
                      onClick={() => setSelectedTemplate({
                        ...selectedTemplate,
                        faqs: [...(selectedTemplate.faqs || []), { question: "New Question?", answer: "Answer block." }]
                      })}
                      className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] text-white px-2 py-1 rounded"
                    >
                      + Add FAQ
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(selectedTemplate.faqs || []).map((faq: any, fIdx: number) => (
                      <div key={fIdx} className="bg-slate-950/60 p-3 rounded-xl border border-slate-900 space-y-2 relative">
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => {
                            const newFaqs = [...selectedTemplate.faqs];
                            newFaqs[fIdx].question = e.target.value;
                            setSelectedTemplate({ ...selectedTemplate, faqs: newFaqs });
                          }}
                          className="w-full bg-slate-950 border border-slate-850 rounded px-2 py-1 font-semibold text-slate-200"
                        />
                        <textarea
                          rows={2}
                          value={faq.answer}
                          onChange={(e) => {
                            const newFaqs = [...selectedTemplate.faqs];
                            newFaqs[fIdx].answer = e.target.value;
                            setSelectedTemplate({ ...selectedTemplate, faqs: newFaqs });
                          }}
                          className="w-full bg-slate-950 border border-slate-850 rounded px-2 py-1 text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newFaqs = selectedTemplate.faqs.filter((_: any, idx: number) => idx !== fIdx);
                            setSelectedTemplate({ ...selectedTemplate, faqs: newFaqs });
                          }}
                          className="absolute top-2 right-2 text-rose-500 hover:text-rose-400"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: FINANCIAL LEDGER */}
          {activeTab === 'payments' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in text-xs">
              
              {/* Payment transactions */}
              <div className="lg:col-span-2 rounded-2xl border border-slate-900 bg-slate-950/20 p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-2">Razorpay Checkout Sessions</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs text-left divide-y divide-slate-900">
                    <thead className="bg-slate-950/40 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Order ID</th>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Refund Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-slate-300">
                      {orders.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-900/10">
                          <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{o.id.slice(0, 8)}...</td>
                          <td className="px-4 py-3 text-slate-200">{o.email || 'guest'}</td>
                          <td className="px-4 py-3 font-bold text-white">₹{o.amount / 100}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              o.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'
                            }`}>{o.status}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {o.status === 'PAID' && (
                              <button
                                type="button"
                                onClick={() => handleRefundPayment(o.id)}
                                className="text-rose-450 hover:underline font-bold"
                              >
                                Refund
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Side Panels: Webhooks and Audits */}
              <div className="space-y-6">
                
                {/* Payment Audits list */}
                <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-2">Financial Audits</h3>
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2">
                    {paymentAudits.map((a) => (
                      <div key={a.id} className="border-b border-slate-900/60 pb-2 last:border-0 text-[11px]">
                        <span className="font-semibold text-slate-300 block">{a.action}</span>
                        <span className="text-slate-500 text-[10px] block mt-0.5">{a.email} — ₹{a.amount / 100} ({a.status})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Webhook logs */}
                <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-2">Webhook Logs</h3>
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2">
                    {webhookLogs.map((log) => (
                      <div key={log.id} className="border-b border-slate-900/60 pb-2 last:border-0 text-[11px]">
                        <span className="font-semibold text-indigo-400 block font-mono">{log.event_type}</span>
                        <span className="text-slate-500 text-[9px] block mt-0.5">{new Date(log.created_at).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 6: SUPPORT QUEUE */}
          {activeTab === 'support' && selectedTicket && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in text-xs">
              
              {/* Ticket selector list */}
              <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-4 space-y-2 h-fit">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block pb-2">Inbox Tickets</span>
                {tickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-semibold block transition-all ${
                      selectedTicket.id === t.id
                        ? 'border-blue-500 bg-blue-600/10 text-blue-450'
                        : 'border-slate-900 bg-slate-955/20 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="block font-bold text-slate-200 truncate">{t.subject}</span>
                    <span className="text-[10px] text-slate-500 font-normal block truncate mt-0.5">{t.email}</span>
                    <span className={`inline-block px-1.5 py-0.2 rounded text-[8px] font-bold mt-1 uppercase ${
                      t.status === 'OPEN' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>{t.status}</span>
                  </button>
                ))}
              </div>

              {/* Chat Viewport and Controls */}
              <div className="lg:col-span-2 rounded-2xl border border-slate-900 bg-slate-955/20 p-6 space-y-5 flex flex-col justify-between min-h-[480px]">
                <div>
                  <div className="flex justify-between items-start border-b border-slate-900 pb-3 flex-wrap gap-2">
                    <div>
                      <h4 className="font-bold text-white text-base leading-snug">{selectedTicket.subject}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">From: {selectedTicket.email} (Priority: {selectedTicket.priority})</p>
                    </div>

                    <div className="flex gap-2">
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleUpdateTicketStatus(selectedTicket.id, e.target.value as any)}
                        className="bg-slate-950 border border-slate-800 text-[10px] font-bold text-white px-2 py-1 rounded"
                      >
                        <option value="OPEN">Open</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </div>
                  </div>

                  {/* Messages Feed */}
                  <div className="space-y-4 pt-4 overflow-y-auto max-h-[300px]">
                    <div className="bg-slate-900/40 border border-slate-900 p-3 rounded-xl space-y-1">
                      <span className="font-bold text-slate-300 block">{selectedTicket.email}</span>
                      <p className="text-slate-400 text-xs">{selectedTicket.message}</p>
                    </div>

                    {((selectedTicket.replies || []) as any[]).map((r, rIdx) => (
                      <div key={rIdx} className={`p-3 rounded-xl border space-y-1 ${
                        r.sender.includes('Admin') 
                          ? 'bg-blue-600/5 border-blue-500/10 ml-8 text-right' 
                          : 'bg-slate-900/40 border-slate-900 mr-8'
                      }`}>
                        <span className="font-bold text-slate-350 block">{r.sender}</span>
                        <p className="text-slate-450 text-xs">{r.message}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reply Editor */}
                <div className="flex gap-2 border-t border-slate-900 pt-4 mt-4">
                  <input
                    type="text"
                    placeholder="Type message reply to client..."
                    value={supportReply}
                    onChange={(e) => setSupportReply(e.target.value)}
                    className="flex-grow rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  />
                  <button
                    type="button"
                    onClick={handleSendTicketReply}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
            {/* TAB 7: FEEDBACK DESK */}
          {activeTab === 'feedback' && (
            <div className="space-y-6 animate-fade-in text-xs">
              
              {/* Aggregate Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-5 space-y-1">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Total Submissions</span>
                  <span className="text-xl font-bold text-white block">{feedbacks.length} forms</span>
                </div>
                <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-5 space-y-1">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">NPS Average Score</span>
                  <span className="text-xl font-bold text-blue-450 block">
                    {(feedbacks.filter(f => f.type === 'NPS').reduce((acc, curr) => acc + (curr.nps_score || 0), 0) / 
                      Math.max(feedbacks.filter(f => f.type === 'NPS').length, 1)).toFixed(1)} / 10
                  </span>
                </div>
                <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-5 space-y-1">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Average Star Rating</span>
                  <span className="text-xl font-bold text-amber-450 block">
                    {(feedbacks.reduce((acc, curr) => acc + (curr.rating || 5), 0) / 
                      Math.max(feedbacks.length, 1)).toFixed(1)} ★
                  </span>
                </div>
              </div>

              {/* Feedbacks Listing Table */}
              <div className="rounded-2xl border border-slate-900 bg-slate-950/20 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-900">
                  <h3 className="font-bold text-white text-sm">User Reviews & NPS Registries</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-900 text-left text-xs text-slate-350">
                    <thead className="bg-slate-950/50 uppercase font-bold tracking-wider text-slate-400">
                      <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Star / NPS</th>
                        <th className="px-6 py-4">Message</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 bg-slate-900/5">
                      {feedbacks.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-10 text-center text-slate-500">No feedbacks registered yet.</td>
                        </tr>
                      ) : (
                        feedbacks.map((fb) => (
                          <tr key={fb.id} className="hover:bg-slate-900/20 transition-colors">
                            <td className="px-6 py-4 font-semibold text-white">{fb.email}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex rounded px-2 py-0.5 text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                {fb.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-300">
                              {fb.type === 'NPS' ? `${fb.nps_score || 0} NPS` : `${fb.rating || 5} ★`}
                            </td>
                            <td className="px-6 py-4 max-w-xs truncate text-slate-400" title={fb.message}>{fb.message}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                fb.status === 'NEW' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-800 text-slate-500'
                              }`}>{fb.status}</span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-3 whitespace-nowrap">
                              <button
                                onClick={() => handleUpdateFeedbackStatus(fb.id, 'REVIEWED')}
                                className="text-blue-400 hover:underline font-bold"
                              >
                                Review
                              </button>
                              <button
                                onClick={() => handleUpdateFeedbackStatus(fb.id, 'ARCHIVED')}
                                className="text-slate-550 hover:underline"
                              >
                                Archive
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 8: FEATURE FLAGS & MARKETING SETTINGS */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in text-xs">
              
              {/* Feature Flags, Announcements, Maintenance */}
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-6 space-y-6">
                  <div className="border-b border-slate-900 pb-3 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white">System Feature Flags</h3>
                    <button
                      type="button"
                      onClick={handleSaveAllSettings}
                      disabled={actionLoading}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold uppercase tracking-wider disabled:opacity-50"
                    >
                      Save Configurations
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* eSign flag */}
                    <div className="rounded-xl border border-slate-900 bg-slate-950/30 p-4 flex items-center justify-between">
                      <div className="text-left">
                        <span className="font-bold text-white block">Digio e-Sign integration</span>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">Enable signature collections</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={systemSettings.enable_esign}
                        onChange={(e) => setSystemSettings({ ...systemSettings, enable_esign: e.target.checked })}
                        className="rounded border-slate-800 bg-slate-950 text-blue-600 h-4 w-4"
                      />
                    </div>

                    {/* AI flag */}
                    <div className="rounded-xl border border-slate-900 bg-slate-950/30 p-4 flex items-center justify-between">
                      <div className="text-left">
                        <span className="font-bold text-white block">AI Assistant & Audits</span>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">AI clause analysis and checks</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={systemSettings.enable_ai}
                        onChange={(e) => setSystemSettings({ ...systemSettings, enable_ai: e.target.checked })}
                        className="rounded border-slate-800 bg-slate-950 text-blue-600 h-4 w-4"
                      />
                    </div>

                    {/* Sandbox payments */}
                    <div className="rounded-xl border border-slate-900 bg-slate-950/30 p-4 flex items-center justify-between">
                      <div className="text-left">
                        <span className="font-bold text-white block">Razorpay Sandbox Mode</span>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">Bypass real transaction limits</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={systemSettings.enable_sandbox_payments}
                        onChange={(e) => setSystemSettings({ ...systemSettings, enable_sandbox_payments: e.target.checked })}
                        className="rounded border-slate-800 bg-slate-950 text-blue-600 h-4 w-4"
                      />
                    </div>

                    {/* Maintenance Mode */}
                    <div className="rounded-xl border border-slate-900 bg-slate-950/30 p-4 flex items-center justify-between">
                      <div className="text-left">
                        <span className="font-bold text-white block">Maintenance Mode</span>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">Block client workspace actions</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={systemSettings.maintenance_mode}
                        onChange={(e) => setSystemSettings({ ...systemSettings, maintenance_mode: e.target.checked })}
                        className="rounded border-slate-800 bg-slate-950 text-blue-600 h-4 w-4"
                      />
                    </div>
                  </div>

                  {/* Announcement Banner */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] text-slate-500 font-bold uppercase block">Site Announcements Banner</label>
                    <input
                      type="text"
                      value={systemSettings.announcement}
                      onChange={(e) => setSystemSettings({ ...systemSettings, announcement: e.target.value })}
                      placeholder="e.g. Scheduled database maintenance Sunday 2 AM IST..."
                      className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-2.5 text-white"
                    />
                  </div>

                  {/* Referral setup */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] text-slate-500 font-bold uppercase block">Referral Incentive Rewards (Credits amount)</label>
                    <input
                      type="number"
                      value={systemSettings.referral_reward_amount}
                      onChange={(e) => setSystemSettings({ ...systemSettings, referral_reward_amount: Number(e.target.value) })}
                      className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                    />
                  </div>

                </div>

                {/* Email Templates Visual Editor */}
                <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-6 space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-2">Email Templates Editor</h3>
                  
                  <div className="space-y-4 text-left">
                    <div className="border border-slate-880 rounded-xl p-4 bg-slate-950/30 space-y-3">
                      <span className="font-bold text-white block">1. Onboarding Confirmation Email</span>
                      <input 
                        type="text" 
                        value={systemSettings.email_welcome_subject}
                        onChange={(e) => setSystemSettings({ ...systemSettings, email_welcome_subject: e.target.value })}
                        className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-1.5 text-white text-xs" 
                        placeholder="Welcome Subject"
                      />
                      <textarea 
                        rows={3} 
                        value={systemSettings.email_welcome_body}
                        onChange={(e) => setSystemSettings({ ...systemSettings, email_welcome_body: e.target.value })}
                        className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-1.5 text-white text-xs resize-none" 
                        placeholder="Welcome Body text"
                      />
                    </div>

                    <div className="border border-slate-880 rounded-xl p-4 bg-slate-950/30 space-y-3">
                      <span className="font-bold text-white block">2. Auth Link Verification Email</span>
                      <input 
                        type="text" 
                        value={systemSettings.email_magic_subject}
                        onChange={(e) => setSystemSettings({ ...systemSettings, email_magic_subject: e.target.value })}
                        className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-1.5 text-white text-xs" 
                        placeholder="Magic Verification Link Subject"
                      />
                      <textarea 
                        rows={3} 
                        value={systemSettings.email_magic_body}
                        onChange={(e) => setSystemSettings({ ...systemSettings, email_magic_body: e.target.value })}
                        className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-1.5 text-white text-xs resize-none" 
                        placeholder="Magic Verification Link Body text"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Coupons Promotional Manager */}
              <div className="space-y-6">
                
                {/* Coupon Generator Form */}
                <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-2">Generate Promo Code</h3>
                  
                  <div className="space-y-3 text-left">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 font-bold uppercase block">Promo Code Name</label>
                      <input
                        type="text"
                        placeholder="e.g. BENEFACTOR15"
                        value={newCouponCode}
                        onChange={(e) => setNewCouponCode(e.target.value)}
                        className="w-full rounded border border-slate-800 bg-slate-955 px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 font-bold uppercase block">Discount Percent (%)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={newCouponDiscount}
                        onChange={(e) => setNewCouponDiscount(Number(e.target.value))}
                        className="w-full rounded border border-slate-800 bg-slate-955 px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 font-bold uppercase block">Max Redemptions</label>
                      <input
                        type="number"
                        min="1"
                        value={newCouponMaxUses}
                        onChange={(e) => setNewCouponMaxUses(Number(e.target.value))}
                        className="w-full rounded border border-slate-800 bg-slate-955 px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 font-bold uppercase block">Expiry Date</label>
                      <input
                        type="date"
                        value={newCouponExpiry}
                        onChange={(e) => setNewCouponExpiry(e.target.value)}
                        className="w-full rounded border border-slate-800 bg-slate-955 px-3 py-2 text-slate-400"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddCoupon}
                      disabled={actionLoading}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-bold uppercase tracking-wider disabled:opacity-50 mt-2"
                    >
                      Add Promo Code
                    </button>
                  </div>
                </div>

                {/* Coupons List */}
                <div className="rounded-2xl border border-slate-900 bg-slate-955/10 p-5 space-y-4">
                  <span className="text-[10px] font-bold text-slate-550 uppercase tracking-widest block pb-2 border-b border-slate-900">Active Coupons</span>
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                    {coupons.length === 0 ? (
                      <span className="text-slate-550 italic block text-center py-4">No active coupon codes.</span>
                    ) : (
                      coupons.map((c, i) => (
                        <div key={i} className="flex justify-between items-center border-b border-slate-900 pb-2 last:border-0 text-left">
                          <div>
                            <span className="font-bold text-white block">{c.code}</span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              {c.discountPercent}% off • Uses: {c.usesCount}/{c.maxUses}
                            </span>
                            <span className="text-[9px] text-slate-550 block font-mono">Expires: {c.expiresAt}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteCoupon(c.code)}
                            className="text-rose-400 hover:text-rose-300 font-bold"
                          >
                            Delete
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 9: DIAGNOSTICS & SYSTEM BACKUPS */}
          {activeTab === 'diagnostics' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in text-xs">
              
              {/* Left Column: Observability & Health Stats */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Health parameters */}
                <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-2">Health Diagnostics Monitor</h3>
                  {healthStats ? (
                    <div className="grid grid-cols-2 gap-4 text-left">
                      <div className="border border-slate-900 rounded-xl p-3 bg-slate-950/40">
                        <span className="text-[9px] text-slate-500 font-bold uppercase block">Database Connection</span>
                        <span className="text-xs font-bold text-emerald-450 mt-1 block">
                          {healthStats.database.status} ({healthStats.database.responseTimeMs}ms response)
                        </span>
                      </div>
                      <div className="border border-slate-900 rounded-xl p-3 bg-slate-950/40">
                        <span className="text-[9px] text-slate-500 font-bold uppercase block">Claude AI Infrastructure</span>
                        <span className={`text-xs font-bold mt-1 block ${healthStats.ai.status === 'CONNECTED' ? 'text-emerald-450' : 'text-amber-500'}`}>
                          {healthStats.ai.status}
                        </span>
                      </div>
                      <div className="border border-slate-900 rounded-xl p-3 bg-slate-950/40">
                        <span className="text-[9px] text-slate-500 font-bold uppercase block">System Load average</span>
                        <span className="text-xs font-bold text-white mt-1 block">
                          {healthStats.system.loadAvg.map((l: number) => l.toFixed(2)).join(', ')}
                        </span>
                      </div>
                      <div className="border border-slate-900 rounded-xl p-3 bg-slate-950/40">
                        <span className="text-[9px] text-slate-500 font-bold uppercase block">Node Server Memory</span>
                        <span className="text-xs font-bold text-blue-450 mt-1 block">
                          {healthStats.system.memory.heapUsedMb} MB used / {healthStats.system.memory.heapTotalMb} MB total
                        </span>
                      </div>
                      <div className="border border-slate-900 rounded-xl p-3 bg-slate-950/40">
                        <span className="text-[9px] text-slate-500 font-bold uppercase block">Server Uptime</span>
                        <span className="text-xs font-bold text-white mt-1 block">
                          {healthStats.system.uptimeHours} hours operational
                        </span>
                      </div>
                      <div className="border border-slate-900 rounded-xl p-3 bg-slate-950/40">
                        <span className="text-[9px] text-slate-500 font-bold uppercase block">Total Error logs</span>
                        <span className="text-xs font-bold text-rose-400 mt-1 block">
                          {healthStats.logs.errorCount} recorded errors
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-slate-500 italic block text-center">Loading system diagnostic logs...</div>
                  )}
                </div>

                {/* Slow query & logs diagnostics */}
                <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-2">observability Logs Desk</h3>
                  
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 text-left font-mono text-[10px]">
                    {healthStats?.logs.recent.length === 0 ? (
                      <span className="text-slate-550 italic block py-4 text-center">No system log entries registered.</span>
                    ) : (
                      healthStats?.logs.recent.map((log: any) => (
                        <div key={log.id} className="border-b border-slate-900/60 pb-2 last:border-0 flex justify-between gap-4">
                          <div>
                            <span className={`font-bold mr-2 ${
                              log.level === 'ERROR' ? 'text-rose-455' : log.level === 'WARN' ? 'text-amber-500' : 'text-slate-500'
                            }`}>
                              [{log.level}]
                            </span>
                            <span className="text-slate-400">{log.message}</span>
                          </div>
                          <span className="text-slate-600 flex-shrink-0">{new Date(log.created_at).toLocaleTimeString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column: Database Backups */}
              <div className="space-y-6">
                
                {/* Manual Trigger Backup */}
                <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-5 space-y-4 text-left">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-2">Manual DB Backup</h3>
                  <p className="text-slate-500 text-[10px] leading-relaxed">
                    Trigger a localized JSON dump containing current system settings, pricing overrides, FAQ documents, and templates.
                  </p>
                  <button
                    type="button"
                    onClick={handleTriggerBackup}
                    disabled={actionLoading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg uppercase tracking-wider disabled:opacity-50 mt-2"
                  >
                    Generate Manual Backup
                  </button>
                </div>

                {/* Backups file listing */}
                <div className="rounded-2xl border border-slate-900 bg-slate-955/10 p-5 space-y-4">
                  <span className="text-[10px] font-bold text-slate-550 uppercase tracking-widest block pb-2 border-b border-slate-900">Restore checkpoints</span>
                  <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1 text-left">
                    {backups.length === 0 ? (
                      <span className="text-slate-550 italic block text-center py-4">No backup files found.</span>
                    ) : (
                      backups.map((b, idx) => (
                        <div key={idx} className="flex justify-between items-center border-b border-slate-900 pb-2.5 last:border-0">
                          <div className="max-w-[70%]">
                            <span className="font-bold text-white block truncate text-xs" title={b.filename}>{b.filename}</span>
                            <span className="text-[10px] text-slate-550 block mt-0.5">
                              Size: {(b.sizeBytes / 1024).toFixed(1)} KB • {new Date(b.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRestoreBackup(b.filename)}
                            disabled={actionLoading}
                            className="bg-emerald-600/10 border border-emerald-500/20 text-emerald-450 hover:bg-emerald-600 hover:text-white px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all disabled:opacity-50"
                          >
                            Restore
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 10: CONTENT CUSTOMIZER */}
          {activeTab === 'content' && (
            <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-6 space-y-5 text-xs animate-fade-in max-w-2xl">
              <div className="border-b border-slate-900 pb-3 flex justify-between items-center">
                <h3 className="text-base font-bold text-white">Custom Landing Copy Settings</h3>
                <button
                  type="button"
                  onClick={handleSaveLandingConfig}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider"
                >
                  Save Configuration
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase block">Hero Title Headline</label>
                  <input
                    type="text"
                    value={landingConfig.heroHeadline}
                    onChange={(e) => setLandingConfig({ ...landingConfig, heroHeadline: e.target.value })}
                    className="w-full rounded border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase block">Supporting Text Subtitle</label>
                  <textarea
                    rows={3}
                    value={landingConfig.heroSubtitle}
                    onChange={(e) => setLandingConfig({ ...landingConfig, heroSubtitle: e.target.value })}
                    className="w-full rounded border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase block">Single Plan Price (INR)</label>
                    <input
                      type="text"
                      value={landingConfig.pricingSingle}
                      onChange={(e) => setLandingConfig({ ...landingConfig, pricingSingle: e.target.value })}
                      className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase block">Bundle Plan Price (INR)</label>
                    <input
                      type="text"
                      value={landingConfig.pricingBundle}
                      onChange={(e) => setLandingConfig({ ...landingConfig, pricingBundle: e.target.value })}
                      className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase block">Trust Clients Indicator</label>
                    <input
                      type="text"
                      value={landingConfig.trustCounterClients}
                      onChange={(e) => setLandingConfig({ ...landingConfig, trustCounterClients: e.target.value })}
                      className="w-full rounded border border-slate-800 bg-slate-955 px-3 py-2 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase block">Vetting Verification Subtitle</label>
                    <input
                      type="text"
                      value={landingConfig.trustCounterVetted}
                      onChange={(e) => setLandingConfig({ ...landingConfig, trustCounterVetted: e.target.value })}
                      className="w-full rounded border border-slate-800 bg-slate-955 px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase block">Legal Notice Disclaimer Footer</label>
                  <textarea
                    rows={2}
                    value={landingConfig.legalNotice}
                    onChange={(e) => setLandingConfig({ ...landingConfig, legalNotice: e.target.value })}
                    className="w-full rounded border border-slate-800 bg-slate-955 px-3.5 py-2.5 text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: DYNAMIC WORKFLOWS */}
          {activeTab === 'workflows' && (
            <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-6 space-y-6 text-xs animate-fade-in">
              <div className="border-b border-slate-900 pb-3 flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h3 className="text-base font-bold text-white">Dynamic Workflow Configuration</h3>
                  <p className="text-[11px] text-slate-500 mt-1">Configure customized questionnaire steps, validation scripts, and custom AI recommendations.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const doc_type = prompt('Enter unique uppercase Doc Type code (e.g. RENTAL_AGREEMENT):');
                      if (doc_type) {
                        const name = prompt('Enter User Friendly Name (e.g. Rent Agreement):');
                        if (name) {
                          const newWf = {
                            doc_type,
                            name,
                            description: 'Custom legal document workflow template.',
                            is_active: true,
                            estimated_pages: 5,
                            reading_time: 8,
                            recommended_docs: [],
                            question_set: [
                              {
                                step: 2,
                                title: "Party Specifications",
                                description: "Identify the contract parties.",
                                fields: [
                                  {
                                    id: "landlordName",
                                    label: "Landlord Legal Name",
                                    type: "text",
                                    required: true
                                  }
                                ]
                              }
                            ],
                            validation_rules: [],
                            ai_suggestions: []
                          };
                          setWorkflows([...workflows, newWf]);
                          setSelectedWorkflow({
                            ...newWf,
                            question_set: JSON.stringify(newWf.question_set, null, 2),
                            validation_rules: JSON.stringify(newWf.validation_rules, null, 2),
                            ai_suggestions: JSON.stringify(newWf.ai_suggestions, null, 2)
                          });
                        }
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 font-bold uppercase text-[10px] text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New Workflow
                  </button>
                  <button
                    type="button"
                    disabled={savingWorkflow}
                    onClick={handleSaveWorkflow}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 font-bold uppercase text-[10px] text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
                  >
                    {savingWorkflow && <Loader2 className="h-3 w-3 animate-spin" />}
                    Save Configuration
                  </button>
                </div>
              </div>

              {workflowSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 rounded-xl font-semibold">
                  {workflowSuccess}
                </div>
              )}
              {workflowError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded-xl font-semibold whitespace-pre-wrap">
                  {workflowError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Workflows side list */}
                <div className="md:col-span-1 space-y-2 border-r border-slate-900 pr-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Available Templates</span>
                  {workflows.map((wf) => (
                    <button
                      key={wf.doc_type}
                      type="button"
                      onClick={() => {
                        setSelectedWorkflow({
                          ...wf,
                          question_set: typeof wf.question_set === 'object' ? JSON.stringify(wf.question_set, null, 2) : wf.question_set,
                          validation_rules: typeof wf.validation_rules === 'object' ? JSON.stringify(wf.validation_rules, null, 2) : wf.validation_rules,
                          ai_suggestions: typeof wf.ai_suggestions === 'object' ? JSON.stringify(wf.ai_suggestions, null, 2) : wf.ai_suggestions
                        });
                        setWorkflowSuccess('');
                        setWorkflowError('');
                      }}
                      className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all ${
                        selectedWorkflow?.doc_type === wf.doc_type
                          ? 'bg-blue-600/10 border-blue-500 text-white'
                          : 'bg-slate-950/30 border-slate-900 text-slate-400 hover:text-white hover:border-slate-800'
                      }`}
                    >
                      <div className="truncate">{wf.name}</div>
                      <div className="text-[9px] text-slate-500 font-mono mt-0.5">{wf.doc_type}</div>
                    </button>
                  ))}
                </div>

                {/* Workflow Edit Form */}
                {selectedWorkflow ? (
                  <div className="md:col-span-3 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block">Workflow Name</label>
                        <input
                          type="text"
                          value={selectedWorkflow.name}
                          onChange={(e) => setSelectedWorkflow({ ...selectedWorkflow, name: e.target.value })}
                          className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block">Doc Type Identifier (Primary Key)</label>
                        <input
                          type="text"
                          readOnly
                          value={selectedWorkflow.doc_type}
                          className="w-full rounded border border-slate-900 bg-slate-900/40 px-3 py-2 text-slate-500 cursor-not-allowed font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase block">Description</label>
                      <input
                        type="text"
                        value={selectedWorkflow.description}
                        onChange={(e) => setSelectedWorkflow({ ...selectedWorkflow, description: e.target.value })}
                        className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block">Estimated Pages</label>
                        <input
                          type="number"
                          value={selectedWorkflow.estimated_pages}
                          onChange={(e) => setSelectedWorkflow({ ...selectedWorkflow, estimated_pages: Number(e.target.value) })}
                          className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block">Reading Time (min)</label>
                        <input
                          type="number"
                          value={selectedWorkflow.reading_time}
                          onChange={(e) => setSelectedWorkflow({ ...selectedWorkflow, reading_time: Number(e.target.value) })}
                          className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block">Workflow Active</label>
                        <select
                          value={selectedWorkflow.is_active ? "true" : "false"}
                          onChange={(e) => setSelectedWorkflow({ ...selectedWorkflow, is_active: e.target.value === "true" })}
                          className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-2.5 text-white"
                        >
                          <option value="true">Active (Visible in Wizard)</option>
                          <option value="false">Inactive (Hidden)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase block">Recommended Documents (Comma Separated)</label>
                      <input
                        type="text"
                        value={Array.isArray(selectedWorkflow.recommended_docs) ? selectedWorkflow.recommended_docs.join(', ') : selectedWorkflow.recommended_docs}
                        onChange={(e) => setSelectedWorkflow({
                          ...selectedWorkflow,
                          recommended_docs: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        })}
                        placeholder="e.g. MUTUAL_NDA, IP_ASSIGNMENT"
                        className="w-full rounded border border-slate-800 bg-slate-955 px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block">Question Set (JSON Config)</label>
                        <button
                          type="button"
                          onClick={() => {
                            const sample = [
                              {
                                "step": 2,
                                "title": "Agreement Details",
                                "description": "Configure agreement parameters",
                                "fields": [
                                  {
                                    "id": "ndaType",
                                    "label": "NDA Type Selection",
                                    "type": "select",
                                    "required": true,
                                    "options": ["mutual", "unilateral"]
                                  }
                                ]
                              }
                            ];
                            setSelectedWorkflow({ ...selectedWorkflow, question_set: JSON.stringify(sample, null, 2) });
                          }}
                          className="text-[9px] text-blue-450 hover:underline"
                        >
                          Insert Sample Set
                        </button>
                      </div>
                      <textarea
                        rows={12}
                        value={selectedWorkflow.question_set}
                        onChange={(e) => setSelectedWorkflow({ ...selectedWorkflow, question_set: e.target.value })}
                        className="w-full rounded border border-slate-800 bg-slate-950 p-3 text-white font-mono leading-relaxed"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-500 font-bold uppercase block">Chronological Validation Rules (JSON Config)</label>
                      <textarea
                        rows={6}
                        value={selectedWorkflow.validation_rules}
                        onChange={(e) => setSelectedWorkflow({ ...selectedWorkflow, validation_rules: e.target.value })}
                        className="w-full rounded border border-slate-800 bg-slate-950 p-3 text-white font-mono leading-relaxed"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-500 font-bold uppercase block">AI Recommendation Triggers (JSON Config)</label>
                      <textarea
                        rows={6}
                        value={selectedWorkflow.ai_suggestions}
                        onChange={(e) => setSelectedWorkflow({ ...selectedWorkflow, ai_suggestions: e.target.value })}
                        className="w-full rounded border border-slate-800 bg-slate-950 p-3 text-white font-mono leading-relaxed"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="md:col-span-3 text-center py-20 text-slate-500 border border-slate-900 rounded-2xl bg-slate-950/10">
                    Select a workflow to edit or create a new template workflow.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
