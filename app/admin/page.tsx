"use client";

import { useEffect, useState } from "react";

type Product = {
  id: string; name: string; description: string;
  price: number; stock: number; image_url: string; is_active: boolean;
};

type Settings = {
  shop_name: string; system_prompt: string; admin_username: string; ai_provider: string;
  anthropic_api_key: string; openai_api_key: string; gemini_api_key: string;
  facebook_page_access_token: string; facebook_verify_token: string;
  line_channel_access_token: string; line_channel_secret: string;
};

const emptyProduct = { name: "", description: "", price: 0, stock: 0, image_url: "", is_active: true };

// ---------- ส่วน Login ----------
function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isFirst, setIsFirst] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      if (data.firstSetup) setIsFirst(true);
      setTimeout(onLogin, isFirst ? 1500 : 0);
    } else {
      const data = await res.json();
      setError(data.error ?? "เข้าสู่ระบบไม่สำเร็จ");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-paper">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white border border-line rounded-2xl p-8">
        <h1 className="font-display text-2xl font-semibold mb-1">
          {isFirst ? "🎉 ตั้งค่าครั้งแรกสำเร็จ!" : "เข้าสู่ระบบ"}
        </h1>
        <p className="text-sm text-ink/50 mb-6">
          {isFirst
            ? "กำลังพาคุณไปหน้าจัดการ..."
            : "ระบบ AI ตอบแชทลูกค้าอัตโนมัติ"}
        </p>
        {!isFirst && (
          <>
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-line rounded-lg px-4 py-2.5 mb-3 outline-none focus:border-moss"
              autoFocus
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-line rounded-lg px-4 py-2.5 mb-3 outline-none focus:border-moss"
            />
            {error && <p className="text-clay text-sm mb-3">{error}</p>}
            <button disabled={loading} className="w-full bg-ink text-paper rounded-lg py-2.5 hover:bg-moss transition-colors disabled:opacity-50">
              {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
            </button>
            <p className="text-xs text-ink/30 mt-4 text-center">
              เข้าครั้งแรก? ใส่ username และ password ที่ต้องการได้เลย ระบบจะตั้งค่าให้อัตโนมัติ
            </p>
          </>
        )}
      </form>
    </main>
  );
}

