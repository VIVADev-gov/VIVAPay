import Image from "next/image";
import Link from "next/link";

const highlights = [
  "Gestión de cuentas de cobro por contrato",
  "Flujo de revisión, firma y envío al CAD",
  "Formularios oficiales generados automáticamente",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-background via-muted/40 to-background px-4 py-8 md:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden rounded-4xl border border-border bg-primary p-8 text-primary-foreground shadow-2xl md:p-10">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-white/10" />

          <div className="relative z-10 flex min-h-112 flex-col justify-between">
            <div>
              <div className="mb-10 inline-flex rounded-2xl bg-white/95 p-3 shadow-lg">
                <Image
                  src="/logoviva.png"
                  alt="Vivapay"
                  width={120}
                  height={90}
                  priority
                  className="object-contain"
                />
              </div>

              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary-foreground/75">
                Empresa de Vivienda de Antioquia
              </p>
              <h1 className="max-w-xl text-4xl font-black leading-tight md:text-5xl">
                Vivapay
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-primary-foreground/85">
                Plataforma institucional para que contratistas, supervisores y
                directores gestionen cuentas de cobro, documentos y formularios
                del proceso de pago de manera centralizada y segura.
              </p>
            </div>

            <div className="mt-10 space-y-3">
              {highlights.map((item) => (
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
              Acceso a la plataforma
            </p>
            <h2 className="text-3xl font-black text-foreground">
              Comienza aquí
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Si ya tienes cuenta institucional, inicia sesión con tu correo
              @viva.gov.co. Si eres nuevo en Vivapay, crea tu cuenta y confirma
              tu correo antes de ingresar.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/auth/login"
              className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-bold text-primary-foreground shadow-md transition hover:bg-ring"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex w-full items-center justify-center rounded-full border border-primary/25 bg-primary/10 px-6 py-3 text-base font-bold text-primary transition hover:border-primary/40 hover:bg-primary/15"
            >
              Crear cuenta
            </Link>
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
            Solo para funcionarios y contratistas de Viva con correo
            institucional @viva.gov.co.
          </p>
        </section>
      </div>
    </div>
  );
}
