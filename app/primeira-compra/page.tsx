"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, Gift, ShoppingBag, Sparkles, Tag } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/types/product";

const coupons = [
  {
    code: "PRIMEIRACOMPRA20",
    discount: "20%",
    color: "from-emerald-500 to-green-700",
  },
  {
    code: "PRIMEIRACOMPRA30",
    discount: "30%",
    color: "from-teal-500 to-emerald-700",
  },
  {
    code: "PRIMEIRACOMPRA40",
    discount: "40%",
    color: "from-lime-500 to-green-700",
  },
];

export default function PrimeiraCompraPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let active = true;

    fetch("/api/products?limit=8")
      .then(async (response) => {
        if (!response.ok) return [];
        const data = await response.json();
        return (data.products ?? []) as Product[];
      })
      .then((items) => {
        if (active) setProducts(items);
      })
      .catch((error) => console.error("Erro ao carregar produtos:", error));

    return () => {
      active = false;
    };
  }, []);

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error("Não foi possível copiar o cupom:", error);
    }
  }

  return (
    <main className="flex-1 overflow-hidden bg-[#f5faf5]">
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#103d25] via-[#176b35] to-[#279236] px-4 py-16 text-white sm:py-24">
        <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full border-[40px] border-white/5" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-lime-300/10 blur-3xl" />
        <div className="relative mx-auto max-w-5xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-lime-100">
            Boas-vindas à Fanfar
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
            Sua primeira compra merece um cuidado especial
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
            Escolha seu cupom e aproveite condições especiais para começar a
            cuidar de você com a gente.
          </p>
          <a
            href="#cupons"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-lime-300 px-6 py-3.5 text-sm font-extrabold text-green-950 shadow-lg shadow-black/15 transition hover:-translate-y-0.5 hover:bg-lime-200"
          >
            <Gift className="h-5 w-5" /> Ver meus cupons
          </a>
        </div>
      </section>

      <section
        id="cupons"
        className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16"
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#279236]">
            Um presente para você
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
            Escolha seu desconto
          </h2>
          <p className="mt-3 text-sm leading-6 text-gray-600 sm:text-base">
            Copie o código desejado e aplique no campo de cupom ao finalizar seu
            pedido.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {coupons.map(({ code, discount, color }) => {
            const isCopied = copiedCode === code;
            return (
              <article
                key={code}
                className="group relative overflow-hidden rounded-2xl border border-green-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-green-900/10"
              >
                <div
                  className={`absolute inset-x-0 top-0 h-2 bg-gradient-to-r ${color}`}
                />
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-md`}
                  >
                    <Tag className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-800">
                    PRIMEIRA COMPRA
                  </span>
                </div>
                <p className="mt-6 text-5xl font-black tracking-tight text-gray-900">
                  {discount}
                  <span className="ml-1 text-xl font-bold text-[#279236]">
                    OFF
                  </span>
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Use este código no seu pedido
                </p>
                <div className="mt-5 flex items-center justify-between gap-2 rounded-xl border border-dashed border-green-300 bg-green-50/70 p-3">
                  <span className="break-all font-mono text-sm font-extrabold tracking-wide text-green-950">
                    {code}
                  </span>
                  <button
                    type="button"
                    onClick={() => void copyCode(code)}
                    aria-label={`${isCopied ? "Cupom copiado" : "Copiar cupom"} ${code}`}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-3 text-xs font-bold text-green-800 shadow-sm ring-1 ring-green-100 transition hover:bg-green-100"
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {isCopied ? "Copiado" : "Copiar"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mx-auto mt-8 flex max-w-3xl flex-col items-center gap-4 rounded-2xl border border-lime-200 bg-gradient-to-r from-lime-50 to-emerald-50 p-5 text-center sm:flex-row sm:p-6 sm:text-left">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#279236] shadow-sm">
            <Sparkles className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <h3 className="font-extrabold text-gray-900">
              Promoção Primeira compra
            </h3>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              20% OFF na loja inteira, limitado a uma compra. Aplicável a todos
              os produtos e combinável com cupom, conforme as regras da
              promoção.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-[#279236] px-4 py-2 text-sm font-black text-white">
            20% OFF
          </span>
        </div>

        {products.length > 0 && (
          <section className="mt-14" aria-labelledby="products-heading">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#279236]">
                  Comece por aqui
                </p>
                <h2
                  id="products-heading"
                  className="mt-1 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl"
                >
                  Produtos para sua primeira compra
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Encontre seus favoritos e aproveite as condições especiais.
                </p>
              </div>
              <Link
                href="/ofertas"
                className="text-sm font-bold text-[#279236] transition hover:text-green-800"
              >
                Ver todas as ofertas →
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {products.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        <div className="mt-9 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-[#279236] px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#1f7a2b]"
          >
            <ShoppingBag className="h-4 w-4" /> Escolher produtos
          </Link>
          <p className="mt-3 text-xs text-gray-500">
            Os cupons estão sujeitos às regras e à disponibilidade indicadas na
            finalização do pedido.
          </p>
        </div>
      </section>
    </main>
  );
}
