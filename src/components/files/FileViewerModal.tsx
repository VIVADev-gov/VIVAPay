"use client";

import { useEffect, useState } from "react";
import { Download, File, Image as ImageIcon, FileText, Loader2, AlertCircle } from "lucide-react";
import Modal from "@/components/modals/Modal";
import ActionButton from "@/components/buttons/ActionButton";

/**
 * Extrae etiqueta legible desde una URL de soporte RP.
 * Ej: /api/uploads/rp/rp-1770761017705-....pdf (o legado /uploads/rp/...) → "rp-1770761017705"
 */
export function getRpSoporteDisplayName(urlOrPath: string): string {
    const path = urlOrPath.split("?")[0];
    const match = path.match(/rp-(\d+)/i);
    if (match) return `rp-${match[1]}`;
    const parts = path.split("/");
    const last = parts[parts.length - 1] || "";
    const withoutExt = last.replace(/\.(pdf|jpg|jpeg|png|gif|webp)$/i, "");
    return withoutExt || "Soporte";
}

interface FileViewerModalProps {
    url: string | null;
    isOpen: boolean;
    onClose: () => void;
    /** Etiqueta a mostrar (ej. "rp-1770761017705"). Si no se pasa, se deduce del nombre en la URL */
    displayName?: string;
}

export default function FileViewerModal({
    url,
    isOpen,
    onClose,
    displayName,
}: FileViewerModalProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fileType, setFileType] = useState<"image" | "pdf" | "unknown">("unknown");

    useEffect(() => {
        if (!url) {
            setFileType("unknown");
            setLoading(false);
            return;
        }

        const urlLower = url.toLowerCase();
        if (urlLower.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/)) {
            setFileType("image");
        } else if (urlLower.match(/\.pdf$/) || urlLower.includes("application/pdf")) {
            setFileType("pdf");
        } else {
            setFileType("unknown");
        }

        setLoading(false);
        setError(null);
    }, [url]);

    const handleImageError = () => {
        setError("Error al cargar la imagen");
        setLoading(false);
    };

    const handlePdfError = () => {
        setError("Error al cargar el PDF");
        setLoading(false);
    };

    const handleDownload = () => {
        if (!url) return;
        const link = document.createElement("a");
        link.href = url;
        link.download = resolvedDisplayName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const resolvedDisplayName =
        displayName ?? (url ? getRpSoporteDisplayName(url) : "Archivo");

    const getFileIcon = () => {
        switch (fileType) {
            case "image":
                return <ImageIcon className="w-6 h-6 text-primary" />;
            case "pdf":
                return <FileText className="w-6 h-6 text-primary" />;
            default:
                return <File className="w-6 h-6 text-primary" />;
        }
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={resolvedDisplayName}
            tamaño="fullscreen"
            canClose={true}
        >
            <div className="flex flex-col h-full min-h-[90dvh]">
                <div className="flex-1 overflow-auto mt-4 bg-muted/30 rounded-xl p-4 min-h-[60vh]">
                    {!url && (
                        <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
                            <File className="w-12 h-12 mb-4 opacity-50" />
                            <p>No hay archivo para visualizar.</p>
                        </div>
                    )}

                    {url && loading && (
                        <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
                            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                            <p>Cargando archivo...</p>
                        </div>
                    )}

                    {url && error && (
                        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-8 h-8 text-destructive" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                Error al cargar el archivo
                            </h3>
                            <p className="text-muted-foreground mb-4">{error}</p>
                            <ActionButton
                                type="button"
                                variant="primary"
                                icon={Download}
                                label="Intentar descargar"
                                onClick={handleDownload}
                            />
                        </div>
                    )}

                    {url && !loading && !error && (
                        <>
                            {fileType === "image" && (
                                <div className="flex items-center justify-center min-h-[400px]">
                                    <img
                                        src={url}
                                        alt={resolvedDisplayName}
                                        onError={handleImageError}
                                        onLoad={() => setLoading(false)}
                                        className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg border border-border"
                                    />
                                </div>
                            )}

                            {fileType === "pdf" && (
                                <div className="flex items-center justify-center min-h-[82dvh] w-full">
                                    <iframe
                                        src={url}
                                        onLoad={() => setLoading(false)}
                                        className="w-full h-[75vh] rounded-lg shadow-lg bg-background border border-border"
                                        title={resolvedDisplayName}
                                    />
                                </div>
                            )}

                            {fileType === "unknown" && (
                                <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                        {getFileIcon()}
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">
                                        Tipo de archivo no soportado para vista previa
                                    </h3>
                                    <p className="text-muted-foreground mb-4">
                                        Puede descargar el archivo para abrirlo en su dispositivo.
                                    </p>
                                    <ActionButton
                                        type="button"
                                        variant="primary"
                                        icon={Download}
                                        label="Descargar archivo"
                                        onClick={handleDownload}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Modal>
    );
}
