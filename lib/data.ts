// Centralized Supabase CRUD service for all BNG Remodel tables.
// Every screen imports from here instead of calling supabase directly.

import { supabase } from './supabase';
import { Database } from '../types/database';

// ── Type aliases for convenience ──
type LeadSourceRow = Database['public']['Tables']['lead_sources']['Row'];
type LeadSourceInsert = Database['public']['Tables']['lead_sources']['Insert'];
type LeadRow = Database['public']['Tables']['leads']['Row'];
type LeadInsert = Database['public']['Tables']['leads']['Insert'];
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

  const customer = await createCustomer({
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    address: lead.address,
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
