// lib/helpText.ts

/**
 * Returns plain-language help text explaining what is needed in each NDA wizard field.
 * This is browser-safe and can be imported in client components.
 */
export function getFieldHelpText(fieldName: string): string {
  const helpTexts: Record<string, string> = {
    ndaType: "Choose 'Mutual' if both parties will share confidential information, or 'Unilateral' if only one party will disclose information to the other.",
    disclosingParty: "The official legal name of the entity or individual disclosing the confidential information (e.g., 'Acme Technologies Pvt Ltd').",
    disclosingPartyAddress: "The registered address or principal place of business of the disclosing party.",
    receivingParty: "The official legal name of the entity or individual receiving the confidential information (e.g., 'John Doe' or 'Beta Consultants').",
    receivingPartyAddress: "The registered address or principal place of business of the receiving party.",
    effectiveDate: "The exact date when this agreement becomes active and legally binding.",
    purpose: "The reason why the parties are sharing information (e.g., 'Evaluating a software development collaboration' or 'Discussing a potential merger').",
    confidentialityTerm: "The duration (in months) that the Receiving Party must keep the information confidential after disclosure (e.g., '24' or '36').",
    governingJurisdiction: "The Indian state whose laws govern this contract, and where any legal disputes will be resolved (e.g., 'Maharashtra' or 'Delhi').",
    docType: "Select whether to generate a Non-Disclosure Agreement (NDA) or a Freelance/Service Agreement.",
    clientName: "The official legal name of the individual or company hiring the freelancer (e.g., 'Acme Technologies Pvt Ltd').",
    clientAddress: "The registered address or principal place of business of the client.",
    freelancerName: "The official legal name of the freelancer or contractor performing the services (e.g., 'Jane Doe').",
    freelancerAddress: "The residential or business address of the freelancer or contractor.",
    scopeOfWork: "Provide a clear description of the services, deliverables, and expectations (e.g., 'Frontend React development for SaaS dashboard').",
    paymentAmount: "The total contract value to be paid for the completed services.",
    paymentSchedule: "Select whether payment is a one-time fee upon completion, broken down into milestone payments, or recurring monthly/weekly.",
    terminationNoticePeriod: "The notice period in days required by either party to terminate the agreement early (e.g., '30' or '15').",
  };

  return helpTexts[fieldName] || "Fill in this field with the required details.";
}
