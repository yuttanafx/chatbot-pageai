"use client";

import { useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  is_active: boolean;
};

const emptyForm = { name: "", description: "", price: 0, stock: 0, image_url: "", is_active: true };

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  async function loadProducts() {
    const res = await fetch("/api/admin/products");
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    const data = await res.json();
    setProducts(data.products ?? []);
    setAuthed(true);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setPassword("");
      loadProducts();
    } else {
      const data = await res.json();
      setLoginError(data.error ?? "เข้าสู่ระบบไม่สำเร็จ");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await fetch(`/api/admin/products/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadProducts();
    } finally {
      setLoading(false);
    }
  }

  function startEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description ?? "",
      price: p.price,
      stock: p.stock,
      image_url: p.image_url ?? "",
      is_active: p.is_active,
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("ลบสินค้านี้ใช่ไหม?")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    await loadProducts();
  }

  if (authed === null) {
    return <div className="min-h-screen flex items-center justify-center text-ink/50">กำลังโหลด...</div>;
  }

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <form onSubmit={handleLogin} className="w-full max-w-sm bg-white border border-line rounded-2xl p-8">
          <h1 className="font-display text-2xl font-semibold mb-1">เข้าสู่ระบบจัดการ</h1>
          <p className="text-sm text-ink/50 mb-6">กรอกรหัสผ่านผู้ดูแลร้าน</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="รหัสผ่าน"
            className="w-full border border-line rounded-lg px-4 py-2.5 mb-3 outline-none focus:border-moss"
            autoFocus
          />
          {loginError && <p className="text-clay text-sm mb-3">{loginError}</p>}
          <button className="w-full bg-ink text-paper rounded-lg py-2.5 hover:bg-moss transition-colors">
            เข้าสู่ระบบ
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-4xl mx-auto">
      <div className="flex items-baseline justify-between mb-8">
        <h1 className="font-display text-3xl font-semibold">จัดการสินค้า</h1>
        <button
          onClick={async () => {
            await fetch("/api/admin/login", { method: "DELETE" });
            setAuthed(false);
          }}
          className="text-sm text-ink/50 hover:text-clay"
        >
          ออกจากระบบ
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-line rounded-2xl p-6 mb-8 grid gap-4">
        <p className="font-display text-lg">{editingId ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <input
            required
            placeholder="ชื่อสินค้า"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border border-line rounded-lg px-3 py-2 outline-none focus:border-moss"
          />
          <input
            type="number"
            placeholder="ราคา (บาท)"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            className="border border-line rounded-lg px-3 py-2 outline-none focus:border-moss"
          />
          <input
            type="number"
            placeholder="จำนวนคงเหลือ"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
            className="border border-line rounded-lg px-3 py-2 outline-none focus:border-moss"
          />
          <input
            placeholder="ลิงก์รูปภาพ (ไม่บังคับ)"
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            className="border border-line rounded-lg px-3 py-2 outline-none focus:border-moss"
          />
        </div>
        <textarea
          placeholder="รายละเอียดสินค้า (AI จะใช้ข้อมูลนี้ตอบลูกค้า)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          className="border border-line rounded-lg px-3 py-2 outline-none focus:border-moss"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          เปิดขาย (AI จะแนะนำสินค้านี้ให้ลูกค้า)
        </label>
        <div className="flex gap-3">
          <button disabled={loading} className="bg-ink text-paper rounded-lg px-5 py-2.5 hover:bg-moss transition-colors disabled:opacity-50">
            {editingId ? "บันทึกการแก้ไข" : "เพิ่มสินค้า"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
              className="text-sm text-ink/50 hover:text-clay"
            >
              ยกเลิก
            </button>
          )}
        </div>
      </form>

      <div className="grid gap-3">
        {products.length === 0 && <p className="text-ink/40 text-center py-10">ยังไม่มีสินค้า เพิ่มสินค้าแรกของคุณด้านบนได้เลย</p>}
        {products.map((p) => (
          <div key={p.id} className="bg-white border border-line rounded-xl p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">
                {p.name} {!p.is_active && <span className="text-xs text-ink/40">(ปิดขาย)</span>}
              </p>
              <p className="text-sm text-ink/50">
                {p.price} บาท · คงเหลือ {p.stock} ชิ้น
              </p>
            </div>
            <div className="flex gap-3 text-sm flex-shrink-0">
              <button onClick={() => startEdit(p)} className="text-moss hover:underline">
                แก้ไข
              </button>
              <button onClick={() => handleDelete(p.id)} className="text-clay hover:underline">
                ลบ
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
