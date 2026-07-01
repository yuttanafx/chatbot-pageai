# ระบบ AI ตอบแชทลูกค้า + ปิดการขาย (Facebook / LINE) — รองรับหลายร้าน

ระบบนี้รับข้อความจากลูกค้าผ่าน Facebook Messenger และ LINE Official Account
ส่งให้ AI (Claude) ตอบโดยอิงข้อมูลสินค้าที่คุณตั้งค่าไว้ในหน้า Admin
แล้วส่งคำตอบกลับไปหาลูกค้าโดยอัตโนมัติ

**ระบบนี้รองรับหลายร้านค้าในระบบเดียว (multi-shop)** แต่ละร้านมี:
- Username/Password ของตัวเอง (ล็อกอินแยกกัน)
- Facebook Page + LINE OA ของตัวเอง (Webhook URL ไม่ซ้ำกัน)
- สินค้า, ลูกค้า, ประวัติแชท แยกจากกันเด็ดขาด — ร้าน A มองไม่เห็นข้อมูลร้าน B

## โครงสร้างระบบ
- `/admin` หน้าเข้าสู่ระบบ / สร้างร้านใหม่ / จัดการสินค้า
- `/api/webhook/facebook/<shopId>` Webhook รับข้อความจาก Messenger ของร้านนั้นๆ
- `/api/webhook/line/<shopId>` Webhook รับข้อความจาก LINE ของร้านนั้นๆ
- ฐานข้อมูล: Supabase (ตาราง `shops`, `products`, `customers`, `messages`)
- AI: Claude API (Anthropic) หรือ OpenAI / Gemini เลือกได้ต่อร้าน

`<shopId>` เป็นรหัสเฉพาะของแต่ละร้าน ดูได้ในหน้า `/admin` แท็บ "ตั้งค่าระบบ"
(มีปุ่มคัดลอก URL ให้พร้อมใช้)

---

## ขั้นตอนที่ 1 — ตั้งค่า Supabase (ฐานข้อมูล)

**ถ้าเป็นการติดตั้งใหม่ (ยังไม่เคยมีข้อมูล):**
1. สมัคร/เข้า https://supabase.com สร้างโปรเจกต์ใหม่ (ฟรี)
2. ไปที่ **SQL Editor** แล้ววางเนื้อหาในไฟล์ `schema.sql` ที่แนบมา กด Run
3. ไปที่ **Project Settings > API** คัดลอก:
   - `Project URL` → ใช้เป็น `SUPABASE_URL`
   - `service_role` key (ไม่ใช่ anon key) → ใช้เป็น `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ service_role key ห้ามเปิดเผยที่ไหนนอกจาก Environment Variables บน Vercel

**ถ้าเคยใช้ระบบเวอร์ชันเดิม (ร้านเดียว) มาก่อน และมีข้อมูล/สินค้าอยู่แล้ว:**
1. ไปที่ **SQL Editor** วางเนื้อหาไฟล์ `migration_multishop.sql` ที่แนบมาแทน แล้วกด Run
   (สคริปต์นี้จะย้ายร้านเดิมของคุณมาเป็น "ร้านแรก" ในระบบใหม่โดยอัตโนมัติ
   Username/Password เดิมที่คุณใช้ล็อกอิน `/admin` อยู่ ยังใช้ได้เหมือนเดิม ไม่ต้องตั้งใหม่)
2. หลัง migrate แล้ว ให้ deploy โค้ดเวอร์ชันใหม่นี้ทับของเดิม แล้วเข้า `/admin` ล็อกอินด้วยบัญชีเดิมได้เลย
3. **สำคัญ:** เพราะ Webhook URL เปลี่ยนจาก `/api/webhook/facebook` เป็น `/api/webhook/facebook/<shopId>`
   ต้องกลับไปอัปเดต Webhook URL ใหม่ในหน้า Facebook Developer และ LINE Developers ด้วย
   (ดู shopId และคัดลอก URL เต็มได้จากหน้า `/admin` แท็บ "ตั้งค่าระบบ")

## ขั้นตอนที่ 2 — เตรียม Anthropic API key
1. ไปที่ https://console.anthropic.com สร้าง API key
2. เก็บไว้ใช้เป็น `ANTHROPIC_API_KEY`

## ขั้นตอนที่ 3 — Deploy ขึ้น Vercel ก่อน (ต้องมี URL จริงให้ Facebook/LINE เรียก)
1. นำโค้ดทั้งหมด push ขึ้น GitHub repo
2. ไปที่ https://vercel.com > New Project > เลือก repo นี้
3. ใน **Environment Variables** ใส่ค่าตามไฟล์ `.env.example`:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - `SESSION_SECRET` (ตั้งเป็น string สุ่มยาวๆ)
4. กด Deploy

## ขั้นตอนที่ 4 — สร้างร้านแรก / เพิ่มร้านใหม่
1. เข้า `https://<โดเมนของคุณ>.vercel.app/admin`
2. กดแท็บ **"สร้างร้านใหม่"** ตั้งชื่อร้าน + username + password ของร้านนั้น
   (ทำซ้ำขั้นตอนนี้ได้เรื่อยๆ เพื่อเพิ่มร้านใหม่ — แต่ละร้านต้องใช้ username ไม่ซ้ำกัน)
