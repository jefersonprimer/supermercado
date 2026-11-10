"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, LoaderCircle, MessageSquareText } from "lucide-react";

type SacType = "Sugestão" | "Reclamação";

const inputClass = "mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm text-gray-900 outline-none transition focus:border-[#A01717] focus:ring-2 focus:ring-[#A01717]/10";
const labelClass = "block text-sm font-semibold text-gray-800";

export default function SacPage() {
  const [type, setType] = useState<SacType | "">("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSending(true);
    try {
      const response = await fetch("/api/sac", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, fullName, email, phone, orderNumber, message, website }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível enviar sua mensagem.");
      setSent(true);
      setType("");
      setFullName("");
      setEmail("");
      setPhone("");
      setOrderNumber("");
      setMessage("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível enviar sua mensagem.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="flex-1 bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-[#C10000]">
          <ArrowLeft className="h-4 w-4" /> Voltar à loja
        </Link>
        <div className="mb-7 mt-5 rounded-3xl bg-gradient-to-r from-[#A01717] to-[#C10000] p-6 text-white shadow-md sm:p-8">
          <MessageSquareText className="h-8 w-8 text-white/85" />
          <h1 className="mt-3 text-3xl font-bold">SAC</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/85">
            Sua opinião ajuda a melhorar o Supermercado Bertoletti. Envie uma sugestão ou conte como podemos resolver uma reclamação.
          </p>
        </div>

        {sent && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900" role="status">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <p><strong>Mensagem enviada.</strong> Obrigado por falar com a gente.</p>
          </div>
        )}
        {error && <p className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}

        <form onSubmit={submit} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <fieldset>
            <legend className={labelClass}>Como podemos ajudar? *</legend>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {(["Sugestão", "Reclamação"] as const).map((option) => (
                <label key={option} className={`cursor-pointer rounded-xl border px-4 py-3 text-center text-sm font-semibold transition ${type === option ? "border-[#A01717] bg-red-50 text-[#A01717]" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}>
                  <input className="sr-only" type="radio" name="type" required value={option} checked={type === option} onChange={() => setType(option)} />
                  {option}
                </label>
              ))}
            </div>
          </fieldset>

          <label className={labelClass}>Nome completo *
            <input className={inputClass} required maxLength={200} autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className={labelClass}>E-mail para retorno *
              <input className={inputClass} required type="email" maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label className={labelClass}>Telefone <span className="font-normal text-gray-500">(opcional)</span>
              <input className={inputClass} type="tel" maxLength={40} autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </label>
          </div>

          <label className={labelClass}>Número do pedido <span className="font-normal text-gray-500">(opcional)</span>
            <input className={inputClass} maxLength={100} value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} />
          </label>

          <label className={labelClass}>Sua mensagem *
            <textarea className={`${inputClass} min-h-40 resize-y`} required minLength={10} maxLength={5000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Conte para a gente o que aconteceu ou compartilhe sua ideia." />
            <span className="mt-1 block text-right text-xs font-normal text-gray-400">{message.length}/5000</span>
          </label>

          <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
            <label>Não preencha este campo<input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></label>
          </div>

          <p className="text-xs leading-relaxed text-gray-500">
            Usaremos seus dados apenas para analisar sua mensagem e entrar em contato sobre este atendimento.
          </p>
          <button type="submit" disabled={sending} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#A01717] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#C10000] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
            {sending && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {sending ? "Enviando..." : "Enviar mensagem"}
          </button>
        </form>
      </div>
    </main>
  );
}
