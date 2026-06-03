/**
 * Utilidades globales para manejar notificaciones del navegador y permisos
 */

/**
 * Solicita permiso para mostrar notificaciones del navegador
 * Se debe llamar una vez al cargar la aplicación
 */
export const solicitarPermisoNotificaciones = () => {
    if (typeof window === "undefined") return;

    // Solicitar permiso permanente para notificaciones
    if ("Notification" in window && "permissions" in navigator) {
        navigator.permissions.query({ name: "notifications" }).then((result) => {
            // Si el permiso aún no está "granted", lo solicitamos
            if (result.state !== "granted") {
                Notification.requestPermission().then((perm) => {
                    if (perm === "granted") {
                        console.log("✅ Permiso de notificaciones otorgado");
                    } else if (perm === "denied") {
                        console.log("⚠️ Permiso de notificaciones denegado. Cambia la configuración del navegador para habilitarlo.");
                    }
                });
            }
        }).catch(() => {
            // Fallback si navigator.permissions no está disponible
            if (Notification.permission === "default") {
                Notification.requestPermission();
            }
        });
    }
}

/**
 * Muestra una notificación del navegador y reproduce un sonido
 * @param {string} titulo - Título de la notificación
 * @param {string} mensaje - Mensaje de la notificación
 * @param {string|number} pedidoId - ID del pedido (opcional, para evitar duplicados)
 * @param {string} soundPath - Ruta del archivo de sonido (opcional, por defecto "/notificacion.mp3")
 * @param {string} iconPath - Ruta del icono (opcional, por defecto "/logoviva.png")
 */
export const mostrarNotificacion = (titulo, mensaje, pedidoId = null, soundPath = "/notificacion.mp3", iconPath = "/logoviva.png") => {
    // Reproducir sonido
    try {
        const audio = new Audio(soundPath)
        audio.play().catch(error => {
            console.warn("Error al reproducir sonido:", error)
        })
    } catch (error) {
        console.warn("Error al crear audio:", error)
    }

    // Mostrar notificación del navegador
    if ("Notification" in window && Notification.permission === "granted") {
        const notification = new Notification(titulo, {
            body: mensaje,
            icon: iconPath,
            badge: iconPath,
            tag: `pedido-${pedidoId || 'update'}` // Evitar notificaciones duplicadas
        })

        // Cerrar la notificación después de 5 segundos
        setTimeout(() => {
            notification.close()
        }, 5000)
    }
}

