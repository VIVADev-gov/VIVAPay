"use client";

import ActionButton from "@/components/buttons/ActionButton";
import { DashboardHero } from "@/components/dashboard";
import { ModuleCreateButton } from "@/components/contratos";
import FormField from "@/components/forms/FormField";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import EmptyState from "@/components/ui/EmptyState";
import {
  getOrganizacionLabelPorRol,
  getUnidadOrganizacional,
  getUnidadesPermitidasPorRol,
  requiresSubareaForRoleAndUnit,
} from "@/constants/organizacionViva";
import ProfileSignatureSection from "@/components/profile/ProfileSignatureSection";
import { USER_ROLES } from "@/constants/userRoles";
import { normalizeUserRole } from "@/lib/auth/roles";
import { useProfileQuery, useUpdateProfileMutation } from "@/hooks/api/useProfile";
import { useProfileStore } from "@/store/profile/profile.store";
import { useUiStore } from "@/store/ui/ui-store";
import { sanitizeProfileField } from "@/utils/inputSanitizers";

export default function PerfilPage() {
  const profileQuery = useProfileQuery();
  const user = useProfileStore((s) => s.user);
  const form = useProfileStore((s) => s.form);
  const isLoading = useProfileStore((s) => s.isLoading);
  const isSaving = useProfileStore((s) => s.isSaving);
  const error = useProfileStore((s) => s.error);
  const successMessage = useProfileStore((s) => s.successMessage);
  const setProfileForm = useProfileStore((s) => s.setProfileForm);
  const updateProfile = useUpdateProfileMutation();
  const showToast = useUiStore((s) => s.showToast);

  const userRole = normalizeUserRole(user?.role);
  const requiresSignature = [
    USER_ROLES.CONTRATISTA,
    USER_ROLES.SUPERVISOR,
    USER_ROLES.JEFE,
    USER_ROLES.DIRECTOR,
  ].includes(userRole);
  const organizationalUnitLabel = getOrganizacionLabelPorRol(userRole);
  const organizationalUnitOptions = getUnidadesPermitidasPorRol(userRole).map(
    (unidad) => ({
      value: unidad.id,
      label: unidad.name,
    })
  );

  const selectedOrganizationalUnit = getUnidadOrganizacional(
    form.organizationalUnitId
  );
  const subareaOptions =
    selectedOrganizationalUnit &&
    requiresSubareaForRoleAndUnit(userRole, selectedOrganizationalUnit.id)
      ? (selectedOrganizationalUnit.subareas ?? []).map((subarea) => ({
          value: subarea.id,
          label: subarea.name,
        }))
      : [];
  const requiresSubarea =
    selectedOrganizationalUnit &&
    requiresSubareaForRoleAndUnit(userRole, selectedOrganizationalUnit.id);

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = event.target;
    const sanitizedValue = sanitizeProfileField(name, value);
    if (name === "organizationalUnitId") {
      setProfileForm({ organizationalUnitId: sanitizedValue, subareaId: "" });
      return;
    }
    setProfileForm({ [name]: sanitizedValue });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await updateProfile.mutateAsync({
      name: form.name,
      phone: form.phone,
      organizationalUnitId: form.organizationalUnitId,
      subareaId: requiresSubarea ? form.subareaId : null,
    });
  };

  const handleAdvanced = () => {
    showToast({
      message: "La gestión avanzada de perfil estará disponible próximamente.",
      variant: "info",
    });
  };

  return (
    <DashboardLayout title="Perfil">
      <section className="grid gap-8">
        <DashboardHero
          eyebrow="Perfil de funcionario"
          title="Actualiza tu información"
          description="Puedes editar tus datos de contacto y tu dirección o jefatura. El correo institucional, documento y rol permanecen bloqueados."
        />

        <div className="flex justify-end">
          <ModuleCreateButton
            label="Opciones avanzadas"
            onClick={handleAdvanced}
          />
        </div>

        {isLoading || !user ? (
          <section className="overflow-hidden rounded-4xl border border-border/80 bg-card p-6 shadow-sm">
            <EmptyState
              message="Cargando perfil"
              description="Estamos obteniendo tu información."
              showRefreshButton={false}
              icon="refresh"
            />
          </section>
        ) : error && !user.name ? (
          <EmptyState
            message="No se pudo cargar el perfil"
            description={error}
            variant="error"
            icon="alert"
            onRefresh={() => profileQuery.refetch()}
          />
        ) : (
          <>
          {requiresSignature ? <ProfileSignatureSection user={user} /> : null}

          <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-4xl border border-border/80 bg-linear-to-br from-card via-background to-muted/20 p-6 shadow-sm md:p-8"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Datos editables
            </p>
            <h3 className="mt-2 text-xl font-black text-foreground">
              Información personal
            </h3>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <FormField
                label="Correo institucional"
                value={user.email}
                disabled
              />
              <FormField
                label="Documento de identidad"
                value={user.documentId ?? ""}
                disabled
              />
              <FormField
                label="Rol"
                value={user.role ?? "CONTRATISTA"}
                disabled
              />
              <FormField
                label="Nombre completo"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
              <FormField
                label="Teléfono"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                inputMode="tel"
                required
              />
              <FormField
                label={organizationalUnitLabel}
                name="organizationalUnitId"
                type="select"
                value={form.organizationalUnitId}
                onChange={handleChange}
                options={organizationalUnitOptions}
                required
                selectAllowEmpty={false}
                className="md:col-span-2"
              />
              {requiresSubarea ? (
                <FormField
                  label="Subárea o proceso"
                  name="subareaId"
                  type="select"
                  value={form.subareaId}
                  onChange={handleChange}
                  options={subareaOptions}
                  required
                  selectAllowEmpty={false}
                  className="md:col-span-2"
                />
              ) : null}
            </div>

            {successMessage ? (
              <p className="mt-5 rounded-2xl bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
                {successMessage}
              </p>
            ) : null}

            <div className="mt-6 flex justify-end">
              <ActionButton
                type="submit"
                variant="primary"
                label="Guardar cambios"
                loading={isSaving}
                loaderLabel="Guardando"
              />
            </div>
          </form>
          </>
        )}
      </section>
    </DashboardLayout>
  );
}
