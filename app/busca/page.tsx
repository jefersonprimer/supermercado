import type { Metadata } from "next";
import CatalogView from "@/components/CatalogView";
import { getAllProducts } from "@/lib/products-server";

export const metadata: Metadata = {
  title: "Busca | Supermercado Bertoletti",
  description: "Encontre produtos no Supermercado Bertoletti.",
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const products = await getAllProducts();

  return <CatalogView initialProducts={products} searchQuery={q.trim()} />;
}