3. หลังล็อกอินเข้าไป จะเห็นแท็บ **"⚙️ ตั้งค่าระบบ"** ซึ่งมี **Webhook URL เฉพาะของร้านนี้**
   (มีปุ่ม "คัดลอก" ให้กดคัดลอกได้เลย)

## ขั้นตอนที่ 5 — ตั้งค่า Anthropic / OpenAI / Gemini API key ของร้าน
ในหน้า `/admin` > ตั้งค่าระบบ > ใส่ API key ของผู้ให้บริการ AI ที่ต้องการใช้ (เลือกได้ 1 อย่างต่อร้าน)
- Claude: สมัคร key ที่ https://console.anthropic.com
- OpenAI: สมัคร key ที่ https://platform.openai.com
- Gemini: สมัคร key ที่ https://aistudio.google.com

## ขั้นตอนที่ 6 — ตั้งค่า Facebook Messenger ของร้านนี้
1. ไปที่ https://developers.facebook.com สร้าง App ประเภท Business
2. เพิ่มผลิตภัณฑ์ **Messenger**
3. ใน Messenger > Settings สร้าง **Page Access Token** จากเพจของคุณ
   → นำไปใส่ในหน้า `/admin` > ตั้งค่าระบบ > "Page Access Token"
4. ตั้งค่า **Verify Token** เองในหน้า `/admin` (ตั้งเป็นค่าอะไรก็ได้ที่คุณจำได้)
5. กลับไปที่ Facebook Developer ตั้งค่า **Webhook**:
   - Callback URL: **คัดลอกจากหน้า `/admin` ตั้งค่าระบบ** (รูปแบบ `https://<โดเมน>/api/webhook/facebook/<shopId>`)
   - Verify Token: ใส่ค่าเดียวกับที่ตั้งในหน้า `/admin`
   - Subscribe to fields: เลือก `messages`

## ขั้นตอนที่ 7 — ตั้งค่า LINE Official Account ของร้านนี้
1. ไปที่ https://developers.line.biz สร้าง Provider และ Messaging API Channel
2. ใน **Messaging API** tab:
   - สร้าง **Channel Access Token** → ใส่ในหน้า `/admin` > ตั้งค่าระบบ
   - คัดลอก **Channel Secret** → ใส่ในหน้า `/admin` > ตั้งค่าระบบ
   - ตั้ง Webhook URL: **คัดลอกจากหน้า `/admin`** (รูปแบบ `https://<โดเมน>/api/webhook/line/<shopId>`)
   - เปิด "Use webhook"
   - ปิด "Auto-reply messages" และ "Greeting messages" ของ LINE Official Account (ในแอป LINE Official Account Manager) เพื่อไม่ให้ชนกับ AI

## ขั้นตอนที่ 8 — ใช้งาน
1. เข้า `/admin` แท็บ "🛍️ จัดการสินค้า" เพิ่มสินค้าของร้านนี้ (ชื่อ, ราคา, จำนวน, รายละเอียด)
   — AI จะใช้ข้อมูลนี้ตอบลูกค้าทันที ไม่ต้องแก้โค้ด
2. ทดสอบทักแชทเข้าเพจ Facebook หรือ LINE OA ของร้านนี้ ระบบจะตอบอัตโนมัติ
3. อยากเพิ่มร้านอื่นอีก? ออกจากระบบแล้วกด "สร้างร้านใหม่" ทำซ้ำตั้งแต่ขั้นตอนที่ 4 ได้เลย

---

## ปรับแต่งเพิ่มเติม
- ปรับโทนการตอบ/นโยบายร้าน: แก้ในหน้า `/admin` > ตั้งค่าระบบ > "คำสั่งพิเศษ AI"
  (หรือแก้ตรงในตาราง `shops` คอลัมน์ `system_prompt` ผ่าน Supabase Table editor — ระบุแถวด้วย `id` ของร้านนั้น)
- ถ้าอยากให้แอดมินเข้ามาดูแลแชทแทน AI ในบางเคส สามารถต่อยอดจากตาราง `messages` ที่บันทึกประวัติไว้ครบแล้ว
- ทุกร้านแยกข้อมูลกันด้วยคอลัมน์ `shop_id` ในตาราง `products`, `customers` และผ่านตาราง `customers` สำหรับ `messages`

## ข้อควรระวัง
- อย่า commit ไฟล์ `.env` หรือ `.env.local` ขึ้น GitHub โดยเด็ดขาด (มีคีย์ลับอยู่)
- `service_role key` ของ Supabase มีสิทธิ์เต็ม ห้ามใส่ในโค้ดฝั่ง client
- Username ของแต่ละร้านต้องไม่ซ้ำกันทั้งระบบ (ใช้ตรวจสอบตอนล็อกอินว่าเป็นร้านไหน)
- shopId ที่อยู่ใน Webhook URL ไม่ใช่ความลับระดับสูง แต่ก็ไม่ควรเผยแพร่โดยไม่จำเป็น
  เพราะระบุได้ว่า URL นี้เป็นของร้านไหน