// ---------- ส่วน Settings ----------
function SettingsTab() {
  const [s, setS] = useState<Partial<Settings>>({});
  const [newUser, setNewUser] = useState("");
  const [newPass, setNewPass] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings").then((r) => r.json()).then((d) => setS(d));
  }, []);

  async function save(extra?: Record<string, string>) {
    setSaving(true); setMsg("");
    const body: Record<string, any> = {
      shop_name: s.shop_name,
      system_prompt: s.system_prompt,
      ai_provider: s.ai_provider,
      anthropic_api_key: s.anthropic_api_key,
      openai_api_key: s.openai_api_key,
      gemini_api_key: s.gemini_api_key,
      facebook_page_access_token: s.facebook_page_access_token,
      facebook_verify_token: s.facebook_verify_token,
      line_channel_access_token: s.line_channel_access_token,
      line_channel_secret: s.line_channel_secret,
      ...extra,
    };
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setMsg(res.ok ? "✅ บันทึกสำเร็จ" : "❌ บันทึกไม่สำเร็จ");
    setTimeout(() => setMsg(""), 3000);
  }

  const field = (key: keyof Settings, label: string, type = "text", placeholder = "") => (
    <div>
      <label className="block text-xs text-ink/50 mb-1">{label}</label>
      <input
        type={type}
        value={s[key] ?? ""}
        onChange={(e) => setS({ ...s, [key]: e.target.value })}
        placeholder={placeholder || label}
        className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-moss font-mono"
      />
    </div>
  );

  return (
    <div className="grid gap-6">
      {/* ร้านค้า */}
      <section className="bg-white border border-line rounded-2xl p-6 grid gap-4">
        <h2 className="font-display text-lg">ข้อมูลร้านและ AI</h2>
        {field("shop_name", "ชื่อร้าน")}
        <div>
          <label className="block text-xs text-ink/50 mb-1">เลือก AI ที่ใช้ตอบแชท</label>
          <select
            value={s.ai_provider ?? "anthropic"}
            onChange={(e) => setS({ ...s, ai_provider: e.target.value })}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-moss"
          >
            <option value="anthropic">Claude (Anthropic)</option>
            <option value="openai">GPT (OpenAI)</option>
            <option value="gemini">Gemini (Google)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink/50 mb-1">คำสั่งพิเศษสำหรับ AI (เช่น โทน, โปรโมชั่น, นโยบายร้าน)</label>
          <textarea
            value={s.system_prompt ?? ""}
            onChange={(e) => setS({ ...s, system_prompt: e.target.value })}
            rows={3}
            placeholder="เช่น: ถ้าลูกค้าซื้อมากกว่า 3 ชิ้นให้แจ้งว่าลด 10% / จัดส่งฟรีเมื่อซื้อครบ 500 บาท"
            className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-moss"
          />
        </div>
      </section>

      {/* API Keys */}
      <section className="bg-white border border-line rounded-2xl p-6 grid gap-4">
        <h2 className="font-display text-lg">API Keys ของ AI</h2>
        <p className="text-xs text-ink/40">ใส่เฉพาะตัวที่ใช้งาน ค่าที่มี ••• อยู่แล้วไม่ต้องใส่ใหม่</p>
        {field("anthropic_api_key", "Anthropic API Key (Claude)", "password", "sk-ant-...")}
        {field("openai_api_key",    "OpenAI API Key (GPT)",       "password", "sk-...")}
        {field("gemini_api_key",    "Gemini API Key (Google)",    "password", "AIza...")}
      </section>

      {/* Facebook */}
      <section className="bg-white border border-line rounded-2xl p-6 grid gap-4">
        <h2 className="font-display text-lg">Facebook Messenger</h2>
        {field("facebook_page_access_token", "Page Access Token", "password")}
        {field("facebook_verify_token",      "Verify Token (ตั้งเองได้ เช่น myshop_verify_2025)")}
        <p className="text-xs text-ink/40">
          Webhook URL: <code className="bg-line px-1 rounded">https://[โดเมนคุณ].vercel.app/api/webhook/facebook</code>
        </p>
      </section>

      {/* LINE */}
      <section className="bg-white border border-line rounded-2xl p-6 grid gap-4">
        <h2 className="font-display text-lg">LINE Official Account</h2>
        {field("line_channel_access_token", "Channel Access Token", "password")}
        {field("line_channel_secret",       "Channel Secret",       "password")}
        <p className="text-xs text-ink/40">
          Webhook URL: <code className="bg-line px-1 rounded">https://[โดเมนคุณ].vercel.app/api/webhook/line</code>
        </p>
      </section>

      {/* เปลี่ยนรหัสผ่าน Admin */}
      <section className="bg-white border border-line rounded-2xl p-6 grid gap-4">
        <h2 className="font-display text-lg">เปลี่ยน Username / Password</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-ink/50 mb-1">Username ใหม่</label>
            <input
              value={newUser}
              onChange={(e) => setNewUser(e.target.value)}
              placeholder={s.admin_username ?? "admin"}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-moss"
            />
          </div>
          <div>
            <label className="block text-xs text-ink/50 mb-1">Password ใหม่</label>
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="ใส่รหัสผ่านใหม่"
              className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-moss"
            />
          </div>
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button
          onClick={() =>
            save(
              newUser && newPass
                ? { new_username: newUser, new_password: newPass }
                : undefined
            )
          }
          disabled={saving}
          className="bg-ink text-paper px-6 py-2.5 rounded-lg hover:bg-moss transition-colors disabled:opacity-50"
        >
          {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่าทั้งหมด"}
        </button>
        {msg && <span className="text-sm">{msg}</span>}
      </div>
    </div>
  );
}

