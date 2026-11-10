import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { normalizeCoupon } from "@/lib/coupons";
import type { CouponInput } from "@/types/coupon";
import { ensureCouponShippingColumn } from "@/lib/coupons-server";

function normalizeCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureCouponShippingColumn();
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem editar cupons." },
        { status: 403 }
      );
    }

    const { id } = await params;
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
      `UPDATE public.coupons SET
        code = $1,
        description = $2,
        discount_type = $3,
        discount_value = $4,
        min_purchase = $5,
        max_discount = $6,
        free_shipping = $7,
        usage_limit = $8,
        starts_at = COALESCE($9, starts_at),
        expires_at = $10,
        active = $11,
        updated_at = NOW()
      WHERE id = $12
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
        id,
      ]
    );

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Cupom não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Cupom atualizado com sucesso!",
      coupon: normalizeCoupon(result[0]),
    });
  } catch (error) {
    console.error("Erro ao atualizar cupom:", error);

    if ((error as { code?: string })?.code === "23505") {
      return NextResponse.json(
        { error: "Já existe um cupom com esse código." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao atualizar cupom." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureCouponShippingColumn();
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem excluir cupons." },
        { status: 403 }
      );
    }

    const { id } = await params;
    await query("DELETE FROM public.coupons WHERE id = $1", [id]);

    return NextResponse.json({ message: "Cupom removido com sucesso." });
  } catch (error) {
    console.error("Erro ao remover cupom:", error);
    return NextResponse.json(
      { error: "Erro ao remover cupom." },
      { status: 500 }
    );
  }
}
