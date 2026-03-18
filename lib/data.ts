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
