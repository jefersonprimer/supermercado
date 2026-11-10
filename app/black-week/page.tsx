"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { getPromotedUnitPrice } from "@/lib/promotions";
import type { Product } from "@/types/product";

// ─── Countdown ──────────────────────────────────────────────────────────────

/** Black Week termina na virada de 30/11 → 01/12 */
const BLACK_WEEK_END = new Date("2026-12-01T00:00:00-03:00").getTime();

function useCountdown(target: number) {
  const calc = () => {
    const diff = Math.max(0, target - Date.now());
    return {
      days: Math.floor(diff / 86_400_000),
      hours: Math.floor((diff % 86_400_000) / 3_600_000),
      minutes: Math.floor((diff % 3_600_000) / 60_000),
      seconds: Math.floor((diff % 60_000) / 1_000),
      done: diff === 0,
    };
  };

  const [state, setState] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    done: false,
  });

  useEffect(() => {
    setState(calc());
    const id = setInterval(() => setState(calc()), 1_000);
    return () => clearInterval(id);
  }, [target]);

  return state;
}

// ─── Timer cell ─────────────────────────────────────────────────────────────

function TimerCell({ value, label }: { value: number; label: string }) {
  const display = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="
          relative flex h-16 w-16 items-center justify-center
          rounded-xl bg-white/10 backdrop-blur-sm
          text-3xl font-black tabular-nums text-white
          shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_4px_16px_rgba(0,0,0,0.4)]
          sm:h-20 sm:w-20 sm:text-4xl
        "
      >
        {display}
        {/* shine line */}
        <span className="pointer-events-none absolute inset-x-2 top-px h-px bg-white/20 rounded-full" />
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
        {label}
      </span>
    </div>
  );
}

// ─── Discount badge ──────────────────────────────────────────────────────────

function DiscountBadge() {
  return (
    <div
      className="
        inline-flex flex-col items-center justify-center
        h-24 w-24 rounded-full
        bg-gradient-to-br from-yellow-400 to-amber-500
        shadow-[0_0_40px_rgba(251,191,36,0.5)]
        sm:h-28 sm:w-28
      "
    >
      <span className="text-4xl font-black leading-none text-black sm:text-5xl">
        20%
      </span>
      <span className="text-sm font-bold uppercase tracking-wider text-black/80 sm:text-base">
        OFF
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-black/60">
        toda loja
      </span>
    </div>
  );
}

// ─── Marquee strip ───────────────────────────────────────────────────────────

