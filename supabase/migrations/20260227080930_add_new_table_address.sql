create table customer_address (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null unique,
  customer_address text not null,
  customer_phone text not null,
  customer_gstin text,
  created_at timestamp default now()
);