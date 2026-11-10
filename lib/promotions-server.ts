import { query } from "@/lib/db";
import {
  buildProductPromotionFields,
  normalizePromotion,
} from "@/lib/promotions";
import type { Product } from "@/types/product";
import type { Promotion, PromotionTarget } from "@/types/promotion";
import { ensurePromotionsSchema } from "@/lib/promotions-schema";

export async function loadPromotions(
  options: { onlyActive?: boolean } = {}
): Promise<Promotion[]> {
  await ensurePromotionsSchema();
  const onlyActive = options.onlyActive ?? true;

  let sql = "SELECT * FROM public.promotions";

  if (onlyActive) {
    sql += `
      WHERE active = true
        AND starts_at <= NOW()
        AND (expires_at IS NULL OR expires_at > NOW())
    `;
  }

  sql += " ORDER BY priority DESC, created_at DESC";

  const [rows, targetRows] = await Promise.all([
    query(sql),
    query(
      "SELECT promotion_id, target_type, target_value FROM public.promotion_targets"
    ),
  ]);

  const targetsByPromotion = new Map<string, PromotionTarget[]>();

  for (const target of targetRows) {
    const promotionId = String(target.promotion_id);
    const list = targetsByPromotion.get(promotionId) ?? [];

    list.push({
      type: target.target_type,
      value: String(target.target_value),
    });

    targetsByPromotion.set(promotionId, list);
  }

  return rows.map((row) =>
    normalizePromotion(row, targetsByPromotion.get(String(row.id)) ?? [])
  );
}

export async function withProductPromotions<T extends Product>(
  products: T[]
): Promise<(T & ReturnType<typeof buildProductPromotionFields>)[]> {
  if (products.length === 0) {
    return products.map((product) => ({
      ...product,
      ...buildProductPromotionFields(product, []),
    }));
  }

  let promotions: Promotion[] = [];

  try {
    promotions = await loadPromotions({ onlyActive: true });
  } catch (error) {
    console.error("Erro ao carregar promoções:", error);
  }

  const discountPromotions = promotions.filter((promotion) => promotion.promotion_type === "discount");
  return products.map((product) => ({
    ...product,
    ...buildProductPromotionFields(product, discountPromotions),
  }));
}
