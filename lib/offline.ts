// Offline lead queue with automatic Supabase sync.
// Saves to AsyncStorage first, then syncs to Supabase when possible.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLead } from './data';
import { Database } from '../types/database';

type LeadInsert = Database['public']['Tables']['leads']['Insert'];

const OFFLINE_QUEUE_KEY = '@bng_offline_leads_queue';

// Save a lead -- tries Supabase first, falls back to offline queue
export async function saveLeadOffline(lead: LeadInsert) {
  try {
    // Try direct Supabase insert first
    const saved = await createLead(lead);
    return saved;
  } catch {
    // Supabase unavailable -- queue locally
    const existingQueueStr = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    const existingQueue: (LeadInsert & { _offlineId?: string })[] =
      existingQueueStr ? JSON.parse(existingQueueStr) : [];

    const leadToSave = {
      ...lead,
      _offlineId: Math.random().toString(36).substring(7),
    };

    existingQueue.push(leadToSave);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(existingQueue));
    return leadToSave;
  }
}

export async function getOfflineLeads(): Promise<LeadInsert[]> {
  try {
    const queueStr = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return queueStr ? JSON.parse(queueStr) : [];
  } catch (error) {
    console.error('Error getting offline leads:', error);
    return [];
  }
}

// Push any queued leads to Supabase and clear them from local storage
export async function syncOfflineLeads() {
  try {
    const queue = await getOfflineLeads();
    if (queue.length === 0) return;

    const successfulIds: string[] = [];

    for (const lead of queue) {
      const { _offlineId, ...leadData } = lead as any;
      try {
        await createLead(leadData);
        if (_offlineId) successfulIds.push(_offlineId);
      } catch (error) {
        console.error('Failed to sync lead:', error);
      }
    }

    // Keep only leads that failed to sync
    const remaining = queue.filter(
      (l: any) => !successfulIds.includes(l._offlineId)
    );
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
  } catch (error) {
    console.error('Error syncing offline leads:', error);
  }
}
