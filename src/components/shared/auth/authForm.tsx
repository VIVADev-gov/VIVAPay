"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ActionButton from "@/components/buttons/ActionButton";
import FormField from "@/components/forms/FormField";
import Logo from "@/components/logo/Logo";
import { AUTH_ERROR_CODES } from "@/app/api/auth/_shared/auth.errors";
import {
  ORGANIZACION_TIPO,
  UNIDADES_ORGANIZACIONALES,
  getUnidadOrganizacional,
} from "@/constants/organizacionViva";
import { USER_ROLE_OPTIONS, type UserRole } from "@/constants/userRoles";
import { useLoginMutation, useRegisterMutation } from "@/hooks/api/useAuth";
import { getApiErrorDetails } from "@/lib/api-error";
import { getDashboardPathForRole } from "@/lib/auth/roles";
import { useAuthStore } from "@/store/auth/auth.store";
import { useUiStore } from "@/store/ui/ui-store";

export type AuthFormMode = "login" | "register";

type AuthFormProps = {
  mode: AuthFormMode;
};

const emptyRegister = {
  email: "",
  password: "",
  confirmPassword: "",
  name: "",
  documentId: "",
  phone: "",
  role: "",
  organizationalUnitId: "",
  subareaId: "",
};

const emptyLogin = {
  identifier: "",
  password: "",
};

const roleOptions = USER_ROLE_OPTIONS.map((role) => ({
  value: role.value,
  label: role.label,
}));

const organizationalUnitOptions = UNIDADES_ORGANIZACIONALES.map((unidad) => ({
  value: unidad.id,
  label: unidad.name,
}));

const registerHighlights = [
  "Acceso seguro con tu correo institucional",
  "Validación de funcionario Viva",
  "Confirmación por correo antes del ingreso",
];

