-- รันสคริปต์นี้ใน Supabase Dashboard > SQL Editor
-- ใช้สำหรับ "ติดตั้งใหม่" เท่านั้น (ยังไม่เคยมีข้อมูลเดิม)
-- ถ้าโปรเจกต์ของคุณเคยรัน schema.sql เวอร์ชันเก่ามาก่อนแล้ว (มีตาราง shop_settings)
-- ให้ใช้ไฟล์ migration_multishop.sql แทน เพื่อย้ายข้อมูลเดิมมาอย่างปลอดภัย

-- ระบบนี้รองรับ "หลายร้าน" ในระบบเดียว แต่ละร้านมี Facebook Page / LINE OA /
-- สินค้า / ลูกค้า / ประวัติแชท แยกจากกันอิสระ ผ่านตาราง shops

create table if not exists shops (
  id uuid primary key default gen_random_uuid(),

  -- ข้อมูลร้าน
  shop_name text default 'ร้านค้าของฉัน',
  system_prompt text default '',

  -- Admin login ของร้านนี้ (username ต้องไม่ซ้ำกันทั้งระบบ)
  admin_username text unique not null,
  admin_password_hash text not null, -- SHA-256 hex ของรหัสผ่าน

  -- AI provider
  ai_provider text default 'anthropic', -- 'anthropic' | 'openai' | 'gemini'
  ai_style text default 'balanced', -- 'formal' | 'balanced' | 'natural' | 'casual'

  -- API keys (เก็บใน DB แทน Vercel env)
  anthropic_api_key text default '',
  openai_api_key text default '',
  gemini_api_key text default '',

  -- Facebook Messenger ของร้านนี้
  facebook_page_access_token text default '',
  facebook_verify_token text default '',

  -- LINE Official Account ของร้านนี้
  line_channel_access_token text default '',
  line_channel_secret text default '',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  name text not null,
  description text,
  price numeric,
  stock integer default 0,
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create index if not exists idx_products_shop on products(shop_id);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  platform text not null,
  platform_user_id text not null,
  display_name text,
  created_at timestamptz default now(),
  unique (shop_id, platform, platform_user_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz default now()
);

create index if not exists idx_messages_customer on messages(customer_id, created_at);

-- Supabase Storage bucket สำหรับรูปสินค้า (ใช้ร่วมกันทุกร้าน แยกโฟลเดอร์ตาม shop_id)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- อนุญาตให้ upload ได้จาก server (service role) เท่านั้น
create policy "service role upload" on storage.objects
  for insert to service_role with check (bucket_id = 'product-images');

-- หมายเหตุ: ไม่ต้องมี policy "public read" เพราะ bucket เป็น public bucket อยู่แล้ว
-- (เข้าไฟล์ผ่าน public URL ได้โดยไม่ต้องพึ่ง RLS แต่จะไม่เปิดให้ "list" ไฟล์ทั้งหมดได้)
