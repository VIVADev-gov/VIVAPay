"use client";

import { useState } from "react";
import ActionButton from "@/components/buttons/ActionButton";
import FileUpload from "@/components/forms/FileUpload";
import { useUploadSignatureMutation } from "@/hooks/api/useProfile";
import type { AuthUser } from "@/store/auth/auth.storage";

type ProfileSignatureSectionProps = {
  user: AuthUser;
};

export default function ProfileSignatureSection({
  user,
}: ProfileSignatureSectionProps) {
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const uploadSignature = useUploadSignatureMutation();

  const handleSaveSignature = async () => {
    if (!signatureFile) return;
    await uploadSignature.mutateAsync(signatureFile);
    setSignatureFile(null);
  };

  return (
    <section className="overflow-hidden rounded-4xl border border-border/80 bg-linear-to-br from-card via-background to-primary/5 p-6 shadow-sm md:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
        Firma digital
      </p>
      <h3 className="mt-2 text-xl font-black text-foreground">
        Firma para cuentas de cobro
      </h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        Sube una imagen de tu firma (PNG, JPG o WEBP con fondo transparente de
        preferencia). Se usará al enviar tus cuentas de cobro.
      </p>

      {user.signaturePath ? (
        <div className="mt-5 rounded-3xl border border-border/70 bg-background/80 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Firma actual
          </p>
          <div className="flex min-h-24 items-center justify-center rounded-2xl bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.signaturePath}
              alt="Firma del contratista"
              className="max-h-28 max-w-full object-contain"
            />
          </div>
        </div>
      ) : (
        <p className="mt-5 rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          Aún no has subido tu firma. Es obligatoria para enviar cuentas de cobro.
        </p>
      )}

      <div className="mt-5 grid gap-4">
        <FileUpload
          id="profile-signature"
          name="signature"
          label={user.signaturePath ? "Reemplazar firma" : "Subir firma"}
          accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
          maxSizeMB={2}
          disabled={uploadSignature.isPending}
          currentFileName={signatureFile?.name}
          onChange={setSignatureFile}
        />

        <div className="flex justify-end">
          <ActionButton
            type="button"
            variant="primary"
            label={user.signaturePath ? "Actualizar firma" : "Guardar firma"}
            loading={uploadSignature.isPending}
            disabled={!signatureFile}
            onClick={() => void handleSaveSignature()}
          />
        </div>
      </div>
    </section>
  );
}
