import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { normalizeCoupon } from "@/lib/coupons";
import type { CouponInput } from "@/types/coupon";
import { ensureCouponShippingColumn } from "@/lib/coupons-server";

function normalizeCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export async function GET(request: Request) {
  try {
    await ensureCouponShippingColumn();
    const { searchParams } = new URL(request.url);
    const user = await getCurrentUser();
    const showAll = user?.role === "admin" && searchParams.get("all") === "1";

    let sql = `SELECT * FROM public.coupons`;

    if (!showAll) {
      sql += `
        WHERE active = true
          AND starts_at <= NOW()
          AND (expires_at IS NULL OR expires_at > NOW())
          AND (usage_limit IS NULL OR used_count < usage_limit)
      `;
    }

    sql += " ORDER BY created_at DESC";

    const rows = await query(sql);
    return NextResponse.json({ coupons: rows.map(normalizeCoupon) });
  } catch (error) {
    console.error("Erro ao buscar cupons:", error);
    return NextResponse.json(
      { error: "Erro ao buscar cupons." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureCouponShippingColumn();
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem criar cupons." },
        { status: 403 }
      );
    }

    const body: CouponInput = await request.json();
    const code = normalizeCode(body.code ?? "");
    const discountType = body.discount_type;
    const discountValue = Number(body.discount_value);
    const freeShipping = body.free_shipping === true;

    if (!code) {
      return NextResponse.json(
        { error: "Informe o código do cupom." },
        { status: 400 }
      );
    }

    if (discountType !== "percentage" && discountType !== "fixed") {
      return NextResponse.json(
        { error: "Tipo de desconto inválido." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(discountValue) || discountValue < 0 || (discountValue === 0 && !freeShipping)) {
      return NextResponse.json(
        { error: "Informe um valor de desconto válido." },
        { status: 400 }
      );
    }

    if (discountType === "percentage" && discountValue > 100) {
      return NextResponse.json(
        { error: "O desconto percentual não pode passar de 100%." },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO public.coupons (
        code,
        description,
        discount_type,
        discount_value,
        min_purchase,
        max_discount,
        free_shipping,
        usage_limit,
        starts_at,
        expires_at,
        active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, NOW()), $10, $11)
      RETURNING *`,
      [
        code,
        body.description?.trim() || null,
        discountType,
        discountValue,
        Number(body.min_purchase) || 0,
        body.max_discount ? Number(body.max_discount) : null,
        body.free_shipping ?? false,
        body.usage_limit ? Number(body.usage_limit) : null,
        body.starts_at ? new Date(body.starts_at) : null,
        body.expires_at ? new Date(body.expires_at) : null,
        body.active ?? true,
      ]
    );

    return NextResponse.json(
      {
        message: "Cupom criado com sucesso!",
        coupon: normalizeCoupon(result[0]),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar cupom:", error);

    if ((error as { code?: string })?.code === "23505") {
      return NextResponse.json(
        { error: "Já existe um cupom com esse código." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao criar cupom." },
      { status: 500 }
    );
  }
}
