export type CouponDiscountType = "percentage" | "fixed";

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: CouponDiscountType;
  discount_value: number;
  min_purchase: number;
  max_discount: number | null;
  free_shipping: boolean;
  usage_limit: number | null;
  used_count: number;
  starts_at: string;
  expires_at: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponInput {
  code: string;
  description?: string | null;
  discount_type: CouponDiscountType;
  discount_value: number;
  min_purchase?: number;
  max_discount?: number | null;
  free_shipping?: boolean;
  usage_limit?: number | null;
  starts_at?: string | null;
  expires_at?: string | null;
  active?: boolean;
}

export interface AppliedCoupon {
  id: string;
  code: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  min_purchase: number;
  max_discount: number | null;
  free_shipping: boolean;
}
