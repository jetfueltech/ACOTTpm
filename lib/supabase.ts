import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface PropertyDocument {
  id: string;
  property_id: string;
  name: string;
  category: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  notes: string;
  uploaded_at: string;
  created_at: string;
}

export const DOCUMENT_CATEGORIES = [
  { value: 'deed', label: 'Deed' },
  { value: 'contract', label: 'Purchase Contract' },
  { value: 'permit', label: 'Permit' },
  { value: 'lease', label: 'Lease Agreement' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'inspection', label: 'Inspection Report' },
  { value: 'tax', label: 'Tax Document' },
  { value: 'hoa', label: 'HOA Document' },
  { value: 'other', label: 'Other' },
];
