// app/wizard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Download, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  ShieldAlert, 
  HelpCircle,
  Plus,
  Trash2,
  PenTool,
  UserCheck,
  RefreshCw,
  FileSignature,
  Check,
  Sparkles,
  Layers
} from 'lucide-react';
import { getFieldHelpText } from '@/lib/helpText';

type Milestone = {
  description: string;
  dueDate: string;
  amount: string;
};

type WizardAnswers = {
  docType: string; // 'nda' | 'service_agreement'
  ndaType: string;
  disclosingParty: string;
  disclosingPartyAddress: string;
  receivingParty: string;
  receivingPartyAddress: string;
  purpose: string;
  confidentialityTerm: string;
  governingJurisdiction: string;
  effectiveDate: string;
  
  // Service Agreement Specific
  clientName: string;
  clientAddress: string;
  freelancerName: string;
  freelancerAddress: string;
  scopeOfWork: string;
  paymentAmount: string;
  paymentSchedule: string; // 'one-time' | 'milestone' | 'recurring'
  milestones: Milestone[];
  terminationNoticePeriod: string;
};

const INITIAL_ANSWERS: WizardAnswers = {
  docType: '', // Empty initially to force selection
  ndaType: 'mutual',
  disclosingParty: '',
  disclosingPartyAddress: '',
  receivingParty: '',
  receivingPartyAddress: '',
  purpose: '',
  confidentialityTerm: '24',
  governingJurisdiction: 'Maharashtra',
  effectiveDate: '',
  
  clientName: '',
  clientAddress: '',
  freelancerName: '',
  freelancerAddress: '',
  scopeOfWork: '',
  paymentAmount: '',
  paymentSchedule: 'one-time',
  milestones: [],
  terminationNoticePeriod: '30',
};

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
  'Uttarakhand', 'West Bengal', 'Delhi'
];

