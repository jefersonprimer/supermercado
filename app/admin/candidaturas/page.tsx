"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";

type Application = {
  id: string;
  full_name: string;
  photo_url: string | null;
  birth_date: string;
  current_address: string;
  email: string;
  phone: string;
  marital_status: string;
  has_children: boolean;
  children_count: number | null;
  previous_jobs: string;
  previous_dislikes: string;
  education: string;
  teamwork_response: string;
  skills: string;
  interested_positions: string[];
  other_position: string | null;
  work_shifts: string[];
  created_at: string;
};

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });
const dateTimeFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{children || "—"}</dd>
    </div>
  );
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/candidates", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível carregar as candidaturas.");
      setApplications(data.applications);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar as candidaturas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <main className="min-h-screen flex-1 bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-[#C10000]">
              <ArrowLeft className="h-4 w-4" /> Painel administrativo
            </Link>
            <h1 className="mt-3 text-2xl font-bold text-gray-900">Candidaturas recebidas</h1>
            <p className="mt-1 text-sm text-gray-500">Dados enviados pelo formulário Trabalhe conosco.</p>
          </div>
          <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
            {error.includes("administradores") && <p className="mt-2"><Link className="font-semibold underline" href="/login?next=/admin/candidaturas">Entrar como administrador</Link></p>}
          </div>
        )}

        {loading ? (
          <p className="py-16 text-center text-sm text-gray-500">Carregando candidaturas...</p>
        ) : !error && applications.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">Nenhuma candidatura recebida até agora.</p>
        ) : (
          <div className="mt-6 space-y-4">
            {applications.map((application) => (
              <details key={application.id} className="group rounded-2xl border border-gray-200 bg-white shadow-sm">
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-4 p-4 sm:p-5">
                  {application.photo_url ? (
                    <Image src={application.photo_url} alt={`Foto de ${application.full_name}`} width={56} height={56} unoptimized className="h-14 w-14 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-xs font-bold text-gray-500">Foto</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-bold text-gray-900">{application.full_name}</h2>
                    <p className="mt-1 text-sm text-gray-600">{application.interested_positions.map((position) => position === "Outro" ? application.other_position : position).filter(Boolean).join(" · ")}</p>
                  </div>
                  <time className="text-xs text-gray-500" dateTime={application.created_at}>Recebida em {dateTimeFormat.format(new Date(application.created_at))}</time>
                  <span aria-hidden="true" className="text-gray-400 transition-transform group-open:rotate-180">⌄</span>
                </summary>
                <dl className="grid gap-x-6 gap-y-5 border-t border-gray-100 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
                  <Detail label="Nascimento">{dateFormat.format(new Date(`${application.birth_date.slice(0, 10)}T12:00:00`))}</Detail>
                  <Detail label="Endereço">{application.current_address}</Detail>
                  <Detail label="E-mail"><a className="break-all hover:text-[#C10000]" href={`mailto:${application.email}`}>{application.email}</a></Detail>
                  <Detail label="Telefone"><a className="hover:text-[#C10000]" href={`tel:${application.phone.replace(/\D/g, "")}`}>{application.phone}</a></Detail>
                  <Detail label="Estado civil">{application.marital_status}</Detail>
                  <Detail label="Filhos">{application.has_children ? `Sim, ${application.children_count ?? 0}` : "Não"}</Detail>
                  <Detail label="Escolaridade">{application.education}</Detail>
                  <Detail label="Disponibilidade">{application.work_shifts.join(" · ")}</Detail>
                  <Detail label="Vagas de interesse">{application.interested_positions.map((position) => position === "Outro" ? application.other_position : position).filter(Boolean).join(" · ")}</Detail>
                  <div className="sm:col-span-2 lg:col-span-3"><Detail label="Experiências anteriores">{application.previous_jobs}</Detail></div>
                  <div className="sm:col-span-2 lg:col-span-3"><Detail label="O que não gostava nos trabalhos anteriores">{application.previous_dislikes}</Detail></div>
                  <div className="sm:col-span-2 lg:col-span-3"><Detail label="Trabalho em equipe">{application.teamwork_response}</Detail></div>
                  <div className="sm:col-span-2 lg:col-span-3"><Detail label="Habilidades">{application.skills}</Detail></div>
                  {application.photo_url && <div className="sm:col-span-2 lg:col-span-3"><a className="text-sm font-semibold text-[#A01717] underline hover:text-[#C10000]" href={application.photo_url} target="_blank" rel="noopener noreferrer">Abrir foto em tamanho original</a></div>}
                </dl>
              </details>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
