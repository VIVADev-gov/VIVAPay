"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import ActionButton from "@/components/buttons/ActionButton";
import Logo from "@/components/logo/Logo";
import { Loader } from "@/components/loaders/loader";
import { useVerifyEmailMutation } from "@/hooks/api/useAuth";
import { getApiErrorMessage } from "@/lib/api-error";

const REDIRECT_DELAY_MS = 4000;

function VerificationEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const verifyMutation = useVerifyEmailMutation();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Enlace de verificación inválido. Falta el token.");
      return;
    }

    verifyMutation.mutate(token, {
      onSuccess: (res) => {
        setStatus("success");
        setMessage(res.message);
      },
      onError: (err) => {
        setStatus("error");
        setMessage(getApiErrorMessage(err, "No se pudo verificar el correo"));
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (status !== "success") return;
    const timer = window.setTimeout(() => router.push("/auth/login"), REDIRECT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [status, router]);

  const isLoading = verifyMutation.isPending || status === "idle";

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-10">
      <div className="mb-8">
        <Logo size="default" variant="default" alt="Vivapay" />
      </div>

      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <Loader size="md" label="Verificando correo" />
            <p className="text-muted-foreground">Verificando tu correo…</p>
          </div>
        ) : status === "success" ? (
          <>
            <h1 className="mb-3 text-2xl font-bold text-foreground">
              Correo verificado
            </h1>
            <p className="mb-6 text-muted-foreground">{message}</p>
            <ActionButton
              label="Ir a iniciar sesión"
              variant="primary"
              className="w-full"
              onClick={() => router.push("/auth/login")}
            />
            <p className="mt-4 text-xs text-muted-foreground">
              Serás redirigido automáticamente en unos segundos…
            </p>
          </>
        ) : (
          <>
            <h1 className="mb-3 text-2xl font-bold text-destructive">
              Verificación fallida
            </h1>
            <p className="mb-6 text-muted-foreground">{message}</p>
            <ActionButton
              label="Volver al registro"
              variant="outline"
              className="w-full"
              onClick={() => router.push("/auth/register")}
            />
          </>
        )}
      </div>
    </main>
  );
}

export default function VerificationEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <Loader size="md" />
        </main>
      }
    >
      <VerificationEmailContent />
    </Suspense>
  );
}
