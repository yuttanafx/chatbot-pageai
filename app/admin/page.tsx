"use client";

import { useEffect, useRef, useState } from "react";

// ========== Types ==========
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

// ========== Animated Login ==========
function LoginCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    window.addEventListener("resize", () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    });

    // Nodes & edges
    const N = 55;
    const nodes = Array.from({ length: N }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 1,
      pulse: Math.random() * Math.PI * 2,
    }));

    // Flowing data packets
    const packets: { from: number; to: number; t: number; speed: number }[] = [];
    function spawnPacket() {
      const from = Math.floor(Math.random() * N);
      const to = Math.floor(Math.random() * N);
      if (from !== to) packets.push({ from, to, t: 0, speed: 0.004 + Math.random() * 0.006 });
    }
    setInterval(spawnPacket, 400);

    let frame = 0;
    function draw() {
      frame++;
      ctx.fillStyle = "rgba(4,10,20,0.18)";
      ctx.fillRect(0, 0, W, H);

      // Move nodes
      nodes.forEach((n) => {
        n.x += n.vx; n.y += n.vy;
        n.pulse += 0.03;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      });

      // Draw edges
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.25;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0,200,255,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw packets
      for (let k = packets.length - 1; k >= 0; k--) {
        const p = packets[k];
        p.t += p.speed;
        if (p.t >= 1) { packets.splice(k, 1); continue; }
        const from = nodes[p.from]; const to = nodes[p.to];
        const px = from.x + (to.x - from.x) * p.t;
        const py = from.y + (to.y - from.y) * p.t;
        const grd = ctx.createRadialGradient(px, py, 0, px, py, 5);
        grd.addColorStop(0, "rgba(100,255,220,0.9)");
        grd.addColorStop(1, "rgba(100,255,220,0)");
        ctx.beginPath();
        ctx.fillStyle = grd;
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw nodes
      nodes.forEach((n) => {
        const glow = 0.5 + 0.5 * Math.sin(n.pulse);
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 4);
        grd.addColorStop(0, `rgba(0,210,255,${0.8 * glow})`);
        grd.addColorStop(1, "rgba(0,210,255,0)");
        ctx.beginPath();
        ctx.fillStyle = grd;
        ctx.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = `rgba(180,240,255,${glow})`;
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Scan line
      const scanY = (frame * 0.7) % H;
      const scanGrd = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 8);
      scanGrd.addColorStop(0, "rgba(0,200,255,0)");
      scanGrd.addColorStop(1, "rgba(0,200,255,0.04)");
      ctx.fillStyle = scanGrd;
      ctx.fillRect(0, scanY - 40, W, 48);

      requestAnimationFrame(draw);
    }
    draw();
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [firstSetup, setFirstSetup] = useState(false);
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
      const d = await res.json();
      if (d.firstSetup) { setFirstSetup(true); setTimeout(onLogin, 1800); }
      else onLogin();
    } else {
      const d = await res.json();
      setError(d.error ?? "เข้าสู่ระบบไม่สำเร็จ");
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#040a14]">
      <LoginCanvas />

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: "linear-gradient(rgba(0,180,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,180,255,0.04) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm mx-4">
        {/* Glow ring */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-cyan-400/40 via-transparent to-blue-500/30 blur-sm" />
        <div className="relative rounded-2xl border border-cyan-500/30 bg-[#06101e]/90 backdrop-blur-xl p-8">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
              <span className="text-cyan-300 text-sm">⬡</span>
            </div>
            <div>
              <p className="text-cyan-400 text-xs tracking-widest uppercase">AI SALES SYSTEM</p>
              <p className="text-white/80 text-xs">ระบบตอบแชทอัตโนมัติ</p>
            </div>
          </div>

          {firstSetup ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-cyan-300 font-medium">ตั้งค่าสำเร็จ!</p>
              <p className="text-white/40 text-xs mt-1">กำลังเข้าสู่ระบบ...</p>
            </div>
          ) : (
            <>
              <h1 className="text-white text-xl font-semibold mb-5">เข้าสู่ระบบ</h1>
              <form onSubmit={handleSubmit} className="grid gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500/60 text-xs">USER</span>
                  <input
                    value={username} onChange={(e) => setUsername(e.target.value)}
                    placeholder="username"
                    className="w-full bg-white/5 border border-cyan-500/20 rounded-lg pl-14 pr-4 py-2.5 text-white text-sm outline-none focus:border-cyan-400/60 placeholder:text-white/20 font-mono"
                    autoFocus
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500/60 text-xs">PASS</span>
                  <input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-cyan-500/20 rounded-lg pl-14 pr-4 py-2.5 text-white text-sm outline-none focus:border-cyan-400/60 placeholder:text-white/30 font-mono"
                  />
                </div>
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                    <p className="text-red-400 text-xs">{error}</p>
                  </div>
                )}
                <button
                  disabled={loading}
                  className="mt-1 w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-40 relative overflow-hidden group"
                >
                  <span className="relative z-10">{loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}</span>
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition" />
                </button>
              </form>
              <p className="text-white/20 text-xs text-center mt-4">
                เข้าครั้งแรก? ใส่ username/password ที่ต้องการได้เลย
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ========== Image Upload Component ==========
function ImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    // preview ทันที
    setPreview(URL.createObjectURL(file));
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    setUploading(false);
    if (res.ok) {
      const { url } = await res.json();
      onChange(url);
      setPreview(url);
    } else {
      alert("อัปโหลดไม่สำเร็จ");
      setPreview(value);
    }
    e.target.value = "";
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className="relative border-2 border-dashed border-line rounded-xl overflow-hidden cursor-pointer hover:border-moss transition group"
      style={{ minHeight: 96 }}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {preview ? (
        <img src={preview} alt="preview" className="w-full h-24 object-cover" />
      ) : (
        <div className="flex flex-col items-center justify-center h-24 text-ink/30 text-xs gap-1">
          <span className="text-2xl">🖼️</span>
          <span>คลิกเพื่ออัปโหลดรูปสินค้า</span>
        </div>
      )}
      {uploading && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <span className="text-white text-xs">กำลังอัปโหลด...</span>
        </div>
      )}
      {!uploading && preview && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
          <span className="text-white text-xs opacity-0 group-hover:opacity-100">เปลี่ยนรูป</span>
        </div>
      )}
    </div>
  );
}

