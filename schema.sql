-- รันสคริปต์นี้ใน Supabase Dashboard > SQL Editor
-- (ถ้าเคยรันแล้ว สามารถรันซ้ำได้เลย จะไม่ลบข้อมูลเดิม)

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
  platform text not null,
  platform_user_id text not null,
  display_name text,
  created_at timestamptz default now(),
  unique (platform, platform_user_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz default now()
);

create index if not exists idx_messages_customer on messages(customer_id, created_at);

create table if not exists shop_settings (
  id int primary key default 1,

  -- ข้อมูลร้าน
  shop_name text default 'ร้านค้าของฉัน',
  system_prompt text default '',

  -- Admin login (username + password hash)
  admin_username text default 'admin',
  admin_password_hash text default '',  -- SHA-256 hex ของรหัสผ่าน
  is_setup_done boolean default false,  -- false = ยังไม่เคยตั้งรหัสผ่านครั้งแรก

  -- AI provider
  ai_provider text default 'anthropic', -- 'anthropic' | 'openai' | 'gemini'

  -- API keys (เก็บใน DB แทน Vercel env)
  anthropic_api_key text default '',
  openai_api_key text default '',
  gemini_api_key text default '',

  -- Facebook Messenger
  facebook_page_access_token text default '',
  facebook_verify_token text default '',

  -- LINE Official Account
  line_channel_access_token text default '',
  line_channel_secret text default '',

  updated_at timestamptz default now()
);

insert into shop_settings (id) values (1) on conflict (id) do nothing;
