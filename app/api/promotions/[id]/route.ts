import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { normalizePromotion, parsePromotionInput } from "@/lib/promotions";
import type { PromotionInput } from "@/types/promotion";
import { ensurePromotionsSchema } from "@/lib/promotions-schema";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem editar promoções." },
        { status: 403 }
      );
    }

    await ensurePromotionsSchema();

    const { id } = await params;
    const body: PromotionInput = await request.json();
    const parsed = parsePromotionInput(body);

    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const data = parsed.value;
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const result = await client.query(
        `UPDATE public.promotions SET
          name = $1,
          description = $2,
          promotion_type = $3,
          min_purchase = $4,
          scope_type = $5,
          discount_type = $6,
          discount_value = $7,
          min_quantity = $8,
          max_discount = $9,
          badge_label = $10,
          priority = $11,
          stackable = $12,
          combinable_with_coupon = $13,
          starts_at = COALESCE($14, starts_at),
          expires_at = $15,
          active = $16,
          updated_at = NOW()
        WHERE id = $17
        RETURNING *`,
        [
          data.name,
          data.description,
          data.promotion_type,
          data.min_purchase,
          data.scope_type,
          data.discount_type,
          data.discount_value,
          data.min_quantity,
          data.max_discount,
          data.badge_label,
          data.priority,
          data.stackable,
          data.combinable_with_coupon,
          data.starts_at,
          data.expires_at,
          data.active,
          id,
        ]
      );

      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Promoção não encontrada." },
          { status: 404 }
        );
      }

      await client.query(
        "DELETE FROM public.promotion_targets WHERE promotion_id = $1",
        [id]
      );

      for (const target of data.targets) {
        await client.query(
          `INSERT INTO public.promotion_targets (
            promotion_id,
            target_type,
            target_value
          ) VALUES ($1, $2, $3)
          ON CONFLICT DO NOTHING`,
          [id, target.type, target.value]
        );
      }

      await client.query("COMMIT");

      return NextResponse.json({
        message: "Promoção atualizada com sucesso!",
        promotion: normalizePromotion(result.rows[0], data.targets),
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erro ao atualizar promoção:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar promoção." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem excluir promoções." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await client.query(
        "DELETE FROM public.promotion_targets WHERE promotion_id = $1",
        [id]
      );
      await client.query("DELETE FROM public.promotions WHERE id = $1", [id]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return NextResponse.json({ message: "Promoção removida com sucesso." });
  } catch (error) {
    console.error("Erro ao remover promoção:", error);
    return NextResponse.json(
      { error: "Erro ao remover promoção." },
      { status: 500 }
    );
  }
}
