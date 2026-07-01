Import { useEffect, useRef, useState } from "react";

function NeuralCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
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

    const packets = [];
    function spawnPacket() {
      const from = Math.floor(Math.random() * N);
      let to = Math.floor(Math.random() * N);
      while (to === from) to = Math.floor(Math.random() * N);
      packets.push({ from, to, t: 0, speed: 0.003 + Math.random() * 0.005 });
    }
    const spawnInterval = setInterval(spawnPacket, 300);

    // Hexagon grid background
    function drawHexGrid() {
      const size = 28;
      const w = size * 2;
      const h = Math.sqrt(3) * size;
      ctx.strokeStyle = "rgba(0,180,255,0.04)";
      ctx.lineWidth = 0.5;
      for (let row = -1; row < H / h + 1; row++) {
        for (let col = -1; col < W / w + 1; col++) {
          const x = col * w * 0.75;
          const y = row * h + (col % 2 === 0 ? 0 : h / 2);
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 180) * (60 * i - 30);
            const px = x + size * Math.cos(angle);
            const py = y + size * Math.sin(angle);
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
    }

    let frame = 0;
    let raf;

    function draw() {
      frame++;
      // Dark fade
      ctx.fillStyle = "rgba(3,8,18,0.22)";
      ctx.fillRect(0, 0, W, H);

      drawHexGrid();

      // Connections
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            const a = (1 - d / 120) * 0.3;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0,180,255,${a})`;
            ctx.lineWidth = 0.4;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Packets
      for (let k = packets.length - 1; k >= 0; k--) {
        const p = packets[k];
        p.t += p.speed;
        if (p.t >= 1) { packets.splice(k, 1); continue; }
        const f = nodes[p.from], t = nodes[p.to];
        const px = f.x + (t.x - f.x) * p.t;
        const py = f.y + (t.y - f.y) * p.t;
        // Trail
        for (let trail = 0; trail < 5; trail++) {
          const tp = Math.max(0, p.t - trail * 0.015);
          const tx = f.x + (t.x - f.x) * tp;
          const ty = f.y + (t.y - f.y) * tp;
          const ta = (0.8 - trail * 0.15) * (1 - p.t);
          ctx.beginPath();
          ctx.arc(tx, ty, 2 - trail * 0.3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(100,255,200,${ta})`;
          ctx.fill();
        }
        // Glow
        const grd = ctx.createRadialGradient(px, py, 0, px, py, 8);
        grd.addColorStop(0, "rgba(80,255,180,0.8)");
        grd.addColorStop(1, "rgba(80,255,180,0)");
        ctx.beginPath();
        ctx.fillStyle = grd;
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Nodes
      nodes.forEach((n) => {
        n.x += n.vx; n.y += n.vy; n.pulse += 0.025;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        const g = 0.4 + 0.6 * Math.abs(Math.sin(n.pulse));
        const outer = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 6);
        outer.addColorStop(0, `rgba(0,${180 + n.hue * 0.4},255,${0.15 * g})`);
        outer.addColorStop(1, "transparent");
        ctx.beginPath(); ctx.fillStyle = outer;
        ctx.arc(n.x, n.y, n.r * 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = `rgba(150,230,255,${g})`;
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      });

      // Scan line
      const sy = ((frame * 0.5) % (H + 60)) - 30;
      const sg = ctx.createLinearGradient(0, sy, 0, sy + 60);
      sg.addColorStop(0, "transparent");
      sg.addColorStop(0.5, "rgba(0,200,255,0.035)");
      sg.addColorStop(1, "transparent");
      ctx.fillStyle = sg; ctx.fillRect(0, sy, W, 60);

      // Vertical glow bars (left + right edge ambiance)
      ["left", "right"].forEach((side) => {
        const gx = side === "left" ? 0 : W;
        const bg = ctx.createLinearGradient(gx, 0, side === "left" ? 80 : W - 80, 0);
        bg.addColorStop(0, `rgba(0,150,255,${0.06 + 0.03 * Math.sin(frame * 0.01)})`);
        bg.addColorStop(1, "transparent");
        ctx.fillStyle = bg; ctx.fillRect(side === "left" ? 0 : W - 80, 0, 80, H);
      });

      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => { cancelAnimationFrame(raf); clearInterval(spawnInterval); ro.disconnect(); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />;
}

export default function LoginPreview() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#030812", overflow: "hidden", fontFamily: "system-ui, sans-serif" }}>
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
        {/* Outer glow border */}
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
          {/* Top corner accents */}
          <div style={{ position: "absolute", top: 0, left: 0, width: 20, height: 20, borderTop: "2px solid rgba(0,220,255,0.7)", borderLeft: "2px solid rgba(0,220,255,0.7)", borderRadius: "4px 0 0 0" }} />
          <div style={{ position: "absolute", top: 0, right: 0, width: 20, height: 20, borderTop: "2px solid rgba(0,220,255,0.7)", borderRight: "2px solid rgba(0,220,255,0.7)", borderRadius: "0 4px 0 0" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, width: 20, height: 20, borderBottom: "2px solid rgba(0,220,255,0.4)", borderLeft: "2px solid rgba(0,220,255,0.4)", borderRadius: "0 0 0 4px" }} />
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 20, height: 20, borderBottom: "2px solid rgba(0,220,255,0.4)", borderRight: "2px solid rgba(0,220,255,0.4)", borderRadius: "0 0 4px 0" }} />

          {/* Logo row */}
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
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: "rgba(0,220,255,0.7)",
                  animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`
                }} />
              ))}
            </div>
          </div>

          <h1 style={{ color: "rgba(255,255,255,0.95)", fontSize: 20, fontWeight: 600, margin: "0 0 20px 0" }}>เข้าสู่ระบบ</h1>

          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div style={{ position: "relative", marginBottom: 12 }}>
              <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(0,200,255,0.5)", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em" }}>USER</div>
              <input
                value={username} onChange={e => setUsername(e.target.value)}
                placeholder="username"
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,180,255,0.2)",
                  borderRadius: 10, paddingLeft: 48, paddingRight: 12, paddingTop: 10, paddingBottom: 10,
                  color: "rgba(255,255,255,0.9)", fontSize: 13, fontFamily: "monospace",
                  outline: "none"
                }}
              />
            </div>

            {/* Password */}
            <div style={{ position: "relative", marginBottom: 16 }}>
              <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(0,200,255,0.5)", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em" }}>PASS</div>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,180,255,0.2)",
                  borderRadius: 10, paddingLeft: 48, paddingRight: 12, paddingTop: 10, paddingBottom: 10,
                  color: "rgba(255,255,255,0.9)", fontSize: 13, fontFamily: "monospace",
                  outline: "none"
                }}
              />
            </div>

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
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span>กำลังตรวจสอบ</span>
                  <span style={{ display: "inline-flex", gap: 3 }}>
                    {[0,1,2].map(i => <span key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "white", display: "inline-block", opacity: 0.6 }}>·</span>)}
                  </span>
                </span>
              ) : "เข้าสู่ระบบ"}
            </button>
          </form>

          <p style={{ color: "rgba(255,255,255,0.15)", fontSize: 10, textAlign: "center", marginTop: 16, marginBottom: 0 }}>
            เข้าครั้งแรก? ตั้ง username/password ได้เลย
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        input::placeholder { color: rgba(255,255,255,0.15); }
        input:focus { border-color: rgba(0,200,255,0.5) !important; box-shadow: 0 0 0 2px rgba(0,180,255,0.1); }
      `}</style>
    </div>
  );
}
