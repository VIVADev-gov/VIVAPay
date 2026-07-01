import { USER_ROLES, type UserRole } from "@/constants/userRoles";

export const ORGANIZACION_TIPO = {
  DIRECCION: "DIRECCION",
  JEFATURA: "JEFATURA",
} as const;

export type OrganizacionTipo =
  (typeof ORGANIZACION_TIPO)[keyof typeof ORGANIZACION_TIPO];

export type SubareaOrganizacional = {
  id: string;
  name: string;
  /** Si es false, el flujo de cuentas de cobro va directo al director (sin supervisor). */
  hasSupervisor?: boolean;
};

export type UnidadOrganizacional = {
  id: string;
  name: string;
  tipo: OrganizacionTipo;
  subareas?: SubareaOrganizacional[];
};

export const UNIDADES_ORGANIZACIONALES: UnidadOrganizacional[] = [
  {
    id: "dir-admin-financiera",
    name: "Dirección Administrativa y Financiera",
    tipo: ORGANIZACION_TIPO.DIRECCION,
    subareas: [
      { id: "proc-gestion-financiera", name: "Gestión Financiera" },
      { id: "proc-gestion-bienes-servicios", name: "Gestión de Bienes y Servicios" },
      { id: "proc-gestion-documental", name: "Gestión Documental", hasSupervisor: false },
      {
        id: "proc-gestion-informacion-tecnologia",
        name: "Gestión de Información y Tecnología",
      },
    ],
  },
  {
    id: "dir-control-interno",
    name: "Dirección de Control Interno",
    tipo: ORGANIZACION_TIPO.DIRECCION,
    subareas: [
      {
        id: "proc-evaluacion-independiente",
        name: "Evaluación Independiente",
        hasSupervisor: false,
      },
    ],
  },
  {
    id: "dir-planeacion",
    name: "Dirección de Planeación",
    tipo: ORGANIZACION_TIPO.DIRECCION,
    subareas: [
      { id: "proc-planeacion-estrategica", name: "Planeación Estratégica" },
      { id: "proc-gestion-organizacional", name: "Gestión Organizacional" },
    ],
  },
  {
    id: "dir-proyectos",
    name: "Dirección de Proyectos",
    tipo: ORGANIZACION_TIPO.DIRECCION,
    subareas: [{ id: "proc-gestion-proyectos", name: "Gestión de Proyectos" }],
  },
  {
    id: "dir-vivienda-habitat",
    name: "Dirección de Vivienda y Hábitat",
    tipo: ORGANIZACION_TIPO.DIRECCION,
    subareas: [
      {
        id: "proc-gestion-vivienda-habitat",
        name: "Gestión de Vivienda y Hábitat",
      },
      { id: "proc-gestion-sociocultural", name: "Gestión Sociocultural" },
    ],
  },
  {
    id: "dir-juridica-control-disciplinario",
    name: "Dirección Jurídica y de Control Interno Disciplinario",
    tipo: ORGANIZACION_TIPO.DIRECCION,
    subareas: [
      {
        id: "proc-gestion-juridica-contractual",
        name: "Gestión Jurídica y Contractual",
      },
      {
        id: "proc-control-interno-disciplinario",
        name: "Control Interno Disciplinario",
      },
    ],
  },
  {
    id: "jef-comunicaciones",
    name: "Jefatura de Comunicaciones",
    tipo: ORGANIZACION_TIPO.JEFATURA,
    subareas: [
      { id: "proc-gestion-comunicaciones", name: "Gestión de las Comunicaciones" },
    ],
  },
  {
    id: "jef-talento-humano",
    name: "Jefatura de Talento Humano",
    tipo: ORGANIZACION_TIPO.JEFATURA,
    subareas: [
      { id: "proc-gestion-talento-humano", name: "Gestión del Talento Humano" },
      {
        id: "proc-seguridad-salud-trabajo",
        name: "Seguridad y Salud en el Trabajo",
      },
    ],
  },
  {
    id: "jef-titulacion",
    name: "Jefatura de Titulación",
    tipo: ORGANIZACION_TIPO.JEFATURA,
    subareas: [{ id: "proc-gestion-titulacion", name: "Gestión de Titulación" }],
  },
  {
    id: "jef-unidad-negocios",
    name: "Jefatura Unidad de Negocios",
    tipo: ORGANIZACION_TIPO.JEFATURA,
    subareas: [
      { id: "proc-banco-materiales", name: "Banco de Materiales" },
      { id: "proc-fondo-rotatorio-credito", name: "Fondo Rotatorio de Crédito" },
    ],
  },
];

const unidadById = new Map(
  UNIDADES_ORGANIZACIONALES.map((unidad) => [unidad.id, unidad])
);

export function getUnidadOrganizacional(id: string) {
  return unidadById.get(id);
}

