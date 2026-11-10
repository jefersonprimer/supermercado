import type { Metadata } from "next";
import OffersView from "@/components/OffersView";
import { getAllProducts } from "@/lib/products-server";

export const metadata: Metadata = {
  title: "Ofertas",
  description:
    "Aproveite as melhores ofertas em medicamentos, dermocosméticos, higiene, beleza e muito mais.",
};

export default async function OffersPage() {
  return <OffersView initialProducts={await getAllProducts()} />;
}
