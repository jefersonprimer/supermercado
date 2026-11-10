import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { ensureOrdersSchema } from "@/lib/orders";
import { getMercadoPagoOrder, getMercadoPagoPayment, isValidMercadoPagoSignature } from "@/lib/mercadopago";

export async function POST(request: Request) {
  const url = new URL(request.url);
  let body: { type?: string; data?: { id?: string | number } } = {};
  try {
    body = await request.json();
  } catch {
    // Alguns eventos chegam sem corpo; o ID também pode vir na query string.
  }

  const dataId = url.searchParams.get("data.id") || String(body.data?.id || "");
  const eventType = url.searchParams.get("type") || body.type;
  if (eventType !== "payment" && eventType !== "order") return NextResponse.json({ received: true });
  if (eventType === "payment" && !/^\d+$/.test(dataId)) return NextResponse.json({ error: "ID de pagamento inválido." }, { status: 400 });
  if (eventType === "order" && !/^[A-Za-z0-9_-]{5,128}$/.test(dataId)) return NextResponse.json({ error: "ID de order inválido." }, { status: 400 });

  const validSignature = isValidMercadoPagoSignature({
    signature: request.headers.get("x-signature"),
    requestId: request.headers.get("x-request-id"),
    dataId,
  });
  if (!validSignature) return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });

  try {
    if (eventType === "order") {
      const paymentOrder = await getMercadoPagoOrder(dataId);
      const orderId = paymentOrder.external_reference;
      if (!orderId || paymentOrder.currency !== "BRL") return NextResponse.json({ received: true });

      await ensureOrdersSchema();
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await client.query(`SELECT * FROM public.orders WHERE id=$1 FOR UPDATE`, [orderId]);
        const order = result.rows[0];
        if (!order || Math.abs(Number(order.total) - Number(paymentOrder.total_amount)) > 0.01) {
          await client.query("ROLLBACK");
          return NextResponse.json({ received: true });
        }

        const status = paymentOrder.status.toLowerCase();
        const detail = paymentOrder.status_detail?.toLowerCase();
        const paymentStatus = status === "processed" && detail === "partially_refunded"
          ? "partially_refunded"
          : ({
              processed: "approved",
              processing: "in_process",
              action_required: "pending",
              created: "pending",
              failed: "rejected",
              canceled: "cancelled",
              cancelled: "cancelled",
              expired: "cancelled",
              refunded: "refunded",
              charged_back: "charged_back",
            } as Record<string, string>)[status];
        if (!paymentStatus) {
          await client.query("COMMIT");
          return NextResponse.json({ received: true });
        }

        const noteByStatus: Record<string, string> = {
          approved: "Pagamento confirmado pelo Mercado Pago.",
          in_process: "Pagamento em análise pelo Mercado Pago.",
          pending: "Pagamento aguardando conclusão no Mercado Pago.",
          rejected: "Pagamento recusado pelo Mercado Pago.",
          cancelled: "Pagamento cancelado ou expirado no Mercado Pago.",
          refunded: "Pagamento reembolsado pelo Mercado Pago.",
          partially_refunded: "Pagamento parcialmente reembolsado pelo Mercado Pago.",
          charged_back: "Pagamento contestado pelo Mercado Pago.",
        };
        const nextOrderStatus = paymentStatus === "approved" && order.status === "pending_payment" ? "pending" : order.status;
        const paymentId = paymentOrder.transactions?.payments?.[0]?.id ?? null;
        await client.query(
          `UPDATE public.orders SET status=$2, payment_status=$3, payment_id=COALESCE($4,payment_id),
           payment_order_id=$5, history=history || $6::jsonb, updated_at=NOW() WHERE id=$1`,
          [orderId, nextOrderStatus, paymentStatus, paymentId, paymentOrder.id, JSON.stringify([{ status: `payment_${paymentStatus}`, note: noteByStatus[paymentStatus], at: new Date().toISOString() }])],
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
      return NextResponse.json({ received: true });
    }

    const payment = await getMercadoPagoPayment(dataId);
    const orderId = payment.external_reference;
    if (!orderId || !Number.isFinite(payment.transaction_amount) || payment.currency_id !== "BRL") {
      return NextResponse.json({ received: true });
    }

    await ensureOrdersSchema();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(`SELECT * FROM public.orders WHERE id=$1 FOR UPDATE`, [orderId]);
      const order = result.rows[0];
      if (!order || Math.abs(Number(order.total) - payment.transaction_amount) > 0.01) {
        await client.query("ROLLBACK");
        return NextResponse.json({ received: true });
      }

      const status = payment.status.toLowerCase();
      const noteByStatus: Record<string, string> = {
        approved: "Pagamento confirmado pelo Mercado Pago.",
        pending: "Pagamento pendente no Mercado Pago.",
        in_process: "Pagamento em análise pelo Mercado Pago.",
        rejected: "Pagamento recusado pelo Mercado Pago.",
        cancelled: "Pagamento cancelado no Mercado Pago.",
        refunded: "Pagamento reembolsado pelo Mercado Pago.",
        charged_back: "Pagamento contestado no Mercado Pago.",
      };
      const note = noteByStatus[status];
      if (!note) {
        await client.query("COMMIT");
        return NextResponse.json({ received: true });
      }
      const nextOrderStatus = status === "approved" && order.status === "pending_payment" ? "pending" : order.status;
      await client.query(
        `UPDATE public.orders SET status=$2, payment_status=$3, payment_id=$4,
         history=history || $5::jsonb, updated_at=NOW() WHERE id=$1`,
        [orderId, nextOrderStatus, status, String(payment.id), JSON.stringify([{ status: `payment_${status}`, note, at: new Date().toISOString() }])],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro ao processar webhook Mercado Pago:", error);
    return NextResponse.json({ error: "Falha ao processar a notificação." }, { status: 500 });
  }
}
