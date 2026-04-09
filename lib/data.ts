// Centralized Supabase CRUD service for all BNG Remodel tables.
// Every screen imports from here instead of calling supabase directly.

import { supabase } from './supabase';
import { Database } from '../types/database';

// ── Type aliases for convenience ──
type LeadSourceRow = Database['public']['Tables']['lead_sources']['Row'];
type LeadSourceInsert = Database['public']['Tables']['lead_sources']['Insert'];
type LeadRow = Database['public']['Tables']['leads']['Row'];
type LeadInsert = Database['public']['Tables']['leads']['Insert'];
type LeadUpdate = Database['public']['Tables']['leads']['Update'];
type CustomerRow = Database['public']['Tables']['customers']['Row'];
type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type CustomerUpdate = Database['public']['Tables']['customers']['Update'];
type ProjectRow = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];
type LogRow = Database['public']['Tables']['logs']['Row'];
type LogInsert = Database['public']['Tables']['logs']['Insert'];
type EstimateRow = Database['public']['Tables']['estimates']['Row'];
type EstimateInsert = Database['public']['Tables']['estimates']['Insert'];
type EventRow = Database['public']['Tables']['events']['Row'];
type EventInsert = Database['public']['Tables']['events']['Insert'];
type ProposalRow = Database['public']['Tables']['proposals']['Row'];
type ProposalInsert = Database['public']['Tables']['proposals']['Insert'];
type ProposalUpdate = Database['public']['Tables']['proposals']['Update'];
type SubcontractorRow = Database['public']['Tables']['subcontractors']['Row'];
type SubcontractorInsert = Database['public']['Tables']['subcontractors']['Insert'];
type SubcontractorUpdate = Database['public']['Tables']['subcontractors']['Update'];
type ChecklistRow = Database['public']['Tables']['checklists']['Row'];
type ChecklistInsert = Database['public']['Tables']['checklists']['Insert'];
type ChecklistUpdate = Database['public']['Tables']['checklists']['Update'];
type PunchItemRow = Database['public']['Tables']['punch_items']['Row'];
type PunchItemInsert = Database['public']['Tables']['punch_items']['Insert'];
type PunchItemUpdate = Database['public']['Tables']['punch_items']['Update'];
export type ContactNoteRow = Database['public']['Tables']['contact_notes']['Row'];
type ContactNoteInsert = Database['public']['Tables']['contact_notes']['Insert'];
type ContactNoteUpdate = Database['public']['Tables']['contact_notes']['Update'];
type ContactMediaRow = Database['public']['Tables']['contact_media']['Row'];
type ContactMediaInsert = Database['public']['Tables']['contact_media']['Insert'];
type ContactTodoRow = Database['public']['Tables']['contact_todos']['Row'];
type ContactTodoInsert = Database['public']['Tables']['contact_todos']['Insert'];
type ContactTodoUpdate = Database['public']['Tables']['contact_todos']['Update'];
type ContactActivityLogRow = Database['public']['Tables']['contact_activity_logs']['Row'];
type ContactActivityLogInsert = Database['public']['Tables']['contact_activity_logs']['Insert'];
type ContactActivityLogUpdate = Database['public']['Tables']['contact_activity_logs']['Update'];

/** Which side of the unified contact model (lead vs customer) a row belongs to. */
export type ContactRef = { kind: 'lead'; id: string } | { kind: 'customer'; id: string };

// ─────────────────────────────────────────────────────────────
// LEADS
// ─────────────────────────────────────────────────────────────

export async function fetchLeads(): Promise<LeadRow[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as LeadRow[];
}

export async function fetchLead(id: string): Promise<LeadRow | null> {
  const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();
  if (error && error.code !== 'PGRST116') throw error;
  return (data as LeadRow) ?? null;
}

export async function createLead(lead: LeadInsert): Promise<LeadRow> {
  const { data, error } = await supabase
    .from('leads')
    .insert([lead])
    .select()
    .single();
  if (error) throw error;
  return data as LeadRow;
}

export async function updateLeadStatus(
  id: string,
  status: LeadRow['status']
): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

