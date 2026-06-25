"use client";

import Link from "next/link";
import { useState } from "react";
import ActionButton from "@/components/buttons/ActionButton";
import FormField from "@/components/forms/FormField";
import Logo from "@/components/logo/Logo";
import { PASSWORD_RESET_GENERIC_MESSAGE } from "@/app/api/auth/_shared/auth.constants";
import { useForgotPasswordMutation } from "@/hooks/api/useAuth";
import { getApiErrorMessage } from "@/lib/api-error";
import { useUiStore } from "@/store/ui/ui-store";

export default function ForgotPasswordPage() {
  const forgotPasswordMutation = useForgotPasswordMutation();
  const showToast = useUiStore((s) => s.showToast);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim().toLowerCase().endsWith("@viva.gov.co")) {
      showToast({
        message: "El correo debe ser del dominio @viva.gov.co",
        variant: "warning",
        autoClose: 5000,
      });
      return;
    }

    try {
      await forgotPasswordMutation.mutateAsync({
        email: email.trim(),
      });
      setSubmitted(true);
    } catch (error) {
      showToast({
        message: getApiErrorMessage(
          error,
          "No se pudo procesar la solicitud de restablecimiento"
        ),
        variant: "error",
        autoClose: 6000,
      });
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-10">
      <div className="mb-8">
        <Logo size="default" variant="default" alt="Vivapay" />
      </div>

      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Restablecer contraseña
        </h1>
        <p className="mb-6 text-sm leading-6 text-muted-foreground">
          Ingresa tu correo institucional @viva.gov.co y te enviaremos un enlace
          para definir una nueva contraseña.
        </p>

        {submitted ? (
          <div className="grid gap-4">
            <p className="rounded-2xl bg-primary/10 px-4 py-3 text-sm leading-6 text-foreground">
              {PASSWORD_RESET_GENERIC_MESSAGE}
            </p>
            <ActionButton
              label="Volver a iniciar sesión"
              variant="primary"
              className="w-full"
              onClick={() => {
                window.location.href = "/auth/login";
              }}
            />
          </div>
        ) : (
          <form onSubmit={(event) => void handleSubmit(event)} className="grid gap-4">
            <FormField
              label="Correo institucional"
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="usuario@viva.gov.co"
              required
              floatingLabel
            />
            <ActionButton
              type="submit"
              label="Enviar enlace"
              variant="primary"
              className="w-full"
              loading={forgotPasswordMutation.isPending}
              loaderLabel="Enviando"
            />
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/auth/login" className="font-semibold text-primary hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
