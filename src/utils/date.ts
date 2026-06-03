const TZ_COLOMBIA = "America/Bogota";

export const normalizarFecha = (fecha: string): string => {
    const partes = fecha.split("/");
    const dia = partes[0].padStart(2, "0");
    const mes = partes[1].padStart(2, "0");
    const año = partes[2];
    return `${año}-${mes}-${dia}`; // Formato YYYY-MM-DD
};

/** Parsea fechas ISO, `Date`, timestamps de pg o cadenas tipo `Fri May 15 2026…`. */
export function parseToDate(value: unknown): Date | null {
    if (value == null) return null;
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }
    const s = String(value).trim();
    if (!s) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const d = new Date(`${s}T12:00:00`);
        return Number.isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
}

export function toIsoStringOrNull(value: unknown): string | null {
    const d = parseToDate(value);
    return d ? d.toISOString() : null;
}

/** Fecha de convenio / formularios: `YYYY-MM-DD`. */
export function formatConvenioFecha(value: unknown): string | null {
    const d = parseToDate(value);
    return d ? d.toISOString().slice(0, 10) : null;
}

export const formatDate = (dateString: string | Date) => {
    const d = parseToDate(dateString);
    if (!d) return "";
    return d.toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: TZ_COLOMBIA,
    });
};

/** Fecha y hora legibles para pantalla (ej. período de la cuenta de cobro). */
export function formatFechaHoraDisplay(value: unknown): string {
    const d = parseToDate(value);
    if (!d) {
        const s = value != null ? String(value).trim() : "";
        return s;
    }

    const raw = String(value).trim();
    const hasExplicitTime =
        value instanceof Date ||
        /T\d{2}:\d{2}/.test(raw) ||
        /\d{1,2}:\d{2}/.test(raw) ||
        d.getHours() !== 0 ||
        d.getMinutes() !== 0 ||
        d.getSeconds() !== 0;

    if (!hasExplicitTime) {
        return d.toLocaleDateString("es-CO", {
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: TZ_COLOMBIA,
        });
    }

    return d.toLocaleString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: TZ_COLOMBIA,
    });
};

/**
 * Plazo en meses calendario entre fecha de acta de inicio y fecha final.
 * Si el día final es igual o posterior al día de inicio, cuenta el mes de cierre completo.
 */
export function calculatePlazoMeses(
    fechaActaInicio: string,
    fechaFinal: string
): number | null {
    const start = parseToDate(fechaActaInicio);
    const end = parseToDate(fechaFinal);
    if (!start || !end || end < start) return null;

    let months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());

    if (end.getDate() >= start.getDate()) {
        months += 1;
    }

    return Math.max(1, months);
}
