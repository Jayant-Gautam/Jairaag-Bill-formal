-- PRODUCTS TABLE
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  hsn text not null,
  default_price numeric not null,
  created_at timestamp default now()
);

-- INVOICES TABLE
create table invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  customer_name text not null,
  customer_address text not null,
  customer_phone text not null,
  customer_gstin text,
  boxes text,
  invoice_date date not null,
  tax_type text check (tax_type in ('IGST', 'SGST_CGST')),
  sub_total numeric not null,
  total_tax numeric not null,
  grand_total numeric not null,
  created_at timestamp default now()
);

-- INVOICE ITEMS TABLE
create table invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices(id) on delete cascade,
  product_id uuid references products(id),
  product_name text not null,
  hsn text not null,
  quantity integer not null,
  unit_price numeric not null,
  net_value numeric not null,
  tax_amount numeric not null
);