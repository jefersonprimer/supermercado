"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CONSENT_KEY = "fanfar_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(localStorage.getItem(CONSENT_KEY) === null);
  }, []);

  function chooseConsent(choice: "accepted" | "rejected") {
    localStorage.setItem(CONSENT_KEY, choice);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside
      aria-label="Preferências de cookies"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-gray-200 bg-white p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] sm:bottom-5 sm:left-5 sm:right-auto sm:max-w-xl sm:rounded-xl sm:border"
      role="dialog"
      aria-modal="false"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <h2 className="text-base font-bold text-gray-900">Sua privacidade importa</h2>
          <p className="mt-1 text-sm leading-5 text-gray-600">
            Usamos cookies para melhorar sua experiência. Você pode aceitar ou
            rejeitar cookies opcionais. Saiba mais na nossa{" "}
            <Link
              href="/politica-de-privacidade"
              className="font-semibold text-emerald-700 underline underline-offset-2"
            >
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 min-[420px]:flex-row">
          <button
            type="button"
            onClick={() => chooseConsent("rejected")}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            Rejeitar todos
          </button>
          <button
            type="button"
            onClick={() => chooseConsent("accepted")}
            className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            Aceitar todos
          </button>
        </div>
      </div>
    </aside>
  );
}
