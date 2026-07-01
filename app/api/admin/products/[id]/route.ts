import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAuthed, getAuthedShopId } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthed()) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const shopId = getAuthedShopId();
  if (!shopId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("products")
      .update({
        name: body.name,
        description: body.description,
        price: body.price,
        stock: body.stock,
        image_url: body.image_url,
        is_active: body.is_active,
      })
      .eq("id", params.id)
      .eq("shop_id", shopId) // กันแก้สินค้าร้านอื่น
      .select()
      .single();

    if (error) {
      console.error("[PUT /api/admin/products/:id] supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ product: data });
  } catch (err: any) {
    console.error("[PUT /api/admin/products/:id] unexpected error:", err);
    return NextResponse.json({ error: err?.message ?? "unknown error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthed()) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const shopId = getAuthedShopId();
  if (!shopId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const db = supabaseAdmin();
    const { error } = await db
      .from("products")
      .delete()
      .eq("id", params.id)
      .eq("shop_id", shopId); // กันลบสินค้าร้านอื่น

    if (error) {
      console.error("[DELETE /api/admin/products/:id] supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[DELETE /api/admin/products/:id] unexpected error:", err);
    return NextResponse.json({ error: err?.message ?? "unknown error" }, { status: 500 });
  }
}
