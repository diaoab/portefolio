"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { usePendingUploads } from "@/lib/upload-client";
import type { FormState } from "@/lib/utils";

export function SubmitButton({
  children,
  className = "btn-primary",
  pendingText,
  confirm,
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  confirm?: string;
}) {
  const { pending } = useFormStatus();
  // Tant qu'un fichier est en cours d'envoi, on ne peut pas enregistrer (il manquerait)
  const uploading = usePendingUploads() > 0;
  return (
    <button
      type="submit"
      disabled={pending || uploading}
      className={className}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {(pending || uploading) && <Loader2 className="size-4 animate-spin" />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (!state?.error && !state?.message) return null;
  return (
    <p
      role="status"
      className={`rounded-xl border px-3.5 py-2.5 text-sm ${
        state.error
          ? "border-red-500/30 bg-red-500/10 text-red-300"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      }`}
    >
      {state.error ?? state.message}
    </p>
  );
}
