"use client";

import { useEffect, useState } from "react";
import { DEFAULT_DELIVERY_FEE } from "@/lib/delivery";

export function useDeliveryFee() {
  const [fee, setFee] = useState(DEFAULT_DELIVERY_FEE);

  useEffect(() => {
    let active = true;
    fetch("/api/delivery-fee")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const value = Number(data?.fee);
        if (active && Number.isFinite(value) && value >= 0) setFee(value);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return fee;
}
