export type PromotionScope =
  | "store"
  | "department"
  | "category"
  | "brand"
  | "product";

export type PromotionTargetType = Exclude<PromotionScope, "store">;

export type PromotionDiscountType = "percentage" | "fixed" | "fixed_price";
export type PromotionType = "discount" | "free_shipping";

export interface PromotionTarget {
  type: PromotionTargetType;
  value: string;
}

export interface Promotion {
  id: string;
  name: string;
  description: string | null;
  promotion_type: PromotionType;
  min_purchase: number;
  scope_type: PromotionScope;
  targets: PromotionTarget[];
  discount_type: PromotionDiscountType;
  discount_value: number;
  min_quantity: number;
  max_discount: number | null;
  badge_label: string | null;
  priority: number;
  stackable: boolean;
  combinable_with_coupon: boolean;
  starts_at: string;
  expires_at: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppliedPromotion {
  id: string;
  name: string;
  discount_type: PromotionDiscountType;
  discount_value: number;
  min_quantity: number;
  max_discount: number | null;
  badge_label: string | null;
  combinable_with_coupon: boolean;
}

export interface PromotionInput {
  name: string;
  description?: string | null;
  promotion_type?: PromotionType;
  min_purchase?: number;
  scope_type: PromotionScope;
  targets?: PromotionTarget[];
  discount_type: PromotionDiscountType;
  discount_value: number;
  min_quantity?: number;
  max_discount?: number | null;
  badge_label?: string | null;
  priority?: number;
  stackable?: boolean;
  combinable_with_coupon?: boolean;
  starts_at?: string | null;
  expires_at?: string | null;
  active?: boolean;
}
