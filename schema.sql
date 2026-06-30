-- รันสคริปต์นี้ใน Supabase Dashboard > SQL Editor

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric,
  stock integer default 0,
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  platform text not null,              -- 'facebook' | 'line'
  platform_user_id text not null,      -- PSID (FB) หรือ userId (LINE)
  display_name text,
  created_at timestamptz default now(),
  unique (platform, platform_user_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  role text not null,                  -- 'user' | 'assistant'
  content text not null,
  created_at timestamptz default now()
);

create index if not exists idx_messages_customer on messages(customer_id, created_at);

-- ข้อมูลธุรกิจ/บริบทที่ AI ใช้ตอบลูกค้า (โปรโมชั่น, นโยบายร้าน, การจัดส่ง ฯลฯ)
create table if not exists shop_settings (
  id int primary key default 1,
  shop_name text default 'ร้านค้าของฉัน',
  system_prompt text default '',
  updated_at timestamptz default now()
);

insert into shop_settings (id) values (1) on conflict (id) do nothing;
