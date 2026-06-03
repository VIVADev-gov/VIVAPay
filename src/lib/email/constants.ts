/**
 * URL base de la aplicación para enlaces en correos.
 * Se toma de la variable de entorno APP_URL; por defecto la URL de producción.
 */
export const APP_URL =
    process.env.APP_URL ?? "https://viva-mat.viva.gov.co";
