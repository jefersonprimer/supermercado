"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, LoaderCircle, Upload, X } from "lucide-react";

const positions = [
  "Açougueiro(a)",
  "Operador(a) de caixa",
  "Empacotador(a)",
  "Recepcionista",
  "Repositor(a)",
  "Padeiro(a)",
  "Confeiteiro(a)",
  "Produção de salgados (padaria)",
  "Atendente da padaria",
  "Repositor da fruteira",
  "Administrativo",
  "Marketing/Comunicação",
  "Motorista",
  "Limpeza",
  "Outro",
];

const shifts = [
  "Manhã (segunda a sábado)",
  "Tarde (segunda a sábado)",
  "Manhã e tarde (segunda a sábado)",
];

const educationLevels = [
  "Ensino fundamental incompleto",
  "Ensino fundamental completo",
  "Ensino médio incompleto",
  "Ensino médio completo",
  "Ensino superior incompleto",
  "Ensino superior completo",
  "Pós-graduação",
];

const inputClass = "mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm text-gray-900 outline-none transition focus:border-[#A01717] focus:ring-2 focus:ring-[#A01717]/10";
const labelClass = "block text-sm font-semibold text-gray-800";

type ApplicationForm = {
  fullName: string;
  birthDate: string;
  currentAddress: string;
  email: string;
  phone: string;
  maritalStatus: string;
  hasChildren: string;
  childrenCount: string;
  previousJobs: string;
  previousDislikes: string;
  education: string;
  teamworkResponse: string;
  skills: string;
  interestedPositions: string[];
  otherPosition: string;
  workShifts: string[];
};

const initialForm: ApplicationForm = {
  fullName: "",
  birthDate: "",
  currentAddress: "",
  email: "",
  phone: "",
  maritalStatus: "",
  hasChildren: "",
  childrenCount: "",
  previousJobs: "",
  previousDislikes: "",
  education: "",
  teamworkResponse: "",
  skills: "",
  interestedPositions: [],
  otherPosition: "",
  workShifts: [],
};

