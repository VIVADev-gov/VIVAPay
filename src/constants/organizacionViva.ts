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
};

export type UnidadOrganizacional = {
  id: string;
  name: string;
  tipo: OrganizacionTipo;
  subareas?: SubareaOrganizacional[];
};

export const UNIDADES_ORGANIZACIONALES: UnidadOrganizacional[] = [
  {
    id: "dir-negocios",
    name: "Dirección de Negocios",
    tipo: ORGANIZACION_TIPO.DIRECCION,
    subareas: [
      { id: "proc-contratos", name: "Proceso de contratos" },
      { id: "proc-cartera", name: "Proceso de cartera" },
    ],
  },
  {
    id: "dir-planeacion",
    name: "Dirección de Planeación",
    tipo: ORGANIZACION_TIPO.DIRECCION,
    subareas: [
      { id: "proc-proyectos", name: "Proceso de proyectos" },
      { id: "proc-seguimiento", name: "Proceso de seguimiento" },
    ],
  },
  {
    id: "dir-vivienda",
    name: "Dirección de Vivienda y Hábitat",
    tipo: ORGANIZACION_TIPO.DIRECCION,
    subareas: [
      { id: "proc-ejecucion", name: "Proceso de ejecución" },
      { id: "proc-interventoria", name: "Proceso de interventoría" },
    ],
  },
  {
    id: "jef-juridica",
    name: "Jefatura Jurídica",
    tipo: ORGANIZACION_TIPO.JEFATURA,
  },
  {
    id: "jef-bienes-servicios",
    name: "Jefatura de Bienes y Servicios",
    tipo: ORGANIZACION_TIPO.JEFATURA,
  },
  {
    id: "jef-talento-humano",
    name: "Jefatura de Talento Humano",
    tipo: ORGANIZACION_TIPO.JEFATURA,
  },
  {
    id: "jef-proyectos",
    name: "Jefatura de Proyectos",
    tipo: ORGANIZACION_TIPO.JEFATURA,
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

export function unidadRequiereSubarea(unidadId: string) {
  const unidad = getUnidadOrganizacional(unidadId);
  return unidad?.tipo === ORGANIZACION_TIPO.DIRECCION;
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
      message: "Las jefaturas no requieren subárea o proceso",
    };
  }

  return { ok: true };
}

export function formatOrganizacionDisplay(input: {
  organizationalUnitName: string;
  organizationalUnitType: OrganizacionTipo;
  subareaName?: string | null;
}) {
  if (
    input.organizationalUnitType === ORGANIZACION_TIPO.DIRECCION &&
    input.subareaName
  ) {
    return `${input.organizationalUnitName} · ${input.subareaName}`;
  }
  return input.organizationalUnitName;
}
