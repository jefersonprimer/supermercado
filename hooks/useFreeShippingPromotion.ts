"use client";

import { useEffect, useState } from "react";

interface FreeShippingPromotion {
  id: string;
  name: string;
  min_purchase: number;
}

export function useFreeShippingPromotion() {
  const [promotions, setPromotions] = useState<FreeShippingPromotion[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/promotions")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!active || !Array.isArray(data?.promotions)) return;
        setPromotions(
          data.promotions
            .filter((promotion: { promotion_type?: string }) => promotion.promotion_type === "free_shipping")
            .map((promotion: FreeShippingPromotion) => ({
              id: promotion.id,
              name: promotion.name,
              min_purchase: Number(promotion.min_purchase) || 0,
            })),
        );
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return promotions;
}