export async function updateLead(id: string, updates: LeadUpdate): Promise<void> {
  const { error } = await supabase.from('leads').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteLead(id: string): Promise<void> {
  const { error } = await supabase.from('leads').delete().eq('id', id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// LEAD SOURCES
// ─────────────────────────────────────────────────────────────

export async function fetchLeadSources(): Promise<LeadSourceRow[]> {
  const { data, error } = await supabase
    .from('lead_sources')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as LeadSourceRow[];
}

export async function createLeadSource(name: string): Promise<LeadSourceRow> {
  const { data, error } = await supabase
    .from('lead_sources')
    .insert([{ name: name.trim() }])
    .select()
    .single();
  if (error) throw error;
  return data as LeadSourceRow;
}

// ─────────────────────────────────────────────────────────────
// CUSTOMERS
// ─────────────────────────────────────────────────────────────

export async function fetchCustomers(): Promise<CustomerRow[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as CustomerRow[];
}

export async function fetchCustomer(id: string): Promise<CustomerRow | null> {
  const { data, error } = await supabase.from('customers').select('*').eq('id', id).single();
  if (error && error.code !== 'PGRST116') throw error;
  return (data as CustomerRow) ?? null;
}

export async function createCustomer(customer: CustomerInsert): Promise<CustomerRow> {
  const { data, error } = await supabase
    .from('customers')
    .insert([customer])
    .select()
    .single();
  if (error) throw error;
  return data as CustomerRow;
}

export async function updateCustomer(id: string, updates: CustomerUpdate): Promise<void> {
  const { error } = await supabase.from('customers').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase.from('customers').delete().eq('id', id);
  if (error) throw error;
}

/** Create a customer from a lead and set lead status to converted. */
export async function convertLeadToCustomer(leadId: string): Promise<CustomerRow> {
  const { data: lead, error: leadErr } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();
  if (leadErr || !lead) throw new Error('Lead not found');

  // Build name from first_name + last_name, or fall back to legacy name field
  const l = lead as LeadRow & { first_name?: string | null; last_name?: string | null };
  const fullName =
    l.first_name && l.last_name
      ? `${l.first_name} ${l.last_name}`.trim()
      : (lead.name || 'Unknown');

  const customer = await createCustomer({
    name: fullName,
    first_name: l.first_name || null,
    last_name: l.last_name || null,
    company_name: (l as any).company_name ?? null,
    phone: lead.phone,
    email: lead.email,
    alternate_email: (l as any).alternate_email ?? null,
    address: lead.address,
    address_line_1: (l as any).address_line_1 ?? null,
    address_line_2: (l as any).address_line_2 ?? null,
    city: (l as any).city ?? null,
    state: (l as any).state ?? null,
    zip_code: (l as any).zip_code ?? null,
    project_type: lead.project_type,
    notes: lead.notes,
    lead_source_id: lead.lead_source_id,
    converted_from_lead_id: leadId,
    status: 'active',
  });

  await updateLeadStatus(leadId, 'converted');
  return customer;
}

// ─────────────────────────────────────────────────────────────
// PROJECTS
// ─────────────────────────────────────────────────────────────

export async function fetchProjects(): Promise<ProjectRow[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProjectRow[];
}

export async function fetchProject(id: string): Promise<ProjectRow | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return (data as ProjectRow) ?? null;
}

export async function createProject(project: ProjectInsert): Promise<ProjectRow> {
  const { data, error } = await supabase
    .from('projects')
    .insert([project])
    .select()
    .single();
  if (error) throw error;
  return data as ProjectRow;
}

export async function updateProject(
  id: string,
  updates: ProjectUpdate
): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// LOGS (project timeline entries)
// ─────────────────────────────────────────────────────────────

export async function fetchLogs(projectId: string): Promise<LogRow[]> {
  const { data, error } = await supabase
    .from('logs')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as LogRow[];
}

export async function createLog(log: LogInsert): Promise<LogRow> {
  const { data, error } = await supabase
    .from('logs')
    .insert([log])
    .select()
    .single();
  if (error) throw error;
  return data as LogRow;
}

// ─────────────────────────────────────────────────────────────
// ESTIMATES
// ─────────────────────────────────────────────────────────────

export async function fetchEstimates(projectId: string): Promise<EstimateRow[]> {
  const { data, error } = await supabase
    .from('estimates')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as EstimateRow[];
}

export async function saveEstimate(estimate: EstimateInsert): Promise<EstimateRow> {
  const { data, error } = await supabase
    .from('estimates')
    .insert([estimate])
    .select()
    .single();
  if (error) throw error;
  return data as EstimateRow;
}

// ─────────────────────────────────────────────────────────────
// EVENTS (calendar)
// ─────────────────────────────────────────────────────────────

export async function fetchEvents(startDate?: string, endDate?: string): Promise<EventRow[]> {
  let query = supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });

  if (startDate) query = query.gte('event_date', startDate);
  if (endDate) query = query.lte('event_date', endDate);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as EventRow[];
}