export default function WorkWithUsPage() {
  const [form, setForm] = useState(initialForm);
  const [maxBirthDate, setMaxBirthDate] = useState("");
  const [photo, setPhoto] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMaxBirthDate(new Date().toISOString().slice(0, 10));
  }, []);

  const setField = <K extends keyof ApplicationForm>(key: K, value: ApplicationForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const uploadPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Anexe uma foto em JPG, PNG ou WebP.");
      event.target.value = "";
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError("A foto deve ter no máximo 100 MB.");
      event.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const signatureResponse = await fetch("/api/candidates/upload-signature", { method: "POST" });
      const signatureData = await signatureResponse.json();
      if (!signatureResponse.ok) throw new Error(signatureData.error || "Não foi possível preparar o envio da foto.");

      const data = new FormData();
      data.append("file", file);
      data.append("api_key", signatureData.apiKey);
      data.append("timestamp", String(signatureData.timestamp));
      data.append("folder", signatureData.folder);
      data.append("public_id", signatureData.publicId);
      data.append("allowed_formats", signatureData.allowedFormats);
      data.append("overwrite", signatureData.overwrite);
      data.append("signature", signatureData.signature);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(signatureData.cloudName)}/image/upload`,
        { method: "POST", body: data },
      );
      const uploaded = await response.json();
      if (!response.ok || !uploaded.secure_url) {
        throw new Error(uploaded.error?.message || "Não foi possível enviar a foto.");
      }
      setPhoto({ url: uploaded.secure_url, name: file.name });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Não foi possível enviar a foto.");
      event.target.value = "";
    } finally {
      setUploading(false);
    }
  };

  const toggleItem = (key: "interestedPositions" | "workShifts", item: string) => {
    setForm((current) => ({
      ...current,
      [key]: current[key].includes(item)
        ? current[key].filter((value) => value !== item)
        : [...current[key], item],
    }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          hasChildren: form.hasChildren === "yes",
          childrenCount: form.hasChildren === "yes" ? form.childrenCount : null,
          photoUrl: photo?.url ?? null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível enviar sua candidatura.");
      setSubmitted(true);
      setForm(initialForm);
      setPhoto(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível enviar sua candidatura.");
    } finally {
      setSubmitting(false);
    }
  };

  const field = (name: keyof ApplicationForm, value: string) =>
    setField(name, value as never);

  return (
    <main className="flex-1 bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-[#C10000]">
          <ArrowLeft className="h-4 w-4" /> Voltar à loja
        </Link>
        <div className="mb-8 mt-5 rounded-3xl bg-gradient-to-r from-[#A01717] to-[#C10000] p-6 text-white shadow-md sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">Supermercado Bertoletti</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Trabalhe conosco</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85">
            Quer fazer parte da nossa equipe? Conte um pouco sobre você e candidate-se às vagas de seu interesse.
          </p>
        </div>

        {submitted && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900" role="status">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <p><strong>Candidatura enviada.</strong> Obrigado pelo interesse em trabalhar conosco.</p>
          </div>
        )}
        {error && <p className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}

        <form onSubmit={submit} className="space-y-6">
          <section className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Dados pessoais</h2>
              <p className="mt-1 text-xs text-gray-500">Campos com * são obrigatórios.</p>
            </div>

            <label className={labelClass}>Nome e sobrenome *
              <input className={inputClass} required maxLength={200} autoComplete="name" value={form.fullName} onChange={(event) => field("fullName", event.target.value)} />
            </label>

            <div>
              <label className={labelClass} htmlFor="candidate-photo">Anexe uma foto sua com boa iluminação</label>
              <p className="mt-1 text-xs text-gray-500">Envie 1 foto em JPG, PNG ou WebP. Tamanho máximo: 100 MB.</p>
              <input ref={fileInputRef} id="candidate-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadPhoto} className="sr-only" />
              {photo ? (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-gray-200 p-3">
                  <Image src={photo.url} alt="Prévia da foto anexada" width={56} height={56} unoptimized className="h-14 w-14 rounded-lg object-cover" />
                  <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{photo.name}</span>
                  <button type="button" onClick={() => { setPhoto(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Remover foto">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-[#A01717] hover:text-[#A01717] disabled:opacity-60">
                  {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? "Enviando foto..." : "Escolher foto"}
                </button>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className={labelClass}>Data de nascimento *
                <input className={inputClass} required type="date" max={maxBirthDate} value={form.birthDate} onChange={(event) => field("birthDate", event.target.value)} />
              </label>
              <label className={labelClass}>Endereço atual *
                <input className={inputClass} required maxLength={500} autoComplete="street-address" value={form.currentAddress} onChange={(event) => field("currentAddress", event.target.value)} />
              </label>
              <label className={labelClass}>E-mail *
                <input className={inputClass} required type="email" maxLength={254} autoComplete="email" value={form.email} onChange={(event) => field("email", event.target.value)} />
              </label>
              <label className={labelClass}>Número de telefone *
                <input className={inputClass} required type="tel" maxLength={40} autoComplete="tel" value={form.phone} onChange={(event) => field("phone", event.target.value)} />
              </label>
            </div>

            <fieldset>
              <legend className={labelClass}>Estado civil *</legend>
              <div className="mt-2 flex flex-wrap gap-3">
                {["Casado(a)", "Solteiro(a)", "União estável"].map((status) => (
                  <label key={status} className={`cursor-pointer rounded-xl border px-3 py-2.5 text-sm ${form.maritalStatus === status ? "border-[#A01717] bg-red-50 text-[#A01717]" : "border-gray-200 text-gray-700"}`}>
                    <input className="sr-only" type="radio" required name="maritalStatus" value={status} checked={form.maritalStatus === status} onChange={(event) => field("maritalStatus", event.target.value)} />
                    {status}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className={labelClass}>Possui filhos? *</legend>
              <div className="mt-2 flex gap-3">
                {[{ value: "yes", label: "Sim" }, { value: "no", label: "Não" }].map((option) => (
                  <label key={option.value} className={`cursor-pointer rounded-xl border px-4 py-2.5 text-sm ${form.hasChildren === option.value ? "border-[#A01717] bg-red-50 text-[#A01717]" : "border-gray-200 text-gray-700"}`}>
                    <input className="sr-only" type="radio" required name="hasChildren" value={option.value} checked={form.hasChildren === option.value} onChange={(event) => { field("hasChildren", event.target.value); if (event.target.value === "no") field("childrenCount", ""); }} />
                    {option.label}
                  </label>
                ))}
              </div>
              {form.hasChildren === "yes" && (
                <label className={`${labelClass} mt-4 block`}>Quantos filhos? *
                  <input className={`${inputClass} max-w-40`} required type="number" min="1" max="30" step="1" value={form.childrenCount} onChange={(event) => field("childrenCount", event.target.value)} />
                </label>
              )}
            </fieldset>
          </section>

          <section className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-xl font-bold text-gray-900">Experiência e perfil</h2>
            <label className={labelClass}>Locais onde trabalhou anteriormente. Informe o tempo de trabalho e a função desempenhada. *
              <textarea className={`${inputClass} min-h-28 resize-y`} required maxLength={5000} value={form.previousJobs} onChange={(event) => field("previousJobs", event.target.value)} />
            </label>
            <label className={labelClass}>Do que você não gostava nos seus trabalhos anteriores? *
              <textarea className={`${inputClass} min-h-24 resize-y`} required maxLength={3000} value={form.previousDislikes} onChange={(event) => field("previousDislikes", event.target.value)} />
            </label>
            <label className={labelClass}>Grau de escolaridade *
              <select className={inputClass} required value={form.education} onChange={(event) => field("education", event.target.value)}>
                <option value="">Selecione</option>
                {educationLevels.map((level) => <option key={level} value={level}>{level}</option>)}
              </select>
            </label>
            <label className={labelClass}>Você gosta de trabalhar em equipe? Se sim, por quê? *
              <textarea className={`${inputClass} min-h-24 resize-y`} required maxLength={3000} value={form.teamworkResponse} onChange={(event) => field("teamworkResponse", event.target.value)} />
            </label>
            <label className={labelClass}>Fale um pouco sobre suas principais habilidades. *
              <textarea className={`${inputClass} min-h-24 resize-y`} required maxLength={3000} value={form.skills} onChange={(event) => field("skills", event.target.value)} />
            </label>
          </section>

          <section className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-xl font-bold text-gray-900">Vagas e disponibilidade</h2>
            <fieldset>
              <legend className={labelClass}>Em quais vagas você está interessado? * <span className="font-normal text-gray-500">(selecione uma ou mais)</span></legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {positions.map((position) => (
                  <label key={position} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    <input type="checkbox" checked={form.interestedPositions.includes(position)} onChange={() => toggleItem("interestedPositions", position)} className="h-4 w-4 rounded border-gray-300 accent-[#A01717]" />
                    {position}
                  </label>
                ))}
              </div>
              {form.interestedPositions.includes("Outro") && (
                <label className={`${labelClass} mt-4 block`}>Qual vaga? *
                  <input className={inputClass} required maxLength={120} value={form.otherPosition} onChange={(event) => field("otherPosition", event.target.value)} />
                </label>
              )}
            </fieldset>

            <fieldset>
              <legend className={labelClass}>Você tem disponibilidade para trabalhar em quais horários? *</legend>
              <div className="mt-3 space-y-2">
                {shifts.map((shift) => (
                  <label key={shift} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    <input type="checkbox" checked={form.workShifts.includes(shift)} onChange={() => toggleItem("workShifts", shift)} className="h-4 w-4 rounded border-gray-300 accent-[#A01717]" />
                    {shift}
                  </label>
                ))}
              </div>
            </fieldset>
          </section>

          <div className="rounded-xl border border-gray-200 bg-white p-4 text-xs leading-relaxed text-gray-500">
            Ao enviar, você autoriza o Supermercado Bertoletti a utilizar estas informações para avaliar sua candidatura e entrar em contato sobre oportunidades de trabalho.
          </div>
          <button type="submit" disabled={submitting || uploading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#A01717] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#C10000] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
            {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {submitting ? "Enviando candidatura..." : "Enviar candidatura"}
          </button>
        </form>
      </div>
    </main>
  );
}
