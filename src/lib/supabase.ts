import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export type UserRole = 'customer' | 'staff' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  avg_service_time_minutes: number;
  capacity_per_slot: number;
  is_active: boolean;
  created_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  service_id: string;
  appointment_date: string;
  appointment_time: string;
  queue_number: string;
  status: 'waiting' | 'served' | 'cancelled' | 'no_show';
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  served_at?: string;
  cancelled_at?: string;
  served_by?: string;
  created_at: string;
  updated_at: string;
}

export interface QueueStatus {
  id: string;
  service_id: string;
  appointment_date: string;
  current_queue_number?: string;
  total_waiting: number;
  total_served: number;
  last_updated: string;
}
