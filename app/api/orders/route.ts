import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { pool, query } from "@/lib/db";
import { ensureOrdersSchema } from "@/lib/orders";
import { getDeliveryFee } from "@/lib/delivery-server";
import { ensureCouponShippingColumn } from "@/lib/coupons-server";
import { getStoreSchedule } from "@/lib/delivery-server";
import { ensurePromotionsSchema } from "@/lib/promotions-schema";
import { getScheduleError } from "@/lib/store-hours";
import { createCheckoutOrder } from "@/lib/mercadopago";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Faça login para ver seus pedidos." }, { status: 401 });
  try {
    await ensureOrdersSchema();
    const orders = user.role === "admin"
      ? await query(`SELECT o.*, u.name AS customer_name, u.email AS customer_email FROM public.orders o JOIN public.users u ON u.id=o.user_id ORDER BY o.created_at DESC`)
      : await query(`SELECT * FROM public.orders WHERE user_id=$1 ORDER BY created_at DESC`, [user.id]);
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    return NextResponse.json({ error: "Não foi possível carregar os pedidos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Faça login para finalizar o pedido." }, { status: 401 });
  try {
    await ensureOrdersSchema();
    await ensureCouponShippingColumn();
    await ensurePromotionsSchema();
    const body = await request.json();
    const { items, address, scheduledFor, freeShippingCouponCode } = body;
    if (!Array.isArray(items) || !items.length || items.length > 50) return NextResponse.json({ error: "Adicione produtos ao pedido." }, { status: 400 });
    if (!address || ![address.cep, address.street, address.number, address.neighborhood, address.city, address.state].every((value) => typeof value === "string" && value.trim())) return NextResponse.json({ error: "Preencha o endereço completo." }, { status: 400 });
    const scheduled = new Date(scheduledFor);
    const scheduleError = getScheduleError(scheduled, await getStoreSchedule());
    if (scheduleError) return NextResponse.json({ error: scheduleError }, { status: 400 });
    const ids = [...new Set(items.map((item: { productId?: unknown }) => item.productId).filter((id: unknown) => typeof id === "string"))] as string[];
    if (!ids.length || ids.length !== items.length) return NextResponse.json({ error: "Itens inválidos." }, { status: 400 });
    const client = await pool.connect();
    try {
    await client.query("BEGIN");
    const productsResult = await client.query(`SELECT id, name, slug, price, image_url, images, stock FROM public.products WHERE id = ANY($1::uuid[]) FOR UPDATE`, [ids]);
    const products = productsResult.rows;
    if (products.length !== ids.length) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Um ou mais produtos não estão disponíveis." }, { status: 400 });
    }
    const byId = new Map(products.map((product: any) => [product.id, product]));
    const snapshot = [];
    let subtotal = 0;
    for (const item of items) {
      const product: any = byId.get(item.productId);
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99 || quantity > Number(product.stock)) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: `Estoque insuficiente para ${product.name}.` }, { status: 400 });
      }
      const unitPrice = Number(product.price);
      subtotal += unitPrice * quantity;
      snapshot.push({ productId: product.id, name: product.name, slug: product.slug, image: product.images?.[0] ?? product.image_url ?? null, quantity, unitPrice, lineTotal: unitPrice * quantity });
    }
    let deliveryFee = await getDeliveryFee();
    const freeShippingPromotions = await query(
      `SELECT id FROM public.promotions
       WHERE promotion_type = 'free_shipping'
         AND active = true
         AND starts_at <= NOW()
         AND (expires_at IS NULL OR expires_at > NOW())
         AND min_purchase <= $1
       ORDER BY priority DESC, created_at DESC
       LIMIT 1`,
      [subtotal],
    );
    if (freeShippingPromotions.length > 0) deliveryFee = 0;
    if (typeof freeShippingCouponCode === "string" && freeShippingCouponCode.trim()) {
      const couponRows = await query(
        `SELECT * FROM public.coupons WHERE UPPER(code) = $1 LIMIT 1`,
        [freeShippingCouponCode.trim().toUpperCase()],
      );
      const shippingCoupon = couponRows[0];
      const now = Date.now();
      if (
        !shippingCoupon ||
        !shippingCoupon.free_shipping ||
        !shippingCoupon.active ||
        new Date(shippingCoupon.starts_at).getTime() > now ||
        (shippingCoupon.expires_at && new Date(shippingCoupon.expires_at).getTime() <= now) ||
        (shippingCoupon.usage_limit !== null && Number(shippingCoupon.used_count) >= Number(shippingCoupon.usage_limit)) ||
        subtotal < Number(shippingCoupon.min_purchase)
      ) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "O cupom de frete grátis não é válido para este pedido." }, { status: 400 });
      }
      deliveryFee = 0;
    }
    const history = [{ status: "pending_payment", note: "Pedido criado e aguardando pagamento.", at: new Date().toISOString() }];
    for (const item of snapshot) {
      await client.query(`UPDATE public.products SET stock = stock - $2, updated_at = NOW() WHERE id = $1`, [item.productId, item.quantity]);
    }
    const result = await client.query(`INSERT INTO public.orders (user_id, status, payment_status, items, address, scheduled_for, subtotal, total, history) VALUES ($1,'pending_payment','pending',$2::jsonb,$3::jsonb,$4,$5,$6,$7::jsonb) RETURNING *`, [user.id, JSON.stringify(snapshot), JSON.stringify(address), scheduled.toISOString(), subtotal, subtotal + deliveryFee, JSON.stringify(history)]);
    await client.query("COMMIT");
    const order = result.rows[0];
    try {
      const paymentOrder = await createCheckoutOrder({
        orderId: order.id,
        items: snapshot.map((item: { name: string; quantity: number; unitPrice: number }) => item),
        deliveryFee,
        email: user.email,
        baseUrl: new URL(request.url).origin,
      });
      const updated = await query(
        `UPDATE public.orders SET payment_order_id=$2, payment_url=$3, history=history || $4::jsonb, updated_at=NOW() WHERE id=$1 RETURNING *`,
        [order.id, paymentOrder.id, paymentOrder.url, JSON.stringify([{ status: "pending_payment", note: "Order de pagamento criada no Mercado Pago.", at: new Date().toISOString() }])],
      );
      return NextResponse.json({ order: updated[0], checkoutUrl: paymentOrder.url, paymentOrderId: paymentOrder.id }, { status: 201 });
    } catch (paymentError) {
      const rollback = await pool.connect();
      try {
        await rollback.query("BEGIN");
        const current = await rollback.query(`SELECT items FROM public.orders WHERE id=$1 AND status='pending_payment' FOR UPDATE`, [order.id]);
        if (current.rows.length) {
          for (const item of current.rows[0].items as { productId?: string; quantity?: number }[]) {
            if (item.productId && Number.isInteger(item.quantity) && Number(item.quantity) > 0) {
              await rollback.query(`UPDATE public.products SET stock=stock+$2, updated_at=NOW() WHERE id=$1`, [item.productId, item.quantity]);
            }
          }
          await rollback.query(`UPDATE public.orders SET status='cancelled', payment_status='checkout_failed', history=history || $2::jsonb, updated_at=NOW() WHERE id=$1`, [order.id, JSON.stringify([{ status: "cancelled", note: "Não foi possível iniciar o pagamento.", at: new Date().toISOString() }])]);
        }
        await rollback.query("COMMIT");
      } catch (rollbackError) {
        await rollback.query("ROLLBACK");
        throw rollbackError;
      } finally {
        rollback.release();
      }
      throw paymentError;
    }
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    return NextResponse.json({ error: "Não foi possível finalizar o pedido." }, { status: 500 });
  }
}
