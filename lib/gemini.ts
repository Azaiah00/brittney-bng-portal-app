// Gemini AI Service for BNG Remodel
// All AI features call through this module.
// Uses Gemini 2.5 Flash for fast, structured JSON responses.

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// ---------------------------------------------------------------------------
// Core API call helper
// ---------------------------------------------------------------------------

async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured. Add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.');
  }

  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response from Gemini API.');
  }

  return text;
}

// Safely parse JSON from Gemini, stripping markdown fences if present
function safeParseJSON<T>(raw: string): T {
  const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(cleaned) as T;
}

// ---------------------------------------------------------------------------
// 1. Parse Lead Notes
// ---------------------------------------------------------------------------

export interface ParsedLead {
  name: string;
  phone: string;
  address: string;
  projectType: string;
  rooms: string[];
  scopeSummary: string;
  estimatedBudgetRange: string;
}

export async function parseLeadNotes(rawText: string): Promise<ParsedLead> {
  const prompt = `You are an AI assistant for a home remodeling contractor called BNG Remodel, based in the Richmond VA area.

Given the following raw notes from a potential client interaction, extract the structured information below. If a field is not found, use an empty string or empty array. Make your best guess based on context.

RAW NOTES:
"""
${rawText}
"""

Return ONLY valid JSON in this exact format:
{
  "name": "Client full name (or 'Unknown' if not found)",
  "phone": "Phone number if found",
  "address": "Property address if found",
  "projectType": "Brief type like 'Bathroom Remodel', 'Kitchen Remodel', 'Full Renovation', etc.",
  "rooms": ["List of rooms/areas mentioned"],
  "scopeSummary": "A 2-3 sentence summary of the work described",
  "estimatedBudgetRange": "Rough budget range if mentioned or inferable, e.g. '$15,000 - $25,000', or 'Not specified'"
}`;

  const raw = await callGemini(prompt);
  return safeParseJSON<ParsedLead>(raw);
}

// ---------------------------------------------------------------------------
// 2. Generate Estimate Line Items
// ---------------------------------------------------------------------------

