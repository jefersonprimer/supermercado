import HomeContent from "./HomeContent";
import { getAllProducts } from "@/lib/products-server";

export default async function HomePage() {
  const products = await getAllProducts();
  return <HomeContent initialProducts={products} />;
}
