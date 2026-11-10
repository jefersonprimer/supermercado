"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Heart, Package, Trash2 } from "lucide-react";

type ListItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[] | null;
  stock: number;
};
const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function ListPage() {
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState("");

  const loadList = async () => {
    const response = await fetch("/api/list");
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "Não foi possível carregar sua lista.");
    setItems(data.items);
  };

  useEffect(() => {
    loadList()
      .catch((cause) =>
        setError(
          cause instanceof Error
            ? cause.message
            : "Não foi possível carregar sua lista.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const removeItem = async (id: string) => {
    setRemoving(id);
    setError("");
    try {
      const response = await fetch(`/api/list/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Não foi possível remover o produto.");
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível remover o produto.",
      );
    } finally {
      setRemoving("");
    }
  };

  return (
    <main className="flex-1 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#279236]"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar à loja
        </Link>
        <div className="mt-5">
          <h1 className="text-2xl font-bold text-gray-900">Minha lista</h1>
          <p className="mt-1 text-sm text-gray-500">
            Produtos que você salvou para consultar depois.
          </p>
        </div>
        {error && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {error}
            {error.includes("Faça login") && (
              <>
                {" "}
                <Link href="/login?next=/lista" className="font-bold underline">
                  Entrar na conta
                </Link>
              </>
            )}
          </div>
        )}
        {loading ? (
          <div className="mt-6 rounded-xl bg-white p-8 text-center text-sm text-gray-500">
            Carregando sua lista...
          </div>
        ) : !error && items.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white px-4 py-14 text-center">
            <Heart className="mx-auto h-10 w-10 text-gray-300" />
            <h2 className="mt-3 font-bold text-gray-900">
              Sua lista está vazia
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Adicione produtos pela página de detalhes.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Explorar produtos
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {items.map((item) => (
              <article
                key={item.id}
                className="flex min-w-0 items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4"
              >
                <Link
                  href={`/produto/${item.slug}`}
                  className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl"
                >
                  {item.images?.[0] ? (
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      className="h-full w-full object-contain p-2"
                    />
                  ) : (
                    <Package className="h-8 w-8 text-gray-300" />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/produto/${item.slug}`}
                    className="line-clamp-2 text-sm font-semibold text-gray-900"
                  >
                    {item.name}
                  </Link>
                  <p className="mt-2 font-bold text-gray-900">
                    {money.format(Number(item.price))}
                  </p>
                  <p
                    className={`mt-1 text-xs ${item.stock > 0 ? "text-emerald-700" : "text-red-600"}`}
                  >
                    {item.stock > 0 ? "Em estoque" : "Indisponível"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void removeItem(item.id)}
                  disabled={removing === item.id}
                  aria-label={`Remover ${item.name} da lista`}
                  className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
