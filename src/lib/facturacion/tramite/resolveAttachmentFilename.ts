/** Normaliza un segmento de nombre de archivo (MAYÚSCULAS, sin caracteres inválidos). */
export function sanitizeFilenamePart(value: string): string {
    return value
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9._-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

/** Nombre de adjunto PDF en MAYÚSCULAS. */
export function formatPdfFilename(base: string, suffix?: string): string {
    const cleanBase = sanitizeFilenamePart(base);
    if (!suffix) return `${cleanBase}.PDF`;
    const cleanSuffix = sanitizeFilenamePart(suffix);
    return `${cleanBase}-${cleanSuffix}.PDF`;
}

/**
 * Asigna nombres únicos; si hay colisión añade -2, -3, …
 */
export function dedupeFilenames(
    entries: Array<{ docKey: string; baseName: string; suffix?: string }>
): Map<string, string> {
    const used = new Map<string, number>();
    const out = new Map<string, string>();

    for (const e of entries) {
        let candidate = formatPdfFilename(e.baseName, e.suffix);
        const count = used.get(candidate) ?? 0;
        if (count > 0) {
            const ext = ".PDF";
            const stem = candidate.slice(0, -ext.length);
            candidate = `${stem}-${count + 1}${ext}`;
        }
        used.set(formatPdfFilename(e.baseName, e.suffix), count + 1);
        out.set(e.docKey, candidate);
    }

    return out;
}
