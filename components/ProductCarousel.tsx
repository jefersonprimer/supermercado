"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/types/product";

interface ProductCarouselProps {
  products: Product[];
  title?: string;
  subtitle?: string;
  variant?: "default" | "dark";
}

export default function ProductCarousel({
  products,
  title = "Produtos em destaque",
  subtitle,
  variant = "default",
}: ProductCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    scroller.scrollBy({
      left: direction * Math.min(scroller.clientWidth * 0.8, 560),
      behavior: "smooth",
    });
  };

  if (products.length === 0) return null;

  const isDark = variant === "dark";

  return (
    <section className={isDark ? "bg-gray-900 py-8" : "py-8"}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5">
          <h2
            className={`text-xl font-bold sm:text-2xl ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className={`mt-1 text-sm ${
                isDark ? "text-gray-300" : "text-gray-500"
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>

        <div className="relative">
          <div
            ref={scrollerRef}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {products.map((product) => (
              <div
                key={product.id}
                className="w-[190px] shrink-0 snap-start sm:w-[230px] lg:w-[250px]"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Produtos anteriores"
            className={`absolute -left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border shadow-md transition sm:flex ${
              isDark
                ? "border-gray-700 bg-gray-800/95 text-gray-200 hover:border-gray-500 hover:bg-gray-700 hover:text-white"
                : "border-gray-200 bg-white/95 text-gray-600 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Próximos produtos"
            className={`absolute -right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border shadow-md transition sm:flex ${
              isDark
                ? "border-gray-700 bg-gray-800/95 text-gray-200 hover:border-gray-500 hover:bg-gray-700 hover:text-white"
                : "border-gray-200 bg-white/95 text-gray-600 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
