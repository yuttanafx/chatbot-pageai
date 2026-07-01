import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAuthed } from "@/lib/auth";

export async function GET() {
  if (!isAuthed()) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/admin/products] supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ products: data });
  } catch (err: any) {
    console.error("[GET /api/admin/products] unexpected error:", err);
    return NextResponse.json({ error: err?.message ?? "unknown error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthed()) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("products")
      .insert({
        name: body.name,
        description: body.description ?? "",
        price: body.price ?? 0,
        stock: body.stock ?? 0,
        image_url: body.image_url ?? "",
        is_active: body.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error("[POST /api/admin/products] supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ product: data });
  } catch (err: any) {
    console.error("[POST /api/admin/products] unexpected error:", err);
    return NextResponse.json({ error: err?.message ?? "unknown error" }, { status: 500 });
  }
}
