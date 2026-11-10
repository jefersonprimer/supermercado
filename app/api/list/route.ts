import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { ensureListsSchema } from "@/lib/lists";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Faça login para ver sua lista." }, { status: 401 });

  try {
    await ensureListsSchema();
    const items = await query(`
      SELECT p.id, p.name, p.slug, p.price,
        COALESCE(p.images, ARRAY[p.image_url]) AS images,
        p.stock, l.created_at
      FROM public.user_list_items l
      JOIN public.products p ON p.id = l.product_id
      WHERE l.user_id = $1
      ORDER BY l.created_at DESC
    `, [user.id]);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Erro ao carregar lista:", error);
    return NextResponse.json({ error: "Não foi possível carregar sua lista." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Faça login para adicionar produtos à sua lista." }, { status: 401 });

  try {
    const body = await request.json();
    if (typeof body.productId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.productId)) {
      return NextResponse.json({ error: "Produto inválido." }, { status: 400 });
    }
    await ensureListsSchema();
    const result = await query(
      `INSERT INTO public.user_list_items (user_id, product_id)
       SELECT $1, id FROM public.products WHERE id = $2
       ON CONFLICT (user_id, product_id) DO NOTHING
       RETURNING product_id`,
      [user.id, body.productId]
    );
    if (!result.length) {
      const exists = await query("SELECT 1 FROM public.products WHERE id = $1", [body.productId]);
      if (!exists.length) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ added: true }, { status: 201 });
  } catch (error) {
    console.error("Erro ao adicionar produto à lista:", error);
    return NextResponse.json({ error: "Não foi possível adicionar o produto à lista." }, { status: 500 });
  }
}
