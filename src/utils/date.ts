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
        return parseDateOnlyToUtcNoon(s);
    }
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
}

/** Fecha calendario (YYYY-MM-DD o ISO) a mediodía UTC para evitar desfase en Colombia. */
export function parseDateOnlyToUtcNoon(value: unknown): Date | null {
    if (value == null) return null;
    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) return null;
        return new Date(
            Date.UTC(
                value.getUTCFullYear(),
                value.getUTCMonth(),
                value.getUTCDate(),
                12,
                0,
                0,
                0
            )
        );
    }
    const s = String(value).trim();
    if (!s) return null;
    const datePart = s.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        const [y, m, d] = datePart.split("-").map(Number);
        const parsed = new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    const fallback = new Date(s);
    if (Number.isNaN(fallback.getTime())) return null;
    return new Date(
        Date.UTC(
            fallback.getUTCFullYear(),
            fallback.getUTCMonth(),
            fallback.getUTCDate(),
            12,
            0,
            0,
            0
        )
    );
}

/** Parte calendario YYYY-MM-DD en UTC. */
export function toDateOnlyString(value: unknown): string | null {
    const d = parseDateOnlyToUtcNoon(value);
    if (!d) return null;
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

/** Formato legible sin corrimiento de zona horaria (usa parte UTC de la fecha). */
export function formatDateOnly(value: unknown): string {
    const d = parseDateOnlyToUtcNoon(value);
    if (!d) return "";
    return new Intl.DateTimeFormat("es-CO", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        timeZone: "UTC",
    }).format(d);
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
 * Plazo en meses entre fecha de acta de inicio y fecha final.
 * Redondea la duración al mes más cercano usando un mes contable de 30 días para
 * la fracción del último mes (coherente con el conteo 30/360 de las cuentas de
 * cobro). Un sobrante pequeño no infla el plazo, pero un mes casi completo sí:
 *   - 29-ene → 30-jul = 6 + 1/30  ≈ 6.03 → 6 meses (1 día extra no cuenta)
 *   - 01-ene → 31-jul = 6 + 30/30 = 7.00 → 7 meses (mes final completo)
 *   - 01-ene → 30-jun = 5 + 29/30 ≈ 5.97 → 6 meses (180 días)
 *   - 29-ene → 29-jul = 6 + 0/30  = 6.00 → 6 meses (aniversario exacto)
 */
export function calculatePlazoMeses(
    fechaActaInicio: string,
    fechaFinal: string
): number | null {
    const start = parseToDate(fechaActaInicio);
    const end = parseToDate(fechaFinal);
    if (!start || !end || end < start) return null;

    const monthDiff =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
    const dayDiff = end.getDate() - start.getDate();

    const months = Math.round(monthDiff + dayDiff / 30);

    return Math.max(1, months);
}
