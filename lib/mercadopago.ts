import { createHmac, timingSafeEqual } from "node:crypto";

const API_URL = "https://api.mercadopago.com";

function getAccessToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN não está configurada.");
  return token;
}

export async function createCheckoutOrder(input: {
  orderId: string;
  items: { name: string; quantity: number; unitPrice: number }[];
  deliveryFee: number;
  email: string;
  baseUrl: string;
}) {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || input.baseUrl).replace(/\/$/, "");
  const items = [
    ...input.items.map((item) => ({
      title: item.name.slice(0, 250),
      quantity: item.quantity,
      unit_price: item.unitPrice.toFixed(2),
    })),
    ...(input.deliveryFee > 0
      ? [{ title: "Taxa de entrega", quantity: 1, unit_price: input.deliveryFee.toFixed(2) }]
      : []),
  ];
  const totalAmount = items.reduce(
    (total, item) => total + Number(item.unit_price) * item.quantity,
    0,
  );
  const body = {
    type: "online",
    processing_mode: "manual",
    capture_mode: "automatic_async",
    total_amount: totalAmount.toFixed(2),
    external_reference: input.orderId,
    payer: { email: input.email },
    items,
    config: {
      online: {
        success_url: `${baseUrl}/pedidos?pagamento=retorno&pedido=${input.orderId}`,
        pending_url: `${baseUrl}/pedidos?pagamento=retorno&pedido=${input.orderId}`,
        failure_url: `${baseUrl}/pedidos?pagamento=retorno&pedido=${input.orderId}`,
        ...(baseUrl.startsWith("https://") ? { auto_return: "approved" } : {}),
      },
    },
  };

  const response = await fetch(`${API_URL}/v1/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": input.orderId,
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok || typeof data.id !== "string" || typeof data.checkout_url !== "string") {
    console.error("Mercado Pago order error:", data);
    throw new Error("Não foi possível iniciar o pagamento no Mercado Pago.");
  }
  return { id: data.id as string, url: data.checkout_url as string };
}

export function isValidMercadoPagoSignature(input: {
  signature: string | null;
  requestId: string | null;
  dataId: string | null;
}) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret || !input.signature || !input.requestId || !input.dataId) return false;

  const values = Object.fromEntries(
    input.signature.split(",").map((part) => {
      const [key, ...rest] = part.trim().split("=");
      return [key, rest.join("=")];
    }),
  );
  if (!values.ts || !values.v1) return false;
  const manifest = `id:${input.dataId};request-id:${input.requestId};ts:${values.ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest();
  let received: Buffer;
  try {
    received = Buffer.from(values.v1, "hex");
  } catch {
    return false;
  }
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function getMercadoPagoPayment(paymentId: string) {
  const response = await fetch(`${API_URL}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) throw new Error("Não foi possível consultar o pagamento no Mercado Pago.");
  return data as {
    id: number;
    status: string;
    external_reference: string | null;
    transaction_amount: number;
    currency_id: string;
  };
}

export async function getMercadoPagoOrder(orderId: string) {
  const response = await fetch(`${API_URL}/v1/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) throw new Error("Não foi possível consultar a order no Mercado Pago.");
  return data as {
    id: string;
    status: string;
    status_detail?: string;
    external_reference: string | null;
    total_amount: string;
    total_paid_amount?: string;
    currency?: string;
    transactions?: { payments?: { id?: string; status?: string; status_detail?: string }[] };
  };
}
