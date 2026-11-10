"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface StoreCategory {
  name: string;
  image: string;
  href: string;
}

interface CategoryCarouselProps {
  categories: StoreCategory[];
  title?: string;
  subtitle?: string;
}

export default function CategoryCarousel({
  categories,
  title,
  subtitle,
}: CategoryCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const updateCanScroll = () => {
      setCanScroll(scroller.scrollWidth > scroller.clientWidth);
    };

    updateCanScroll();
    const resizeObserver = new ResizeObserver(updateCanScroll);
    resizeObserver.observe(scroller);

    return () => resizeObserver.disconnect();
  }, [categories]);

  const scroll = (direction: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    scroller.scrollBy({
      left: direction * Math.min(scroller.clientWidth * 0.8, 560),
      behavior: "smooth",
    });
  };

  if (categories.length === 0) return null;

  return (
    <section className="py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>

        <div className="relative">
          <div
            ref={scrollerRef}
            className="flex snap-x snap-mandatory gap-16 overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {categories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="group flex w-[112px] shrink-0 snap-start flex-col items-center gap-2 sm:w-[140px] lg:w-[90px]"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes="(max-width: 640px) 112px, (max-width: 1024px) 140px, 160px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <span className="text-center text-sm font-medium leading-snug text-gray-800 transition-colors group-hover:text-[#A01717]">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>

          {canScroll && (
            <>
              <button
                type="button"
                onClick={() => scroll(-1)}
                aria-label="Categorias anteriores"
                className="absolute -left-3 top-[calc(50%-1.25rem)] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-600 shadow-md transition hover:border-[#A01717] hover:text-[#A01717] sm:flex lg:-left-5"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => scroll(1)}
                aria-label="Próximas categorias"
                className="absolute -right-3 top-[calc(50%-1.25rem)] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-600 shadow-md transition hover:border-[#A01717] hover:text-[#A01717] sm:flex lg:-right-5"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
