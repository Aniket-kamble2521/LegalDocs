import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { docType, answers } = await request.json();

    if (!docType || !answers) {
      return NextResponse.json({ success: false, error: 'Missing docType or answers' }, { status: 400 });
    }

    // Convert docType to matching DB format
    const targetDocType = docType.toUpperCase().replace('-', '_');

    // Fetch the workflow configuration
    const workflow = await prisma.documentWorkflow.findUnique({
      where: { doc_type: targetDocType }
    });

    if (!workflow) {
      return NextResponse.json({ success: false, error: 'Workflow configuration not found' }, { status: 404 });
    }

    const questionSet = workflow.question_set as any[];
    const validationRules = workflow.validation_rules as any[];
    const aiSuggestionsConfig = workflow.ai_suggestions as any[];
    const industryRules = (workflow.industry_rules as Record<string, string>) || {};

    const warnings: string[] = [];
    const recommendations: string[] = [];
    const missingFields: string[] = [];

    // --- 1. Gather all fields from the question set ---
    let totalRequiredCount = 0;
    let filledRequiredCount = 0;
    let totalOptionalCount = 0;
    let filledOptionalCount = 0;

    questionSet.forEach((step: any) => {
      if (step.fields && Array.isArray(step.fields)) {
        step.fields.forEach((field: any) => {
          // Check if field is conditional and if the condition is met
          let conditionMet = true;
          if (field.conditionalOn) {
            const parentValue = answers[field.conditionalOn];
            conditionMet = String(parentValue).toLowerCase() === String(field.conditionValue).toLowerCase();
          }

          if (conditionMet) {
            const val = answers[field.id];
            const isFilled = val !== undefined && val !== null && String(val).trim() !== '';

            if (field.required) {
              totalRequiredCount++;
              if (isFilled) {
                filledRequiredCount++;
              } else {
                missingFields.push(field.label);
              }
            } else {
              totalOptionalCount++;
              if (isFilled) {
                filledOptionalCount++;
              }
            }
          }
        });
      }
    });

    // --- 2. Smart Validation Rules ---
    // Conflict rules, impossible dates, duplicate, and negative checks
    validationRules.forEach((rule: any) => {
      const val = answers[rule.field];
      if (val === undefined || val === null || String(val).trim() === '') return;

      if (rule.type === 'conflict') {
        const otherVal = answers[rule.compareWith];
        if (otherVal !== undefined && otherVal !== null && String(otherVal).trim() !== '') {
          if (String(val).trim().toLowerCase() === String(otherVal).trim().toLowerCase()) {
            warnings.push(rule.message);
          }
        }
      } else if (rule.type === 'range') {
        const numVal = Number(val);
        if (!isNaN(numVal)) {
          let triggered = false;
          if (rule.operator === '<=' && numVal <= rule.value) triggered = true;
          if (rule.operator === '<' && numVal < rule.value) triggered = true;
          if (rule.operator === '>=' && numVal >= rule.value) triggered = true;
          if (rule.operator === '>' && numVal > rule.value) triggered = true;
          if (rule.operator === '===' && numVal === rule.value) triggered = true;

          if (triggered) {
            warnings.push(rule.message);
          }
        }
      }
    });

    // Additional generic date checks (e.g. effective start date in distant past or future)
    const effectiveDateStr = answers.effectiveDate;
    if (effectiveDateStr) {
      const effDate = new Date(effectiveDateStr);
      const now = new Date();
      const minDate = new Date();
      minDate.setFullYear(now.getFullYear() - 10);
      const maxDate = new Date();
      maxDate.setFullYear(now.getFullYear() + 10);

      if (isNaN(effDate.getTime()) || effDate < minDate || effDate > maxDate) {
        warnings.push('Impossible Date: Effective start date seems invalid or in the distant past/future.');
      }
    }

    // Milestones validation
    if (targetDocType === 'FREELANCE_AGREEMENT' && answers.paymentSchedule === 'milestone') {
      const totalAmount = Number(answers.paymentAmount);
      const milestones = answers.milestones || [];
      if (Array.isArray(milestones) && milestones.length > 0) {
        let sum = 0;
        milestones.forEach((m: any) => {
          sum += Number(m.amount || 0);
        });
        if (Math.abs(sum - totalAmount) > 0.01) {
          warnings.push(`Conflicting Clauses: Sum of milestones (₹${sum}) does not match total contract value (₹${totalAmount}).`);
        }
      }
    }

    // Lock-in period versus total period check
    if (targetDocType === 'RENTAL_AGREEMENT') {
      const lockIn = Number(answers.lockInPeriodMonths);
      const leasePeriod = Number(answers.tenancyPeriodMonths);
      if (!isNaN(lockIn) && !isNaN(leasePeriod) && lockIn > leasePeriod) {
        warnings.push('Chronology Error: Lock-in period cannot exceed the total tenancy period.');
      }
    }

    // --- 3. Dynamic AI Recommendations & suggestions ---
    aiSuggestionsConfig.forEach((sug: any) => {
      const val = answers[sug.conditionField];
      if (val !== undefined && val !== null) {
        if (String(val).toLowerCase() === String(sug.conditionValue).toLowerCase()) {
          recommendations.push(sug.recommendation);
        }
      }
    });

    // Industry-specific suggestion logic
    const selectedIndustry = answers.industry;
    if (selectedIndustry && industryRules[selectedIndustry]) {
      recommendations.push(`Industry Note for ${selectedIndustry}: ${industryRules[selectedIndustry]}`);
    }

    // Add general legal safety suggestions
    if (targetDocType === 'MUTUAL_NDA') {
      if (!answers.nonSolicitation || answers.nonSolicitation === 'No solicitation clause') {
        recommendations.push('Consider adding a Non-Solicitation Clause to protect your team assets.');
      }
      recommendations.push('Ensure confidential information is only disclosed for the agreed business Purpose.');
    } else if (targetDocType === 'FREELANCE_AGREEMENT') {
      if (answers.industry === 'Software Development') {
        if (answers.ipAssignment !== 'Transfer upon final payment received') {
          recommendations.push('Ensure IP assignment only triggers *after* final payment is received to protect cash flows.');
        }
      }
    }

    // --- 4. Quality & Readiness Score Breakdown ---
    // Completeness Score
    const completenessScore = totalRequiredCount > 0 
      ? Math.round((filledRequiredCount / totalRequiredCount) * 100) 
      : 100;

    // Legal Coverage Score: starts at 100, drops by warnings and missing critical fields
    let legalCoverageScore = 100;
    if (missingFields.length > 0) {
      legalCoverageScore -= (missingFields.length * 10);
    }
    if (warnings.some(w => w.toLowerCase().includes('date') || w.toLowerCase().includes('party') || w.toLowerCase().includes('law'))) {
      legalCoverageScore -= 15;
    }
    legalCoverageScore = Math.max(20, legalCoverageScore);

    // Business Protection Score: starts at 100, drops by missing recommendations/optional safety checks
    let businessProtectionScore = 100;
    if (recommendations.length > 0) {
      businessProtectionScore -= (recommendations.length * 5);
    }
    businessProtectionScore = Math.max(30, businessProtectionScore);

    // Document Readiness overall score
    let readinessScore = Math.round((completenessScore * 0.4) + (legalCoverageScore * 0.3) + (businessProtectionScore * 0.3));
    readinessScore = Math.max(10, Math.min(100, readinessScore));

    return NextResponse.json({
      success: true,
      readinessScore,
      breakdown: {
        completeness: completenessScore,
        legalCoverage: legalCoverageScore,
        businessProtection: businessProtectionScore,
        missingInformation: missingFields
      },
      warnings,
      recommendations,
      estimatedPages: workflow.estimated_pages,
      readingTime: workflow.reading_time,
      recommendedDocs: workflow.recommended_docs
    });
  } catch (error: any) {
    console.error('Error conducting workflow audit:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
