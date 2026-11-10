import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { ensureListsSchema } from "@/lib/lists";

export async function DELETE(_request: Request, { params }: { params: Promise<{ productId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Faça login para editar sua lista." }, { status: 401 });
  const { productId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(productId)) return NextResponse.json({ error: "Produto inválido." }, { status: 400 });

  try {
    await ensureListsSchema();
    await query("DELETE FROM public.user_list_items WHERE user_id = $1 AND product_id = $2", [user.id, productId]);
    return NextResponse.json({ removed: true });
  } catch (error) {
    console.error("Erro ao remover produto da lista:", error);
    return NextResponse.json({ error: "Não foi possível remover o produto da lista." }, { status: 500 });
  }
}
