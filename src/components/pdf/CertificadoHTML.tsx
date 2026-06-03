"use client";

import React from "react";
import type { CertificadoFullData } from "@/app/api/certificado-calificacion/certificado.model";
import VERIFICACION_CREDENTIALS from "@/app/viva/constants/certficado";

interface Props {
    data: CertificadoFullData;
}

const borderColor = "#d4d4d4";
const mutedBg = "#f5f5f5";

export const CertificadoHTML = React.forwardRef<HTMLDivElement, Props>(
    ({ data }, ref) => {
        const { certificado, orden, materiales } = data;

        const prontitudLabel =
            (certificado.calificacion_entrega ?? 0) >= 4
                ? "Bueno (0-15 días)"
                : (certificado.calificacion_entrega ?? 0) >= 3
                    ? "Regular (16-29 días)"
                    : "Malo (Más de 30 días)";

        const calificacionMaterial =
            (certificado.calificacion_material ?? 0) >= 4
                ? "Bueno (100-90%)"
                : (certificado.calificacion_material ?? 0) >= 3
                    ? "Regular (89-70%)"
                    : "Malo (69-0%)";

        const calificacionAtencion =
            (certificado.calificacion_atencion_recibida ?? 0) >= 4
                ? "Bueno"
                : (certificado.calificacion_atencion_recibida ?? 0) >= 3
                    ? "Regular"
                    : "Malo";

        const verificadoViva = Boolean(certificado.fecha_verificacion || certificado.isverificado);

        return (
            <div
                ref={ref}
                style={{
                    fontFamily: "Arial, sans-serif",
                    lineHeight: "1.6",
                    color: "#333",
                    maxWidth: "850px",
                    margin: "20px auto",
                    padding: "24px",
                    paddingBottom: "10px",
                    border: `1px solid ${borderColor}`,
                    backgroundColor: "#fff",
                    borderRadius: "12px",
                }}
            >
                {/* Header: logo centrado + título a la derecha (igual que modal) */}
                <header
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingBottom: "16px",
                        marginBottom: "0",
                        borderBottom: `1px solid ${borderColor}`,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: "1 1 auto" }}>
                        <img
                            src="/logoviva.png"
                            alt="VIVA - Empresa de Vivienda"
                            style={{ height: "80px", width: "auto", objectFit: "contain" }}
                        />
                    </div>
                    <h1
                        style={{
                            fontSize: "1.125rem",
                            fontWeight: "bold",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            margin: 0,
                            textAlign: "right",
                        }}
                    >
                        Certificado de recibo de materiales
                    </h1>
                </header>

                {/* Bloque de datos: grid 2 columnas, mismo orden que modal */}
                <section
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "8px 24px",
                        marginTop: "40px",
                        marginBottom: "0",
                        fontSize: "0.875rem",
                    }}
                >
                    <div style={{ display: "flex", gap: "8px" }}>
                        <span style={{ fontWeight: "600", textTransform: "uppercase" }}>Municipio:</span>
                        <span>{orden.nombre_municipio || "N/A"}</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <span style={{ fontWeight: "600", textTransform: "uppercase" }}>Convenio:</span>
                        <span>{orden.cod_convenio ?? "—"}</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <span style={{ fontWeight: "600", textTransform: "uppercase" }}>Proveedor:</span>
                        <span>{orden.nombre_proveedor || "N/A"}</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <span style={{ fontWeight: "600", textTransform: "uppercase" }}>Fecha de recibo:</span>
                        <span>{new Date(certificado.fecha_calificacion).toLocaleDateString("es-CO")}</span>
                    </div>
                </section>

                {/* SE CERTIFICA QUE: título + párrafo centrados con gap */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "40px", marginBottom: "40px" }}>
                    <h2 style={{ textAlign: "center", textTransform: "uppercase", margin: 0, fontSize: "1.125rem", fontWeight: "bold" }}>
                        SE CERTIFICA QUE:
                    </h2>
                    <p style={{ textAlign: "center", margin: 0, color: "#666" }}>
                        Fue recibido a satisfacción, tanto en cantidad como calidad, el siguiente material:
                    </p>
                </div>

                {/* Tabla de materiales: bordes y cabecera como modal */}
                <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${borderColor}` }}>
                    <thead>
                        <tr style={{ backgroundColor: mutedBg }}>
                            <th style={{ border: `1px solid ${borderColor}`, padding: "8px", textAlign: "left", fontWeight: "600" }}>REMISIÓN No.</th>
                            <th style={{ border: `1px solid ${borderColor}`, padding: "8px", textAlign: "left", fontWeight: "600" }}>ARTÍCULO</th>
                            <th style={{ border: `1px solid ${borderColor}`, padding: "8px", textAlign: "left", fontWeight: "600" }}>UNIDAD</th>
                            <th style={{ border: `1px solid ${borderColor}`, padding: "8px", textAlign: "left", fontWeight: "600" }}>CANTIDAD</th>
                        </tr>
                    </thead>
                    <tbody>
                        {materiales.map((mat, idx) => (
                            <tr key={idx}>
                                <td style={{ border: `1px solid ${borderColor}`, padding: "8px" }}>{mat.remision || "N/A"}</td>
                                <td style={{ border: `1px solid ${borderColor}`, padding: "8px" }}>{mat.nombre_producto || mat.cod_producto}</td>
                                <td style={{ border: `1px solid ${borderColor}`, padding: "8px" }}>{mat.unidad_medida}</td>
                                <td style={{ border: `1px solid ${borderColor}`, padding: "8px" }}>{mat.cantidad}</td>
                            </tr>
                        ))}
                        {Array.from({ length: Math.max(0, 3 - materiales.length) }).map((_, idx) => (
                            <tr key={`empty-${idx}`}>
                                <td style={{ border: `1px solid ${borderColor}`, padding: "8px" }}>&nbsp;</td>
                                <td style={{ border: `1px solid ${borderColor}`, padding: "8px" }}>&nbsp;</td>
                                <td style={{ border: `1px solid ${borderColor}`, padding: "8px" }}>&nbsp;</td>
                                <td style={{ border: `1px solid ${borderColor}`, padding: "8px" }}>&nbsp;</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Observaciones */}
                <section style={{ borderTop: `2px solid ${borderColor}`, paddingTop: "16px", marginTop: "40px" }}>
                    <p style={{ margin: 0 }}>
                        <strong>OBSERVACIONES:</strong> {certificado.observaciones_verificacion || "Ninguna"}
                    </p>
                </section>

                {/* CALIFICACIÓN PROVEEDOR: título centrado, uppercase, más grande */}
                <section style={{ borderTop: `2px solid ${borderColor}`, paddingTop: "16px", marginTop: "40px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "600", textAlign: "center", textTransform: "uppercase" }}>
                        CALIFICACIÓN PROVEEDOR
                    </h3>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        <li style={{ marginBottom: "8px" }}><strong>CALIDAD DEL MATERIAL:</strong> {calificacionMaterial}</li>
                        <li style={{ marginBottom: "8px" }}><strong>ATENCIÓN RECIBIDA:</strong> {calificacionAtencion}</li>
                        <li style={{ marginBottom: "8px" }}><strong>PRONTITUD EN LA ENTREGA:</strong> {prontitudLabel}</li>
                    </ul>
                </section>

                {/* VALIDACIÓN: caja con borde, título centrado, dos columnas (datos + firma con línea punteada) */}
                <section
                    style={{
                        marginTop: "32px",
                        border: `2px solid ${borderColor}`,
                        borderRadius: "8px",
                        padding: "20px",
                        backgroundColor: "rgba(0,0,0,0.02)",
                    }}
                >
                    <h3 style={{ margin: "0 0 12px 0", fontSize: "1.125rem", fontWeight: "bold", textAlign: "center", textTransform: "uppercase" }}>
                        VALIDACIÓN
                    </h3>
                    <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", marginTop: "8px" }}>
                        <div style={{ flex: "1 1 50%" }}>
                            <div style={{ marginBottom: "12px" }}>
                                <span style={{ fontWeight: "600" }}>Nombre de quien certifica:</span>
                                <span style={{ marginLeft: "8px", color: "#666" }}>{certificado.nombre_quien_califica || "—"}</span>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                                <div>
                                    <span style={{ fontWeight: "600" }}>Cargo:</span>
                                    <span style={{ marginLeft: "4px", color: "#666" }}>{certificado.cargo_quien_califica || "—"}</span>
                                </div>
                                <div>
                                    <span style={{ fontWeight: "600" }}>Cédula:</span>
                                    <span style={{ marginLeft: "4px", color: "#666" }}>{certificado.cedula_quien_califica ?? "—"}</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "16px" }}>
                            <div>
                                <span style={{ color: "#000" }}>{certificado.firma_quien_califica || "—"}</span>
                            </div>
                            <div style={{ width: "128px", borderBottom: "2px dashed #999", marginTop: "4px" }} />
                            <span style={{ fontSize: "0.75rem", color: "#666", marginTop: "4px", display: "block" }}>Firma y/o sello</span>
                        </div>
                    </div>
                </section>

                {/* Footer VIVA: solo cuando aplica (verificación) */}
                <footer
                    style={{
                        marginTop: "40px",
                        borderTop: `2px solid ${borderColor}`,
                        paddingTop: "28px",
                        background: "#fafafd",
                        borderRadius: "0 0 12px 12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "20px"
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "22px",
                            alignItems: "stretch",
                            width: "100%",
                        }}
                    >
                        {/* Sección 1: Verificación VIVA en columna */}
                        <section
                            style={{
                                background: "white",
                                border: "1.5px solid #222",
                                borderRadius: "10px",
                                padding: "19px 20px 18px 20px",
                                margin: 0,
                                display: "flex",
                                flexDirection: "column",
                                gap: "14px",
                                boxShadow: "0 1px 10px 1px #f2f2f2",
                                width: "100%"
                            }}
                        >
                            <p style={{
                                fontSize: "1.08em",
                                fontWeight: 'bold',
                                margin: 0,
                                color: "#151515",
                                textAlign: "center",
                                textTransform: "uppercase",
                                lineHeight: 1.3
                            }}>
                                VERIFICACIÓN DE LA EMPRESA DE VIVIENDA DE ANTIOQUIA – VIVA
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
                                <div>
                                    <span style={{ fontWeight: 600, fontSize: "1.2em", color: "#111" }}>Nombre</span>
                                    <span style={{ marginLeft: 10, color: "#2a2a2a", fontWeight: 400, fontSize: "1em" }}>{VERIFICACION_CREDENTIALS.nombre || "—"}</span>
                                </div>
                                <div>
                                    <span style={{ fontWeight: 600, fontSize: "1.2em", color: "#111" }}>Cargo</span>
                                    <span style={{ marginLeft: 10, color: "#2a2a2a", fontWeight: 400, fontSize: "1em" }}>{VERIFICACION_CREDENTIALS.cargo || "—"}</span>
                                </div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "16px" }}>
                                {verificadoViva ? (
                                    <img
                                        src={VERIFICACION_CREDENTIALS.firmaImagenSrc}
                                        alt={`Firma ${VERIFICACION_CREDENTIALS.nombre}`}
                                        style={{
                                            maxHeight: "72px",
                                            width: "auto",
                                            objectFit: "contain",
                                        }}
                                    />
                                ) : (
                                    <div>
                                        <span style={{ color: "#666", fontWeight: 400 }}>Pendiente de verificación</span>
                                    </div>
                                )}
                                <div style={{ width: "128px", borderBottom: "2px dashed #222", marginTop: "7px" }} />
                                <span
                                    style={{
                                        fontSize: "0.77rem",
                                        color: "#232323",
                                        marginTop: "4px",
                                        display: "block",
                                        fontWeight: 470,
                                        letterSpacing: 0.1,
                                    }}
                                >
                                    Firma y/o sello
                                </span>
                            </div>
                        </section>

                        {/* Sección 2: Orden y envío en columna */}
                        <section
                            style={{
                                background: "#fcfdff",
                                border: "1.2px solid #999",
                                borderRadius: "10px",
                                padding: "15px 18px",
                                marginBottom: "10px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "10px",
                                width: "100%"
                            }}
                        >
                            <div style={{ fontWeight: 700, fontSize: "1em", color: "#171717", marginBottom: "3px", letterSpacing: 0.1 }}>
                                Información de la orden y el envío
                            </div>
                            <div style={{ color: "#222", fontWeight: 600, fontSize: "0.98em", marginBottom: "1px" }}>
                                <span>Orden: </span>
                                <span style={{ color: "#444", fontWeight: 400 }}>{orden.codigo_orden}</span>
                            </div>
                            <div style={{ color: "#222", fontWeight: 600, fontSize: "0.98em", marginBottom: "1px" }}>
                                <span>Envío: </span>
                                <span style={{ color: "#444", fontWeight: 400 }}>#{(data as { posicion_envio?: number }).posicion_envio ?? data.certificado.id_envio}</span>
                            </div>
                            {certificado.fecha_verificacion && certificado.observaciones_verificacion && (
                                <div style={{
                                    fontSize: "0.96em",
                                    color: "#e67b19",
                                    fontWeight: 560,
                                    marginTop: "7px",
                                    background: "#fcf6ec",
                                    border: "1px solid #ffe4bc",
                                    borderRadius: "6px",
                                    padding: "6px 11px",
                                    display: "block"
                                }}>
                                    <span>Observaciones:</span>
                                    <span style={{ fontWeight: 400, color: "#B37827", marginLeft: 8 }}>{certificado.observaciones_verificacion}</span>
                                </div>
                            )}
                        </section>
                    </div>
                    <div style={{ display: "flex", gap: "5px", justifyContent: "space-between", paddingBottom: "20px" }}>
                        <p style={{
                            fontSize: "0.7em",
                            color: "#111111",
                            margin: 0,
                            textAlign: "right",
                            fontWeight: 380,
                            letterSpacing: 0.1,
                            opacity: 0.70,
                        }}>
                            Generado el: {new Date().toLocaleString("es-CO")}
                        </p>
                        <p style={{
                            fontSize: "0.7em",
                            color: "#111111",
                            margin: 0,
                            textAlign: "right",
                            fontWeight: 380,
                            letterSpacing: 0.1,
                            opacity: 0.70,
                        }}>Código: ABM-FO-05 <span style={{ fontWeight: 600, display: "block", marginTop: "1px" }}>Version:10</span>
                        </p>
                    </div>
                </footer>
            </div>
        );
    }
);

CertificadoHTML.displayName = "CertificadoHTML";