// ========== Settings Tab ==========
function SettingsTab() {
  const [s, setS] = useState<Partial<Settings>>({});
  const [newUser, setNewUser] = useState("");
  const [newPass, setNewPass] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings").then((r) => r.json()).then(setS);
  }, []);

  async function save(extra?: Record<string, string>) {
    setSaving(true); setMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...s, ...extra }),
    });
    setSaving(false);
    setMsg(res.ok ? "✅ บันทึกสำเร็จ" : "❌ ไม่สำเร็จ");
    setTimeout(() => setMsg(""), 3000);
  }

  const field = (key: keyof Settings, label: string, type = "text", placeholder = "") => (
    <div>
      <label className="block text-xs text-ink/50 mb-1">{label}</label>
      <input type={type} value={s[key] ?? ""} placeholder={placeholder || label}
        onChange={(e) => setS({ ...s, [key]: e.target.value })}
        className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-moss font-mono" />
    </div>
  );

  return (
    <div className="grid gap-5">
      <section className="bg-white border border-line rounded-2xl p-5 grid gap-3">
        <h2 className="font-display text-base">ข้อมูลร้านและ AI</h2>
        {field("shop_name", "ชื่อร้าน")}
        <div>
          <label className="block text-xs text-ink/50 mb-1">เลือก AI</label>
          <select value={s.ai_provider ?? "anthropic"} onChange={(e) => setS({ ...s, ai_provider: e.target.value })}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-moss">
            <option value="anthropic">Claude (Anthropic)</option>
            <option value="openai">GPT-4o (OpenAI)</option>
            <option value="gemini">Gemini (Google)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink/50 mb-1">คำสั่งพิเศษ AI (โปรโมชั่น, นโยบายจัดส่ง ฯลฯ)</label>
          <textarea value={s.system_prompt ?? ""} rows={3}
            onChange={(e) => setS({ ...s, system_prompt: e.target.value })}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-moss" />
        </div>
      </section>

      <section className="bg-white border border-line rounded-2xl p-5 grid gap-3">
        <h2 className="font-display text-base">API Keys</h2>
        <p className="text-xs text-ink/30">ค่าที่มี ••• ไม่ต้องพิมพ์ใหม่ถ้าไม่เปลี่ยน</p>
        {field("anthropic_api_key", "Claude (Anthropic)", "password", "sk-ant-...")}
        {field("openai_api_key", "GPT (OpenAI)", "password", "sk-...")}
        {field("gemini_api_key", "Gemini (Google)", "password", "AIza...")}
      </section>

      <section className="bg-white border border-line rounded-2xl p-5 grid gap-3">
        <h2 className="font-display text-base">Facebook Messenger</h2>
        {field("facebook_page_access_token", "Page Access Token", "password")}
        {field("facebook_verify_token", "Verify Token")}
        <p className="text-xs text-ink/30">Webhook URL: <code className="bg-line px-1 rounded">/api/webhook/facebook</code></p>
      </section>

      <section className="bg-white border border-line rounded-2xl p-5 grid gap-3">
        <h2 className="font-display text-base">LINE Official Account</h2>
        {field("line_channel_access_token", "Channel Access Token", "password")}
        {field("line_channel_secret", "Channel Secret", "password")}
        <p className="text-xs text-ink/30">Webhook URL: <code className="bg-line px-1 rounded">/api/webhook/line</code></p>
      </section>

      <section className="bg-white border border-line rounded-2xl p-5 grid gap-3">
        <h2 className="font-display text-base">เปลี่ยน Username / Password</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ink/50 mb-1">Username ใหม่</label>
            <input value={newUser} onChange={(e) => setNewUser(e.target.value)}
              placeholder={s.admin_username ?? "admin"}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-moss" />
          </div>
          <div>
            <label className="block text-xs text-ink/50 mb-1">Password ใหม่</label>
            <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)}
              placeholder="ใส่รหัสผ่านใหม่"
              className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-moss" />
          </div>
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button onClick={() => save(newUser && newPass ? { new_username: newUser, new_password: newPass } : undefined)}
          disabled={saving}
          className="bg-ink text-paper px-6 py-2.5 rounded-lg hover:bg-moss transition disabled:opacity-50 text-sm">
          {saving ? "กำลังบันทึก..." : "บันทึกทั้งหมด"}
        </button>
        {msg && <span className="text-sm">{msg}</span>}
      </div>
    </div>
  );
}

