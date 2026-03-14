// Centralized Supabase CRUD service for all BNG Remodel tables.
// Every screen imports from here instead of calling supabase directly.

import { supabase } from './supabase';
import { Database } from '../types/database';

// ── Type aliases for convenience ──
type LeadRow = Database['public']['Tables']['leads']['Row'];
type LeadInsert = Database['public']['Tables']['leads']['Insert'];
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
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [projectsRes, leadsRes] = await Promise.all([
    supabase.from('projects').select('status'),
    supabase.from('leads').select('status'),
  ]);

  const projects = projectsRes.data ?? [];
  const leads = leadsRes.data ?? [];

  return {
    totalProjects: projects.length,
    activeProjects: projects.filter((p: any) => p.status === 'active').length,
    completedProjects: projects.filter((p: any) => p.status === 'completed').length,
    pendingProjects: projects.filter((p: any) => p.status === 'pending').length,
    totalLeads: leads.length,
    newLeads: leads.filter((l: any) => l.status === 'new').length,
  };
}
