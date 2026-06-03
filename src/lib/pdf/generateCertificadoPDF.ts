// generateCertificadoPDF.ts - Utilidad para generar PDF desde HTML
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const generateCertificadoPDF = async (
    elementId: string,
    fileName: string
): Promise<void> => {
    const element = document.getElementById(elementId);

    if (!element) {
        throw new Error(`Elemento con ID "${elementId}" no encontrado`);
    }

    try {
        // Capturar el HTML como imagen con alta calidad
        const canvas = await html2canvas(element, {
            scale: 2, // Mayor calidad
            useCORS: true, // Para imágenes externas
            logging: false,
            backgroundColor: "#ffffff",
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight,
        });

        const imgData = canvas.toDataURL("image/png");

        // Crear PDF en tamaño A4
        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Calcular dimensiones proporcionales
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 5; // Margen superior pequeño

        pdf.addImage(
            imgData,
            "PNG",
            imgX,
            imgY,
            imgWidth * ratio,
            imgHeight * ratio
        );

        // Descargar el PDF
        pdf.save(fileName);
    } catch (error) {
        console.error("Error al generar PDF:", error);
        throw new Error("No se pudo generar el PDF. Intenta nuevamente.");
    }
};
