import type { Metadata } from "next";
import CatalogView from "@/components/CatalogView";
import { readableCatalogName } from "@/lib/catalog-seo";
import { getAllProducts } from "@/lib/products-server";

type Props = { params: Promise<{ departamento: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { departamento } = await params;
  const name = readableCatalogName(departamento);
  return {
    title: `${name} | Departamento`,
    description: `Confira produtos, preços e ofertas de ${name} na Fanfar Farmácia.`,
    alternates: { canonical: `/departamento/${departamento}` },
  };
}

export default async function DepartmentPage({ params }: Props) {
  const { departamento } = await params;
  return <CatalogView departmentSlug={departamento} initialProducts={await getAllProducts()} />;
}
