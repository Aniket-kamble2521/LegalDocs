// components/DashboardConsole.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Coins, 
  LogOut, 
  FileCheck,
  Clock,
  CheckCircle,
  Plus,
  LayoutDashboard,
  Shield,
  Layers,
  Sparkles,
  Settings,
  Calendar,
  ChevronRight,
  Search,
  Filter,
  Trash2,
  Archive,
  Star,
  Pin,
  MessageSquare,
  HelpCircle,
  TrendingUp,
  Clock3,
  Users,
  Grid,
  List,
  AlertTriangle,
  ArrowUpDown,
  Send,
  Loader2,
  ShieldAlert
} from 'lucide-react';
import Link from 'next/link';

type Milestone = {
  description: string;
  dueDate: string;
  amount: string;
};

type DocumentRecord = {
  id: string;
  order_id: string;
  type: string;
  answers: any;
  pdf_url: string | null;
  download_count: number;
  status: string;
  expires_at: any;
  created_at: any;
  esign_request_id: string | null;
  signed_pdf_url: string | null;
  signature_status: string;
  signed_at: any;
  email: string | null;
  view_count: number;
  last_downloaded: any;
  language: string;
  template_version: string;
  client_id: string | null;
};

type UserPreferences = {
  email: string;
  onboarded: boolean;
  user_type: string | null;
  categories: string[];
};

type CompanyProfile = {
  email: string;
  company_name: string;
  gst: string | null;
  pan: string | null;
  address: string;
  state: string;
  country: string;
  representative: string;
  phone: string;
  email_contact: string;
  website: string | null;
};

type DashboardConsoleProps = {
  email: string;
  initialCredits: number;
  initialDocuments: DocumentRecord[];
  preferences: UserPreferences | null;
  profile: CompanyProfile | null;
  announcement?: string | null;
};

