// lib/llm.ts
import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY || '';

let anthropic: Anthropic | null = null;
if (apiKey) {
  anthropic = new Anthropic({
    apiKey: apiKey,
  });
}

export interface InconsistencyResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates the wizard answers for logical consistency using Claude.
 * Falls back to local JavaScript rule validation if no API key is set.
 */
export async function checkAnswersConsistency(answers: Record<string, any>): Promise<InconsistencyResult> {
  const localErrors: string[] = [];
  const docType = (answers.docType || 'NDA').trim().toUpperCase();
  const normalizedDocType = 
    (docType === 'FREELANCE_AGREEMENT' || docType === 'SERVICE_AGREEMENT') ? 'SERVICE_AGREEMENT' :
    (docType === 'MUTUAL_NDA' || docType === 'UNILATERAL_NDA' || docType === 'NDA') ? 'NDA' :
    docType === 'RENTAL_AGREEMENT' ? 'RENTAL_AGREEMENT' : 'NDA';

  if (normalizedDocType === 'SERVICE_AGREEMENT') {
    // 1. Service Agreement validations
    if (answers.clientName && answers.freelancerName && 
        answers.clientName.trim().toLowerCase() === answers.freelancerName.trim().toLowerCase()) {
      localErrors.push("Client Name and Freelancer Name cannot be identical.");
    }

    const totalAmount = Number(answers.paymentAmount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      localErrors.push("Payment amount must be a positive number.");
    }

    const effectiveDateStr = answers.effectiveDate;
    if (!effectiveDateStr) {
      localErrors.push("Effective Date is required.");
    }

    if (answers.paymentSchedule === 'milestone') {
      const milestones = answers.milestones || [];
      if (!Array.isArray(milestones) || milestones.length === 0) {
        localErrors.push("At least one milestone is required for milestone-based billing.");
      } else {
        let sum = 0;
        let lastDate: Date | null = null;
        let dateError = false;
        const effDate = effectiveDateStr ? new Date(effectiveDateStr) : null;

        milestones.forEach((m: any, index: number) => {
          const amt = Number(m.amount);
          if (isNaN(amt) || amt <= 0) {
            localErrors.push(`Milestone ${index + 1} amount must be a positive number.`);
          } else {
            sum += amt;
          }

          if (!m.dueDate) {
            localErrors.push(`Milestone ${index + 1} due date is required.`);
          } else {
            const mDate = new Date(m.dueDate);
            if (effDate && mDate < effDate) {
              localErrors.push(`Milestone ${index + 1} due date (${m.dueDate}) cannot be before the effective date (${effectiveDateStr}).`);
            }
            if (lastDate && mDate < lastDate && !dateError) {
              localErrors.push("Milestone due dates must be in chronological order.");
              dateError = true;
            }
            lastDate = mDate;
          }
        });

        if (Math.abs(sum - totalAmount) > 0.01) {
          localErrors.push(`The sum of milestone amounts (₹${sum}) must equal the total payment amount (₹${totalAmount}).`);
        }
      }
    }
  } else if (normalizedDocType === 'RENTAL_AGREEMENT') {
    // Rental Agreement validations
    if (answers.landlordName && answers.tenantName && 
        answers.landlordName.trim().toLowerCase() === answers.tenantName.trim().toLowerCase()) {
      localErrors.push("Landlord and Tenant names cannot be identical.");
    }
    const rent = Number(answers.rentAmount);
    if (isNaN(rent) || rent <= 0) {
      localErrors.push("Rent amount must be a positive number.");
    }
    const deposit = Number(answers.securityDeposit);
    if (isNaN(deposit) || deposit < 0) {
      localErrors.push("Security deposit cannot be negative.");
    }
    const lockIn = Number(answers.lockInPeriodMonths);
    const leasePeriod = Number(answers.tenancyPeriodMonths);
    if (!isNaN(lockIn) && !isNaN(leasePeriod) && lockIn > leasePeriod) {
      localErrors.push("Lock-in period cannot exceed total tenancy duration.");
    }
    if (!answers.effectiveDate) {
      localErrors.push("Effective Date is required.");
    }
  } else {
    // 2. Basic NDA logical validations
    if (answers.disclosingParty && answers.receivingParty && 
        answers.disclosingParty.trim().toLowerCase() === answers.receivingParty.trim().toLowerCase()) {
      localErrors.push("Disclosing Party and Receiving Party names cannot be identical.");
    }

    if (answers.confidentialityTerm && (isNaN(Number(answers.confidentialityTerm)) || Number(answers.confidentialityTerm) <= 0)) {
      localErrors.push("Confidentiality term must be a positive number of months.");
    }

    if (!answers.effectiveDate) {
      localErrors.push("Effective Date is required.");
    }

    if (answers.purpose && answers.purpose.trim().length < 5) {
      localErrors.push("Purpose of information sharing should be descriptive (at least 5 characters).");
    }
  }

  // 3. Call Claude for deeper factual consistency check if key exists
  if (anthropic) {
    try {
      const docRules = normalizedDocType === 'SERVICE_AGREEMENT'
        ? `Rules for Service Agreement:
- Flag if Client and Freelancer are identical.
- Flag if effective date is invalid or highly unusual (e.g. year is in the distant past or future).
- Flag if the total payment amount is not positive.
- If milestone-based, flag if milestone amounts do not sum exactly to the total payment amount.
- Flag if milestone due dates are before the effective date or not in chronological order.
- Flag if the scope of work contains gibberish or nonsensical text.
- Do NOT suggest legal draft language or advice. Only check for data sanity.`
        : normalizedDocType === 'RENTAL_AGREEMENT'
        ? `Rules for Rental Agreement:
- Flag if Landlord and Tenant are identical.
- Flag if effective date is invalid or highly unusual (e.g. year is in the distant past or future).
- Flag if the monthly rent or security deposit are not positive numbers.
- Flag if lock-in period is greater than the tenancy lease period.
- Flag if the property address contains gibberish or nonsensical text.
- Do NOT suggest legal draft language or advice. Only check for data sanity.`
        : `Rules for NDA:
- Flag if Disclosing Party and Receiving Party are identical.
- Flag if effective date is invalid or highly unusual (e.g. year is in the distant past or future).
- Flag if confidentiality term is missing or <= 0.
- Flag if the 'purpose' field contains gibberish or nonsensical text.
- Do NOT suggest legal draft language or advice. Only check for data sanity.`;

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1000,
        temperature: 0,
        system: `You are a data validation assistant, not a legal advisor.
Given the user's form answers, you must verify logical and factual consistency.
Analyze the answers and return a JSON object with:
{
  "isValid": boolean,
  "errors": string[] // list of factual inconsistencies or issues found, otherwise empty array
}
${docRules}
- Respond ONLY with the JSON block. Do not include markdown code fence formatting (like \`\`\`json). Just raw JSON.`,
        messages: [
          {
            role: 'user',
            content: `Here are the form answers for document type ${docType}: ${JSON.stringify(answers)}`,
          },
        ],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const parsed = JSON.parse(text.trim()) as InconsistencyResult;
      
      // Combine local checks and LLM checks
      const combinedErrors = Array.from(new Set([...localErrors, ...(parsed.errors || [])]));
      return {
        isValid: combinedErrors.length === 0,
        errors: combinedErrors,
      };
    } catch (error) {
      console.error('Claude API consistency check failed, falling back to local checks:', error);
      return {
        isValid: localErrors.length === 0,
        errors: localErrors,
      };
    }
  }

  // Fallback returned when Anthropic key is not present
  console.warn('ANTHROPIC_API_KEY not set. Using local validation fallback.');
  return {
    isValid: localErrors.length === 0,
    errors: localErrors,
  };
}


