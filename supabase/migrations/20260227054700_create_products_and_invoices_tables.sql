/*
  # Invoice Management System Schema

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text) - Product name
      - `hsn` (text) - HSN code for GST
      - `default_price` (numeric) - Default unit price
      - `created_at` (timestamptz)
      
    - `invoices`
      - `id` (uuid, primary key)
      - `invoice_number` (text, unique) - Auto-generated invoice number
      - `customer_name` (text) - Customer name
      - `customer_address` (text) - Customer address
      - `customer_phone` (text) - Customer phone
      - `customer_gstin` (text, optional) - Customer GSTIN
      - `boxes` (text) - Box details
      - `invoice_date` (date) - Invoice date
      - `tax_type` (text) - 'IGST' or 'SGST_CGST'
      - `sub_total` (numeric) - Subtotal before tax
      - `total_tax` (numeric) - Total tax amount
      - `grand_total` (numeric) - Final amount
      - `created_at` (timestamptz)
      
    - `invoice_items`
      - `id` (uuid, primary key)
      - `invoice_id` (uuid, foreign key to invoices)
      - `product_id` (uuid, foreign key to products)
      - `product_name` (text)
      - `hsn` (text)
      - `quantity` (integer)
      - `unit_price` (numeric)
      - `net_value` (numeric)
      - `tax_amount` (numeric)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (since this is a simple invoice system)
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  hsn text NOT NULL,
  default_price numeric(10, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_address text NOT NULL,
  customer_phone text NOT NULL,
  customer_gstin text DEFAULT '',
  boxes text DEFAULT '',
  invoice_date date NOT NULL,
  tax_type text NOT NULL,
  sub_total numeric(10, 2) NOT NULL,
  total_tax numeric(10, 2) NOT NULL,
  grand_total numeric(10, 2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  product_name text NOT NULL,
  hsn text NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric(10, 2) NOT NULL,
  net_value numeric(10, 2) NOT NULL,
  tax_amount numeric(10, 2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to products"
  ON products FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to products"
  ON products FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public read access to invoices"
  ON invoices FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to invoices"
  ON invoices FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public read access to invoice_items"
  ON invoice_items FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to invoice_items"
  ON invoice_items FOR INSERT
  TO anon
  WITH CHECK (true);

-- Insert sample products from the reference invoice
INSERT INTO products (name, hsn, default_price) VALUES
  ('PAIN OIL 100 L', '25050011', 60.00),
  ('CALCIUM+ TABLET', '21006999', 100.00),
  ('JOINT CARE ADVANCE SOFTGEL', '21006999', 100.00),
  ('IRON JUICE 500 ML', '22042011', 70.00),
  ('FLAX SEED SOFTGEL', '21006999', 70.00)
ON CONFLICT DO NOTHING;