export default function DashboardConsole({
  email,
  initialCredits,
  initialDocuments,
  preferences,
  profile,
  announcement
}: DashboardConsoleProps) {
  
  // Console Navigation State
  const [currentConsoleTab, setCurrentConsoleTab] = useState<'workspace' | 'clients'>('workspace');

  // Client Workspace States
  const [clients, setClients] = useState<any[]>([]);
  const [clientsLoading, setClientsLoading] = useState<boolean>(false);
  const [clientsSearchQuery, setClientsSearchQuery] = useState<string>('');
  const [clientsTab, setClientsTab] = useState<'all' | 'favorites' | 'archived'>('all');
  
  // Client Detail View States
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientDetail, setClientDetail] = useState<any | null>(null);
  const [clientDetailLoading, setClientDetailLoading] = useState<boolean>(false);
  const [activeClientDetailTab, setActiveClientDetailTab] = useState<'documents' | 'timeline' | 'activity'>('documents');
  const [showAttachDocSelector, setShowAttachDocSelector] = useState<boolean>(false);
  const [attachDocId, setAttachDocId] = useState<string>('');
  const [attachingDoc, setAttachingDoc] = useState<boolean>(false);

  // Client Creation/Edit Form States
  const [showClientModal, setShowClientModal] = useState<boolean>(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [clientFormName, setClientFormName] = useState<string>('');
  const [clientFormLogo, setClientFormLogo] = useState<string>('');
  const [clientFormContact, setClientFormContact] = useState<string>('');
  const [clientFormEmail, setClientFormEmail] = useState<string>('');
  const [clientFormPhone, setClientFormPhone] = useState<string>('');
  const [clientFormAddress, setClientFormAddress] = useState<string>('');
  const [clientFormGst, setClientFormGst] = useState<string>('');
  const [clientFormNotes, setClientFormNotes] = useState<string>('');
  const [clientFormSubmitting, setClientFormSubmitting] = useState<boolean>(false);

  // Load clients list
  const fetchClientsList = async () => {
    setClientsLoading(true);
    try {
      const archivedParam = clientsTab === 'archived' ? 'true' : 'false';
      const favoriteParam = clientsTab === 'favorites' ? 'true' : 'false';
      const searchParam = encodeURIComponent(clientsSearchQuery);
      
      const res = await fetch(`/api/clients?search=${searchParam}&favorite=${favoriteParam}&archived=${archivedParam}`);
      const data = await res.json();
      if (data.success) {
        setClients(data.clients);
      }
    } catch (e) {
      console.error('Error fetching clients:', e);
    } finally {
      setClientsLoading(false);
    }
  };

  useEffect(() => {
    if (currentConsoleTab === 'clients') {
      fetchClientsList();
    }
  }, [currentConsoleTab, clientsTab, clientsSearchQuery]);

  // Load single client details
  const fetchClientDetails = async (id: string) => {
    setClientDetailLoading(true);
    try {
      const res = await fetch(`/api/clients/${id}`);
      const data = await res.json();
      if (data.success) {
        setClientDetail(data.client);
      }
    } catch (e) {
      console.error('Error fetching client details:', e);
    } finally {
      setClientDetailLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClientId) {
      fetchClientDetails(selectedClientId);
    } else {
      setClientDetail(null);
    }
  }, [selectedClientId]);

  // Handle Client Form Submit (Create or Update)
  const handleClientFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientFormName.trim() || !clientFormContact.trim() || !clientFormEmail.trim() || !clientFormPhone.trim() || !clientFormAddress.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    setClientFormSubmitting(true);
    try {
      const url = editingClientId ? `/api/clients/${editingClientId}` : '/api/clients';
      const method = editingClientId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: clientFormName,
          logo_url: clientFormLogo,
          contact_person: clientFormContact,
          email: clientFormEmail,
          phone: clientFormPhone,
          address: clientFormAddress,
          gst: clientFormGst,
          notes: clientFormNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save client.');
      }

      alert(editingClientId ? 'Client profile updated successfully!' : 'Client Workspace created successfully!');
      
      // Reset form states
      setClientFormName('');
      setClientFormLogo('');
      setClientFormContact('');
      setClientFormEmail('');
      setClientFormPhone('');
      setClientFormAddress('');
      setClientFormGst('');
      setClientFormNotes('');
      setEditingClientId(null);
      setShowClientModal(false);

      // Reload lists
      fetchClientsList();
      if (selectedClientId) {
        fetchClientDetails(selectedClientId);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error occurred while saving client.');
    } finally {
      setClientFormSubmitting(false);
    }
  };

  const handleClientFormLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image file size must be less than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setClientFormLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle favorite status
  const handleToggleClientFavorite = async (client: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_favorite: !client.is_favorite }),
      });
      if (res.ok) {
        fetchClientsList();
        if (selectedClientId === client.id) {
          fetchClientDetails(client.id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle archive status
  const handleToggleClientArchive = async (client: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const actionText = client.is_archived ? 'restore' : 'archive';
    if (!confirm(`Are you sure you want to ${actionText} this client workspace?`)) return;
    
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_archived: !client.is_archived }),
      });
      if (res.ok) {
        fetchClientsList();
        if (selectedClientId === client.id) {
          setSelectedClientId(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete client workspace
  const handleDeleteClient = async (client: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to PERMANENTLY delete the client workspace "${client.company_name}"? Attached agreements will not be deleted, but will become unlinked.`)) return;

    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        alert('Client Workspace deleted successfully.');
        fetchClientsList();
        if (selectedClientId === client.id) {
          setSelectedClientId(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Attach a document to current client
  const handleAttachDocument = async () => {
    if (!selectedClientId || !attachDocId) return;
    setAttachingDoc(true);
    try {
      const res = await fetch(`/api/documents/${attachDocId}/attach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: selectedClientId }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Document linked successfully.');
        setAttachDocId('');
        setShowAttachDocSelector(false);
        fetchClientDetails(selectedClientId);
        fetchClientsList();
        setDocuments(prev => prev.map(d => d.id === attachDocId ? { ...d, client_id: selectedClientId } : d));
      } else {
        alert(data.error || 'Failed to link document.');
      }
    } catch (e) {
      alert('Error occurred while linking document.');
    } finally {
      setAttachingDoc(false);
    }
  };

  // Detach a document from client
  const handleDetachDocument = async (docId: string) => {
    if (!selectedClientId) return;
    if (!confirm('Are you sure you want to unlink this agreement from this client? The agreement itself will not be deleted.')) return;
    
    try {
      const res = await fetch(`/api/documents/${docId}/attach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: null }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Document unlinked successfully.');
        fetchClientDetails(selectedClientId);
        fetchClientsList();
        setDocuments(prev => prev.map(d => d.id === docId ? { ...d, client_id: null } : d));
      }
    } catch (e) {
      alert('Error occurred while unlinking document.');
    }
  };

  // Library States
  const [documents, setDocuments] = useState<DocumentRecord[]>(initialDocuments);
  const [credits, setCredits] = useState<number>(initialCredits);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [libraryTab, setLibraryTab] = useState<'all' | 'favorites' | 'pinned' | 'archived'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'created_at' | 'type'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Favorites, Pinned, Archived lists stored in localStorage
  const [favorites, setFavorites] = useState<string[]>([]);
  const [pinned, setPinned] = useState<string[]>([]);
  const [archived, setArchived] = useState<string[]>([]);

  // Bulk Actions
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  // Feedback & NPS Modal
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [feedbackType, setFeedbackType] = useState<string>('BUG');
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackNps, setFeedbackNps] = useState<number>(10);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState<boolean>(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<boolean>(false);

  // Global Search Modal Command Palette
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [globalQuery, setGlobalQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searching, setSearching] = useState<boolean>(false);

  // Load custom list indices
  useEffect(() => {
    const favs = localStorage.getItem(`ld_favs_${email}`);
    const pins = localStorage.getItem(`ld_pins_${email}`);
    const arcs = localStorage.getItem(`ld_arcs_${email}`);
    if (favs) setFavorites(JSON.parse(favs));
    if (pins) setPinned(JSON.parse(pins));
    if (arcs) setArchived(JSON.parse(arcs));
  }, [email]);

  const saveList = (type: 'favs' | 'pins' | 'arcs', items: string[]) => {
    localStorage.setItem(`ld_${type}_${email}`, JSON.stringify(items));
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = favorites.includes(id) 
      ? favorites.filter(x => x !== id) 
      : [...favorites, id];
    setFavorites(updated);
    saveList('favs', updated);
  };

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = pinned.includes(id) 
      ? pinned.filter(x => x !== id) 
      : [...pinned, id];
    setPinned(updated);
    saveList('pins', updated);
  };

  const handleToggleArchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = archived.includes(id) 
      ? archived.filter(x => x !== id) 
      : [...archived, id];
    setArchived(updated);
    saveList('arcs', updated);
    // Unselect if archived
    setSelectedDocIds(prev => prev.filter(x => x !== id));
  };

  // Fuzzy search filter
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // 1. Library tab filters
      if (libraryTab === 'favorites' && !favorites.includes(doc.id)) return false;
      if (libraryTab === 'pinned' && !pinned.includes(doc.id)) return false;
      if (libraryTab === 'archived' && !archived.includes(doc.id)) return false;
      if (libraryTab !== 'archived' && archived.includes(doc.id)) return false; // Hide archived by default

      // 2. Category filter
      if (categoryFilter !== 'all') {
        if (categoryFilter === 'nda' && !doc.type.startsWith('NDA')) return false;
        if (categoryFilter === 'service' && !doc.type.startsWith('SERVICE')) return false;
      }

      // 3. Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const typeLabel = doc.type.toLowerCase().replace(/_/g, ' ');
        const matchedId = doc.id.toLowerCase().includes(q);
        const matchedType = typeLabel.includes(q);
        return matchedId || matchedType;
      }

      return true;
    }).sort((a, b) => {
      // Pinned items rank first
      const aPinned = pinned.includes(a.id) ? 1 : 0;
      const bPinned = pinned.includes(b.id) ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;

      // Regular sort
      if (sortField === 'created_at') {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      } else {
        return sortOrder === 'desc' 
          ? b.type.localeCompare(a.type) 
          : a.type.localeCompare(b.type);
      }
    });
  }, [documents, searchQuery, libraryTab, categoryFilter, sortField, sortOrder, favorites, pinned, archived]);

  // Bulk operations
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedDocIds(filteredDocuments.map(d => d.id));
    } else {
      setSelectedDocIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedDocIds(prev => [...prev, id]);
    } else {
      setSelectedDocIds(prev => prev.filter(x => x !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocIds.length === 0) return;
    const confirmMsg = `Are you sure you want to permanently delete ${selectedDocIds.length} selected document(s)?`;
    if (!confirm(confirmMsg)) return;

    try {
      // Call deletes sequentially or build a bulk delete API. Let's delete them sequentially using existing API logic
      for (const id of selectedDocIds) {
        await fetch('/api/admin/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', id })
        });
      }
      // Update state
      setDocuments(prev => prev.filter(d => !selectedDocIds.includes(d.id)));
      setSelectedDocIds([]);
      alert('Selected drafts deleted successfully.');
    } catch (e) {
      console.error(e);
      alert('Failed to execute bulk delete.');
    }
  };

  const handleBulkArchive = () => {
    if (selectedDocIds.length === 0) return;
    const updated = Array.from(new Set([...archived, ...selectedDocIds]));
    setArchived(updated);
    saveList('arcs', updated);
    setSelectedDocIds([]);
    alert(`Archived ${selectedDocIds.length} agreement(s).`);
  };

  const handleBulkDownload = () => {
    if (selectedDocIds.length === 0) return;
    // Sequential download
    selectedDocIds.forEach((id) => {
      const doc = documents.find(d => d.id === id);
      if (doc && doc.pdf_url) {
        const link = document.createElement('a');
        link.href = doc.pdf_url;
        link.setAttribute('download', `${doc.type}_${doc.id}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  };

  // Global fuzzy search query fetcher
  useEffect(() => {
    if (!globalQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    const delayDebounce = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(globalQuery)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setSearchResults(data.results);
          }
          setSearching(false);
        })
        .catch(() => setSearching(false));
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [globalQuery]);

  // Submit Feedback NPS
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: feedbackType,
          rating: feedbackRating,
          nps_score: feedbackNps,
          message: feedbackMessage,
        })
      });
      if (res.ok) {
        setFeedbackSuccess(true);
        setFeedbackMessage('');
        setTimeout(() => {
          setFeedbackSuccess(false);
          setShowFeedbackModal(false);
        }, 2000);
      }
    } catch (e) {
      alert('Failed to submit feedback.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // SVG Chart Metrics calculations
  const totalDrafts = documents.length;
  const activeDrafts = documents.filter(d => new Date(d.expires_at) > new Date()).length;
  const expiredDrafts = totalDrafts - activeDrafts;
  const signedDrafts = documents.filter(d => d.signature_status === 'SIGNED').length;
  const completionRate = totalDrafts > 0 ? Math.round((signedDrafts / totalDrafts) * 100) : 100;
  const moneySaved = signedDrafts * 15000 + (totalDrafts - signedDrafts) * 5000; // 15k for signed, 5k for draft
  const timeSaved = totalDrafts * 5; // 5 hours per contract

  // Determine recommendations based on User Preferences
  const userTypeLabel = preferences?.user_type || 'FREELANCER';
  
  const recommendedTemplates = useMemo(() => {
    const list = [];
    if (userTypeLabel === 'FREELANCER') {
      list.push({
        name: 'Freelance / Service Agreement',
        type: 'service_agreement',
        variant: 'STANDARD',
        tag: 'Recommended for Freelancers',
        desc: 'Vette independent contractor scope, payment terms, and intellectual property transfers.',
      });
      list.push({
        name: 'Unilateral NDA',
        type: 'nda',
        variant: 'unilateral',
        tag: 'Protect Your IP',
        desc: 'One-way NDA to prevent clients from disclosing your proprietary methods.',
      });
    } else if (userTypeLabel === 'STARTUP') {
      list.push({
        name: 'Mutual NDA',
        type: 'nda',
        variant: 'mutual',
        tag: 'Co-Founder & Vendor Vetting',
        desc: 'Two-way confidentiality protocol designed for co-founder and vendor alignment meetings.',
      });
      list.push({
        name: 'Freelance / Service Agreement',
        type: 'service_agreement',
        variant: 'STANDARD',
        tag: 'Outsource Work Safely',
        desc: 'Onboard external freelancers with clear terms, retaining 100% intellectual property ownership.',
      });
    } else if (userTypeLabel === 'BUSINESS') {
      list.push({
        name: 'Mutual Non-Disclosure Agreement',
        type: 'nda',
        variant: 'mutual',
        tag: 'Corporate Partnerships',
        desc: 'Corporate-grade mutual NDA protecting dual disclosures during joint ventures.',
      });
      list.push({
        name: 'Freelance / Service Agreement',
        type: 'service_agreement',
        variant: 'STANDARD',
        tag: 'Operations Scope Contract',
        desc: 'Establish master service schedules and milestone triggers with contractors.',
      });
    } else {
      list.push({
        name: 'Unilateral Non-Disclosure Agreement',
        type: 'nda',
        variant: 'unilateral',
        tag: 'Standard Confidentiality',
        desc: 'Standard non-disclosure protocol suitable for individual hires and consultations.',
      });
    }
    return list;
  }, [userTypeLabel]);

  // Compute activity calendar data (heatmap)
  // We represent 52 weeks. Let's make a grid of 7 rows (days) and 53 columns (weeks).
  // We can count how many documents were created on each day of the last year.
  const activityHeatMap = useMemo(() => {
    const map: Record<string, number> = {};
    documents.forEach((d) => {
      const dateStr = new Date(d.created_at).toISOString().split('T')[0];
      map[dateStr] = (map[dateStr] || 0) + 1;
    });
    return map;
  }, [documents]);

  const heatmapGrid = useMemo(() => {
    const cells = [];
    const today = new Date();
    // Go back 364 days to start on the same day of the week
    const startDate = new Date();
    startDate.setDate(today.getDate() - 364);
    
    for (let i = 0; i < 365; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      const count = activityHeatMap[dateStr] || 0;
      cells.push({ date: dateStr, count });
    }
    return cells;
  }, [activityHeatMap]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow flex flex-col gap-8 text-left relative">
      
      {/* TOP ANNOUNCEMENT BANNER */}
      {announcement && (
        <div className="rounded-xl bg-blue-600/10 border border-blue-500/20 px-4 py-3 flex items-center gap-3 text-xs text-blue-400">
          <Sparkles className="h-4 w-4 text-blue-500 animate-pulse flex-shrink-0" />
          <span className="font-semibold">{announcement}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
        
        {/* SIDEBAR */}
        <aside className="w-full lg:w-64 flex flex-col gap-4 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-4 backdrop-blur-md text-left space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Active Profile</span>
            <span className="text-xs font-bold text-white block truncate">{profile?.company_name || email}</span>
            <span className="text-[10px] font-mono text-slate-500 block truncate">{email}</span>
            {profile?.gst && (
              <span className="inline-flex rounded bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 text-[8px] font-bold text-blue-400 uppercase tracking-wider mt-2">
                GST: {profile.gst}
              </span>
            )}
          </div>

          <nav className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1.5 border-b lg:border-b-0 pb-3 lg:pb-0 border-slate-900 w-full">
            <button
              onClick={() => { setCurrentConsoleTab('workspace'); setSelectedClientId(null); }}
              className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                currentConsoleTab === 'workspace'
                  ? 'bg-blue-600/10 border-blue-500/15 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/30'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Workspace</span>
            </button>

            <button
              onClick={() => { setCurrentConsoleTab('clients'); setSelectedClientId(null); }}
              className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                currentConsoleTab === 'clients'
                  ? 'bg-blue-600/10 border-blue-500/15 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/30'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Clients</span>
            </button>

            <Link
              href="/wizard"
              className="flex items-center gap-2.5 rounded-xl border border-transparent px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-slate-900/30 transition-all whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>Create Document</span>
            </Link>

            <Link
              href="/help"
              className="flex items-center gap-2.5 rounded-xl border border-transparent px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-slate-900/30 transition-all whitespace-nowrap"
            >
              <HelpCircle className="h-4 w-4" />
              <span>Help Center</span>
            </Link>

            <Link
              href="/admin"
              className="flex items-center gap-2.5 rounded-xl border border-transparent px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-slate-900/30 transition-all whitespace-nowrap"
            >
              <Settings className="h-4 w-4" />
              <span>Admin Panel</span>
            </Link>

            <button
              onClick={() => setShowSearchModal(true)}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-2.5 text-xs text-slate-500 hover:text-slate-300 hover:border-slate-700 transition-all whitespace-nowrap"
            >
              <span className="flex items-center gap-2.5">
                <Search className="h-4 w-4" />
                <span>Search Console</span>
              </span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded border border-slate-800 bg-slate-900 text-[9px] font-mono font-bold">⌘K</kbd>
            </button>

            <a
              href="/api/auth/logout"
              className="flex items-center gap-2.5 rounded-xl border border-transparent px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-rose-450 hover:bg-slate-900/30 transition-all lg:mt-6 whitespace-nowrap"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </a>
          </nav>
        </aside>

        {/* MAIN COLUMN */}
        <main className="flex-grow w-full space-y-8 text-left">
          
          {currentConsoleTab === 'workspace' ? (
            <>
              {/* WELCOME CARD */}
          <div className="rounded-3xl border border-slate-900 bg-slate-900/10 p-6 md:p-8 backdrop-blur-md relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                <Calendar className="h-3.5 w-3.5" />
                <span>Active Operating Console</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight sm:text-3xl">
                Welcome back, {profile?.representative || 'User'}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Review operational diagnostics, auto-fill active document wizards, and verify signature workflow completions.
              </p>
            </div>
            
            <Link
              href="/wizard"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-blue-500 transition-colors transform hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Generate Document
            </Link>
          </div>

          {/* METRICS ROW */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Credits Balance */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-5 backdrop-blur-md flex flex-col justify-between group">
              <div>
                <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Credits Remaining</span>
                <span className="text-xl font-bold text-white mt-1 block">{credits} document(s)</span>
              </div>
              <Link 
                href="/wizard"
                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 mt-3 inline-flex items-center gap-0.5 hover:underline"
              >
                Top up credits
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Total Compiled */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-5 backdrop-blur-md">
              <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Total Agreements</span>
              <span className="text-xl font-bold text-white mt-1 block">{totalDrafts} generated</span>
              <span className="text-[9px] text-slate-400 mt-2 block">{signedDrafts} fully executed</span>
            </div>

            {/* Money Saved */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-5 backdrop-blur-md">
              <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Money Saved (Est.)</span>
              <span className="text-xl font-bold text-emerald-450 mt-1 block">₹{moneySaved.toLocaleString()}</span>
              <span className="text-[9px] text-slate-400 mt-2 block">vs traditional attorney fees</span>
            </div>

            {/* Time Saved */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-5 backdrop-blur-md">
              <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Time Saved</span>
              <span className="text-xl font-bold text-blue-400 mt-1 block">{timeSaved} hours</span>
              <span className="text-[9px] text-slate-400 mt-2 block">@ 5hr/contract average</span>
            </div>
          </div>

          {/* INSIGHTS & CHARTS PANEL */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* SVG Chart 1: Monthly Summary Bar Chart */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/10 p-5 backdrop-blur-md flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-slate-500" />
                  Monthly Summary
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Distribution of compiled legal files</p>
              </div>
              <div className="py-6 flex items-end justify-between h-32 px-2 border-b border-slate-900">
                {/* Visual SVG representation */}
                {[
                  { m: 'Jan', val: Math.min(totalDrafts, 1) },
                  { m: 'Feb', val: Math.min(totalDrafts, 2) },
                  { m: 'Mar', val: Math.min(totalDrafts, 3) },
                  { m: 'Apr', val: Math.max(totalDrafts - 3, 0) },
                  { m: 'May', val: Math.max(totalDrafts - 1, 0) },
                  { m: 'Jun', val: Math.max(totalDrafts, 2) },
                  { m: 'Jul', val: totalDrafts }
                ].map((item, idx) => {
                  const maxVal = Math.max(...[1, 2, 3, 4, 5, totalDrafts]);
                  const percent = maxVal > 0 ? (item.val / maxVal) * 80 : 5;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 w-full group">
                      <div className="text-[9px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity font-bold">{item.val}</div>
                      <div 
                        style={{ height: `${percent}px` }}
                        className="w-4 rounded-t bg-gradient-to-t from-blue-600 to-blue-400 group-hover:from-blue-500 group-hover:to-blue-300 transition-all cursor-pointer"
                      />
                      <div className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">{item.m}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SVG Chart 2: Completion Rate Donut Circle */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/10 p-5 backdrop-blur-md flex flex-col justify-between items-center text-center">
              <div className="w-full text-left">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck className="h-4 w-4 text-slate-500" />
                  Signature Completion
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Ratio of fully executed contracts</p>
              </div>
              
              <div className="relative py-4 flex items-center justify-center">
                {/* SVG Ring */}
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle cx="48" cy="48" r="38" stroke="#1e293b" strokeWidth="6" fill="transparent" />
                  <circle 
                    cx="48" 
                    cy="48" 
                    r="38" 
                    stroke="#2563eb" 
                    strokeWidth="6" 
                    fill="transparent" 
                    strokeDasharray={2 * Math.PI * 38}
                    strokeDashoffset={2 * Math.PI * 38 * (1 - completionRate / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute font-bold text-white text-base">{completionRate}%</div>
              </div>

              <div className="flex gap-4 text-[10px] text-slate-400">
                <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> {signedDrafts} Signed</div>
                <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-slate-800" /> {totalDrafts - signedDrafts} Drafts</div>
              </div>
            </div>

            {/* Heatmap Widget */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/10 p-5 backdrop-blur-md flex flex-col justify-between col-span-1">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  Activity History
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Document compilation frequency grid</p>
              </div>
              
              {/* GitHub style grid representation */}
              <div className="grid grid-cols-12 gap-1.5 py-4 max-h-[90px] overflow-hidden">
                {Array.from({ length: 48 }).map((_, idx) => {
                  // Mock count based on docs
                  const dateIndex = heatmapGrid[heatmapGrid.length - 48 + idx];
                  const hasActivity = dateIndex && dateIndex.count > 0;
                  return (
                    <div 
                      key={idx}
                      title={dateIndex ? `${dateIndex.date}: ${dateIndex.count} draft(s)` : ''}
                      className={`aspect-square w-full rounded-sm transition-all hover:scale-110 ${
                        hasActivity 
                          ? 'bg-blue-600 shadow-md shadow-blue-500/20 border border-blue-500' 
                          : 'bg-slate-900 border border-slate-850'
                      }`}
                    />
                  );
                })}
              </div>

              <div className="flex justify-between items-center text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                <span>Less</span>
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-sm bg-slate-900" />
                  <span className="h-2 w-2 rounded-sm bg-blue-900" />
                  <span className="h-2 w-2 rounded-sm bg-blue-600" />
                </div>
                <span>More</span>
              </div>
            </div>

          </div>

          {/* RECOMMENDED FOR YOU SECTION */}
          <div className="space-y-4 border-t border-slate-900 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-500" />
                Recommended for You
              </h3>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                Sector: {userTypeLabel}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recommendedTemplates.map((t, idx) => (
                <div 
                  key={idx}
                  className="rounded-2xl border border-slate-900 bg-slate-900/5 p-5 flex flex-col justify-between hover:border-slate-800 transition-all group"
                >
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10 inline-block">
                      {t.tag}
                    </span>
                    <h4 className="font-bold text-white text-sm leading-normal">{t.name}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{t.desc}</p>
                  </div>

                  <Link 
                    href={`/wizard?type=${t.type}&variant=${t.variant}`}
                    className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors inline-flex items-center gap-1 mt-4"
                  >
                    Launch wizard
                    <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* DRAFT LIBRARY */}
          <div className="space-y-4 border-t border-slate-900 pt-6">
            
            {/* Library Control Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="h-4 w-4 text-slate-500" />
                  Smart Agreement Library
                </h3>
              </div>

              {/* View / Tab toggle */}
              <div className="flex gap-1 items-center bg-slate-950 border border-slate-900 rounded-xl p-1 text-[10px] font-bold uppercase tracking-wider">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'favorites', label: 'Favorites' },
                  { id: 'pinned', label: 'Pinned' },
                  { id: 'archived', label: 'Archived' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setLibraryTab(tab.id as any); setSelectedDocIds([]); }}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      libraryTab === tab.id 
                        ? 'bg-blue-600 text-white shadow' 
                        : 'text-slate-550 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter and Search parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-6 relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-650" />
                <input
                  type="text"
                  placeholder="Search agreements library (ID, Type)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-880 bg-slate-950/60 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-700 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-880 bg-slate-950/60 px-3 py-2 text-xs text-slate-400 focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="nda">Non-Disclosure (NDA)</option>
                  <option value="service">Freelance Service</option>
                </select>
              </div>

              <div className="sm:col-span-3 flex gap-1">
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-880 bg-slate-950/60 px-3 py-2 text-xs text-slate-400 focus:border-blue-500 focus:outline-none"
                >
                  <option value="created_at">Sort by Date</option>
                  <option value="type">Sort by Type</option>
                </select>
                <button
                  type="button"
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="rounded-xl border border-slate-880 bg-slate-950/60 p-2.5 text-slate-400 hover:text-white"
                >
                  <ArrowUpDown className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode(prev => prev === 'list' ? 'grid' : 'list')}
                  className="rounded-xl border border-slate-880 bg-slate-950/60 p-2.5 text-slate-400 hover:text-white hidden sm:block"
                >
                  {viewMode === 'list' ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedDocIds.length > 0 && (
              <div className="rounded-xl bg-blue-600/10 border border-blue-500/20 px-4 py-3 flex flex-wrap justify-between items-center gap-3 animate-fade-in">
                <span className="text-xs font-semibold text-blue-400">
                  {selectedDocIds.length} item(s) selected
                </span>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleBulkDownload}
                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </button>
                  <button
                    onClick={handleBulkArchive}
                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    Archive
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-400 hover:text-rose-300 bg-rose-950/10 border border-rose-950/30 px-3 py-1.5 rounded-lg"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            )}

            {/* Document display list/grid */}
            {filteredDocuments.length === 0 ? (
              <div className="rounded-2xl border border-slate-900 bg-slate-900/5 p-12 text-center">
                <div className="inline-flex bg-slate-900 border border-slate-850 p-4 rounded-full text-slate-500 mb-3">
                  <FileText className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-white text-sm">No Matching Agreements</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-normal">
                  Try adjusting your search criteria, filters, or choose another library folder.
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              /* Grid Layout */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredDocuments.map((doc) => {
                  const isExpired = new Date() > new Date(doc.expires_at);
                  const isFav = favorites.includes(doc.id);
                  const isPin = pinned.includes(doc.id);
                  const isArc = archived.includes(doc.id);
                  
                  let docTypeBadge = doc.type;
                  if (doc.type === 'NDA_MUTUAL') docTypeBadge = 'Mutual NDA';
                  else if (doc.type === 'NDA_UNILATERAL') docTypeBadge = 'Unilateral NDA';
                  else if (doc.type.startsWith('SERVICE')) docTypeBadge = 'Service Agreement';

                  return (
                    <div 
                      key={doc.id}
                      className={`rounded-2xl border p-5 bg-slate-900/5 hover:border-slate-800 transition-all flex flex-col justify-between relative group ${
                        isPin ? 'border-blue-500/20 bg-blue-500/5' : 'border-slate-900'
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedDocIds.includes(doc.id)}
                              onChange={(e) => handleSelectOne(doc.id, e.target.checked)}
                              className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0 h-3.5 w-3.5"
                            />
                            <h4 className="font-bold text-white text-sm">{docTypeBadge}</h4>
                          </div>

                          <div className="flex gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => handleTogglePin(doc.id, e)} className={`${isPin ? 'text-blue-400' : 'text-slate-550 hover:text-white'}`}>
                              <Pin className="h-3.5 w-3.5 fill-current" />
                            </button>
                            <button onClick={(e) => handleToggleFavorite(doc.id, e)} className={`${isFav ? 'text-amber-450' : 'text-slate-550 hover:text-white'}`}>
                              <Star className="h-3.5 w-3.5 fill-current" />
                            </button>
                            <button onClick={(e) => handleToggleArchive(doc.id, e)} className={`${isArc ? 'text-indigo-400' : 'text-slate-550 hover:text-white'}`}>
                              <Archive className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] font-mono text-slate-550 block">{doc.id}</span>
                          <span className="text-[10px] text-slate-500 block mt-1">Compiled: {new Date(doc.created_at).toLocaleDateString()}</span>
                        </div>

                        <div className="flex gap-2">
                          {isExpired ? (
                            <span className="inline-flex rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-400">
                              Expired
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                              Active
                            </span>
                          )}

                          {doc.signature_status === 'SIGNED' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                              Signed
                            </span>
                          )}
                          {doc.signature_status === 'SENT_FOR_SIGNATURE' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-500">
                              Pending E-Sign
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-slate-900 pt-3 mt-4 flex gap-4 text-xs font-bold text-blue-400">
                        {doc.pdf_url && (
                          <a href={doc.pdf_url} download className="hover:underline flex items-center gap-1">
                            <Download className="h-3.5 w-3.5" />
                            PDF Draft
                          </a>
                        )}
                        {doc.signed_pdf_url && (
                          <a href={doc.signed_pdf_url} download className="hover:underline flex items-center gap-1 text-emerald-400">
                            <Download className="h-3.5 w-3.5" />
                            Signed
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* List Table Layout */
              <div className="rounded-2xl border border-slate-900 bg-slate-900/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-900 text-left text-xs text-slate-350">
                    <thead className="bg-slate-950/40 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-6 py-4 w-10">
                          <input
                            type="checkbox"
                            checked={selectedDocIds.length > 0 && selectedDocIds.length === filteredDocuments.length}
                            onChange={handleSelectAll}
                            className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0 h-3.5 w-3.5"
                          />
                        </th>
                        <th className="px-6 py-4">Document Details</th>
                        <th className="px-6 py-4">Filing Status</th>
                        <th className="px-6 py-4">e-Sign State</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 bg-slate-900/5">
                      {filteredDocuments.map((doc) => {
                        const isExpired = new Date() > new Date(doc.expires_at);
                        const isFav = favorites.includes(doc.id);
                        const isPin = pinned.includes(doc.id);
                        const isArc = archived.includes(doc.id);

                        let docTypeBadge = doc.type;
                        if (doc.type === 'NDA_MUTUAL') docTypeBadge = 'Mutual NDA';
                        else if (doc.type === 'NDA_UNILATERAL') docTypeBadge = 'Unilateral NDA';
                        else if (doc.type.startsWith('SERVICE')) docTypeBadge = 'Service Agreement';

                        return (
                          <tr key={doc.id} className={`hover:bg-slate-900/20 transition-colors group ${isPin ? 'bg-blue-500/5' : ''}`}>
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={selectedDocIds.includes(doc.id)}
                                onChange={(e) => handleSelectOne(doc.id, e.target.checked)}
                                className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0 h-3.5 w-3.5"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">{docTypeBadge}</span>
                                {isPin && (
                                  <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-blue-400 uppercase bg-blue-500/10 px-1 rounded border border-blue-500/20">
                                    Pinned
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2 text-[10px] text-slate-550 mt-1 font-mono">
                                <span>{doc.id}</span>
                                <span>•</span>
                                <span>Compiled {new Date(doc.created_at).toLocaleDateString()}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {isExpired ? (
                                <span className="inline-flex rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-400">
                                  Expired
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                                  <CheckCircle className="h-3 w-3" />
                                  Active
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {doc.signature_status === 'SIGNED' && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                                  Signed
                                </span>
                              )}
                              {doc.signature_status === 'SENT_FOR_SIGNATURE' && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-500">
                                  Pending Signatures
                                </span>
                              )}
                              {doc.signature_status === 'NONE' && <span className="text-slate-600">-</span>}
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap space-x-3">
                              
                              {/* Inline Controls */}
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex gap-2.5 mr-3">
                                <button onClick={(e) => handleTogglePin(doc.id, e)} className={`${isPin ? 'text-blue-400' : 'text-slate-550 hover:text-white'}`}>
                                  <Pin className="h-3.5 w-3.5 fill-current" />
                                </button>
                                <button onClick={(e) => handleToggleFavorite(doc.id, e)} className={`${isFav ? 'text-amber-400' : 'text-slate-550 hover:text-white'}`}>
                                  <Star className="h-3.5 w-3.5 fill-current" />
                                </button>
                                <button onClick={(e) => handleToggleArchive(doc.id, e)} className={`${isArc ? 'text-indigo-400' : 'text-slate-550 hover:text-white'}`}>
                                  <Archive className="h-3.5 w-3.5" />
                                </button>
                              </span>

                              {doc.pdf_url && (
                                <a href={doc.pdf_url} download className="text-blue-400 hover:text-blue-300 font-bold hover:underline">
                                  Draft PDF
                                </a>
                              )}
                              {doc.signed_pdf_url && (
                                <a href={doc.signed_pdf_url} download className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline ml-3">
                                  Signed PDF
                                </a>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

          {/* COLLABORATION & TEAMS PANEL (DISABLED TEASER) */}
          <div className="space-y-4 border-t border-slate-900 pt-6 opacity-60">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-500" />
                Team Accounts & Collaboration
              </h3>
              <span className="rounded bg-blue-500/10 border border-blue-500/25 px-2 py-0.5 text-[8px] font-bold text-blue-400 uppercase tracking-widest">
                Enterprise Beta
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-normal max-w-xl">
              Organize multiple members, assign custom roles (Admin, Editor, Legal Auditor), configure approval workflow gates, and share billing credits across your team.
            </p>

            {/* MOCKED TEAM TABLE */}
            <div className="rounded-xl border border-slate-900 bg-slate-950/20 overflow-hidden">
              <table className="min-w-full text-left text-[10px] text-slate-500">
                <thead className="bg-slate-950/50 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-4 py-3">Member Email</th>
                    <th className="px-4 py-3">Assigned Role</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-3 text-white font-semibold">{email}</td>
                    <td className="px-4 py-3">Organization Owner</td>
                    <td className="px-4 py-3"><span className="text-emerald-450">Active</span></td>
                  </tr>
                  <tr className="border-t border-slate-900/60">
                    <td className="px-4 py-3">auditor@acmetech.co</td>
                    <td className="px-4 py-3">Legal Approver</td>
                    <td className="px-4 py-3"><span className="text-slate-600">Upgrade Required</span></td>
                  </tr>
                  <tr className="border-t border-slate-900/60">
                    <td className="px-4 py-3">hr@acmetech.co</td>
                    <td className="px-4 py-3">HR Specialist</td>
                    <td className="px-4 py-3"><span className="text-slate-600">Upgrade Required</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-1">
              <button 
                disabled
                className="rounded-xl bg-slate-900 border border-slate-800 text-slate-400 px-4 py-2 text-[10px] font-bold uppercase tracking-wider cursor-not-allowed"
              >
                Configure Team Approvals
              </button>
            </div>
          </div>
          </>
          ) : (
            /* CLIENTS WORKSPACE TAB */
            <div className="space-y-8 animate-fade-in">
              {/* Clients Welcome / Header */}
              <div className="rounded-3xl border border-slate-900 bg-slate-900/10 p-6 md:p-8 backdrop-blur-md relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold">
                    <Users className="h-3.5 w-3.5" />
                    <span>Client Workspaces Manager</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight sm:text-3xl">
                    Client & Company Workspace
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Organize generated agreements, track upcoming document renewals, audit logs, and manage client profiles for quick automated Q&A auto-fills.
                  </p>
                </div>
                
                <button
                  onClick={() => {
                    setEditingClientId(null);
                    setClientFormName('');
                    setClientFormLogo('');
                    setClientFormContact('');
                    setClientFormEmail('');
                    setClientFormPhone('');
                    setClientFormAddress('');
                    setClientFormGst('');
                    setClientFormNotes('');
                    setShowClientModal(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-blue-500 transition-colors transform hover:scale-105 active:scale-95 whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  Create Client
                </button>
              </div>

              {selectedClientId ? (
                /* CLIENT DETAIL PANEL */
                clientDetailLoading ? (
                  <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-12 text-center flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    <span className="text-xs text-slate-500">Loading client workspace dossier...</span>
                  </div>
                ) : clientDetail ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* LEFT PANEL: PROFILE CARD */}
                    <div className="lg:col-span-4 space-y-4">
                      {/* Back Button */}
                      <button
                        onClick={() => setSelectedClientId(null)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-wider transition-colors"
                      >
                        ← Back to Clients List
                      </button>

                      <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5 space-y-6">
                        <div className="flex flex-col items-center text-center space-y-3">
                          {clientDetail.logo_url ? (
                            <img
                              src={clientDetail.logo_url}
                              alt={clientDetail.company_name}
                              className="h-20 w-20 rounded-2xl object-contain bg-slate-950 border border-slate-900 p-2"
                            />
                          ) : (
                            <div className="h-20 w-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                              <Users className="h-10 w-10" />
                            </div>
                          )}
                          <div>
                            <h3 className="text-lg font-bold text-white leading-normal">{clientDetail.company_name}</h3>
                            <span className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider mt-0.5">
                              GSTIN: {clientDetail.gst || 'Not Configured'}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={(e) => handleToggleClientFavorite(clientDetail, e)}
                              className={`rounded-lg border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                                clientDetail.is_favorite
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                              }`}
                            >
                              <Star className={`h-3.5 w-3.5 ${clientDetail.is_favorite ? 'fill-current' : ''}`} />
                              {clientDetail.is_favorite ? 'Starred' : 'Star'}
                            </button>
                            <button
                              onClick={(e) => handleToggleClientArchive(clientDetail, e)}
                              className={`rounded-lg border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                                clientDetail.is_archived
                                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                              }`}
                            >
                              <Archive className="h-3.5 w-3.5" />
                              {clientDetail.is_archived ? 'Archived' : 'Archive'}
                            </button>
                          </div>
                        </div>

                        {/* Profile Info Fields */}
                        <div className="border-t border-slate-900 pt-5 space-y-4 text-xs">
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-slate-550 block uppercase tracking-wider">Contact Person</span>
                            <span className="font-semibold text-slate-300">{clientDetail.contact_person}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-slate-550 block uppercase tracking-wider">Email Address</span>
                            <span className="font-semibold text-slate-300 block truncate">{clientDetail.email}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-slate-550 block uppercase tracking-wider">Phone Number</span>
                            <span className="font-semibold text-slate-300">{clientDetail.phone}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-slate-550 block uppercase tracking-wider">Corporate Address</span>
                            <span className="text-slate-400 leading-normal block whitespace-pre-wrap">{clientDetail.address}</span>
                          </div>
                          {clientDetail.notes && (
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-bold text-slate-550 block uppercase tracking-wider">Internal Workspace Notes</span>
                              <span className="text-slate-400 leading-normal block whitespace-pre-wrap italic">{clientDetail.notes}</span>
                            </div>
                          )}
                        </div>

                        {/* Profile Actions */}
                        <div className="border-t border-slate-900 pt-5 flex gap-2">
                          <button
                            onClick={() => {
                              setEditingClientId(clientDetail.id);
                              setClientFormName(clientDetail.company_name);
                              setClientFormLogo(clientDetail.logo_url || '');
                              setClientFormContact(clientDetail.contact_person);
                              setClientFormEmail(clientDetail.email);
                              setClientFormPhone(clientDetail.phone);
                              setClientFormAddress(clientDetail.address);
                              setClientFormGst(clientDetail.gst || '');
                              setClientFormNotes(clientDetail.notes || '');
                              setShowClientModal(true);
                            }}
                            className="flex-grow rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-colors"
                          >
                            Edit Profile
                          </button>
                          <button
                            onClick={(e) => handleDeleteClient(clientDetail, e)}
                            className="rounded-xl bg-rose-955/10 border border-rose-950/20 hover:border-rose-900 px-3 py-2.5 text-center text-rose-450 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT PANEL: DOSSIER TABS */}
                    <div className="lg:col-span-8 space-y-6">
                      
                      {/* Dossier Quick Stats Cards */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-xl border border-slate-900 bg-slate-900/30 p-4">
                          <span className="text-[9px] text-slate-550 block uppercase font-bold tracking-wider">Agreements Attached</span>
                          <span className="text-lg font-bold text-white mt-1 block">{clientDetail.documents?.length || 0}</span>
                        </div>
                        <div className="rounded-xl border border-slate-900 bg-slate-900/30 p-4">
                          <span className="text-[9px] text-slate-550 block uppercase font-bold tracking-wider">Upcoming Renewals</span>
                          <span className="text-lg font-bold text-indigo-400 mt-1 block">
                            {(() => {
                              const now = new Date();
                              let count = 0;
                              clientDetail.documents?.forEach((doc: any) => {
                                if (doc.type.startsWith('NDA')) {
                                  const term = parseInt(doc.answers?.confidentialityTerm);
                                  const eff = doc.answers?.effectiveDate;
                                  if (eff && !isNaN(term)) {
                                    const renewal = new Date(new Date(eff).setMonth(new Date(eff).getMonth() + term));
                                    if (renewal > now) count++;
                                  }
                                }
                              });
                              return count;
                            })()}
                          </span>
                        </div>
                        <div className="rounded-xl border border-slate-900 bg-slate-900/30 p-4">
                          <span className="text-[9px] text-slate-550 block uppercase font-bold tracking-wider">Last Activity</span>
                          <span className="text-[11px] font-semibold text-slate-300 mt-2 block truncate">
                            {clientDetail.activities?.[0] 
                              ? new Date(clientDetail.activities[0].created_at).toLocaleDateString()
                              : 'No activity logged'}
                          </span>
                        </div>
                      </div>

                      {/* Tab toggles */}
                      <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                        <div className="flex gap-2">
                          {[
                            { id: 'documents', label: 'Documents' },
                            { id: 'timeline', label: 'Milestone Timeline' },
                            { id: 'activity', label: 'Activity Logs' },
                          ].map(t => (
                            <button
                              key={t.id}
                              onClick={() => setActiveClientDetailTab(t.id as any)}
                              className={`text-xs font-bold uppercase tracking-wider pb-2 border-b-2 px-1 transition-all ${
                                activeClientDetailTab === t.id
                                  ? 'border-blue-500 text-white'
                                  : 'border-transparent text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>

                        {activeClientDetailTab === 'documents' && (
                          <button
                            onClick={() => setShowAttachDocSelector(!showAttachDocSelector)}
                            className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-400 hover:text-blue-305 uppercase tracking-wider"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Link Agreement
                          </button>
                        )}
                      </div>

                      {/* Tab Contents: 1. DOCUMENTS */}
                      {activeClientDetailTab === 'documents' && (
                        <div className="space-y-4">
                          
                          {/* Attach Doc Selector dropdown */}
                          {showAttachDocSelector && (
                            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex flex-col sm:flex-row gap-3 items-end animate-fade-in text-left">
                              <div className="flex-grow space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Select Unlinked Agreement</label>
                                <select
                                  value={attachDocId}
                                  onChange={(e) => setAttachDocId(e.target.value)}
                                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-400 focus:border-blue-500 focus:outline-none"
                                >
                                  <option value="">-- Select Agreement --</option>
                                  {documents.filter(d => !d.client_id).map(d => (
                                    <option key={d.id} value={d.id}>
                                      {d.type.replace(/_/g, ' ')} ({d.id.substring(0, 8)}) - {new Date(d.created_at).toLocaleDateString()}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setShowAttachDocSelector(false)}
                                  className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-450 hover:text-white"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={attachingDoc || !attachDocId}
                                  onClick={handleAttachDocument}
                                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50 flex items-center gap-1"
                                >
                                  {attachingDoc && <Loader2 className="h-3 w-3 animate-spin" />}
                                  Attach
                                </button>
                              </div>
                            </div>
                          )}

                          {(!clientDetail.documents || clientDetail.documents.length === 0) ? (
                            <div className="rounded-2xl border border-slate-900 bg-slate-900/5 p-12 text-center">
                              <div className="inline-flex bg-slate-900 border border-slate-850 p-4 rounded-full text-slate-500 mb-3">
                                <FileText className="h-6 w-6" />
                              </div>
                              <h4 className="font-bold text-white text-sm">No Agreements Linked</h4>
                              <p className="text-xs text-slate-555 mt-1 max-w-xs mx-auto leading-normal">
                                Attach existing generated documents, or launch the questionnaire wizard to create and link new legal drafts.
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {clientDetail.documents.map((doc: any) => {
                                const isExpired = new Date() > new Date(doc.expires_at);
                                let docTypeBadge = doc.type;
                                if (doc.type === 'NDA_MUTUAL') docTypeBadge = 'Mutual NDA';
                                else if (doc.type === 'NDA_UNILATERAL') docTypeBadge = 'Unilateral NDA';
                                else if (doc.type.startsWith('SERVICE')) docTypeBadge = 'Service Agreement';

                                return (
                                  <div key={doc.id} className="rounded-xl border border-slate-900 bg-slate-950/20 p-5 flex flex-col justify-between group relative">
                                    <div className="space-y-3">
                                      <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-white text-xs">{docTypeBadge}</h4>
                                        
                                        <button
                                          onClick={() => handleDetachDocument(doc.id)}
                                          title="Unlink from Client"
                                          className="text-slate-550 hover:text-rose-455 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                      <div>
                                        <span className="text-[9px] font-mono text-slate-550 block">{doc.id}</span>
                                        <span className="text-[9px] text-slate-500 block mt-0.5">
                                          Compiled: {new Date(doc.created_at).toLocaleDateString()}
                                        </span>
                                      </div>

                                      <div className="flex gap-2">
                                        {isExpired ? (
                                          <span className="inline-flex rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-rose-450">
                                            Expired
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-400">
                                            Active
                                          </span>
                                        )}

                                        {doc.signature_status === 'SIGNED' ? (
                                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-400">
                                            Signed
                                          </span>
                                        ) : doc.signature_status === 'SENT_FOR_SIGNATURE' ? (
                                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-amber-505">
                                            Pending Sign
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>

                                    <div className="border-t border-slate-900 pt-3 mt-4 flex gap-4 text-[10px] font-bold text-blue-400">
                                      {doc.pdf_url && (
                                        <a href={doc.pdf_url} download className="hover:underline flex items-center gap-0.5">
                                          <Download className="h-3 w-3" />
                                          Draft
                                        </a>
                                      )}
                                      {doc.signed_pdf_url && (
                                        <a href={doc.signed_pdf_url} download className="hover:underline flex items-center gap-0.5 text-emerald-450 font-bold">
                                          <Download className="h-3 w-3" />
                                          Signed
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tab Contents: 2. TIMELINE */}
                      {activeClientDetailTab === 'timeline' && (
                        <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-5 text-left">
                          {(() => {
                            const timelineEvents = [];
                            
                            // A. Creation
                            timelineEvents.push({
                              date: new Date(clientDetail.created_at),
                              title: 'Workspace Initialized',
                              desc: `Client profile registered for ${clientDetail.company_name}.`,
                              type: 'creation'
                            });

                            // B. Document Actions
                            clientDetail.documents?.forEach((doc: any) => {
                              const effStr = doc.answers?.effectiveDate;
                              const titleLabel = doc.type.replace(/_/g, ' ');
                              
                              timelineEvents.push({
                                date: new Date(doc.created_at),
                                title: `Agreement Compiled: ${titleLabel}`,
                                desc: `Document ID: ${doc.id.substring(0, 8)}... created in system.`,
                                type: 'milestone'
                              });

                              if (doc.signature_status === 'SIGNED' && doc.signed_at) {
                                timelineEvents.push({
                                  date: new Date(doc.signed_at),
                                  title: `E-Sign Executed: ${titleLabel}`,
                                  desc: `All parties completed digital signatures.`,
                                  type: 'esign'
                                });
                              }

                              // Renewal Expiration
                              if (doc.type.startsWith('NDA')) {
                                const term = parseInt(doc.answers?.confidentialityTerm);
                                if (effStr && !isNaN(term)) {
                                  const eff = new Date(effStr);
                                  const renewal = new Date(eff.setMonth(eff.getMonth() + term));
                                  timelineEvents.push({
                                    date: renewal,
                                    title: `Upcoming Renewal: ${titleLabel}`,
                                    desc: `NDA confidentiality obligation term (${term} months) expires.`,
                                    type: 'renewal'
                                  });
                                }
                              }

                              // Milestones for Service Agreement
                              if (doc.type.startsWith('SERVICE') && doc.answers?.milestones) {
                                doc.answers.milestones.forEach((m: any) => {
                                  if (m.dueDate && m.description) {
                                    timelineEvents.push({
                                      date: new Date(m.dueDate),
                                      title: `Milestone: ${m.description}`,
                                      desc: `Milestone payment of ₹${m.amount} due for release.`,
                                      type: 'milestone'
                                    });
                                  }
                                });
                              }

                            });

                            // C. Client Profile Logs
                            clientDetail.activities?.forEach((act: any) => {
                              if (act.action !== 'CREATED' && !act.action.includes('DOC')) {
                                timelineEvents.push({
                                  date: new Date(act.created_at),
                                  title: act.action.replace(/_/g, ' '),
                                  desc: act.details,
                                  type: 'milestone'
                                });
                              }
                            });

                            const sortedEvents = timelineEvents.sort((a, b) => b.date.getTime() - a.date.getTime());

                            if (sortedEvents.length === 0) {
                              return <p className="text-xs text-slate-500">No milestones logged.</p>;
                            }

                            return (
                              <div className="relative border-l border-slate-900 pl-6 space-y-6">
                                {sortedEvents.map((evt, idx) => {
                                  const isFuture = evt.date > new Date();
                                  
                                  return (
                                    <div key={idx} className="relative">
                                      <span className={`absolute -left-[30px] top-1 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                                        evt.type === 'creation' 
                                          ? 'bg-blue-600/20 border-blue-500 text-blue-400' 
                                          : evt.type === 'esign' 
                                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-450' 
                                          : evt.type === 'renewal' 
                                          ? (isFuture ? 'bg-amber-600/20 border-amber-500 text-amber-500 animate-pulse' : 'bg-rose-600/20 border-rose-500 text-rose-500') 
                                          : 'bg-slate-900 border-slate-800 text-slate-400'
                                      }`}>
                                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                      </span>

                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap text-left">
                                          <h4 className="font-bold text-white text-xs leading-normal">{evt.title}</h4>
                                          <span className="text-[9px] font-mono text-slate-550">
                                            {evt.date.toLocaleDateString()} {isFuture && '(Upcoming)'}
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-450 leading-relaxed text-left">{evt.desc}</p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Tab Contents: 3. ACTIVITY LOG */}
                      {activeClientDetailTab === 'activity' && (
                        <div className="rounded-2xl border border-slate-900 bg-slate-950/20 overflow-hidden">
                          <div className="p-4 border-b border-slate-900 text-left">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Client Workspace History Logs</span>
                          </div>
                          
                          {(!clientDetail.activities || clientDetail.activities.length === 0) ? (
                            <div className="p-6 text-center text-slate-550 text-xs">No activity logs recorded.</div>
                          ) : (
                            <div className="divide-y divide-slate-900 max-h-[400px] overflow-y-auto">
                              {clientDetail.activities.map((act: any) => (
                                <div key={act.id} className="p-4 text-xs flex justify-between gap-4 items-start hover:bg-slate-950/40 text-left">
                                  <div className="space-y-1">
                                    <span className="font-bold text-slate-355 block text-xs">{act.action.replace(/_/g, ' ')}</span>
                                    <p className="text-slate-450 leading-normal text-[11px]">{act.details}</p>
                                  </div>
                                  <span className="text-[9px] font-mono text-slate-550 whitespace-nowrap mt-0.5">
                                    {new Date(act.created_at).toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                    </div>

                  </div>
                ) : (
                  <p className="text-xs text-rose-450">Error loading client dossier.</p>
                )
              ) : (
                /* CLIENTS LIST VIEW */
                <div className="space-y-6 text-left">
                  
                  {/* Filter and Search controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-8 relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-655" />
                      <input
                        type="text"
                        placeholder="Search Client Workspaces (Company, Contact, Email)..."
                        value={clientsSearchQuery}
                        onChange={(e) => setClientsSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-slate-880 bg-slate-950/60 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-700 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    
                    <div className="sm:col-span-4 flex gap-1 bg-slate-950 border border-slate-900 rounded-xl p-1 text-[10px] font-bold uppercase tracking-wider w-full justify-between">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'favorites', label: 'Starred' },
                        { id: 'archived', label: 'Archived' }
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => { setClientsTab(t.id as any); }}
                          className={`px-3 py-1.5 rounded-lg transition-all flex-1 text-center whitespace-nowrap ${
                            clientsTab === t.id 
                              ? 'bg-blue-600 text-white shadow' 
                              : 'text-slate-550 hover:text-white'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {clientsLoading ? (
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/5 p-12 text-center flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                      <span className="text-xs text-slate-500">Retrieving client directories...</span>
                    </div>
                  ) : clients.length === 0 ? (
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/5 p-12 text-center">
                      <div className="inline-flex bg-slate-900 border border-slate-850 p-4 rounded-full text-indigo-400 mb-3">
                        <Users className="h-6 w-6" />
                      </div>
                      <h4 className="font-bold text-white text-sm">No Client Workspaces Found</h4>
                      <p className="text-xs text-slate-555 mt-1 max-w-xs mx-auto leading-normal">
                        Create a client profile to start organizing your legal documents, tracking milestones, and auto-filling template forms.
                      </p>
                    </div>
                  ) : (
                    /* Clients Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {clients.map((client) => (
                        <div
                          key={client.id}
                          onClick={() => setSelectedClientId(client.id)}
                          className="rounded-2xl border border-slate-900 bg-slate-900/5 hover:border-slate-800 transition-all p-5 flex flex-col justify-between relative group cursor-pointer hover:bg-slate-900/10"
                        >
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              {client.logo_url ? (
                                <img
                                  src={client.logo_url}
                                  alt={client.company_name}
                                  className="h-10 w-10 rounded-xl object-contain bg-slate-950 p-1 border border-slate-900"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                                  <Users className="h-5 w-5" />
                                </div>
                              )}

                              <div className="flex gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => handleToggleClientFavorite(client, e)}
                                  className={`${client.is_favorite ? 'text-amber-450' : 'text-slate-550 hover:text-white'}`}
                                >
                                  <Star className={`h-3.5 w-3.5 ${client.is_favorite ? 'fill-current' : ''}`} />
                                </button>
                                <button
                                  onClick={(e) => handleToggleClientArchive(client, e)}
                                  className={`${client.is_archived ? 'text-indigo-400' : 'text-slate-550 hover:text-white'}`}
                                >
                                  <Archive className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <h4 className="font-bold text-white text-sm block truncate leading-normal">{client.company_name}</h4>
                              <span className="text-[10px] text-slate-500 block truncate">{client.contact_person} • {client.email}</span>
                            </div>

                            {/* Brief Stats */}
                            <div className="grid grid-cols-2 gap-2 border-t border-slate-900 pt-3 text-[10px]">
                              <div>
                                <span className="text-[8px] font-bold text-slate-555 uppercase block tracking-wider">Agreements</span>
                                <span className="font-bold text-white mt-0.5 block">{client.documents?.length || 0} active</span>
                              </div>
                              <div>
                                <span className="text-[8px] font-bold text-slate-555 uppercase block tracking-wider">Renewals</span>
                                <span className="font-bold text-indigo-455 mt-0.5 block">
                                  {(() => {
                                    const now = new Date();
                                    let count = 0;
                                    client.documents?.forEach((doc: any) => {
                                      if (doc.type.startsWith('NDA')) {
                                        const term = parseInt(doc.answers?.confidentialityTerm);
                                        const eff = doc.answers?.effectiveDate;
                                        if (eff && !isNaN(term)) {
                                          const renewal = new Date(new Date(eff).setMonth(new Date(eff).getMonth() + term));
                                          if (renewal > now) count++;
                                        }
                                      }
                                    });
                                    return count;
                                  })()}
                                </span>
                              </div>
                            </div>

                          </div>

                          <div className="border-t border-slate-900 pt-3 mt-4 flex justify-between items-center text-[10px] font-bold text-blue-450">
                            <span>Open Dossier →</span>
                            <span className="text-slate-550 font-normal">
                              {client.documents?.[0] 
                                ? `Last: ${new Date(client.documents[0].created_at).toLocaleDateString()}` 
                                : 'No documents'}
                            </span>
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

      {/* FLOAT SHARE FEEDBACK BUTTON */}
      <button
        type="button"
        onClick={() => setShowFeedbackModal(true)}
        className="fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-500 px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-xl shadow-blue-500/20 hover:scale-105 transition-all z-40"
      >
        <MessageSquare className="h-4 w-4" />
        Feedback & NPS
      </button>

      {/* SEARCH COMMAND PALETTE MODAL */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-900 bg-slate-900 p-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <div className="flex items-center gap-2 text-slate-400">
                <Search className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-semibold uppercase tracking-wider">Fuzzy Search Console</span>
              </div>
              <button onClick={() => { setShowSearchModal(false); setGlobalQuery(''); setSearchResults(null); }} className="text-slate-500 hover:text-white text-xs uppercase font-bold">Close</button>
            </div>

            <input
              type="text"
              autoFocus
              placeholder="Search documents, templates, guides, blogs..."
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 mt-3 px-4 py-2.5 text-xs text-white placeholder-slate-700 focus:border-blue-500 focus:outline-none"
            />

            {searching && (
              <div className="py-8 flex justify-center items-center gap-2 text-slate-500 text-xs">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" /> Searching database records...
              </div>
            )}

            {searchResults && (
              <div className="mt-4 max-h-[300px] overflow-y-auto space-y-4 pr-1 text-xs">
                {/* Documents results */}
                {searchResults.documents?.length > 0 && (
                  <div className="space-y-1.5 text-left">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Agreements ({searchResults.documents.length})</span>
                    {searchResults.documents.map((d: any) => (
                      <Link 
                        key={d.id} 
                        href={`/dashboard#repository`}
                        onClick={() => { setShowSearchModal(false); setGlobalQuery(''); }}
                        className="block rounded-lg p-2.5 bg-slate-950 hover:bg-slate-950/80 border border-slate-900"
                      >
                        <span className="font-semibold text-white block text-xs">{d.type.replace(/_/g, ' ')}</span>
                        <span className="text-[9px] font-mono text-slate-500 mt-0.5 block">{d.id}</span>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Templates results */}
                {searchResults.templates?.length > 0 && (
                  <div className="space-y-1.5 text-left">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Templates ({searchResults.templates.length})</span>
                    {searchResults.templates.map((t: any) => (
                      <Link 
                        key={t.id} 
                        href={`/wizard`}
                        onClick={() => { setShowSearchModal(false); setGlobalQuery(''); }}
                        className="block rounded-lg p-2.5 bg-slate-950 hover:bg-slate-950/80 border border-slate-900"
                      >
                        <span className="font-semibold text-white block text-xs">{t.name}</span>
                        <span className="text-[9px] text-blue-400 mt-0.5 block">Variant: {t.variant} • Type: {t.type}</span>
                      </Link>
                    ))}
                  </div>
                )}

                {/* FAQs & Guides results */}
                {searchResults.faqs?.length > 0 && (
                  <div className="space-y-1.5 text-left">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">FAQ Knowledge base ({searchResults.faqs.length})</span>
                    {searchResults.faqs.map((f: any) => (
                      <Link 
                        key={f.id} 
                        href={`/help`}
                        onClick={() => { setShowSearchModal(false); setGlobalQuery(''); }}
                        className="block rounded-lg p-2.5 bg-slate-950 hover:bg-slate-950/80 border border-slate-900"
                      >
                        <span className="font-semibold text-white block text-xs">{f.title}</span>
                        <span className="text-[9px] text-indigo-400 mt-0.5 block">Category: {f.category}</span>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Blog Posts results */}
                {searchResults.blogs?.length > 0 && (
                  <div className="space-y-1.5 text-left">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Blogs ({searchResults.blogs.length})</span>
                    {searchResults.blogs.map((b: any) => (
                      <Link 
                        key={b.id} 
                        href={`/help`}
                        onClick={() => { setShowSearchModal(false); setGlobalQuery(''); }}
                        className="block rounded-lg p-2.5 bg-slate-950 hover:bg-slate-950/80 border border-slate-900"
                      >
                        <span className="font-semibold text-white block text-xs">{b.title}</span>
                        <span className="text-[9px] text-slate-500 mt-0.5 block leading-relaxed">{b.summary}</span>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Users results */}
                {searchResults.users?.length > 0 && (
                  <div className="space-y-1.5 text-left">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">User Directory ({searchResults.users.length})</span>
                    {searchResults.users.map((u: any) => (
                      <div 
                        key={u.email}
                        className="rounded-lg p-2.5 bg-slate-950 border border-slate-900"
                      >
                        <span className="font-semibold text-white block text-xs">{u.company_name || u.email}</span>
                        <span className="text-[9px] text-slate-450 mt-0.5 block">Email: {u.email} • Type: {u.user_type || 'Unspecified'}</span>
                      </div>
                    ))}
                  </div>
                )}

                {Object.values(searchResults).every((x: any) => x.length === 0) && (
                  <div className="py-8 text-center text-slate-500">
                    No results found for "{globalQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FEEDBACK & NPS SURVEY SLIDE-UP MODAL */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end justify-center animate-fade-in p-4 sm:p-6">
          <div className="w-full max-w-md rounded-2xl border border-slate-900 bg-slate-900 p-6 shadow-2xl space-y-6 relative text-left">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                LegalDocs Feedback Desk
              </h3>
              <button 
                onClick={() => { setShowFeedbackModal(false); setFeedbackSuccess(false); }}
                className="text-slate-500 hover:text-white text-xs font-bold uppercase"
              >
                Cancel
              </button>
            </div>

            {feedbackSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="inline-flex rounded-full bg-emerald-500/10 border border-emerald-500/25 p-3.5 text-emerald-450">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <h4 className="font-bold text-white text-sm">Thank You for Your Feedback!</h4>
                <p className="text-xs text-slate-400 leading-normal max-w-xs mx-auto">
                  Your metrics and ratings have been dispatched to our engineering operations console.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                
                {/* Type Selection */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Feedback Category</label>
                  <select
                    value={feedbackType}
                    onChange={(e) => setFeedbackType(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="BUG">🐛 Bug Report</option>
                    <option value="FEATURE_REQUEST">💡 Feature Request</option>
                    <option value="NPS">⭐ Net Promoter Score Survey</option>
                    <option value="GENERAL">💬 General Question</option>
                  </select>
                </div>

                {/* star Rating */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Overall Platform Rating ({feedbackRating} Stars)</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setFeedbackRating(star)}
                        className={`text-xl ${feedbackRating >= star ? 'text-amber-400' : 'text-slate-650'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* NPS Survey Slider */}
                {feedbackType === 'NPS' && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Recommend Likelihood (NPS Score)</label>
                      <span className="text-xs font-bold text-blue-400">{feedbackNps} / 10</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={feedbackNps}
                      onChange={(e) => setFeedbackNps(Number(e.target.value))}
                      className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                      <span>Not Likely</span>
                      <span>Extremely Likely</span>
                    </div>
                  </div>
                )}

                {/* Feedback Message */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Feedback Details *</label>
                  <textarea
                    rows={3}
                    placeholder="Provide details of your request or description of encounter..."
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={feedbackSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-505 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all disabled:opacity-50"
                >
                  {feedbackSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting Feedback...
                    </>
                  ) : (
                    <>
                      Submit Feedback
                      <Send className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>

              </form>
            )}
          </div>
        </div>
      )}
      {/* Create / Edit Client Modal */}
      {showClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl relative my-8 text-left">
            <h3 className="text-lg font-bold text-white mb-1">
              {editingClientId ? 'Edit Client Workspace' : 'Create Client Workspace'}
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Fill in client or company details below. This workspace registers agreements, timeline milestones, and logs client events.
            </p>

            <form onSubmit={handleClientFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase block">Company/Client Name *</label>
                  <input
                    type="text"
                    required
                    value={clientFormName}
                    onChange={(e) => setClientFormName(e.target.value)}
                    placeholder="e.g. Acme Corporation"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase block">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={clientFormContact}
                    onChange={(e) => setClientFormContact(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-555 font-bold uppercase block">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={clientFormEmail}
                    onChange={(e) => setClientFormEmail(e.target.value)}
                    placeholder="e.g. john@acme.com"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-555 font-bold uppercase block">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={clientFormPhone}
                    onChange={(e) => setClientFormPhone(e.target.value)}
                    placeholder="e.g. +91 99999 99999"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-555 font-bold uppercase block">GSTIN (Optional)</label>
                  <input
                    type="text"
                    value={clientFormGst}
                    onChange={(e) => setClientFormGst(e.target.value)}
                    placeholder="e.g. 27AAAAA1111A1Z1"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-555 font-bold uppercase block">Company Logo (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleClientFormLogoChange}
                    className="w-full text-xs text-slate-550 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-blue-600/10 file:text-blue-400 file:cursor-pointer hover:file:bg-blue-600/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-555 font-bold uppercase block">Billing / Registered Address *</label>
                <textarea
                  required
                  rows={2}
                  value={clientFormAddress}
                  onChange={(e) => setClientFormAddress(e.target.value)}
                  placeholder="Enter full legal address"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-555 font-bold uppercase block">Additional Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={clientFormNotes}
                  onChange={(e) => setClientFormNotes(e.target.value)}
                  placeholder="Sector, company info, contract preferences, etc."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setShowClientModal(false)}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-355 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={clientFormSubmitting}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {clientFormSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
                  {editingClientId ? 'Update Workspace' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