function MarqueeStrip() {
  const items = Array(8).fill("✦ BLACK WEEK • 20% OFF • TODA A LOJA");
  return (
    <div className="overflow-hidden bg-yellow-400 py-2">
      <div
        className="flex whitespace-nowrap animate-[marquee_18s_linear_infinite]"
        style={{ width: "max-content" }}
      >
        {[...items, ...items].map((text, i) => (
          <span
            key={i}
            className="px-8 text-xs font-bold uppercase tracking-widest text-black"
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Product grid — dark themed ──────────────────────────────────────────────

function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-white/30">
        Nenhum produto encontrado.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} theme="dark" />
      ))}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="h-72 animate-pulse rounded-2xl bg-white/6" />
      ))}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function BlackWeekPage() {
  const countdown = useCountdown(BLACK_WEEK_END);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Sort key state
  const [sort, setSort] = useState<"discount" | "price_asc" | "price_desc">(
    "discount",
  );

  useEffect(() => {
    let active = true;
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        if (active) setProducts(data.products ?? []);
      })
      .catch(console.error)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const sorted = useMemo(() => {
    const withDiscount = products.map((p) => {
      const unit = Number(p.price);
      const promo = p.promotion ?? null;
      const promoted = promo ? getPromotedUnitPrice(promo, unit) : unit;
      const discount = promo && promoted < unit ? 1 - promoted / unit : 0;
      return { product: p, promoted, discount };
    });

    if (sort === "discount") {
      return [...withDiscount].sort((a, b) => b.discount - a.discount);
    }
    if (sort === "price_asc") {
      return [...withDiscount].sort((a, b) => a.promoted - b.promoted);
    }
    return [...withDiscount].sort((a, b) => b.promoted - a.promoted);
  }, [products, sort]);

  const visibleProducts = sorted.map((x) => x.product);

  return (
    <main className="flex-1">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-black">
        {/* Background texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Glow blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-yellow-400/10 blur-[100px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 bottom-0 h-[400px] w-[400px] rounded-full bg-yellow-400/8 blur-[120px]"
        />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="flex flex-col items-center gap-7 text-center lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:text-left">
            {/* Left: copy */}
            <div className="flex flex-col items-center gap-4 lg:items-start">
              {/* eyebrow */}
              <span className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-yellow-400">
                Oferta por tempo limitado
              </span>

              <div>
                <h1 className="text-4xl font-black uppercase leading-none tracking-tight text-white sm:text-6xl lg:text-7xl">
                  Black
                </h1>
                <h1 className="text-4xl font-black uppercase leading-none tracking-tight text-yellow-400 sm:text-6xl lg:text-7xl">
                  Week
                </h1>
              </div>

              <p className="max-w-md text-base text-white/60 lg:text-lg">
                20% de desconto em toda a loja. Desconto máximo de{" "}
                <strong className="text-white/90">R$&nbsp;100</strong>. Combina
                com cupom.
              </p>

              <a
                href="#produtos"
                className="
                  mt-2 inline-flex items-center gap-2 rounded-full
                  bg-yellow-400 px-7 py-3.5
                  text-sm font-bold uppercase tracking-wider text-black
                  shadow-[0_0_24px_rgba(251,191,36,0.4)]
                  transition hover:bg-yellow-300 hover:shadow-[0_0_36px_rgba(251,191,36,0.6)]
                  active:scale-95
                "
              >
                Ver ofertas
              </a>
            </div>

            {/* Right: badge + timer */}
            <div className="flex flex-col items-center gap-5">
              <DiscountBadge />

              {/* Countdown */}
              <div className="flex flex-col items-center gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
                  A promoção encerra em
                </p>
                {countdown.done ? (
                  <p className="text-base font-bold text-yellow-400">
                    Promoção encerrada
                  </p>
                ) : (
                  <div className="flex items-end gap-2">
                    <TimerCell value={countdown.days} label="dias" />
                    <span className="mb-5 text-2xl font-black text-white/40">
                      :
                    </span>
                    <TimerCell value={countdown.hours} label="horas" />
                    <span className="mb-5 text-2xl font-black text-white/40">
                      :
                    </span>
                    <TimerCell value={countdown.minutes} label="min" />
                    <span className="mb-5 text-2xl font-black text-white/40">
                      :
                    </span>
                    <TimerCell value={countdown.seconds} label="seg" />
                  </div>
                )}
              </div>

              {/* Rules chips */}
              <div className="flex flex-wrap justify-center gap-2">
                {["Toda a loja", "Máx. R$ 100", "Combina com cupom"].map(
                  (rule) => (
                    <span
                      key={rule}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/50"
                    >
                      {rule}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Marquee ── */}
      <MarqueeStrip />

      {/* ── Products ── */}
      <section id="produtos" className="bg-zinc-950 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">
                Produtos com <span className="text-yellow-400">20% OFF</span>
              </h2>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-white/30">
                Ordenar por:
              </span>
              <select
                value={sort}
                onChange={(e) =>
                  setSort(
                    e.target.value as "discount" | "price_asc" | "price_desc",
                  )
                }
                className="rounded-lg border border-white/15 bg-zinc-800 px-3 py-2 text-sm font-medium text-white/80 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
              >
                <option value="discount">Maior desconto</option>
                <option value="price_asc">Menor preço</option>
                <option value="price_desc">Maior preço</option>
              </select>
            </div>
          </div>

          {loading ? (
            <GridSkeleton />
          ) : (
            <ProductGrid products={visibleProducts} />
          )}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="bg-black py-16 text-center">
        <div className="mx-auto max-w-xl px-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-yellow-400">
            Não perca tempo
          </p>
          <h3 className="text-3xl font-black text-white sm:text-4xl">
            A Black Week acaba em breve.
          </h3>
          <p className="mt-3 text-sm text-white/50">
            Aproveite 20% em toda a loja. O desconto é aplicado automaticamente.
          </p>
          <a
            href="#produtos"
            className="
              mt-8 inline-flex items-center gap-2 rounded-full
              bg-yellow-400 px-8 py-4
              text-sm font-bold uppercase tracking-wider text-black
              shadow-[0_0_32px_rgba(251,191,36,0.35)]
              transition hover:bg-yellow-300
              active:scale-95
            "
          >
            Aproveitar agora
          </a>
        </div>
      </section>

      {/* Marquee keyframe */}
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </main>
  );
}
