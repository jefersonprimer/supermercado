import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { calculateDiscount, normalizeCoupon } from "@/lib/coupons";
import type { AppliedCoupon } from "@/types/coupon";
import { ensureCouponShippingColumn } from "@/lib/coupons-server";

export async function POST(request: Request) {
  try {
    await ensureCouponShippingColumn();
    const { code, subtotal } = await request.json();
    const normalizedCode = String(code ?? "").trim().toUpperCase();
    const subtotalValue = Number(subtotal);

    if (!normalizedCode) {
      return NextResponse.json(
        { error: "Informe o código do cupom." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(subtotalValue) || subtotalValue <= 0) {
      return NextResponse.json(
        { error: "Carrinho vazio." },
        { status: 400 }
      );
    }

    const rows = await query(
      "SELECT * FROM public.coupons WHERE UPPER(code) = $1 LIMIT 1",
      [normalizedCode]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Cupom não encontrado." },
        { status: 404 }
      );
    }

    const coupon = normalizeCoupon(rows[0]);
    const now = Date.now();

    if (!coupon.active) {
      return NextResponse.json(
        { error: "Este cupom não está ativo." },
        { status: 400 }
      );
    }

    if (new Date(coupon.starts_at).getTime() > now) {
      return NextResponse.json(
        { error: "Este cupom ainda não está válido." },
        { status: 400 }
      );
    }

    if (coupon.expires_at && new Date(coupon.expires_at).getTime() <= now) {
      return NextResponse.json(
        { error: "Este cupom expirou." },
        { status: 400 }
      );
    }

    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
      return NextResponse.json(
        { error: "Este cupom atingiu o limite de usos." },
        { status: 400 }
      );
    }

    if (subtotalValue < coupon.min_purchase) {
      return NextResponse.json(
        {
          error: `Este cupom exige um valor mínimo de R$ ${coupon.min_purchase
            .toFixed(2)
            .replace(".", ",")}.`,
        },
        { status: 400 }
      );
    }

    const appliedCoupon: AppliedCoupon = {
      id: coupon.id,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_purchase: coupon.min_purchase,
      max_discount: coupon.max_discount,
      free_shipping: coupon.free_shipping,
    };

    return NextResponse.json({
      coupon: appliedCoupon,
      discount: calculateDiscount(appliedCoupon, subtotalValue),
    });
  } catch (error) {
    console.error("Erro ao validar cupom:", error);
    return NextResponse.json(
      { error: "Erro ao validar cupom." },
      { status: 500 }
    );
  }
}
