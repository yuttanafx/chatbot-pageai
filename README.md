# ระบบ AI ตอบแชทลูกค้า + ปิดการขาย (Facebook / LINE)

ระบบนี้รับข้อความจากลูกค้าผ่าน Facebook Messenger และ LINE Official Account
ส่งให้ AI (Claude) ตอบโดยอิงข้อมูลสินค้าที่คุณตั้งค่าไว้ในหน้า Admin
แล้วส่งคำตอบกลับไปหาลูกค้าโดยอัตโนมัติ

## โครงสร้างระบบ
- `/admin` หน้าเพิ่ม/แก้/ลบสินค้า (ป้องกันด้วยรหัสผ่าน)
- `/api/webhook/facebook` รับข้อความจาก Messenger
- `/api/webhook/line` รับข้อความจาก LINE
- ฐานข้อมูล: Supabase (เก็บสินค้า, ลูกค้า, ประวัติแชท)
- AI: Claude API (Anthropic)

---

## ขั้นตอนที่ 1 — ตั้งค่า Supabase (ฐานข้อมูล)
1. สมัคร/เข้า https://supabase.com สร้างโปรเจกต์ใหม่ (ฟรี)
2. ไปที่ **SQL Editor** แล้ววางเนื้อหาในไฟล์ `schema.sql` ที่แนบมา กด Run
3. ไปที่ **Project Settings > API** คัดลอก:
   - `Project URL` → ใช้เป็น `SUPABASE_URL`
   - `service_role` key (ไม่ใช่ anon key) → ใช้เป็น `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ service_role key ห้ามเปิดเผยที่ไหนนอกจาก Environment Variables บน Vercel

## ขั้นตอนที่ 2 — เตรียม Anthropic API key
1. ไปที่ https://console.anthropic.com สร้าง API key
2. เก็บไว้ใช้เป็น `ANTHROPIC_API_KEY`

## ขั้นตอนที่ 3 — ตั้งค่า Facebook Messenger
1. ไปที่ https://developers.facebook.com สร้าง App ประเภท Business
2. เพิ่มผลิตภัณฑ์ **Messenger**
3. ใน Messenger > Settings สร้าง **Page Access Token** จากเพจของคุณ → ใช้เป็น `FACEBOOK_PAGE_ACCESS_TOKEN`
4. ตั้งค่า **Webhook**:
   - Callback URL: `https://<โดเมนของคุณ>.vercel.app/api/webhook/facebook`
   - Verify Token: ตั้งเอง (ค่าเดียวกับที่จะใส่ใน `FACEBOOK_VERIFY_TOKEN`)
   - Subscribe to fields: เลือก `messages`
5. ⚠️ ขั้นตอนนี้ทำได้หลัง deploy ขึ้น Vercel แล้วเท่านั้น (ต้องมี URL จริงให้ Facebook เรียก)

## ขั้นตอนที่ 4 — ตั้งค่า LINE Official Account
1. ไปที่ https://developers.line.biz สร้าง Provider และ Messaging API Channel
2. ใน **Messaging API** tab:
   - สร้าง **Channel Access Token** → ใช้เป็น `LINE_CHANNEL_ACCESS_TOKEN`
   - คัดลอก **Channel Secret** → ใช้เป็น `LINE_CHANNEL_SECRET`
   - ตั้ง Webhook URL: `https://<โดเมนของคุณ>.vercel.app/api/webhook/line`
   - เปิด "Use webhook"
   - ปิด "Auto-reply messages" และ "Greeting messages" ของ LINE Official Account (ในแอป LINE Official Account Manager) เพื่อไม่ให้ชนกับ AI

## ขั้นตอนที่ 5 — Deploy ขึ้น Vercel
1. นำโค้ดทั้งหมด push ขึ้น GitHub repo
2. ไปที่ https://vercel.com > New Project > เลือก repo นี้
3. ใน **Environment Variables** ใส่ค่าทั้งหมดตามไฟล์ `.env.example`:
   - `ADMIN_PASSWORD` (ตั้งรหัสผ่านสำหรับเข้าหน้า /admin เอง)
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
   - `FACEBOOK_PAGE_ACCESS_TOKEN`, `FACEBOOK_VERIFY_TOKEN`
   - `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET`
4. กด Deploy
5. หลัง deploy เสร็จ ย้อนกลับไปทำขั้นตอนที่ 3-4 (ใส่ Webhook URL จริงที่ Facebook/LINE)

## ขั้นตอนที่ 6 — ใช้งาน
1. เข้า `https://<โดเมนของคุณ>.vercel.app/admin` ใส่รหัสผ่านที่ตั้งไว้
2. เพิ่มสินค้าของคุณ (ชื่อ, ราคา, จำนวน, รายละเอียด) — AI จะใช้ข้อมูลนี้ตอบลูกค้าทันที ไม่ต้องแก้โค้ด
3. ทดสอบทักแชทเข้าเพจ Facebook หรือ LINE OA ของคุณ ระบบจะตอบอัตโนมัติ

---

## ปรับแต่งเพิ่มเติม
- ปรับโทนการตอบ/นโยบายร้าน: แก้ในตาราง `shop_settings` (คอลัมน์ `system_prompt`) ผ่าน Supabase Table editor
- ถ้าอยากให้แอดมินเข้ามาดูแลแชทแทน AI ในบางเคส สามารถต่อยอดจากตาราง `messages` ที่บันทึกประวัติไว้ครบแล้ว

## ข้อควรระวัง
- อย่า commit ไฟล์ `.env` หรือ `.env.local` ขึ้น GitHub โดยเด็ดขาด (มีคีย์ลับอยู่)
- `service_role key` ของ Supabase มีสิทธิ์เต็ม ห้ามใส่ในโค้ดฝั่ง client
