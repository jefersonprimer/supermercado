"use client";

import { useSyncExternalStore } from "react";
import {
  addToCart,
  applyCoupon,
  clearCart,
  getCouponSnapshot,
  getServerCouponSnapshot,
  getServerSnapshot,
  getSnapshot,
  removeCoupon,
  removeFromCart,
  setCartQuantity,
  subscribe,
} from "@/lib/cart";
import { calculateDiscount, isCouponEligible } from "@/lib/coupons";
import { calculateLineDiscount } from "@/lib/promotions";
import type { AppliedPromotion } from "@/types/promotion";

export function useCart() {
  const items = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const coupon = useSyncExternalStore(
    subscribe,
    getCouponSnapshot,
    getServerCouponSnapshot
  );

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const total = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  const promotions: AppliedPromotion[] = [];
  let promotionsDiscount = 0;

  for (const item of items) {
    const promotion = item.product.promotion ?? null;

    if (!promotion) continue;

    const discount = calculateLineDiscount(
      promotion,
      Number(item.product.price),
      item.quantity
    );

    if (discount > 0) {
      promotionsDiscount += discount;
      promotions.push(promotion);
    }
  }

  const subtotalAfterPromotions = Math.max(total - promotionsDiscount, 0);
  const couponsAllowed = promotions.every(
    (promotion) => promotion.combinable_with_coupon
  );
  const discount = couponsAllowed
    ? calculateDiscount(coupon, subtotalAfterPromotions)
    : 0;
  const couponEligible =
    couponsAllowed && isCouponEligible(coupon, subtotalAfterPromotions);
  const finalTotal = Math.max(subtotalAfterPromotions - discount, 0);

  return {
    items,
    itemCount,
    total,
    promotions,
    promotionsDiscount,
    subtotalAfterPromotions,
    couponsAllowed,
    coupon,
    couponEligible,
    discount,
    finalTotal,
    addToCart,
    setCartQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
  };
}