// ---------- หน้าหลัก Admin ----------
export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<"products" | "settings">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [loading, setLoading] = useState(false);

  async function loadProducts() {
    const res = await fetch("/api/admin/products");
    if (res.status === 401) { setAuthed(false); return; }
    const data = await res.json();
    setProducts(data.products ?? []);
    setAuthed(true);
  }

  useEffect(() => { loadProducts(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    if (editingId) {
      await fetch(`/api/admin/products/${editingId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/admin/products", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
    }
    setForm(emptyProduct); setEditingId(null);
    setLoading(false); await loadProducts();
  }

  async function handleDelete(id: string) {
    if (!confirm("ลบสินค้านี้ใช่ไหม?")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    await loadProducts();
  }

  if (authed === null) return (
    <div className="min-h-screen flex items-center justify-center text-ink/30">กำลังโหลด...</div>
  );

  if (!authed) return <LoginForm onLogin={() => loadProducts()} />;

  return (
    <main className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold">ระบบจัดการ</h1>
        <button
          onClick={async () => {
            await fetch("/api/admin/login", { method: "DELETE" });
            setAuthed(false);
          }}
          className="text-sm text-ink/40 hover:text-clay"
        >
          ออกจากระบบ
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-line rounded-xl p-1 mb-6">
        {(["products", "settings"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
              tab === t ? "bg-white shadow-sm font-medium" : "text-ink/50 hover:text-ink"
            }`}
          >
            {t === "products" ? "🛍️ จัดการสินค้า" : "⚙️ ตั้งค่าระบบ"}
          </button>
        ))}
      </div>

      {/* Products Tab */}
      {tab === "products" && (
        <div className="grid gap-4">
          <form onSubmit={handleSubmit} className="bg-white border border-line rounded-2xl p-5 grid gap-3">
            <p className="font-display text-base">{editingId ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <input required placeholder="ชื่อสินค้า" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-moss" />
              <input type="number" placeholder="ราคา (บาท)" value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-moss" />
              <input type="number" placeholder="จำนวนคงเหลือ" value={form.stock}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                className="border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-moss" />
              <input placeholder="ลิงก์รูปภาพ (ไม่บังคับ)" value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className="border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-moss" />
            </div>
            <textarea placeholder="รายละเอียดสินค้า (AI จะใช้ข้อมูลนี้ตอบลูกค้า)" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
              className="border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-moss" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              เปิดขาย (AI จะแนะนำสินค้านี้ให้ลูกค้า)
            </label>
            <div className="flex gap-3">
              <button disabled={loading}
                className="bg-ink text-paper rounded-lg px-5 py-2 text-sm hover:bg-moss transition-colors disabled:opacity-50">
                {editingId ? "บันทึก" : "เพิ่มสินค้า"}
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setForm(emptyProduct); }}
                  className="text-sm text-ink/40 hover:text-clay">ยกเลิก</button>
              )}
            </div>
          </form>

          {products.length === 0 && (
            <p className="text-ink/30 text-center py-10 text-sm">ยังไม่มีสินค้า เพิ่มด้านบนได้เลย</p>
          )}
          {products.map((p) => (
            <div key={p.id} className="bg-white border border-line rounded-xl px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">
                  {p.name} {!p.is_active && <span className="text-xs text-ink/30">(ปิดขาย)</span>}
                </p>
                <p className="text-xs text-ink/40">{p.price} บาท · คงเหลือ {p.stock} ชิ้น</p>
              </div>
              <div className="flex gap-3 text-sm flex-shrink-0">
                <button onClick={() => { setEditingId(p.id); setForm({ name: p.name, description: p.description ?? "", price: p.price, stock: p.stock, image_url: p.image_url ?? "", is_active: p.is_active }); }}
                  className="text-moss hover:underline">แก้ไข</button>
                <button onClick={() => handleDelete(p.id)} className="text-clay hover:underline">ลบ</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Settings Tab */}
      {tab === "settings" && <SettingsTab />}
    </main>
  );
}
