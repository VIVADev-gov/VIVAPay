// PDF GDP-FO-02: márgenes como el Word de referencia; cabecera y pie en cada página.
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { GDP02_PDF_SECTION_GAP_MM, GDP02_WORD_PAGE_MARGINS_MM } from "./gdp02WordMargins";

function waitForImages(root: HTMLElement): Promise<void> {
    const imgs = Array.from(root.querySelectorAll("img"));
    return Promise.all(
        imgs.map((img) => {
            if (img.complete && img.naturalHeight > 0) return Promise.resolve();
            return new Promise<void>((resolve) => {
                const done = () => resolve();
                img.addEventListener("load", done, { once: true });
                img.addEventListener("error", done, { once: true });
            });
        })
    ).then(() => undefined);
}

async function resolvePrintRoot(elementId: string): Promise<HTMLElement> {
    for (let i = 0; i < 30; i++) {
        const el = document.getElementById(elementId) as HTMLElement | null;
        if (el?.isConnected) {
            return el;
        }
        await new Promise<void>((r) => requestAnimationFrame(() => r()));
    }
    const el = document.getElementById(elementId) as HTMLElement | null;
    if (!el) {
        throw new Error(`Elemento con ID "${elementId}" no encontrado`);
    }
    return el;
}

const H2C_SCALE = 2;

async function captureRegion(el: HTMLElement): Promise<HTMLCanvasElement> {
    await waitForImages(el);
    return html2canvas(el, {
        scale: H2C_SCALE,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: el.scrollWidth,
        height: el.scrollHeight,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
        scrollX: 0,
        scrollY: 0,
    });
}

function sliceCanvasVertical(source: HTMLCanvasElement, offsetY: number, sliceH: number): HTMLCanvasElement {
    const h = Math.max(1, Math.min(sliceH, source.height - offsetY));
    const out = document.createElement("canvas");
    out.width = source.width;
    out.height = h;
    const ctx = out.getContext("2d");
    if (!ctx) {
        return out;
    }
    ctx.drawImage(source, 0, offsetY, source.width, h, 0, 0, source.width, h);
    return out;
}

function canvasToMmHeight(canvas: HTMLCanvasElement, widthMm: number): number {
    return (canvas.height / canvas.width) * widthMm;
}

/**
 * PDF multipágina: cabecera y pie (imagen + código de formato) en **cada** hoja;
 * el cuerpo se reparte en franjas. Márgenes según Word de referencia.
 */
export async function generateInformeSupervisionPdfFromHtml(
    elementId: string,
    fileName: string
): Promise<void> {
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    const root = await resolvePrintRoot(elementId);
    await waitForImages(root);

    const headerEl = root.querySelector<HTMLElement>('[data-gdp02-print="header"]');
    const bodyEl = root.querySelector<HTMLElement>('[data-gdp02-print="body"]');
    const footerEl = root.querySelector<HTMLElement>('[data-gdp02-print="footer"]');

    if (!headerEl || !bodyEl || !footerEl) {
        await generateLegacySingleCanvasPdf(root, fileName);
        return;
    }

    const [canvasH, canvasB, canvasF] = await Promise.all([
        captureRegion(headerEl),
        captureRegion(bodyEl),
        captureRegion(footerEl),
    ]);

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const m = GDP02_WORD_PAGE_MARGINS_MM;
    const gap = GDP02_PDF_SECTION_GAP_MM;

    const contentX = m.left;
    const contentW = pageW - m.left - m.right;

    const headerMm = canvasToMmHeight(canvasH, contentW);
    const footerMm = canvasToMmHeight(canvasF, contentW);

    const bodySlotMm = pageH - m.top - headerMm - gap - footerMm - m.bottom;
    if (bodySlotMm < 8) {
        throw new Error("Cabecera o pie demasiado altos para una página A4 con los márgenes del Word.");
    }

    const slicePxBody = Math.max(1, Math.floor((bodySlotMm / contentW) * canvasB.width));
    let offsetY = 0;
    let page = 0;

    while (offsetY < canvasB.height) {
        const remaining = canvasB.height - offsetY;
        if (remaining <= 0) {
            break;
        }
        const sliceH = Math.min(slicePxBody, remaining);
        if (sliceH <= 0) {
            break;
        }

        if (page > 0) {
            pdf.addPage();
        }
        page++;

        const slice = sliceCanvasVertical(canvasB, offsetY, sliceH);
        const sliceMmH = canvasToMmHeight(slice, contentW);

        const headerY = m.top;
        pdf.addImage(canvasH.toDataURL("image/png"), "PNG", contentX, headerY, contentW, headerMm);

        const bodyY = m.top + headerMm + gap;
        pdf.addImage(slice.toDataURL("image/png"), "PNG", contentX, bodyY, contentW, sliceMmH);

        const footerY = pageH - m.bottom - footerMm;
        pdf.addImage(canvasF.toDataURL("image/png"), "PNG", contentX, footerY, contentW, footerMm);

        offsetY += sliceH;
    }

    if (page === 0) {
        pdf.addImage(canvasH.toDataURL("image/png"), "PNG", contentX, m.top, contentW, headerMm);
        const footerY = pageH - m.bottom - footerMm;
        pdf.addImage(canvasF.toDataURL("image/png"), "PNG", contentX, footerY, contentW, footerMm);
    }

    pdf.save(fileName);
}

/** Respaldo si el HTML no trae regiones data-gdp02-print (versiones antiguas). */
async function generateLegacySingleCanvasPdf(root: HTMLElement, fileName: string): Promise<void> {
    const canvas = await html2canvas(root, {
        scale: H2C_SCALE,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: root.scrollWidth,
        height: root.scrollHeight,
        windowWidth: root.scrollWidth,
        windowHeight: root.scrollHeight,
        scrollX: 0,
        scrollY: 0,
    });

    const m = GDP02_WORD_PAGE_MARGINS_MM;
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const contentW = pageW - m.left - m.right;
    const contentH = pageH - m.top - m.bottom;

    const imgWidth = contentW;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", m.left, m.top + position, imgWidth, imgHeight);
    heightLeft -= contentH;

    while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", m.left, m.top + position, imgWidth, imgHeight);
        heightLeft -= contentH;
    }

    pdf.save(fileName);
}
