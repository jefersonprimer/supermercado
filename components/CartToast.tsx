"use client";

import { useEffect, useState } from "react";
import { Package, X } from "lucide-react";
import type { Product } from "@/types/product";

interface ToastData {
  id: number;
  product: Product;
}

export default function CartToast() {
  const [toast, setToast] = useState<ToastData | null>(null);

  useEffect(() => {
    function handleCartToast(event: Event) {
      const detail = (event as CustomEvent<{ product?: Product }>).detail;
      if (!detail?.product) return;

      setToast({ id: Date.now(), product: detail.product });
    }

    window.addEventListener("fanfar:cart-toast", handleCartToast);

    return () => {
      window.removeEventListener("fanfar:cart-toast", handleCartToast);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timeout = setTimeout(() => setToast(null), 4000);

    return () => clearTimeout(timeout);
  }, [toast]);

  if (!toast) return null;

  const image = toast.product.images?.[0];

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 top-24 z-[90] w-[calc(100vw-2rem)] max-w-sm animate-in fade-in slide-in-from-right-4 duration-200"
    >
      <div className="flex items-center gap-3 rounded-xl border border-[#A01717]/20 bg-white p-3 shadow-xl">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg">
          {image ? (
            <img
              src={image}
              alt={toast.product.name}
              className="h-full w-full object-contain"
            />
          ) : (
            <Package className="h-6 w-6 text-gray-300" aria-hidden="true" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-sm font-bold text-gray-900">
            Produto adicionado à sua cesta!
          </p>
          <p className="mt-0.5 line-clamp-2 text-sm font-normal text-gray-900">
            {toast.product.name}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setToast(null)}
          aria-label="Fechar notificação"
          className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
