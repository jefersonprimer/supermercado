import type { Metadata } from "next";
import Header from "@/components/Header";
import SubHeader from "@/components/SubHeader";
import Footer from "@/components/Footer";
import CartToast from "@/components/CartToast";
import AnnouncementBar from "@/components/AnnouncementBar";

export const metadata: Metadata = {
  title: "Black Week: ofertas e descontos",
  description:
    "Black Week Fanfar: 20% de desconto em toda a loja. Desconto máximo de R$ 100. Combina com cupom. Aproveite enquanto dura!",
};

export default function BlackWeekLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AnnouncementBar />
      <Header
        theme="dark"
        logoSrc="/Black Week Fanfar Pharmacy Banner.png"
        logoAlt="Black Week Fanfar Farmácia"
      />
      <SubHeader theme="dark" />
      <CartToast />
      {children}
      <Footer theme="dark" />
    </>
  );
}
