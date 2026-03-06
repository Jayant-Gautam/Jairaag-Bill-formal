import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Product {
  id: string;
  name: string;
  hsn: string;
  default_price: number;
  stock_available: number;
}

export interface InvoiceItem {
  product_id: string;
  product_name: string;
  hsn: string;
  quantity: number;
  unit_price: number;
  net_value: number;
  tax_amount: number;
}

export interface Invoice {
  invoice_number: string;
  customer_name: string;
  customer_address: string;
  customer_phone: string;
  customer_gstin?: string;
  boxes: string;
  invoice_date: string;
  tax_type: 'IGST' | 'SGST_CGST';
  sub_total: number;
  total_tax: number;
  grand_total: number;
  items: InvoiceItem[];
}

export interface CustomerAddress {
  id: string;
  customer_name: string;
  customer_address: string;
  customer_phone: string;
  customer_gstin?: string;
}
