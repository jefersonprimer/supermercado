import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { pool, query } from "@/lib/db";
import { ensureOrdersSchema } from "@/lib/orders";

export async function PATCH(request: Request, { params }: RouteContext<"/api/orders/[id]">) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Acesso restrito à administração." }, { status: 403 });
  try {
    await ensureOrdersSchema();
    const { id } = await params;
    const { status, note } = await request.json();
    if (!["approved", "cancelled", "out_for_delivery", "delivered"].includes(status)) return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    const allowedPrevious: Record<string, string[]> = { approved: ["pending"], cancelled: ["pending_payment", "pending", "approved"], out_for_delivery: ["approved"], delivered: ["out_for_delivery"] };
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const current = await client.query(`SELECT * FROM public.orders WHERE id=$1 FOR UPDATE`, [id]);
      if (!current.rows.length || !allowedPrevious[status].includes(current.rows[0].status)) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Pedido não encontrado ou já processado." }, { status: 404 });
      }
      if (status === "approved" && !["approved", "not_required"].includes(current.rows[0].payment_status)) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "O pagamento precisa ser confirmado antes de aprovar o pedido." }, { status: 409 });
      }
      if (status === "cancelled") {
        for (const item of current.rows[0].items as { productId?: string; quantity?: number }[]) {
          if (item.productId && Number.isInteger(item.quantity) && Number(item.quantity) > 0) {
            await client.query(`UPDATE public.products SET stock = stock + $2, updated_at = NOW() WHERE id = $1`, [item.productId, item.quantity]);
          }
        }
      }
      const rows = await client.query(`UPDATE public.orders SET status=$2, payment_status=CASE WHEN $2='cancelled' AND payment_status='pending' THEN 'cancelled' ELSE payment_status END, history=history || $3::jsonb, updated_at=NOW() WHERE id=$1 RETURNING *`, [id, status, JSON.stringify([{ status, note: typeof note === "string" ? note.slice(0, 300) : ({ approved: "Pedido aprovado pela farmácia.", cancelled: "Pedido cancelado pela farmácia.", out_for_delivery: "Pedido saiu para entrega.", delivered: "Entrega marcada como concluída." } as Record<string, string>)[status], at: new Date().toISOString(), by: user.name }])]);
      await client.query("COMMIT");
      return NextResponse.json({ order: rows.rows[0] });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erro ao atualizar pedido:", error);
    return NextResponse.json({ error: "Não foi possível atualizar o pedido." }, { status: 500 });
  }
}

export async function POST(_request: Request, { params }: RouteContext<"/api/orders/[id]">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Faça login para confirmar o recebimento." }, { status: 401 });
  try {
    await ensureOrdersSchema();
    const { id } = await params;
    const rows = await query(`UPDATE public.orders SET status='delivered', history=history || $3::jsonb, updated_at=NOW() WHERE id=$1 AND user_id=$2 AND status='out_for_delivery' RETURNING *`, [id, user.id, JSON.stringify([{ status: "delivered", note: "Cliente confirmou o recebimento do pedido.", at: new Date().toISOString(), by: user.name }])]);
    if (!rows.length) return NextResponse.json({ error: "Este pedido ainda não está em rota de entrega." }, { status: 409 });
    return NextResponse.json({ order: rows[0] });
  } catch (error) {
    console.error("Erro ao confirmar recebimento:", error);
    return NextResponse.json({ error: "Não foi possível confirmar o recebimento." }, { status: 500 });
  }
}
