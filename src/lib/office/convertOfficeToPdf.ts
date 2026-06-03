import "server-only";

import { spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

export type OfficeInputFormat = "docx" | "html";

export type ConvertResult =
    | { ok: true; pdf: Buffer }
    | { ok: false; reason: "soffice_missing" | "soffice_failed"; detail?: string };

const COMMON_LO_PATHS = [
    "/usr/bin/soffice",
    "/usr/bin/libreoffice",
    "/snap/bin/libreoffice",
    "/opt/libreoffice/program/soffice",
];

function libreOfficeCandidates(): string[] {
    const out: string[] = [];
    const push = (p: string) => {
        const t = p.trim();
        if (t && !out.includes(t)) out.push(t);
    };
    push(process.env.LIBREOFFICE_BIN ?? "");
    for (const p of COMMON_LO_PATHS) {
        try {
            if (fs.existsSync(p)) push(p);
        } catch {
            /* ignore */
        }
    }
    push("soffice");
    push("libreoffice");
    return out;
}

/**
 * Convierte DOCX o HTML a PDF con LibreOffice headless.
 */
export function convertOfficeBufferToPdf(
    content: Buffer,
    format: OfficeInputFormat,
    baseName = "document"
): ConvertResult {
    const ext = format === "docx" ? "docx" : "html";
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tramite-pdf-"));
    const inputPath = path.join(tmp, `${baseName}.${ext}`);
    const pdfPath = path.join(tmp, `${baseName}.pdf`);
    fs.writeFileSync(inputPath, content);
    const args = ["--headless", "--convert-to", "pdf", "--outdir", tmp, inputPath];

    let lastDetail = "";
    try {
        for (const lo of libreOfficeCandidates()) {
            const r = spawnSync(lo, args, {
                encoding: "utf-8",
                timeout: 120_000,
            });
            const err = r.error as NodeJS.ErrnoException | undefined;
            if (err?.code === "ENOENT") {
                lastDetail = `No encontrado: ${lo}`;
                continue;
            }
            if (r.status !== 0) {
                lastDetail = (r.stderr || r.stdout || "").slice(0, 500) || `exit ${r.status} (${lo})`;
                continue;
            }
            if (!fs.existsSync(pdfPath)) {
                lastDetail = `No se generó ${baseName}.pdf tras ${lo}`;
                continue;
            }
            const pdf = fs.readFileSync(pdfPath);
            return { ok: true, pdf };
        }
        return { ok: false, reason: "soffice_missing", detail: lastDetail || "LibreOffice no disponible" };
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
}

/** @deprecated Use convertOfficeBufferToPdf */
export function convertDocxBufferToPdf(docx: Buffer): ConvertResult {
    return convertOfficeBufferToPdf(docx, "docx", "informe");
}
