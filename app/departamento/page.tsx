import type { Metadata } from "next";
import CatalogView from "@/components/CatalogView";
import { getAllProducts } from "@/lib/products-server";

export const metadata: Metadata = {
  title: "Departamentos",
  description:
    "Navegue por todos os departamentos e encontre medicamentos, dermocosméticos e produtos de saúde.",
};

export default async function DepartmentsPage() {
  return <CatalogView initialProducts={await getAllProducts()} />;
}
