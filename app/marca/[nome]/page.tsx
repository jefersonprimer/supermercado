import type { Metadata } from "next";
import CatalogView from "@/components/CatalogView";
import { readableCatalogName } from "@/lib/catalog-seo";
import { getAllProducts } from "@/lib/products-server";

type Props = { params: Promise<{ nome: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nome } = await params;
  const brand = readableCatalogName(nome);
  return {
    title: `${brand} | Produtos e ofertas`,
    description: `Compre produtos ${brand} na Fanfar Farmácia. Confira opções, preços e ofertas.`,
    alternates: { canonical: `/marca/${nome}` },
  };
}

export default async function BrandPage({ params }: Props) {
  const { nome } = await params;
  return <CatalogView brandSlug={nome} initialProducts={await getAllProducts()} />;
}