export interface EstimateLineItem {
  service: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface GeneratedEstimate {
  lineItems: EstimateLineItem[];
  subtotal: number;
  notes: string;
}

export async function generateEstimateItems(
  scopeText: string,
  projectType: string
): Promise<GeneratedEstimate> {
  const prompt = `You are a cost estimator AI for BNG Remodel, a licensed contractor in Richmond, Virginia.

Given the project type and scope of work below, generate a detailed line-item estimate with realistic contractor pricing for the Richmond VA market. Include labor and materials. Use typical mid-range pricing.

PROJECT TYPE: ${projectType}

SCOPE OF WORK:
"""
${scopeText}
"""

Return ONLY valid JSON in this exact format:
{
  "lineItems": [
    {
      "service": "Short service name (e.g. 'Bathroom Demo')",
      "description": "Brief description of what this covers",
      "quantity": 1,
      "unit": "unit type like 'ea', 'sq ft', 'linear ft', 'hr', 'lot'",
      "unitPrice": 1500.00
    }
  ],
  "subtotal": 0,
  "notes": "Any important notes about assumptions, exclusions, or market conditions"
}

Make sure subtotal equals the sum of (quantity * unitPrice) for all items. Be thorough — include demo, rough-in, finish work, fixtures, materials, labor, permits, and cleanup as separate items where applicable.`;

  const raw = await callGemini(prompt);
  return safeParseJSON<GeneratedEstimate>(raw);
}

// ---------------------------------------------------------------------------
// 3. Generate Full Proposal (legacy — kept for backwards compat)
// ---------------------------------------------------------------------------

export interface ProposalSection {
  section: string;
  items: string[];
}

export interface GeneratedProposal {
  companyIntro: string;
  scopeOfWork: ProposalSection[];
  timeline: string;
  paymentTerms: string;
  exclusions: string[];
  warranty: string;
}

export async function generateProposal(projectDetails: {
  clientName: string;
  address: string;
  projectType: string;
  scopeText: string;
  estimateTotal?: string;
}): Promise<GeneratedProposal> {
  const prompt = `You are a professional proposal writer for BNG Remodel, a licensed and insured home remodeling contractor based in Richmond, Virginia. Owner: Brittney Reader.

Write a structured proposal for the following project. The tone should be professional, warm, and confident. Use clear language a homeowner can understand.

CLIENT: ${projectDetails.clientName}
ADDRESS: ${projectDetails.address}
PROJECT TYPE: ${projectDetails.projectType}
${projectDetails.estimateTotal ? `ESTIMATE TOTAL: ${projectDetails.estimateTotal}` : ''}

SCOPE OF WORK:
"""
${projectDetails.scopeText}
"""

Return ONLY valid JSON in this exact format:
{
  "companyIntro": "A warm 2-3 sentence intro thanking the client and introducing BNG Remodel's qualifications",
  "scopeOfWork": [
    {
      "section": "Room or area name (e.g. 'Bathroom Remodel')",
      "items": [
        "Detailed work item 1",
        "Detailed work item 2"
      ]
    }
  ],
  "timeline": "Estimated project duration and key milestones (e.g. '4-6 weeks from start date. Week 1-2: Demo and rough-in...')",
  "paymentTerms": "Professional payment schedule (e.g. '30% deposit to begin, 30% at rough-in completion, 30% at substantial completion, 10% upon final walkthrough and punch list')",
  "exclusions": [
    "Items NOT included (e.g. 'Appliance purchases', 'Structural engineering', 'Asbestos or lead abatement if discovered')"
  ],
  "warranty": "Warranty terms (e.g. '1-year warranty on all workmanship. Manufacturer warranties apply to all fixtures and materials installed.')"
}

Be thorough with the scope of work. Organize it by room or area. Each item should be specific and actionable.`;

  const raw = await callGemini(prompt);
  return safeParseJSON<GeneratedProposal>(raw);
}

// ---------------------------------------------------------------------------
// 4. Generate Email / SMS Message (BTB-Hub-inspired message generator)
// ---------------------------------------------------------------------------
// Produces a professional, ready-to-send message based on a chosen topic.
// Supports two modes: "reply" (paste inbound email and get a response) and
// "compose" (describe situation and get a fresh message).

export interface GeneratedMessage {
  subject: string;
  body: string;
  summary: string;
}

export async function generateMessage(details: {
  topic: string;
  context: string;
  mode: 'reply' | 'compose';
}): Promise<GeneratedMessage> {
  const modeInstructions =
    details.mode === 'reply'
      ? `The user pasted an inbound message from a client, subcontractor, or vendor. Write a professional REPLY to that message.`
      : `The user described a situation. Write a professional NEW message (email or text) for that situation.`;

  const prompt = `You are a professional communications assistant for BNG Remodel, a licensed and insured home remodeling contractor in Richmond, Virginia. Owner: Brittney Reader.

${modeInstructions}

TOPIC / SCENARIO: ${details.topic}

CONTEXT / INBOUND MESSAGE:
"""
${details.context}
"""

INSTRUCTIONS:
- Write in a warm, professional tone. Keep it concise — no more than 3-4 short paragraphs.
- Use BNG Remodel branding naturally (company name, owner name where appropriate).
- If the topic involves money, reference BNG's 30/40/30 payment schedule if relevant.
- Do NOT include placeholder brackets like [NAME] — fill in naturally from context, or use generic "valued client" / "team" if no name is given.
- Include a clear call to action at the end when appropriate.

Return ONLY valid JSON:
{
  "subject": "Email subject line (or short title for SMS)",
  "body": "The full message text, ready to send. Use line breaks for paragraphs.",
  "summary": "One-sentence internal note for Brittney about what this message does"
}`;

  const raw = await callGemini(prompt);
  return safeParseJSON<GeneratedMessage>(raw);
}

// ---------------------------------------------------------------------------
// 5. Generate Contract Proposal (for the proposal/contract screen)
// ---------------------------------------------------------------------------
// Produces structured data that populates the manual form fields.
// Must be extremely accurate and thorough for Brittney's remodeling business.

export interface ContractLineItem {
  service: string;
  quantity: number;
  unitPrice: number;
}

export interface ContractProposal {
  scopeOfWork: string;
  lineItems: ContractLineItem[];
  subtotal: number;
  timeline: string;
  startDate: string;
  completionDate: string;
  specialConditions: string;
}

export async function generateContractProposal(details: {
  clientName: string;
  address: string;
  projectType: string;
  scopeText: string;
  estimateTotal?: number;
}): Promise<ContractProposal> {
  const prompt = `You are a senior estimator and proposal writer for BNG Remodel, a licensed and insured general contractor in Richmond, Virginia. Owner: Brittney Reader. BNG specializes in residential and commercial remodeling (kitchens, bathrooms, full renovations, flooring, siding, painting, etc.).

Your job is to create a PERFECT, DETAILED, and PROFESSIONAL proposal from the scope of work provided. This will be attached to BNG Remodel's standard contract and sent directly to the client. Accuracy is critical.

CLIENT: ${details.clientName}
PROPERTY ADDRESS: ${details.address}
PROJECT TYPE: ${details.projectType}
${details.estimateTotal ? `BUDGET/ESTIMATE: $${details.estimateTotal.toLocaleString()}` : ''}

SCOPE OF WORK / JOB NOTES:
"""
${details.scopeText}
"""

INSTRUCTIONS:
1. Write a thorough "scopeOfWork" description that covers EVERY item of work. Use clear, professional language. Organize by area/room. Include specific details about materials, finishes, and labor. This must be complete enough that the client knows exactly what they are paying for.
2. Generate detailed "lineItems" with realistic Richmond VA contractor pricing. Include EVERY item as a separate line: demolition, rough-in, finish work, materials, fixtures, labor, cleanup, dumpster, permits, etc. Each line item needs a service name, quantity (use 1 if lump sum), and unit price. Be precise.
3. Calculate "subtotal" as the exact sum of (quantity * unitPrice) for all line items.
4. Write a "timeline" describing the project phases and estimated duration (e.g. "Week 1-2: Demolition and rough-in. Week 3-4: Finish carpentry and tile. Week 5: Final fixtures, paint, and punch list.").
5. Suggest a realistic "startDate" and "completionDate" in YYYY-MM-DD format. Use dates roughly 2-4 weeks from today for start, and add the project duration for completion.
6. Add any "specialConditions" that are specific to THIS project (e.g. "Client to select tile by March 30", "Access via back entrance only", etc.). If none, use empty string.

Return ONLY valid JSON:
{
  "scopeOfWork": "Full detailed scope paragraph(s)",
  "lineItems": [
    { "service": "Service name", "quantity": 1, "unitPrice": 1500.00 }
  ],
  "subtotal": 0,
  "timeline": "Phase-by-phase timeline",
  "startDate": "YYYY-MM-DD",
  "completionDate": "YYYY-MM-DD",
  "specialConditions": "Any project-specific conditions or empty string"
}

Be thorough, realistic, and professional. This must be perfect — Brittney's reputation depends on it.`;

  const raw = await callGemini(prompt);
  return safeParseJSON<ContractProposal>(raw);
}
