"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Truck } from "lucide-react";

export default function AnnouncementBar() {
  const [activeIndex, setActiveIndex] = useState(0);
  const announcements = [
    {
      message: "Entrega grátis em compras acima de R$500,00",
      href: "/ofertas",
      icon: true,
    },
    {
      message: "Retire na loja sem filas e sem custo em até 3h",
      href: "/",
      icon: false,
    },
    {
      message:
        "Entrega grátis para clientes do Clube de Ofertas do Super Bertoletti em compras acima de R$99,99",
      href: "/ofertas",
      icon: true,
    },
  ];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % announcements.length);
    }, 6000);

    return () => window.clearInterval(interval);
  }, [announcements.length]);

  useEffect(() => {
    if (activeIndex >= announcements.length) setActiveIndex(0);
  }, [activeIndex, announcements.length]);

  const announcement = announcements[activeIndex];
  return (
    <div className="bg-[#A01717] text-white">
      <div className="mx-auto flex min-h-10 max-w-7xl items-center justify-center px-3 text-center text-xs sm:px-6 sm:text-sm">
        <Link
          key={activeIndex}
          href={announcement.href}
          aria-live="polite"
          className="flex min-w-0 animate-[announcement-fade-in_350ms_ease-out] items-center justify-center gap-2 py-2 hover:underline"
        >
          {announcement.icon && (
            <Truck className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span className="font-semibold leading-snug tracking-wide">
            {announcement.message}
          </span>
        </Link>
      </div>
    </div>
  );
}