export function getSubareaOrganizacional(unidadId: string, subareaId: string) {
  const unidad = getUnidadOrganizacional(unidadId);
  return unidad?.subareas?.find((subarea) => subarea.id === subareaId);
}

/** Por defecto true si la subárea no declara lo contrario. */
export function subareaHasSupervisor(
  unidadId: string,
  subareaId: string | null | undefined
): boolean {
  if (!subareaId) return true;
  const subarea = getSubareaOrganizacional(unidadId, subareaId);
  return subarea?.hasSupervisor !== false;
}

export function contractorUsesSupervisorWorkflow(contractor: {
  organizationalUnitId: string;
  organizationalUnitType: string;
  subareaId?: string | null;
}): boolean {
  if (contractor.organizationalUnitType !== ORGANIZACION_TIPO.DIRECCION) {
    return false;
  }
  return subareaHasSupervisor(
    contractor.organizationalUnitId,
    contractor.subareaId
  );
}

export function unidadRequiereSubarea(unidadId: string) {
  const unidad = getUnidadOrganizacional(unidadId);
  return (unidad?.subareas?.length ?? 0) > 0;
}

/** Solo contratista y supervisor operan a nivel de subárea/proceso. */
export function rolRequiereSubarea(role: UserRole) {
  return (
    role === USER_ROLES.CONTRATISTA || role === USER_ROLES.SUPERVISOR
  );
}

export function requiresSubareaForRoleAndUnit(role: UserRole, unidadId: string) {
  return rolRequiereSubarea(role) && unidadRequiereSubarea(unidadId);
}

export function getUnidadesPermitidasPorRol(role: UserRole) {
  switch (role) {
    case USER_ROLES.JEFE:
      return UNIDADES_ORGANIZACIONALES.filter(
        (unidad) => unidad.tipo === ORGANIZACION_TIPO.JEFATURA
      );
    case USER_ROLES.DIRECTOR:
    case USER_ROLES.SUPERVISOR:
      return UNIDADES_ORGANIZACIONALES.filter(
        (unidad) => unidad.tipo === ORGANIZACION_TIPO.DIRECCION
      );
    case USER_ROLES.CONTRATISTA:
    default:
      return UNIDADES_ORGANIZACIONALES;
  }
}

export function unidadPermitidaParaRol(unidadId: string, role: UserRole) {
  return getUnidadesPermitidasPorRol(role).some((unidad) => unidad.id === unidadId);
}

export function getOrganizacionLabelPorRol(role: UserRole) {
  switch (role) {
    case USER_ROLES.JEFE:
      return "Jefatura";
    case USER_ROLES.DIRECTOR:
    case USER_ROLES.SUPERVISOR:
      return "Dirección";
    default:
      return "Dirección o jefatura";
  }
}

type OrganizacionValidationInput = {
  role: UserRole;
  organizationalUnitId: string;
  subareaId?: string | null;
};

export function validateOrganizacionParaRol(
  input: OrganizacionValidationInput
): { ok: true } | { ok: false; path: "organizationalUnitId" | "subareaId"; message: string } {
  const unidad = getUnidadOrganizacional(input.organizationalUnitId);
  if (!unidad) {
    return {
      ok: false,
      path: "organizationalUnitId",
      message: `Seleccione una ${getOrganizacionLabelPorRol(input.role).toLowerCase()} válida`,
    };
  }

  if (!unidadPermitidaParaRol(unidad.id, input.role)) {
    const label = getOrganizacionLabelPorRol(input.role).toLowerCase();
    return {
      ok: false,
      path: "organizationalUnitId",
      message: `El rol seleccionado solo puede asociarse a una ${label}`,
    };
  }

  if (!rolRequiereSubarea(input.role)) {
    if (input.subareaId) {
      return {
        ok: false,
        path: "subareaId",
        message: "Director y jefe no deben seleccionar subárea o proceso",
      };
    }
    return { ok: true };
  }

  if (unidadRequiereSubarea(unidad.id)) {
    if (!input.subareaId) {
      return {
        ok: false,
        path: "subareaId",
        message: "Seleccione la subárea o proceso",
      };
    }

    const subarea = getSubareaOrganizacional(unidad.id, input.subareaId);
    if (!subarea) {
      return {
        ok: false,
        path: "subareaId",
        message: "Seleccione una subárea o proceso válida",
      };
    }

    return { ok: true };
  }

  if (input.subareaId) {
    return {
      ok: false,
      path: "subareaId",
      message: "Esta unidad organizacional no requiere subárea o proceso",
    };
  }

  return { ok: true };
}

export function formatOrganizacionDisplay(input: {
  organizationalUnitName: string;
  organizationalUnitType: OrganizacionTipo;
  subareaName?: string | null;
}) {
  if (input.subareaName) {
    return `${input.organizationalUnitName} · ${input.subareaName}`;
  }
  return input.organizationalUnitName;
}
