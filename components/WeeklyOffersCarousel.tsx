"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/types/product";

interface WeeklyOffersCarouselProps {
  products: Product[];
  loading?: boolean;
}

export default function WeeklyOffersCarousel({
  products,
  loading = false,
}: WeeklyOffersCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: -1 | 1) => {
    const scroller = scrollerRef.current;
    scroller?.scrollBy({
      left: direction * Math.min(scroller.clientWidth * 0.8, 560),
      behavior: "smooth",
    });
  };

  if (!loading && products.length === 0) return null;

  return (
    <section className="bg-white py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative isolate overflow-hidden rounded-2xl bg-[#A01717] py-8 sm:py-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-32 -z-10 h-80 w-80 rounded-full border-[36px] border-white/[0.04]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-36 left-[28%] -z-10 h-72 w-72 rounded-full bg-red-950/10 blur-3xl"
          />
          <div className="mx-auto grid gap-5 px-4 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center lg:gap-8">
          <div className="text-white">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-100">
              Ofertas especiais
            </p>
            <h2 className="mt-2 flex flex-col leading-[0.95]">
              <span className="text-3xl font-black uppercase tracking-[-0.04em] sm:text-4xl">
                Ofertas
              </span>
              <span className="mt-1 font-serif text-3xl font-semibold italic tracking-tight text-red-100 sm:text-4xl">
                da semana
              </span>
            </h2>
            <Link
              href="/ofertas"
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-white underline decoration-white/50 underline-offset-4 transition hover:decoration-white"
            >
              Ver todas as ofertas
            </Link>
          </div>
  
          <div className="relative min-w-0">
            <div
              ref={scrollerRef}
              className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {loading
                ? [0, 1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-80 w-[190px] shrink-0 animate-pulse snap-start rounded-2xl bg-white/80 sm:w-[210px]"
                    />
                  ))
                : products.map((product) => (
                    <div
                      key={product.id}
                      className="w-[190px] shrink-0 snap-start sm:w-[210px]"
                    >
                      <ProductCard product={product} />
                    </div>
                  ))}
            </div>
  
            <button
              type="button"
              onClick={() => scroll(-1)}
              aria-label="Ofertas anteriores"
              className="absolute -left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-700 shadow-md transition hover:bg-white sm:flex"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label="Próximas ofertas"
              className="absolute -right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-700 shadow-md transition hover:bg-white sm:flex"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
