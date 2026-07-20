// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
  'Uttarakhand', 'West Bengal', 'Delhi'
];

async function main() {
  const templatesDir = path.join(process.cwd(), 'templates');

  const templates = [
    {
      name: 'Mutual Non-Disclosure Agreement',
      type: 'NDA',
      version: '1.0',
      variant: 'MUTUAL',
      filename: 'nda-mutual.html',
    },
    {
      name: 'Unilateral Non-Disclosure Agreement',
      type: 'NDA',
      version: '1.0',
      variant: 'UNILATERAL',
      filename: 'nda-unilateral.html',
    },
    {
      name: 'Freelance / Service Agreement',
      type: 'SERVICE_AGREEMENT',
      version: '1.0',
      variant: 'STANDARD',
      filename: 'service-agreement.html',
    },
    {
      name: 'Residential Rental Agreement',
      type: 'RENTAL_AGREEMENT',
      version: '1.0',
      variant: 'STANDARD',
      filename: 'rental-agreement.html',
    },
  ];

  for (const t of templates) {
    const filePath = path.join(templatesDir, t.filename);
    if (!fs.existsSync(filePath)) {
      console.warn(`Template file not found: ${filePath}`);
      continue;
    }
    const content = fs.readFileSync(filePath, 'utf-8');

    const existing = await prisma.template.findFirst({
      where: {
        type: t.type,
        variant: t.variant,
        version: t.version,
      },
    });

    if (existing) {
      await prisma.template.update({
        where: { id: existing.id },
        data: {
          name: t.name,
          content,
        },
      });
      console.log(`Updated template: ${t.name} (Variant: ${t.variant})`);
    } else {
      await prisma.template.create({
        data: {
          name: t.name,
          type: t.type,
          version: t.version,
          variant: t.variant,
          content,
          is_active: true,
        },
      });
      console.log(`Created template: ${t.name} (Variant: ${t.variant})`);
    }
  }

  // Define Dynamic Document Workflows
  const workflows = [
    {
      doc_type: 'MUTUAL_NDA',
      name: 'Mutual NDA',
      description: 'Protects proprietary secrets shared between two collaborating business parties.',
      estimated_pages: 8,
      reading_time: 12,
      recommended_docs: ['SERVICE_AGREEMENT', 'IP_ASSIGNMENT'],
      question_set: [
        {
          step: 1,
          title: 'Classification & Duration',
          description: 'Define the effective start date and confidentiality lifetime guidelines.',
          fields: [
            {
              id: 'effectiveDate',
              label: 'Agreement Effective Date',
              type: 'date',
              required: true,
              placeholder: 'YYYY-MM-DD',
              helpText: 'The official starting date from which disclosures are protected.'
            },
            {
              id: 'confidentialityTerm',
              label: 'Confidentiality Duration (Months)',
              type: 'number',
              required: true,
              placeholder: '24',
              helpText: 'The number of months that the confidentiality obligation persists.'
            },
            {
              id: 'governingJurisdiction',
              label: 'Governing Jurisdiction (State)',
              type: 'select',
              required: true,
              options: INDIAN_STATES,
              helpText: 'Select the state rules and local courts for dispute resolution.'
            }
          ]
        },
        {
          step: 2,
          title: 'Contracting Parties',
          description: 'Identify both legal entities executing the mutual NDA.',
          fields: [
            {
              id: 'disclosingParty',
              label: 'Party A Legal Name',
              type: 'text',
              required: true,
              placeholder: 'Enter company or individual name',
              helpText: 'Official legal name of the first party.'
            },
            {
              id: 'disclosingPartyAddress',
              label: 'Party A Registered Address',
              type: 'text',
              required: true,
              placeholder: 'Full corporate/residential address',
              helpText: 'Registered postal headquarters address for legal notices.'
            },
            {
              id: 'receivingParty',
              label: 'Party B Legal Name',
              type: 'text',
              required: true,
              placeholder: 'Enter company or individual name',
              helpText: 'Official legal name of the second party.'
            },
            {
              id: 'receivingPartyAddress',
              label: 'Party B Registered Address',
              type: 'text',
              required: true,
              placeholder: 'Full corporate/residential address',
              helpText: 'Registered postal headquarters address for legal notices.'
            }
          ]
        },
        {
          step: 3,
          title: 'Information & Purpose',
          description: 'Specify what proprietary information is shared and why.',
          fields: [
            {
              id: 'purpose',
              label: 'Business Purpose of Information Sharing',
              type: 'text',
              required: true,
              placeholder: 'e.g. Exploring technical partnership / raw codebase review',
              helpText: 'The legal boundary of what disclosures are allowed to be used for.'
            },
            {
              id: 'confidentialInfoScope',
              label: 'Confidential Information Definition',
              type: 'select',
              required: true,
              options: ['Standard Definition', 'Narrow Scope (Marked as Confidential only)', 'Broad Scope (All oral & written info)'],
              helpText: 'Select how broadly or narrowly confidential disclosures are classified.'
            }
          ]
        },
        {
          step: 4,
          title: 'Industry & Custom Protections',
          description: 'Fine-tune agreement rules for specific industry types.',
          fields: [
            {
              id: 'industry',
              label: 'Primary Industry Sector',
              type: 'select',
              required: true,
              options: ['Software', 'Marketing', 'Consulting', 'Design', 'Manufacturing', 'Healthcare', 'Education', 'Real Estate', 'Other'],
              helpText: 'Select your industry to customize recommendations.'
            },
            {
              id: 'nonSolicitation',
              label: 'Add Non-Solicitation Protections',
              type: 'select',
              required: true,
              options: ['No solicitation clause', 'Yes - 1 Year restriction', 'Yes - 2 Years restriction'],
              helpText: 'Prevents the other party from poaching your developers/employees.'
            }
          ]
        }
      ],
      validation_rules: [
        {
          id: 'same_parties',
          type: 'conflict',
          field: 'disclosingParty',
          compareWith: 'receivingParty',
          message: 'Party A and Party B names cannot be identical.'
        },
        {
          id: 'negative_term',
          type: 'range',
          field: 'confidentialityTerm',
          operator: '<=',
          value: 0,
          message: 'Confidentiality duration must be a positive number of months.'
        }
      ],
      ai_suggestions: [
        {
          conditionField: 'nonSolicitation',
          conditionValue: 'No solicitation clause',
          recommendation: 'Since you selected a Mutual collaboration, consider adding a Non-Solicitation clause to protect team members.',
          type: 'warning'
        },
        {
          conditionField: 'confidentialInfoScope',
          conditionValue: 'Broad Scope (All oral & written info)',
          recommendation: 'A broad definition increases risk of dispute. Consider narrowing the definition of Confidential Information.',
          type: 'warning'
        }
      ],
      industry_rules: {
        'Software': 'Software intellectual property and code shares require strict source control and IP assignment deeds.',
        'Healthcare': 'Medical records and research require HIPAA and DPDP Act compliant patient data handling disclosures.'
      }
    },
    {
      doc_type: 'UNILATERAL_NDA',
      name: 'Unilateral NDA',
      description: 'Protects proprietary secrets where only one party discloses sensitive information (e.g. employee or vendor hires).',
      estimated_pages: 6,
      reading_time: 10,
      recommended_docs: ['SERVICE_AGREEMENT', 'IP_ASSIGNMENT'],
      question_set: [
        {
          step: 1,
          title: 'Classification & Duration',
          description: 'Define the effective start date and confidentiality duration.',
          fields: [
            {
              id: 'effectiveDate',
              label: 'Agreement Effective Date',
              type: 'date',
              required: true,
              placeholder: 'YYYY-MM-DD',
              helpText: 'Official starting date.'
            },
            {
              id: 'confidentialityTerm',
              label: 'Confidentiality Duration (Months)',
              type: 'number',
              required: true,
              placeholder: '24',
              helpText: 'Obligation duration.'
            },
            {
              id: 'governingJurisdiction',
              label: 'Governing Jurisdiction (State)',
              type: 'select',
              required: true,
              options: INDIAN_STATES,
              helpText: 'Select state rules.'
            }
          ]
        },
        {
          step: 2,
          title: 'Contracting Parties',
          description: 'Identify the Disclosing and Receiving parties.',
          fields: [
            {
              id: 'disclosingParty',
              label: 'Disclosing Party Legal Name (Owner of secrets)',
              type: 'text',
              required: true,
              placeholder: 'Enter Disclosing Company/Individual name',
              helpText: 'Owner of the confidential files.'
            },
            {
              id: 'disclosingPartyAddress',
              label: 'Disclosing Party Registered Address',
              type: 'text',
              required: true,
              placeholder: 'Full corporate/residential address',
              helpText: 'Official address.'
            },
            {
              id: 'receivingParty',
              label: 'Receiving Party Legal Name (Recipient of secrets)',
              type: 'text',
              required: true,
              placeholder: 'Enter contractor or worker name',
              helpText: 'Receiver of the disclosures.'
            },
            {
              id: 'receivingPartyAddress',
              label: 'Receiving Party Registered Address',
              type: 'text',
              required: true,
              placeholder: 'Full address',
              helpText: 'Receiver address.'
            }
          ]
        },
        {
          step: 3,
          title: 'Information & Return Rules',
          description: 'Define information category and rules on return/destruction of data.',
          fields: [
            {
              id: 'infoCategory',
              label: 'Confidential Information Category',
              type: 'text',
              required: true,
              placeholder: 'e.g. Source code, client databases, designs, financial projections',
              helpText: 'Specify what category of assets are protected.'
            },
            {
              id: 'returnDestroyRule',
              label: 'Return or Destroy Information Requirement',
              type: 'select',
              required: true,
              options: ['Destroy upon written request', 'Return immediately upon termination', 'Both options mandatory'],
              helpText: 'Specify recipient action on document expiry.'
            }
          ]
        }
      ],
      validation_rules: [
        {
          id: 'same_parties',
          type: 'conflict',
          field: 'disclosingParty',
          compareWith: 'receivingParty',
          message: 'Disclosing and Receiving party names cannot be identical.'
        },
        {
          id: 'negative_term',
          type: 'range',
          field: 'confidentialityTerm',
          operator: '<=',
          value: 0,
          message: 'Confidentiality term must be a positive number.'
        }
      ],
      ai_suggestions: [
        {
          conditionField: 'confidentialityTerm',
          conditionValue: '12',
          recommendation: 'Confidentiality duration of 12 months is short for trade secrets. Consider extending to 24 or 36 months.',
          type: 'warning'
        }
      ]
    },
    {
      doc_type: 'FREELANCE_AGREEMENT',
      name: 'Freelance Agreement',
      description: 'Standard freelance contract defining deliverables, timeline, milestones, IP, and disputes.',
      estimated_pages: 10,
      reading_time: 15,
      recommended_docs: ['MUTUAL_NDA', 'IP_ASSIGNMENT'],
      question_set: [
        {
          step: 1,
          title: 'Contracting Parties',
          description: 'Identify the Client (Party A) and Freelancer (Party B).',
          fields: [
            {
              id: 'clientName',
              label: 'Client / Hiring Entity Name',
              type: 'text',
              required: true,
              placeholder: 'Acme Corporation',
              helpText: 'Corporate or individual hiring party.'
            },
            {
              id: 'clientAddress',
              label: 'Client Registered Address',
              type: 'text',
              required: true,
              placeholder: 'Full address',
              helpText: 'Client corporate address.'
            },
            {
              id: 'freelancerName',
              label: 'Freelancer / Contractor Name',
              type: 'text',
              required: true,
              placeholder: 'Jane Doe',
              helpText: 'Contractor legal name.'
            },
            {
              id: 'freelancerAddress',
              label: 'Freelancer Billing Address',
              type: 'text',
              required: true,
              placeholder: 'Full address',
              helpText: 'Freelancer address.'
            }
          ]
        },
        {
          step: 2,
          title: 'Project & Scope',
          description: 'Spell out deliverables and parameters.',
          fields: [
            {
              id: 'scopeOfWork',
              label: 'Detailed Scope of Work',
              type: 'textarea',
              required: true,
              placeholder: 'e.g. Design of Figma wireframes, development of React dashboard...',
              helpText: 'Define deliverables to prevent scope creep.'
            },
            {
              id: 'industry',
              label: 'Primary Project Type / Sector',
              type: 'select',
              required: true,
              options: ['Software Development', 'Graphic Design', 'Marketing', 'Consulting', 'Other'],
              helpText: 'Select project type to load industry-specific clauses.'
            },
            {
              id: 'effectiveDate',
              label: 'Agreement Start Date',
              type: 'date',
              required: true,
              placeholder: 'YYYY-MM-DD',
              helpText: 'Official starting date.'
            },
            {
              id: 'terminationNoticePeriod',
              label: 'Notice Period for Termination (Days)',
              type: 'number',
              required: true,
              placeholder: '30',
              helpText: 'Days notice required to separate.'
            },
            {
              id: 'governingJurisdiction',
              label: 'Governing Jurisdiction State',
              type: 'select',
              required: true,
              options: INDIAN_STATES,
              helpText: 'Select law rules.'
            }
          ]
        },
        {
          step: 3,
          title: 'Software Development Clauses',
          description: 'Special parameters loaded dynamically for software workflows.',
          fields: [
            {
              id: 'sourceCodeOwnership',
              label: 'Source Code Ownership',
              type: 'select',
              required: true,
              options: ['Transferred to Client upon payment', 'Retained by Freelancer', 'Shared/Co-owned'],
              conditionalOn: 'industry',
              conditionValue: 'Software Development',
              helpText: 'Determine who owns final source code assets.'
            },
            {
              id: 'gitRepositoryOwnership',
              label: 'Git Repository Ownership',
              type: 'select',
              required: true,
              options: ["Client's repository", "Freelancer's private repository"],
              conditionalOn: 'industry',
              conditionValue: 'Software Development',
              helpText: 'Who maintains repository control during development?'
            },
            {
              id: 'openSourceUsage',
              label: 'Open Source Code Usage Policy',
              type: 'select',
              required: true,
              options: ['Allowed with disclosure', 'Strictly prohibited', 'Client approval required'],
              conditionalOn: 'industry',
              conditionValue: 'Software Development',
              helpText: 'Can developer integrate external open-source packages?'
            },
            {
              id: 'ipAssignment',
              label: 'Intellectual Property Assignment',
              type: 'select',
              required: true,
              options: ['Immediate transfer', 'Transfer upon final payment received'],
              conditionalOn: 'industry',
              conditionValue: 'Software Development',
              helpText: 'Sets when ownership moves to Client.'
            }
          ]
        },
        {
          step: 4,
          title: 'Graphic Design Clauses',
          description: 'Special parameters loaded dynamically for design workflows.',
          fields: [
            {
              id: 'copyrightOwnership',
              label: 'Copyright Ownership',
              type: 'select',
              required: true,
              options: ['Transferred to Client', 'Retained by Designer (Licensed)'],
              conditionalOn: 'industry',
              conditionValue: 'Graphic Design',
              helpText: 'Ownership transfer.'
            },
            {
              id: 'editableFiles',
              label: 'Editable Raw Files (PSD/Figma) Delivery',
              type: 'select',
              required: true,
              options: ['Provided to Client', 'Not provided'],
              conditionalOn: 'industry',
              conditionValue: 'Graphic Design',
              helpText: 'Specify whether project source files are included.'
            },
            {
              id: 'brandAssetsUsage',
              label: 'Portfolio Usage Permission',
              type: 'select',
              required: true,
              options: ['Designer can use in portfolio', 'Strictly confidential'],
              conditionalOn: 'industry',
              conditionValue: 'Graphic Design',
              helpText: 'Allows or restricts using design assets in developer portfolio.'
            }
          ]
        },
        {
          step: 5,
          title: 'Financial Terms & Milestones',
          description: 'Specify payouts, late payment policies, and schedules.',
          fields: [
            {
              id: 'paymentAmount',
              label: 'Total Contract Value (₹)',
              type: 'number',
              required: true,
              placeholder: '50000',
              helpText: 'The total client billing amount.'
            },
            {
              id: 'paymentSchedule',
              label: 'Billing Cycle',
              type: 'select',
              required: true,
              options: ['one-time', 'milestone', 'recurring'],
              helpText: 'Select schedule.'
            },
            {
              id: 'latePaymentPolicy',
              label: 'Late Payment Penalty',
              type: 'select',
              required: true,
              options: ['No penalty', '2% monthly interest', 'Fixed ₹500 fee per week'],
              helpText: 'Penalties for overdue payments.'
            }
          ]
        }
      ],
      validation_rules: [
        {
          id: 'same_parties',
          type: 'conflict',
          field: 'clientName',
          compareWith: 'freelancerName',
          message: 'Client and Freelancer names cannot be identical.'
        },
        {
          id: 'negative_payment',
          type: 'range',
          field: 'paymentAmount',
          operator: '<=',
          value: 0,
          message: 'Contract payment value must be positive.'
        }
      ],
      ai_suggestions: [
        {
          conditionField: 'latePaymentPolicy',
          conditionValue: 'No penalty',
          recommendation: 'Since you selected Monthly Payments / Fixed Billing, consider adding a Late Payment Penalty to ensure timely payouts.',
          type: 'warning'
        },
        {
          conditionField: 'governingJurisdiction',
          conditionValue: 'International',
          recommendation: 'You selected an International client. Consider adding an Arbitration clause for cross-border disputes.',
          type: 'warning'
        }
      ]
    },
    {
      doc_type: 'RENTAL_AGREEMENT',
      name: 'Rental Agreement',
      description: 'Residential lease agreement covering rent, deposits, utility splits, and periods.',
      estimated_pages: 8,
      reading_time: 12,
      recommended_docs: ['MUTUAL_NDA'],
      question_set: [
        {
          step: 1,
          title: 'Contracting Parties',
          description: 'Identify the Landlord and Tenant.',
          fields: [
            {
              id: 'landlordName',
              label: 'Landlord Legal Name',
              type: 'text',
              required: true,
              placeholder: 'John Landlord',
              helpText: 'Property owner legal name.'
            },
            {
              id: 'landlordAddress',
              label: 'Landlord Residential Address',
              type: 'text',
              required: true,
              placeholder: 'Full address',
              helpText: 'Official address.'
            },
            {
              id: 'tenantName',
              label: 'Tenant Legal Name',
              type: 'text',
              required: true,
              placeholder: 'Sarah Tenant',
              helpText: 'Lessee legal name.'
            },
            {
              id: 'tenantAddress',
              label: 'Tenant Current Address',
              type: 'text',
              required: true,
              placeholder: 'Full address',
              helpText: 'Tenant current address.'
            }
          ]
        },
        {
          step: 2,
          title: 'Property & Financials',
          description: 'Property address, rent, deposit values, and maintenance.',
          fields: [
            {
              id: 'propertyAddress',
              label: 'Rented Property Full Address',
              type: 'text',
              required: true,
              placeholder: 'Flat 101, Residency Heights, Central Sector',
              helpText: 'Detailed postal address of the leased residential premises.'
            },
            {
              id: 'rentAmount',
              label: 'Monthly Rent Amount (₹)',
              type: 'number',
              required: true,
              placeholder: '15000',
              helpText: 'Amount paid to the landlord monthly.'
            },
            {
              id: 'securityDeposit',
              label: 'Security Deposit (₹)',
              type: 'number',
              required: true,
              placeholder: '45000',
              helpText: 'Interest-free refundable security deposit.'
            },
            {
              id: 'maintenanceAmount',
              label: 'Monthly Maintenance Charge (₹)',
              type: 'number',
              required: true,
              placeholder: '2000',
              helpText: 'Maintenance fee. Set to 0 if included in rent.'
            }
          ]
        },
        {
          step: 3,
          title: 'Duration & Utilities',
          description: 'Lock-in periods, effective dates, and state laws.',
          fields: [
            {
              id: 'effectiveDate',
              label: 'Lease Start Date',
              type: 'date',
              required: true,
              placeholder: 'YYYY-MM-DD',
              helpText: 'The official starting date.'
            },
            {
              id: 'tenancyPeriodMonths',
              label: 'Lease Duration (Months)',
              type: 'number',
              required: true,
              placeholder: '11',
              helpText: 'Typical duration is 11 months for residential leases.'
            },
            {
              id: 'lockInPeriodMonths',
              label: 'Lock-in Period (Months)',
              type: 'number',
              required: true,
              placeholder: '3',
              helpText: 'Months during which neither party can terminate.'
            },
            {
              id: 'noticePeriodDays',
              label: 'Notice Period for Termination (Days)',
              type: 'number',
              required: true,
              placeholder: '30',
              helpText: 'Notice required to vacate.'
            },
            {
              id: 'utilitiesIncluded',
              label: 'Utilities paid by Tenant',
              type: 'text',
              required: true,
              placeholder: 'Electricity, Water, Cooking Gas, WiFi',
              helpText: 'Enter list of utility bills split or paid by the tenant.'
            },
            {
              id: 'governingJurisdiction',
              label: 'Governing State Rules',
              type: 'select',
              required: true,
              options: INDIAN_STATES,
              helpText: 'Local Rent Control Act jurisdiction.'
            }
          ]
        }
      ],
      validation_rules: [
        {
          id: 'same_parties',
          type: 'conflict',
          field: 'landlordName',
          compareWith: 'tenantName',
          message: 'Landlord and Tenant names cannot be identical.'
        },
        {
          id: 'negative_rent',
          type: 'range',
          field: 'rentAmount',
          operator: '<=',
          value: 0,
          message: 'Monthly rent must be positive.'
        },
        {
          id: 'negative_deposit',
          type: 'range',
          field: 'securityDeposit',
          operator: '<',
          value: 0,
          message: 'Security deposit cannot be negative.'
        },
        {
          id: 'lockin_too_long',
          type: 'conflict',
          field: 'lockInPeriodMonths',
          compareWith: 'tenancyPeriodMonths',
          message: 'Lock-in period cannot exceed total tenancy duration.'
        }
      ],
      ai_suggestions: [
        {
          conditionField: 'securityDeposit',
          conditionValue: '0',
          recommendation: 'You selected ₹0 security deposit. Landlords are advised to collect a deposit to protect against damages.',
          type: 'warning'
        }
      ]
    }
  ];

  for (const wf of workflows) {
    const existing = await prisma.documentWorkflow.findUnique({
      where: { doc_type: wf.doc_type }
    });

    if (existing) {
      await prisma.documentWorkflow.update({
        where: { doc_type: wf.doc_type },
        data: {
          name: wf.name,
          description: wf.description,
          question_set: wf.question_set,
          validation_rules: wf.validation_rules,
          ai_suggestions: wf.ai_suggestions,
          industry_rules: wf.industry_rules,
          estimated_pages: wf.estimated_pages,
          reading_time: wf.reading_time,
          recommended_docs: wf.recommended_docs
        }
      });
      console.log(`Updated workflow: ${wf.name}`);
    } else {
      await prisma.documentWorkflow.create({
        data: {
          doc_type: wf.doc_type,
          name: wf.name,
          description: wf.description,
          question_set: wf.question_set,
          validation_rules: wf.validation_rules,
          ai_suggestions: wf.ai_suggestions,
          industry_rules: wf.industry_rules,
          estimated_pages: wf.estimated_pages,
          reading_time: wf.reading_time,
          recommended_docs: wf.recommended_docs
        }
      });
      console.log(`Created workflow: ${wf.name}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
