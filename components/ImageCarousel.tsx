"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface CarouselImage {
  src: string;
  mobileSrc?: string;
  alt: string;
  href?: string;
}

interface ImageCarouselProps {
  images: CarouselImage[];
  autoPlay?: boolean;
  interval?: number;
  className?: string;
}

// image mobile dimensions 470x294
export default function ImageCarousel({
  images,
  autoPlay = true,
  interval = 6000,
  className = "",
}: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const total = images.length;
  const currentIndex = total > 0 ? activeIndex % total : 0;

  useEffect(() => {
    if (!autoPlay || paused || total <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % total);
    }, interval);

    return () => window.clearInterval(timer);
  }, [autoPlay, paused, interval, total]);

  if (total === 0) return null;

  const goTo = (index: number) => {
    setActiveIndex(((index % total) + total) % total);
  };

  const next = () => goTo(currentIndex + 1);
  const previous = () => goTo(currentIndex - 1);

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return;

    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;

    if (Math.abs(delta) > 40) {
      if (delta < 0) {
        next();
      } else {
        previous();
      }
    }

    touchStartX.current = null;
  };

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Destaques"
      className={`relative overflow-hidden rounded-2xl bg-gray-100 ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((image, index) => {
          const isActive = index === currentIndex;
          const imageElement = (
            <>
              <Image
                src={image.src}
                alt={image.alt}
                fill
                preload={index === 0}
                sizes="(max-width: 1280px) 100vw, 1280px"
                className={`object-cover ${image.mobileSrc ? "hidden sm:block" : ""}`}
              />
              {image.mobileSrc && (
                <Image
                  src={image.mobileSrc}
                  alt={image.alt}
                  fill
                  preload={index === 0}
                  sizes="(max-width: 639px) 100vw, 1px"
                  className="object-cover sm:hidden"
                />
              )}
            </>
          );

          return (
            <div
              key={`${image.src}-${index}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} de ${total}`}
              aria-hidden={!isActive}
              className={`relative w-full shrink-0 ${image.mobileSrc ? "aspect-[1586/992] sm:aspect-[1318/300]" : "aspect-[1318/300]"}`}
            >
              {image.href ? (
                <Link
                  href={image.href}
                  tabIndex={isActive ? 0 : -1}
                  className="relative block h-full w-full"
                >
                  {imageElement}
                </Link>
              ) : (
                imageElement
              )}
            </div>
          );
        })}
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={previous}
            aria-label="Imagem anterior"
            className="hidden sm:flex absolute left-3 top-1/2 z-10 h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-gray-700 shadow-md backdrop-blur transition hover:bg-white hover:text-blue-600 sm:h-10 sm:w-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={next}
            aria-label="Próxima imagem"
            className="hidden sm:flex absolute right-3 top-1/2 z-10 h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-gray-700 shadow-md backdrop-blur transition hover:bg-white hover:text-blue-600 sm:h-10 sm:w-10"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/20 px-2 py-1.5 backdrop-blur-sm">
            {images.map((image, index) => (
              <button
                key={`${image.src}-dot-${index}`}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Ir para imagem ${index + 1}`}
                aria-current={index === currentIndex ? "true" : undefined}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentIndex
                    ? "w-5 bg-white"
                    : "w-1.5 bg-white/60 hover:bg-white/90"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
