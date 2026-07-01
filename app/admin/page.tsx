"use client";

import { useEffect, useRef, useState } from "react";

// ========== Types ==========
type Product = {
  id: string; name: string; description: string;
  price: number; stock: number; image_url: string; is_active: boolean;
};
type Settings = {
  shop_name: string; system_prompt: string; admin_username: string; ai_provider: string;
  ai_style: string;
  anthropic_api_key: string; openai_api_key: string; gemini_api_key: string;
  facebook_page_access_token: string; facebook_verify_token: string;
  line_channel_access_token: string; line_channel_secret: string;
};
const emptyProduct = { name: "", description: "", price: 0, stock: 0, image_url: "", is_active: true };

// ========== Animated Login ==========
function NeuralCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let W = (canvas.width = canvas.offsetWidth);
    let H = (canvas.height = canvas.offsetHeight);

    const ro = new ResizeObserver(() => {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    });
    ro.observe(canvas);

    const N = 60;
    const nodes = Array.from({ length: N }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 1.5 + 0.8,
      pulse: Math.random() * Math.PI * 2,
      hue: Math.random() > 0.7 ? 180 : 200,
    }));

    const packets: { from: number; to: number; t: number; speed: number }[] = [];
    function spawnPacket() {
      const from = Math.floor(Math.random() * N);
      let to = Math.floor(Math.random() * N);
      while (to === from) to = Math.floor(Math.random() * N);
      packets.push({ from, to, t: 0, speed: 0.003 + Math.random() * 0.005 });
    }
    const spawnInterval = setInterval(spawnPacket, 300);

    function drawHexGrid() {
      const size = 28;
      const w = size * 2;
      const h = Math.sqrt(3) * size;
      ctx!.strokeStyle = "rgba(0,180,255,0.04)";
      ctx!.lineWidth = 0.5;
      for (let row = -1; row < H / h + 1; row++) {
        for (let col = -1; col < W / w + 1; col++) {
          const x = col * w * 0.75;
          const y = row * h + (col % 2 === 0 ? 0 : h / 2);
          ctx!.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 180) * (60 * i - 30);
            const px = x + size * Math.cos(angle);
            const py = y + size * Math.sin(angle);
            i === 0 ? ctx!.moveTo(px, py) : ctx!.lineTo(px, py);
          }
          ctx!.closePath();
          ctx!.stroke();
        }
      }
    }

    let frame = 0;
    let raf: number;

    function draw() {
      frame++;
      ctx!.fillStyle = "rgba(3,8,18,0.22)";
      ctx!.fillRect(0, 0, W, H);

      drawHexGrid();

      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            const a = (1 - d / 120) * 0.3;
            ctx!.beginPath();
            ctx!.strokeStyle = `rgba(0,180,255,${a})`;
            ctx!.lineWidth = 0.4;
            ctx!.moveTo(nodes[i].x, nodes[i].y);
            ctx!.lineTo(nodes[j].x, nodes[j].y);
            ctx!.stroke();
          }
        }
      }

      for (let k = packets.length - 1; k >= 0; k--) {
        const p = packets[k];
        p.t += p.speed;
        if (p.t >= 1) { packets.splice(k, 1); continue; }
        const f = nodes[p.from], t = nodes[p.to];
        const px = f.x + (t.x - f.x) * p.t;
        const py = f.y + (t.y - f.y) * p.t;
        for (let trail = 0; trail < 5; trail++) {
          const tp = Math.max(0, p.t - trail * 0.015);
          const tx = f.x + (t.x - f.x) * tp;
          const ty = f.y + (t.y - f.y) * tp;
          const ta = (0.8 - trail * 0.15) * (1 - p.t);
          ctx!.beginPath();
          ctx!.arc(tx, ty, 2 - trail * 0.3, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(100,255,200,${ta})`;
          ctx!.fill();
        }
        const grd = ctx!.createRadialGradient(px, py, 0, px, py, 8);
        grd.addColorStop(0, "rgba(80,255,180,0.8)");
        grd.addColorStop(1, "rgba(80,255,180,0)");
        ctx!.beginPath();
        ctx!.fillStyle = grd;
        ctx!.arc(px, py, 8, 0, Math.PI * 2);
        ctx!.fill();
      }

      nodes.forEach((n) => {
        n.x += n.vx; n.y += n.vy; n.pulse += 0.025;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        const g = 0.4 + 0.6 * Math.abs(Math.sin(n.pulse));
        const outer = ctx!.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 6);
        outer.addColorStop(0, `rgba(0,${180 + n.hue * 0.4},255,${0.15 * g})`);
        outer.addColorStop(1, "transparent");
        ctx!.beginPath(); ctx!.fillStyle = outer;
        ctx!.arc(n.x, n.y, n.r * 6, 0, Math.PI * 2); ctx!.fill();
        ctx!.beginPath();
        ctx!.fillStyle = `rgba(150,230,255,${g})`;
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx!.fill();
      });

      const sy = ((frame * 0.5) % (H + 60)) - 30;
      const sg = ctx!.createLinearGradient(0, sy, 0, sy + 60);
      sg.addColorStop(0, "transparent");
      sg.addColorStop(0.5, "rgba(0,200,255,0.035)");
      sg.addColorStop(1, "transparent");
      ctx!.fillStyle = sg; ctx!.fillRect(0, sy, W, 60);

      ["left", "right"].forEach((side) => {
        const gx = side === "left" ? 0 : W;
        const bg = ctx!.createLinearGradient(gx, 0, side === "left" ? 80 : W - 80, 0);
        bg.addColorStop(0, `rgba(0,150,255,${0.06 + 0.03 * Math.sin(frame * 0.01)})`);
        bg.addColorStop(1, "transparent");
        ctx!.fillStyle = bg; ctx!.fillRect(side === "left" ? 0 : W - 80, 0, 80, H);
      });

      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => { cancelAnimationFrame(raf); clearInterval(spawnInterval); ro.disconnect(); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />;
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
    <div style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#030812", overflow: "hidden" }}>
      <NeuralCanvas />

      {/* Grid overlay */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(0,160,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,160,255,0.03) 1px, transparent 1px)",
        backgroundSize: "36px 36px"
      }} />

      {/* Radial center glow */}
      <div style={{
        position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,100,255,0.06) 0%, transparent 70%)",
        pointerEvents: "none"
      }} />

      {/* Card */}
      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 360, margin: "0 16px" }}>
        <div style={{
          position: "absolute", inset: -1, borderRadius: 20,
          background: "linear-gradient(135deg, rgba(0,200,255,0.5), rgba(0,80,255,0.2), rgba(0,200,255,0.3))",
          filter: "blur(1px)"
        }} />
        <div style={{
          position: "relative", borderRadius: 20,
          border: "1px solid rgba(0,180,255,0.25)",
          background: "rgba(5,14,28,0.92)",
          backdropFilter: "blur(20px)",
          padding: "32px 28px"
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, width: 20, height: 20, borderTop: "2px solid rgba(0,220,255,0.7)", borderLeft: "2px solid rgba(0,220,255,0.7)", borderRadius: "4px 0 0 0" }} />
          <div style={{ position: "absolute", top: 0, right: 0, width: 20, height: 20, borderTop: "2px solid rgba(0,220,255,0.7)", borderRight: "2px solid rgba(0,220,255,0.7)", borderRadius: "0 4px 0 0" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, width: 20, height: 20, borderBottom: "2px solid rgba(0,220,255,0.4)", borderLeft: "2px solid rgba(0,220,255,0.4)", borderRadius: "0 0 0 4px" }} />
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 20, height: 20, borderBottom: "2px solid rgba(0,220,255,0.4)", borderRight: "2px solid rgba(0,220,255,0.4)", borderRadius: "0 0 4px 0" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, rgba(0,180,255,0.3), rgba(0,80,200,0.2))",
              border: "1px solid rgba(0,200,255,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16
            }}>⬡</div>
            <div>
              <div style={{ color: "rgba(0,200,255,0.9)", fontSize: 9, letterSpacing: "0.18em", fontWeight: 600 }}>AI SALES SYSTEM</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginTop: 1 }}>ระบบตอบแชทอัตโนมัติ</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: "rgba(0,220,255,0.7)",
                  animation: `loginPulse 1.4s ease-in-out ${i * 0.2}s infinite`
                }} />
              ))}
            </div>
          </div>

          {firstSetup ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
              <p style={{ color: "rgba(0,220,255,0.9)", fontWeight: 600, margin: 0 }}>ตั้งค่าสำเร็จ!</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 4 }}>กำลังเข้าสู่ระบบ...</p>
            </div>
          ) : (
            <>
              <h1 style={{ color: "rgba(255,255,255,0.95)", fontSize: 20, fontWeight: 600, margin: "0 0 20px 0" }}>เข้าสู่ระบบ</h1>

              <form onSubmit={handleSubmit}>
                <div style={{ position: "relative", marginBottom: 12 }}>
                  <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(0,200,255,0.5)", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em" }}>USER</div>
                  <input
                    value={username} onChange={(e) => setUsername(e.target.value)}
                    placeholder="username" autoFocus
                    style={{
                      width: "100%", boxSizing: "border-box",
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,180,255,0.2)",
                      borderRadius: 10, paddingLeft: 48, paddingRight: 12, paddingTop: 10, paddingBottom: 10,
                      color: "rgba(255,255,255,0.9)", fontSize: 13, fontFamily: "monospace", outline: "none"
                    }}
                  />
                </div>

                <div style={{ position: "relative", marginBottom: 16 }}>
                  <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(0,200,255,0.5)", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em" }}>PASS</div>
                  <input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: "100%", boxSizing: "border-box",
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,180,255,0.2)",
                      borderRadius: 10, paddingLeft: 48, paddingRight: 12, paddingTop: 10, paddingBottom: 10,
                      color: "rgba(255,255,255,0.9)", fontSize: 13, fontFamily: "monospace", outline: "none"
                    }}
                  />
                </div>

                {error && (
                  <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "8px 12px", marginBottom: 12 }}>
                    <p style={{ color: "rgb(248,113,113)", fontSize: 12, margin: 0 }}>{error}</p>
                  </div>
                )}

                <button
                  type="submit" disabled={loading}
                  style={{
                    width: "100%", padding: "11px 0", borderRadius: 10, border: "none",
                    background: loading ? "rgba(0,120,200,0.4)" : "linear-gradient(90deg, #0080cc, #0040aa, #0080cc)",
                    backgroundSize: "200% 100%",
                    color: "white", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                    position: "relative", overflow: "hidden"
                  }}
                >
                  {loading ? (
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <span>กำลังตรวจสอบ</span>
                      <span style={{ display: "inline-flex", gap: 3 }}>
                        {[0, 1, 2].map((i) => <span key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "white", display: "inline-block", opacity: 0.6 }} />)}
                      </span>
                    </span>
                  ) : "เข้าสู่ระบบ"}
                </button>
              </form>

              <p style={{ color: "rgba(255,255,255,0.15)", fontSize: 10, textAlign: "center", marginTop: 16, marginBottom: 0 }}>
                เข้าครั้งแรก? ใส่ username/password ที่ต้องการได้เลย
              </p>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes loginPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
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
          <label className="block text-xs text-ink/50 mb-1">ระดับความเป็นธรรมชาติในการตอบ</label>
          <select value={s.ai_style ?? "balanced"} onChange={(e) => setS({ ...s, ai_style: e.target.value })}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-moss">
            <option value="formal">เป็นทางการ — สุภาพเรียบร้อย เหมาะกับสินค้าพรีเมียม</option>
            <option value="balanced">สมดุล (แนะนำ) — สุภาพเป็นกันเอง กระชับ</option>
            <option value="natural">เป็นธรรมชาติ — คุยเหมือนแอดมินจริง มีลูกเล่นบ้าง</option>
            <option value="casual">กันเองมาก — สั้น กระชับ อิโมจิเยอะ เหมือนแชทเพื่อน</option>
          </select>
          <p className="text-xs text-ink/30 mt-1">ปรับโทนการตอบของ AI เวลาคุยกับลูกค้าใน Messenger/LINE</p>
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
  const [msg, setMsg] = useState("");

  async function loadProducts() {
    const res = await fetch("/api/admin/products");
    if (res.status === 401) { setAuthed(false); return; }
    setProducts((await res.json()).products ?? []);
    setAuthed(true);
  }

  useEffect(() => { loadProducts(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setMsg("");
    const wasEditing = !!editingId;
    const res = editingId
      ? await fetch(`/api/admin/products/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      : await fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setLoading(false);
    if (res.ok) {
      setForm(emptyProduct); setEditingId(null);
      setMsg(wasEditing ? "✅ บันทึกการแก้ไขแล้ว" : "✅ เพิ่มสินค้าแล้ว");
      await loadProducts();
    } else {
      setMsg("❌ บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
    }
    setTimeout(() => setMsg(""), 3000);
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
              <div>
                <label className="block text-xs text-ink/50 mb-1">ชื่อสินค้า</label>
                <input required placeholder="เช่น เสื้อยืดคอกลม" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-moss" />
              </div>
              <div>
                <label className="block text-xs text-ink/50 mb-1">ราคา (บาท)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30 text-xs">฿</span>
                  <input type="number" min="0" placeholder="0" value={form.price || ""}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full border border-line rounded-lg pl-7 pr-3 py-2 text-sm outline-none focus:border-moss" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-ink/50 mb-1">จำนวนคงเหลือ</label>
                <div className="relative">
                  <input type="number" min="0" placeholder="0" value={form.stock || ""}
                    onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                    className="w-full border border-line rounded-lg px-3 py-2 pr-12 text-sm outline-none focus:border-moss" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 text-xs">ชิ้น</span>
                </div>
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
            <div className="flex items-center gap-4">
              <button disabled={loading} className="bg-ink text-paper rounded-lg px-5 py-2 text-sm hover:bg-moss transition disabled:opacity-50">
                {loading ? "กำลังบันทึก..." : editingId ? "บันทึก" : "เพิ่มสินค้า"}
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setForm(emptyProduct); }}
                  className="text-sm text-ink/40 hover:text-clay">ยกเลิก</button>
              )}
              {msg && <span className="text-sm">{msg}</span>}
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