const loginHighlights = [
  "Acceso protegido con token de sesión",
  "Ingreso con correo institucional o documento",
  "Cuenta verificada antes de entrar",
];

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const showToast = useUiStore((s) => s.showToast);
  const setSession = useAuthStore((s) => s.setSession);

  const registerMutation = useRegisterMutation();
  const loginMutation = useLoginMutation();

  const [registerForm, setRegisterForm] = useState(emptyRegister);
  const [loginForm, setLoginForm] = useState(emptyLogin);

  const isRegister = mode === "register";
  const isRegisterPending = registerMutation.isPending;
  const isLoginPending = loginMutation.isPending;

  const handleRegisterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => {
      if (name === "organizationalUnitId") {
        return {
          ...prev,
          organizationalUnitId: value,
          subareaId: "",
        };
      }
      return { ...prev, [name]: value };
    });
  };

  const selectedOrganizationalUnit = getUnidadOrganizacional(
    registerForm.organizationalUnitId
  );
  const subareaOptions =
    selectedOrganizationalUnit?.tipo === ORGANIZACION_TIPO.DIRECCION
      ? (selectedOrganizationalUnit.subareas ?? []).map((subarea) => ({
          value: subarea.id,
          label: subarea.name,
        }))
      : [];
  const requiresSubarea =
    selectedOrganizationalUnit?.tipo === ORGANIZACION_TIPO.DIRECCION;

  const handleLoginChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateRegisterClient = (): boolean => {
    if (!registerForm.email.trim().toLowerCase().endsWith("@viva.gov.co")) {
      showToast({
        message: "El correo debe ser del dominio @viva.gov.co",
        variant: "warning",
        autoClose: 5000,
      });
      return false;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      showToast({
        message: "Las contraseñas no coinciden",
        variant: "warning",
        autoClose: 5000,
      });
      return false;
    }
    if (!registerForm.role) {
      showToast({
        message: "Seleccione su rol",
        variant: "warning",
        autoClose: 5000,
      });
      return false;
    }
    if (!registerForm.organizationalUnitId) {
      showToast({
        message: "Seleccione la dirección o jefatura",
        variant: "warning",
        autoClose: 5000,
      });
      return false;
    }
    if (requiresSubarea && !registerForm.subareaId) {
      showToast({
        message: "Seleccione la subárea o proceso",
        variant: "warning",
        autoClose: 5000,
      });
      return false;
    }
    return true;
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRegisterClient()) return;

    try {
      const result = await registerMutation.mutateAsync({
        email: registerForm.email.trim(),
        password: registerForm.password,
        name: registerForm.name.trim(),
        documentId: registerForm.documentId.trim(),
        phone: registerForm.phone.trim(),
        role: registerForm.role as UserRole,
        organizationalUnitId: registerForm.organizationalUnitId,
        subareaId: requiresSubarea ? registerForm.subareaId : undefined,
      });

      showToast({
        message: result.message,
        variant: "success",
        autoClose: 6000,
      });
      router.push("/auth/login");
    } catch (err) {
      const { message } = getApiErrorDetails(err, "No se pudo completar el registro");
      showToast({ message, variant: "error", autoClose: 5000 });
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { token, user } = await loginMutation.mutateAsync({
        identifier: loginForm.identifier.trim(),
        password: loginForm.password,
      });

      setSession(token, user);
      showToast({
        message: "Bienvenido",
        variant: "success",
        autoClose: 3000,
      });
      router.push(getDashboardPathForRole(user.role));
    } catch (err) {
      const { message, code } = getApiErrorDetails(err, "No se pudo iniciar sesión");

      if (code === AUTH_ERROR_CODES.USER_NOT_FOUND) {
        showToast({
          message,
          variant: "warning",
          autoClose: 8000,
        });
        return;
      }

      if (code === AUTH_ERROR_CODES.EMAIL_NOT_VERIFIED) {
        showToast({
          message,
          variant: "info",
          autoClose: 8000,
        });
        return;
      }

      showToast({ message, variant: "error", autoClose: 5000 });
    }
  };

  if (isRegister) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-linear-to-br from-background via-muted/40 to-background px-4 py-8 md:px-8">
        <div className="mx-auto grid min-h-[calc(100vh-8rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="relative overflow-hidden rounded-4xl border border-border bg-primary p-8 text-primary-foreground shadow-2xl md:p-10">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10" />
            <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-white/10" />

            <div className="relative z-10 flex min-h-112 flex-col justify-between">
              <div>
                <div className="mb-10 inline-flex rounded-2xl bg-white/95 p-3 shadow-lg">
                  <Logo size="default" variant="default" alt="Vivapay" />
                </div>

                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary-foreground/75">
                  Bienvenido a VIVAPAY
                </p>
                <h1 className="max-w-xl text-4xl font-black leading-tight md:text-5xl">
                  Crea tu cuenta institucional en minutos.
                </h1>
                <p className="mt-5 max-w-lg text-base leading-7 text-primary-foreground/85">
                  Registra tu cuenta institucional para acceder de forma segura
                  a los servicios internos de la plataforma.
                </p>
              </div>

              <div className="mt-10 space-y-3">
                {registerHighlights.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-primary">
                      ✓
                    </span>
                    <span className="text-sm font-medium text-primary-foreground/90">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-4xl border border-border bg-card/95 p-6 text-card-foreground shadow-2xl backdrop-blur md:p-8 lg:p-10">
            <div className="mb-8">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Registro de funcionario
              </p>
              <h2 className="text-3xl font-black text-foreground">
                Crear cuenta institucional
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Usa tu correo @viva.gov.co y completa tus datos de funcionario.
              </p>
            </div>

            <form
              onSubmit={handleRegisterSubmit}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
            <FormField
              label="Nombre completo"
              id="name"
              name="name"
              value={registerForm.name}
              onChange={handleRegisterChange}
              placeholder="Ej. Juan Pérez"
              className="md:col-span-2"
              required
              floatingLabel
            />
            <FormField
              label="Correo institucional"
              id="email"
              name="email"
              type="email"
              value={registerForm.email}
              onChange={handleRegisterChange}
              placeholder="usuario@viva.gov.co"
              className="md:col-span-2"
              required
              floatingLabel
            />
            <FormField
              label="Documento de identidad"
              id="documentId"
              name="documentId"
              value={registerForm.documentId}
              onChange={handleRegisterChange}
              placeholder="Ej. 1234567890"
              inputMode="numeric"
              required
              floatingLabel
            />
            <FormField
              label="Teléfono"
              id="phone"
              name="phone"
              type="tel"
              value={registerForm.phone}
              onChange={handleRegisterChange}
              placeholder="Ej. 3001234567"
              required
              floatingLabel
            />
            <FormField
              label="Rol"
              id="role"
              name="role"
              type="select"
              value={registerForm.role}
              onChange={handleRegisterChange}
              options={roleOptions}
              className="md:col-span-2"
              selectAllowEmpty={false}
              required
            />
            <FormField
              label="Dirección o jefatura"
              id="organizationalUnitId"
              name="organizationalUnitId"
              type="select"
              value={registerForm.organizationalUnitId}
              onChange={handleRegisterChange}
              options={organizationalUnitOptions}
              className="md:col-span-2"
              selectAllowEmpty={false}
              required
            />
            {requiresSubarea ? (
              <FormField
                label="Subárea o proceso"
                id="subareaId"
                name="subareaId"
                type="select"
                value={registerForm.subareaId}
                onChange={handleRegisterChange}
                options={subareaOptions}
                className="md:col-span-2"
                selectAllowEmpty={false}
                required
              />
            ) : null}
            <FormField
              label="Contraseña"
              id="password"
              name="password"
              type="password"
              value={registerForm.password}
              onChange={handleRegisterChange}
              placeholder="Mínimo 8 caracteres"
              required
              floatingLabel
            />
            <FormField
              label="Confirmar contraseña"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={registerForm.confirmPassword}
              onChange={handleRegisterChange}
              placeholder="Repita su contraseña"
              required
              floatingLabel
            />
            <ActionButton
              type="submit"
              label="Registrarse"
              variant="primary"
              className="mt-2 w-full md:col-span-2"
              loading={isRegisterPending}
              loaderLabel="Registrando"
            />
          </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <a href="/auth/login" className="font-semibold text-primary hover:underline">
                Iniciar sesión
              </a>
            </p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-linear-to-br from-background via-muted/40 to-background px-4 py-8 md:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-8rem)] w-full max-w-5xl items-center gap-8 lg:grid-cols-[1fr_0.9fr]">
        <section className="order-2 rounded-4xl border border-border bg-card/95 p-6 text-card-foreground shadow-2xl backdrop-blur md:p-8 lg:order-1 lg:p-10">
          <div className="mb-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Acceso institucional
            </p>
            <h1 className="text-3xl font-black text-foreground">
              Iniciar sesión
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Ingresa con tu correo @viva.gov.co o con tu documento de identidad.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
            <FormField
              label="Correo o documento"
              id="identifier"
              name="identifier"
              value={loginForm.identifier}
              onChange={handleLoginChange}
              placeholder="correo@viva.gov.co o documento"
              required
              floatingLabel
            />
            <FormField
              label="Contraseña"
              id="password"
              name="password"
              type="password"
              value={loginForm.password}
              onChange={handleLoginChange}
              placeholder="Su contraseña"
              required
              floatingLabel
            />
            <ActionButton
              type="submit"
              label="Iniciar sesión"
              variant="primary"
              className="mt-2 w-full"
              loading={isLoginPending}
              loaderLabel="Iniciando sesión"
            />
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <a
              href="/auth/register"
              className="font-semibold text-primary hover:underline"
            >
              Crear cuenta institucional
            </a>
          </p>
        </section>

        <section className="relative order-1 overflow-hidden rounded-4xl border border-border bg-primary p-8 text-primary-foreground shadow-2xl md:p-10 lg:order-2">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-white/10" />

          <div className="relative z-10 flex min-h-96 flex-col justify-between">
            <div>
              <div className="mb-10 inline-flex rounded-2xl bg-white/95 p-3 shadow-lg">
                <Logo size="default" variant="default" alt="Vivapay" />
              </div>

              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary-foreground/75">
                Bienvenido de nuevo
              </p>
              <h2 className="max-w-xl text-4xl font-black leading-tight md:text-5xl">
                Continúa gestionando tus servicios en VIVAPAY.
              </h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-primary-foreground/85">
                Accede de forma segura a la plataforma con tus credenciales
                institucionales.
              </p>
            </div>

            <div className="mt-10 space-y-3">
              {loginHighlights.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-primary">
                    ✓
                  </span>
                  <span className="text-sm font-medium text-primary-foreground/90">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
