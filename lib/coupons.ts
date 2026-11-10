import type { AppliedCoupon, Coupon } from "@/types/coupon";

function toIsoString(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  const date = value instanceof Date ? value : new Date(String(value));

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function normalizeCoupon(row: Record<string, unknown>): Coupon {
  return {
    id: String(row.id),
    code: String(row.code),
    description: row.description == null ? null : String(row.description),
    discount_type: row.discount_type === "fixed" ? "fixed" : "percentage",
    discount_value: Number(row.discount_value),
    min_purchase: Number(row.min_purchase ?? 0),
    max_discount:
      row.max_discount === null || row.max_discount === undefined
        ? null
        : Number(row.max_discount),
    free_shipping: Boolean(row.free_shipping),
    usage_limit:
      row.usage_limit === null || row.usage_limit === undefined
        ? null
        : Number(row.usage_limit),
    used_count: Number(row.used_count ?? 0),
    starts_at: toIsoString(row.starts_at) ?? new Date(0).toISOString(),
    expires_at: toIsoString(row.expires_at),
    active: Boolean(row.active),
    created_at: toIsoString(row.created_at) ?? new Date(0).toISOString(),
    updated_at: toIsoString(row.updated_at) ?? new Date(0).toISOString(),
  };
}

export function calculateDiscount(
  coupon: AppliedCoupon | null,
  subtotal: number
): number {
  if (!coupon || subtotal <= 0) return 0;
  if (subtotal < coupon.min_purchase) return 0;

  let discount =
    coupon.discount_type === "percentage"
      ? (subtotal * coupon.discount_value) / 100
      : coupon.discount_value;

  if (coupon.max_discount !== null && coupon.max_discount > 0) {
    discount = Math.min(discount, coupon.max_discount);
  }

  return Math.min(Math.max(discount, 0), subtotal);
}

export function isCouponEligible(
  coupon: AppliedCoupon | null,
  subtotal: number
): boolean {
  return !coupon || subtotal >= coupon.min_purchase;
}
