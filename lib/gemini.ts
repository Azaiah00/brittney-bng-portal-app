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
// 3. Generate Full Proposal
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
