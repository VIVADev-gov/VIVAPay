"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import ActionButton from "@/components/buttons/ActionButton";
import FormField from "@/components/forms/FormField";
import Logo from "@/components/logo/Logo";
import { Loader } from "@/components/loaders/loader";
import { useResetPasswordMutation } from "@/hooks/api/useAuth";
import { getApiErrorMessage } from "@/lib/api-error";
import { useUiStore } from "@/store/ui/ui-store";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const resetPasswordMutation = useResetPasswordMutation();
  const showToast = useUiStore((s) => s.showToast);
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [completed, setCompleted] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      showToast({
        message: "Enlace de restablecimiento inválido. Falta el token.",
        variant: "error",
        autoClose: 6000,
      });
      return;
    }

    if (password !== confirmPassword) {
      showToast({
        message: "Las contraseñas no coinciden",
        variant: "warning",
        autoClose: 5000,
      });
      return;
    }

    try {
      const result = await resetPasswordMutation.mutateAsync({
        token,
        password,
        confirmPassword,
      });
      setCompleted(true);
      showToast({
        message: result.message,
        variant: "success",
        autoClose: 5000,
      });
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error, "No se pudo restablecer la contraseña"),
        variant: "error",
        autoClose: 6000,
      });
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        <h1 className="mb-3 text-2xl font-bold text-destructive">
          Enlace inválido
        </h1>
        <p className="mb-6 text-sm leading-6 text-muted-foreground">
          El enlace de restablecimiento no es válido. Solicita uno nuevo desde
          la pantalla de inicio de sesión.
        </p>
        <ActionButton
          label="Solicitar nuevo enlace"
          variant="primary"
          className="w-full"
          onClick={() => router.push("/auth/forgot-password")}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
      <h1 className="mb-2 text-2xl font-bold text-foreground">
        Nueva contraseña
      </h1>
      <p className="mb-6 text-sm leading-6 text-muted-foreground">
        Define una nueva contraseña para tu cuenta institucional.
      </p>

      {completed ? (
        <div className="grid gap-4">
          <p className="rounded-2xl bg-primary/10 px-4 py-3 text-sm leading-6 text-foreground">
            Contraseña actualizada. Ya puedes iniciar sesión.
          </p>
          <ActionButton
            label="Ir a iniciar sesión"
            variant="primary"
            className="w-full"
            onClick={() => router.push("/auth/login")}
          />
        </div>
      ) : (
        <form onSubmit={(event) => void handleSubmit(event)} className="grid gap-4">
          <FormField
            label="Nueva contraseña"
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mínimo 8 caracteres"
            required
            floatingLabel
          />
          <FormField
            label="Confirmar contraseña"
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repita su contraseña"
            required
            floatingLabel
          />
          <ActionButton
            type="submit"
            label="Guardar contraseña"
            variant="primary"
            className="w-full"
            loading={resetPasswordMutation.isPending}
            loaderLabel="Guardando"
          />
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/auth/login" className="font-semibold text-primary hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-10">
      <div className="mb-8">
        <Logo size="default" variant="default" alt="Vivapay" />
      </div>

      <Suspense
        fallback={
          <div className="flex flex-col items-center gap-4 py-6">
            <Loader size="md" label="Cargando" />
          </div>
        }
      >
        <ResetPasswordContent />
      </Suspense>
    </main>
  );
}
