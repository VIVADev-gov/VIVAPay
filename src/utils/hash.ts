import bcrypt from "bcryptjs";

const SALT_ROUNDS = process.env.SALT_ROUNDS || 12;

/**
 * Genera el hash de una contraseña en texto plano.
 * Usar para almacenar contraseñas de forma segura (ej. al crear usuario).
 */
export async function hashPassword(plainPassword: string): Promise<string> {
    if (!plainPassword || !plainPassword.trim()) {
        throw new Error("La contraseña no puede estar vacía");
    }
    return bcrypt.hash(plainPassword.trim(), SALT_ROUNDS);
}

/**
 * Verifica si una contraseña en texto plano coincide con el hash almacenado.
 * Usar en login o al validar credenciales.
 */
export async function verifyPassword(
    plainPassword: string,
    hashedPassword: string
): Promise<boolean> {
    if (!plainPassword || !hashedPassword) return false;
    return bcrypt.compare(plainPassword.trim(), hashedPassword);
}
