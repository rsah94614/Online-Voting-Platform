"use client";
// app/(dashboard)/admin/elections/create/page.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

const schema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().optional(),
  type: z.enum(["PRESIDENTIAL","PARLIAMENTARY","MUNICIPAL","SENATE","CORPORATE","STUDENT","OTHER"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
}).refine((d) => new Date(d.startDate) < new Date(d.endDate), {
  message: "End date must be after start date",
  path: ["endDate"],
});

type FormData = z.infer<typeof schema>;

interface Candidate {
  id: string;
  user: { name: string; email: string };
  party: { name: string; abbreviation: string; color: string } | null;
}

export default function CreateElectionPage() {
  const router = useRouter();
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: "PRESIDENTIAL" },
  });

  const { data: candidatesData } = useQuery({
    queryKey: ["approved-candidates"],
    queryFn: async () => {
      const res = await fetch("/api/candidates?approved=true");
      return res.json() as Promise<{ candidates: Candidate[] }>;
    },
  });

  const toggleCandidate = (id: string) => {
    setSelectedCandidates((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/elections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          startDate: new Date(data.startDate).toISOString(),
          endDate: new Date(data.endDate).toISOString(),
          candidateIds: selectedCandidates,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create election");
      }
      const { election } = await res.json();
      toast.success("Election created successfully!");
      router.push(`/admin/elections/${election.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create election");
    } finally {
      setIsSubmitting(false);
    }
  };

  const electionTypes = [
    "PRESIDENTIAL","PARLIAMENTARY","MUNICIPAL","SENATE","CORPORATE","STUDENT","OTHER"
  ];

  const inputCls = "w-full bg-[#060b14] border border-slate-700/50 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all";
  const labelCls = "block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider";
  const errorCls = "mt-1 text-xs text-red-400";

  return (
    <div className="p-6 max-w-4xl space-y-8">
      <div>
        <div className="text-xs font-mono text-slate-500 mb-1">Admin / Elections /</div>
        <h1 className="text-2xl font-bold text-white font-mono">Create New Election</h1>
        <p className="text-sm text-slate-400 mt-1">Configure and launch a new election</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-[#0d1421] border border-slate-700/30 rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-mono text-cyan-400 uppercase tracking-wider border-b border-slate-700/50 pb-3">
            Basic Information
          </h2>

          <div>
            <label className={labelCls}>Election Title *</label>
            <input {...register("title")} placeholder="e.g. 2026 Presidential Election" className={inputCls} />
            {errors.title && <p className={errorCls}>{errors.title.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="Brief description of the election..."
              className={`${inputCls} resize-none`}
            />
          </div>

          <div>
            <label className={labelCls}>Election Type *</label>
            <select {...register("type")} className={`${inputCls} cursor-pointer`}>
              {electionTypes.map((t) => (
                <option key={t} value={t} className="bg-[#0d1421]">{t}</option>
              ))}
            </select>
            {errors.type && <p className={errorCls}>{errors.type.message}</p>}
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-[#0d1421] border border-slate-700/30 rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-mono text-cyan-400 uppercase tracking-wider border-b border-slate-700/50 pb-3">
            Schedule
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Start Date & Time *</label>
              <input
                type="datetime-local"
                {...register("startDate")}
                className={`${inputCls} [color-scheme:dark]`}
              />
              {errors.startDate && <p className={errorCls}>{errors.startDate.message}</p>}
            </div>
            <div>
              <label className={labelCls}>End Date & Time *</label>
              <input
                type="datetime-local"
                {...register("endDate")}
                className={`${inputCls} [color-scheme:dark]`}
              />
              {errors.endDate && <p className={errorCls}>{errors.endDate.message}</p>}
            </div>
          </div>
        </div>

        {/* Candidates */}
        <div className="bg-[#0d1421] border border-slate-700/30 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
            <h2 className="text-sm font-mono text-cyan-400 uppercase tracking-wider">
              Candidates
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              {selectedCandidates.length} selected
            </span>
          </div>

          {!candidatesData?.candidates?.length ? (
            <p className="text-sm text-slate-500 text-center py-4">No approved candidates available</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              {candidatesData.candidates.map((c) => {
                const isSelected = selectedCandidates.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => toggleCandidate(c.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? "border-cyan-500/50 bg-cyan-500/10"
                        : "border-slate-700/30 hover:border-slate-600/50 bg-[#060b14]"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center border transition-all flex-shrink-0 ${
                        isSelected ? "bg-cyan-500 border-cyan-500" : "border-slate-600"
                      }`}
                    >
                      {isSelected && <span className="text-xs text-white font-bold">✓</span>}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-white font-medium truncate">{c.user.name}</div>
                      {c.party && (
                        <span
                          className="text-xs font-mono px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: `${c.party.color}22`, color: c.party.color }}
                        >
                          {c.party.abbreviation}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 text-sm font-mono text-slate-400 border border-slate-700/50 rounded-lg hover:border-slate-500 hover:text-white transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-mono bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />}
            {isSubmitting ? "Creating..." : "Create Election →"}
          </button>
        </div>
      </form>
    </div>
  );
}