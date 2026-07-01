-- ============================================================
-- MIGRATION: อัปเกรดระบบเดิม (ร้านเดียว) ให้รองรับ "หลายร้าน"
-- รันสคริปต์นี้ทั้งหมดรวดเดียวใน Supabase SQL Editor
-- ปลอดภัย รันซ้ำได้ ไม่ลบข้อมูลเดิม (ตาราง shop_settings เดิมจะไม่ถูกลบ)
-- ============================================================

-- 1) สร้างตาราง shops (ร้านค้า 1 แถว = 1 ร้าน)
create table if not exists shops (
  id uuid primary key default gen_random_uuid(),
  shop_name text default 'ร้านค้าของฉัน',
  system_prompt text default '',
  admin_username text unique not null,
  admin_password_hash text not null default '',
  ai_provider text default 'anthropic',
  ai_style text default 'balanced',
  anthropic_api_key text default '',
  openai_api_key text default '',
  gemini_api_key text default '',
  facebook_page_access_token text default '',
  facebook_verify_token text default '',
  line_channel_access_token text default '',
  line_channel_secret text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2) ย้ายร้านเดิม (จาก shop_settings แถวเดียว) มาเป็น "ร้านแรก" ในระบบใหม่
create temporary table if not exists _migrated_shop (shop_id uuid);

do $$
declare
  old_row record;
  v_shop_id uuid;
  v_username text;
begin
  if not exists (select 1 from _migrated_shop)
     and exists (select 1 from information_schema.tables where table_name = 'shop_settings') then

    select * into old_row from shop_settings where id = 1;

    if found then
      v_username := coalesce(nullif(old_row.admin_username, ''), 'admin');

      if exists (select 1 from shops where admin_username = v_username) then
        select id into v_shop_id from shops where admin_username = v_username;
      else
        insert into shops (
          shop_name, system_prompt, admin_username, admin_password_hash,
          ai_provider, ai_style, anthropic_api_key, openai_api_key, gemini_api_key,
          facebook_page_access_token, facebook_verify_token,
          line_channel_access_token, line_channel_secret
        ) values (
          coalesce(old_row.shop_name, 'ร้านค้าของฉัน'), coalesce(old_row.system_prompt, ''),
          v_username, coalesce(old_row.admin_password_hash, ''),
          coalesce(old_row.ai_provider, 'anthropic'), coalesce(old_row.ai_style, 'balanced'),
          coalesce(old_row.anthropic_api_key, ''), coalesce(old_row.openai_api_key, ''), coalesce(old_row.gemini_api_key, ''),
          coalesce(old_row.facebook_page_access_token, ''), coalesce(old_row.facebook_verify_token, ''),
          coalesce(old_row.line_channel_access_token, ''), coalesce(old_row.line_channel_secret, '')
        )
        returning id into v_shop_id;
      end if;

      insert into _migrated_shop (shop_id) values (v_shop_id);
    end if;
  end if;
end $$;

-- 3) เพิ่มคอลัมน์ shop_id ในตาราง products และ customers
alter table products  add column if not exists shop_id uuid references shops(id) on delete cascade;
alter table customers add column if not exists shop_id uuid references shops(id) on delete cascade;

-- 4) เติม shop_id ให้ข้อมูลเดิมทั้งหมด (ผูกกับ "ร้านแรก" ที่ย้ายมาจากขั้นตอนที่ 2)
update products  set shop_id = (select shop_id from _migrated_shop limit 1)
  where shop_id is null and exists (select 1 from _migrated_shop);
update customers set shop_id = (select shop_id from _migrated_shop limit 1)
  where shop_id is null and exists (select 1 from _migrated_shop);

-- 5) ปรับ unique constraint ของ customers ให้แยกตามร้าน (เดิมแยกแค่ platform+user)
alter table customers drop constraint if exists customers_platform_platform_user_id_key;
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'customers_shop_platform_user_key'
  ) then
    alter table customers add constraint customers_shop_platform_user_key
      unique (shop_id, platform, platform_user_id);
  end if;
end $$;

-- 6) บังคับ shop_id ห้ามว่าง (ทำเฉพาะถ้าทุกแถวมีค่าแล้ว เพื่อความปลอดภัย)
do $$
begin
  if not exists (select 1 from products where shop_id is null) then
    alter table products alter column shop_id set not null;
  end if;
  if not exists (select 1 from customers where shop_id is null) then
    alter table customers alter column shop_id set not null;
  end if;
end $$;

create index if not exists idx_products_shop on products(shop_id);

-- 7) ตรวจสอบผลลัพธ์ — รันดูหลัง migrate เพื่อความมั่นใจ
select id, shop_name, admin_username from shops;
select count(*) as products_without_shop from products where shop_id is null;
select count(*) as customers_without_shop from customers where shop_id is null;

-- หมายเหตุ:
-- - ตาราง shop_settings เดิม "ไม่ถูกลบ" โดย migration นี้ (เก็บไว้เป็น backup)
--   เมื่อมั่นใจว่าระบบใหม่ทำงานถูกต้องแล้ว ค่อยลบเองภายหลังด้วย: drop table shop_settings;
-- - Username เดิมของร้านคุณ (ที่ใช้ล็อกอิน /admin อยู่ตอนนี้) ยังใช้ได้เหมือนเดิม
--   รหัสผ่านเดิมก็ยังใช้ได้ เพราะย้าย hash มาโดยตรง ไม่ต้องตั้งรหัสใหม่
