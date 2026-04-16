import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Link {
  id: string;
  user_id: string | null;
  title: string;
  url: string;
  description: string;
  category: string;
  order_index: number;
  favicon_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}
