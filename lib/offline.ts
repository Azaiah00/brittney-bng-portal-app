import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { Database } from '../types/database';

type LeadInsert = Database['public']['Tables']['leads']['Insert'];

const OFFLINE_QUEUE_KEY = '@bng_offline_leads_queue';

export async function saveLeadOffline(lead: LeadInsert) {
  try {
    const existingQueueStr = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    const existingQueue: LeadInsert[] = existingQueueStr ? JSON.parse(existingQueueStr) : [];
    
    // Add a temporary ID if not present so we can track it
    const leadToSave = {
      ...lead,
      id: lead.id || Math.random().toString(36).substring(7),
      _isOffline: true,
    };
    
    existingQueue.push(leadToSave);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(existingQueue));
    return leadToSave;
  } catch (error) {
    console.error('Error saving lead offline:', error);
    throw error;
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

export async function syncOfflineLeads() {
  try {
    const queue = await getOfflineLeads();
    if (queue.length === 0) return;

    const successfulSyncs: string[] = [];

    for (const lead of queue) {
      // Remove temporary offline flags/ids before sending to Supabase
      const { _isOffline, id, ...leadData } = lead as any;
      
      const { error } = await supabase
        .from('leads')
        .insert([leadData]);

      if (!error) {
        successfulSyncs.push(id);
      } else {
        console.error('Failed to sync lead:', error);
      }
    }

    // Remove successful syncs from queue
    const remainingQueue = queue.filter(
      (lead: any) => !successfulSyncs.includes(lead.id)
    );
    
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
  } catch (error) {
    console.error('Error syncing offline leads:', error);
  }
}
