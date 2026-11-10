"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface StoreBrand {
  name: string;
  image: string;
  href: string;
}

interface BrandCarouselProps {
  brands: StoreBrand[];
}

export default function BrandCarousel({ brands }: BrandCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: -1 | 1) => {
    scrollerRef.current?.scrollBy({
      left: direction * Math.min(scrollerRef.current.clientWidth * 0.8, 560),
      behavior: "smooth",
    });
  };

  if (brands.length === 0) return null;

  return (
    <section className="py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-5 text-xl font-bold text-gray-900 sm:text-2xl">
          Marcas em destaque
        </h2>
        <div className="relative">
          <div
            ref={scrollerRef}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {brands.map((brand) => (
              <Link
                key={brand.name}
                href={brand.href}
                aria-label={`Ver produtos ${brand.name}`}
                className="group relative aspect-square w-[112px] shrink-0 snap-start overflow-hidden rounded-2xl border border-gray-200 bg-white sm:w-[140px] lg:w-[160px]"
              >
                <Image
                  src={brand.image}
                  alt={brand.name}
                  fill
                  sizes="(max-width: 640px) 112px, (max-width: 1024px) 140px, 160px"
                  className="object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </Link>
            ))}
          </div>
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Marcas anteriores"
            className="absolute -left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-600 shadow-md transition hover:text-[#279236] sm:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Próximas marcas"
            className="absolute -right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-600 shadow-md transition hover:text-[#279236] sm:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