export async function createEvent(event: EventInsert): Promise<EventRow> {
  const { data, error } = await supabase
    .from('events')
    .insert([event])
    .select()
    .single();
  if (error) throw error;
  return data as EventRow;
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// PROPOSALS (contract / proposal documents)
// ─────────────────────────────────────────────────────────────

export async function fetchProposals(projectId: string): Promise<ProposalRow[]> {
  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProposalRow[];
}

export async function saveProposal(proposal: ProposalInsert): Promise<ProposalRow> {
  const { data, error } = await supabase
    .from('proposals')
    .insert([proposal])
    .select()
    .single();
  if (error) throw error;
  return data as ProposalRow;
}

export async function updateProposal(id: string, updates: ProposalUpdate): Promise<void> {
  const { error } = await supabase.from('proposals').update(updates).eq('id', id);
  if (error) throw error;
}

export async function fetchProposal(id: string): Promise<ProposalRow | null> {
  const { data, error } = await supabase.from('proposals').select('*').eq('id', id).single();
  if (error && error.code !== 'PGRST116') throw error;
  return (data as ProposalRow) ?? null;
}

// Call the esign-send Edge Function to send a proposal for e-signature
export async function sendForSignature(
  proposalId: string,
  signerEmail: string,
  signerName: string,
  pdfHtml?: string
): Promise<{ signing_link: string; signature_status: string }> {
  const { data, error } = await supabase.functions.invoke('esign-send', {
    body: {
      proposal_id: proposalId,
      signer_email: signerEmail,
      signer_name: signerName,
      pdf_html: pdfHtml,
    },
  });
  if (error) throw error;
  return data;
}

// Call the esign-status Edge Function to check signing status
export async function checkSignatureStatus(
  proposalId: string
): Promise<{ signature_status: string; signed: boolean }> {
  const { data, error } = await supabase.functions.invoke('esign-status', {
    body: { proposal_id: proposalId },
  });
  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────────────────────
// USER INTEGRATIONS (Google Calendar, etc.)
// ─────────────────────────────────────────────────────────────

type IntegrationRow = Database['public']['Tables']['user_integrations']['Row'];

export async function fetchIntegration(
  userId: string,
  provider: string
): Promise<IntegrationRow | null> {
  const { data, error } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .maybeSingle();
  if (error) throw error;
  return (data as IntegrationRow) ?? null;
}

export async function disconnectIntegration(
  userId: string,
  provider: string
): Promise<void> {
  const { error } = await supabase
    .from('user_integrations')
    .delete()
    .eq('user_id', userId)
    .eq('provider', provider);
  if (error) throw error;
}

// Trigger Google Calendar sync via Edge Function
export async function syncGoogleCalendar(userId: string): Promise<{ synced: number }> {
  const { data, error } = await supabase.functions.invoke('calendar-sync', {
    body: { user_id: userId },
  });
  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD STATS (aggregated counts)
// ─────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  pendingProjects: number;
  totalLeads: number;
  newLeads: number;
  totalCustomers: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [projectsRes, leadsRes, customersRes] = await Promise.all([
    supabase.from('projects').select('status'),
    supabase.from('leads').select('status'),
    supabase.from('customers').select('id'),
  ]);

  const projects = projectsRes.data ?? [];
  const leads = leadsRes.data ?? [];
  const customers = customersRes.data ?? [];

  return {
    totalProjects: projects.length,
    activeProjects: projects.filter((p: any) => p.status === 'active').length,
    completedProjects: projects.filter((p: any) => p.status === 'completed').length,
    pendingProjects: projects.filter((p: any) => p.status === 'pending').length,
    totalLeads: leads.length,
    newLeads: leads.filter((l: any) => l.status === 'new').length,
    totalCustomers: customers.length,
  };
}

// ─────────────────────────────────────────────────────────────
// SUBCONTRACTORS (crew roster)
// ─────────────────────────────────────────────────────────────

export async function fetchSubcontractors(): Promise<SubcontractorRow[]> {
  const { data, error } = await supabase
    .from('subcontractors')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as SubcontractorRow[];
}

export async function fetchSubcontractor(id: string): Promise<SubcontractorRow | null> {
  const { data, error } = await supabase.from('subcontractors').select('*').eq('id', id).single();
  if (error && error.code !== 'PGRST116') throw error;
  return (data as SubcontractorRow) ?? null;
}

export async function createSubcontractor(sub: SubcontractorInsert): Promise<SubcontractorRow> {
  const { data, error } = await supabase
    .from('subcontractors')
    .insert([sub])
    .select()
    .single();
  if (error) throw error;
  return data as SubcontractorRow;
}

export async function updateSubcontractor(id: string, updates: SubcontractorUpdate): Promise<void> {
  const { error } = await supabase.from('subcontractors').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteSubcontractor(id: string): Promise<void> {
  const { error } = await supabase.from('subcontractors').delete().eq('id', id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// CHECKLISTS (per-project job checklist)
// ─────────────────────────────────────────────────────────────

export async function fetchChecklist(projectId: string): Promise<ChecklistRow | null> {
  const { data, error } = await supabase
    .from('checklists')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as ChecklistRow) ?? null;
}

export async function createChecklist(checklist: ChecklistInsert): Promise<ChecklistRow> {
  const { data, error } = await supabase
    .from('checklists')
    .insert([checklist])
    .select()
    .single();
  if (error) throw error;
  return data as ChecklistRow;
}

export async function updateChecklist(id: string, updates: ChecklistUpdate): Promise<void> {
  const { error } = await supabase.from('checklists').update(updates).eq('id', id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// PUNCH ITEMS (per-project punch list)
// ─────────────────────────────────────────────────────────────

export async function fetchPunchItems(projectId: string): Promise<PunchItemRow[]> {
  const { data, error } = await supabase
    .from('punch_items')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as PunchItemRow[];
}

export async function createPunchItem(item: PunchItemInsert): Promise<PunchItemRow> {
  const { data, error } = await supabase
    .from('punch_items')
    .insert([item])
    .select()
    .single();
  if (error) throw error;
  return data as PunchItemRow;
}

export async function updatePunchItem(id: string, updates: PunchItemUpdate): Promise<void> {
  const { error } = await supabase.from('punch_items').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deletePunchItem(id: string): Promise<void> {
  const { error } = await supabase.from('punch_items').delete().eq('id', id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// CONTACT CRM — notes, media, to-dos, activity logs
// ─────────────────────────────────────────────────────────────

function contactFilter(ref: ContactRef) {
  return ref.kind === 'lead'
    ? { lead_id: ref.id, customer_id: null as string | null }
    : { lead_id: null as string | null, customer_id: ref.id };
}

export async function fetchContactNotes(ref: ContactRef): Promise<ContactNoteRow[]> {
  const col = ref.kind === 'lead' ? 'lead_id' : 'customer_id';
  const { data, error } = await supabase
    .from('contact_notes')
    .select('*')
    .eq(col, ref.id)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ContactNoteRow[];
}

/** All notes for the global Notes tab (newest activity first). */
export async function fetchAllContactNotes(): Promise<ContactNoteRow[]> {
  const { data, error } = await supabase
    .from('contact_notes')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ContactNoteRow[];
}

/** General (hub) or null when note is not tied to one contact. */
export function contactRefFromNote(row: ContactNoteRow): ContactRef | null {
  if (row.lead_id) return { kind: 'lead', id: row.lead_id };
  if (row.customer_id) return { kind: 'customer', id: row.customer_id };
  return null;
}

export type ContactNoteSection = {
  key: string;
  title: string;
  data: ContactNoteRow[];
};

/**
 * Group notes for SectionList: General first, then one section per contact (A–Z by name).
 * Within each section, newest updated_at first.
 */
export function groupContactNotesByContact(
  notes: ContactNoteRow[],
  nameByKey: Record<string, string>
): ContactNoteSection[] {
  const general = notes.filter((n) => !n.lead_id && !n.customer_id);
  const byContact = new Map<string, ContactNoteRow[]>();
  for (const n of notes) {
    const key = n.lead_id ? `lead:${n.lead_id}` : n.customer_id ? `customer:${n.customer_id}` : null;
    if (!key) continue;
    if (!byContact.has(key)) byContact.set(key, []);
    byContact.get(key)!.push(n);
  }
  const sortInSection = (arr: ContactNoteRow[]) =>
    [...arr].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const sections: ContactNoteSection[] = [];
  if (general.length > 0) {
    sections.push({
      key: '__general__',
      title: GENERAL_TODO_SECTION_TITLE,
      data: sortInSection(general),
    });
  }
  const keys = [...byContact.keys()].sort((ka, kb) => {
    const na = nameByKey[ka] || ka;
    const nb = nameByKey[kb] || kb;
    return na.localeCompare(nb);
  });
  for (const key of keys) {
    const list = byContact.get(key);
    if (!list?.length) continue;
    sections.push({
      key,
      title: nameByKey[key] || 'Contact',
      data: sortInSection(list),
    });
  }
  return sections;
}

/** Pass null ref for a General note (both FKs null). Requires DB migration contact_notes_contact_fk. */
export async function createContactNote(
  ref: ContactRef | null,
  payload: Pick<ContactNoteInsert, 'title' | 'body'>
): Promise<ContactNoteRow> {
  const now = new Date().toISOString();
  const row = ref
    ? {
        ...contactFilter(ref),
        title: payload.title ?? '',
        body: payload.body ?? '',
        updated_at: now,
      }
    : {
        lead_id: null as null,
        customer_id: null as null,
        title: payload.title ?? '',
        body: payload.body ?? '',
        updated_at: now,
      };
  const { data, error } = await supabase.from('contact_notes').insert([row]).select().single();
  if (error) throw error;
  return data as ContactNoteRow;
}

export async function updateContactNote(id: string, updates: ContactNoteUpdate): Promise<void> {
  const { error } = await supabase
    .from('contact_notes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteContactNote(id: string): Promise<void> {
  const { error } = await supabase.from('contact_notes').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchContactNote(id: string): Promise<ContactNoteRow | null> {
  const { data, error } = await supabase.from('contact_notes').select('*').eq('id', id).single();
  if (error && error.code !== 'PGRST116') throw error;
  return (data as ContactNoteRow) ?? null;
}

export async function fetchContactMedia(ref: ContactRef): Promise<ContactMediaRow[]> {
  const col = ref.kind === 'lead' ? 'lead_id' : 'customer_id';
  const { data, error } = await supabase
    .from('contact_media')
    .select('*')
    .eq(col, ref.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ContactMediaRow[];
}

export async function createContactMediaRow(row: ContactMediaInsert): Promise<ContactMediaRow> {
  const { data, error } = await supabase.from('contact_media').insert([row]).select().single();
  if (error) throw error;
  return data as ContactMediaRow;
}

export async function deleteContactMediaRow(id: string): Promise<void> {
  const { error } = await supabase.from('contact_media').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchContactTodos(ref: ContactRef): Promise<ContactTodoRow[]> {
  const col = ref.kind === 'lead' ? 'lead_id' : 'customer_id';
  const { data, error } = await supabase
    .from('contact_todos')
    .select('*')
    .eq(col, ref.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ContactTodoRow[];
}

/** All to-dos for global list (open first, then by due date). */
export async function fetchAllContactTodos(): Promise<ContactTodoRow[]> {
  const { data, error } = await supabase
    .from('contact_todos')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ContactTodoRow[];
}

export async function createContactTodo(row: ContactTodoInsert): Promise<ContactTodoRow> {
  const { data, error } = await supabase.from('contact_todos').insert([row]).select().single();
  if (error) throw error;
  return data as ContactTodoRow;
}

export async function updateContactTodo(id: string, updates: ContactTodoUpdate): Promise<void> {
  const { error } = await supabase.from('contact_todos').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteContactTodo(id: string): Promise<void> {
  const { error } = await supabase.from('contact_todos').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchContactTodo(id: string): Promise<ContactTodoRow | null> {
  const { data, error } = await supabase.from('contact_todos').select('*').eq('id', id).single();
  if (error && error.code !== 'PGRST116') throw error;
  return (data as ContactTodoRow) ?? null;
}

export async function fetchContactActivityLogs(ref: ContactRef): Promise<ContactActivityLogRow[]> {
  const col = ref.kind === 'lead' ? 'lead_id' : 'customer_id';
  const { data, error } = await supabase
    .from('contact_activity_logs')
    .select('*')
    .eq(col, ref.id)
    .order('occurred_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ContactActivityLogRow[];
}

export async function fetchAllContactActivityLogs(): Promise<ContactActivityLogRow[]> {
  const { data, error } = await supabase
    .from('contact_activity_logs')
    .select('*')
    .order('occurred_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ContactActivityLogRow[];
}

export async function createContactActivityLog(
  row: ContactActivityLogInsert
): Promise<ContactActivityLogRow> {
  const { data, error } = await supabase.from('contact_activity_logs').insert([row]).select().single();
  if (error) throw error;
  return data as ContactActivityLogRow;
}

export async function updateContactActivityLog(
  id: string,
  updates: ContactActivityLogUpdate
): Promise<void> {
  const { error } = await supabase.from('contact_activity_logs').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteContactActivityLog(id: string): Promise<void> {
  const { error } = await supabase.from('contact_activity_logs').delete().eq('id', id);
  if (error) throw error;
}

/** To-dos with a due date in [start, end] (YYYY-MM-DD) for calendar strip. */
export async function fetchContactTodosDueInRange(
  startDate: string,
  endDate: string
): Promise<ContactTodoRow[]> {
  const start = `${startDate}T00:00:00.000Z`;
  const end = `${endDate}T23:59:59.999Z`;
  const { data, error } = await supabase
    .from('contact_todos')
    .select('*')
    .not('due_at', 'is', null)
    .gte('due_at', start)
    .lte('due_at', end)
    .is('completed_at', null);
  if (error) throw error;
  return (data ?? []) as ContactTodoRow[];
}

export function contactRefFromTodo(row: ContactTodoRow): ContactRef | null {
  if (row.lead_id) return { kind: 'lead', id: row.lead_id };
  if (row.customer_id) return { kind: 'customer', id: row.customer_id };
  return null;
}

/** Label for unassigned to-dos (use app-wide for calendar, lists). */
export const GENERAL_TODO_SECTION_TITLE = 'General';

export type ContactTodoSection = {
  key: string;
  title: string;
  data: ContactTodoRow[];
};

/**
 * Group to-dos for SectionList: "General" first, then one section per contact (A–Z by name).
 * Within each section, sorts by due date (soonest first), then newest created.
 */
export function groupContactTodosByContact(
  todos: ContactTodoRow[],
  nameByKey: Record<string, string>
): ContactTodoSection[] {
  const general = todos.filter((t) => !t.lead_id && !t.customer_id);
  const byContact = new Map<string, ContactTodoRow[]>();
  for (const t of todos) {
    const key = t.lead_id ? `lead:${t.lead_id}` : t.customer_id ? `customer:${t.customer_id}` : null;
    if (!key) continue;
    if (!byContact.has(key)) byContact.set(key, []);
    byContact.get(key)!.push(t);
  }
  const sortInSection = (arr: ContactTodoRow[]) =>
    [...arr].sort((a, b) => {
      const ad = a.due_at ? new Date(a.due_at).getTime() : Number.POSITIVE_INFINITY;
      const bd = b.due_at ? new Date(b.due_at).getTime() : Number.POSITIVE_INFINITY;
      if (ad !== bd) return ad - bd;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const sections: ContactTodoSection[] = [];
  if (general.length > 0) {
    sections.push({
      key: '__general__',
      title: GENERAL_TODO_SECTION_TITLE,
      data: sortInSection(general),
    });
  }
  const keys = [...byContact.keys()].sort((ka, kb) => {
    const na = nameByKey[ka] || ka;
    const nb = nameByKey[kb] || kb;
    return na.localeCompare(nb);
  });
  for (const key of keys) {
    const list = byContact.get(key);
    if (!list?.length) continue;
    sections.push({
      key,
      title: nameByKey[key] || 'Contact',
      data: sortInSection(list),
    });
  }
  return sections;
}

export function contactRefFromActivityLog(row: ContactActivityLogRow): ContactRef | null {
  if (row.lead_id) return { kind: 'lead', id: row.lead_id };
  if (row.customer_id) return { kind: 'customer', id: row.customer_id };
  return null;
}