export default function WizardPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<WizardAnswers>(INITIAL_ANSWERS);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>('');
  
  // Checkout & Payment State
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [consistencyErrors, setConsistencyErrors] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string>('');

  // Bundle Credits & Checkout Config
  const [userEmail, setUserEmail] = useState<string>('');
  const [userCredits, setUserCredits] = useState<number>(0);
  const [checkoutMode, setCheckoutMode] = useState<'single' | 'bundle'>('single');

  // E-signature States
  const [documentId, setDocumentId] = useState<string>('');
  const [esignInitiated, setEsignInitiated] = useState<boolean>(false);
  const [esignSigningUrls, setEsignSigningUrls] = useState<Record<string, string> | null>(null);
  const [esignLoading, setEsignLoading] = useState<boolean>(false);
  const [esignError, setEsignError] = useState<string>('');
  const [esignStatus, setEsignStatus] = useState<string>('NONE');

  // Document Workspace UI States
  const [docMetadata, setDocMetadata] = useState<any>(null);
  const [pdfZoom, setPdfZoom] = useState<number>(100);
  const [pdfLoaded, setPdfLoaded] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const [signerAName, setSignerAName] = useState('');
  const [signerAEmail, setSignerAEmail] = useState('');
  const [signerBName, setSignerBName] = useState('');
  const [signerBEmail, setSignerBEmail] = useState('');

  // Active help text display state
  const [activeHelpField, setActiveHelpField] = useState<string | null>(null);

  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [userPrefs, setUserPrefs] = useState<any>(null);

  // AI assistant subtab state
  const [aiSidebarTab, setAiSidebarTab] = useState<'explainer' | 'sanity' | 'summary' | 'compare'>('explainer');

  // Clients Workspace Integration
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // Configuration-driven dynamic workflows
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [auditLoading, setAuditLoading] = useState<boolean>(false);

  // Fetch active workflows
  useEffect(() => {
    fetch('/api/workflows')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.workflows) {
          setWorkflows(data.workflows);
        }
      })
      .catch(err => console.error('Error fetching workflows:', err));
  }, []);

  // Update selectedWorkflow when docType is selected or loaded
  useEffect(() => {
    if (answers.docType && workflows.length > 0) {
      const found = workflows.find(w => w.doc_type === answers.docType);
      if (found) {
        setSelectedWorkflow(found);
      }
    }
  }, [answers.docType, workflows]);

  // Run dynamic pre-generation audits
  useEffect(() => {
    if (selectedWorkflow && currentStep === 6 && !documentUrl) {
      setAuditLoading(true);
      fetch('/api/workflows/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType: selectedWorkflow.doc_type,
          answers
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setAuditResult(data);
          }
        })
        .catch(err => console.error('Error auditing answers:', err))
        .finally(() => setAuditLoading(false));
    }
  }, [answers, currentStep, selectedWorkflow, documentUrl]);
  
  // Inline Client Creation States
  const [showCreateClientModal, setShowCreateClientModal] = useState<boolean>(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientLogo, setNewClientLogo] = useState('');
  const [newClientContact, setNewClientContact] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [newClientGst, setNewClientGst] = useState('');
  const [newClientNotes, setNewClientNotes] = useState('');
  const [clientSubmitting, setClientSubmitting] = useState(false);

  // Authenticate user & check onboarding status
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
            setUserPrefs(data);
            // Fetch credits
            fetch(`/api/credits/check?email=${encodeURIComponent(data.email)}`)
              .then((res) => res.json())
              .then((credData) => {
                if (credData.success) {
                  setUserCredits(credData.credits);
                }
              })
              .catch(() => {});

            // Fetch company profile
            fetch('/api/company-profile')
              .then((res) => res.json())
              .then((profData) => {
                if (profData.success && profData.profile) {
                  setCompanyProfile(profData.profile);
                }
              })
              .catch(() => {});

            // Fetch clients workspace list
            fetch('/api/clients')
              .then((res) => res.json())
              .then((clientData) => {
                if (clientData.success && clientData.clients) {
                  setClients(clientData.clients);
                  
                  // Suggest last client
                  const lastCid = localStorage.getItem('ld_last_client_id');
                  if (lastCid) {
                    const found = clientData.clients.find((c: any) => c.id === lastCid);
                    if (found) {
                      setSelectedClientId(lastCid);
                    }
                  }
                }
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  const handleAutofillProfile = (role?: 'disclosing' | 'client' | 'freelancer') => {
    if (!companyProfile) {
      alert('No company profile found. Please configure it in Onboarding or Settings.');
      return;
    }
    
    if (answers.docType === 'nda') {
      setAnswers(prev => ({
        ...prev,
        disclosingParty: companyProfile.company_name,
        disclosingPartyAddress: companyProfile.address
      }));
    } else if (answers.docType === 'service_agreement') {
      if (role === 'freelancer') {
        setAnswers(prev => ({
          ...prev,
          freelancerName: companyProfile.company_name,
          freelancerAddress: companyProfile.address
        }));
      } else if (role === 'client') {
        setAnswers(prev => ({
          ...prev,
          clientName: companyProfile.company_name,
          clientAddress: companyProfile.address
        }));
      } else {
        const isFreelancerType = userPrefs?.user_type === 'FREELANCER';
        if (isFreelancerType) {
          setAnswers(prev => ({
            ...prev,
            freelancerName: companyProfile.company_name,
            freelancerAddress: companyProfile.address
          }));
        } else {
          setAnswers(prev => ({
            ...prev,
            clientName: companyProfile.company_name,
            clientAddress: companyProfile.address
          }));
        }
      }
    }
    alert('Company profile details loaded successfully!');
  };

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('legaldocs_answers');
    if (saved) {
      try {
        setAnswers(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading answers from local storage', e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('legaldocs_answers', JSON.stringify(answers));
  }, [answers]);

  // Setup Signer Defaults
  useEffect(() => {
    if (documentUrl) {
      setSignerAName(answers.docType === 'nda' ? answers.disclosingParty : answers.clientName);
      setSignerBName(answers.docType === 'nda' ? answers.receivingParty : answers.freelancerName);
    }
  }, [documentUrl, answers]);

  const handleInputChange = (field: keyof WizardAnswers, value: any) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
    setApiError('');
    setConsistencyErrors([]);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all answers?')) {
      setAnswers(INITIAL_ANSWERS);
      localStorage.removeItem('legaldocs_answers');
      setCurrentStep(1);
      setOrderInfo(null);
      setPaymentSuccess(false);
      setDocumentUrl('');
      setConsistencyErrors([]);
      setApiError('');
      setDocumentId('');
      setEsignInitiated(false);
      setEsignSigningUrls(null);
      setEsignStatus('NONE');
    }
  };

  const handleDeleteDraft = () => {
    setAnswers(INITIAL_ANSWERS);
    localStorage.removeItem('legaldocs_answers');
    setCurrentStep(1);
    setOrderInfo(null);
    setPaymentSuccess(false);
    setDocumentUrl('');
    setConsistencyErrors([]);
    setApiError('');
    setDocumentId('');
    setEsignInitiated(false);
    setEsignSigningUrls(null);
    setEsignStatus('NONE');
    setDocMetadata(null);
    setShowDeleteConfirm(false);
  };

  const validateStep = (step: number): boolean => {
    if (selectedWorkflow) {
      if (step === 1) return !!answers.docType;
      const stepConfig = selectedWorkflow.question_set.find((s: any) => s.step === step);
      if (!stepConfig) return true;

      for (const field of stepConfig.fields) {
        let conditionMet = true;
        if (field.conditionalOn) {
          const val = (answers as any)[field.conditionalOn];
          conditionMet = String(val).toLowerCase() === String(field.conditionValue).toLowerCase();
        }

        if (conditionMet && field.required) {
          const val = (answers as any)[field.id];
          if (val === undefined || val === null || String(val).trim() === '') {
            return false;
          }
        }
      }
      return true;
    }

    if (step === 1) {
      return !!answers.docType;
    }

    if (answers.docType === 'nda') {
      if (step === 2) {
        return !!answers.ndaType;
      }
      if (step === 3) {
        if (!answers.disclosingParty.trim() || !answers.disclosingPartyAddress.trim()) return false;
        if (!answers.receivingParty.trim() || !answers.receivingPartyAddress.trim()) return false;
        return true;
      }
      if (step === 4) {
        return answers.purpose.trim().length >= 5;
      }
      if (step === 5) {
        if (!answers.effectiveDate) return false;
        const term = Number(answers.confidentialityTerm);
        if (isNaN(term) || term <= 0) return false;
        if (!answers.governingJurisdiction) return false;
        return true;
      }
      return true;
    } else if (answers.docType === 'service_agreement') {
      if (step === 2) {
        if (!answers.clientName.trim() || !answers.clientAddress.trim()) return false;
        if (!answers.freelancerName.trim() || !answers.freelancerAddress.trim()) return false;
        return true;
      }
      if (step === 3) {
        return answers.scopeOfWork.trim().length >= 5;
      }
      if (step === 4) {
        const totalAmount = Number(answers.paymentAmount);
        if (isNaN(totalAmount) || totalAmount <= 0) return false;
        if (answers.paymentSchedule === 'milestone') {
          const milestones = answers.milestones || [];
          if (milestones.length === 0) return false;
          let sum = 0;
          for (const m of milestones) {
            const amt = Number(m.amount);
            if (!m.description.trim() || isNaN(amt) || amt <= 0 || !m.dueDate) return false;
            sum += amt;
          }
          if (Math.abs(sum - totalAmount) > 0.01) return false;
        }
        return true;
      }
      if (step === 5) {
        if (!answers.effectiveDate) return false;
        const notice = Number(answers.terminationNoticePeriod);
        if (isNaN(notice) || notice < 0) return false;
        if (!answers.governingJurisdiction) return false;
        return true;
      }
      return true;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 6));
    } else {
      alert('Please fill in all required fields correctly before proceeding.');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const checkCredits = async (email: string) => {
    if (!email || !email.includes('@')) {
      setUserCredits(0);
      return;
    }
    try {
      const response = await fetch(`/api/credits/check?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setUserCredits(data.credits);
      } else {
        setUserCredits(0);
      }
    } catch (e) {
      setUserCredits(0);
    }
  };

  const handleGenerateWithCredit = async () => {
    if (!userEmail) {
      setApiError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setLoadingText('Deducting credit & generating PDF...');
    setApiError('');
    setConsistencyErrors([]);

    try {
      const generateRes = await fetch('/api/documents/generate-with-credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          answers,
          clientId: selectedClientId || undefined,
        }),
      });

      const generateData = await generateRes.json();
      
      if (generateRes.ok && selectedClientId) {
        localStorage.setItem('ld_last_client_id', selectedClientId);
      }
      
      if (!generateRes.ok) {
        if (generateData.details && Array.isArray(generateData.details)) {
          setConsistencyErrors(generateData.details);
          throw new Error(generateData.error || 'Consistency checks failed.');
        }
        throw new Error(generateData.error || 'Failed to generate PDF document.');
      }

      setDocumentUrl(generateData.downloadUrl);
      setDocumentId(generateData.documentId);
      localStorage.removeItem('legaldocs_answers');
      setUserCredits(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || 'Error occurred during generation processing.');
    } finally {
      setLoading(false);
    }
  };

  // Payment checkout initiator
  const handleCheckout = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userEmail || !emailRegex.test(userEmail)) {
      setApiError('Please enter a valid email address for delivery confirmation.');
      return;
    }
    setLoading(true);
    setLoadingText('Registering order...');
    setApiError('');
    setConsistencyErrors([]);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: checkoutMode === 'bundle' ? 'BUNDLE' : 'SINGLE',
          email: userEmail,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to create payment order.');
      }

      setOrderInfo(data);

      triggerRazorpayCheckout(data);
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || 'Error occurred during checkout initialization.');
      setLoading(false);
    }
  };

  // Real Razorpay script handler
  const triggerRazorpayCheckout = (orderData: any) => {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
    if (!keyId) {
      setApiError('Frontend NEXT_PUBLIC_RAZORPAY_KEY_ID is missing.');
      setLoading(false);
      return;
    }

    const options = {
      key: keyId,
      amount: orderData.amount,
      currency: 'INR',
      name: 'LegalDocs',
      description: checkoutMode === 'bundle'
        ? '3-Document Credit Bundle'
        : (answers.docType === 'nda'
          ? `NDA Template Assembly - ${answers.ndaType.toUpperCase()} variant`
          : `Service Agreement Template Assembly`),
      order_id: orderData.razorpayOrderId,
      handler: async (response: any) => {
        await verifyAndGenerate(
          orderData.orderId,
          orderData.razorpayOrderId,
          response.razorpay_payment_id,
          response.razorpay_signature
        );
      },
      prefill: {
        name: answers.docType === 'nda' ? answers.disclosingParty : answers.clientName,
      },
      theme: {
        color: '#2563eb',
      },
      modal: {
        ondismiss: () => {
          setLoading(false);
        }
      }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  // Handle client logo upload convert to Base64
  const handleClientLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image file size must be less than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewClientLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Create Client Workspace Inline from Wizard
  const handleCreateClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newClientContact.trim() || !newClientEmail.trim() || !newClientPhone.trim() || !newClientAddress.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    setClientSubmitting(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: newClientName,
          logo_url: newClientLogo,
          contact_person: newClientContact,
          email: newClientEmail,
          phone: newClientPhone,
          address: newClientAddress,
          gst: newClientGst,
          notes: newClientNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create client.');
      }

      const client = data.client;
      // Update clients list & set selected client
      setClients(prev => [client, ...prev]);
      setSelectedClientId(client.id);

      // Autofill party details based on docType
      if (answers.docType === 'nda') {
        setAnswers(prev => ({
          ...prev,
          receivingParty: client.company_name,
          receivingPartyAddress: client.address,
        }));
      } else if (answers.docType === 'service_agreement') {
        setAnswers(prev => ({
          ...prev,
          clientName: client.company_name,
          clientAddress: client.address,
        }));
      }

      // Reset form states and close modal
      setNewClientName('');
      setNewClientLogo('');
      setNewClientContact('');
      setNewClientEmail('');
      setNewClientPhone('');
      setNewClientAddress('');
      setNewClientGst('');
      setNewClientNotes('');
      setShowCreateClientModal(false);
      alert('Client Workspace Profile created and linked successfully!');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error occurred while creating client.');
    } finally {
      setClientSubmitting(false);
    }
  };



  // Step 2: Verification and Generation
  const verifyAndGenerate = async (
    orderId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ) => {
    setLoadingText('Verifying payment signature...');
    try {
      // 1. Verify Payment
      const verifyRes = await fetch('/api/orders/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        throw new Error(verifyData.error || 'Payment signature verification failed.');
      }

      setPaymentSuccess(true);
      setLoadingText('Running AI consistency check & rendering PDF...');

      // 2. Generate Document
      // If bundle, we generate using the credit we just paid for
      const isBundle = checkoutMode === 'bundle';
      const generateRes = await fetch(
        isBundle ? '/api/documents/generate-with-credit' : '/api/documents/generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            isBundle
              ? { email: userEmail, answers, clientId: selectedClientId || undefined }
              : { orderId, answers, clientId: selectedClientId || undefined }
          ),
        }
      );

      const generateData = await generateRes.json();
      
      if (generateRes.ok && selectedClientId) {
        localStorage.setItem('ld_last_client_id', selectedClientId);
      }
      
      if (!generateRes.ok) {
        // If validation errors are returned
        if (generateData.details && Array.isArray(generateData.details)) {
          setConsistencyErrors(generateData.details);
          throw new Error(generateData.error || 'Consistency checks failed.');
        }
        throw new Error(generateData.error || 'Failed to generate PDF document.');
      }

      setDocumentUrl(generateData.downloadUrl);
      setDocumentId(generateData.documentId);
      localStorage.removeItem('legaldocs_answers'); // Reset answers on successful download ready
      
      // If bundle, sync the user's credits (they bought 3, used 1, remaining is 2)
      if (isBundle) {
        setUserCredits(2);
      }
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || 'Error occurred during generation processing.');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateEsign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerAEmail || !signerBEmail) {
      setEsignError('Please enter email addresses for both signers.');
      return;
    }

    setEsignLoading(true);
    setEsignError('');

    try {
      const response = await fetch(`/api/documents/${documentId}/esign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signers: [
            { name: signerAName, email: signerAEmail },
            { name: signerBName, email: signerBEmail },
          ],
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to initiate eSign.');
      }

      setEsignInitiated(true);
      setEsignSigningUrls(data.signingUrls);
      setEsignStatus('SENT_FOR_SIGNATURE');
    } catch (err: any) {
      setEsignError(err.message || 'Error occurred while creating eSign request.');
    } finally {
      setEsignLoading(false);
    }
  };

  const checkSignatureStatus = async (incrementView = false) => {
    if (!documentId) return;
    try {
      const response = await fetch(`/api/documents/${documentId}/status${incrementView ? '?incrementView=true' : ''}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setEsignStatus(data.signatureStatus);
        setDocMetadata(data);
      }
    } catch (err) {
      console.error('Error checking signature status:', err);
    }
  };

  useEffect(() => {
    if (documentId) {
      checkSignatureStatus(true);
      // Periodic refresh
      const interval = setInterval(() => {
        checkSignatureStatus(false);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [documentId]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 flex-grow w-full flex flex-col justify-start">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Title */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Document Generation Wizard
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Complete the 6-step questionnaire to assemble your custom legal agreement.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-400 animate-pulse">
          <CheckCircle2 className="h-3.5 w-3.5 animate-bounce" />
          <span>✓ Saved just now</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-10 rounded-2xl border border-slate-900 bg-slate-900/20 p-5 space-y-4">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <span className="bg-slate-900 px-2.5 py-1 rounded text-white font-bold">STEP {currentStep} OF 6</span>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Estimated Time</span>
            <span className="text-slate-300 font-bold">~{Math.max(1, 6 - currentStep)} min remaining</span>
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            <span>
              {currentStep === 1 && 'Document Type Selection'}
              {answers.docType === 'nda' && (
                <>
                  {currentStep === 2 && 'NDA Type Selection'}
                  {currentStep === 3 && 'Party Details'}
                  {currentStep === 4 && 'Purpose & Scope'}
                  {currentStep === 5 && 'Term & Jurisdiction'}
                  {currentStep === 6 && 'Review & Generate'}
                </>
              )}
              {answers.docType === 'service_agreement' && (
                <>
                  {currentStep === 2 && 'Party Details'}
                  {currentStep === 3 && 'Scope & Deliverables'}
                  {currentStep === 4 && 'Payment & Milestones'}
                  {currentStep === 5 && 'Term & Jurisdiction'}
                  {currentStep === 6 && 'Review & Generate'}
                </>
              )}
              {!answers.docType && currentStep > 1 && 'Configuration'}
            </span>
            <span className="text-blue-400">{Math.round((currentStep / 6) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-slate-955 h-2 rounded-full overflow-hidden border border-slate-900">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / 6) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main wizard body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start flex-grow">
        
        {/* Left Side: Form Controls */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-900 bg-slate-900/40 p-6 sm:p-8 backdrop-blur-sm min-h-[350px] flex flex-col justify-between">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 flex-grow">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
              <p className="text-slate-200 font-medium text-center">{loadingText}</p>
            </div>
          ) : documentUrl ? (
            /* Premium Document Workspace Left Column */
            <div className="flex flex-col text-left py-2 flex-grow space-y-6 animate-fade-in">
              
              {/* Header block */}
              <div className="flex justify-between items-start flex-wrap gap-4 border-b border-slate-900 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1 rounded bg-blue-600/10 border border-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-400 uppercase">
                      {answers.docType === 'nda' ? 'NDA Workspace' : 'Agreement Workspace'}
                    </span>
                    {esignStatus === 'SIGNED' ? (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">
                        Signed
                      </span>
                    ) : esignStatus === 'SENT_FOR_SIGNATURE' ? (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-500 uppercase animate-pulse">
                        Pending Signatures
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 uppercase">
                        Generated Draft
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {answers.docType === 'nda' 
                      ? `${answers.ndaType === 'mutual' ? 'Mutual' : 'Unilateral'} Confidentiality NDA` 
                      : 'Freelance Service Contract'}
                  </h2>
                  <p className="text-[10px] text-slate-550 font-mono mt-1 block">ID: {documentId}</p>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/15 px-3 py-1 rounded-full">
                  <span>🎉 Ready to download</span>
                </div>
              </div>

              {/* Workspace Metadata Details Card */}
              <div className="grid grid-cols-2 gap-4 bg-slate-950/20 border border-slate-900 rounded-2xl p-4 text-xs">
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider">Template Version</span>
                  <span className="font-semibold text-white block mt-0.5">v2.0</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider">Law Jurisdiction</span>
                  <span className="font-semibold text-white block mt-0.5">{answers.governingJurisdiction}, India</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider">View Analytics</span>
                  <span className="font-semibold text-white block mt-0.5">{docMetadata?.viewCount || 1} views</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider">Downloads</span>
                  <span className="font-semibold text-white block mt-0.5">{docMetadata?.downloadCount || 0} times</span>
                </div>
              </div>

              {/* Action Sidebar / Hub Grid */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Document Action Hub</h4>
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* Download PDF */}
                  <a
                    href={documentUrl}
                    download
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-blue-500 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download Draft
                  </a>

                  {/* Download Signed Copy */}
                  {esignStatus === 'SIGNED' ? (
                    <a
                      href={`${documentUrl}?signed=true`}
                      download
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-emerald-500 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Signed Copy
                    </a>
                  ) : (
                    <button
                      disabled
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-900 bg-slate-950/20 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 cursor-not-allowed text-center"
                      title="Initiate E-Sign below to generate signed copies"
                    >
                      Signed Copy (Lock)
                    </button>
                  )}

                  {/* Print Document */}
                  <button
                    onClick={() => {
                      const printWindow = window.open(documentUrl, '_blank');
                      if (printWindow) printWindow.print();
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-955 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
                  >
                    Print Contract
                  </button>

                  {/* Copy Link */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin + documentUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-850 bg-slate-955 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-350 hover:text-white hover:border-slate-750 transition-colors"
                  >
                    {copiedLink ? '✓ Copied Link!' : 'Copy Link'}
                  </button>

                  {/* Share Document */}
                  <button
                    disabled
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-900 bg-slate-950/20 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 cursor-not-allowed"
                  >
                    <span>Share (Soon)</span>
                  </button>

                  {/* Email Copy */}
                  <button
                    disabled
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-900 bg-slate-950/20 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 cursor-not-allowed"
                  >
                    <span>Email (Soon)</span>
                  </button>
                </div>
              </div>

              {/* Document Details Panel */}
              <div className="bg-slate-900/10 border border-slate-900 rounded-2xl p-5 space-y-3.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block border-b border-slate-900 pb-2">Technical Properties</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  <div className="flex justify-between text-slate-500 py-1 border-b border-slate-900/40 sm:border-b-0">
                    <span>Lawyer Vetted:</span>
                    <span className="text-emerald-400 font-semibold">✓ Verified Layout</span>
                  </div>
                  <div className="flex justify-between text-slate-500 py-1 border-b border-slate-900/40 sm:border-b-0">
                    <span>AI Assisted:</span>
                    <span className="text-emerald-400 font-semibold">✓ LLM Audited</span>
                  </div>
                  <div className="flex justify-between text-slate-500 py-1">
                    <span>Default Language:</span>
                    <span className="text-slate-350">English (IN)</span>
                  </div>
                  <div className="flex justify-between text-slate-500 py-1">
                    <span>File Format:</span>
                    <span className="text-slate-350">Print-ready PDF</span>
                  </div>
                </div>
              </div>

              {/* Document Timeline */}
              <div className="p-5 border border-slate-900 bg-slate-955/20 rounded-2xl space-y-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Execution Timeline</span>
                <div className="flex flex-col sm:flex-row justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[10px] text-emerald-400 font-bold">1</div>
                    <span className="font-semibold text-white">Generated Draft</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      (docMetadata?.downloadCount || 0) > 0 
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                        : 'bg-slate-900 border border-slate-850 text-slate-550'
                    }`}>2</div>
                    <span className={(docMetadata?.downloadCount || 0) > 0 ? 'font-semibold text-white' : 'text-slate-550'}>Downloaded</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      esignStatus === 'SIGNED' 
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                        : esignStatus === 'SENT_FOR_SIGNATURE' 
                          ? 'bg-amber-500/10 border border-amber-500/30 text-amber-500 animate-pulse'
                          : 'bg-slate-900 border border-slate-855 text-slate-550'
                    }`}>3</div>
                    <span className={esignStatus !== 'NONE' ? 'font-semibold text-white' : 'text-slate-550'}>e-Signed</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons to Go Back / Reset */}
              <div className="flex gap-4 border-t border-slate-900 pt-6 flex-wrap">
                <Link
                  href="/dashboard"
                  className="rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 hover:border-slate-700 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-450 hover:text-white transition-colors"
                >
                  Return to Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="rounded-xl border border-rose-950 bg-rose-950/5 hover:bg-rose-950/15 hover:border-rose-900 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-450 ml-auto transition-colors"
                >
                  Delete Draft
                </button>
              </div>

              {/* Delete Confirmation Modal */}
              {showDeleteConfirm && (
                <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                  <div className="w-full max-w-sm rounded-2xl border border-slate-900 bg-slate-950 p-6 text-center shadow-2xl space-y-4">
                    <div className="inline-flex rounded-full bg-rose-500/10 border border-rose-500/20 p-3.5 text-rose-400">
                      <AlertTriangle className="h-6 w-6 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-white">Delete Agreement Draft?</h3>
                      <p className="text-xs text-slate-500 leading-normal">
                        This action will discard your local draft questionnaire parameters and clear the current compilation session.
                      </p>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteDraft}
                        className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-550 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow animate-fade-in"
                      >
                        Confirm Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* E-signature flow */}
              <div className="w-full border-t border-slate-900 pt-6 mt-2 text-left">
                {esignStatus === 'NONE' && (
                  <form onSubmit={handleInitiateEsign} className="space-y-4 max-w-md bg-slate-950/40 border border-slate-900 rounded-xl p-5">
                    <div className="flex items-center gap-2 font-bold text-slate-350 text-xs uppercase tracking-wider mb-2">
                      <FileSignature className="h-4 w-4 text-blue-500" />
                      <span>Optional: Send for Aadhaar eSign</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                      Initiate Indian Aadhaar eSign (Digio Sandbox). Signers will receive verification OTP links.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Party A Name</label>
                        <input
                          type="text"
                          value={signerAName}
                          onChange={(e) => setSignerAName(e.target.value)}
                          className="w-full rounded border border-slate-900 bg-slate-950 px-2 py-1 text-xs text-white focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Party A Email</label>
                        <input
                          type="email"
                          value={signerAEmail}
                          onChange={(e) => setSignerAEmail(e.target.value)}
                          placeholder="signer.a@example.com"
                          className="w-full rounded border border-slate-900 bg-slate-950 px-2 py-1 text-xs text-white focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Party B Name</label>
                        <input
                          type="text"
                          value={signerBName}
                          onChange={(e) => setSignerBName(e.target.value)}
                          className="w-full rounded border border-slate-900 bg-slate-950 px-2 py-1 text-xs text-white focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Party B Email</label>
                        <input
                          type="email"
                          value={signerBEmail}
                          onChange={(e) => setSignerBEmail(e.target.value)}
                          placeholder="signer.b@example.com"
                          className="w-full rounded border border-slate-900 bg-slate-950 px-2 py-1 text-xs text-white focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    {esignError && <p className="text-rose-450 text-[11px] mt-1">{esignError}</p>}

                    <button
                      type="submit"
                      disabled={esignLoading}
                      className="w-full inline-flex justify-center items-center gap-2 rounded bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-colors disabled:opacity-50 mt-2"
                    >
                      {esignLoading ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Creating Signing Session...
                        </>
                      ) : (
                        'Request Signatures (₹0 Sandbox)'
                      )}
                    </button>
                  </form>
                )}

                {esignStatus === 'SENT_FOR_SIGNATURE' && esignSigningUrls && (
                  <div className="max-w-md bg-slate-950/40 border border-slate-900 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                      <div className="flex items-center gap-2 font-bold text-amber-500 text-xs uppercase tracking-wider">
                        <PenTool className="h-4 w-4" />
                        <span>Awaiting e-signatures</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => checkSignatureStatus(false)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-white uppercase"
                      >
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Refresh
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Please click the links below to simulate Aadhaar OTP eSign execution for each signer.
                    </p>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs p-2.5 rounded bg-slate-950 border border-slate-900">
                        <div>
                          <span className="font-semibold text-slate-300 block">{signerAName}</span>
                          <span className="text-[10px] text-slate-500">{signerAEmail}</span>
                        </div>
                        <a
                          href={esignSigningUrls[signerAEmail]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-400 hover:text-blue-300 hover:underline uppercase border border-blue-500/20 bg-blue-500/5 px-2 py-1 rounded"
                        >
                          Sign Now
                        </a>
                      </div>

                      <div className="flex justify-between items-center text-xs p-2.5 rounded bg-slate-950 border border-slate-900">
                        <div>
                          <span className="font-semibold text-slate-300 block">{signerBName}</span>
                          <span className="text-[10px] text-slate-500">{signerBEmail}</span>
                        </div>
                        <a
                          href={esignSigningUrls[signerBEmail]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-400 hover:text-blue-300 hover:underline uppercase border border-blue-500/20 bg-blue-500/5 px-2 py-1 rounded"
                        >
                          Sign Now
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {esignStatus === 'SIGNED' && (
                  <div className="max-w-md bg-emerald-950/10 border border-emerald-900/30 rounded-xl p-5 text-center space-y-3">
                    <div className="inline-flex rounded-full bg-emerald-500/10 border border-emerald-500/20 p-2 text-emerald-400">
                      <UserCheck className="h-6 w-6" />
                    </div>
                    <h4 className="font-bold text-white text-sm">e-Signature Execution Complete!</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      All executing parties have completed Aadhaar OTP eSign verification. The digitally signed copy is archived.
                    </p>
                  </div>
                )}
              </div>

              <div className="max-w-md rounded-xl border border-amber-950 bg-amber-950/10 p-4 text-center text-xs text-amber-500">
                <span className="font-semibold block mb-1 text-amber-400">🚨 PENDING LAWYER REVIEWS</span>
                This document contains obvious placeholders. Do not execute it in production until you have standard legal clauses vetted by an attorney.
              </div>
            </div>
          ) : (
            <div className="flex-grow flex flex-col justify-between">
              <div>
                    {/* STEP 1: DOCUMENT TYPE SELECTION */}
                {currentStep === 1 && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="border-b border-slate-900 pb-3 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Section 1 — Document Parameters</span>
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-xl font-bold text-white tracking-tight">Select Legal Document Agreement</h2>
                      <p className="text-slate-400 text-xs leading-normal">Pick the legal structure template corresponding to your corporate or contracting requirements.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {workflows.map((wf) => {
                        const isSelected = answers.docType === wf.doc_type;
                        return (
                          <div 
                            key={wf.doc_type}
                            onClick={() => {
                              handleInputChange('docType', wf.doc_type);
                              if (wf.doc_type === 'MUTUAL_NDA') {
                                handleInputChange('ndaType', 'mutual');
                              } else if (wf.doc_type === 'UNILATERAL_NDA') {
                                handleInputChange('ndaType', 'unilateral');
                              }
                              setSelectedWorkflow(wf);
                            }}
                            className={`cursor-pointer rounded-2xl border p-5 flex flex-col justify-between transition-all transform hover:-translate-y-0.5 duration-300 ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/5' 
                                : 'border-slate-800 bg-slate-950/30 hover:border-slate-700'
                            }`}
                          >
                            <div className="space-y-3">
                              <div className={`inline-flex p-2.5 rounded-xl border ${
                                isSelected ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'bg-slate-900/50 border-slate-800 text-slate-450'
                              }`}>
                                <FileText className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-bold text-white text-base">{wf.name}</div>
                                <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                                  {wf.description || 'Custom Dynamic Legal Document'}
                                </div>
                              </div>
                            </div>
                            <div className="mt-6 text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center justify-between">
                              <span>Dynamic Workflow</span>
                              {isSelected && <Check className="h-4 w-4 text-blue-400" />}
                            </div>
                          </div>
                        );
                      })}

                      {workflows.length === 0 && (
                        <>
                          <div 
                            onClick={() => handleInputChange('docType', 'nda')}
                            className={`cursor-pointer rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                              answers.docType === 'nda' ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 bg-slate-950/30'
                            }`}
                          >
                            <div className="font-bold text-white text-base">Mutual NDA</div>
                          </div>
                          <div 
                            onClick={() => handleInputChange('docType', 'service_agreement')}
                            className={`cursor-pointer rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                              answers.docType === 'service_agreement' ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 bg-slate-950/30'
                            }`}
                          >
                            <div className="font-bold text-white text-base">Freelance Agreement</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* DYNAMIC WORKFLOW QUESTIONS (STEPS 2-5) */}
                {selectedWorkflow && currentStep >= 2 && currentStep <= 5 && (
                  <div className="space-y-6 animate-fade-in">
                    {(() => {
                      const stepConfig = selectedWorkflow.question_set.find((s: any) => s.step === currentStep);
                      if (!stepConfig) {
                        return <div className="text-slate-400 text-xs py-10 text-center">No fields configured for this step. Click Continue.</div>;
                      }
                      return (
                        <div className="space-y-6">
                          <div className="border-b border-slate-900 pb-3 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                              Section {currentStep} — {stepConfig.title}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <h2 className="text-xl font-bold text-white tracking-tight">{stepConfig.title}</h2>
                            <p className="text-slate-400 text-xs leading-normal">{stepConfig.description}</p>
                          </div>

                          <div className="space-y-5">
                            {stepConfig.fields.map((field: any) => {
                              if (field.conditionalOn) {
                                const val = (answers as any)[field.conditionalOn];
                                if (String(val).toLowerCase() !== String(field.conditionValue).toLowerCase()) {
                                  return null;
                                }
                              }

                              return (
                                <div key={field.id} className="p-5 rounded-2xl border border-slate-900 bg-slate-955/20 space-y-2">
                                  <div className="flex justify-between items-center">
                                    <label className="text-[10px] text-slate-500 font-bold uppercase block">
                                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                                    </label>
                                    {field.helpText && (
                                      <button
                                        type="button"
                                        onClick={() => alert(field.helpText)}
                                        className="text-slate-500 hover:text-white"
                                        title={field.helpText}
                                      >
                                        <HelpCircle className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </div>

                                  {field.type === 'textarea' ? (
                                    <textarea
                                      rows={4}
                                      placeholder={field.placeholder || ''}
                                      value={(answers as any)[field.id] || ''}
                                      onChange={(e) => handleInputChange(field.id as any, e.target.value)}
                                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none transition-all resize-none"
                                    />
                                  ) : field.type === 'select' ? (
                                    <select
                                      value={(answers as any)[field.id] || ''}
                                      onChange={(e) => handleInputChange(field.id as any, e.target.value)}
                                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3.5 text-sm text-white focus:border-blue-500 focus:outline-none transition-all cursor-pointer text-slate-400"
                                    >
                                      <option value="">-- Select option --</option>
                                      {field.options.map((opt: string) => (
                                        <option key={opt} value={opt}>
                                          {opt}
                                        </option>
                                      ))}
                                    </select>
                                  ) : field.type === 'number' ? (
                                    <input
                                      type="number"
                                      placeholder={field.placeholder || ''}
                                      value={(answers as any)[field.id] || ''}
                                      onChange={(e) => handleInputChange(field.id as any, e.target.value)}
                                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none transition-all"
                                    />
                                  ) : field.type === 'date' ? (
                                    <input
                                      type="date"
                                      value={(answers as any)[field.id] || ''}
                                      onChange={(e) => handleInputChange(field.id as any, e.target.value)}
                                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none transition-all text-slate-400"
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      placeholder={field.placeholder || ''}
                                      value={(answers as any)[field.id] || ''}
                                      onChange={(e) => handleInputChange(field.id as any, e.target.value)}
                                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none transition-all"
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* ==================== NDA FLOW ==================== */}
                {!selectedWorkflow && answers.docType === 'nda' && (
                  <>
                    {/* STEP 2: NDA TYPE */}
                    {currentStep === 2 && (
                      <div className="space-y-6">
                        {/* Section Header Banner */}
                        <div className="border-b border-slate-900 pb-3 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Section 2 — Agreement Parameters</span>
                          <button 
                            type="button" 
                            onClick={() => setActiveHelpField(activeHelpField === 'ndaType' ? null : 'ndaType')}
                            className="text-slate-500 hover:text-white"
                          >
                            <HelpCircle className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <h2 className="text-xl font-bold text-white tracking-tight">Select NDA Type</h2>
                          <p className="text-slate-400 text-xs leading-normal">Determine if both parties are sharing proprietary information or if disclosure is one-way.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div 
                            onClick={() => handleInputChange('ndaType', 'mutual')}
                            className={`cursor-pointer rounded-2xl border p-5 flex flex-col justify-between transition-all transform hover:-translate-y-0.5 duration-300 ${
                              answers.ndaType === 'mutual' 
                                ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/5' 
                                : 'border-slate-800 bg-slate-950/30 hover:border-slate-700'
                            }`}
                          >
                            <div className="space-y-3">
                              <div className={`inline-flex p-2.5 rounded-xl border ${
                                answers.ndaType === 'mutual' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'bg-slate-900/50 border-slate-800 text-slate-450'
                              }`}>
                                <Layers className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-bold text-white text-base">Mutual NDA</div>
                                <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                                  Recommended when <strong>both</strong> parties plan to disclose confidential information to each other.
                                </div>
                              </div>
                            </div>
                            <div className="mt-6 text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center justify-between">
                              <span>Two-way sharing</span>
                              {answers.ndaType === 'mutual' && <Check className="h-4 w-4 text-blue-400" />}
                            </div>
                          </div>

                          <div 
                            onClick={() => handleInputChange('ndaType', 'unilateral')}
                            className={`cursor-pointer rounded-2xl border p-5 flex flex-col justify-between transition-all transform hover:-translate-y-0.5 duration-300 ${
                              answers.ndaType === 'unilateral' 
                                ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/5' 
                                : 'border-slate-800 bg-slate-950/30 hover:border-slate-700'
                            }`}
                          >
                            <div className="space-y-3">
                              <div className={`inline-flex p-2.5 rounded-xl border ${
                                answers.ndaType === 'unilateral' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'bg-slate-900/50 border-slate-800 text-slate-450'
                              }`}>
                                <ChevronRight className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-bold text-white text-base">Unilateral NDA</div>
                                <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                                  Recommended when <strong>only one</strong> party is disclosing confidential information to another party (e.g. employee/contractor).
                                </div>
                              </div>
                            </div>
                            <div className="mt-6 text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center justify-between">
                              <span>One-way sharing</span>
                              {answers.ndaType === 'unilateral' && <Check className="h-4 w-4 text-blue-400" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 3: PARTY DETAILS */}
                    {currentStep === 3 && (
                      <div className="space-y-6">
                        {/* Section Header Banner */}
                        <div className="border-b border-slate-900 pb-3 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Section 3 — Party Information</span>
                          <button 
                            type="button" 
                            onClick={() => setActiveHelpField(activeHelpField === 'disclosingParty' ? null : 'disclosingParty')}
                            className="text-slate-500 hover:text-white"
                          >
                            <HelpCircle className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <h2 className="text-xl font-bold text-white tracking-tight">Party Details</h2>
                          <p className="text-slate-400 text-xs leading-normal">Enter the registered corporate or individual names and legal addresses executing this agreement.</p>
                        </div>

                        {/* Client Selector (Workspace) */}
                        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/20 space-y-4">
                          <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Client Workspace Association</span>
                            <button
                              type="button"
                              onClick={() => setShowCreateClientModal(true)}
                              className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider bg-indigo-500/5 border border-indigo-500/15 px-2.5 py-1 rounded transition-all hover:scale-105"
                            >
                              + New Client
                            </button>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase block">Associate Agreement With Client</label>
                            <select
                              value={selectedClientId}
                              onChange={(e) => {
                                const cid = e.target.value;
                                setSelectedClientId(cid);
                                if (cid) {
                                  const client = clients.find(c => c.id === cid);
                                  if (client) {
                                    setAnswers(prev => ({
                                      ...prev,
                                      receivingParty: client.company_name,
                                      receivingPartyAddress: client.address,
                                    }));
                                  }
                                }
                              }}
                              className="w-full rounded-xl border border-slate-855 bg-slate-950 px-4 py-3 text-sm text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/25 transition-all"
                            >
                              <option value="">-- Standalone Draft (No Workspace Association) --</option>
                              {clients.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.company_name} ({c.contact_person})
                                </option>
                              ))}
                            </select>
                          </div>
                          {clients.length > 0 && !selectedClientId && (() => {
                            const lastCid = localStorage.getItem('ld_last_client_id');
                            const lastC = clients.find(c => c.id === lastCid);
                            if (lastC) {
                              return (
                                <div className="flex justify-between items-center bg-indigo-500/5 border border-indigo-500/10 rounded-xl px-3 py-2 text-[10px] text-indigo-400">
                                  <span>Suggested recent client: <strong>{lastC.company_name}</strong></span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedClientId(lastC.id);
                                      setAnswers(prev => ({
                                        ...prev,
                                        receivingParty: lastC.company_name,
                                        receivingPartyAddress: lastC.address,
                                      }));
                                    }}
                                    className="font-bold underline uppercase tracking-wider text-[9px] hover:text-indigo-300"
                                  >
                                    Apply
                                  </button>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>

                        {/* Disclosing Party A */}
                        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/20 space-y-4">
                          <div className="flex justify-between items-center border-b border-slate-900 pb-2 flex-wrap gap-2">
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                              {answers.ndaType === 'mutual' ? 'First Party (Party A)' : 'Disclosing Party (Party A)'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAutofillProfile('disclosing')}
                              className="text-[9px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider bg-blue-500/5 border border-blue-500/15 px-2 py-0.5 rounded transition-all hover:scale-105"
                            >
                              Autofill Profile
                            </button>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase block">Legal Entity Name</label>
                            <input
                              type="text"
                              placeholder="e.g. Acme Corporation Pvt Ltd"
                              value={answers.disclosingParty}
                              onChange={(e) => handleInputChange('disclosingParty', e.target.value)}
                              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25 focus:outline-none transition-all"
                            />
                            {!answers.disclosingParty.trim() && (
                              <span className="text-[10px] text-slate-655 font-semibold block pt-0.5">Please enter a valid entity or individual name.</span>
                            )}
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase block">Registered Address</label>
                            <input
                              type="text"
                              placeholder="Full postal address"
                              value={answers.disclosingPartyAddress}
                              onChange={(e) => handleInputChange('disclosingPartyAddress', e.target.value)}
                              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25 focus:outline-none transition-all"
                            />
                            {!answers.disclosingPartyAddress.trim() && (
                              <span className="text-[10px] text-slate-655 font-semibold block pt-0.5">Please enter a valid registered address.</span>
                            )}
                          </div>
                        </div>

                        {/* Receiving Party B */}
                        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/20 space-y-4">
                          <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                              {answers.ndaType === 'mutual' ? 'Second Party (Party B)' : 'Receiving Party (Party B)'}
                            </span>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase block">Legal Entity Name</label>
                            <input
                              type="text"
                              placeholder="e.g. Beta Solutions LLP"
                              value={answers.receivingParty}
                              onChange={(e) => handleInputChange('receivingParty', e.target.value)}
                              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25 focus:outline-none transition-all"
                            />
                            {!answers.receivingParty.trim() && (
                              <span className="text-[10px] text-slate-655 font-semibold block pt-0.5">Please enter a valid entity or individual name.</span>
                            )}
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase block">Registered Address</label>
                            <input
                              type="text"
                              placeholder="Full postal address"
                              value={answers.receivingPartyAddress}
                              onChange={(e) => handleInputChange('receivingPartyAddress', e.target.value)}
                              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25 focus:outline-none transition-all"
                            />
                            {!answers.receivingPartyAddress.trim() && (
                              <span className="text-[10px] text-slate-655 font-semibold block pt-0.5">Please enter a valid registered address.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 4: PURPOSE & SCOPE */}
                    {currentStep === 4 && (
                      <div className="space-y-6">
                        {/* Section Header Banner */}
                        <div className="border-b border-slate-900 pb-3 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Section 4 — Purpose & Scope</span>
                          <button 
                            type="button" 
                            onClick={() => setActiveHelpField(activeHelpField === 'purpose' ? null : 'purpose')}
                            className="text-slate-500 hover:text-white"
                          >
                            <HelpCircle className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <h2 className="text-xl font-bold text-white tracking-tight">Purpose of Information Sharing</h2>
                          <p className="text-slate-400 text-xs leading-normal">Clearly define the business evaluation, partnership discussion, or project during which confidential records are shared.</p>
                        </div>

                        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-955/20 space-y-4">
                          <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Define Transaction / Project Scope</label>
                          <textarea
                            rows={4}
                            placeholder="e.g. Evaluating a mutual software systems integration partnership and exchanging client directory APIs"
                            value={answers.purpose}
                            onChange={(e) => handleInputChange('purpose', e.target.value)}
                            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25 focus:outline-none transition-all resize-none"
                          />
                          <div className="flex justify-between items-center text-[10px] text-slate-500">
                            <span>Min. 5 characters required</span>
                            <span>{(answers.purpose || '').length} chars entered</span>
                          </div>
                          {(answers.purpose || '').trim().length < 5 && (
                            <span className="text-[10px] text-slate-655 font-semibold block mt-1">Please enter a valid, detailed sharing purpose.</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* STEP 5: TERM & JURISDICTION */}
                    {currentStep === 5 && (
                      <div className="space-y-6">
                        {/* Section Header Banner */}
                        <div className="border-b border-slate-900 pb-3 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Section 5 — Term & Jurisdiction</span>
                          <button 
                            type="button" 
                            onClick={() => setActiveHelpField(activeHelpField === 'confidentialityTerm' ? null : 'confidentialityTerm')}
                            className="text-slate-500 hover:text-white"
                          >
                            <HelpCircle className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <h2 className="text-xl font-bold text-white tracking-tight">Term & Dispute Governance</h2>
                          <p className="text-slate-400 text-xs leading-normal">Establish the contract start date, confidentiality duration, and Indian state governing jurisdiction rules.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 rounded-2xl border border-slate-900 bg-slate-950/20">
                          {/* Term (Months) */}
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase block">Confidentiality Term (Months)</label>
                            <input
                              type="number"
                              value={answers.confidentialityTerm}
                              onChange={(e) => handleInputChange('confidentialityTerm', e.target.value)}
                              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25 focus:outline-none transition-all"
                            />
                            {!answers.confidentialityTerm && (
                              <span className="text-[10px] text-slate-655 font-semibold block pt-0.5">Please define a valid term in months.</span>
                            )}
                          </div>

                          {/* Effective Date */}
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase block">Effective Date</label>
                            <input
                              type="date"
                              value={answers.effectiveDate}
                              onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
                              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25 focus:outline-none transition-all"
                            />
                            {!answers.effectiveDate && (
                              <span className="text-[10px] text-slate-655 font-semibold block pt-0.5">Please specify a valid start date.</span>
                            )}
                          </div>
                        </div>

                        {/* Governing Jurisdiction */}
                        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/20 space-y-2">
                          <label className="text-[10px] text-slate-500 font-bold uppercase block">Governing State Jurisdiction (India)</label>
                          <select
                            value={answers.governingJurisdiction}
                            onChange={(e) => handleInputChange('governingJurisdiction', e.target.value)}
                            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25 focus:outline-none transition-all appearance-none cursor-pointer"
                          >
                            {INDIAN_STATES.map((state) => (
                              <option key={state} value={state}>
                                {state}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* STEP 6 */}
                    {!selectedWorkflow && currentStep === 6 && (
                      <div className="space-y-6 animate-fade-in">
                        {/* Section Header Banner */}
                        <div className="border-b border-slate-900 pb-3 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Section 6 — Review & Checkout</span>
                          <button 
                            type="button" 
                            onClick={() => setActiveHelpField(activeHelpField === 'docType' ? null : 'docType')}
                            className="text-slate-500 hover:text-white"
                          >
                            <HelpCircle className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <h2 className="text-xl font-bold text-white tracking-tight">Review NDA Parameters</h2>
                          <p className="text-slate-400 text-xs leading-normal">Inspect compiled agreement details before executing payment and generating PDF contracts.</p>
                        </div>

                        <div className="space-y-4">
                          
                          {/* Parameter Group A */}
                          <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-5 space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Agreement Specifications</span>
                              <button
                                type="button"
                                onClick={() => setCurrentStep(2)}
                                className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider bg-slate-900/50 hover:bg-slate-900 border border-slate-800 px-2 py-1 rounded"
                              >
                                Edit Selection
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider">NDA Classification</span>
                                <span className="font-semibold text-white capitalize mt-0.5 block">{answers.ndaType} Agreement</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider">Confidentiality Duration</span>
                                <span className="font-semibold text-white mt-0.5 block">{answers.confidentialityTerm} Months</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider">Contract Start Date</span>
                                <span className="font-semibold text-white mt-0.5 block">{answers.effectiveDate || 'Immediate'}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider">Governing State Rules</span>
                                <span className="font-semibold text-white mt-0.5 block">{answers.governingJurisdiction}, India</span>
                              </div>
                            </div>
                          </div>

                          {/* Parameter Group B */}
                          <div className="rounded-2xl border border-slate-900 bg-slate-955/20 p-5 space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Contracting Parties</span>
                              <button
                                type="button"
                                onClick={() => setCurrentStep(3)}
                                className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider bg-slate-900/50 hover:bg-slate-900 border border-slate-800 px-2 py-1 rounded"
                              >
                                Edit Parties
                              </button>
                            </div>
                            <div className="space-y-3 text-xs">
                              <div>
                                <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider">
                                  {answers.ndaType === 'mutual' ? 'Party A (First Party)' : 'Party A (Disclosing)'}
                                </span>
                                <span className="font-semibold text-white mt-0.5 block">{answers.disclosingParty}</span>
                                <span className="text-slate-400 text-[10px] mt-0.5 block leading-normal">{answers.disclosingPartyAddress}</span>
                              </div>
                              <div className="border-t border-slate-900 pt-2">
                                <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider">
                                  {answers.ndaType === 'mutual' ? 'Party B (Second Party)' : 'Party B (Receiving)'}
                                </span>
                                <span className="font-semibold text-white mt-0.5 block">{answers.receivingParty}</span>
                                <span className="text-slate-400 text-[10px] mt-0.5 block leading-normal">{answers.receivingPartyAddress}</span>
                              </div>
                            </div>
                          </div>

                          {/* Parameter Group C */}
                          <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-5 space-y-3">
                            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Business Sharing Purpose</span>
                              <button
                                type="button"
                                onClick={() => setCurrentStep(4)}
                                className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider bg-slate-900/50 hover:bg-slate-900 border border-slate-800 px-2 py-1 rounded"
                              >
                                Edit Purpose
                              </button>
                            </div>
                            <p className="text-xs text-slate-350 leading-relaxed font-semibold italic">
                              "{answers.purpose}"
                            </p>
                          </div>
                        </div>

                        {/* Email Capture & Payment/Bundle Configuration */}
                        <div className="border border-slate-900 bg-slate-950/30 rounded-2xl p-5 space-y-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                              Your Delivery & Account Email
                            </label>
                            <input
                              type="email"
                              placeholder="e.g. founder@mycompany.co"
                              value={userEmail}
                              onChange={(e) => {
                                setUserEmail(e.target.value);
                                checkCredits(e.target.value);
                              }}
                              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25 focus:outline-none transition-all"
                              required
                            />
                            {!userEmail.includes('@') && (
                              <span className="text-[10px] text-slate-655 font-semibold block pt-0.5">Please provide a valid delivery email.</span>
                            )}
                          </div>

                          {userCredits > 0 ? (
                            <div className="bg-emerald-950/20 border border-emerald-900/40 p-4 rounded-xl flex items-center justify-between text-xs">
                              <div>
                                <span className="font-semibold text-emerald-450 block">🎉 Unused Credits Available!</span>
                                <span className="text-slate-450 mt-0.5 block">We detected {userCredits} active credits linked to your account.</span>
                              </div>
                              <button
                                type="button"
                                onClick={handleGenerateWithCredit}
                                className="rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors px-4 py-2 font-bold text-white shadow"
                              >
                                Use 1 Credit
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                Select Purchase Plan
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div
                                  onClick={() => setCheckoutMode('single')}
                                  className={`cursor-pointer rounded-xl border p-4 flex flex-col justify-between transition-all ${
                                    checkoutMode === 'single'
                                      ? 'border-blue-500 bg-blue-500/10'
                                      : 'border-slate-850 bg-slate-950/30 hover:border-slate-800'
                                  }`}
                                >
                                  <span className="font-bold text-xs text-white">Single Document</span>
                                  <span className="text-[10px] text-slate-400 mt-1">₹199 per generation</span>
                                </div>
                                <div
                                  onClick={() => setCheckoutMode('bundle')}
                                  className={`cursor-pointer rounded-xl border p-4 flex flex-col justify-between transition-all ${
                                    checkoutMode === 'bundle'
                                      ? 'border-blue-500 bg-blue-500/10'
                                      : 'border-slate-850 bg-slate-950/30 hover:border-slate-800'
                                  }`}
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-xs text-white">3-Doc Bundle</span>
                                    <span className="bg-blue-600/30 text-blue-400 font-bold text-[8px] px-1 rounded uppercase tracking-wider">Save 15%</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 mt-1">₹499 (credits never expire)</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Pre-payment disclaimers */}
                        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2">
                          <div className="flex gap-2 text-xs text-amber-500 items-start">
                            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <div>
                              <strong>Terms of generation:</strong> By proceeding to purchase, you understand that this document will be compiled containing placeholder clauses pending lawyer drafting. No legal advice is provided.
                            </div>
                          </div>
                          <div className="flex gap-2 text-xs text-slate-400 items-start">
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-500" />
                            <div>
                              <strong>₹199 generation fee:</strong> Unlocks immediate Puppeteer A4 rendering with a 48-hour secure expiration download path.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ==================== SERVICE AGREEMENT FLOW ==================== */}
                {!selectedWorkflow && answers.docType === 'service_agreement' && (
                  <>
                    {currentStep === 2 && (
                      <div className="space-y-6">
                        {/* Section Header Banner */}
                        <div className="border-b border-slate-900 pb-3 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Section 2 — Party Information</span>
                          <button 
                            type="button" 
                            onClick={() => setActiveHelpField(activeHelpField === 'clientName' ? null : 'clientName')}
                            className="text-slate-500 hover:text-white"
                          >
                            <HelpCircle className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <h2 className="text-xl font-bold text-white tracking-tight">Party Details</h2>
                          <p className="text-slate-400 text-xs leading-normal">Enter registered business details for the client entity and professional address details for the contractor.</p>
                        </div>

                        {/* Client Selector (Workspace) */}
                        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/20 space-y-4">
                          <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Client Workspace Association</span>
                            <button
                              type="button"
                              onClick={() => setShowCreateClientModal(true)}
                              className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider bg-indigo-500/5 border border-indigo-500/15 px-2.5 py-1 rounded transition-all hover:scale-105"
                            >
                              + New Client
                            </button>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase block">Associate Agreement With Client</label>
                            <select
                              value={selectedClientId}
                              onChange={(e) => {
                                const cid = e.target.value;
                                setSelectedClientId(cid);
                                if (cid) {
                                  const client = clients.find(c => c.id === cid);
                                  if (client) {
                                    setAnswers(prev => ({
                                      ...prev,
                                      clientName: client.company_name,
                                      clientAddress: client.address,
                                    }));
                                  }
                                }
                              }}
                              className="w-full rounded-xl border border-slate-855 bg-slate-950 px-4 py-3 text-sm text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/25 transition-all"
                            >
                              <option value="">-- Standalone Draft (No Workspace Association) --</option>
                              {clients.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.company_name} ({c.contact_person})
                                </option>
                              ))}
                            </select>
                          </div>
                          {clients.length > 0 && !selectedClientId && (() => {
                            const lastCid = localStorage.getItem('ld_last_client_id');
                            const lastC = clients.find(c => c.id === lastCid);
                            if (lastC) {
                              return (
                                <div className="flex justify-between items-center bg-indigo-500/5 border border-indigo-500/10 rounded-xl px-3 py-2 text-[10px] text-indigo-400">
                                  <span>Suggested recent client: <strong>{lastC.company_name}</strong></span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedClientId(lastC.id);
                                      setAnswers(prev => ({
                                        ...prev,
                                        clientName: lastC.company_name,
                                        clientAddress: lastC.address,
                                      }));
                                    }}
                                    className="font-bold underline uppercase tracking-wider text-[9px] hover:text-indigo-300"
                                  >
                                    Apply
                                  </button>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>

                        {/* Client Details */}
                        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/20 space-y-4">
                          <div className="flex justify-between items-center border-b border-slate-900 pb-2 flex-wrap gap-2">
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Client (Party A)</span>
                            <button
                              type="button"
                              onClick={() => handleAutofillProfile('client')}
                              className="text-[9px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider bg-blue-500/5 border border-blue-500/15 px-2 py-0.5 rounded transition-all hover:scale-105"
                            >
                              Autofill Profile
                            </button>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase block">Client Corporate Name</label>
                            <input
                              type="text"
                              placeholder="e.g. Acme Tech Solutions Inc"
                              value={answers.clientName}
                              onChange={(e) => handleInputChange('clientName', e.target.value)}
                              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25 focus:outline-none transition-all"
                            />
                            {!answers.clientName.trim() && (
                              <span className="text-[10px] text-slate-655 font-semibold block pt-0.5">Please enter a valid client name.</span>
                            )}
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase block">Registered Office Address</label>
                            <input
                              type="text"
                              placeholder="Full corporate headquarters address"
                              value={answers.clientAddress}
                              onChange={(e) => handleInputChange('clientAddress', e.target.value)}
                              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25 focus:outline-none transition-all"
                            />
                            {!answers.clientAddress.trim() && (
                              <span className="text-[10px] text-slate-655 font-semibold block pt-0.5">Please enter a valid client address.</span>
                            )}
                          </div>
                        </div>

                        {/* Freelancer Details */}
                        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/20 space-y-4">
                          <div className="flex justify-between items-center border-b border-slate-900 pb-2 flex-wrap gap-2">
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Freelancer / Service Provider (Party B)</span>
                            <button
                              type="button"
                              onClick={() => handleAutofillProfile('freelancer')}
                              className="text-[9px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider bg-blue-500/5 border border-blue-500/15 px-2 py-0.5 rounded transition-all hover:scale-105"
                            >
                              Autofill Profile
                            </button>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase block">Provider / Individual Name</label>
                            <input
                              type="text"
                              placeholder="e.g. Jane Doe"
                              value={answers.freelancerName}
                              onChange={(e) => handleInputChange('freelancerName', e.target.value)}
                              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25 focus:outline-none transition-all"
                            />
                            {!answers.freelancerName.trim() && (
                              <span className="text-[10px] text-slate-655 font-semibold block pt-0.5">Please enter a valid freelancer name.</span>
                            )}
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase block">Billing / Residential Address</label>
                            <input
                              type="text"
                              placeholder="Full professional postal address"
                              value={answers.freelancerAddress}
                              onChange={(e) => handleInputChange('freelancerAddress', e.target.value)}
                              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25 focus:outline-none transition-all"
                            />
                            {!answers.freelancerAddress.trim() && (
                              <span className="text-[10px] text-slate-655 font-semibold block pt-0.5">Please enter a valid freelancer address.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {currentStep === 3 && (
                      <div className="space-y-6">
                        {/* Section Header Banner */}
                        <div className="border-b border-slate-900 pb-3 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Section 3 — Purpose & Deliverables</span>
                          <button 
                            type="button" 
                            onClick={() => setActiveHelpField(activeHelpField === 'scopeOfWork' ? null : 'scopeOfWork')}
                            className="text-slate-500 hover:text-white"
                          >
                            <HelpCircle className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <h2 className="text-xl font-bold text-white tracking-tight">Scope of Work & Deliverables</h2>
                          <p className="text-slate-400 text-xs leading-normal">Describe in clear detail the specific tasks, development duties, project stages, and final deliverables expected.</p>
                        </div>

                        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-955/20 space-y-4">
                          <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Define Scope / Deliverables List</label>
                          <textarea
                            rows={5}
                            placeholder="e.g. Design of high-fidelity Figma visual systems, coding React dashboard widgets, and deploying code assets to AWS cloud servers"
                            value={answers.scopeOfWork}
                            onChange={(e) => handleInputChange('scopeOfWork', e.target.value)}
                            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25 focus:outline-none transition-all resize-none"
                          />
                          <div className="flex justify-between items-center text-[10px] text-slate-500">
                            <span>Min. 5 characters required</span>
                            <span>{(answers.scopeOfWork || '').length} chars entered</span>
                          </div>
                          {(answers.scopeOfWork || '').trim().length < 5 && (
                            <span className="text-[10px] text-slate-655 font-semibold block mt-1">Please enter a valid, detailed work scope.</span>
                          )}
                        </div>
                      </div>
                    )}

                    {currentStep === 4 && (
                      <div className="space-y-6">
                        {/* Section Header Banner */}
                        <div className="border-b border-slate-900 pb-3 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Section 4 — Payment Terms</span>
                          <button 
                            type="button" 
                            onClick={() => setActiveHelpField(activeHelpField === 'paymentAmount' ? null : 'paymentAmount')}
                            className="text-slate-500 hover:text-white"
                          >
                            <HelpCircle className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <h2 className="text-xl font-bold text-white tracking-tight">Payment Terms & Schedules</h2>
                          <p className="text-slate-400 text-xs leading-normal">Specify the client contract amount and select the milestone or billing cycle schedule.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 rounded-2xl border border-slate-900 bg-slate-955/20">
                          {/* Payment Amount */}
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Contract Amount (₹)</span>
                            <input
                              type="number"
                              placeholder="e.g. 75000"
                              value={answers.paymentAmount}
                              onChange={(e) => handleInputChange('paymentAmount', e.target.value)}
                              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25 focus:outline-none transition-all"
                            />
                            {!answers.paymentAmount && (
                              <span className="text-[10px] text-slate-655 font-semibold block pt-0.5">Please define a valid contract amount in INR.</span>
                            )}
                          </div>

                          {/* Payment Schedule */}
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-500 font-bold uppercase block">Billing Schedule</span>
                            <select
                              value={answers.paymentSchedule}
                              onChange={(e) => {
                                handleInputChange('paymentSchedule', e.target.value);
                                if (e.target.value !== 'milestone') {
                                  handleInputChange('milestones', []);
                                }
                              }}
                              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25 focus:outline-none transition-all appearance-none cursor-pointer"
                            >
                              <option value="one-time">One-time payment upon completion</option>
                              <option value="milestone">Milestone-based billing</option>
                              <option value="recurring">Recurring weekly/monthly billing</option>
                            </select>
                          </div>
                        </div>

                        {/* Milestone listing */}
                        {answers.paymentSchedule === 'milestone' && (
                          <div className="space-y-4 border border-slate-900 rounded-2xl p-5 bg-slate-950/20">
                            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Milestone Breakdown</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentMilestones = answers.milestones || [];
                                  handleInputChange('milestones', [...currentMilestones, { description: '', dueDate: '', amount: '' }]);
                                }}
                                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase bg-blue-600/10 text-blue-400 border border-blue-500/15 px-3 py-1.5 rounded-lg hover:bg-blue-600/20 transition-colors"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Add Milestone
                              </button>
                            </div>

                            {(answers.milestones || []).length === 0 ? (
                              <p className="text-slate-500 text-xs py-4 text-center">No milestones added yet. Add at least one milestone.</p>
                            ) : (
                              <div className="space-y-4">
                                {(answers.milestones || []).map((m, index) => (
                                  <div key={index} className="flex flex-col sm:flex-row gap-3 items-end border border-slate-900/60 bg-slate-900/5 p-4 rounded-xl relative">
                                    <div className="flex-1 w-full space-y-1">
                                      <label className="text-[9px] text-slate-500 font-bold uppercase block">Description</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. wireframes / beta launch"
                                        value={m.description}
                                        onChange={(e) => {
                                          const list = [...answers.milestones];
                                          list[index].description = e.target.value;
                                          handleInputChange('milestones', list);
                                        }}
                                        className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-700 focus:border-blue-500 focus:outline-none transition-all"
                                      />
                                    </div>
                                    <div className="w-full sm:w-36 space-y-1">
                                      <label className="text-[9px] text-slate-500 font-bold uppercase block">Due Date</label>
                                      <input
                                        type="date"
                                        value={m.dueDate}
                                        onChange={(e) => {
                                          const list = [...answers.milestones];
                                          list[index].dueDate = e.target.value;
                                          handleInputChange('milestones', list);
                                        }}
                                        className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none transition-all"
                                      />
                                    </div>
                                    <div className="w-full sm:w-28 space-y-1">
                                      <label className="text-[9px] text-slate-500 font-bold uppercase block">Amount (₹)</label>
                                      <input
                                        type="number"
                                        placeholder="0"
                                        value={m.amount}
                                        onChange={(e) => {
                                          const list = [...answers.milestones];
                                          list[index].amount = e.target.value;
                                          handleInputChange('milestones', list);
                                        }}
                                        className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none transition-all"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const list = (answers.milestones || []).filter((_, i) => i !== index);
                                        handleInputChange('milestones', list);
                                      }}
                                      className="text-rose-400 hover:text-rose-300 p-2.5 border border-slate-850 rounded-lg bg-slate-950 hover:bg-slate-900 transition-colors ml-auto sm:ml-0"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Milestone Sum Validation Status */}
                            {(() => {
                              const sum = (answers.milestones || []).reduce((acc, m) => acc + Number(m.amount || 0), 0);
                              const total = Number(answers.paymentAmount || 0);
                              const isMatch = Math.abs(sum - total) < 0.01;

                              return (
                                <div className={`text-xs p-3.5 rounded-xl border flex items-center justify-between mt-4 ${
                                  isMatch 
                                    ? 'bg-emerald-950/10 border-emerald-900/40 text-emerald-400' 
                                    : 'bg-amber-950/10 border-amber-900/40 text-amber-500'
                                }`}>
                                  <div>
                                    <span>Milestones Sum: <strong>₹{sum}</strong></span>
                                    <span className="mx-2">|</span>
                                    <span>Contract Total: <strong>₹{total}</strong></span>
                                  </div>
                                  <span className="font-bold">
                                    {isMatch ? '✓ Matches' : '⚠️ Must Equal Contract Total'}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}

                    {currentStep === 5 && (
                      <div className="space-y-6">
                        {/* Section Header Banner */}
                        <div className="border-b border-slate-900 pb-3 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Section 5 — Term & Jurisdiction</span>
                          <button 
                            type="button" 
                            onClick={() => setActiveHelpField(activeHelpField === 'terminationNoticePeriod' ? null : 'terminationNoticePeriod')}
                            className="text-slate-500 hover:text-white"
                          >
                            <HelpCircle className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <h2 className="text-xl font-bold text-white tracking-tight">Term & Governance</h2>
                          <p className="text-slate-400 text-xs leading-normal">Establish notice durations for contract termination, effective starting dates, and dispute resolutions.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 rounded-2xl border border-slate-900 bg-slate-950/20">
                          {/* Notice Period */}
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-500 font-bold uppercase block">Termination Notice Period (Days)</span>
                            <input
                              type="number"
                              value={answers.terminationNoticePeriod}
                              onChange={(e) => handleInputChange('terminationNoticePeriod', e.target.value)}
                              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25 focus:outline-none transition-all"
                            />
                            {!answers.terminationNoticePeriod && (
                              <span className="text-[10px] text-slate-655 font-semibold block pt-0.5">Please define a termination notice period.</span>
                            )}
                          </div>

                          {/* Effective Date */}
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-500 font-bold uppercase block">Agreement Effective Date</span>
                            <input
                              type="date"
                              value={answers.effectiveDate}
                              onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
                               className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25 focus:outline-none transition-all"
                            />
                            {!answers.effectiveDate && (
                              <span className="text-[10px] text-slate-655 font-semibold block pt-0.5">Please specify a contract start date.</span>
                            )}
                          </div>
                        </div>

                        {/* Governing Jurisdiction */}
                        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/20 space-y-2">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Governing Jurisdiction State (India)</span>
                          <select
                            value={answers.governingJurisdiction}
                            onChange={(e) => handleInputChange('governingJurisdiction', e.target.value)}
                            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25 focus:outline-none transition-all appearance-none cursor-pointer"
                          >
                            {INDIAN_STATES.map((state) => (
                              <option key={state} value={state}>
                                {state}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                       {!selectedWorkflow && currentStep === 6 && (
                      <div className="space-y-6 animate-fade-in">
                        {/* Section Header Banner */}
                        <div className="border-b border-slate-900 pb-3 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Section 6 — Review & Checkout</span>
                          <button 
                            type="button" 
                            onClick={() => setActiveHelpField(activeHelpField === 'docType' ? null : 'docType')}
                            className="text-slate-500 hover:text-white"
                          >
                            <HelpCircle className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <h2 className="text-xl font-bold text-white tracking-tight">Review Service Agreement Parameters</h2>
                          <p className="text-slate-400 text-xs leading-normal">Inspect compiled agreement details before executing payment and generating PDF contracts.</p>
                        </div>

                        <div className="space-y-4">
                          
                          {/* Parameter Group A */}
                          <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-5 space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Contract Specifications</span>
                              <button
                                type="button"
                                onClick={() => setCurrentStep(4)}
                                className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider bg-slate-900/50 hover:bg-slate-900 border border-slate-800 px-2 py-1 rounded"
                              >
                                Edit Terms
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider">Agreement Classification</span>
                                <span className="font-semibold text-white mt-0.5 block">Freelance Service Agreement</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider">Billing Model</span>
                                <span className="font-semibold text-white capitalize mt-0.5 block">{answers.paymentSchedule} payment</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider">Contract Start Date</span>
                                <span className="font-semibold text-white mt-0.5 block">{answers.effectiveDate || 'Immediate'}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider">Termination Notice Duration</span>
                                <span className="font-semibold text-white mt-0.5 block">{answers.terminationNoticePeriod} Days</span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider">Governing State Rules</span>
                                <span className="font-semibold text-white mt-0.5 block">{answers.governingJurisdiction}, India</span>
                              </div>
                            </div>
                          </div>

                          {/* Parameter Group B */}
                          <div className="rounded-2xl border border-slate-900 bg-slate-955/20 p-5 space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Contracting Parties</span>
                              <button
                                type="button"
                                onClick={() => setCurrentStep(2)}
                                className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider bg-slate-900/50 hover:bg-slate-900 border border-slate-800 px-2 py-1 rounded"
                              >
                                Edit Parties
                              </button>
                            </div>
                            <div className="space-y-3 text-xs">
                              <div>
                                <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider">Client (Party A)</span>
                                <span className="font-semibold text-white mt-0.5 block">{answers.clientName}</span>
                                <span className="text-slate-400 text-[10px] mt-0.5 block leading-normal">{answers.clientAddress}</span>
                              </div>
                              <div className="border-t border-slate-900 pt-2">
                                <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider">Freelancer (Party B)</span>
                                <span className="font-semibold text-white mt-0.5 block">{answers.freelancerName}</span>
                                <span className="text-slate-400 text-[10px] mt-0.5 block leading-normal">{answers.freelancerAddress}</span>
                              </div>
                            </div>
                          </div>

                          {/* Parameter Group C */}
                          <div className="rounded-2xl border border-slate-900 bg-slate-955/20 p-5 space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Agreement Deliverables</span>
                              <button
                                type="button"
                                onClick={() => setCurrentStep(3)}
                                className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider bg-slate-900/50 hover:bg-slate-900 border border-slate-800 px-2 py-1 rounded"
                              >
                                Edit Scope
                              </button>
                            </div>
                            <p className="text-xs text-slate-350 leading-relaxed font-semibold italic">
                              "{answers.scopeOfWork}"
                            </p>
                          </div>

                          {/* Milestones Panel */}
                          {answers.paymentSchedule === 'milestone' && (
                            <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-5 space-y-3">
                              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Milestone Payments</span>
                                <button
                                  type="button"
                                  onClick={() => setCurrentStep(4)}
                                  className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider bg-slate-900/50 hover:bg-slate-900 border border-slate-800 px-2 py-1 rounded"
                                >
                                  Edit Milestones
                                </button>
                              </div>
                              <div className="space-y-1.5 text-xs">
                                {(answers.milestones || []).map((m, i) => (
                                  <div key={i} className="flex justify-between text-slate-300 border-b border-slate-900/60 pb-1.5 last:border-b-0">
                                    <span>{i + 1}. {m.description} (Due: {m.dueDate})</span>
                                    <span className="font-bold text-white">₹{m.amount}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Email Capture & Payment/Bundle Configuration */}
                        <div className="border border-slate-900 bg-slate-955/20 rounded-2xl p-5 space-y-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                              Your Delivery & Account Email
                            </label>
                            <input
                              type="email"
                              placeholder="e.g. founder@mycompany.co"
                              value={userEmail}
                              onChange={(e) => {
                                setUserEmail(e.target.value);
                                checkCredits(e.target.value);
                              }}
                              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25 focus:outline-none transition-all"
                              required
                            />
                            {!userEmail.includes('@') && (
                              <span className="text-[10px] text-slate-655 font-semibold block pt-0.5">Please provide a valid delivery email.</span>
                            )}
                          </div>

                          {userCredits > 0 ? (
                            <div className="bg-emerald-950/20 border border-emerald-900/40 p-4 rounded-xl flex items-center justify-between text-xs">
                              <div>
                                <span className="font-semibold text-emerald-450 block">🎉 Unused Credits Available!</span>
                                <span className="text-slate-450 mt-0.5 block">We detected {userCredits} active credits linked to your account.</span>
                              </div>
                              <button
                                type="button"
                                onClick={handleGenerateWithCredit}
                                className="rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors px-4 py-2 font-bold text-white shadow"
                              >
                                Use 1 Credit
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                Select Purchase Plan
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div
                                  onClick={() => setCheckoutMode('single')}
                                  className={`cursor-pointer rounded-xl border p-4 flex flex-col justify-between transition-all ${
                                    checkoutMode === 'single'
                                      ? 'border-blue-500 bg-blue-500/10'
                                      : 'border-slate-850 bg-slate-955/30 hover:border-slate-800'
                                  }`}
                                >
                                  <span className="font-bold text-xs text-white">Single Document</span>
                                  <span className="text-[10px] text-slate-400 mt-1">₹199 per generation</span>
                                </div>
                                <div
                                  onClick={() => setCheckoutMode('bundle')}
                                  className={`cursor-pointer rounded-xl border p-4 flex flex-col justify-between transition-all ${
                                    checkoutMode === 'bundle'
                                      ? 'border-blue-500 bg-blue-500/10'
                                      : 'border-slate-850 bg-slate-955/30 hover:border-slate-800'
                                  }`}
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-xs text-white">3-Doc Bundle</span>
                                    <span className="bg-blue-600/30 text-blue-400 font-bold text-[8px] px-1 rounded uppercase tracking-wider">Save 15%</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 mt-1">₹499 (credits never expire)</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* DYNAMIC WORKFLOW STEP 6: PARAMETERS REVIEW & INLINE EDITING */}
                {selectedWorkflow && currentStep === 6 && (
                  <div className="space-y-6 animate-fade-in text-left">
                    <div className="space-y-1">
                      <h2 className="text-xl font-bold text-white tracking-tight">Review & Edit Parameters</h2>
                      <p className="text-slate-400 text-xs leading-normal">
                        Verify and refine your questionnaire responses inline directly before compiling.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {selectedWorkflow.question_set.map((stepConfig: any) => {
                        const activeFields = stepConfig.fields.filter((field: any) => {
                          if (field.conditionalOn) {
                            const val = (answers as any)[field.conditionalOn];
                            return String(val).toLowerCase() === String(field.conditionValue).toLowerCase();
                          }
                          return true;
                        });

                        if (activeFields.length === 0) return null;

                        return (
                          <div key={stepConfig.step} className="rounded-2xl border border-slate-900 bg-slate-950/20 p-5 space-y-4 text-left">
                            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">{stepConfig.title}</span>
                              <button
                                type="button"
                                onClick={() => setCurrentStep(stepConfig.step)}
                                className="text-[10px] font-bold text-slate-450 hover:text-white uppercase tracking-wider bg-slate-900/50 hover:bg-slate-900 border border-slate-800 px-2.5 py-1 rounded transition-colors cursor-pointer"
                              >
                                Edit Step
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {activeFields.map((field: any) => (
                                <div key={field.id} className="space-y-1.5 text-xs">
                                  <label className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider">
                                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                                  </label>
                                  
                                  {field.type === 'textarea' ? (
                                    <textarea
                                      value={(answers as any)[field.id] || ''}
                                      onChange={(e) => handleInputChange(field.id as any, e.target.value)}
                                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none transition-all resize-none sm:col-span-2"
                                      rows={2}
                                    />
                                  ) : field.type === 'select' ? (
                                    <select
                                      value={(answers as any)[field.id] || ''}
                                      onChange={(e) => handleInputChange(field.id as any, e.target.value)}
                                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none transition-all cursor-pointer"
                                    >
                                      <option value="">-- Select option --</option>
                                      {field.options.map((opt: string) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                      value={(answers as any)[field.id] || ''}
                                      onChange={(e) => handleInputChange(field.id as any, e.target.value)}
                                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none transition-all"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Error logs */}
              {(apiError || consistencyErrors.length > 0) && (
                <div className="mt-6 border border-rose-950 bg-rose-950/10 rounded-xl p-4 space-y-2 text-rose-400 text-xs">
                  <div className="flex gap-2 items-center font-bold">
                    <ShieldAlert className="h-4 w-4" />
                    <span>Generation Failed</span>
                  </div>
                  {apiError && <p className="leading-relaxed">{apiError}</p>}
                  {consistencyErrors.length > 0 && (
                    <ul className="list-disc list-inside space-y-1 pl-1">
                      {consistencyErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Wizard Navigation */}
              <div className="flex justify-between items-center border-t border-slate-900 pt-6 mt-8">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-450 hover:text-white hover:border-slate-700 transition-all active:scale-95"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    Reset Questionnaire
                  </button>
                )}

                {currentStep < 6 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-blue-500 transition-all ml-auto active:scale-95"
                  >
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  userCredits === 0 && (
                    <button
                      type="button"
                      onClick={handleCheckout}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-650 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg hover:from-blue-500 hover:to-indigo-500 transition-all transform hover:scale-102 active:scale-95 ml-auto"
                    >
                      {checkoutMode === 'bundle' ? 'Pay ₹499 & Accrue Credits' : 'Pay ₹199 & Generate'}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Help Sidebar or PDF Preview Workspace */}
        <div className={`rounded-2xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm space-y-4 transition-all ${
          documentUrl ? 'lg:col-span-1 border-slate-800bg-slate-950/20' : ''
        }`}>
          {documentUrl ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between font-bold text-slate-350 text-xs border-b border-slate-900 pb-3 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-blue-500 animate-pulse" /> 
                  Document Preview
                </span>
                
                {/* Zoom Controls */}
                <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-900 rounded-lg p-1">
                  <button 
                    type="button"
                    onClick={() => setPdfZoom(prev => Math.max(50, prev - 10))}
                    className="h-6 w-6 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold transition-colors"
                    title="Zoom Out"
                  >
                    -
                  </button>
                  <span className="text-[10px] font-mono text-slate-400 px-1">{pdfZoom}%</span>
                  <button 
                    type="button"
                    onClick={() => setPdfZoom(prev => Math.min(150, prev + 10))}
                    className="h-6 w-6 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold transition-colors"
                    title="Zoom In"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* PDF Viewer Frame */}
              <div className="relative border border-slate-900 bg-slate-955/20 rounded-xl overflow-hidden min-h-[480px] flex items-center justify-center">
                {!pdfLoaded && (
                  <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center space-y-4 p-8 animate-pulse z-10">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Loading Preview...</span>
                    
                    {/* Mock document skeletons */}
                    <div className="w-full space-y-3 pt-6">
                      <div className="h-3 bg-slate-900/60 rounded w-3/4 mx-auto"></div>
                      <div className="h-2 bg-slate-900/40 rounded w-5/6 mx-auto"></div>
                      <div className="h-2 bg-slate-900/40 rounded w-2/3 mx-auto"></div>
                      <div className="h-2 bg-slate-900/40 rounded w-4/5 mx-auto"></div>
                    </div>
                  </div>
                )}
                <iframe
                  src={esignStatus === 'SIGNED' ? `${documentUrl}?signed=true#toolbar=0` : `${documentUrl}#toolbar=0`}
                  onLoad={() => setPdfLoaded(true)}
                  className="w-full h-[520px] rounded-xl border-none transition-all duration-300"
                  style={{ transform: `scale(${pdfZoom / 100})`, transformOrigin: 'top center' }}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Calculations Block */}
              {(() => {
                // 1. Gather sanity warnings
                const warnings: string[] = [];
                if (answers.docType === 'nda') {
                  if (!answers.disclosingParty?.trim()) warnings.push('Missing Disclosing Party (Party A) Name');
                  if (!answers.receivingParty?.trim()) warnings.push('Missing Receiving Party (Party B) Name');
                  if (!answers.purpose?.trim()) warnings.push('NDA Purpose is not specified');
                  if (answers.confidentialityTerm && Number(answers.confidentialityTerm) < 12) {
                    warnings.push('Risk: Confidentiality term is less than 12 months (Standard is 24-36 months).');
                  }
                } else if (answers.docType === 'service_agreement') {
                  if (!answers.clientName?.trim()) warnings.push('Missing Client Name');
                  if (!answers.freelancerName?.trim()) warnings.push('Missing Freelancer Name');
                  if (!answers.scopeOfWork?.trim()) warnings.push('Scope of Work description is empty');
                  if (answers.paymentAmount && Number(answers.paymentAmount) < 5000) {
                    warnings.push('Alert: Total payment is under ₹5,000. Double check currency.');
                  }
                  if (answers.paymentSchedule === 'milestone') {
                    const sum = (answers.milestones || []).reduce((acc: number, m: any) => acc + (Number(m.amount) || 0), 0);
                    if (answers.paymentAmount && sum !== Number(answers.paymentAmount)) {
                      warnings.push(`Chronology: Milestone sum (₹${sum}) does not match Total contract amount (₹${answers.paymentAmount}).`);
                    }
                  }
                }

                // 2. Explainer Content
                let explainerTitle = 'Clause Explainer';
                let explainerText = 'Click the (?) icon next to any input field or browse current step guidelines below.';
                if (activeHelpField) {
                  explainerTitle = `About ${activeHelpField.replace(/([A-Z])/g, ' $1')}`;
                  explainerText = getFieldHelpText(activeHelpField);
                } else {
                  if (answers.docType === 'nda') {
                    if (currentStep === 1) {
                      explainerTitle = 'Agreement Type Selection';
                      explainerText = 'Select NDA to protect secrets or Service Agreement for contracting work. NDAs bind party confidentiality, while service contracts map IP, milestones, and deliverables.';
                    } else if (currentStep === 2) {
                      explainerTitle = 'NDA Mutual vs Unilateral Selection';
                      explainerText = 'Mutual NDA restricts both parties from leaking shared secrets. Unilateral (one-way) NDA only binds the receiving party, typical for employee hires or raw vendor pitch reviews.';
                    } else if (currentStep === 3) {
                      explainerTitle = 'Entity Names & Addresses';
                      explainerText = 'Ensure entity names match official registry certificates (GSTIN, MCA, or Aadhaar). Typos here can invalidate the contract execution under Indian Jurisdictions.';
                    } else if (currentStep === 4) {
                      explainerTitle = 'Purpose of NDA';
                      explainerText = 'The "Purpose" acts as the boundary. Leaking secrets outside this specific scope breaches the NDA. Keep this objective and aligned with your conversation goals.';
                    } else if (currentStep === 5) {
                      explainerTitle = 'Confidentiality Term & Jurisdiction';
                      explainerText = 'Term determines how long the NDA boundary outlives the relationship. Jurisdiction state sets the local court where legal actions are initiated in case of breach.';
                    } else if (currentStep === 6) {
                      explainerTitle = 'Sanity Checks & compilation';
                      explainerText = 'Review dates, pricing tier, and entities. Ensure active flags are checked before generating.';
                    }
                  } else if (answers.docType === 'service_agreement') {
                    if (currentStep === 2) {
                      explainerTitle = 'Client vs Provider Details';
                      explainerText = 'Clearly identify the hiring party (Client) and the developer/designer (Freelancer). Essential for defining the contractor-client relationship.';
                    } else if (currentStep === 3) {
                      explainerTitle = 'Scope & Milestones';
                      explainerText = 'Spell out deliverables to prevent scope creep. Vague scopes result in unbilled revision requests.';
                    } else if (currentStep === 4) {
                      explainerTitle = 'Financial terms & cycles';
                      explainerText = 'Define total payouts and schedule modes (fixed vs hourly). For milestones, verify that payouts matches contract totals.';
                    } else if (currentStep === 5) {
                      explainerTitle = 'IP Ownership & Terminations';
                      explainerText = 'IP should shift to Client upon full payment received. Termination notice days specifies the separation notice required (typically 15-30 days).';
                    } else if (currentStep === 6) {
                      explainerTitle = 'Final Compilation Checklist';
                      explainerText = 'Double check payment terms, bank coordinates if any, and signatures.';
                    }
                  }
                }

                // 3. Contract Summary
                let summaryText = 'Provide values to view the real-time contract brief.';
                if (answers.docType === 'nda') {
                  summaryText = `This is a ${answers.ndaType || '[NDA Type]'} Non-Disclosure Agreement between Disclosing Party ${answers.disclosingParty || '[Disclosing Party]'} and Receiving Party ${answers.receivingParty || '[Receiving Party]'}. Secrets shared specifically for the purpose of "${answers.purpose || '[Purpose]'}" shall remain confidential for a duration of ${answers.confidentialityTerm || '[Term]'} months. Any legal disputes will be governed under the laws of ${answers.governingJurisdiction || '[State]'}.`;
                } else if (answers.docType === 'service_agreement') {
                  summaryText = `This is a Service Provider Agreement between Client ${answers.clientName || '[Client]'} and Freelancer ${answers.freelancerName || '[Freelancer]'}. Freelancer will deliver "${answers.scopeOfWork || '[Scope]'}" for a total fixed compensation of ₹${answers.paymentAmount || '[Amount]'} to be paid as per ${answers.paymentSchedule || '[Cycle]'} terms. Upon receipt of full payment, all intellectual property is transferred to the Client. Governed by the laws of ${answers.governingJurisdiction || '[State]'}.`;
                }

                // 4. Compare variants content
                let compareHeading = '';
                let compareBody = '';
                if (answers.docType === 'nda') {
                  compareHeading = 'Mutual vs. Unilateral NDAs';
                  compareBody = '• Mutual NDA: Both parties share sensitive trade secrets, and both are equally bound from disclosing them. Recommended for mergers, joint tech exploration, and strategic partnerships. \n\n• Unilateral NDA: Only one party shares sensitive data (e.g. client sharing project credentials with a contractor). Only the receiver is restricted. Recommended for hiring, vendor audits, and employee onboarding.';
                } else {
                  compareHeading = 'Fixed Price vs Retainer Billing';
                  compareBody = '• Fixed Price: Payment is tied to specific deliverables or milestones. Best for projects with clear, defined scopes and deadlines. Protects clients from budget overruns.\n\n• Retainer / Time-Based: Payment is recurrent (monthly/hourly) for ongoing work. Best for agile, shifting scopes or continuous support arrangements.';
                }

                if (currentStep === 6) {
                  if (selectedWorkflow) {
                    const score = auditResult?.readinessScore ?? 100;
                    const breakdown = auditResult?.breakdown ?? { completeness: 100, legalCoverage: 100, businessProtection: 100 };
                    const warningsList = auditResult?.warnings ?? [];
                    const recsList = auditResult?.recommendations ?? [];
                    const pages = auditResult?.estimatedPages ?? 8;
                    const time = auditResult?.readingTime ?? 12;
                    const recDocs = auditResult?.recommendedDocs ?? [];

                    return (
                      <div className="space-y-6 text-left animate-fade-in bg-slate-950/20 border border-slate-900 rounded-2xl p-5">
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Document Type</span>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            <CheckCircle2 className="h-4.5 w-4.5 text-blue-500 animate-pulse" />
                            <span>{selectedWorkflow.name}</span>
                          </div>
                        </div>

                        <div className="border-t border-slate-900 my-4" />

                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Overall Readiness</span>
                          <div className="flex items-center gap-4">
                            <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                              {score}%
                            </span>
                            <div className="flex-grow">
                              <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-900">
                                <div 
                                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-1000"
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-2 text-[10px]">
                            <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-900/60">
                              <span className="text-slate-500 block uppercase font-bold text-[8px]">Completeness</span>
                              <span className="font-bold text-white mt-0.5 block">{breakdown.completeness}%</span>
                            </div>
                            <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-900/60">
                              <span className="text-slate-500 block uppercase font-bold text-[8px]">Legal Coverage</span>
                              <span className="font-bold text-white mt-0.5 block">{breakdown.legalCoverage}%</span>
                            </div>
                            <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-900/60">
                              <span className="text-slate-500 block uppercase font-bold text-[8px]">Protection</span>
                              <span className="font-bold text-white mt-0.5 block">{breakdown.businessProtection}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-slate-900 my-4" />

                        <div className="space-y-3">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">AI Review & Audits</span>
                          {auditLoading ? (
                            <div className="flex items-center gap-2 text-slate-500 text-xs py-2">
                              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                              <span>Updating legal audits...</span>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {warningsList.map((w: string, idx: number) => (
                                <div key={`w-${idx}`} className="rounded-xl border border-rose-500/10 bg-rose-500/5 text-rose-450 p-3 flex items-start gap-2.5">
                                  <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0 mt-0.5 text-rose-500" />
                                  <span className="text-[11px] font-semibold leading-normal">{w}</span>
                                </div>
                              ))}

                              {recsList.map((r: string, idx: number) => (
                                <div key={`r-${idx}`} className="rounded-xl border border-amber-500/10 bg-amber-500/5 text-amber-500 p-3 flex items-start gap-2.5">
                                  <AlertTriangle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5 text-amber-500" />
                                  <span className="text-[11px] font-semibold leading-normal">{r}</span>
                                </div>
                              ))}

                              {warningsList.length === 0 && recsList.length === 0 && (
                                <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 text-emerald-450 p-3 flex items-start gap-2.5">
                                  <CheckCircle2 className="h-4.5 w-4.5 flex-shrink-0 mt-0.5 text-emerald-450" />
                                  <span className="text-[11px] font-semibold leading-normal">All dynamic audits passed. Ready for generation.</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="border-t border-slate-900 my-4" />

                        <div className="grid grid-cols-2 gap-4">
                          <div className="rounded-xl border border-slate-900 bg-slate-955/40 p-4">
                            <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Estimated PDF</span>
                            <span className="text-lg font-bold text-white mt-1 block">{pages} Pages</span>
                          </div>
                          <div className="rounded-xl border border-slate-900 bg-slate-955/40 p-4">
                            <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Reading Time</span>
                            <span className="text-lg font-bold text-white mt-1 block">{time} Minutes</span>
                          </div>
                        </div>

                        <div className="border-t border-slate-900 my-4" />

                        {recDocs.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Recommended Documents</span>
                            <ul className="space-y-1.5 pl-1">
                              {recDocs.map((doc: string, index: number) => (
                                <li key={index} className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                                  <span className="text-indigo-400 text-base leading-none">•</span>
                                  <span>{doc.replace('_', ' ')}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="border-t border-slate-900 my-4" />

                        <div className="pt-2">
                          {userCredits > 0 ? (
                            <button
                              type="button"
                              onClick={handleGenerateWithCredit}
                              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-650 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg hover:from-emerald-500 hover:to-teal-500 transition-all transform hover:scale-102 active:scale-95 cursor-pointer"
                            >
                              <Sparkles className="h-4 w-4" />
                              Generate with 1 Credit
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleCheckout}
                              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-650 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg hover:from-blue-500 hover:to-indigo-500 transition-all transform hover:scale-102 active:scale-95 cursor-pointer"
                            >
                              <Sparkles className="h-4 w-4" />
                              Generate Document
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }

                  const reviewItems: { text: string; status: 'success' | 'warn' }[] = [];
                  let readinessScore = 100;
                  
                  if (answers.docType === 'nda') {
                    const hasParties = !!(answers.disclosingParty || '').trim() && !!(answers.receivingParty || '').trim();
                    const hasDuration = !!answers.confidentialityTerm;
                    const hasPurpose = !!(answers.purpose || '').trim() && (answers.purpose || '').trim().length >= 5;
                    const hasEffectiveDate = !!answers.effectiveDate;
                    const hasJurisdiction = !!answers.governingJurisdiction;

                    reviewItems.push({
                      text: (hasParties && hasDuration && hasPurpose && hasEffectiveDate && hasJurisdiction)
                        ? 'All required information provided'
                        : 'Provide all required questionnaire information',
                      status: (hasParties && hasDuration && hasPurpose && hasEffectiveDate && hasJurisdiction) ? 'success' : 'warn'
                    });

                    reviewItems.push({
                      text: 'Both parties identified',
                      status: hasParties ? 'success' : 'warn'
                    });

                    reviewItems.push({
                      text: 'Duration specified',
                      status: hasDuration ? 'success' : 'warn'
                    });

                    reviewItems.push({
                      text: 'Consider adding a Non-Solicitation Clause',
                      status: 'warn'
                    });

                    reviewItems.push({
                      text: 'Consider narrowing the definition of Confidential Information',
                      status: 'warn'
                    });

                    if (!hasParties) readinessScore -= 10;
                    if (!hasDuration) readinessScore -= 10;
                    if (!hasPurpose) readinessScore -= 10;
                    if (!hasEffectiveDate) readinessScore -= 10;
                    if (!hasJurisdiction) readinessScore -= 10;
                    
                    readinessScore -= 6;
                  } else {
                    const hasParties = !!(answers.clientName || '').trim() && !!(answers.freelancerName || '').trim();
                    const hasScope = !!(answers.scopeOfWork || '').trim() && (answers.scopeOfWork || '').trim().length >= 5;
                    const hasPayment = !!answers.paymentAmount && Number(answers.paymentAmount) > 0;
                    const hasEffectiveDate = !!answers.effectiveDate;
                    const hasNotice = !!answers.terminationNoticePeriod;
                    const hasJurisdiction = !!answers.governingJurisdiction;

                    reviewItems.push({
                      text: (hasParties && hasScope && hasPayment && hasEffectiveDate && hasNotice && hasJurisdiction)
                        ? 'All required information provided'
                        : 'Provide all required questionnaire information',
                      status: (hasParties && hasScope && hasPayment && hasEffectiveDate && hasNotice && hasJurisdiction) ? 'success' : 'warn'
                    });

                    reviewItems.push({
                      text: 'Scope of work defined',
                      status: hasScope ? 'success' : 'warn'
                    });

                    reviewItems.push({
                      text: 'Payment terms configured',
                      status: hasPayment ? 'success' : 'warn'
                    });

                    reviewItems.push({
                      text: 'Consider adding an Intellectual Property (IP) Assignment Clause',
                      status: 'warn'
                    });

                    reviewItems.push({
                      text: 'Consider adding a Non-Compete Clause',
                      status: 'warn'
                    });

                    if (!hasParties) readinessScore -= 10;
                    if (!hasScope) readinessScore -= 10;
                    if (!hasPayment) readinessScore -= 10;
                    if (!hasEffectiveDate) readinessScore -= 10;
                    if (!hasNotice) readinessScore -= 10;
                    if (!hasJurisdiction) readinessScore -= 10;

                    readinessScore -= 6;
                  }

                  readinessScore = Math.max(0, Math.min(100, readinessScore));

                  const recommendedDocs = answers.docType === 'nda'
                    ? ['Service Agreement', 'IP Assignment Agreement']
                    : ['Mutual NDA', 'IP Assignment Agreement'];

                  return (
                    <div className="space-y-6 text-left animate-fade-in bg-slate-955/20 border border-slate-900 rounded-2xl p-5">
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Document Type:</span>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          <CheckCircle2 className="h-4.5 w-4.5 text-blue-500 animate-pulse" />
                          <span>
                            {answers.docType === 'nda' 
                              ? (answers.ndaType === 'mutual' ? 'Mutual NDA' : 'Unilateral NDA') 
                              : 'Service Provider Agreement'}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-slate-900 my-4" />

                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Overall Readiness</span>
                        <div className="flex items-center gap-4">
                          <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                            {readinessScore}%
                          </span>
                          <div className="flex-grow">
                            <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-900">
                              <div 
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-1000"
                                style={{ width: `${readinessScore}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-900 my-4" />

                      <div className="space-y-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">AI Review</span>
                        <div className="space-y-2">
                          {reviewItems.map((item, index) => (
                            <div 
                              key={index}
                              className={`rounded-xl border p-3 flex items-start gap-2.5 ${
                                item.status === 'success'
                                  ? 'border-emerald-500/10 bg-emerald-500/5 text-emerald-450'
                                  : 'border-amber-500/10 bg-amber-500/5 text-amber-500'
                              }`}
                            >
                              {item.status === 'success' ? (
                                <span className="text-emerald-450 font-bold">✔</span>
                              ) : (
                                <span className="text-amber-500 font-bold">⚠</span>
                              )}
                              <span className="text-[11px] font-semibold text-slate-350 leading-normal">{item.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-slate-900 my-4" />

                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-xl border border-slate-900 bg-slate-955/40 p-4">
                          <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Estimated PDF</span>
                          <span className="text-lg font-bold text-white mt-1 block">
                            {answers.docType === 'nda' ? '8 Pages' : '10 Pages'}
                          </span>
                        </div>
                        <div className="rounded-xl border border-slate-900 bg-slate-955/40 p-4">
                          <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Reading Time</span>
                          <span className="text-lg font-bold text-white mt-1 block">
                            {answers.docType === 'nda' ? '12 Minutes' : '15 Minutes'}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-slate-900 my-4" />

                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Recommended Documents</span>
                        <ul className="space-y-1.5 pl-1">
                          {recommendedDocs.map((doc, index) => (
                            <li key={index} className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                              <span className="text-indigo-400 text-base leading-none">•</span>
                              <span>{doc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="border-t border-slate-900 my-4" />

                      <div className="pt-2">
                        {userCredits > 0 ? (
                          <button
                            type="button"
                            onClick={handleGenerateWithCredit}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-650 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg hover:from-emerald-500 hover:to-teal-500 transition-all transform hover:scale-102 active:scale-95 cursor-pointer"
                          >
                            <Sparkles className="h-4 w-4" />
                            Generate with 1 Credit
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleCheckout}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-650 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg hover:from-blue-500 hover:to-indigo-500 transition-all transform hover:scale-102 active:scale-95 cursor-pointer"
                          >
                            <Sparkles className="h-4 w-4" />
                            Generate Document
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <>
                    {/* Sidebar Header & Tab Selectors */}
                    <div className="space-y-4 border-b border-slate-900 pb-3">
                      <div className="flex items-center gap-2 font-bold text-slate-300 text-xs uppercase tracking-wider">
                        <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
                        <span>AI Lawyer copilot</span>
                      </div>

                      {/* Subtab selection pills */}
                      <div className="flex gap-1 overflow-x-auto text-[9px] uppercase font-bold tracking-wider pt-1">
                        {[
                          { id: 'explainer', label: 'Explainer' },
                          { id: 'sanity', label: 'Audits' },
                          { id: 'summary', label: 'Summary' },
                          { id: 'compare', label: 'Compare' },
                        ].map(subTab => (
                          <button
                            key={subTab.id}
                            type="button"
                            onClick={() => setAiSidebarTab(subTab.id as any)}
                            className={`px-2.5 py-1.5 rounded border transition-all whitespace-nowrap ${
                              aiSidebarTab === subTab.id
                                ? 'bg-indigo-950/30 border-indigo-500 text-indigo-455 font-extrabold shadow-sm shadow-indigo-950/20'
                                : 'bg-slate-950/40 border-slate-905 text-slate-500 hover:text-white'
                            }`}
                          >
                            {subTab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sidebar body Content viewport */}
                    <div className="min-h-[220px] text-xs leading-relaxed text-slate-400 text-left pt-2 space-y-4">
                      
                      {/* EXPLAINER TAB */}
                      {aiSidebarTab === 'explainer' && (
                        <div className="space-y-2 animate-fade-in">
                          <h4 className="font-bold text-white text-xs leading-snug">{explainerTitle}</h4>
                          <p className="text-slate-400">{explainerText}</p>
                        </div>
                      )}

                      {/* SANITY AUDITS TAB */}
                      {aiSidebarTab === 'sanity' && (
                        <div className="space-y-3 animate-fade-in">
                          <h4 className="font-bold text-white text-xs">Agreement Audit Warnings</h4>
                          {warnings.length === 0 ? (
                            <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3 flex items-start gap-2.5">
                              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-450 mt-0.5" />
                              <p className="text-[11px] text-emerald-400 font-semibold">
                                All checks passed. Fields consistent, chronologically verified, and ready for validation.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {warnings.map((w, idx) => (
                                <div 
                                  key={idx} 
                                  className={`rounded-xl border p-3 flex items-start gap-2.5 ${
                                    w.startsWith('Risk') 
                                      ? 'border-amber-500/10 bg-amber-500/5 text-amber-500' 
                                      : w.startsWith('Chronology') 
                                      ? 'border-rose-500/10 bg-rose-500/5 text-rose-450' 
                                      : 'border-slate-800 bg-slate-950/20 text-slate-450'
                                  }`}
                                >
                                  <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
                                  <span className="text-[11px] font-semibold">{w}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* CONTRACT SUMMARY TAB */}
                      {aiSidebarTab === 'summary' && (
                        <div className="space-y-2 animate-fade-in">
                          <h4 className="font-bold text-white text-xs font-semibold">Draft Agreement Overview</h4>
                          <p className="text-slate-400 leading-relaxed italic">{summaryText}</p>
                        </div>
                      )}

                      {/* COMPARE VARIANTS TAB */}
                      {aiSidebarTab === 'compare' && (
                        <div className="space-y-2.5 animate-fade-in">
                          <h4 className="font-bold text-white text-xs">{compareHeading}</h4>
                          <p className="text-slate-450 whitespace-pre-line leading-relaxed">{compareBody}</p>
                        </div>
                      )}

                    </div>
                  </>
                );
              })()}
            </>
          )}
        </div>

      </div>

      {/* Create Client Modal */}
      {showCreateClientModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl relative my-8 text-left">
            <h3 className="text-lg font-bold text-white mb-1">Create Client Workspace</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Add a new client profile. The details will automatically link to this document and populate the inputs.
            </p>

            <form onSubmit={handleCreateClientSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase block">Company/Client Name *</label>
                  <input
                    type="text"
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="e.g. Acme Corporation"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase block">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={newClientContact}
                    onChange={(e) => setNewClientContact(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase block">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="e.g. john@acme.com"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase block">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="e.g. +91 99999 99999"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase block">GSTIN (Optional)</label>
                  <input
                    type="text"
                    value={newClientGst}
                    onChange={(e) => setNewClientGst(e.target.value)}
                    placeholder="e.g. 27AAAAA1111A1Z1"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase block">Company Logo (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleClientLogoChange}
                    className="w-full text-xs text-slate-550 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-blue-600/10 file:text-blue-400 file:cursor-pointer hover:file:bg-blue-600/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase block">Billing / Registered Address *</label>
                <textarea
                  required
                  rows={2}
                  value={newClientAddress}
                  onChange={(e) => setNewClientAddress(e.target.value)}
                  placeholder="Enter full legal address"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase block">Additional Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={newClientNotes}
                  onChange={(e) => setNewClientNotes(e.target.value)}
                  placeholder="Sector, company info, contract preferences, etc."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setShowCreateClientModal(false)}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-355 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={clientSubmitting}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {clientSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
                  Create & Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