// ========== Main Admin ==========
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
    setProducts((await res.json()).products ?? []);
    setAuthed(true);
  }

  useEffect(() => { loadProducts(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    if (editingId) {
      await fetch(`/api/admin/products/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    } else {
      await fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    }
    setForm(emptyProduct); setEditingId(null); setLoading(false); await loadProducts();
  }

  async function handleDelete(id: string) {
    if (!confirm("ลบสินค้านี้ใช่ไหม?")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    await loadProducts();
  }

  if (authed === null) return <div className="min-h-screen flex items-center justify-center text-ink/30">กำลังโหลด...</div>;
  if (!authed) return <LoginForm onLogin={() => loadProducts()} />;

  return (
    <main className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-2xl font-semibold">ระบบจัดการ</h1>
        <button onClick={async () => { await fetch("/api/admin/login", { method: "DELETE" }); setAuthed(false); }}
          className="text-sm text-ink/40 hover:text-clay">ออกจากระบบ</button>
      </div>

      <div className="flex gap-1 bg-line rounded-xl p-1 mb-5">
        {(["products", "settings"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm transition-colors ${tab === t ? "bg-white shadow-sm font-medium" : "text-ink/50 hover:text-ink"}`}>
            {t === "products" ? "🛍️ จัดการสินค้า" : "⚙️ ตั้งค่าระบบ"}
          </button>
        ))}
      </div>

      {tab === "products" && (
        <div className="grid gap-4">
          <form onSubmit={handleSubmit} className="bg-white border border-line rounded-2xl p-5 grid gap-3">
            <p className="font-display text-base">{editingId ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</p>

            {/* Image upload */}
            <ImageUpload
              value={form.image_url}
              onChange={(url) => setForm({ ...form, image_url: url })}
            />

            <div className="grid sm:grid-cols-2 gap-3">
              <input required placeholder="ชื่อสินค้า" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-moss" />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30 text-xs">฿</span>
                <input type="number" min="0" placeholder="ราคา" value={form.price || ""}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  className="w-full border border-line rounded-lg pl-7 pr-3 py-2 text-sm outline-none focus:border-moss" />
              </div>
              <div className="relative">
                <input type="number" min="0" placeholder="จำนวนคงเหลือ" value={form.stock || ""}
                  onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                  className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-moss" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 text-xs">ชิ้น</span>
              </div>
            </div>

            <textarea placeholder="รายละเอียดสินค้า (AI จะใช้ตอบลูกค้า)" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
              className="border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-moss" />

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              เปิดขาย (AI จะแนะนำสินค้านี้ให้ลูกค้า)
            </label>
            <div className="flex gap-3">
              <button disabled={loading} className="bg-ink text-paper rounded-lg px-5 py-2 text-sm hover:bg-moss transition disabled:opacity-50">
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
            <div key={p.id} className="bg-white border border-line rounded-xl flex items-center gap-3 overflow-hidden">
              {p.image_url && <img src={p.image_url} alt={p.name} className="w-16 h-16 object-cover flex-shrink-0" />}
              {!p.image_url && <div className="w-16 h-16 bg-line flex items-center justify-center text-ink/20 flex-shrink-0 text-xl">🛍️</div>}
              <div className="flex-1 py-3">
                <p className="text-sm font-medium">{p.name} {!p.is_active && <span className="text-xs text-ink/30">(ปิดขาย)</span>}</p>
                <p className="text-xs text-ink/40">฿{p.price} · คงเหลือ {p.stock} ชิ้น</p>
              </div>
              <div className="flex gap-3 text-sm pr-4 flex-shrink-0">
                <button onClick={() => { setEditingId(p.id); setForm({ name: p.name, description: p.description ?? "", price: p.price, stock: p.stock, image_url: p.image_url ?? "", is_active: p.is_active }); }}
                  className="text-moss hover:underline">แก้ไข</button>
                <button onClick={() => handleDelete(p.id)} className="text-clay hover:underline">ลบ</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "settings" && <SettingsTab />}
    </main>
  );
}
