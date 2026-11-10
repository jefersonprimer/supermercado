import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { normalizePromotion, parsePromotionInput } from "@/lib/promotions";
import { loadPromotions } from "@/lib/promotions-server";
import type { PromotionInput } from "@/types/promotion";
import { ensurePromotionsSchema } from "@/lib/promotions-schema";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user = await getCurrentUser();
    const showAll =
      user?.role === "admin" && searchParams.get("all") === "1";

    const promotions = await loadPromotions({ onlyActive: !showAll });

    return NextResponse.json({ promotions });
  } catch (error) {
    console.error("Erro ao buscar promoções:", error);
    return NextResponse.json(
      { error: "Erro ao buscar promoções." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem criar promoções." },
        { status: 403 }
      );
    }

    await ensurePromotionsSchema();

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
        `INSERT INTO public.promotions (
          name,
          description,
          promotion_type,
          min_purchase,
          scope_type,
          discount_type,
          discount_value,
          min_quantity,
          max_discount,
          badge_label,
          priority,
          stackable,
          combinable_with_coupon,
          starts_at,
          expires_at,
          active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
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
        ]
      );

      const promotion = result.rows[0];

      for (const target of data.targets) {
        await client.query(
          `INSERT INTO public.promotion_targets (
            promotion_id,
            target_type,
            target_value
          ) VALUES ($1, $2, $3)
          ON CONFLICT DO NOTHING`,
          [promotion.id, target.type, target.value]
        );
      }

      await client.query("COMMIT");

      return NextResponse.json(
        {
          message: "Promoção criada com sucesso!",
          promotion: normalizePromotion(promotion, data.targets),
        },
        { status: 201 }
      );
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erro ao criar promoção:", error);
    return NextResponse.json(
      { error: "Erro ao criar promoção." },
      { status: 500 }
    );
  }
}
